import { DocumentMetadata, ProcessingOptions } from '@/interface/document';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { AI_CONFIG } from './config';

/**
 * Splits raw text into smaller overlapping chunks to preserve local context.
 * Uses LangChain's RecursiveCharacterTextSplitter under the hood.
 */
export async function chunkText(
  text: string,
  metadata: DocumentMetadata,
  options?: ProcessingOptions
): Promise<Document[]> {
  if (!text || text.trim() === '') {
    throw new Error('Cannot chunk empty text.');
  }

  const chunkSize = options?.chunkSize ?? AI_CONFIG.chunking.chunkSize;
  const chunkOverlap = options?.chunkOverlap ?? AI_CONFIG.chunking.chunkOverlap;

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const rawDocs = await splitter.createDocuments([text]);

  const totalChunks = rawDocs.length;

  // Enrich each document chunk with metadata including indices
  return rawDocs.map((doc, index) => {
    const chunkMetadata: DocumentMetadata = {
      ...metadata,
      chunkIndex: index,
      totalChunks,
    };

    return new Document({
      pageContent: doc.pageContent,
      metadata: chunkMetadata,
    });
  });
}
