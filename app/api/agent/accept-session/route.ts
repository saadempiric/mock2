import { NextResponse } from "next/server";
import Chat from "../../../models/Chat";
import { pusherServer } from "../../../lib/pusher";

export async function POST(req: Request) {
  try {
    const { sessionId, agentName } = await req.json();

    // Update chat session status
    await Chat.update({ status: "agent_handling" }, { where: { sessionId } });

    // Create a system message in the database about agent joining
    await Chat.create({
      sessionId,
      userMessage: null,
      botResponse: `${agentName} has joined the conversation and will assist you.`,
      status: "agent_handling",
    });

    // Notify the user that an agent has joined
    await pusherServer.trigger(`chat-${sessionId}`, "handoff-completed", {
      agentName,
      timestamp: new Date(),
    });

    // Also send a welcome message from the agent
    await pusherServer.trigger(`chat-${sessionId}`, "agent-message", {
      message: `Hello! I'm ${agentName} and I'll be helping you today. How can I assist you?`,
      agentName,
      timestamp: new Date(),
    });

    // Add to general message stream for monitoring
    await pusherServer.trigger(`chat-${sessionId}`, "new-message", {
      role: "agent",
      content: `Hello! I'm ${agentName} and I'll be helping you today. How can I assist you?`,
      timestamp: new Date(),
    });

    // Notify all agents that this session has been claimed
    await pusherServer.trigger("agent-dashboard", "session-claimed", {
      sessionId,
      agentName,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error accepting session:", error);
    return NextResponse.json(
      { error: "Failed to accept session" },
      { status: 500 }
    );
  }
}
