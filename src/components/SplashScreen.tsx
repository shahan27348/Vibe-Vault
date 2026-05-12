"use client";

import { useState, useEffect, useCallback } from "react";

export default function SplashScreen({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState(0);
  const [shouldShow, setShouldShow] = useState(false);

  const handleComplete = useCallback(onComplete, [onComplete]);

  useEffect(() => {
    const seen = sessionStorage.getItem("vibe-vault-splash-seen");
    if (seen) {
      handleComplete();
      return;
    }
    setShouldShow(true);
  }, [handleComplete]);

  useEffect(() => {
    if (!shouldShow) return;
    const t1 = setTimeout(() => setPhase(1), 100);
    const t2 = setTimeout(() => setPhase(2), 1400);
    const t3 = setTimeout(() => setPhase(3), 2400);
    const t4 = setTimeout(() => setPhase(4), 3400);
    const t5 = setTimeout(() => {
      sessionStorage.setItem("vibe-vault-splash-seen", "1");
      handleComplete();
    }, 4100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [handleComplete, shouldShow]);

  if (!shouldShow) return null;

  return (
    <div
      className={`fixed inset-0 z-100 bg-black flex items-center justify-center transition-all duration-700 ${
        phase >= 4 ? "-translate-y-full opacity-0" : ""
      }`}
    >
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />

      <div className="text-center relative z-10">
        {/* VIBE */}
        <div className="overflow-hidden">
          <div className="flex justify-center gap-1 sm:gap-2">
            {"VIBE".split("").map((letter, i) => (
              <span
                key={i}
                className={`text-6xl sm:text-8xl lg:text-9xl font-black text-white inline-block transition-all duration-500 ${
                  phase >= 1
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-12"
                }`}
                style={{
                  transitionDelay: `${i * 80}ms`,
                  animation:
                    phase >= 2 ? "pulseGlow 2s ease-in-out infinite" : "none",
                }}
              >
                {letter}
              </span>
            ))}
          </div>
          {/* VAULT */}
          <div className="flex justify-center gap-1 sm:gap-2 mt-1">
            {"VAULT".split("").map((letter, i) => (
              <span
                key={i}
                className={`text-6xl sm:text-8xl lg:text-9xl font-black text-white inline-block transition-all duration-500 ${
                  phase >= 1
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-12"
                }`}
                style={{
                  transitionDelay: `${(i + 4) * 80}ms`,
                  animation:
                    phase >= 2 ? "pulseGlow 2s ease-in-out infinite" : "none",
                }}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>

        {/* Expanding line */}
        <div
          className={`h-px bg-linear-to-r from-indigo-500 to-purple-500 mx-auto mt-8 rounded-full transition-all duration-700 ${
            phase >= 2 ? "w-56" : "w-0"
          }`}
        />

        {/* Tagline */}
        <p
          className={`text-zinc-500 text-sm tracking-widest uppercase mt-5 transition-all duration-500 ${
            phase >= 2 ? "opacity-100" : "opacity-0"
          }`}
        >
          Men&apos;s Premium Fashion
        </p>

        {/* Loading dots */}
        <div
          className={`flex justify-center gap-1.5 mt-6 transition-all duration-500 ${
            phase >= 3 ? "opacity-100" : "opacity-0"
          }`}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-zinc-500 rounded-full"
              style={{ animation: "pulse 1s ease-in-out infinite", animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
