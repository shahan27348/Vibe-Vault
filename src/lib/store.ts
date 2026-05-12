import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedProducts as rawSeedProducts } from "./seed-data";

// Re-export seed products with auto-generated _id for client-side usage
export const seedProducts = rawSeedProducts.map((p, i) => ({
  ...p,
  _id: p.slug || `seed-${i}`,
}));

// ==================== Product Types ====================
export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  stock: number;
  featured: boolean;
  tags: string[];
  rating: number;
  reviewCount: number;
  tryOnEnabled: boolean;
}

// ==================== Cart Store ====================
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (i) =>
              i.productId === item.productId &&
              i.size === item.size &&
              i.color === item.color
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId &&
                i.size === item.size &&
                i.color === item.color
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      setCartOpen: (open) => set({ isOpen: open }),

      getTotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { name: "vibe-vault-cart" }
  )
);

// ==================== Voice Agent Store ====================
export interface ShowcaseProduct {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  images: string[];
  category: string;
  description: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  stock: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  tryOnEnabled: boolean;
  slug: string;
}

interface VoiceAgentState {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  agentTranscript: string;
  tryOnPhoto: string | null; // base64 or data URL of uploaded photo for AI analysis
  // Product showcase modal state
  showcaseProducts: ShowcaseProduct[];
  showcaseOpen: boolean;
  showcaseActiveIndex: number;
  // Visual highlight state — set when voice agent searches/shows a product
  highlightedProductId: string | null;
  setConnected: (connected: boolean) => void;
  setListening: (listening: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setTranscript: (text: string) => void;
  setAgentTranscript: (text: string) => void;
  setTryOnPhoto: (photo: string | null) => void;
  setShowcaseProducts: (products: ShowcaseProduct[]) => void;
  setShowcaseOpen: (open: boolean) => void;
  setShowcaseActiveIndex: (index: number) => void;
  closeShowcase: () => void;
  setHighlightedProductId: (id: string | null) => void;
}

export const useVoiceStore = create<VoiceAgentState>((set) => ({
  isConnected: false,
  isListening: false,
  isSpeaking: false,
  transcript: "",
  agentTranscript: "",
  tryOnPhoto: null,
  showcaseProducts: [],
  showcaseOpen: false,
  showcaseActiveIndex: 0,
  highlightedProductId: null,
  setConnected: (connected) => set({ isConnected: connected }),
  setListening: (listening) => set({ isListening: listening }),
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setTranscript: (text) => set({ transcript: text }),
  setAgentTranscript: (text) => set({ agentTranscript: text }),
  setTryOnPhoto: (photo) => set({ tryOnPhoto: photo }),
  setShowcaseProducts: (products) => set({ showcaseProducts: products, showcaseOpen: true, showcaseActiveIndex: 0 }),
  setShowcaseOpen: (open) => set({ showcaseOpen: open }),
  setShowcaseActiveIndex: (index) => set({ showcaseActiveIndex: index }),
  closeShowcase: () => set({ showcaseOpen: false, showcaseProducts: [], showcaseActiveIndex: 0 }),
  setHighlightedProductId: (id) => set({ highlightedProductId: id }),
}));

// ==================== UI Store ====================
interface UIState {
  showSplash: boolean;
  searchQuery: string;
  selectedCategory: string | null;
  tryOnProductId: string | null;
  setShowSplash: (show: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setTryOnProductId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  showSplash: true,
  searchQuery: "",
  selectedCategory: null,
  tryOnProductId: null,
  setShowSplash: (show) => set({ showSplash: show }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setTryOnProductId: (id) => set({ tryOnProductId: id }),
}));

// ==================== Wishlist Store ====================
interface WishlistState {
  items: string[]; // product IDs
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggleWishlist: (productId) => {
        set((state) => ({
          items: state.items.includes(productId)
            ? state.items.filter((id) => id !== productId)
            : [...state.items, productId],
        }));
      },
      isWishlisted: (productId) => get().items.includes(productId),
    }),
    { name: "vibe-vault-wishlist" }
  )
);
