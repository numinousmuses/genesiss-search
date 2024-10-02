import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid'; // For generating unique chat IDs
import { Resource } from 'sst'; // Replace with your SST setup if applicable

// Initialize DynamoDB and S3 Clients
const dynamoDbClient = new DynamoDBClient({ region: "us-east-1" });
const documentClient = DynamoDBDocumentClient.from(dynamoDbClient);
const s3Client = new S3Client({ region: "us-east-1" });

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { userId, chatTitle, brainID, teamID, groupID, viewPermissions, editPermissions } = await request.json();

    // Validate inputs
    if (!userId || !chatTitle.trim()) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    // Generate a new chatID
    const chatID = uuidv4().replace(/-/g, '');
    const timestamp = new Date().toISOString();

    // Step 1: Create a new chat in the Chats table
    const newChatCommand = new PutCommand({
      TableName: Resource.ChatsTable.name, // Replace with your actual chats table name
      Item: {
        chatID,
        chatTitle,
        userID: teamID ? teamID : userId, // If part of a team, use teamID as userID
        editors: editPermissions ? Object.keys(editPermissions) : [], // Handle edit permissions
        viewers: viewPermissions ? Object.keys(viewPermissions) : [], // Handle view permissions
        timestamp,
        brainID: brainID || null,
        chatGroup: groupID || null,
        chatGroupID: groupID || null,
        // chatContent: `s3://${Resource.GenesissSearchBucket.name}/${chatID}` // S3 URL for the chat content
      },
    });

    await documentClient.send(newChatCommand);

    // Step 2: Initialize the chat content in S3 with an empty array of messages
    const initialChatContent = JSON.stringify([]);
    const s3Params = {
      Bucket: Resource.GenesissSearchBucket.name, // Replace with your S3 bucket name
      Key: chatID, // The chatID will be used as the S3 key
      Body: initialChatContent,
      ContentType: "application/json",
    };
    const putObjectCommand = new PutObjectCommand(s3Params);
    await s3Client.send(putObjectCommand);

    console.log("Chat created successfully:", chatID);

    // Step 3: Update the user's chats array in the Users table
    const updateUserChatsCommand = new UpdateCommand({
      TableName: Resource.FinalUsersTable.name, // Replace with your actual users table name
      Key: {
        userID: userId,
      },
      UpdateExpression: "SET chats = list_append(if_not_exists(chats, :emptyList), :newChatID)",
      ExpressionAttributeValues: {
        ":newChatID": [chatID], // Append the new chat ID to the user's chats array
        ":emptyList": [], // Initialize with an empty array if no chats exist
      },
    });

    await documentClient.send(updateUserChatsCommand);

    // Step 4: If part of a team, update the team's chats list
    if (teamID) {
      const updateTeamChatsCommand = new UpdateCommand({
        TableName: Resource.TeamsTable.name, // Replace with your actual teams table name
        Key: {
          teamID: teamID,
        },
        UpdateExpression: "SET chats = list_append(if_not_exists(chats, :emptyList), :newChatID)",
        ExpressionAttributeValues: {
          ":newChatID": [chatID], // Append the new chat ID to the team's chats array
          ":emptyList": [], // Initialize with an empty array if no chats exist
        },
      });

      await documentClient.send(updateTeamChatsCommand);
    }

    // Return success response with the chatID
    return NextResponse.json({ chatID }, { status: 201 });

  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json({ message: "Failed to create chat" }, { status: 500 });
  }
}
