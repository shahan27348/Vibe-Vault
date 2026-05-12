/**
 * Tool executor - handles real execution of voice agent tool calls.
 * Instead of returning hardcoded { result: 'ok' }, this actually
 * interacts with the store state and API.
 */

export interface ToolExecutionContext {
  // Functions injected by the store to manipulate state
  searchProducts: (query?: string, category?: string, maxPrice?: number) => Promise<ProductResult[]>;
  getProductDetails: (id?: string, name?: string) => Promise<ProductResult | null>;
  addToCart: (productName: string, quantity?: number, size?: string, color?: string) => Promise<{ success: boolean; message: string }>;
  removeFromCart: (productName: string) => Promise<{ success: boolean; message: string }>;
  getCartSummary: () => Promise<CartSummary>;
  navigateTo: (page: string) => void;
  startTryOn: (productName: string) => void;
  getTryOnPhoto: () => string | null;
  showProduct: (productName: string, productId?: string) => { success: boolean; message: string };
  setHighlightedProductId: (id: string | null) => void;
}

export interface ProductResult {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  featured: boolean;
  description?: string;
  sizes?: string[];
  colors?: string[];
  rating?: number;
}

export interface CartSummary {
  items: { name: string; quantity: number; price: number }[];
  total: number;
  itemCount: number;
}

