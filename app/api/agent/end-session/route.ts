// /app/api/agent/end-session/route.ts
import { NextResponse } from "next/server";
import Chat from "../../../models/Chat";
import { pusherServer } from "../../../lib/pusher";

export async function POST(req: Request) {
  try {
    const { sessionId, agentName } = await req.json();

    // Update chat session status
    await Chat.update({ status: "closed" }, { where: { sessionId } });

    // Create a system message in the database about session being closed
    await Chat.create({
      sessionId,
      userMessage: null,
      botResponse: `${agentName} has ended the conversation. Thank you for using our support service.`,
      status: "closed",
    });

    // Notify the user that the conversation has ended
    await pusherServer.trigger(`chat-${sessionId}`, "new-message", {
      role: "system",
      content: `${agentName} has ended the conversation. Thank you for using our support service.`,
      timestamp: new Date(),
    });

    // Add a specific event for the chat interface to handle the session end
    await pusherServer.trigger(`chat-${sessionId}`, "session-ended", {
      agentName,
      timestamp: new Date(),
    });

    // Notify all agents that this session has been closed
    await pusherServer.trigger("agent-dashboard", "session-closed", {
      sessionId,
      agentName,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error ending session:", error);
    return NextResponse.json(
      { error: "Failed to end session" },
      { status: 500 }
    );
  }
}
