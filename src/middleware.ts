import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const hasClerk =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("your_");

export default async function middleware(req: NextRequest) {
  if (!hasClerk) {
    // Clerk not configured – pass through
    return NextResponse.next();
  }

  // Dynamically import Clerk so the module isn't evaluated when keys are missing
  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  );

  const isProtectedRoute = createRouteMatcher([
    "/admin(.*)",
    "/orders(.*)",
    "/checkout(.*)",
  ]);

  return clerkMiddleware(async (auth, innerReq) => {
    if (isProtectedRoute(innerReq)) {
      await auth.protect();
    }
  })(req, {} as any);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
