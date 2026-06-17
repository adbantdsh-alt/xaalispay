import { NextRequest, NextResponse } from "next/server";
import { searchMarketplaceCached } from "@/lib/search";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const results = await searchMarketplaceCached(q);
  return NextResponse.json(results);
}
