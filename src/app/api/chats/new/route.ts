import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Resource } from "sst";
import * as stream from "stream";

// Initialize the S3 client
const s3Client = new S3Client({ region: "us-east-1" });

interface Message {
  message: string;
  author: string;
}

interface ChatObject {
  messages: Message[];
}

// Helper function to retrieve a string from an S3 object
const streamToString = (stream: stream.Readable): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });

// Helper function to retrieve the chat object from S3
const getChatFromS3 = async (chatID: string): Promise<ChatObject | null> => {
  try {
    const command = new GetObjectCommand({
      Bucket: Resource.GenesissSearchBucket.name, // Your S3 bucket name
      Key: chatID, // The chatID is used as the key
    });

    const response = await s3Client.send(command);
    if (response.Body instanceof stream.Readable) {
      const data = await streamToString(response.Body);
      return JSON.parse(data) as ChatObject;
    } else {
      throw new Error("Unexpected response body type from S3");
    }
  } catch (error) {
    console.error("Error retrieving chat from S3:", error);
    return null;
  }
};

// Helper function to upload the updated chat object back to S3
const uploadChatToS3 = async (chatID: string, updatedChat: ChatObject): Promise<void> => {
  try {
    const command = new PutObjectCommand({
      Bucket: Resource.GenesissSearchBucket.name, // Your S3 bucket name
      Key: chatID,
      Body: JSON.stringify(updatedChat),
      ContentType: "application/json",
    });
    await s3Client.send(command);
  } catch (error) {
    console.error("Error uploading chat to S3:", error);
    throw new Error("Error uploading chat to S3");
  }
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get chatID and userMessage
    const { chatID, userMessage }: { chatID: string; userMessage: Message } = await request.json();

    if (!chatID || !userMessage || !userMessage.message || !userMessage.author) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    // Step 1: Retrieve the existing chat object from S3
    const chatObject = await getChatFromS3(chatID);

    if (!chatObject) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    // Step 2: Append the new message to the existing chat object
    chatObject.messages.push(userMessage);

    // Step 3: Store the updated chat object back in S3
    await uploadChatToS3(chatID, chatObject);

    // Step 4: Return a success response
    return NextResponse.json({ message: "Message sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error processing chat update:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
