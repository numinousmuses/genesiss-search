import { NextRequest, NextResponse } from "next/server";
import { Resource } from 'sst';

interface WorkflowAgentArray {
    agentID: string;
    inputs: string | string[];
}

interface WorkflowConfiguration {
    title: string;
    description: string;
    frequency: string;
    createdAt: string;
    agents: WorkflowAgentArray[][];
}

export interface Agent {
    agent: string;
    prompt: string;
}

export interface JobRequest {
    ak: string;
    agents: Agent[][];
    schedule: string;
    callbackUrl: string;
    state?: string;
    brainID?: string;
}

export interface CalledAgent {
    agent: string; // The name of the agent executed
    result: string; // The result from executing the agent
}

export interface ExecutedAgents {
    jobID: string; // Identifier for the job
    state?: string; // Optional state value
    brainID?: string; // Optional brainID for memory operations
    agents: CalledAgent[][]; // 2D array of called agents, each sub-array representing a group of agents executed in order
}

export async function POST(request: NextRequest) {
    const data = await request.json() as {userID: string, WorkflowConfiguration: WorkflowConfiguration};

    // Define target URL and API key
    const targetUrl = `https://genesiss.tech/api/jobs/${data.userID}`;
    const apiKey = Resource.GenesissAgentsAPIKey.value; // Ensure you have this set in your environment variables

    // Transform `WorkflowConfiguration` to `JobRequest`
    const jobRequest: JobRequest = {
        ak: apiKey || "",
        agents: data.WorkflowConfiguration.agents.map(row =>
            row.map(agent => ({
                agent: agent.agentID,
                prompt: Array.isArray(agent.inputs) ? agent.inputs.join(" ") : agent.inputs,
            }))
        ),
        schedule: data.WorkflowConfiguration.frequency,
        state: data.userID,
        callbackUrl: "https://agents.genesiss.tech/api/workflows/callback", // Replace with your actual callback URL
    };

    console.log("JobRequest:", jobRequest);

    // Send the transformed request to the target URL
    try {
        const response = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify(jobRequest),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error:", errorText);
            return NextResponse.json({ error: errorText }, { status: response.status });
        }

        const responseData = await response.json();
        console.log("Response Data:", responseData);
        return NextResponse.json("Job request sent successfully", { status: 200 });
    } catch (error) {
        console.error("Error sending job request:", error);
        return NextResponse.json({ error: "Failed to send job request" }, { status: 500 });
    }
}
