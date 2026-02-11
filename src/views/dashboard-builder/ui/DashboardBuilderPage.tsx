"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye, Undo, Redo, Loader2, Monitor, Grid3X3 } from "lucide-react";
import { useBuilderStore } from "@/src/features/dashboard-builder";
import { BuilderCanvas, RESOLUTION_PRESETS, type ResolutionKey } from "@/src/widgets/builder-canvas";
import { WidgetPalette } from "@/src/widgets/widget-palette";
import { PropertyPanel } from "@/src/widgets/property-panel";
import type { DashboardEntity } from "@/src/entities/dashboard";
import { migrateFiltersToWidgets } from "@/src/entities/dashboard";

interface DashboardBuilderPageProps {
  dashboard: DashboardEntity;
}

export function DashboardBuilderPage({ dashboard }: DashboardBuilderPageProps) {
  const router = useRouter();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [resolution, setResolution] = useState<ResolutionKey>("1920x1080");
  const [isSaving, setIsSaving] = useState(false);
  const [showResolutionMenu, setShowResolutionMenu] = useState(false);
  const [showGridSettings, setShowGridSettings] = useState(false);

  const {
    schema,
    initSchema,
    isDirty,
    canUndo,
    canRedo,
    undo,
    redo,
    getSchema,
    resetDirty,
    selectWidget,
    updateSettings,
  } = useBuilderStore();

  // 초기 스키마 로드 (기존 filters[] 자동 마이그레이션)
  useEffect(() => {
    initSchema(migrateFiltersToWidgets(dashboard.schema));
  }, [dashboard.schema, initSchema]);

  // 캔버스 컨테이너 너비 계산
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

  // 저장 핸들러
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const schema = getSchema();
      const response = await fetch(`/api/dashboards/${dashboard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schema }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      resetDirty();
      router.refresh();
    } catch (error) {
      console.error("Save failed:", error);
      alert("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Toolbar */}
      <header className="flex items-center justify-between border-b bg-card px-4 py-2">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로가기
          </Link>
          <div className="h-6 w-px bg-border" />
          <h1 className="text-lg font-semibold">{dashboard.title}</h1>
          {isDirty && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              저장되지 않음
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 해상도 선택 */}
          <div className="relative">
            <button
              onClick={() => setShowResolutionMenu(!showResolutionMenu)}
              className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              <Monitor className="h-4 w-4" />
              {resolution}
            </button>
            {showResolutionMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowResolutionMenu(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border bg-card py-1 shadow-lg">
                  {(Object.keys(RESOLUTION_PRESETS) as ResolutionKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setResolution(key);
                        setShowResolutionMenu(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-accent ${
                        resolution === key ? "bg-accent font-medium" : ""
                      }`}
                    >
                      <span>{RESOLUTION_PRESETS[key].label}</span>
                      {resolution === key && (
                        <span className="text-primary">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 그리드 설정 */}
          <div className="relative">
            <button
              onClick={() => setShowGridSettings(!showGridSettings)}
              className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
              title="그리드 설정"
            >
              <Grid3X3 className="h-4 w-4" />
              Grid
            </button>
            {showGridSettings && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowGridSettings(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-md border bg-card p-3 shadow-lg">
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Row Height
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={schema.settings?.rowHeight ?? 10}
                        onChange={(e) => {
                          const v = Math.max(1, Math.min(100, Number(e.target.value) || 10));
                          updateSettings({ rowHeight: v });
                        }}
                        className="w-full rounded-md border px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Grid Columns
                      </label>
                      <input
                        type="number"
                        min={6}
                        max={48}
                        value={schema.settings?.gridColumns ?? 24}
                        onChange={(e) => {
                          const v = Math.max(6, Math.min(48, Number(e.target.value) || 24));
                          updateSettings({ gridColumns: v });
                        }}
                        className="w-full rounded-md border px-2 py-1.5 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="h-6 w-px bg-border" />

          <button
            onClick={undo}
            disabled={!canUndo()}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            title="실행 취소 (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            title="다시 실행 (Ctrl+Shift+Z)"
          >
            <Redo className="h-4 w-4" />
          </button>
          <div className="h-6 w-px bg-border" />
          <Link
            href={`/dashboard/${dashboard.id}`}
            className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            <Eye className="h-4 w-4" />
            미리보기
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            저장
          </button>
        </div>
      </header>

      {/* Builder Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Widget Palette */}
        <aside className="w-64 flex-shrink-0 overflow-y-auto border-r bg-card p-4">
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground">
            WIDGETS
          </h2>
          <WidgetPalette />
        </aside>

        {/* Canvas */}
        <main
          ref={canvasContainerRef}
          className="flex-1 overflow-auto bg-muted/30 p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              selectWidget(null);
            }
          }}
        >
          <BuilderCanvas
            containerWidth={containerWidth}
            resolution={resolution}
          />
        </main>

        {/* Property Panel */}
        <aside className="w-80 flex-shrink-0 overflow-y-auto border-l bg-card p-4">
          <PropertyPanel />
        </aside>
      </div>
    </div>
  );
}
