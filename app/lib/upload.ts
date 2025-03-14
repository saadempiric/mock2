import pinecone from "./pinecone";
import { getEmbedding } from "./embeddings";

export async function storeDocuments(documents: string[], country: string) {
  const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

  if (!documents || documents.length === 0) {
    console.error("No documents provided for upload.");
    return;
  }

  const namespace = country.toLowerCase().replace(/\s/g, "-") || "default"; // Convert country name to valid namespace format

  const vectors = await Promise.all(
    documents.map(async (text, idx) => {
      const embedding = await getEmbedding(text);
      return {
        id: `${namespace}-doc-${idx + 1}`, // Unique ID for each document
        values: embedding, // The vector representation
        metadata: { text, country }, // Store original text and country as metadata
      };
    })
  );

  await index.namespace(namespace).upsert(vectors);

  console.log(`Stored ${documents.length} documents in namespace: ${namespace}`);
}
