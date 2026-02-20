"use client";

import { useState } from "react";
import { Settings, Database, Palette, Trash2, Plus } from "lucide-react";
import { useBuilderStore } from "@/src/features/dashboard-builder/model/builder.store";
import { getWidgetType } from "@/src/entities/widget";
import {
  DEFAULT_DATA_SOURCES,
  type DashboardDataSource,
  type MeasurementMapping,
} from "@/src/entities/data-source";
import { FilterWidgetOptions } from "./FilterWidgetOptions";
import { FormWidgetOptions } from "./FormWidgetOptions";

type TabType = "style" | "data" | "options";

export function PropertyPanel() {
  const [activeTab, setActiveTab] = useState<TabType>("data");
  const {
    schema,
    selectedWidgetId,
    selectedCardId,
    updateWidget,
    removeWidget,
    findWidget,
    updateChildWidget,
    removeChildWidget,
  } = useBuilderStore();

  // findWidget을 사용하여 최상위 또는 Card 자식 위젯 검색
  const foundWidget = selectedWidgetId ? findWidget(selectedWidgetId) : null;
  const selectedWidget = foundWidget?.widget ?? null;
  const parentCardId = foundWidget?.parentCardId ?? null;

  const widgetDef = selectedWidget ? getWidgetType(selectedWidget.type) : null;

  // 현재 대시보드의 데이터 소스 + 기본 데이터 소스 (중복 제거)
  const availableDataSources: DashboardDataSource[] = (() => {
    const schemaDataSources = schema.dataSources as DashboardDataSource[];
    const schemaIds = new Set(schemaDataSources.map((ds) => ds.id));
    const defaultsFiltered = DEFAULT_DATA_SOURCES.filter((ds) => !schemaIds.has(ds.id));
    return [...schemaDataSources, ...defaultsFiltered];
  })();

  if (!selectedWidget) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            PROPERTIES
          </h2>
        </div>
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Widget을 선택하여 속성을 편집하세요
        </div>
      </div>
    );
  }

  // 자식 위젯이면 updateChildWidget, 최상위이면 updateWidget
  const handleUpdate = (updates: Record<string, unknown>) => {
    if (parentCardId) {
      updateChildWidget(parentCardId, selectedWidget.id, updates);
    } else {
      updateWidget(selectedWidget.id, updates);
    }
  };

  const handleDelete = () => {
    if (parentCardId) {
      removeChildWidget(parentCardId, selectedWidget.id);
    } else {
      removeWidget(selectedWidget.id);
    }
  };

  const handleTitleChange = (title: string) => {
    handleUpdate({ title });
  };

  const handleStyleChange = (key: string, value: string | number) => {
    handleUpdate({
      style: { ...selectedWidget.style, [key]: value },
    });
  };

  const handleLayoutChange = (key: string, value: number) => {
    handleUpdate({
      layout: { ...selectedWidget.layout, [key]: value },
    });
  };

  const handleDataSourceChange = (dataSourceId: string) => {
    handleUpdate({
      dataBinding: {
        dataSourceId,
        mapping: {
          measurements: [],
        },
      },
    });
  };

  const handleAddMeasurement = () => {
    const currentBinding = selectedWidget.dataBinding as { mapping?: { measurements?: MeasurementMapping[] } } | undefined;
    const measurements = currentBinding?.mapping?.measurements ?? [];

    handleUpdate({
      dataBinding: {
        ...currentBinding,
        mapping: {
          ...currentBinding?.mapping,
          measurements: [
            ...measurements,
            { field: "", label: "", unit: "" },
          ],
        },
      },
    });
  };

  const handleMeasurementChange = (
    index: number,
    key: keyof MeasurementMapping,
    value: string
  ) => {
    const currentBinding = selectedWidget.dataBinding as { dataSourceId?: string; mapping?: { timeField?: string; dimensions?: string[]; measurements?: MeasurementMapping[] } } | undefined;
    const measurements = [...(currentBinding?.mapping?.measurements ?? [])];
    measurements[index] = { ...measurements[index], [key]: value };

    handleUpdate({
      dataBinding: {
        ...currentBinding,
        mapping: {
          ...currentBinding?.mapping,
          measurements,
        },
      },
    });
  };

  const handleRemoveMeasurement = (index: number) => {
    const currentBinding = selectedWidget.dataBinding as { mapping?: { measurements?: MeasurementMapping[] } } | undefined;
    const measurements = [...(currentBinding?.mapping?.measurements ?? [])];
    measurements.splice(index, 1);

    handleUpdate({
      dataBinding: {
        ...currentBinding,
        mapping: {
          ...currentBinding?.mapping,
          measurements,
        },
      },
    });
  };

  const handleTimeFieldChange = (timeField: string) => {
    const currentBinding = selectedWidget.dataBinding as { mapping?: Record<string, unknown> } | undefined;
    handleUpdate({
      dataBinding: {
        ...currentBinding,
        mapping: {
          ...currentBinding?.mapping,
          timeField,
        },
      },
    });
  };

  // 현재 선택된 데이터 소스
  const currentDataSourceId = (selectedWidget.dataBinding as { dataSourceId?: string } | undefined)?.dataSourceId;
  const currentDataSource = availableDataSources.find((d) => d.id === currentDataSourceId);
  const currentBinding = selectedWidget.dataBinding as { mapping?: { timeField?: string; measurements?: MeasurementMapping[] } } | undefined;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            PROPERTIES
          </h2>
          <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {widgetDef?.label ?? selectedWidget.type}
          </span>
        </div>
        <button
          onClick={handleDelete}
          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          title="Widget 삭제"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("data")}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === "data"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          Data
        </button>
        <button
          onClick={() => setActiveTab("style")}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === "style"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Palette className="h-3.5 w-3.5" />
          스타일
        </button>
        <button
          onClick={() => setActiveTab("options")}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === "options"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="h-3.5 w-3.5" />
          옵션
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pt-4">
        {/* Data Tab */}
        {activeTab === "data" && (
          <div className="space-y-4">
            {/* Data Source Selection */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Data Source
              </label>
              <select
                value={currentDataSourceId ?? ""}
                onChange={(e) => handleDataSourceChange(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Data Source 선택...</option>
                {availableDataSources.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    {ds.name} ({ds.type})
                  </option>
                ))}
              </select>
            </div>

            {currentDataSource && (
              <>
                {/* Available Fields Info */}
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground">사용 가능한 Fields</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {currentDataSource.returnStructure.dimensions.map((field) => (
                      <span
                        key={`dim-${field}`}
                        className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700"
                      >
                        {field}
                      </span>
                    ))}
                    {currentDataSource.returnStructure.measurements.map((field) => (
                      <span
                        key={`meas-${field}`}
                        className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Time Field (for charts) */}
                {["line-chart", "bar-chart"].includes(selectedWidget.type) && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      Time Field (X축)
                    </label>
                    <select
                      value={currentBinding?.mapping?.timeField ?? ""}
                      onChange={(e) => handleTimeFieldChange(e.target.value)}
                      className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Field 선택...</option>
                      {currentDataSource.returnStructure.dimensions.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Measurements Mapping */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">
                      Measurements (Y축 / 값)
                    </label>
                    <button
                      onClick={handleAddMeasurement}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
                    >
                      <Plus className="h-3 w-3" />
                      추가
                    </button>
                  </div>

                  <div className="mt-2 space-y-2">
                    {(currentBinding?.mapping?.measurements ?? []).map((m, idx) => (
                      <div key={idx} className="rounded-md border bg-muted/30 p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">시리즈 {idx + 1}</span>
                          <button
                            onClick={() => handleRemoveMeasurement(idx)}
                            className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="mt-2 grid gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground">Field</label>
                            <select
                              value={m.field}
                              onChange={(e) => handleMeasurementChange(idx, "field", e.target.value)}
                              className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                            >
                              <option value="">선택...</option>
                              {currentDataSource.returnStructure.measurements.map((field) => (
                                <option key={field} value={field}>
                                  {field}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-muted-foreground">라벨</label>
                              <input
                                type="text"
                                value={m.label}
                                onChange={(e) => handleMeasurementChange(idx, "label", e.target.value)}
                                placeholder="표시명"
                                className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground">단위</label>
                              <input
                                type="text"
                                value={m.unit ?? ""}
                                onChange={(e) => handleMeasurementChange(idx, "unit", e.target.value)}
                                placeholder="kW, %, 등"
                                className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">색상</label>
                            <div className="mt-0.5 flex gap-1">
                              <input
                                type="color"
                                value={m.color ?? "#3b82f6"}
                                onChange={(e) => handleMeasurementChange(idx, "color", e.target.value)}
                                className="h-7 w-8 cursor-pointer rounded border"
                              />
                              <input
                                type="text"
                                value={m.color ?? "#3b82f6"}
                                onChange={(e) => handleMeasurementChange(idx, "color", e.target.value)}
                                className="flex-1 rounded border bg-background px-2 py-1 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(currentBinding?.mapping?.measurements ?? []).length === 0 && (
                      <p className="py-4 text-center text-xs text-muted-foreground">
                        Measurements가 없습니다. &quot;추가&quot;를 클릭하여 데이터 필드를 추가하세요.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {!currentDataSourceId && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                Data Source를 선택하여 데이터 바인딩을 설정하세요
              </p>
            )}
          </div>
        )}

        {/* Style Tab */}
        {activeTab === "style" && (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">제목</label>
              <input
                type="text"
                value={selectedWidget.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Layout */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">레이아웃</label>
              <div className="mt-1 grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground">X</label>
                  <input
                    type="number"
                    value={selectedWidget.layout.x}
                    onChange={(e) => handleLayoutChange("x", parseInt(e.target.value) || 0)}
                    className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">Y</label>
                  <input
                    type="number"
                    value={selectedWidget.layout.y}
                    onChange={(e) => handleLayoutChange("y", parseInt(e.target.value) || 0)}
                    className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">W</label>
                  <input
                    type="number"
                    value={selectedWidget.layout.w}
                    onChange={(e) => handleLayoutChange("w", parseInt(e.target.value) || 1)}
                    min={selectedWidget.layout.minW ?? 1}
                    className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground">H</label>
                  <input
                    type="number"
                    value={selectedWidget.layout.h}
                    onChange={(e) => handleLayoutChange("h", parseInt(e.target.value) || 1)}
                    min={selectedWidget.layout.minH ?? 1}
                    className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Background */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">배경색</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="color"
                  value={selectedWidget.style?.backgroundColor ?? "#ffffff"}
                  onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border"
                />
                <input
                  type="text"
                  value={selectedWidget.style?.backgroundColor ?? "#ffffff"}
                  onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
                  className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
                />
              </div>
            </div>

            {/* Border Radius */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">테두리 반경</label>
              <input
                type="number"
                value={selectedWidget.style?.borderRadius ?? 8}
                onChange={(e) => handleStyleChange("borderRadius", parseInt(e.target.value) || 0)}
                min={0}
                className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              />
            </div>

            {/* Shadow */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">그림자</label>
              <select
                value={selectedWidget.style?.shadow ?? "sm"}
                onChange={(e) => handleStyleChange("shadow", e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              >
                <option value="none">없음</option>
                <option value="sm">작게</option>
                <option value="md">중간</option>
                <option value="lg">크게</option>
              </select>
            </div>
          </div>
        )}

        {/* Options Tab */}
        {activeTab === "options" && (
          <div className="space-y-4">
            {selectedWidget.type === "card" ? (
              <CardWidgetOptions
                widget={selectedWidget}
                onUpdate={handleUpdate}
              />
            ) : selectedWidget.type.startsWith("filter-") ? (
              <FilterWidgetOptions widget={selectedWidget} />
            ) : selectedWidget.type === "form" ? (
              <FormWidgetOptions widget={selectedWidget} />
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {widgetDef?.label ?? selectedWidget.type} Widget 옵션
                </p>
                <div className="rounded-md bg-muted/50 p-4 text-center text-xs text-muted-foreground">
                  Widget 옵션이 여기에 표시됩니다
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Card 위젯 전용 옵션 컴포넌트
function CardWidgetOptions({
  widget,
  onUpdate,
}: {
  widget: { options?: Record<string, unknown> };
  onUpdate: (updates: Record<string, unknown>) => void;
}) {
  const options = (widget.options ?? {}) as { showHeader?: boolean; headerTitle?: string };

  return (
    <>
      <p className="text-xs text-muted-foreground">Card 컨테이너 옵션</p>

      <div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={options.showHeader ?? true}
            onChange={(e) =>
              onUpdate({ options: { ...options, showHeader: e.target.checked } })
            }
            className="rounded border"
          />
          헤더 표시
        </label>
      </div>

      {(options.showHeader ?? true) && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">헤더 제목</label>
          <input
            type="text"
            value={options.headerTitle ?? ""}
            onChange={(e) =>
              onUpdate({ options: { ...options, headerTitle: e.target.value } })
            }
            placeholder="Card 제목"
            className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}
    </>
  );
}
