import { cacheDirectory, downloadAsync, readAsStringAsync } from 'expo-file-system/legacy';
import { convert } from 'react-native-pdf-to-image';
import { AI_CONFIG } from '../config';
import { DocumentSource } from '../types';

export async function getBase64FromSource(source: DocumentSource): Promise<string> {
  try {
    if (source.type === 'local') {
      return await readAsStringAsync(source.uri, {
        encoding: 'base64',
      });
    } else {
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch remote file: ${response.statusText}`);
      }
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            const resultString = reader.result as string;
            const base64 = resultString.split(',')[1];
            if (!base64) {
              reject(new Error('Failed to parse base64 from file reader'));
            } else {
              resolve(base64);
            }
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = () => reject(reader.error || new Error('Error reading blob'));
        reader.readAsDataURL(blob);
      });
    }
  } catch (error: any) {
    console.error('Error converting file to base64:', error);
    throw new Error(`Failed to read document binary data: ${error.message || error}`);
  }
}


// MARK: GEMINI MODEL 
export async function extractTextViaGemini(
  base64Data: string,
  mimeType: string,
  prompt: string = 'Extract all text from this document. Output only the exact text found. Do not summarize or explain.'
): Promise<string> {
  const apiKey = AI_CONFIG.geminiApiKey;
  console.log('[Gemini Extraction] API Key configured:', !!apiKey);
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.extraction.geminiModel}:generateContent?key=${apiKey}`;

  try {
    console.log('[Gemini Extraction] Sending request');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { raw: errorText };
      }
      console.error('[Gemini Extraction] Error response:', JSON.stringify(errorData));
      throw new Error(`Gemini API failed: ${response.status} ${response.statusText} (${JSON.stringify(errorData)})`);
    }

    const result = await response.json();
    const extractedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!extractedText) {
      throw new Error('Gemini returned an empty response or did not find any text.');
    }

    return extractedText.trim();
  } catch (error: any) {
    console.error('Error calling Gemini API for text extraction:', error);
    throw new Error(`Gemini extraction failed: ${error.message || error}`);
  }
}
