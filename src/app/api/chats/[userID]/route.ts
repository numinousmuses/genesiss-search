/* eslint-disable */
import { NextRequest, NextResponse } from "next/server";
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Resource } from "sst";

interface Chat {
    chatID: string,
    chatTitle: string,
    timestamp: string,
    messages: Message[],
    groupID?: string,
    groupTitle?: string,
    teamID?: string,
    teamTitle?: string,
    brainID?: string,
}

interface Message {
    author: string,
    message: string
}

interface DatabaseChat {
    chatTitle: string,
    chatID: string, // primary index, also the S3 key for the chat object
    userID: string, // global secondary index, equals the teamID if team, otherwise is a user's ID
    editors: string[], // if team and empty, whole team can access, if not empty, only editors and admins can edit
    viewers: string[], // same principle as above
    messages: string, //s3 link to an object:  Message[] stored in S3
    timestamp: string,
    chatGroup?: string,
    chatGroupID?: string,
}

interface Team {
    teamID: string;
    teamName: string;
    admins: string[];
    members: string[];
}

// Initialize AWS clients
const dynamoDbClient = new DynamoDBClient({ region: 'us-east-1' });
const documentClient = DynamoDBDocumentClient.from(dynamoDbClient);
const s3Client = new S3Client({ region: 'us-east-1' });

// Helper function to get messages from S3
async function getMessagesFromS3(chatID: string): Promise<Message[]> {
    try {
        const command = new GetObjectCommand({
            Bucket: Resource.GenesissSearchBucket.name, // Replace with your S3 bucket name
            Key: chatID, // Key is the same as chatID
        });
        const response = await s3Client.send(command);

        // Parse the messages from the S3 response
        const messages: Message[] = JSON.parse(await streamToString(response.Body));
        return messages;
    } catch (error) {
        console.error(`Failed to retrieve messages from S3 for chatID ${chatID}`, error);
        return [];
    }
}

// Helper function to convert S3 stream to string
async function streamToString(stream: any): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on("data", (chunk: Buffer | Uint8Array) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks).toString('utf-8')));
        stream.on("error", reject);
    });
}

// Helper function to get chats based on userID or teamIDs
async function getChatsByUserID(userIDs: string[]): Promise<DatabaseChat[]> {
    const chats: DatabaseChat[] = [];
    for (const userID of userIDs) {
        try {
            const command = new QueryCommand({
                TableName: Resource.ChatsTable.name, // Replace with your DynamoDB table name
                IndexName: "CreatedAtIndex", // Replace with your GSI name
                KeyConditionExpression: 'userID = :userID',
                ExpressionAttributeValues: {
                    ':userID': userID,
                },
            });
            const response = await documentClient.send(command);
            if (response.Items) {
                chats.push(...(response.Items as DatabaseChat[]));
            }
        } catch (error) {
            console.error(`Failed to retrieve chats for userID ${userID}`, error);
        }
    }
    return chats;
}

// Helper function to get user's teams from DynamoDB
async function getUserTeams(userID: string): Promise<string[]> {
    try {
        const command = new GetCommand({
            TableName: Resource.FinalUsersTable.name, // Replace with your actual table name
            Key: {
                userID: userID,
            },
        });

        const response = await documentClient.send(command);

        if (response.Item && response.Item.teams) {
            return response.Item.teams;
        } else {
            return [];
        }
    } catch (error) {
        console.error(`Failed to retrieve teams for userID ${userID}`, error);
        return [];
    }
}

// Helper function to get team titles from the teams table
async function getTeamTitles(teamIDs: string[]): Promise<Record<string, string>> {
    const teamTitles: Record<string, string> = {};
    for (const teamID of teamIDs) {
        try {
            const command = new GetCommand({
                TableName: Resource.TeamsTable.name, // Replace with your actual teams table name
                Key: {
                    teamID: teamID,
                },
            });

            const response = await documentClient.send(command);

            if (response.Item) {
                const team = response.Item as Team;
                teamTitles[teamID] = team.teamName;
            }
        } catch (error) {
            console.error(`Failed to retrieve team title for teamID ${teamID}`, error);
        }
    }
    return teamTitles;
}

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const userID = url.pathname.split('/').pop(); // Extract userId from the URL
    if (!userID) {
        return NextResponse.json({ message: "Invalid or missing userID" }, { status: 400 });
    }

    try {
        // Step 1: Get user's teams
        const teamIDs = await getUserTeams(userID);

        // Step 2: Get team titles mapping
        const teamTitles = await getTeamTitles(teamIDs);

        // Step 3: Initialize Chat objects array
        const chats: Chat[] = [];

        // Step 4: Get chats associated with user's teams
        const teamChats = await getChatsByUserID(teamIDs);

        // Step 5: Filter team chats based on editor access
        for (const chat of teamChats) {
            const access = chat.editors.length === 0 || chat.editors.includes(userID);
            if (!access) continue;

            // Retrieve messages from S3
            const messages = await getMessagesFromS3(chat.chatID);

            chats.push({
                chatID: chat.chatID,
                chatTitle: chat.chatTitle,
                timestamp: chat.timestamp,
                messages,
                groupID: chat.chatGroupID,
                groupTitle: chat.chatGroup,
                teamID: chat.userID, // This is the teamID in this context
                teamTitle: teamTitles[chat.userID] || 'Unknown Team', // Use the retrieved title or a fallback
            });
        }

        // Step 6: Get chats associated with the user's ID directly
        const userChats = await getChatsByUserID([userID]);

        // Step 7: Filter user chats based on viewer access
        for (const chat of userChats) {
            if (chat.viewers.length > 0 && !chat.viewers.includes(userID)) continue;

            // Retrieve messages from S3
            const messages = await getMessagesFromS3(chat.chatID);

            chats.push({
                chatID: chat.chatID,
                chatTitle: chat.chatTitle,
                timestamp: chat.timestamp,
                messages,
                groupID: chat.chatGroupID,
                groupTitle: chat.chatGroup,
                teamID: chat.userID === userID ? undefined : chat.userID,
                teamTitle: chat.userID === userID ? undefined : teamTitles[chat.userID] || 'Unknown Team',
            });
        }

        // Return the list of chats
        return NextResponse.json(chats, { status: 200 });
    } catch (error) {
        console.error("Failed to retrieve chats", error);
        console.log("\n\n\n\n\n\n\n\n\n")
        console.log("BIG ERROR")
        console.log(JSON.stringify(error, null, 2))
        console.log("\n\n\n\n\n\n\n\n\n")
        return NextResponse.json({ message: "Failed to retrieve chats" }, { status: 500 });
    }
}
