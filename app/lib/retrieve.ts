import pinecone from "./pinecone";
import { getEmbedding } from "./embeddings";

export async function retrieveContext(query: string, country: string) {
  const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
  const namespace = index.namespace(country.toLowerCase()); // Set namespace dynamically

  const queryEmbedding = await getEmbedding(query);

  const queryResults = await namespace.query({
    // Search within the specific namespace
    vector: queryEmbedding,
    topK: 5, // Retrieve top 5 relevant results
    includeMetadata: true,
  });

  // Extract relevant context from results
  const context = queryResults.matches
    ?.map((match) => match.metadata?.text) // Extract metadata text
    .filter(Boolean) // Remove any undefined/null values
    .join("\n");

  return context || "No relevant information found.";
}
