import { GoogleGenAI } from "@google/genai";
import { UploadedImage, AspectRatio } from "../types";

// Initialize Gemini Client
// IMPORTANT: The API key must be available in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash-image';

/**
 * Generates an image based on a text prompt using Gemini 2.5 Flash Image.
 */
export const generateImageFromText = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
            aspectRatio: aspectRatio,
        }
      }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Error generating image from text:", error);
    throw error;
  }
};

/**
 * Transforms an existing image based on a text prompt (Image-to-Image).
 */
export const generateImageFromImage = async (
  sourceImage: UploadedImage, 
  prompt: string,
  aspectRatio: AspectRatio
): Promise<string> => {
  try {
    // Remove the data URL prefix (e.g., "data:image/jpeg;base64,") to get raw base64
    const base64Data = sourceImage.base64.split(',')[1];

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: sourceImage.mimeType,
              data: base64Data,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        imageConfig: {
            aspectRatio: aspectRatio,
        }
      }
    });

    return extractImageFromResponse(response);
  } catch (error) {
    console.error("Error generating image from image:", error);
    throw error;
  }
};

// Helper to extract the base64 image string from the Gemini response structure
const extractImageFromResponse = (response: any): string => {
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("No candidates returned from Gemini.");
  }

  const parts = response.candidates[0].content.parts;
  
  // Iterate to find the image part
  for (const part of parts) {
    if (part.inlineData) {
      const base64EncodeString = part.inlineData.data;
      // We assume PNG usually, but the API returns data. We construct a usable src.
      // Note: Gemini usually returns image/png or image/jpeg. 
      // We can check mimeType from response if needed, but adding a general header works for <img> src.
      return `data:image/png;base64,${base64EncodeString}`;
    }
  }

  throw new Error("No image data found in the response.");
};

// Helper to convert File to Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};