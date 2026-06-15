import { NextResponse } from "next/server";
import { checkRemoteStore } from "@/lib/data-store";
import { getDbStorageMode } from "@/lib/db";

export async function GET() {
  const storage = getDbStorageMode();
  const remote = await checkRemoteStore();

  return NextResponse.json({
    storage,
    remote,
    vercel: !!process.env.VERCEL,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://xaalispay.com",
  });
}
