import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHeroSlide {
  imageUrl: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

export interface IDiscount {
  code: string;
  description: string;
  percentage: number;
  minOrder: number;
  active: boolean;
}

export interface IStoreSettings extends Document {
  storeName: string;
  currency: string;
  taxRate: number;
  freeShippingThreshold: number;
  voiceAgent: {
    agentName: string;
    greeting: string;
    personality: string;
    language: string;
    voice: string;
    autoStart: boolean;
  };
  heroSlides: IHeroSlide[];
  activeDiscounts: IDiscount[];
  updatedAt: Date;
}

const HeroSlideSchema = new Schema<IHeroSlide>({
  imageUrl: { type: String, default: "" },
  badge: { type: String, default: "" },
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  ctaText: { type: String, default: "Shop Now" },
  ctaLink: { type: String, default: "/shop" },
});

const DiscountSchema = new Schema<IDiscount>({
  code: { type: String, required: true },
  description: { type: String, default: "" },
  percentage: { type: Number, default: 10 },
  minOrder: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
});

const defaultSlides: IHeroSlide[] = [
  { imageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1600&h=900&fit=crop", badge: "New Collection", title: "Eastern Elegance", subtitle: "Premium Shalwar Kameez & Kurta — Crafted for perfection", ctaText: "Explore Eastern Wear", ctaLink: "/shop?category=Eastern+Wear" },
  { imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1600&h=900&fit=crop", badge: "Trending Now", title: "Western Edge", subtitle: "Shirts, Chinos & Jackets — Own every room you walk into", ctaText: "Shop Western Wear", ctaLink: "/shop?category=Western+Wear" },
  { imageUrl: "https://images.unsplash.com/photo-1490578474895-399cd27a22ca?w=1600&h=900&fit=crop", badge: "Best Sellers", title: "Step Up", subtitle: "Sneakers, Loafers & Formal Shoes — Walk with confidence", ctaText: "Browse Footwear", ctaLink: "/shop?category=Footwear" },
  { imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1600&h=900&fit=crop", badge: "Must Have", title: "Finish the Look", subtitle: "Belts, Watches & Caps — Details that define you", ctaText: "Shop Accessories", ctaLink: "/shop?category=Accessories" },
  { imageUrl: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1600&h=900&fit=crop", badge: "Just Arrived", title: "New Arrivals", subtitle: "Fresh drops every week — Be the first to wear it", ctaText: "See New Arrivals", ctaLink: "/shop?sort=newest" },
];

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    storeName: { type: String, default: "Vibe Vault" },
    currency: { type: String, default: "PKR" },
    taxRate: { type: Number, default: 8 },
    freeShippingThreshold: { type: Number, default: 5000 },
    voiceAgent: {
      agentName: { type: String, default: "Zara" },
      greeting: {
        type: String,
        default:
          "Assalam o Alaikum! Main Zara hoon, aapki personal shopping assistant. Vibe Vault mein aapka khairمقدم hai! Aap kya dhundh rahe hain aaj?",
      },
      personality: {
        type: String,
        default:
          "friendly, warm, and knowledgeable Pakistani fashion expert who speaks both Urdu and English naturally",
      },
      language: { type: String, default: "Urdu/English" },
      voice: { type: String, default: "Zephyr" },
      autoStart: { type: Boolean, default: true },
    },
    heroSlides: { type: [HeroSlideSchema], default: defaultSlides },
    activeDiscounts: { type: [DiscountSchema], default: [] },
  },
  { timestamps: true }
);

export const StoreSettings: Model<IStoreSettings> =
  mongoose.models.StoreSettings ||
  mongoose.model<IStoreSettings>("StoreSettings", StoreSettingsSchema);
