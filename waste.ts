// // MARK: HUGGING FACE MODEL
// export async function listHFModels(): Promise<any> {
//   const apiKey = AI_CONFIG.hfApiKey;
//   if (!apiKey) {
//     throw new Error('Hugging Face API key is not configured.');
//   }

//   const url = 'https://router.huggingface.co/v1/models';

//   console.log('[HF Debug] Fetching available models...');
//   try {
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         'Authorization': `Bearer ${apiKey}`,
//       },
//     });

//     console.log('[HF Debug] List models status:', response.status, response.statusText);

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('[HF Debug] List models error:', errorText);
//       throw new Error(`Failed to list models: ${response.status} ${response.statusText}`);
//     }

//     const result = await response.json();
//     console.log('[HF Debug] Available models:', JSON.stringify(result, null, 2));
//     return result;
//   } catch (error: any) {
//     console.error('[HF Debug] Error listing models:', error);
//     throw error;
//   }
// }

// // Extract text from array of base64 images using Hugging Face
// export async function extractTextViaHuggingFaceFromImages(
//   base64Images: string[],
//   mimeType: string = 'image/png',
//   prompt: string = 'Extract all text from this document page. Output only the exact text found. Do not summarize or explain.'
// ): Promise<string> {
//   const apiKey = AI_CONFIG.hfApiKey;
//   if (!apiKey) {
//     throw new Error('Hugging Face API key is not configured.');
//   }

//   console.log('[HF Extraction] Starting extraction from', base64Images.length, 'images');
//   console.log('[HF Extraction] Model:', AI_CONFIG.extraction.hfModel);

//   const url = 'https://router.huggingface.co/v1/chat/completions';
//   console.log('[HF Extraction] Request URL:', url);

//   try {
//     let fullExtractedText = '';

//     for (let i = 0; i < base64Images.length; i++) {
//       console.log(`[HF Extraction] Processing page ${i + 1}/${base64Images.length}`);

//       // Clean up base64 metadata to ensure standard compliance
//       let cleanBase64 = base64Images[i].replace(/^data:image\/\w+;base64,/, "");
//       const dataUrl = `data:${mimeType};base64,${cleanBase64}`;

//       const payload = {
//         model: AI_CONFIG.extraction.hfModel,
//         messages: [
//           {
//             role: 'user',
//             content: [
//               { type: 'text', text: prompt },
//               { type: 'input_image', image_url: { url: dataUrl } },
//             ],
//           },
//         ],
//         max_tokens: 2048,
//       };

//       console.log(`[HF Extraction] Payload for page ${i + 1}:`, JSON.stringify(payload).slice(0, 2000));

//       const response = await fetch(url, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${apiKey}`,
//           'Content-Type': 'application/json',
//           'Accept': 'application/json',
//         },
//         body: JSON.stringify(payload),
//       });

//       console.log(`[HF Extraction] Response for page ${i + 1}:`, response.status, response.statusText);

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error(`[HF Extraction] Error for page ${i + 1}:`, errorText);

//         let errorData;
//         try {
//           errorData = JSON.parse(errorText);
//         } catch {
//           errorData = { raw: errorText };
//         }

//         throw new Error(`Hugging Face API failed for page ${i + 1}: ${response.status} ${response.statusText} (${JSON.stringify(errorData)})`);
//       }

//       const result = await response.json();
//       const pageText =
//         result?.generated_text?.trim() ||
//         result?.choices?.[0]?.message?.content?.trim() ||
//         result?.output?.[0]?.data?.[0]?.text?.trim() ||
//         result?.output?.[0]?.generated_text?.trim() ||
//         '';
//       console.log(`[HF Extraction] Extracted from page ${i + 1}:`, pageText);

//       fullExtractedText += (fullExtractedText ? '\n\n' : '') + pageText;
//     }

//     return fullExtractedText;
//   } catch (error: any) {
//     console.error('[HF Extraction] Error object:', error);
//     try {
//       console.error('[HF Extraction] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
//     } catch (jsonError) {
//       console.error('[HF Extraction] Failed to stringify error:', jsonError);
//     }
//     throw new Error(`Hugging Face extraction failed: ${error?.message || String(error)}`);
//   }
// }



// // Original HF function (kept for reference)
// export async function extractTextViaHuggingFace(
//   base64Data: string,
//   mimeType: string,
//   prompt: string = 'Extract all text from this document. Output only the exact text found. Do not summarize or explain.'
// ): Promise<string> {
//   return extractTextViaHuggingFaceFromImages([base64Data], mimeType, prompt);
// }




// Convert PDF file (local or remote) to array of base64 images
// export async function convertPDFToImages(source: DocumentSource): Promise<string[]> {
//   try {
//     let pdfUri: string;
//     if (source.type === 'remote') {
//       // Download remote PDF to cache
//       const fileName = `temp-pdf-${Date.now()}.pdf`;
//       const cachePath = `${cacheDirectory}${fileName}`;
//       console.log('[PDF Converter] Downloading remote PDF to:', cachePath);
//       const downloadResult = await downloadAsync(source.url, cachePath);
//       pdfUri = downloadResult.uri;
//       console.log('[PDF Converter] Downloaded PDF:', pdfUri);
//     } else {
//       pdfUri = source.uri;
//     }

//     // Convert PDF to images
//     console.log('[PDF Converter] Converting PDF to images...');
//     const result = await convert(pdfUri);
//     const outputFiles = result.outputFiles || [];
//     console.log('[PDF Converter] Generated', outputFiles.length, 'page images');

//     // Convert each image file to base64
//     const base64Images: string[] = [];
//     for (const imagePath of outputFiles) {
//       try {
//         // Ensure the path has the 'file://' scheme
//         const imageUri = imagePath.startsWith('file://')
//           ? imagePath
//           : `file://${imagePath}`;
//         console.log('[PDF Converter] Reading image from:', imageUri);

//         const base64 = await readAsStringAsync(imageUri, { encoding: 'base64' });
//         base64Images.push(base64);
//       } catch (pageError: any) {
//         console.error('[PDF Converter] Error reading page image:', pageError);
//         // Continue with other pages even if one fails
//       }
//     }

//     return base64Images;
//   } catch (error: any) {
//     console.error('[PDF Converter] Error converting PDF to images:', error);
//     throw new Error(`Failed to convert PDF to images: ${error.message || error}`);
//   }
// }

