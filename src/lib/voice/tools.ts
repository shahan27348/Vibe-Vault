import { type FunctionDeclaration, Type } from "@google/genai";

/**
 * E-commerce function declarations for the voice agent.
 * These are sent to the Gemini Live API so the model can call them.
 */
export const ecommerceTools: FunctionDeclaration[] = [
  {
    name: "search_products",
    description:
      "Search for products in the store by query, category, or price range. Use this when the customer asks about products or wants to browse.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "Search keywords (e.g. 'blue jacket', 'wireless headphones')",
        },
        category: {
          type: Type.STRING,
          description: "Product category filter (Eastern Wear, Western Wear, Footwear, Accessories)",
        },
        maxPrice: {
          type: Type.NUMBER,
          description: "Maximum price filter",
        },
      },
    },
  },
  {
    name: "get_product_details",
    description:
      "Get detailed information about a specific product including price, stock, sizes, colors, and reviews.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        productId: {
          type: Type.STRING,
          description: "The product ID to look up",
        },
        productName: {
          type: Type.STRING,
          description: "The product name to search for (if ID is not known)",
        },
      },
    },
  },
  {
    name: "add_to_cart",
    description:
      "Add a product to the customer's shopping cart. Use this when the customer wants to buy something.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        productId: {
          type: Type.STRING,
          description: "The product ID to add",
        },
        productName: {
          type: Type.STRING,
          description: "The product name (used if ID unknown)",
        },
        quantity: {
          type: Type.NUMBER,
          description: "Quantity to add (default 1)",
        },
        size: {
          type: Type.STRING,
          description: "Size selection if applicable",
        },
        color: {
          type: Type.STRING,
          description: "Color selection if applicable",
        },
      },
      required: ["productName"],
    },
  },
  {
    name: "remove_from_cart",
    description: "Remove a product from the customer's cart.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        productName: {
          type: Type.STRING,
          description: "Name of the product to remove",
        },
      },
      required: ["productName"],
    },
  },
  {
    name: "get_cart_summary",
    description:
      "Get the current cart contents and total. Use when customer asks about their cart or wants to checkout.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "start_try_on",
    description:
      "Navigate the customer to the virtual try-on page for a specific product. Use when customer wants to see how something looks on them.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        productName: {
          type: Type.STRING,
          description: "The product name to try on",
        },
      },
      required: ["productName"],
    },
  },
  {
    name: "recommend_products",
    description:
      "Get personalized product recommendations based on customer preferences, current cart, or browsing context.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        preference: {
          type: Type.STRING,
          description:
            "What the customer is looking for (e.g. 'something casual', 'gifts under $50', 'workout gear')",
        },
      },
      required: ["preference"],
    },
  },
  {
    name: "check_order_status",
    description: "Look up the status of an existing order by order number.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        orderNumber: {
          type: Type.STRING,
          description: "The order number to check",
        },
      },
      required: ["orderNumber"],
    },
  },
  {
    name: "apply_discount_code",
    description: "Apply a discount/coupon code to the cart.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        code: {
          type: Type.STRING,
          description: "The discount code to apply",
        },
      },
      required: ["code"],
    },
  },
  {
    name: "navigate_to_page",
    description:
      "Navigate the customer to a specific page in the store (shop, cart, checkout, categories, try-on).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        page: {
          type: Type.STRING,
          description:
            "Page to navigate to: 'shop', 'cart', 'checkout', 'try-on', 'orders', or a category name",
        },
      },
      required: ["page"],
    },
  },
  {
    name: "analyze_photo_for_outfit",
    description:
      "Analyze the customer's uploaded photo to suggest clothing sizes, styles, and outfit recommendations based on their body type. Use this when the customer asks for size advice, style recommendations, or when they have uploaded a photo on the try-on page.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        preference: {
          type: Type.STRING,
          description: "What the customer is looking for (e.g. 'casual wear', 'formal', 'eastern wear', 'size recommendation')",
        },
      },
    },
  },
  {
    name: "show_product",
    description:
      "Show a product to the customer in a visual popup/modal on screen. ALWAYS use this when the customer asks to see, view, or look at a product. This opens a beautiful product card with image, price, sizes, and an add-to-cart button. Use this after searching for products to visually present them.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        productName: {
          type: Type.STRING,
          description: "The product name to show visually to the customer",
        },
        productId: {
          type: Type.STRING,
          description: "The product ID if known",
        },
      },
      required: ["productName"],
    },
  },
  {
    name: "suggest_outfit_pairing",
    description:
      "Suggest complete outfit combinations — when customer picks a shirt/kameez/jacket, recommend matching pants, shoes, and accessories. Act as a professional fashion designer. Use when customer asks 'kya match karega?', 'kya suit karega?', 'is k saath kya pehnoon?', or wants a complete look.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        mainItem: {
          type: Type.STRING,
          description: "The main clothing item customer wants to pair (e.g. 'blue denim jacket', 'white shalwar kameez')",
        },
        occasion: {
          type: Type.STRING,
          description: "Occasion or setting: casual, formal, wedding, party, office, eid, everyday",
        },
        budget: {
          type: Type.NUMBER,
          description: "Total budget for the complete outfit in PKR",
        },
      },
      required: ["mainItem"],
    },
  },
  {
    name: "get_fashion_advice",
    description:
      "Give personalized fashion and style advice as a professional fashion designer. Advise on what clothing styles, cuts, colors, and outfits suit the customer best based on their preferences, body type, or occasion. Use for questions like 'mujhe kya pehnna chahiye?', 'meri personality k liye kya suit karega?', 'wedding mein kya pehnen?'",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: "The fashion question or context — what the customer wants advice about",
        },
        bodyType: {
          type: Type.STRING,
          description: "Customer's body type if mentioned: slim, athletic, regular, broad/large",
        },
        occasion: {
          type: Type.STRING,
          description: "Specific occasion: casual, formal, wedding, eid, party, office, gym",
        },
        colorPreference: {
          type: Type.STRING,
          description: "Preferred color palette or colors to avoid",
        },
      },
      required: ["query"],
    },
  },
];
