"use client";

import { useState, useEffect, ReactNode } from "react";
import SplashScreen from "@/components/SplashScreen";
import VoiceProductModal from "@/components/VoiceProductModal";

export default function SplashWrapper({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check sessionStorage to decide if splash should show
    const seen = sessionStorage.getItem("vibe-vault-splash-seen");
    if (!seen) {
      setShowSplash(true);
    }
    setReady(true);
  }, []);

  // Don't render anything until we've checked sessionStorage (avoid flash)
  if (!ready) {
    return (
      <div className="min-h-screen bg-black" />
    );
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      {children}
      <VoiceProductModal />
    </>
  );
}
