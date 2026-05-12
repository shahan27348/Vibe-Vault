"use client";

import { useState, useEffect } from "react";

interface HeroSlide {
  imageUrl: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

interface Discount {
  code: string;
  description: string;
  percentage: number;
  minOrder: number;
  active: boolean;
}

interface VoiceAgentSettings {
  agentName: string;
  greeting: string;
  personality: string;
  language: string;
  voice: string;
  autoStart: boolean;
}

interface StoreSettings {
  voiceAgent: VoiceAgentSettings;
  heroSlides: HeroSlide[];
  activeDiscounts: Discount[];
}

const defaultSettings: StoreSettings = {
  voiceAgent: {
    agentName: "Zara",
    greeting: "Assalam o Alaikum! Main Zara hoon, aapki personal shopping assistant. Vibe Vault mein aapka khair مقدم hai!",
    personality: "friendly, warm Pakistani fashion expert who speaks Urdu and English naturally",
    language: "Urdu/English",
    voice: "Zephyr",
    autoStart: true,
  },
  heroSlides: [],
  activeDiscounts: [],
};

let cache: StoreSettings | null = null;
let cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

export function useStoreSettings() {
  // Initialize from module-level cache so no synchronous setState is needed
  const [settings, setSettings] = useState<StoreSettings>(cache || defaultSettings);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    // If cache is still valid, state is already correct from initialization
    if (cache && Date.now() - cacheTime < CACHE_TTL) return;

    let cancelled = false;
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data: Partial<StoreSettings>) => {
        if (cancelled) return;
        const merged: StoreSettings = {
          voiceAgent: { ...defaultSettings.voiceAgent, ...data.voiceAgent },
          heroSlides: data.heroSlides?.length ? data.heroSlides : defaultSettings.heroSlides,
          activeDiscounts: (data.activeDiscounts || []).filter((d) => d.active),
        };
        cache = merged;
        cacheTime = Date.now();
        setSettings(merged);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { settings, loading };
}
