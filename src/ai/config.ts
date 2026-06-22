export const AI_CONFIG = {
  geminiApiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
  hfApiKey: process.env.EXPO_PUBLIC_HF_API_KEY,

  // Pinecone parameters
  pinecone: {
    apiKey: process.env.EXPO_PUBLIC_PINECONE_API_KEY || '',
    hostUrl: process.env.EXPO_PUBLIC_PINECONE_HOST || '',
  },

  embeddings: {
    modelName: 'text-embedding-004',
    batchSize: 50,
  },
  chunking: {
    chunkSize: 1000,
    chunkOverlap: 200,
  },
  extraction: {
    geminiModel: 'gemini-3.1-flash-lite',
    hfModel: 'Qwen/Qwen2.5-VL-7B-Instruct',
  },
};