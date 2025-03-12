import pinecone from "./pinecone";
import { getEmbedding } from "./embeddings";

export async function storeDocument(id: string, text: string) {
  const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
  const embedding = await getEmbedding(text);

  await index.upsert([
    {
      id, // Unique identifier for the document
      values: embedding, // The vector representation
      metadata: { text }, // Store original text as metadata
    },
  ]);

  console.log(`Stored document: ${id}`);
}
