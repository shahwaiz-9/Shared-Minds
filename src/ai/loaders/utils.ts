import { readAsStringAsync } from 'expo-file-system/legacy';
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
  prompt: string = 'Extract all text from this document. Output only the exact text found. Do not summarize, explain, or add comments.'
): Promise<string> {

  const apiKey = AI_CONFIG.geminiApiKey;
  console.log(apiKey)
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.extraction.geminiModel}:generateContent?key=${apiKey}`;

  try {
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Gemini API request failed: ${response.statusText} (${JSON.stringify(errorData)})`
      );
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


// MARK: HUGGING FACE MODEL

// export async function extractTextViaHuggingFace(
//   base64Data: string,
//   mimeType: string,
//   prompt: string = 'Extract all text from this document. Output only the exact text found. Do not summarize, explain, or add comments.'
// ): Promise<string> {
//   const apiKey = AI_CONFIG.hfApiKey;
//   if (!apiKey) {
//     throw new Error('Hugging Face API key is not configured. Please set EXPO_PUBLIC_HF_API_KEY.');
//   }

//   // Hugging Face standard serverless chat completion URL
//   const url = `https://api-inference.huggingface.co/models/${AI_CONFIG.extraction.hfModel}/v1/chat/completions`;

//   // Format the base64 string into a standard Data URL layout
//   const dataUrl = `data:${mimeType};base64,${base64Data}`;

//   try {
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${apiKey}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         messages: [
//           {
//             role: 'user',
//             content: [
//               {
//                 type: 'text',
//                 text: prompt,
//               },
//               {
//                 type: 'image_url',
//                 image_url: {
//                   url: dataUrl,
//                 },
//               },
//             ],
//           },
//         ],
//         max_tokens: 1024,
//       }),
//     });

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       throw new Error(
//         `Hugging Face API failed: ${response.statusText} (${JSON.stringify(errorData)})`
//       );
//     }

//     const result = await response.json();
//     const extractedText = result?.choices?.[0]?.message?.content;

//     if (!extractedText) {
//       throw new Error('Hugging Face returned an empty response.');
//     }

//     return extractedText.trim();
//   } catch (error: any) {
//     console.error('Error calling Hugging Face API for extraction:', error);
//     throw new Error(`Hugging Face extraction failed: ${error.message || error}`);
//   }
// }