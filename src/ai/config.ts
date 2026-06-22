const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const HUGGING_FACE_KEY = process.env.EXPO_PUBLIC_HF_API_KEY;

export const AI_CONFIG = {
  geminiApiKey: GEMINI_API_KEY,
  hfApiKey: HUGGING_FACE_KEY,

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