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
// function checkHandoffCriteria(query: string, history: string): boolean {
//   // Define keywords that might indicate need for human intervention
//   const handoffKeywords = [
//     "speak to a human",
//     "talk to a person",
//     "connect me",
//     "live agent",
//     "real person",
//     "manager",
//     "supervisor",
//     "representative",
//     "complex issue",
//     "not helping",
//     "frustrated",
//     "complaint",
//     "refund",
//     "cancel",
//   ];

//   // Check if query contains any handoff keywords
//   if (
//     handoffKeywords.some((keyword) => query.toLowerCase().includes(keyword))
//   ) {
//     return true;
//   }

//   // Check for repeated questions (simple implementation)
//   const userMessages = history.match(/User: ([\s\S]*?)(?=\nBot:|$)/g);
//   if (userMessages && userMessages.length >= 3) {
//     // Count occurrences of similar questions
//     const lastThreeMessages = userMessages.slice(-3);
//     const uniqueMessages = new Set(
//       lastThreeMessages.map((m) => m.toLowerCase())
//     );

//     // If there are fewer than 3 unique messages, the user is repeating
//     if (uniqueMessages.size < 3) {
//       return true;
//     }
//   }

//   return false;
// }
/**
 * Determines if a user's query indicates the need for human agent handoff
 * using cosine similarity for semantic matching
 * @param query - The user's current message
 * @param history - The conversation history
 * @returns boolean indicating whether to handoff to human agent
 */
