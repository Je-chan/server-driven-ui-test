import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const siteId = request.nextUrl.searchParams.get("siteId");

    const assets = await prisma.asset.findMany({
      where: siteId ? { siteId } : undefined,
      select: {
        id: true,
        name: true,
        type: true,
        ratedCapacity: true,
        status: true,
        siteId: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: assets,
    });
  } catch (error) {
    console.error("Assets Options API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch assets" },
      { status: 500 }
    );
  }
}
