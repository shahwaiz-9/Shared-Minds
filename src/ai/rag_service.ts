import { supabase } from '../../supabase/supabaseClient';
import { embedQuery } from './embeddings/embeddings_service';
import { AI_CONFIG } from './config';
import { db } from '../firebase/auth/config';

interface RetrievalResult {
  text: string;
  source: string;
}

/**
 * Perform a keyword-based fallback search from subject documents in Firestore
 * if the vector search fails or table is not created.
 */
async function fallbackKeywordSearch(query: string, subjectId: string): Promise<RetrievalResult[]> {
  try {
    const snapshot = await db
      .collection('subjects')
      .doc(subjectId)
      .collection('documents')
      .get();

    const docs = snapshot.docs.map((d) => d.data());
    const matchedChunks: RetrievalResult[] = [];

    // Quick keyword matching search across all documents
    for (const doc of docs) {
      if (!doc.fileUrl) continue;
      try {
        const fileRes = await fetch(doc.fileUrl);
        if (!fileRes.ok) continue;
        const fileText = await fileRes.text();

        // Split text by paragraphs
        const paragraphs = fileText.split(/\n\s*\n/);
        const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

        for (const paragraph of paragraphs) {
          const cleanParagraph = paragraph.trim();
          if (cleanParagraph.length < 20) continue;

          // Score based on term frequency
          let score = 0;
          for (const term of queryTerms) {
            if (cleanParagraph.toLowerCase().includes(term)) {
              score++;
            }
          }

          if (score > 0) {
            matchedChunks.push({
              text: cleanParagraph,
              source: doc.fileName || 'Subject Document',
            });
          }
        }
      } catch (err) {
        console.warn('Failed to parse doc for fallback RAG:', doc.fileName, err);
      }
    }

    return matchedChunks.slice(0, 4);
  } catch (error) {
    console.error('Fallback search error:', error);
    return [];
  }
}

/**
 * Vector similarity search querying the Supabase pgvector database via RPC.
 */
async function vectorSearch(
  queryEmbedding: number[],
  subjectId: string,
  matchCount: number = 4
): Promise<RetrievalResult[]> {
  try {
    // Standard Supabase RPC pgvector match query
    const { data, error } = await supabase.rpc('match_document_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: matchCount,
      filter_subject_id: subjectId,
    });

    if (error) {
      console.warn('Supabase RPC vector search failed (falling back to keyword search):', error.message);
      return [];
    }

    return (data || []).map((row: any) => ({
      text: row.content || '',
      source: row.source_name || 'Document Chunk',
    }));
  } catch (err) {
    console.warn('Vector search exception (falling back to keyword search):', err);
    return [];
  }
}

/**
 * Invokes the RAG pipeline:
 * 1. Embed query -> 2. Retrieve matches (Vector or Keyword fallback) -> 3. Form system context -> 4. Call Gemini
 */
export async function getRAGResponse(
  query: string,
  subjectId: string,
  chatHistory: { role: 'user' | 'model'; parts: string[] }[] = []
): Promise<string> {
  let contextChunks: RetrievalResult[] = [];

  try {
    // 1. Get embedding representation of query
    const queryEmbedding = await embedQuery(query);

    // 2. Query vector store
    contextChunks = await vectorSearch(queryEmbedding, subjectId);
  } catch (err) {
    console.warn('Failed to embed query, using keyword fallback search:', err);
  }

  // 3. Fallback search if vector returned nothing or failed
  if (contextChunks.length === 0) {
    contextChunks = await fallbackKeywordSearch(query, subjectId);
  }

  // 4. Form context window text
  const contextText = contextChunks
    .map((chunk, idx) => `[Document Context ${idx + 1}] (${chunk.source}):\n${chunk.text}`)
    .join('\n\n');

  // System instructions restricting knowledge boundary to subject documents
  const systemPrompt = `You are a helpful AI assistant for the subject course study space.
You must help the student answer their queries using only the document context provided below.
If the answer cannot be found in the context documents, reply saying: "I'm sorry, I couldn't find information about that in the uploaded subject resources. Please upload additional materials or double-check the topic!"
Avoid guessing or referring to outside details. Keep answers concise, factual, and strictly aligned with the context.

---
DOCUMENT CONTEXT:
${contextText || 'No context files uploaded yet for this subject.'}
`;

  // 5. Send payload to Gemini 1.5 Flash-Lite
  const apiKey = AI_CONFIG.geminiApiKey;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const contentsArray = [
    ...chatHistory,
    {
      role: 'user' as const,
      parts: [{ text: query }],
    },
  ];

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: contentsArray,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.json().catch(() => ({}));
      throw new Error(`Gemini API returned error: ${response.statusText} (${JSON.stringify(errorResponse)})`);
    }

    const resJson = await response.json();
    const reply = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      throw new Error('Empty response from Gemini.');
    }

    return reply.trim();
  } catch (error: any) {
    console.error('RAG Service failed to generate reply:', error);
    throw new Error(`RAG Pipeline error: ${error.message || error}`);
  }
}
