// api/chats/update-sharing/route.ts

import { NextRequest, NextResponse } from "next/server";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Resource } from "sst";

// Initialize DynamoDB Client
const dynamoDbClient = new DynamoDBClient({ region: "us-east-1" });
const documentClient = DynamoDBDocumentClient.from(dynamoDbClient);

export async function POST(request: NextRequest) {
  try {
    const { chatID, viewPermissions, editPermissions } = await request.json();

    if (!chatID) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    // Update the view and edit permissions in DynamoDB
    const updateCommand = new UpdateCommand({
      TableName: Resource.ChatsTable.name,
      Key: { chatID },
      UpdateExpression: "SET viewers = :viewers, editors = :editors",
      ExpressionAttributeValues: {
        ":viewers": viewPermissions || [],
        ":editors": editPermissions || [],
      },
    });

    await documentClient.send(updateCommand);

    return NextResponse.json({ message: "Sharing settings updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating sharing settings:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
