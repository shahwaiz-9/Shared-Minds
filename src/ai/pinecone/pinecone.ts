import { AI_CONFIG } from '../config';

export async function saveChunksToPinecone(subjectId: string, documentId: string, pipelineOutputChunks: any[]) {
    const { apiKey, hostUrl } = AI_CONFIG.pinecone;

    if (!apiKey || !hostUrl) {
        throw new Error('Pinecone credentials are missing. Verify EXPO_PUBLIC_PINECONE_API_KEY and HOST.');
    }
    const url = `${hostUrl}/vectors/upsert`;

    const expectedDimension = AI_CONFIG.embeddings.expectedDimension;
    const vectors = pipelineOutputChunks.map((chunk, index) => {
        if (expectedDimension && chunk.embedding.length !== expectedDimension) {
            throw new Error(`Embedding dimension mismatch for chunk ${index}: got ${chunk.embedding.length}, expected ${expectedDimension}.`);
        }

        return {
            id: `${subjectId}_${documentId}_chunk_${index}`,
            values: chunk.embedding,
            metadata: {
                subjectId,
                documentId,
                chunkIndex: index,
                text: chunk.text,
                fileType: chunk.metadata?.fileType,
                source: chunk.metadata?.source,
            },
        };
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Api-Key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ vectors }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Pinecone Upsert failed: ${response.statusText} (${errorText})`);
        }

        const result = await response.json();
        console.log(`[Pinecone Success] Stored ${result.upsertedCount || vectors.length} chunks into your vector database.`);
    } catch (error: any) {
        console.error('[Pinecone Error] Injection pipeline failed:', error);
        throw new Error(`Vector storage failed: ${error.message || error}`);
    }
}

export async function queryChunksFromPinecone(
    queryEmbedding: number[],
    subjectId: string,
    topK: number = 4
): Promise<{ text: string; source: string }[]> {
    const { apiKey, hostUrl } = AI_CONFIG.pinecone;

    if (!apiKey || !hostUrl) {
        throw new Error('Pinecone credentials are missing. Verify EXPO_PUBLIC_PINECONE_API_KEY and HOST.');
    }

    const url = `${hostUrl}/query`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Api-Key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                topK,
                includeMetadata: true,
                includeValues: false,
                vector: queryEmbedding,
                filter: { subjectId: { $eq: subjectId } },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Pinecone query failed: ${response.statusText} (${errorText})`);
        }

        const result = await response.json();
        return (result.matches || []).map((match: any) => ({
            text: String(match.metadata?.text || ''),
            source: String(match.metadata?.source || match.metadata?.documentId || 'Subject Document'),
        }));
    } catch (error: any) {
        console.error('[Pinecone Error] Query pipeline failed:', error);
        return [];
    }
}
