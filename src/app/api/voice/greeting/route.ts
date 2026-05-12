import { NextResponse } from "next/server";

/**
 * GET /api/voice/greeting
 * Returns the voice agent greeting configuration.
 * Called on page load to auto-activate the voice agent with a personalized greeting.
 */
export async function GET() {
  const greeting = {
    agentName: "Zara",
    greeting:
      "Assalam o Alaikum! Main Zara hoon, aapki personal fashion designer aur shopping assistant. Vibe Vault mein khush amdeed! Aaj aap kya dhundhna chahenge — koi khaas occasion ke liye kuch chahiye, ya yun hi browse kar rahe hain? Main aapki poori madad karungi!",
    personality:
      "friendly, warm, expert Pakistani fashion designer who speaks both Urdu and English naturally",
    voice: "Zephyr",
    autoStart: true,
    discounts: [
      {
        code: "WELCOME10",
        description: "Welcome discount for new customers",
        percentage: 10,
        minOrder: 2000,
      },
      {
        code: "EID25",
        description: "Eid special offer",
        percentage: 25,
        minOrder: 5000,
      },
    ],
  };

  return NextResponse.json(greeting);
}
