import { DocumentSource } from '../types';
import { extractTextViaGemini, getBase64FromSource } from './utils';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function extractTextFromPDF(source: DocumentSource): Promise<string> {
  const prompt =
    'Extract all text from this PDF document. Output only the exact text found. Do not summarize or explain.';
  const maxAttempts = 3;

  try {
    const base64Pdf = await getBase64FromSource(source);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await extractTextViaGemini(base64Pdf, 'application/pdf', prompt);
      } catch (error: any) {
        const message = String(error?.message || error || '').toLowerCase();
        const isBusy = /busy|try again later|model.*busy|429|503|rate limit|server.*error/.test(message);

        console.warn(
          `[PDF Loader] Gemini attempt ${attempt} failed${isBusy ? ' (retrying)' : ''}:`,
          error,
        );

        if (attempt === maxAttempts || !isBusy) {
          throw error;
        }

        await delay(1000 * attempt);
      }
    }

    throw new Error('PDF loader error: Gemini extraction failed after 3 retries.');
  } catch (error: any) {
    console.error('PDF extraction failed:', error);
    throw new Error(`PDF loader error: ${error.message || error}`);
  }
}
