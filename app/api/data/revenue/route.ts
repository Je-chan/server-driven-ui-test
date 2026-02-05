import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") ?? "30");

    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : now;

    const whereClause: {
      date: { gte: Date; lte: Date };
      siteId?: string;
    } = {
      date: { gte: start, lte: end },
    };

    if (siteId) whereClause.siteId = siteId;

    const revenueData = await prisma.revenue.findMany({
      where: whereClause,
      orderBy: { date: "desc" },
      take: limit,
    });

    const summary = {
      totalRevenue: revenueData.reduce((sum, d) => sum + d.totalRevenue, 0),
      totalEnergySales: revenueData.reduce((sum, d) => sum + d.energySales, 0),
      totalRecSales: revenueData.reduce((sum, d) => sum + (d.recSales ?? 0), 0),
      totalGeneration: revenueData.reduce((sum, d) => sum + d.generationKwh, 0),
      avgDailyRevenue: revenueData.length > 0 ? revenueData.reduce((sum, d) => sum + d.totalRevenue, 0) / revenueData.length : 0,
    };

    return NextResponse.json({
      success: true,
      data: revenueData,
      summary,
      meta: { startDate: start, endDate: end, count: revenueData.length },
    });
  } catch (error) {
    console.error("Revenue API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch revenue data" }, { status: 500 });
  }
}
