import { readAsStringAsync } from 'expo-file-system/legacy';
import { DocumentSource } from '../types';

export async function extractTextFromPlainText(source: DocumentSource): Promise<string> {
  try {
    if (source.type === 'local') {
      const content = await readAsStringAsync(source.uri, {
        encoding: 'utf8',
      });
      return content;
    } else {
      const response = await fetch(source.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch remote text file: ${response.statusText}`);
      }
      const text = await response.text();
      return text;
    }
  } catch (error: any) {
    console.error('Error in plaintext extraction:', error);
    throw new Error(`Plaintext extraction failed: ${error.message || error}`);
  }
}
