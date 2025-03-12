// /app/api/agent/ignore-session/route.ts
import { NextResponse } from "next/server";
import Chat from "../../../models/Chat";
import { pusherServer } from "../../../lib/pusher";

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();
    const systemMessage =
      "All agents are currently busy. Please try again later or continue working with the AI assistant.";
    const aiMessage = "I'm still here to help you. What can I assist you with?";

    // Update chat session status back to regular mode (not pending agent anymore)
    await Chat.update({ status: "completed" }, { where: { sessionId } });

    // Create a system message in the database
    await Chat.create({
      sessionId,
      userMessage: null,
      botResponse: systemMessage,
      status: "system_message", // Special status for system messages
    });

    // Create an AI message in the database
    await Chat.create({
      sessionId,
      userMessage: null,
      botResponse: aiMessage,
      status: "completed",
    });

    // Send direct message events for both messages (this guarantees delivery)
    await pusherServer.trigger(`chat-${sessionId}`, "agent-ignored", {
      systemMessage: systemMessage,
      aiMessage: aiMessage,
      timestamp: new Date(),
    });

    // Also trigger the standard message event for systems that might be listening
    await pusherServer.trigger(`chat-${sessionId}`, "new-message", {
      role: "system",
      content: systemMessage,
      timestamp: new Date(),
    });

    // Send a specific event to reset the client state from agent mode back to AI mode
    await pusherServer.trigger(`chat-${sessionId}`, "handoff-cancelled", {
      timestamp: new Date(),
    });

    // Notify all agents that this session has been ignored
    await pusherServer.trigger("agent-dashboard", "session-ignored", {
      sessionId,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error ignoring session:", error);
    return NextResponse.json(
      { error: "Failed to ignore session" },
      { status: 500 }
    );
  }
}
