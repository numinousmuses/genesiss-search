/* eslint-disable */
import { NextRequest, NextResponse } from "next/server";

interface Chat {
    chatID: string,
    chatTitle: string,
    groupID?: string,
    groupTitle?: string,
    teamID?: string
    teamTitle?: string
}

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const userID = url.pathname.split('/').pop(); // Extract userId from the URL

    if (!userID) {
        return NextResponse.json({ message: "Invalid or missing userID" }, { status: 400 });
    }
    return NextResponse.json({ message: "Hello, " + userID }, { status: 200 });
}