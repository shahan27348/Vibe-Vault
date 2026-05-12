import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import SplashWrapper from "@/components/SplashWrapper";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const hasClerk = clerkKey && !clerkKey.includes("your_clerk");

export const metadata: Metadata = {
  title: {
    default: "Vibe Vault | Men's Premium Fashion Store",
    template: "%s | Vibe Vault",
  },
  description:
    "Pakistan's premium men's clothing store featuring Eastern & Western wear, footwear, and accessories. Shop with AI voice assistant and virtual try-on.",
  keywords: [
    "men's clothing Pakistan",
    "shalwar kameez",
    "kurta pajama",
    "men's fashion",
    "eastern wear",
    "western wear",
    "AI shopping",
    "virtual try-on",
    "voice assistant",
    "online fashion store",
  ],
  openGraph: {
    title: "Vibe Vault — Men's Premium Fashion",
    description:
      "Eastern & Western wear, footwear & accessories with AI-powered voice shopping and virtual try-on",
    type: "website",
    locale: "en_PK",
    siteName: "Vibe Vault",
  },
  robots: { index: true, follow: true },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://vibe-vault.vercel.app"),
};

function ClerkWrapper({ children }: { children: React.ReactNode }) {
  if (hasClerk) {
    return <ClerkProvider>{children}</ClerkProvider>;
  }
  return <>{children}</>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkWrapper>
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} antialiased`}>
          <SplashWrapper>
            {children}
          </SplashWrapper>
        </body>
      </html>
    </ClerkWrapper>
  );
}
