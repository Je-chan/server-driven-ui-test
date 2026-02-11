import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib/prisma";
import { parseDateStart, parseDateEnd } from "@/src/shared/lib/date-utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
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
      severity?: string;
      status?: string;
      timestamp: { gte: Date; lte: Date };
    } = {
      timestamp: { gte: start, lte: end },
    };

    if (siteId) whereClause.siteId = siteId;
    if (severity) whereClause.severity = severity;
    if (status) whereClause.status = status;

    const alarms = await prisma.alarm.findMany({
      where: whereClause,
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    // 통계 (같은 시간 범위 내)
    const stats = await prisma.alarm.groupBy({
      by: ["severity"],
      where: {
        status: "active",
        timestamp: { gte: start, lte: end },
        ...(siteId ? { siteId } : {}),
      },
      _count: { id: true },
    });

    const summary = {
      critical: stats.find((s) => s.severity === "critical")?._count.id ?? 0,
      warning: stats.find((s) => s.severity === "warning")?._count.id ?? 0,
      info: stats.find((s) => s.severity === "info")?._count.id ?? 0,
      totalActive: stats.reduce((sum, s) => sum + s._count.id, 0),
    };

    return NextResponse.json({
      success: true,
      data: alarms,
      summary,
      meta: { startTime: start, endTime: end, count: alarms.length },
    });
  } catch (error) {
    console.error("Alarm API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch alarm data" }, { status: 500 });
  }
}
