import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
};

const parseDataUrl = (dataUrl: string) => {
  const arr = dataUrl.split(",");
  if (arr.length < 2) throw new Error("Invalid data URL");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch?.[1]) throw new Error("Could not parse MIME type");
  return { mimeType: mimeMatch[1], data: arr[1] };
};

async function generateImage(parts: Array<Record<string, unknown>>): Promise<string> {
  // Try models in order until one works
  const attempts = [
    { model: "gemini-2.5-flash-image", version: "v1alpha" },
    { model: "gemini-2.0-flash-preview-image-generation", version: "v1beta" },
  ];

  let lastError = "";
  for (const { model, version } of attempts) {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY()}`;
    const body = {
      contents: [{ role: "user", parts }],
      generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (!res.ok) {
        lastError = json?.error?.message || `API error ${res.status}`;
        continue; // try next model
      }

      for (const candidate of json.candidates ?? []) {
        for (const part of candidate?.content?.parts ?? []) {
          if (part.inlineData?.data) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }

      const reason = json.candidates?.[0]?.finishReason;
      if (reason && reason !== "STOP") {
        lastError = `Generation stopped: ${reason}. Try a clearer photo with good lighting.`;
        continue;
      }
      lastError = "Model did not return an image.";
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Network error";
    }
  }

  throw new Error(lastError || "All models failed. Try a different photo.");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, modelImage, garmentImage, image, poseInstruction, colorDescription } = body;

    let result: string;

    switch (action) {
      case "generateModel": {
        if (!image) return NextResponse.json({ error: "image is required" }, { status: 400 });
        const { mimeType, data } = parseDataUrl(image);
        result = await generateImage([
          { inlineData: { mimeType, data } },
          { text: "This is a fashion product image. Show a realistic male model wearing this clothing item. Clean studio background, full body shot, photorealistic. Return ONLY the image." },
        ]);
        break;
      }
      case "tryOn": {
        if (!modelImage || !garmentImage) {
          return NextResponse.json({ error: "modelImage and garmentImage are required" }, { status: 400 });
        }
        const m = parseDataUrl(modelImage);
        const g = parseDataUrl(garmentImage);
        result = await generateImage([
          { inlineData: { mimeType: m.mimeType, data: m.data } },
          { inlineData: { mimeType: g.mimeType, data: g.data } },
          { text: "Virtual try-on: dress the person in the first image with the clothing from the second image. Keep face, hair, body shape and background unchanged. Realistic fabric, lighting and fit. Return ONLY the resulting image." },
        ]);
        break;
      }
      case "poseVariation": {
        if (!image || !poseInstruction) {
          return NextResponse.json({ error: "image and poseInstruction are required" }, { status: 400 });
        }
        const { mimeType, data } = parseDataUrl(image);
        result = await generateImage([
          { inlineData: { mimeType, data } },
          { text: `Show this same outfit from this angle: "${poseInstruction}". Keep all clothing, style and person identical. Return ONLY the image.` },
        ]);
        break;
      }
      case "colorVariant": {
        if (!image || !colorDescription) {
          return NextResponse.json({ error: "image and colorDescription are required" }, { status: 400 });
        }
        const { mimeType, data } = parseDataUrl(image);
        result = await generateImage([
          { inlineData: { mimeType, data } },
          { text: `Change the clothing color to ${colorDescription}. Keep texture, fabric, style and lighting identical. Return ONLY the image.` },
        ]);
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, image: result });
  } catch (error) {
    console.error("Try-on API error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Try-on generation failed" },
      { status: 500 }
    );
  }
}
