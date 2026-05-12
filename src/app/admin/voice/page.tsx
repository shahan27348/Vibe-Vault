"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Save, Loader2, Mic, Plus, Trash2, ToggleLeft, ToggleRight,
  Tag, Info,
} from "lucide-react";
import Header from "@/components/Header";
import AdminNav from "@/components/AdminNav";
import AdminGuard from "@/components/AdminGuard";

const VOICES = ["Zephyr", "Puck", "Charon", "Luna", "Nova", "Kore", "Fenrir"];
const LANGUAGES = ["Urdu/English", "English Only", "Urdu Only"];

interface Discount {
  code: string;
  description: string;
  percentage: number;
  minOrder: number;
  active: boolean;
}

interface VoiceAgent {
  agentName: string;
  greeting: string;
  personality: string;
  language: string;
  voice: string;
  autoStart: boolean;
}

const defaultDiscount = (): Discount => ({
  code: "", description: "", percentage: 10, minOrder: 0, active: true,
});

export default function AdminVoicePage() {
  const [agent, setAgent] = useState<VoiceAgent>({
    agentName: "Zara", greeting: "", personality: "", language: "Urdu/English",
    voice: "Zephyr", autoStart: true,
  });
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.voiceAgent) setAgent(data.voiceAgent);
        if (data.activeDiscounts) setDiscounts(data.activeDiscounts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voiceAgent: agent, activeDiscounts: discounts }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateDiscount = (i: number, field: keyof Discount, val: string | number | boolean) => {
    const d = [...discounts];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    d[i] = { ...d[i], [field]: val } as any;
    setDiscounts(d);
  };

  return (
    <AdminGuard>
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <div className="pt-20">
        <AdminNav />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
          <Link href="/admin" className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-200 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Voice Agent</h1>
              <p className="text-zinc-500 text-sm mt-1">AI shopping assistant customize karein</p>
            </div>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saved ? "Saved! ✓" : saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />Loading...</div>
          ) : (
            <div className="space-y-6">
              {/* Agent Identity */}
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Mic className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-base font-bold text-white">Agent Identity</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Agent Name</label>
                    <input value={agent.agentName} onChange={(e) => setAgent({ ...agent, agentName: e.target.value })}
                      className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="Zara" />
                    <p className="text-xs text-zinc-600 mt-1">Customer isko yeh naam se janega</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Voice</label>
                    <div className="grid grid-cols-4 gap-2">
                      {VOICES.map((v) => (
                        <button key={v} onClick={() => setAgent({ ...agent, voice: v })}
                          className={`py-2 px-1 rounded-xl text-xs font-medium transition-colors border ${agent.voice === v ? "bg-indigo-600 border-indigo-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"}`}>{v}</button>
                      ))}
                    </div>
                    <p className="text-xs text-zinc-600 mt-1">Zephyr/Luna = female voice | Puck/Charon = male voice</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Language</label>
                    <div className="flex gap-2">
                      {LANGUAGES.map((l) => (
                        <button key={l} onClick={() => setAgent({ ...agent, language: l })}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-colors border ${agent.language === l ? "bg-indigo-600 border-indigo-500 text-white" : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"}`}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Auto Start</label>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setAgent({ ...agent, autoStart: !agent.autoStart })}
                          className="transition-colors">
                          {agent.autoStart
                            ? <ToggleRight className="w-8 h-8 text-indigo-400" />
                            : <ToggleLeft className="w-8 h-8 text-zinc-600" />}
                        </button>
                        <span className="text-sm text-zinc-300">{agent.autoStart ? "Store open hone par automatically start" : "Customer manually start karega"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Greeting */}
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                <h2 className="text-base font-bold text-white mb-1">Greeting Message</h2>
                <p className="text-xs text-zinc-500 mb-4">Jab customer pehli baar connect kare tab agent yeh bol ta hai</p>
                <textarea value={agent.greeting} onChange={(e) => setAgent({ ...agent, greeting: e.target.value })} rows={3}
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="Assalam o Alaikum! Main aapki assistant hoon..." />
              </div>

              {/* Personality */}
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                <h2 className="text-base font-bold text-white mb-1">Personality & Style</h2>
                <p className="text-xs text-zinc-500 mb-4">Agent ka overall behaviour aur tone define karein</p>
                <textarea value={agent.personality} onChange={(e) => setAgent({ ...agent, personality: e.target.value })} rows={2}
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="friendly, warm Pakistani fashion expert who speaks Urdu and English" />
                <p className="text-xs text-zinc-600 mt-2">Examples: &quot;formal and professional&quot;, &quot;fun and energetic teenager vibe&quot;, &quot;classic gentleman&quot;</p>
              </div>

              {/* Active Discounts */}
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-green-400" />
                    <div>
                      <h2 className="text-base font-bold text-white">Active Discounts</h2>
                      <p className="text-xs text-zinc-500">Voice agent customers ko automatically in offers ke baare mein batayega</p>
                    </div>
                  </div>
                  <button onClick={() => setDiscounts([...discounts, defaultDiscount()])}
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors border border-zinc-700">
                    <Plus className="w-4 h-4" /> Add Discount
                  </button>
                </div>

                {discounts.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 border border-dashed border-zinc-800 rounded-xl">
                    <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Koi active discount nahi. Add karein taake agent customers ko bata sake.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {discounts.map((d, i) => (
                      <div key={i} className={`border rounded-xl p-4 transition-colors ${d.active ? "border-zinc-700 bg-zinc-800/50" : "border-zinc-800 bg-zinc-800/20 opacity-60"}`}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1">Discount Code</label>
                            <input value={d.code} onChange={(e) => updateDiscount(i, "code", e.target.value.toUpperCase())}
                              className="w-full px-2.5 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm font-mono text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="EID25" />
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1">Percentage Off</label>
                            <div className="relative">
                              <input type="number" min="1" max="100" value={d.percentage} onChange={(e) => updateDiscount(i, "percentage", parseInt(e.target.value) || 0)}
                                className="w-full px-2.5 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">%</span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-zinc-500 mb-1">Min Order (Rs.)</label>
                            <input type="number" value={d.minOrder} onChange={(e) => updateDiscount(i, "minOrder", parseInt(e.target.value) || 0)}
                              className="w-full px-2.5 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="0" />
                          </div>
                          <div className="flex items-end gap-2">
                            <button onClick={() => updateDiscount(i, "active", !d.active)}
                              className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors border border-zinc-700 hover:border-zinc-500 text-zinc-400">
                              {d.active ? "Active ✓" : "Inactive"}
                            </button>
                            <button onClick={() => setDiscounts(discounts.filter((_, j) => j !== i))} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-500 mb-1">Description (agent isko bol ta hai)</label>
                          <input value={d.description} onChange={(e) => updateDiscount(i, "description", e.target.value)}
                            className="w-full px-2.5 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:outline-none focus:border-indigo-500" placeholder="Eid special offer - 25% off on all eastern wear!" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Capabilities Info */}
              <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-indigo-300 mb-2">Voice Agent Capabilities</h3>
                    <ul className="text-xs text-zinc-400 space-y-1">
                      <li>✅ Products search karna aur cart mein add karna</li>
                      <li>✅ Featured products aur low-stock items highlight karna</li>
                      <li>✅ Active discounts automatically mention karna</li>
                      <li>✅ Virtual try-on page par navigate karna</li>
                      <li>✅ Customer ki uploaded photo analyze karke size aur style suggest karna</li>
                      <li>✅ Urdu aur English dono mein baat karna</li>
                      <li>✅ Order status check karna</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </AdminGuard>
  );
}
