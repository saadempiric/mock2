import { NextResponse } from "next/server";
import Chat from "../../../models/Chat";
import { pusherServer } from "../../../lib/pusher";

export async function POST(req: Request) {
  try {
    const { sessionId, message, agentName } = await req.json();

    // Store agent message in database
    await Chat.create({
      sessionId,
      userMessage: null, // This is an agent message, not a user message
      botResponse: message, // We store agent messages in the botResponse field
      status: "agent_handling",
    });

    // Send message to the user
    await pusherServer.trigger(`chat-${sessionId}`, "agent-message", {
      message,
      agentName,
      timestamp: new Date(),
    });

    // Also add to general message stream for monitoring
    // await pusherServer.trigger(`chat-${sessionId}`, "new-message", {
    //   role: "agent",
    //   content: message,
    //   timestamp: new Date(),
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending agent message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
