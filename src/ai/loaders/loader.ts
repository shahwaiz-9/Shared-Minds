import { DocumentSource } from '../types';
import { extractTextFromPlainText } from './text_loader';
import { extractTextFromPDF } from './pdf_loader';
import { extractTextFromWord } from './word_loader';
import { extractTextFromImage } from './image_loader';


export async function extractText(source: DocumentSource, fileType: string): Promise<string> {

  const normalizedType = fileType.toLowerCase().trim();

  // Resolve source details for error logging
  const sourceName = source.type === 'local' ? source.uri : source.url;

  if (!sourceName) {
    throw new Error('Invalid document source: URI/URL is empty.');
  }


  const isPdf = normalizedType.includes('pdf') || sourceName.endsWith('.pdf');
  const isWord =
    normalizedType.includes('word') ||
    normalizedType.includes('docx') ||
    normalizedType.includes('doc') ||
    sourceName.endsWith('.docx') ||
    sourceName.endsWith('.doc');
  const isImage =
    normalizedType.includes('image') ||
    normalizedType.includes('png') ||
    normalizedType.includes('jpg') ||
    normalizedType.includes('jpeg') ||
    normalizedType.includes('webp') ||
    /\.(png|jpg|jpeg|webp|gif|heic|heif)$/i.test(sourceName);
  const isText =
    normalizedType.includes('text') ||
    normalizedType.includes('txt') ||
    normalizedType.includes('md') ||
    sourceName.endsWith('.txt') ||
    sourceName.endsWith('.md');

  try {
    if (isPdf) {
      return await extractTextFromPDF(source);
    } else if (isWord) {
      return await extractTextFromWord(source);
    } else if (isImage) {
      // Find mime type if remote or use default image/jpeg
      let mimeType = 'image/jpeg';
      if (sourceName.endsWith('.png')) mimeType = 'image/png';
      if (sourceName.endsWith('.webp')) mimeType = 'image/webp';
      return await extractTextFromImage(source, mimeType);
    } else if (isText) {
      return await extractTextFromPlainText(source);
    } else {
      // Default fallback is to try plaintext reading
      console.warn(`Unknown file type: "${fileType}". Falling back to plain text extraction.`);
      return await extractTextFromPlainText(source);
    }
  } catch (error: any) {
    console.error(`Extraction failed for source type "${fileType}":`, error);
    throw new Error(`Failed to extract text from ${source.type} file: ${error.message || error}`);
  }
}
