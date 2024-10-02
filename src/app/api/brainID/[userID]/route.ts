import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Resource } from 'sst';

// Initialize DynamoDB Client
const dynamoDbClient = new DynamoDBClient({ region: 'us-east-1' });
const documentClient = DynamoDBDocumentClient.from(dynamoDbClient);

// Handler for GET request to fetch brainIDs
export async function GET(request: NextRequest) {
  try {
    // Extract userID from the request URL
    const url = new URL(request.url);
    const userID = url.pathname.split('/').pop();

    if (!userID) {
      return NextResponse.json({ message: 'Invalid or missing userID' }, { status: 400 });
    }

    // Fetch the brainIDs for the given userID from DynamoDB
    const command = new QueryCommand({
      TableName: Resource.ChatsTable.name, // Replace with your actual DynamoDB table name
      IndexName: 'CreatedAtIndex', // Replace with your actual GSI name if necessary
      KeyConditionExpression: 'userID = :userID',
      ExpressionAttributeValues: {
        ':userID': userID,
      },
      ProjectionExpression: 'brainID', // Only retrieve brainIDs
    });

    const response = await documentClient.send(command);
    console.log('DynamoDB response:', response);

    // Extract brainIDs from the DynamoDB response
    const brainIDs = response.Items?.map((item) => item.brainID).filter((brainID) => brainID) || [];

    return NextResponse.json(brainIDs, { status: 200 });
  } catch (error) {
    console.error('Error fetching brainIDs:', error);
    return NextResponse.json({ message: 'Failed to fetch brainIDs' }, { status: 500 });
  }
}
