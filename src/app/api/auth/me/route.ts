import { NextResponse } from "next/server";
import { checkAdminStatus } from "@/lib/admin";

// GET /api/auth/me — returns current user's role info
export async function GET() {
  const status = await checkAdminStatus();
  return NextResponse.json(status);
}
