"use client";

import type { DashboardJson, Widget } from "@/src/entities/dashboard";
import type { PresentationStep } from "@/src/views/presentation/model/types";
import { StepContent } from "./StepContent";

interface SchemaInspectorProps {
  schema: DashboardJson;
  currentStep: PresentationStep;
  selectedWidget: Widget | null;
}

export function SchemaInspector({
  schema,
  currentStep,
  selectedWidget,
}: SchemaInspectorProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden border-l bg-card">
      {/* 헤더 */}
      <div className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          {currentStep.label}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {currentStep.description}
        </p>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-4">
        <StepContent
          stepId={currentStep.id}
          schema={schema}
          selectedWidget={selectedWidget}
        />
      </div>
    </div>
  );
}
