import { prisma } from "@/src/shared/lib";
import { dashboardJsonSchema, type DashboardEntity, type DashboardJson } from "../model/types";

export async function getDashboards(): Promise<DashboardEntity[]> {
  const dashboards = await prisma.dashboard.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return dashboards.map((d) => ({
    ...d,
    schema: parseDashboardSchema(d.schema),
  }));
}

export async function getDashboardById(id: string): Promise<DashboardEntity | null> {
  const dashboard = await prisma.dashboard.findUnique({
    where: { id },
  });

  if (!dashboard) return null;

  return {
    ...dashboard,
    schema: parseDashboardSchema(dashboard.schema),
  };
}

export async function createDashboard(data: {
  title: string;
  description?: string;
  schema: DashboardJson;
  createdBy: string;
}): Promise<DashboardEntity> {
  const dashboard = await prisma.dashboard.create({
    data: {
      title: data.title,
      description: data.description,
      schema: JSON.stringify(data.schema),
      createdBy: data.createdBy,
    },
  });

  return {
    ...dashboard,
    schema: data.schema,
  };
}

export async function updateDashboard(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    schema: DashboardJson;
    isPublished: boolean;
  }>
): Promise<DashboardEntity> {
  const dashboard = await prisma.dashboard.update({
    where: { id },
    data: {
      ...data,
      schema: data.schema ? JSON.stringify(data.schema) : undefined,
    },
  });

  return {
    ...dashboard,
    schema: parseDashboardSchema(dashboard.schema),
  };
}

export async function deleteDashboard(id: string): Promise<void> {
  await prisma.dashboard.delete({ where: { id } });
}

function parseDashboardSchema(schemaString: string): DashboardJson {
  try {
    const parsed = JSON.parse(schemaString);
    return dashboardJsonSchema.parse(parsed);
  } catch {
    return dashboardJsonSchema.parse({});
  }
}
