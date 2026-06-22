import { DocumentSource, DocumentMetadata, ProcessingOptions, ProcessingResult, ProcessedChunk } from './types';
import { extractText } from './loaders/loader';
import { chunkText } from './chunker';
import { embedDocuments } from './embeddings/embeddings_service';
import { saveChunksToPinecone } from './pinecone/pinecone';


export async function processDocument(
  source: DocumentSource,
  fileType: string,
  metadata: DocumentMetadata,
  options?: ProcessingOptions
): Promise<ProcessingResult> {


  const startTime = Date.now();
  console.log(`[AI Pipeline] Starting document processing for ID: ${metadata.documentId} (Type: ${fileType})`);

  try {

    // 1. Fetch & Text Extraction

    const extractionStart = Date.now();
    const rawText = await extractText(source, fileType);
    const extractionTimeMs = Date.now() - extractionStart;
    console.log(`[AI Pipeline] Text extraction complete in ${extractionTimeMs}ms. Text length: ${rawText.length}`);

    // 2. Chunks generation (Splitting)
    const chunkingStart = Date.now();
    const documentChunks = await chunkText(rawText, metadata, options);
    console.log(`[AI Pipeline] Chunks generation complete. Created ${documentChunks.length} chunks.`);

    // 3. Embedding generation
    const embeddingStart = Date.now();
    const embeddings = await embedDocuments(documentChunks, options?.batchSize);
    const embeddingTimeMs = Date.now() - embeddingStart;
    console.log(`[AI Pipeline] Embeddings generation complete in ${embeddingTimeMs}ms.`);

    // 4. Combine into final type-safe structure
    const processedChunks: ProcessedChunk[] = documentChunks.map((chunk, index) => ({
      text: chunk.pageContent,
      embedding: embeddings[index] || [],
      metadata: chunk.metadata as DocumentMetadata,
    }));

    try {
      await saveChunksToPinecone(metadata.subjectId, metadata.documentId, processedChunks);
      console.log(`[AI Pipeline] Stored ${processedChunks.length} chunks in Pinecone for subject ${metadata.subjectId}.`);
    } catch (pineconeError: any) {
      console.warn('[AI Pipeline] Pinecone storage failed:', pineconeError);
    }

    return {
      chunks: processedChunks,
      metadata: {
        documentId: metadata.documentId,
        totalChunks: documentChunks.length,
        extractionTimeMs,
        embeddingTimeMs,
      },
    };
  } catch (error: any) {
    console.error(`[AI Pipeline] Error during processing of document ${metadata.documentId}:`, error);
    throw new Error(`Document processing pipeline failed: ${error.message || error}`);
  }
}
