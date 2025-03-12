import { retrieveContext } from "../../lib/retrieve";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Chat from "../../models/Chat";
import sequelize from "../../lib/sequelize";
import { pusherServer } from "../../lib/pusher";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const systemPrompt = `You are Empira, an AI-powered chatbot for Empiric Technology, a leading provider of AI-driven enterprise solutions specializing in automation, data analytics, and cloud computing. Your role is to assist users by providing accurate and relevant information strictly within the scope of Empiric Technology.
 
Instruction:
Context Adherence: Only answer queries related to Empiric Technology, its services, products, pricing, AI assistant, partnerships, security measures, refund policies, customer support, and other company-specific details mentioned in the provided document.
Maintaining Context: Preserve conversation history to ensure continuity. Responses should reflect prior exchanges in the conversation for a seamless user experience.
Accuracy & Clarity: Provide precise, clear, and concise responses without unnecessary embellishments. Avoid speculation or assumptions.
Restricted Topics: If a user asks about anything outside the scope of Empiric Technology (e.g., general knowledge, math problems, personal advice), respond with:
"Sorry about that, I am a chatbot that will only answer queries related to Empiric Technology."
Professional & Neutral Tone: Maintain a professional and informative tone without excessive formality. Do not format responses with bold or italic text.
Escalation Protocol: If the AI assistant cannot resolve a query, inform the user that the request will be escalated to a human support agent through Empiric Technology's built-in ticketing system.
Security & Compliance: Do not provide personal data or confidential company details beyond what is explicitly mentioned in the document. Ensure all responses align with Empiric Technology's adherence to GDPR, CCPA, and HIPAA regulations.
Your primary goal is to enhance user experience by delivering accurate, relevant, and context-aware responses within the defined scope of Empiric Technology.`;

export async function POST(req: Request) {
  const { query, sessionId, agentRequested, country } = await req.json();

  try {
    await sequelize.sync();

    // 🛠 1️⃣ Normalize Country Name for Namespace
    if (country == "United States") {
      var namespace = "usa";
    } else {
      namespace = country ? country.toLowerCase() : "default";
    }
    // Store the user message for monitoring purposes
    // This pushes to Pusher channel regardless of handoff status
    await pusherServer.trigger(`chat-${sessionId}`, "new-message", {
      role: "user",
      content: query,
      timestamp: new Date(),
    });

    // If handoff is already requested, don't process further
    if (agentRequested) {
      return Response.json({
        needsHandoff: true,
        response: null, // No AI response when handoff requested
      });
    }

    // 1️⃣ Retrieve Chat History for Context
    const chatHistory = await Chat.findAll({
      where: { sessionId },
      order: [["createdAt", "ASC"]],
      limit: 5,
    });

    const historyText = chatHistory
      .map(
        (chat) => `User: ${chat.userMessage}\nBot: ${chat.botResponse || ""}`
      )
      .join("\n");

    // 2️⃣ Retrieve Context from Pinecone
    const context = await retrieveContext(query, country);

    // 3️⃣ Check for handoff criteria
    const needsHandoff = checkHandoffCriteria(query, historyText);

    // 4️⃣ Generate Response with Chat History + Pinecone Context
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      `The user is from ${country}`,
      systemPrompt,
      historyText,
      context,
      `Query: ${query}`,
      // Add handoff instructions if needed
      needsHandoff
        ? "The user needs to be connected to a human agent. Inform them politely that you're connecting them with a specialist."
        : "",
    ]);

    const response = await result.response;
    const botMessage = response.text();

    // 5️⃣ Store Conversation in DB
    await Chat.create({
      sessionId,
      userMessage: query,
      botResponse: botMessage,
      status: needsHandoff ? "needs_handoff" : "completed",
    });

    // 6️⃣ Push bot response to Pusher for monitoring
    await pusherServer.trigger(`chat-${sessionId}`, "new-message", {
      role: "assistant",
      content: botMessage,
      timestamp: new Date(),
    });

    // 7️⃣ If handoff is needed, notify the agent dashboard
    if (needsHandoff) {
      await pusherServer.trigger("agent-dashboard", "handoff-needed", {
        sessionId,
        userQuery: query,
        timestamp: new Date(),
      });
    }

    return Response.json({
      response: botMessage,
      needsHandoff,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return Response.json(
      { error: "Something went wrong!" },
      {
        status: 500,
      }
    );
  }
}

// Simple function to check for handoff criteria
function checkHandoffCriteria(query: string, history: string): boolean {
  // Define keywords that might indicate need for human intervention
  const handoffKeywords = [
    "speak to a human",
    "talk to a person",
    "connect me",
    "live agent",
    "real person",
    "manager",
    "supervisor",
    "representative",
    "complex issue",
    "not helping",
    "frustrated",
    "complaint",
    "refund",
    "cancel",
  ];

  // Check if query contains any handoff keywords
  if (
    handoffKeywords.some((keyword) => query.toLowerCase().includes(keyword))
  ) {
    return true;
  }

  // Check for repeated questions (simple implementation)
  const userMessages = history.match(/User: ([\s\S]*?)(?=\nBot:|$)/g);
  if (userMessages && userMessages.length >= 3) {
    // Count occurrences of similar questions
    const lastThreeMessages = userMessages.slice(-3);
    const uniqueMessages = new Set(
      lastThreeMessages.map((m) => m.toLowerCase())
    );

    // If there are fewer than 3 unique messages, the user is repeating
    if (uniqueMessages.size < 3) {
      return true;
    }
  }

  return false;
}
