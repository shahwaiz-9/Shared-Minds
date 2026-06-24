import { Document } from '@langchain/core/documents';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { AI_CONFIG } from '../config';

let embeddingsInstance: GoogleGenerativeAIEmbeddings | null = null;

function getEmbeddingsInstance(): GoogleGenerativeAIEmbeddings {
  if (embeddingsInstance) return embeddingsInstance;

  const apiKey = AI_CONFIG.geminiApiKey;
  console.log(`[Embeddings] Initializing embeddings instance. API Key set: ${!!apiKey}, Model: ${AI_CONFIG.embeddings.modelName}`);

  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY / EXPO_PUBLIC_GEMINI_API_KEY.');
  }

  try {
    embeddingsInstance = new GoogleGenerativeAIEmbeddings({
      apiKey,
      modelName: AI_CONFIG.embeddings.modelName,

    });
    console.log(`[Embeddings] Instance created successfully`);
  } catch (error: any) {
    console.error(`[Embeddings] Failed to create instance:`, error?.message || error);
    throw error;
  }

  return embeddingsInstance;
}

function ensureDimensionMatches(vector: number[]): void {
  const expected = AI_CONFIG.embeddings.expectedDimension;
  if (expected && vector.length !== expected) {
    throw new Error(`Embedding vector dimension ${vector.length} does not match expected ${expected}. Ensure the model and Pinecone index both use ${expected}.`);
  }
}



const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));


async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    console.error(`[Embeddings] API call failed:`, error?.message || error);

    const isRateLimit =
      error?.status === 429 ||
      error?.message?.toLowerCase().includes('429') ||
      error?.message?.toLowerCase().includes('resource_exhausted') ||
      error?.message?.toLowerCase().includes('rate limit');

    if (isRateLimit && retries > 0) {
      console.warn(`[Embeddings] Rate limit hit, retrying in ${delayMs}ms... (${retries} retries left)`);
      await delay(delayMs);
      return withRetry(fn, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

function validateEmbeddings(embeddings: unknown, expectedSize: number, batchTexts?: string[]): number[][] {
  console.log(`[Embeddings] Validating response: received ${Array.isArray(embeddings) ? embeddings.length : 'non-array'} vectors for ${expectedSize} texts`);

  if (Array.isArray(embeddings) && embeddings.length > 0) {
    console.log(`[Embeddings] First vector type: ${typeof embeddings[0]}, is array: ${Array.isArray(embeddings[0])}, length: ${Array.isArray(embeddings[0]) ? (embeddings[0] as any[]).length : 'N/A'}`);
  }

  if (!Array.isArray(embeddings) || embeddings.length !== expectedSize) {
    throw new Error(`Invalid embedding response: expected ${expectedSize} vectors, got ${Array.isArray(embeddings) ? embeddings.length : typeof embeddings}. Model may be misconfigured or API key invalid.`);
  }

  const validated: number[][] = [];

  embeddings.forEach((vector, index) => {
    if (!Array.isArray(vector) || vector.length === 0) {
      console.error(`[Embeddings] Vector ${index} is empty. Text was: "${batchTexts?.[index]?.slice(0, 100) || 'unknown'}..."`);
      throw new Error(`Embedding vector ${index} is empty or invalid. This usually means the Google Gemini API call failed silently.`);
    }
    if (!vector.every((value) => typeof value === 'number')) {
      throw new Error(`Embedding vector ${index} contains non-number values.`);
    }
    ensureDimensionMatches(vector as number[]);
    validated.push(vector as number[]);
  });

  return validated;
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

  console.log(`[Embeddings] Starting to embed ${chunks.length} chunks with batch size ${batchSize}, using model: ${AI_CONFIG.embeddings.modelName}`);

  // Batch chunk submissions to prevent API limits / payloads size issues
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.pageContent);

    console.log(`[Embeddings] Processing batch ${Math.floor(i / batchSize) + 1}: ${batch.length} texts (total chars: ${texts.reduce((sum, t) => sum + t.length, 0)})`);

    const batchEmbeddings = await withRetry(async () => {
      const response = await embeddings.embedDocuments(texts);

      // Log raw response structure for debugging
      console.log(`[Embeddings] Raw response received:`, {
        isArray: Array.isArray(response),
        length: Array.isArray(response) ? response.length : 'N/A',
        firstItemType: Array.isArray(response) && response.length > 0 ? typeof response[0] : 'N/A',
        firstItemIsArray: Array.isArray(response) && response.length > 0 ? Array.isArray(response[0]) : 'N/A',
        firstItemLength: Array.isArray(response) && Array.isArray(response[0]) ? response[0].length : 'N/A',
        fullResponse: Array.isArray(response) ? JSON.stringify(response.slice(0, 2)) : String(response),
      });

      return validateEmbeddings(response, batch.length, texts);
    });

    results.push(...batchEmbeddings);
    console.log(`[Embeddings] Batch ${Math.floor(i / batchSize) + 1} complete. First vector length: ${batchEmbeddings[0]?.length || 0}`);
  }

  console.log(`[Embeddings] All batches complete. Total embeddings: ${results.length}, first vector dim: ${results[0]?.length || 0}`);
  return results;
}

export async function embedQuery(query: string): Promise<number[]> {
  if (!query) {
    throw new Error('Query string cannot be empty.');
  }

  const embeddings = getEmbeddingsInstance();

  console.log(`[Embeddings] Embedding query (${query.length} chars): "${query.slice(0, 60)}..."`);

  const result = await withRetry(async () => {
    const response = await embeddings.embedQuery(query);
    console.log(`[Embeddings] Query embedding response: ${Array.isArray(response) ? response.length : typeof response} dimensions`);

    if (!Array.isArray(response) || response.length === 0) {
      throw new Error('Query embedding returned empty or invalid response. API may have failed silently.');
    }

    return response;
  });

  return result;
}
