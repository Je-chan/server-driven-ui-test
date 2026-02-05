import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get("region");
    const limit = parseInt(searchParams.get("limit") ?? "72");
    const aggregation = searchParams.get("aggregation") ?? "latest";

    if (aggregation === "latest") {
      // 각 지역의 최신 가격
      const latestData = await prisma.energyPrice.findMany({
        where: region ? { region } : undefined,
        orderBy: { timestamp: "desc" },
        distinct: ["region"],
      });

      const summary = {
        avgSmp: latestData.length > 0 ? latestData.reduce((sum, d) => sum + d.smp, 0) / latestData.length : 0,
        avgRec: latestData.length > 0 ? latestData.reduce((sum, d) => sum + (d.rec ?? 0), 0) / latestData.length : 0,
        regions: latestData.map((d) => ({ region: d.region, smp: d.smp, rec: d.rec })),
      };

      return NextResponse.json({
        success: true,
        data: latestData,
        summary,
        meta: { count: latestData.length },
      });
    }

    // 시계열 데이터
    const priceData = await prisma.energyPrice.findMany({
      where: region ? { region } : undefined,
      orderBy: { timestamp: "asc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: priceData,
      meta: { count: priceData.length },
    });
  } catch (error) {
    console.error("Price API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch price data" }, { status: 500 });
  }
}
