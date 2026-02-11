import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { parseDateStart, parseDateEnd } from "@/src/shared/lib/date-utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    // 시간 범위 설정
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const start = startTime ? parseDateStart(startTime) : defaultStart;
    const end = endTime ? parseDateEnd(endTime) : now;

    const whereClause: {
      siteId?: string;
      status?: string;
      type?: string;
      scheduledDate: { gte: Date; lte: Date };
    } = {
      scheduledDate: { gte: start, lte: end },
    };

    if (siteId) whereClause.siteId = siteId;
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;

    const maintenanceData = await prisma.maintenanceLog.findMany({
      where: whereClause,
      orderBy: { scheduledDate: "desc" },
      take: limit,
    });

    // 통계 (같은 시간 범위 내)
    const statusStats = await prisma.maintenanceLog.groupBy({
      by: ["status"],
      where: {
        scheduledDate: { gte: start, lte: end },
        ...(siteId ? { siteId } : {}),
      },
      _count: { id: true },
    });

    const summary = {
      scheduled: statusStats.find((s) => s.status === "scheduled")?._count.id ?? 0,
      inProgress: statusStats.find((s) => s.status === "in_progress")?._count.id ?? 0,
      completed: statusStats.find((s) => s.status === "completed")?._count.id ?? 0,
      totalCost: maintenanceData.reduce((sum, d) => sum + (d.cost ?? 0), 0),
    };

    return NextResponse.json({
      success: true,
      data: maintenanceData,
      summary,
      meta: { startTime: start, endTime: end, count: maintenanceData.length },
    });
  } catch (error) {
    console.error("Maintenance API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch maintenance data" }, { status: 500 });
  }
}
