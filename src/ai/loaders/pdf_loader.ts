import { DocumentSource } from '../types';
import { extractTextViaGemini, getBase64FromSource } from './utils';

export async function extractTextFromPDF(source: DocumentSource): Promise<string> {
  try {
    const base64Data = await getBase64FromSource(source);
    return await extractTextViaGemini(
      base64Data,
      'application/pdf',
      'Read and extract all textual content from this PDF document. Provide the complete text exactly as it is formatted. Do not summarize or add comments.'
    );
  } catch (error: any) {
    console.error('PDF extraction failed:', error);
    throw new Error(`PDF loader error: ${error.message || error}`);
  }
}
