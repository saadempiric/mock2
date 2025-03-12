import { NextResponse } from "next/server";
import Chat from "../../models/Chat";
import { pusherServer } from "../../lib/pusher";

export async function POST(req: Request) {
  try {
    const { query, sessionId } = await req.json();

    // Store the user message
    await Chat.create({
      sessionId,
      userMessage: query,
      botResponse: null, // This field will be null for agent-handled chats
      status: "agent_handling",
    });

    // Notify agents monitoring this session
    await pusherServer.trigger("agent-dashboard", "user-message", {
      sessionId,
      message: query,
      timestamp: new Date(),
    });

    // Also trigger on the specific session channel
    // await pusherServer.trigger(`chat-${sessionId}`, "new-message", {
    //   role: "user",
    //   content: query,
    //   timestamp: new Date(),
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Agent chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
