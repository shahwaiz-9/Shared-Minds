import { DocumentSource } from '../types';
import { getBase64FromSource, extractTextViaGemini } from './utils';

export async function extractTextFromImage(source: DocumentSource, mimeType: string = 'image/jpeg'): Promise<string> {
  try {
    const base64Data = await getBase64FromSource(source);
    let resolvedMime = mimeType;
    if (!resolvedMime || resolvedMime === 'unknown' || !resolvedMime.startsWith('image/')) {
      resolvedMime = 'image/jpeg';
    }

    return await extractTextViaGemini(
      base64Data,
      resolvedMime,
      'Perform OCR on this image. Extract all readable text exactly as written. Do not comment, transcribe non-text elements, or summarize.'
    );
  } catch (error: any) {
    console.error('Image OCR extraction failed:', error);
    throw new Error(`Image loader error: ${error.message || error}`);
  }
}