function checkHandoffCriteria(query: string, history: string): boolean {
  // Reference phrases that indicate a need for human intervention
  const handoffPhrases = [
    "speak to a human",
    "talk to a person",
    "connect me with an agent",
    "live agent please",
    "need a real person",
    "transfer to manager",
    "get me a supervisor",
    "customer representative",
    "this is a complex issue",
    "you're not helping me",
    "I'm getting frustrated",
    "I have a complaint",
    "process my refund",
    "cancel my subscription",
  ];

  // Word embeddings - simplified version using 5-dimensional vectors
  // In production, you'd use a more sophisticated embedding system
  const wordEmbeddings: Record<string, number[]> = {
    "speak": [0.8, 0.2, 0.4, 0.1, 0.3],
    "talk": [0.75, 0.25, 0.35, 0.15, 0.3],
    "human": [0.7, 0.5, 0.2, 0.3, 0.4],
    "person": [0.65, 0.55, 0.25, 0.25, 0.45],
    "real": [0.6, 0.4, 0.3, 0.2, 0.5],
    "live": [0.55, 0.3, 0.4, 0.1, 0.6],
    "agent": [0.5, 0.6, 0.3, 0.4, 0.2],
    "representative": [0.45, 0.65, 0.25, 0.45, 0.15],
    "connect": [0.6, 0.3, 0.5, 0.2, 0.3],
    "transfer": [0.55, 0.35, 0.45, 0.25, 0.25],
    "get": [0.3, 0.4, 0.6, 0.3, 0.2],
    "need": [0.35, 0.45, 0.55, 0.35, 0.15],
    "want": [0.4, 0.5, 0.5, 0.4, 0.1],
    "manager": [0.7, 0.4, 0.3, 0.5, 0.1],
    "supervisor": [0.65, 0.45, 0.35, 0.45, 0.15],
    "complex": [0.4, 0.7, 0.2, 0.5, 0.3],
    "issue": [0.35, 0.75, 0.15, 0.55, 0.25],
    "help": [0.5, 0.5, 0.5, 0.5, 0.5],
    "helping": [0.45, 0.55, 0.45, 0.55, 0.45],
    "frustrated": [0.6, 0.6, 0.2, 0.7, 0.1],
    "complaint": [0.65, 0.55, 0.25, 0.65, 0.15],
    "refund": [0.7, 0.5, 0.3, 0.6, 0.2],
    "cancel": [0.75, 0.45, 0.35, 0.55, 0.25],
    "subscription": [0.5, 0.7, 0.4, 0.4, 0.3],
    // Common words with lower semantic meaning
    "to": [0.1, 0.1, 0.1, 0.1, 0.1],
    "a": [0.05, 0.05, 0.05, 0.05, 0.05],
    "with": [0.15, 0.15, 0.15, 0.15, 0.15],
    "me": [0.2, 0.2, 0.2, 0.2, 0.2],
    "my": [0.15, 0.25, 0.15, 0.25, 0.15],
    "i": [0.1, 0.15, 0.1, 0.15, 0.1],
    "am": [0.05, 0.2, 0.05, 0.2, 0.05],
    "is": [0.05, 0.05, 0.2, 0.05, 0.2],
    "this": [0.1, 0.1, 0.25, 0.1, 0.25],
    "not": [0.3, 0.3, 0.3, 0.3, 0.3],
    "and": [0.05, 0.05, 0.05, 0.05, 0.05],
    "or": [0.05, 0.05, 0.05, 0.05, 0.05],
    "the": [0.02, 0.02, 0.02, 0.02, 0.02],
    "you": [0.15, 0.15, 0.15, 0.15, 0.15],
    "your": [0.15, 0.15, 0.15, 0.15, 0.15],
    "please": [0.2, 0.2, 0.2, 0.2, 0.2],
  };

  /**
   * Get embedding for a word
   * @param word - The word to get embedding for
   * @returns number[] - The embedding vector
   */
  function getWordEmbedding(word: string): number[] {
    const lowercaseWord = word.toLowerCase();
    return wordEmbeddings[lowercaseWord] || [0, 0, 0, 0, 0]; // Default for unknown words
  }

  /**
   * Get embedding for a phrase by averaging word embeddings
   * @param phrase - The phrase to get embedding for
   * @returns number[] - The averaged embedding vector
   */
  function getPhraseEmbedding(phrase: string): number[] {
    const words = phrase.toLowerCase().split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) {
      return [0, 0, 0, 0, 0];
    }
    
    const embeddings = words.map(getWordEmbedding);
    const result = [0, 0, 0, 0, 0];
    
    for (const embedding of embeddings) {
      for (let i = 0; i < 5; i++) {
        result[i] += embedding[i];
      }
    }
    
    for (let i = 0; i < 5; i++) {
      result[i] /= words.length;
    }
    
    return result;
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param vec1 - First vector
   * @param vec2 - Second vector
   * @returns number - Cosine similarity score (-1 to 1)
   */
  function cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }
    
    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);
    
    if (mag1 === 0 || mag2 === 0) {
      return 0;
    }
    
    return dotProduct / (mag1 * mag2);
  }

  /**
   * Check if a query is semantically similar to any handoff phrase
   * @param userQuery - The user's query
   * @returns boolean - Whether the query is similar to a handoff phrase
   */
  function isSemanticallySimilarToHandoff(userQuery: string): boolean {
    const threshold = 0.7; // Similarity threshold (0.0 to 1.0)
    const queryEmbedding = getPhraseEmbedding(userQuery);
    
    for (const phrase of handoffPhrases) {
      const phraseEmbedding = getPhraseEmbedding(phrase);
      const similarity = cosineSimilarity(queryEmbedding, phraseEmbedding);
      
      if (similarity >= threshold) {
        return true;
      }
    }
    
    return false;
  }

  // Check if query is semantically similar to any handoff phrase
  if (isSemanticallySimilarToHandoff(query)) {
    return true;
  }

  // Check for repeat questions indicating frustration
  const userMessages = history.match(/User: ([\s\S]*?)(?=\nBot:|$)/g);
  if (userMessages && userMessages.length >= 3) {
    const lastThreeMessages = userMessages.slice(-3).map(msg => {
      // Extract just the message content, removing the "User: " prefix
      return msg.replace(/^User: /, '').trim();
    });
    
    // Check for semantic similarity between the last messages
    const similarityThreshold = 0.8; // Higher threshold for determining repeats
    let repeatedMessageCount = 0;
    
    for (let i = 0; i < lastThreeMessages.length - 1; i++) {
      const currentMsgEmbedding = getPhraseEmbedding(lastThreeMessages[i]);
      
      for (let j = i + 1; j < lastThreeMessages.length; j++) {
        const nextMsgEmbedding = getPhraseEmbedding(lastThreeMessages[j]);
        const similarity = cosineSimilarity(currentMsgEmbedding, nextMsgEmbedding);
        
        if (similarity >= similarityThreshold) {
          repeatedMessageCount++;
          break; // Found a similar message, move to next
        }
      }
    }
    
    // If we have more than one similar message pair, the user is likely repeating
    if (repeatedMessageCount > 0) {
      return true;
    }
  }

  // Check for explicit frustration keywords
  const frustrationKeywords = ["not working", "doesn't work", "useless", "waste of time", "ridiculous"];
  if (frustrationKeywords.some(keyword => query.toLowerCase().includes(keyword))) {
    return true;
  }

  return false;
}