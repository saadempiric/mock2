import { NextResponse } from "next/server";
import Chat from "../../../models/Chat";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Session ID is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch all messages for this session
    const messages = await Chat.findAll({
      where: { sessionId },
      order: [["createdAt", "ASC"]],
    });

    // Format messages for the dashboard
    const formattedMessages = messages
      .map((message: any) => {
        if (message.userMessage) {
          return {
            role: "user",
            content: message.userMessage,
            timestamp: message.createdAt,
          };
        } else if (message.botResponse) {
          // Determine if this is from the AI or an agent
          const isAgent = message.status === "agent_handling";
          return {
            role: isAgent ? "agent" : "assistant",
            content: message.botResponse,
            timestamp: message.createdAt,
          };
        }
        return null;
      })
      .filter(Boolean);

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error("Error fetching session messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
