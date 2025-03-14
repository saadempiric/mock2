import { storeDocuments } from "../../lib/upload";
import { NextRequest } from "next/server";
import mammoth from "mammoth";

// Helper function to split text into chunks
function splitIntoChunks(text: string, maxChunkSize: number = 1000, overlapSize: number = 200): string[] {
  if (!text || text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    // Calculate end index (chunk boundary)
    let endIndex = startIndex + maxChunkSize;
    
    // If we're not at the end of the document, find a good breaking point
    if (endIndex < text.length) {
      // Try to find paragraph break
      const paragraphBreak = text.lastIndexOf('\n\n', endIndex);
      if (paragraphBreak > startIndex && paragraphBreak > endIndex - 200) {
        endIndex = paragraphBreak;
      } else {
        // Try to find sentence break
        const sentenceBreak = text.lastIndexOf('. ', endIndex);
        if (sentenceBreak > startIndex && sentenceBreak > endIndex - 150) {
          endIndex = sentenceBreak + 1; // Include the period
        } else {
          // Fall back to word break
          const spacePosition = text.lastIndexOf(' ', endIndex);
          if (spacePosition > startIndex) {
            endIndex = spacePosition;
          }
        }
      }
    }

    // Add chunk
    chunks.push(text.substring(startIndex, endIndex).trim());
    
    // Move start index for next chunk, with overlap
    startIndex = endIndex - overlapSize;
    if (startIndex < 0) startIndex = 0;
  }

  return chunks.filter(chunk => chunk.length > 0);
}

export async function POST(req: NextRequest) {
  try {
    // Default chunk options (can be overridden by request parameters)
    let chunkSize = 1000;
    let overlapSize = 200;
    
    // Check if the request is multipart form data (file upload)
    const contentType = req.headers.get("content-type") || "";
    
    // Handle file uploads (Word documents)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const files = formData.getAll("files") as File[];
      const country = formData.get("country") as string;
      
      // Optional chunking parameters
      const requestedChunkSize = formData.get("chunkSize");
      const requestedOverlapSize = formData.get("overlapSize");
      
      if (requestedChunkSize) chunkSize = parseInt(requestedChunkSize as string);
      if (requestedOverlapSize) overlapSize = parseInt(requestedOverlapSize as string);
      
      if (!files || files.length === 0 || !country) {
        return new Response(JSON.stringify({ error: "Invalid request: files and country are required." }), { status: 400 });
      }
      
      // Process each Word document
      let allChunks: string[] = [];
      let fileStats: {fileName: string, chunks: number}[] = [];
      
      for (const file of files) {
        // Extract text from document
        let documentText = "";
        
        if (file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const result = await mammoth.extractRawText({ buffer });
          documentText = result.value.trim();
        } else {
          documentText = await file.text();
        }
        
        if (documentText.length > 0) {
          // Split the document into chunks
          const documentChunks = splitIntoChunks(documentText, chunkSize, overlapSize);
          allChunks.push(...documentChunks);
          
          // Record statistics
          fileStats.push({
            fileName: file.name,
            chunks: documentChunks.length
          });
        }
      }
      
      if (allChunks.length === 0) {
        return new Response(JSON.stringify({ error: "No valid content found in the uploaded files." }), { status: 400 });
      }
      
      await storeDocuments(allChunks, country);
      
      return new Response(JSON.stringify({ 
        message: `${allChunks.length} chunks from ${files.length} document(s) uploaded successfully for ${country}.`,
        fileStats,
        totalChunks: allChunks.length
      }), { status: 200 });
    } 
    // Handle direct JSON payload with optional chunking
    else if (contentType.includes("application/json")) {
      const { documents, country, chunkSize: requestedChunkSize, overlapSize: requestedOverlapSize } = await req.json();
      
      if (!documents || !country || !Array.isArray(documents)) {
        return new Response(JSON.stringify({ error: "Invalid request: documents and country are required." }), { status: 400 });
      }
      
      // Apply requested chunking parameters if provided
      if (requestedChunkSize) chunkSize = requestedChunkSize;
      if (requestedOverlapSize) overlapSize = requestedOverlapSize;
      
      // Process each document and split into chunks
      let allChunks: string[] = [];
      for (const document of documents) {
        if (typeof document === 'string' && document.trim().length > 0) {
          const documentChunks = splitIntoChunks(document, chunkSize, overlapSize);
          allChunks.push(...documentChunks);
        }
      }
      
      await storeDocuments(allChunks, country);
      
      return new Response(JSON.stringify({ 
        message: `${allChunks.length} chunks uploaded successfully for ${country}.`,
        originalDocuments: documents.length,
        totalChunks: allChunks.length
      }), { status: 200 });
    } 
    // Invalid content type
    else {
      return new Response(JSON.stringify({ error: "Unsupported content type. Use multipart/form-data for file uploads or application/json for text data." }), { status: 400 });
    }
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ error: "Internal server error.", details: error instanceof Error ? error.message : String(error) }), { status: 500 });
  }
}