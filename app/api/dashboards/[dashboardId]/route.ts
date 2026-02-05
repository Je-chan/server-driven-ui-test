import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/shared/lib";

interface RouteParams {
  params: Promise<{ dashboardId: string }>;
}

// GET /api/dashboards/[dashboardId]
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { dashboardId } = await params;

  try {
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
    });

    if (!dashboard) {
      return NextResponse.json(
        { error: "Dashboard not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...dashboard,
      schema: JSON.parse(dashboard.schema),
    });
  } catch (error) {
    console.error("Failed to fetch dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}

// PUT /api/dashboards/[dashboardId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { dashboardId } = await params;

  try {
    const body = await request.json();
    const { title, description, schema, isPublished } = body;

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (schema !== undefined) updateData.schema = JSON.stringify(schema);
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const dashboard = await prisma.dashboard.update({
      where: { id: dashboardId },
      data: updateData,
    });

    return NextResponse.json({
      ...dashboard,
      schema: JSON.parse(dashboard.schema),
    });
  } catch (error) {
    console.error("Failed to update dashboard:", error);
    return NextResponse.json(
      { error: "Failed to update dashboard" },
      { status: 500 }
    );
  }
}

// DELETE /api/dashboards/[dashboardId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { dashboardId } = await params;

  try {
    await prisma.dashboard.delete({
      where: { id: dashboardId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete dashboard:", error);
    return NextResponse.json(
      { error: "Failed to delete dashboard" },
      { status: 500 }
    );
  }
}