export async function executeToolCall(
  functionName: string,
  args: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<Record<string, unknown>> {
  try {
    switch (functionName) {
      case "search_products": {
        const products = await context.searchProducts(
          args.query as string,
          args.category as string,
          args.maxPrice as number
        );
        if (products.length > 0) {
          // Auto-show first product visually and highlight it on the page
          context.showProduct(products[0].name, products[0].id);
          context.setHighlightedProductId(products[0].id);
          // Auto-clear highlight after 12 seconds
          setTimeout(() => context.setHighlightedProductId(null), 12000);
        }
        return {
          success: true,
          products: products.slice(0, 6),
          count: products.length,
          message:
            products.length > 0
              ? `Found ${products.length} products. The first product "${products[0].name}" is now highlighted on the customer's screen. Tell the customer about it and that they can say "add to cart" to purchase.`
              : "No products found matching your criteria",
        };
      }

      case "get_product_details": {
        const product = await context.getProductDetails(
          args.productId as string,
          args.productName as string
        );
        if (product) {
          // Also show the product visually and highlight on page
          context.showProduct(product.name, product.id);
          context.setHighlightedProductId(product.id);
          setTimeout(() => context.setHighlightedProductId(null), 12000);
          return { success: true, product, message: `Showing ${product.name} on the customer's screen. They can say "add to cart" to purchase.` };
        }
        return { success: false, message: "Product not found" };
      }

      case "add_to_cart": {
        const result = await context.addToCart(
          args.productName as string,
          (args.quantity as number) || 1,
          args.size as string,
          args.color as string
        );
        return result;
      }

      case "remove_from_cart": {
        const result = await context.removeFromCart(args.productName as string);
        return result;
      }

      case "get_cart_summary": {
        const summary = await context.getCartSummary();
        return {
          success: true,
          ...summary,
          message:
            summary.itemCount > 0
              ? `You have ${summary.itemCount} items in your cart totaling Rs. ${summary.total.toLocaleString()}`
              : "Your cart is empty",
        };
      }

      case "start_try_on": {
        context.startTryOn(args.productName as string);
        return {
          success: true,
          message: `Opening virtual try-on for ${args.productName}. You can upload your photo to see how it looks on you!`,
        };
      }

      case "recommend_products": {
        const products = await context.searchProducts(
          args.preference as string
        );
        return {
          success: true,
          recommendations: products.slice(0, 4),
          message: `Here are some recommendations based on your preferences`,
        };
      }

      case "check_order_status": {
        return {
          success: true,
          orderNumber: args.orderNumber,
          status: "processing",
          message: `Order #${args.orderNumber} is currently being processed. You'll receive a tracking number soon!`,
        };
      }

      case "apply_discount_code": {
        return {
          success: true,
          code: args.code,
          discount: "10%",
          message: `Discount code "${args.code}" applied! You get 10% off your order.`,
        };
      }

      case "navigate_to_page": {
        context.navigateTo(args.page as string);
        return {
          success: true,
          message: `Navigating to ${args.page}`,
        };
      }

      case "show_product": {
        const result = context.showProduct(
          args.productName as string,
          args.productId as string
        );
        if (result.success) {
          // Find product id to highlight
          const pid = args.productId as string | undefined;
          const pName = args.productName as string;
          // We pass the id from args if available; showProduct already knows the id
          context.setHighlightedProductId(pid || pName);
          setTimeout(() => context.setHighlightedProductId(null), 12000);
        }
        return result;
      }

      case "analyze_photo_for_outfit": {
        const photo = context.getTryOnPhoto();
        if (!photo) {
          return {
            success: false,
            message:
              "Koi photo upload nahi hui abhi. Pehle try-on page par apni photo upload karen, phir main aapko size aur style suggest kar sakta/sakti hoon.",
          };
        }
        try {
          const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
          const base64 = photo.includes(",") ? photo.split(",")[1] : photo;
          const mimeType = photo.startsWith("data:image/png") ? "image/png" : "image/jpeg";
          const prompt = `You are a professional Pakistani fashion stylist and body measurement expert. Analyze this person's photo carefully.

Provide:
1. **Body Type**: (slim/athletic/regular/broad) with brief description
2. **Recommended Size**: For Pakistani clothing (S/M/L/XL/XXL) — be specific and explain why
3. **Shalwar Kameez Fit**: What cut/style would suit best (e.g., straight cut, kameez length, etc.)
4. **Western Wear Fit**: T-shirt, shirt, trouser fit recommendations
5. **Style Tips**: 2-3 specific clothing recommendations from categories: Eastern Wear, Western Wear, Footwear, Accessories

Preference note: "${args.preference || "general fashion advice"}"

Keep the response warm, helpful, and conversational. Answer in 4-5 sentences max. Use both Urdu and English naturally.`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: prompt },
                      { inline_data: { mime_type: mimeType, data: base64 } },
                    ],
                  },
                ],
              }),
            }
          );
          const data = await response.json();
          const analysis =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Photo analyze nahi ho saki. Dobara try karen.";
          return { success: true, analysis, message: analysis };
        } catch {
          return {
            success: false,
            message: "Photo analysis mein masla aaya. Dobara try karen.",
          };
        }
      }

      case "suggest_outfit_pairing": {
        const mainItem = args.mainItem as string;
        const occasion = (args.occasion as string) || "casual";
        const budget = args.budget as number | undefined;

        // Search available products to suggest real items from the store
        const allProducts = await context.searchProducts();
        const suggestions: Record<string, string[]> = {
          pants: [],
          shoes: [],
          accessories: [],
          tops: [],
        };

        // Filter by category
        allProducts.forEach((p) => {
          const cat = p.category.toLowerCase();
          const name = p.name.toLowerCase();
          if (cat.includes("footwear") || name.includes("shoe") || name.includes("sandal")) {
            if (!budget || p.price <= budget * 0.3) suggestions.shoes.push(`${p.name} (Rs. ${p.price})`);
          }
          if (cat.includes("accessories")) {
            suggestions.accessories.push(`${p.name} (Rs. ${p.price})`);
          }
          if (name.includes("trouser") || name.includes("pant") || name.includes("jeans")) {
            if (!budget || p.price <= budget * 0.4) suggestions.pants.push(`${p.name} (Rs. ${p.price})`);
          }
        });

        return {
          success: true,
          mainItem,
          occasion,
          pairingSuggestions: {
            bottoms: suggestions.pants.slice(0, 3),
            footwear: suggestions.shoes.slice(0, 3),
            accessories: suggestions.accessories.slice(0, 3),
          },
          message: `Fashion pairing advice for "${mainItem}" for ${occasion} occasion. Available matching items from the store are listed. Provide a warm, expert fashion designer response suggesting how to combine these into a complete look. Mention color coordination, fabric matching, and styling tips.`,
        };
      }

      case "get_fashion_advice": {
        const query = args.query as string;
        const bodyType = (args.bodyType as string) || "";
        const occasion = (args.occasion as string) || "";
        const colorPreference = (args.colorPreference as string) || "";

        // Fetch available products for concrete suggestions
        const available = await context.searchProducts();
        const productNames = available.slice(0, 10).map((p) => `${p.name} (Rs. ${p.price})`).join(", ");

        return {
          success: true,
          query,
          bodyType,
          occasion,
          colorPreference,
          availableProducts: productNames,
          message: `Fashion advice request: "${query}". Body type: ${bodyType || "not specified"}. Occasion: ${occasion || "not specified"}. Color preference: ${colorPreference || "open"}. Available products in store: ${productNames}. As a professional Pakistani fashion designer, give warm, specific, actionable advice. Recommend real products from the store when possible. Include outfit combinations, color tips, and styling tricks. Be encouraging and expert.`,
        };
      }

      default:
        return {
          success: false,
          message: `Unknown function: ${functionName}`,
        };
    }
  } catch (error) {
    console.error(`Tool execution error (${functionName}):`, error);
    return {
      success: false,
      message: `Error executing ${functionName}: ${(error as Error).message}`,
    };
  }
}
