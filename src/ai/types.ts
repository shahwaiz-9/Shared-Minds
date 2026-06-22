export interface DocumentMetadata extends Record<string, any> {
  documentId: string;
  subjectId: string;
  userId: string;
  source: string;
  fileType: string;
  chunkIndex?: number;
  totalChunks?: number;
}

export interface ProcessedChunk {
  text: string;
  embedding: number[];
  metadata: DocumentMetadata;
}

export interface ProcessingResult {
  chunks: ProcessedChunk[];
  metadata: {
    documentId: string;
    totalChunks: number;
    extractionTimeMs: number;
    embeddingTimeMs: number;
  };
}

export interface ProcessingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  batchSize?: number;
}

export type DocumentSource =
  | { type: 'local'; uri: string }
  | { type: 'remote'; url: string };
