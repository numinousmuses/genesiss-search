/* eslint-disable */
// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { dynamoDB } from '@/lib/dynamo';
import { hashPassword, hashEmail } from '@/lib/utils';
import { UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Resource } from 'sst';

export async function POST(req: NextRequest) {
  const { password, token, userId } = await req.json();

  if (!token || !userId) {
    return NextResponse.json({ message: 'Invalid or missing token/userId' }, { status: 400 });
  }

  try {
    // Find the user by reset token and userId
    const result = await dynamoDB.send(new QueryCommand({
      TableName: Resource.FinalUsersTable.name,
      KeyConditionExpression: 'userID = :userId and resetToken = :resetToken',
      ExpressionAttributeValues: {
        ':userId': { S: userId },
        ':resetToken': { S: token },
      },
    }));

    if (!result.Items || result.Items.length === 0) {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
    }

    const user = result.Items[0];
    const newPasswordHash = hashPassword(password);

    // Update the user's password and remove the reset token
    await dynamoDB.send(new UpdateCommand({
      TableName: Resource.FinalUsersTable.name,
      Key: { userID: user.userID.S, email: user.email.S },
      UpdateExpression: 'SET passwordHash = :passwordHash REMOVE resetToken',
      ExpressionAttributeValues: {
        ':passwordHash': { S: newPasswordHash },
      },
    }));

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ message: 'Error resetting password', error }, { status: 500 });
  }
}
