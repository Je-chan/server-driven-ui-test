"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { DashboardEntity } from "@/src/entities/dashboard";
import { migrateFiltersToWidgets } from "@/src/entities/dashboard";
import { PresentationCanvas } from "@/src/widgets/presentation-canvas";
import { SchemaInspector } from "@/src/widgets/schema-inspector";
import { PRESENTATION_STEPS } from "../model/types";

interface PresentationPageProps {
  dashboard: DashboardEntity;
}

export function PresentationPage({ dashboard }: PresentationPageProps) {
  const schema = useMemo(() => migrateFiltersToWidgets(dashboard.schema), [dashboard.schema]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  const currentStep = PRESENTATION_STEPS[currentStepIndex];
  const selectedWidget = selectedWidgetId
    ? schema.widgets.find((w) => w.id === selectedWidgetId) ?? null
    : null;

  useEffect(() => {
    const updateWidth = () => {
      if (canvasContainerRef.current) {
        setContainerWidth(canvasContainerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handleStepChange = (index: number) => {
    setCurrentStepIndex(index);
    setSelectedWidgetId(null);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-card px-4 py-2">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로
          </Link>
          <div className="h-5 w-px bg-border" />
          <h1 className="text-sm font-semibold">{dashboard.title}</h1>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-1">
          {PRESENTATION_STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => handleStepChange(index)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                index === currentStepIndex
                  ? "bg-blue-500 text-white"
                  : index < currentStepIndex
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px]">
                {index + 1}
              </span>
              {step.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content: Split Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Canvas (60%) */}
        <div
          ref={canvasContainerRef}
          className="flex-[3] overflow-y-auto p-4"
        >
          <PresentationCanvas
            schema={schema}
            containerWidth={containerWidth}
            selectedWidgetId={selectedWidgetId}
            currentStepId={currentStep.id}
            onWidgetClick={(id) => setSelectedWidgetId(id === selectedWidgetId ? null : id)}
            onBackgroundClick={() => setSelectedWidgetId(null)}
          />
        </div>

        {/* Right: Inspector (40%) */}
        <div className="flex-[2] overflow-hidden">
          <SchemaInspector
            schema={schema}
            currentStep={currentStep}
            selectedWidget={selectedWidget}
          />
        </div>
      </div>
    </div>
  );
}
