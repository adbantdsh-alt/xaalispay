import { NextRequest, NextResponse } from "next/server";
import { searchMarketplace } from "@/lib/search";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const results = await searchMarketplace(q);
  return NextResponse.json(results);
}
