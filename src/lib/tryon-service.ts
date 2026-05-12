/**
 * Gemini Virtual Try-On Service
 * Migrated from fit-check app with correct model: gemini-2.5-flash-image
 */
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const getApiKey = () => {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
};

// ==================== Utility Functions ====================

const dataUrlToParts = (dataUrl: string) => {
  const arr = dataUrl.split(",");
  if (arr.length < 2) throw new Error("Invalid data URL");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || !mimeMatch[1])
    throw new Error("Could not parse MIME type from data URL");
  return { mimeType: mimeMatch[1], data: arr[1] };
};

const dataUrlToPart = (dataUrl: string) => {
  const { mimeType, data } = dataUrlToParts(dataUrl);
  return { inlineData: { mimeType, data } };
};

const fileToPart = async (file: File) => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
  const { mimeType, data } = dataUrlToParts(dataUrl);
  return { inlineData: { mimeType, data } };
};

const handleApiResponse = (response: GenerateContentResponse): string => {
  for (const candidate of response.candidates ?? []) {
    if (candidate.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          const { mimeType, data } = part.inlineData;
          return `data:${mimeType};base64,${data}`;
        }
      }
    }
  }

  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== "STOP") {
    throw new Error(`Generation stopped. Reason: ${finishReason}.`);
  }

  const textFeedback = response.text?.trim();
  throw new Error(
    `The model did not return an image. ${
      textFeedback
        ? `Response: "${textFeedback}"`
        : "Try using a higher quality image."
    }`
  );
};

const urlToDataUrl = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Wraps Gemini API calls with user-friendly error messages
 */
const withFriendlyErrors = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Quota / rate limit
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      throw new Error(
        "Gemini API ki free quota khatam ho gayi hai. Thodi der baad dobara try karein ya apna API plan upgrade karein."
      );
    }
    // Auth
    if (msg.includes("401") || msg.includes("403") || msg.includes("API_KEY")) {
      throw new Error("Gemini API key invalid hai. Admin se contact karein.");
    }
    // Safety filter
    if (msg.includes("SAFETY") || msg.includes("blocked")) {
      throw new Error(
        "Image safety filters ki wajah se block ho gayi. Doosri photo try karein."
      );
    }
    // Network
    if (msg.includes("fetch") || msg.includes("network") || msg.includes("ECONNREFUSED")) {
      throw new Error("Network error — internet connection check karein.");
    }
    throw err;
  }
};

// ==================== Service Functions ====================

/**
 * Generate a model image from user's uploaded photo
 * Creates a clean studio-style photo suitable for try-on
 */
export const generateModelImage = async (
  userImage: File
): Promise<string> => withFriendlyErrors(async () => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const userImagePart = await fileToPart(userImage);

  const prompt = `You are an expert fashion photographer AI. Transform the person in this image into a full-body fashion model photo suitable for an e-commerce website. The background must be a clean, neutral studio backdrop (light gray, #f0f0f0). The person should have a neutral, professional model expression. Preserve the person's identity, unique features, and body type, but place them in a standard, relaxed standing model pose. The final image must be photorealistic. Return ONLY the final image.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: { parts: [userImagePart, { text: prompt }] },
  });

  return handleApiResponse(response);
});

/**
 * Virtual Try-On: Place a garment on the user's photo
 * This is the core try-on function
 */
export const generateVirtualTryOn = async (
  modelImageUrl: string,
  garmentImageSource: File | string
): Promise<string> => withFriendlyErrors(async () => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const modelImagePart = dataUrlToPart(modelImageUrl);

  let garmentImagePart;
  if (typeof garmentImageSource === "string") {
    // It's a URL - convert to data URL first
    const garmentDataUrl = await urlToDataUrl(garmentImageSource);
    garmentImagePart = dataUrlToPart(garmentDataUrl);
  } else {
    garmentImagePart = await fileToPart(garmentImageSource);
  }

  const prompt = `You are an expert virtual try-on AI. You will be given a 'model image' and a 'garment image'. Your task is to create a new photorealistic image where the person from the 'model image' is wearing the clothing from the 'garment image'.

**Crucial Rules:**
1. **Complete Garment Replacement:** You MUST completely REMOVE and REPLACE the clothing item worn by the person in the 'model image' with the new garment. No part of the original clothing should be visible.
2. **Preserve the Model:** The person's face, hair, body shape, and pose MUST remain unchanged.
3. **Preserve the Background:** The entire background MUST be preserved perfectly.
4. **Apply the Garment:** Realistically fit the new garment with natural folds, shadows, and lighting.
5. **Face Realism:** The face MUST remain completely unchanged - same expression, lighting, and details.
6. **Output:** Return ONLY the final edited image.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [modelImagePart, garmentImagePart, { text: prompt }],
    },
  });

  return handleApiResponse(response);
});

/**
 * Generate a pose variation of a try-on result
 */
export const generatePoseVariation = async (
  tryOnImageUrl: string,
  poseInstruction: string
): Promise<string> => withFriendlyErrors(async () => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const tryOnImagePart = dataUrlToPart(tryOnImageUrl);

  const prompt = `You are an expert fashion photographer AI. Take this image and regenerate it from a different perspective. The person, clothing, and background style must remain identical. The new perspective should be: "${poseInstruction}". Return ONLY the final image.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: { parts: [tryOnImagePart, { text: prompt }] },
  });

  return handleApiResponse(response);
});

/**
 * Generate a color variant of a garment
 */
export const generateGarmentVariant = async (
  garmentImageUrl: string,
  colorDescription: string
): Promise<string> => withFriendlyErrors(async () => {
  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const garmentPart = dataUrlToPart(garmentImageUrl);

  const prompt = `You are a fashion design AI. Take this clothing item and change its color to a stylish and realistic ${colorDescription}. Keep the exact texture, fabric, style, and lighting of the original. Return ONLY the new garment image.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: { parts: [garmentPart, { text: prompt }] },
  });

  return handleApiResponse(response);
});
