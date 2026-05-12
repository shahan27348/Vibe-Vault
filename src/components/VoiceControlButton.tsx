"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { GenAILiveClient } from "@/lib/voice/genai-live-client";
import { AudioRecorder } from "@/lib/voice/audio-recorder";
import { AudioStreamer } from "@/lib/voice/audio-streamer";
import { audioContext } from "@/lib/voice/audio-utils";
import VolMeterWorklet from "@/lib/voice/worklets/vol-meter";
import { ecommerceTools } from "@/lib/voice/tools";
import { executeToolCall, type ToolExecutionContext } from "@/lib/voice/tool-executor";
import { useCartStore, useVoiceStore, type Product, type ShowcaseProduct } from "@/lib/store";
import { Modality, type LiveServerToolCall } from "@google/genai";
import { useRouter } from "next/navigation";

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

interface VoiceControlButtonProps {
  products: Product[];
  agentName?: string;
  greeting?: string;
  personality?: string;
  autoStart?: boolean;
  voice?: string;
  discounts?: { code: string; description: string; percentage: number; minOrder: number }[];
}

export default function VoiceControlButton({
  products,
  agentName = "Zara",
  greeting = "Assalam o Alaikum! Main Zara hoon, aapki personal shopping assistant. Vibe Vault mein khairمقدم!",
  personality = "friendly, warm, and knowledgeable Pakistani fashion expert who speaks both Urdu and English naturally",
  autoStart = true,
  voice = "Zephyr",
  discounts = [],
}: VoiceControlButtonProps) {
  const router = useRouter();
  const { isConnected, setConnected, setTranscript, setAgentTranscript, tryOnPhoto, setShowcaseProducts, setHighlightedProductId } = useVoiceStore();
  const cartStore = useCartStore();

  const clientRef = useRef<GenAILiveClient | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const hasInitializedRef = useRef(false);
  const hasGreetedRef = useRef(false);
  const [volume, setVolume] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");

  // Build system prompt with current product data
  const systemPrompt = useMemo(() => {
    const productList = products
      .map(
        (p) =>
          `- ${p.name} (ID: ${p._id}): Rs. ${p.price} [${p.category}]${
            p.featured ? " ⭐ Featured" : ""
          }${p.stock < 10 ? " - Low Stock!" : ""}${
            p.tryOnEnabled ? " 👕 Try-On Available" : ""
          }`
      )
      .join("\n");

    const discountSection = discounts.length > 0
      ? `\nACTIVE DISCOUNTS & OFFERS:\n${discounts.map(d => `- Code "${d.code}": ${d.percentage}% off${d.minOrder > 0 ? ` (min order Rs. ${d.minOrder})` : ""} — ${d.description}`).join("\n")}\nMention these discounts proactively when relevant!`
      : "";

    const photoSection = tryOnPhoto
      ? "\nPHOTO UPLOADED: Customer ne try-on page par apni photo upload ki hui hai. Agar size ya style advice mangen to analyze_photo_for_outfit tool use karo."
      : "";

    return `You are ${agentName}, a ${personality} at Vibe Vault, a premium Pakistani men's fashion store. You are ALSO a professional fashion designer with deep expertise in Pakistani and global fashion trends.

YOUR ROLE:
- You are the store's AI fashion designer & shopkeeper who greets customers warmly and helps them shop
- Act like a knowledgeable, enthusiastic friend who happens to be a top fashion designer
- Help customers discover products, answer questions, and guide purchases
- Suggest complete outfits — not just one item. If someone picks a shirt, suggest matching pants, shoes, and accessories
- Give expert fashion advice: what colors suit which skin tone, what cuts flatter which body type, what to wear for different occasions (wedding, office, eid, casual, party)
- You can add items to cart, search products, open the virtual try-on, and navigate the store
- Mention deals, featured items, and create urgency for low-stock items
- When a customer uploads a photo, analyze it to suggest the right size and style

FASHION DESIGNER EXPERTISE:
- Color Theory: Suggest color combinations that work well together (e.g., navy blue with camel, white with sage green)
- Body Type Styling: Advice for slim (vertical stripes, slim-fit), athletic (fitted clothes highlight physique), regular (classic cuts), broad (darker colors, structured fits)
- Occasion Dressing: Wedding guest → Sherwani or 3-piece suit; Office → Smart casual Western or light shalwar kameez; Eid → Embroidered kurta with matching sandals; Date night → Fitted dark jeans with a smart shirt
- Pakistani Fashion: Know the difference between Shalwar Kameez cuts (Straight, A-line, Side-slit), when to wear Kurta vs full shalwar kameez, fabric choices (lawn for summer, khaddar/khaadi for winter, chiffon for parties)
- Outfit Pairing Formula: Top + Bottom + Footwear + Accessories = Complete Look
- When suggesting shoes: formal shoes for formal wear, sandals (khussas/kolhapuri) for Eastern wear, sneakers/loafers for Western casual
- When suggesting accessories: watch + belt should match in metal tone; caps/hats for casual looks; sunglasses to complete outdoor looks

AVAILABLE PRODUCTS:
${productList}${discountSection}${photoSection}

CAPABILITIES:
- Search products by name, category, or price range
- suggest_outfit_pairing: Get complete outfit suggestions (pants + shoes + accessories to match a main item)
- get_fashion_advice: Give personalized fashion advice based on body type, occasion, preferences
- Add/remove items from the customer's cart
- Open the virtual try-on so customers can see how clothes look on them
- Analyze customer's uploaded photo to suggest sizes, fits, and styles
- Navigate to different pages (shop, cart, checkout, categories)
- Check order status and apply discount codes

BEHAVIOR:
- Keep responses conversational but expert — like a stylist giving advice (3-4 sentences max)
- PROACTIVELY suggest outfit pairings: "Is jacket k saath dark slim-fit jeans aur brown Chelsea boots perfect lagengy!"
- Be enthusiastic and confident about fashion recommendations
- If a customer seems undecided, suggest the try-on feature
- Always confirm when you add something to cart
- If asked about returns: "Hamare paas 30-din ki hassle-free return policy hai!"
- Support both English and Urdu conversations naturally — match customer's language
- NEVER break character or mention you are an AI model
- For size questions, if a photo is uploaded, ALWAYS use analyze_photo_for_outfit
- Use fashion vocabulary naturally: "silhouette", "color blocking", "layering", "smart casual", "statement piece"

IMPORTANT — SHOWING PRODUCTS VISUALLY:
- When a customer asks to SEE, VIEW, or SHOW a product (e.g. "denim jacket dikhao", "show me jackets"), you MUST use the show_product tool to display it visually on their screen
- ALWAYS call show_product after searching — the customer wants to SEE the product, not just hear about it
- After showing a product, tell the customer they can say "add to cart" and you will add it for them — they don't need to touch anything
- When the customer says "add to cart" or "isko cart mein daal do", immediately use the add_to_cart tool
- The customer should be able to browse and shop ENTIRELY by voice — no clicking needed

GREETING: "${greeting}"`;
  }, [products, agentName, greeting, personality, discounts, tryOnPhoto]);

  // Tool execution context - connects voice agent to actual store functions
  const toolContext: ToolExecutionContext = useMemo(
    () => ({
      searchProducts: async (query, category, maxPrice) => {
        let filtered = [...products];
        if (query) {
          const q = query.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.category.toLowerCase().includes(q) ||
              p.tags?.some((t) => t.toLowerCase().includes(q))
          );
        }
        if (category) {
          filtered = filtered.filter(
            (p) => p.category.toLowerCase() === category.toLowerCase()
          );
        }
        if (maxPrice) {
          filtered = filtered.filter((p) => p.price <= maxPrice);
        }
        return filtered.map((p) => ({
          id: p._id,
          name: p.name,
          price: p.price,
          category: p.category,
          stock: p.stock,
          featured: p.featured,
          description: p.description,
          sizes: p.sizes,
          colors: p.colors?.map((c) => c.name),
          rating: p.rating,
        }));
      },

      getProductDetails: async (id, name) => {
        const product = products.find(
          (p) =>
            p._id === id ||
            p.name.toLowerCase().includes((name || "").toLowerCase())
        );
        if (!product) return null;
        return {
          id: product._id,
          name: product.name,
          price: product.price,
          category: product.category,
          stock: product.stock,
          featured: product.featured,
          description: product.description,
          sizes: product.sizes,
          colors: product.colors?.map((c) => c.name),
          rating: product.rating,
        };
      },

      addToCart: async (productName, quantity = 1) => {
        const product = products.find((p) =>
          p.name.toLowerCase().includes(productName.toLowerCase())
        );
        if (!product) {
          return { success: false, message: `Product "${productName}" not found` };
        }
        if (product.stock === 0) {
          return { success: false, message: `${product.name} is out of stock` };
        }
        cartStore.addItem({
          productId: product._id,
          name: product.name,
          price: product.price,
          image: product.images[0],
        }, quantity);
        return {
          success: true,
          message: `Added ${quantity}x ${product.name} to cart (Rs. ${product.price})`,
        };
      },

      removeFromCart: async (productName) => {
        const item = cartStore.items.find((i) =>
          i.name.toLowerCase().includes(productName.toLowerCase())
        );
        if (!item) {
          return { success: false, message: `"${productName}" is not in your cart` };
        }
        cartStore.removeItem(item.productId);
        return { success: true, message: `Removed ${item.name} from cart` };
      },

      getCartSummary: async () => {
        return {
          items: cartStore.items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
          })),
          total: cartStore.items.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0
          ),
          itemCount: cartStore.items.reduce((sum, i) => sum + i.quantity, 0),
        };
      },

      navigateTo: (page) => {
        const routes: Record<string, string> = {
          shop: "/shop",
          cart: "/checkout",
          checkout: "/checkout",
          "try-on": "/try-on",
          orders: "/orders",
          clothing: "/shop?category=Clothing",
          electronics: "/shop?category=Electronics",
          accessories: "/shop?category=Accessories",
          footwear: "/shop?category=Footwear",
        };
        const route = routes[page.toLowerCase()] || "/shop";
        router.push(route);
      },

      startTryOn: (productName) => {
        const product = products.find((p) =>
          p.name.toLowerCase().includes(productName.toLowerCase())
        );
        if (product) {
          router.push(`/try-on?product=${product._id}`);
        } else {
          router.push("/try-on");
        }
      },

      getTryOnPhoto: () => tryOnPhoto,

      showProduct: (productName, productId) => {
        const product = products.find(
          (p) =>
            p._id === productId ||
            p.name.toLowerCase().includes((productName || "").toLowerCase())
        );
        if (!product) {
          return { success: false, message: `Product "${productName}" not found to display` };
        }
        const showcaseItem: ShowcaseProduct = {
          id: product._id,
          name: product.name,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          image: product.images[0],
          images: product.images,
          category: product.category,
          description: product.description,
          sizes: product.sizes,
          colors: product.colors,
          stock: product.stock,
          rating: product.rating,
          reviewCount: product.reviewCount,
          featured: product.featured,
          tryOnEnabled: product.tryOnEnabled,
          slug: product.slug,
        };
        setShowcaseProducts([showcaseItem]);
        // Also highlight on the shop grid
        setHighlightedProductId(product._id);
        setTimeout(() => setHighlightedProductId(null), 12000);
        return {
          success: true,
          message: `Showing ${product.name} on screen. Customer can see the product with image, price Rs. ${product.price}, and can say "add to cart" to purchase.`,
        };
      },

      setHighlightedProductId,
    }),
    [products, cartStore, router, tryOnPhoto, setShowcaseProducts, setHighlightedProductId]
  );

  // Initialize client
  useEffect(() => {
    if (!API_KEY) return;

    const client = new GenAILiveClient(API_KEY);
    clientRef.current = client;

    // Audio streamer setup
    audioContext({ id: "audio-out" }).then((audioCtx) => {
      const streamer = new AudioStreamer(audioCtx);
      audioStreamerRef.current = streamer;
      streamer
        .addWorklet("vumeter-out", VolMeterWorklet, (ev: MessageEvent) => {
          setVolume(ev.data.volume);
        })
        .catch(console.error);
    });

    // Audio events
    const onOpen = () => setConnected(true);
    const onClose = () => setConnected(false);
    const stopAudio = () => audioStreamerRef.current?.stop();
    const onAudio = (data: ArrayBuffer) => {
      audioStreamerRef.current?.addPCM16(new Uint8Array(data));
    };

    const onInputTranscription = (text: string) => {
      setTranscript(text);
      setCurrentTranscript(text);
      setShowTranscript(true);
    };

    const onOutputTranscription = (text: string) => {
      setAgentTranscript(text);
      setCurrentTranscript(text);
      setShowTranscript(true);
      // Hide transcript after 5s
      setTimeout(() => setShowTranscript(false), 5000);
    };

    // REAL tool call handler - no more hardcoded { result: 'ok' }
    const onToolCall = async (toolCall: LiveServerToolCall) => {
      const functionResponses = [];

      for (const fc of toolCall.functionCalls ?? []) {
        console.log(`🔧 Executing tool: ${fc.name}`, fc.args);
        const result = await executeToolCall(
          fc.name!,
          (fc.args ?? {}) as Record<string, unknown>,
          toolContext
        );
        console.log(`✅ Tool result:`, result);

        functionResponses.push({
          id: fc.id,
          name: fc.name,
          response: result,
        });
      }

      client.sendToolResponse({ functionResponses });
    };

    client.on("open", onOpen);
    client.on("close", onClose);
    client.on("interrupted", stopAudio);
    client.on("audio", onAudio);
    client.on("toolcall", onToolCall);
    client.on("inputTranscription", onInputTranscription);
    client.on("outputTranscription", onOutputTranscription);

    return () => {
      client.off("open", onOpen);
      client.off("close", onClose);
      client.off("interrupted", stopAudio);
      client.off("audio", onAudio);
      client.off("toolcall", onToolCall);
      client.off("inputTranscription", onInputTranscription);
      client.off("outputTranscription", onOutputTranscription);
      client.disconnect();
    };
  }, [API_KEY, toolContext, setConnected, setTranscript, setAgentTranscript]);

  // Connect function
  const connect = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;

    const config = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      responseModalities: [Modality.AUDIO],
      tools: [{ functionDeclarations: ecommerceTools }],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
      },
    };

    try {
      await client.connect(config);
    } catch (err) {
      console.error("Voice agent connection failed:", err);
    }
  }, [systemPrompt, voice]);

  // Disconnect
  const disconnect = useCallback(() => {
    clientRef.current?.disconnect();
    audioRecorderRef.current?.stop();
    setConnected(false);
    hasGreetedRef.current = false;
  }, [setConnected]);

  // Start microphone when connected
  useEffect(() => {
    if (!isConnected) {
      audioRecorderRef.current?.stop();
      return;
    }

    const recorder = new AudioRecorder();
    audioRecorderRef.current = recorder;

    const onData = (base64: string) => {
      clientRef.current?.sendRealtimeInput([
        { mimeType: "audio/pcm;rate=16000", data: base64 },
      ]);
    };

    recorder.on("data", onData);
    recorder.start().catch(console.error);

    return () => {
      recorder.off("data", onData);
      recorder.stop();
    };
  }, [isConnected]);

  // Send greeting when connected
  useEffect(() => {
    if (isConnected && !hasGreetedRef.current) {
      hasGreetedRef.current = true;
      setTimeout(() => {
        clientRef.current?.send(
          [
            {
              text: `Please greet the customer warmly. Say your welcome greeting: "${greeting}"`,
            },
          ],
          true
        );
      }, 1000);
    }
    if (!isConnected) {
      hasGreetedRef.current = false;
    }
  }, [isConnected, greeting]);

  // Auto-start on mount
  useEffect(() => {
    if (!hasInitializedRef.current && autoStart && API_KEY) {
      hasInitializedRef.current = true;
      setTimeout(() => {
        connect();
      }, 2000); // Wait for splash screen
    }
  }, [autoStart, connect]);

  const handleToggle = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  if (!API_KEY) return null;

  return (
    <>
      {/* Floating transcript */}
      {showTranscript && currentTranscript && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-md">
          <div className="bg-black/80 backdrop-blur-xl text-white px-4 py-3 rounded-2xl text-sm shadow-2xl">
            <span className="text-indigo-400 font-medium">{agentName}: </span>
            {currentTranscript}
          </div>
        </div>
      )}

      {/* Voice button */}
      <button
        onClick={handleToggle}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 ${
          isConnected
            ? "bg-indigo-600 text-white shadow-indigo-500/30"
            : "bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-indigo-500"
        }`}
      >
        {isConnected ? (
          <>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="voice-wave-bar"
                  style={{
                    height: `${12 + volume * 100 * (i === 2 ? 2 : 1)}px`,
                    background: "white",
                  }}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{agentName} is listening...</span>
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">
              Talk to {agentName}
            </span>
          </>
        )}
      </button>
    </>
  );
}
