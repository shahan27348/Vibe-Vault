import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { NextResponse } from "next/server";

/**
 * Emails that are automatically promoted to admin role.
 * Set ADMIN_EMAILS env var as comma-separated list.
 * Example: ADMIN_EMAILS=shahan@example.com,admin@vibevault.pk
 */
function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Server-side helper for API routes.
 * Returns the admin User document or a 403 NextResponse.
 */
export async function requireAdmin(): Promise<
  { user: InstanceType<typeof User>; error?: never } | { user?: never; error: NextResponse }
> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        error: NextResponse.json(
          { error: "Unauthorized — please sign in" },
          { status: 401 }
        ),
      };
    }

    await connectDB();

    // Find or create user in our DB
    let dbUser = await User.findOne({ clerkId: userId });

    if (!dbUser) {
      // First time this Clerk user hits an admin route — create their DB record
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress || "";
      const name =
        clerkUser?.firstName && clerkUser?.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser?.firstName || "User";

      const adminEmails = getAdminEmails();
      const isAdmin = adminEmails.includes(email.toLowerCase());

      dbUser = await User.create({
        clerkId: userId,
        email,
        name,
        role: isAdmin ? "admin" : "customer",
      });
    } else {
      // Auto-promote if email is in ADMIN_EMAILS and role is still customer
      if (dbUser.role !== "admin") {
        const adminEmails = getAdminEmails();
        if (adminEmails.includes(dbUser.email.toLowerCase())) {
          dbUser.role = "admin";
          await dbUser.save();
        }
      }
    }

    if (dbUser.role !== "admin") {
      return {
        error: NextResponse.json(
          { error: "Forbidden — admin access required" },
          { status: 403 }
        ),
      };
    }

    return { user: dbUser };
  } catch (err) {
    console.error("Admin auth error:", err);
    return {
      error: NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      ),
    };
  }
}

/**
 * Lightweight check — returns { isAdmin, email, role } without throwing.
 * Used by the /api/auth/me endpoint for client-side checks.
 */
export async function checkAdminStatus(): Promise<{
  isAdmin: boolean;
  email: string;
  role: string;
  name: string;
  userId: string | null;
}> {
  try {
    const { userId } = await auth();
    if (!userId)
      return { isAdmin: false, email: "", role: "guest", name: "", userId: null };

    await connectDB();
    let dbUser = await User.findOne({ clerkId: userId });

    if (!dbUser) {
      const clerkUser = await currentUser();
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress || "";
      const name =
        clerkUser?.firstName && clerkUser?.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser?.firstName || "User";

      const adminEmails = getAdminEmails();
      const isAdmin = adminEmails.includes(email.toLowerCase());

      dbUser = await User.create({
        clerkId: userId,
        email,
        name,
        role: isAdmin ? "admin" : "customer",
      });
    } else if (dbUser.role !== "admin") {
      const adminEmails = getAdminEmails();
      if (adminEmails.includes(dbUser.email.toLowerCase())) {
        dbUser.role = "admin";
        await dbUser.save();
      }
    }

    return {
      isAdmin: dbUser.role === "admin",
      email: dbUser.email,
      role: dbUser.role,
      name: dbUser.name,
      userId,
    };
  } catch {
    return { isAdmin: false, email: "", role: "error", name: "", userId: null };
  }
}
