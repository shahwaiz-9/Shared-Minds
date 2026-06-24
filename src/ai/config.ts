export const AI_CONFIG = {
  geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
  hfApiKey: process.env.EXPO_PUBLIC_HF_API_KEY,

  // Pinecone parameters
  pinecone: {
    apiKey: process.env.EXPO_PUBLIC_PINECONE_API_KEY || '',
    hostUrl: process.env.EXPO_PUBLIC_PINECONE_HOST || '',
  },

  embeddings: {
    modelName: 'gemini-embedding-001',
    batchSize: 50,
    expectedDimension: 3072,
  },
  chunking: {
    chunkSize: 1000,
    chunkOverlap: 200,
  },
  extraction: {
    geminiModel: 'gemini-3.1-flash-lite',
    hfModel: 'meta-llama/Llama-3.2-11B-Vision-Instruct',
  },
};