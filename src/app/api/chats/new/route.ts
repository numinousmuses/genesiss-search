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

interface ChatRequest {
  ak: string; // API key
  message: string;
  internet: boolean;
  format: 'json' | 'markdown' | 'text';
  chatID?: string;
  brainID?: string[]; // Optional memory IDs (additional brains)
  images?: string[]; // Optional array of base64-encoded images
  documents?: string[]; // Optional array of base64-encoded documents
}

interface ChatResponse {
  chatID: string;
  message: string;
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
      Bucket: Resource.GenesissAgentsBucket.name, // Your S3 bucket name
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
      Bucket: Resource.GenesissAgentsBucket.name, // Your S3 bucket name
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

// Helper function to read files and convert them to Base64
const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// Helper function to call the external chat API
const sendMessageToChatAPI = async (
  message: string,
  chatID: string,
  brainID?: string[],
  base64Images?: string[],
  base64Documents?: string[]
): Promise<ChatResponse> => {
  try {
    const apiUrl = "https://genesiss.tech/api/chat";
    const apiKey = Resource.GenesissAgentsAPIKey.value; // Replace with the actual API key

    const chatRequest: ChatRequest = {
      ak: apiKey,
      message: message,
      internet: true, // Arbitrary input, you can change this based on your needs
      format: 'markdown',
      chatID: chatID,
      brainID: brainID,
      images: base64Images,
      documents: base64Documents,
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatRequest),
    });

    if (!response.ok) {
      throw new Error("Error sending message to chat API");
    }

    const finalResponse = await response.json() as ChatResponse;
    return finalResponse;
  } catch (error) {
    console.error("Error calling the external chat API:", error);
    throw new Error("Failed to send message to external chat API");
  }
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body to get chatID, userMessage, files, and other data
    const formData = await request.formData();
    const chatID = formData.get('chatID') as string;
    const userMessage = JSON.parse(formData.get('userMessage') as string) as Message;
    const files = formData.getAll('files') as File[]; // Get all file inputs
    let brainID = chatID;
    const teamID = formData.get('teamID') as string | undefined;

    if (!chatID || !userMessage || !userMessage.message || !userMessage.author) {
      return NextResponse.json({ message: "Invalid input" }, { status: 400 });
    }

    if (teamID) {
      brainID = `${brainID} - ${teamID}`;
    }

    // Step 1: Retrieve the existing chat object from S3
    let chatObject = await getChatFromS3(chatID);

    if (!chatObject) {
      chatObject = { messages: [userMessage] };
    } else {
      // Step 2: Append the new message to the existing chat object
      chatObject.messages.push(userMessage);
    }

    // Process files to Base64
    const base64Images: string[] = [];
    const base64Documents: string[] = [];

    for (const file of files) {
      const base64String = await fileToBase64(file);
      // Sort files by type: images and documents
      if (file.type.startsWith('image/')) {
        base64Images.push(base64String);
      } else {
        base64Documents.push(base64String);
      }
    }

    // Step 3: Send the message to the external API along with the files (if any) and get the response
    const apiResponse = await sendMessageToChatAPI(userMessage.message, chatID, [brainID], base64Images, base64Documents);

    // Step 4: Append the API response message to the chat object
    chatObject.messages.push({
      message: apiResponse.message,
      author: "system", // Assume the response is from the system or AI
    });

    // Step 5: Store the updated chat object back in S3
    await uploadChatToS3(chatID, chatObject);

    // Step 6: Return a success response
    return NextResponse.json({ message: "Message sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error processing chat update:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
