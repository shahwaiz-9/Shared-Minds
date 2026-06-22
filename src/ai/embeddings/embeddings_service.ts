import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Document } from '@langchain/core/documents';
import { AI_CONFIG } from '../config';

let embeddingsInstance: GoogleGenerativeAIEmbeddings | null = null;

function getEmbeddingsInstance(): GoogleGenerativeAIEmbeddings {
  if (embeddingsInstance) return embeddingsInstance;

  const apiKey = AI_CONFIG.geminiApiKey;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY / EXPO_PUBLIC_GEMINI_API_KEY.');
  }

  embeddingsInstance = new GoogleGenerativeAIEmbeddings({
    apiKey,
    modelName: AI_CONFIG.embeddings.modelName,
  });

  return embeddingsInstance;
}



const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {

    const isRateLimit =
      error?.status === 429 ||
      error?.message?.toLowerCase().includes('429') ||
      error?.message?.toLowerCase().includes('resource_exhausted') ||
      error?.message?.toLowerCase().includes('rate limit');

    if (isRateLimit && retries > 0) {
      console.warn(`Rate limit hit, retrying in ${delayMs}ms... (${retries} retries left)`);
      await delay(delayMs);
      return withRetry(fn, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

/**
 * Batch generates vector representations (embeddings) for an array of document chunks.
 */
export async function embedDocuments(
  chunks: Document[],
  batchSize: number = AI_CONFIG.embeddings.batchSize
): Promise<number[][]> {
  if (!chunks || chunks.length === 0) {
    return [];
  }

  const embeddings = getEmbeddingsInstance();
  const results: number[][] = [];

  // Batch chunk submissions to prevent API limits / payloads size issues
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.pageContent);

    const batchEmbeddings = await withRetry(async () => {
      return await embeddings.embedDocuments(texts);
    });

    results.push(...batchEmbeddings);
  }

  return results;
}

export async function embedQuery(query: string): Promise<number[]> {
  if (!query) {
    throw new Error('Query string cannot be empty.');
  }

  const embeddings = getEmbeddingsInstance();

  return await withRetry(async () => {
    return await embeddings.embedQuery(query);
  });
}
