import { redirect } from "next/navigation";
import { createDashboard } from "@/src/entities/dashboard";
import { prisma } from "@/src/shared/lib";

export const dynamic = "force-dynamic";

export default async function NewBuilderPage() {
  const adminUser = await prisma.user.findFirst({
    where: { role: "admin" },
  });

  if (!adminUser) {
    throw new Error("Admin user not found");
  }

  const defaultSchema = {
    version: "1.0.0",
    settings: {
      refreshInterval: 0,
      theme: "light" as const,
      gridColumns: 24,
      rowHeight: 40,
    },
    dataSources: [],
    filters: [],
    widgets: [],
    linkages: [],
  };

  const dashboard = await createDashboard({
    title: "Untitled Dashboard",
    schema: defaultSchema,
    createdBy: adminUser.id,
  });

  redirect(`/builder/${dashboard.id}`);
}
