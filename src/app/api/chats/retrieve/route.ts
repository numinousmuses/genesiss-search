import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import * as stream from 'stream';
import { Resource } from "sst";

// Define the ChatResponse interface
interface ChatResponse {
    chatTitle: string;
    messages: Message[];
}

interface Message {
    message: string;
    author: string;
}

// Initialize DynamoDB and S3 clients
const s3Client = new S3Client({ region: 'us-east-1' });
const dynamoDbClient = new DynamoDBClient({ region: "us-east-1" });
const documentClient = DynamoDBDocumentClient.from(dynamoDbClient);


// Main POST function to handle the chat retrieval
export async function POST(request: NextRequest) {

    const sampleChats: ChatResponse = {
        chatTitle: "General Discussion",
        messages: [
          {
            message: "Hey everyone, welcome to the chat!",
            author: "genesiss",
          },
          {
            message: "Thank you! Excited to be here.",
            author: "user",
          },
          {
            message: "Let’s get started with the first topic of discussion.",
            author: "genesiss",
          },
          {
            message: "Sure, I’ve been thinking about our next project.",
            author: "user",
          },
          {
            message: "Great! Let's brainstorm some ideas.",
            author: "genesiss",
          },
        ],
      };

      return NextResponse.json(sampleChats, { status: 200 });

    try {
        // Parse the request body to get the userID and chatID
        const { userID, chatID } = await request.json();

        if (!userID || !chatID) {
            return NextResponse.json({ message: "Invalid or missing parameters" }, { status: 400 });
        }

        // Step 1: Fetch chat information from DynamoDB using chatID
        const chatData = await getChatFromDynamoDB(chatID);

        if (!chatData) {
            return NextResponse.json({ message: "Chat not found" }, { status: 404 });
        }

        // Step 2: Check if the user has permission to view the chat (editors or viewers)
        const hasAccess = chatData.viewers.includes(userID) || chatData.editors.includes(userID) || (chatData.editors.length === 0 && chatData.userID === userID);
        if (!hasAccess) {
            return NextResponse.json({ message: "Access denied" }, { status: 403 });
        }

        // Step 3: Retrieve chat messages from S3 using the chatID as the key
        const messages = await getMessagesFromS3(chatID);

        // Step 4: Return the ChatResponse
        const response: ChatResponse = {
            chatTitle: chatData.chatTitle,
            messages,
        };

        return NextResponse.json(response, { status: 200 });
    } catch (error) {
        console.error("Error retrieving chat:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

// Function to retrieve chat data from DynamoDB using chatID
async function getChatFromDynamoDB(chatID: string) {
    try {
        const command = new GetCommand({
            TableName: Resource.ChatsTable.name, // Replace with your DynamoDB table name
            Key: { chatID },
        });

        const { Item } = await documentClient.send(command);
        return Item; // Returns the chat object from DynamoDB
    } catch (error) {
        console.error("Error retrieving chat from DynamoDB:", error);
        return null;
    }
}

// Function to get chat messages from S3 using the chatID as the key
async function getMessagesFromS3(chatID: string): Promise<Message[]> {
    try {
        const command = new GetObjectCommand({
            Bucket: Resource.GenesissSearchBucket.name, // Replace with your S3 bucket name
            Key: chatID, // The S3 key is the same as the chatID
        });
        const response = await s3Client.send(command);

        if (response.Body instanceof stream.Readable) {
            const data = await streamToString(response.Body);
            return JSON.parse(data) as Message[];
        } else {
            throw new Error("Unexpected data type for S3 object body");
        }
    } catch (error) {
        console.error("Error retrieving messages from S3:", error);
        return [];
    }
}

// Helper function to convert stream data to string
export const streamToString = (stream: stream.Readable): Promise<string> =>
    new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on("data", chunk => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    });
