import { DocumentSource } from '../types';
import { getBase64FromSource, extractTextViaGemini } from './utils';

export async function extractTextFromWord(source: DocumentSource): Promise<string> {
  try {
    const base64Data = await getBase64FromSource(source);
    return await extractTextViaGemini(
      base64Data,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Read and extract all text content from this Microsoft Word document. Output the full text exactly as it is formatted inside the document without summarizing or adding commentary.'
    );
  } catch (error: any) {
    console.error('Word document extraction failed:', error);
    throw new Error(`Word loader error: ${error.message || error}`);
  }
}
