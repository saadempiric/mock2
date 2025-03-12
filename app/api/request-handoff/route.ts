import { NextResponse } from "next/server";
import Chat from "../../models/Chat";
import { pusherServer } from "../../lib/pusher";

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    // Update chat status in the database
    await Chat.update({ status: "pending_agent" }, { where: { sessionId } });

    // Notify agent dashboard about handoff request
    await pusherServer.trigger("agent-dashboard", "handoff-needed", {
      sessionId,
      timestamp: new Date(),
      isExplicitRequest: true, // Flag that user explicitly requested agent
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Handoff request error:", error);
    return NextResponse.json(
      { error: "Failed to request handoff" },
      { status: 500 }
    );
  }
}
