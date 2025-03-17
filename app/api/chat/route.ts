import { retrieveContext } from "../../lib/retrieve";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Chat from "../../models/Chat";
import sequelize from "../../lib/sequelize";
import { pusherServer } from "../../lib/pusher";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const systemPrompt = `You are an AI-powered chatbot for Empiric Technology, a leading provider of AI-driven enterprise solutions specializing in automation, data analytics, and cloud computing. Your role is to assist users by providing accurate and relevant information strictly within the scope of Empiric Technology.
 
Instruction:
Context Adherence: Only answer queries related to Empiric Technology, its services, products, pricing, AI assistant, partnerships, security measures, refund policies, customer support, and other company-specific details mentioned in the provided document.
Maintaining Context: Preserve conversation history to ensure continuity. Responses should reflect prior exchanges in the conversation for a seamless user experience.
Accuracy & Clarity: Provide precise, clear, and concise responses without unnecessary embellishments. Avoid speculation or assumptions.
Restricted Topics: If a user asks about anything outside the scope of Empiric Technology (e.g., general knowledge, math problems, personal advice), respond with:

"Sorry about that, I am a chatbot that will only answer queries related to Empiric Technology."
Professional & Neutral Tone: Maintain a professional and informative tone without excessive formality. Do not format responses with bold or italic text.
Escalation Protocol: If the AI assistant cannot resolve a query, inform the user that the request will be escalated to a human support agent through Empiric Technology’s built-in ticketing system.
Security & Compliance: Do not provide personal data or confidential company details beyond what is explicitly mentioned in the document. Ensure all responses align with Empiric Technology’s adherence to GDPR, CCPA, and HIPAA regulations.
Your primary goal is to enhance user experience by delivering accurate, relevant, and context-aware responses within the defined scope of Empiric Technology.
 
`;

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

/**
 * Determines if a user's query indicates the need for human agent handoff
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

  // List of stop words to be removed
  const stopWords = [
    "a", "an", "the", "and", "or", "but", "if", "because", "as", "what", "which",
    "this", "that", "these", "those", "then", "just", "so", "than", "such", "both",
    "through", "about", "for", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "doing", "can", "could", "should",
    "would", "shall", "will", "may", "might", "must", "of", "at", "by", "for", "with",
    "to", "from", "in", "on", "up", "down", "over", "under", "above", "below", "i",
    "you", "he", "she", "it", "we", "they", "me", "him", "her", "us", "them", "my",
    "your", "his", "its", "our", "their", "please", "thank", "yes", "no", "ok", "okay"
  ];

  /**
   * Remove stop words from a phrase
   * @param phrase - The phrase to process
   * @returns string[] - Array of meaningful words
   */
  function removeStopWords(phrase: string): string[] {
    // First, clean up the phrase by removing punctuation and converting to lowercase
    const cleanedPhrase = phrase.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?\d]/g, "");
    
    // Split into words and filter out stop words and empty strings
    const words = cleanedPhrase.split(/\s+/).filter(word => 
      word.length > 0 && !stopWords.includes(word)
    );
    
    return words;
  }

  /**
   * Calculate the Jaccard similarity between two sets of words
   * @param set1 - First set of words
   * @param set2 - Second set of words
   * @returns number - Jaccard similarity score (0 to 1)
   */
  function jaccardSimilarity(set1: string[], set2: string[]): number {
    if (set1.length === 0 && set2.length === 0) return 0;
    
    // Create sets to eliminate duplicates
    const set1Unique = new Set(set1);
    const set2Unique = new Set(set2);
    
    // Calculate intersection size
    const intersection = new Set([...set1Unique].filter(x => set2Unique.has(x)));
    
    // Calculate union size
    const union = new Set([...set1Unique, ...set2Unique]);
    
    // Jaccard similarity = size of intersection / size of union
    return intersection.size / union.size;
  }

  /**
   * Calculate the exact match ratio between two sets of words
   * @param set1 - First set of words
   * @param set2 - Second set of words
   * @returns number - Exact match ratio (0 to 1)
   */
  function exactMatchRatio(set1: string[], set2: string[]): number {
    if (set1.length === 0 || set2.length === 0) return 0;
    
    // Count exact matches
    let matches = 0;
    for (const word of set1) {
      if (set2.includes(word)) {
        matches++;
      }
    }
    
    // Return ratio of matches to the smaller set size
    return matches / Math.min(set1.length, set2.length);
  }

  /**
   * Check if a query is semantically similar to any handoff phrase
   * @param userQuery - The user's query
   * @returns boolean - Whether the query is similar to a handoff phrase
   */
  function isSemanticallySimilarToHandoff(userQuery: string): boolean {
    // Extract meaningful words from the user query
    const queryWords = removeStopWords(userQuery);
    
    // If after removing stop words, the query is empty, it's not a handoff request
    if (queryWords.length === 0) {
      return false;
    }
    
    // Log the cleaned query words for debugging
    console.log(`Cleaned query words: [${queryWords.join(', ')}]`);
    
    // Handoff-specific important words that strongly indicate a handoff request
    const handoffIndicators = [
      "human", "person", "agent", "representative", "manager", "supervisor", 
      "speak", "talk", "connect", "transfer", "live", "real", 
      "refund", "cancel", "complaint", "frustrated"
    ];
    
    // Check for direct presence of handoff indicator words
    const containsHandoffIndicator = queryWords.some(word => handoffIndicators.includes(word));
    if (containsHandoffIndicator) {
      console.log(`Handoff triggered! Found handoff indicator word in query.`);
      return true;
    }
    
    // Process each handoff phrase and check for similarity
    let highestJaccard = 0;
    let highestExactMatch = 0;
    let bestMatchPhrase = '';
    
    for (const phrase of handoffPhrases) {
      // Extract meaningful words from the handoff phrase
      const phraseWords = removeStopWords(phrase);
      
      // Calculate Jaccard similarity
      const jaccard = jaccardSimilarity(queryWords, phraseWords);
      
      // Calculate exact match ratio
      const exactMatch = exactMatchRatio(queryWords, phraseWords);
      
      // Track highest similarity for logging
      if (jaccard > highestJaccard) {
        highestJaccard = jaccard;
        bestMatchPhrase = phrase;
      }
      
      // Log the similarity for debugging
      console.log(`Matching "${queryWords.join(' ')}" with "${phraseWords.join(' ')}": Jaccard=${jaccard.toFixed(2)}, ExactMatch=${exactMatch.toFixed(2)}`);
      
      // Combined threshold approach
      if ((jaccard >= 0.4 && exactMatch >= 0.5) || jaccard >= 0.6) {
        console.log(`Handoff triggered! Matched phrase: "${phrase}" with Jaccard=${jaccard.toFixed(2)}, ExactMatch=${exactMatch.toFixed(2)}`);
        return true;
      }
    }
    
    console.log(`Highest Jaccard similarity: ${highestJaccard.toFixed(2)} with phrase: "${bestMatchPhrase}"`);
    return false;
  }

  // Check if query is semantically similar to any handoff phrase
  if (isSemanticallySimilarToHandoff(query)) {
    return true;
  }

  // Check for explicit frustration keywords
  const frustrationKeywords = ["not working", "doesn't work", "useless", "waste of time", "ridiculous"];
  if (frustrationKeywords.some(keyword => query.toLowerCase().includes(keyword))) {
    return true;
  }

  return false;
}