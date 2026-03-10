"use client";

import { useState } from "react";
import { Settings, Database, Palette, Trash2, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useBuilderStore } from "@/src/features/dashboard-builder/model/builder.store";
import { getWidgetType } from "@/src/entities/widget";
import {
  DEFAULT_DATA_SOURCES,
  type DashboardDataSource,
  type MeasurementMapping,
} from "@/src/entities/data-source";
import { resolveLabel, type I18nLabel } from "@/src/shared/lib";
import { FilterWidgetOptions } from "./FilterWidgetOptions";
import { FormWidgetOptions } from "./FormWidgetOptions";
import { ConditionsEditor } from "./ConditionsEditor";
import { KpiCardOptions } from "./KpiCardOptions";
import { LineChartOptions } from "./LineChartOptions";
import { BarChartOptions } from "./BarChartOptions";
import { PieChartOptions } from "./PieChartOptions";
import { TableOptions } from "./TableOptions";
import { GaugeOptions } from "./GaugeOptions";
import { MapOptions } from "./MapOptions";
import { TextOptions } from "./TextOptions";
import { ImageOptions } from "./ImageOptions";
import { RequestParamsEditor } from "./RequestParamsEditor";

type TabType = "style" | "data" | "options";

export function PropertyPanel() {
  const [activeTab, setActiveTab] = useState<TabType>("data");
  const locale = useLocale();
  const tb = useTranslations("builder");
  const tc = useTranslations("common");
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
          {tb("selectWidgetHint")}
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
  const currentBinding = selectedWidget.dataBinding as {
    dataSourceId?: string;
    requestParams?: Record<string, unknown>;
    mapping?: {
      timeField?: string;
      dimensions?: string[];
      measurements?: MeasurementMapping[];
      comparison?: { field: string; type: "split" | "overlay" };
    };
  } | undefined;

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
          title={tb("deleteWidget")}
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
          {tb("tabData")}
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
          {tb("tabStyle")}
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
          {tb("tabOptions")}
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
                <option value="">{tb("selectDataSource")}</option>
                {availableDataSources.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    {resolveLabel(ds.name, locale)} ({ds.type})
                  </option>
                ))}
              </select>
            </div>

            {currentDataSource && (
              <>
                {/* Available Fields Info */}
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground">{tb("availableFields")}</p>
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

                {/* Request Params Editor */}
                <RequestParamsEditor
                  params={currentBinding?.requestParams ?? {}}
                  filterKeys={collectFilterKeys(schema.widgets)}
                  onChange={(requestParams) => {
                    handleUpdate({
                      dataBinding: {
                        ...currentBinding,
                        requestParams,
                      },
                    });
                  }}
                />

                {/* Time Field (for charts) */}
                {["line-chart", "bar-chart"].includes(selectedWidget.type) && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      {tb("timeField")}
                    </label>
                    <select
                      value={currentBinding?.mapping?.timeField ?? ""}
                      onChange={(e) => handleTimeFieldChange(e.target.value)}
                      className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">{tb("selectField")}</option>
                      {currentDataSource.returnStructure.dimensions.map((field) => (
                        <option key={field} value={field}>
                          {field}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Dimensions Mapping */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    {tb("dimensions")}
                  </label>
                  <p className="text-[10px] text-muted-foreground">{tb("dimensionsHint")}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {currentDataSource.returnStructure.dimensions.map((field) => {
                      const isSelected = (currentBinding?.mapping?.dimensions ?? []).includes(field);
                      return (
                        <button
                          key={field}
                          onClick={() => {
                            const dims = currentBinding?.mapping?.dimensions ?? [];
                            const newDims = isSelected
                              ? dims.filter((d) => d !== field)
                              : [...dims, field];
                            handleUpdate({
                              dataBinding: {
                                ...currentBinding,
                                mapping: {
                                  ...currentBinding?.mapping,
                                  dimensions: newDims,
                                },
                              },
                            });
                          }}
                          className={`rounded px-1.5 py-0.5 text-xs transition-colors ${
                            isSelected
                              ? "bg-blue-500 text-white"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                        >
                          {field}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Measurements Mapping */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">
                      {tb("measurements")}
                    </label>
                    <button
                      onClick={handleAddMeasurement}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
                    >
                      <Plus className="h-3 w-3" />
                      {tc("add")}
                    </button>
                  </div>

                  <div className="mt-2 space-y-2">
                    {(currentBinding?.mapping?.measurements ?? []).map((m, idx) => (
                      <div key={idx} className="rounded-md border bg-muted/30 p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{tb("series")} {idx + 1}</span>
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
                              <option value="">{tc("select")}</option>
                              {currentDataSource.returnStructure.measurements.map((field) => (
                                <option key={field} value={field}>
                                  {field}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-muted-foreground">{tb("fieldLabel")}</label>
                              <input
                                type="text"
                                value={resolveLabel(m.label, locale)}
                                onChange={(e) => handleMeasurementChange(idx, "label", e.target.value)}
                                placeholder={tb("fieldLabel")}
                                className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground">{tb("fieldUnit")}</label>
                              <input
                                type="text"
                                value={resolveLabel(m.unit, locale)}
                                onChange={(e) => handleMeasurementChange(idx, "unit", e.target.value)}
                                placeholder="kW, %, 등"
                                className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-muted-foreground">{tb("aggregation")}</label>
                              <select
                                value={m.aggregation ?? "sum"}
                                onChange={(e) => handleMeasurementChange(idx, "aggregation", e.target.value)}
                                className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                              >
                                <option value="sum">sum</option>
                                <option value="avg">avg</option>
                                <option value="min">min</option>
                                <option value="max">max</option>
                                <option value="count">count</option>
                                <option value="latest">latest</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground">{tb("format")}</label>
                              <input
                                type="text"
                                value={m.format ?? ""}
                                onChange={(e) => handleMeasurementChange(idx, "format", e.target.value)}
                                placeholder="0,0.00"
                                className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">{tb("fieldColor")}</label>
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
                        {tb("noMeasurements")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Comparison Mapping (chart widgets only) */}
                {["line-chart", "bar-chart"].includes(selectedWidget.type) && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">
                      {tb("comparison")}
                    </label>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-muted-foreground">{tb("comparisonField")}</label>
                        <select
                          value={currentBinding?.mapping?.comparison?.field ?? ""}
                          onChange={(e) => {
                            const field = e.target.value;
                            handleUpdate({
                              dataBinding: {
                                ...currentBinding,
                                mapping: {
                                  ...currentBinding?.mapping,
                                  comparison: field
                                    ? { field, type: currentBinding?.mapping?.comparison?.type ?? "split" }
                                    : undefined,
                                },
                              },
                            });
                          }}
                          className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                        >
                          <option value="">{tb("shadowNone")}</option>
                          {currentDataSource.returnStructure.dimensions.map((field) => (
                            <option key={field} value={field}>{field}</option>
                          ))}
                        </select>
                      </div>
                      {currentBinding?.mapping?.comparison?.field && (
                        <div>
                          <label className="text-[10px] text-muted-foreground">{tb("comparisonType")}</label>
                          <select
                            value={currentBinding.mapping.comparison.type}
                            onChange={(e) => {
                              handleUpdate({
                                dataBinding: {
                                  ...currentBinding,
                                  mapping: {
                                    ...currentBinding?.mapping,
                                    comparison: {
                                      ...currentBinding.mapping!.comparison!,
                                      type: e.target.value as "split" | "overlay",
                                    },
                                  },
                                },
                              });
                            }}
                            className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                          >
                            <option value="split">{tb("comparisonSplit")}</option>
                            <option value="overlay">{tb("comparisonOverlay")}</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {!currentDataSourceId && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                {tb("selectDataSourceHint")}
              </p>
            )}
          </div>
        )}

        {/* Style Tab */}
        {activeTab === "style" && (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">{tb("title")}</label>
              <input
                type="text"
                value={typeof selectedWidget.title === "string" ? selectedWidget.title : resolveLabel(selectedWidget.title, locale)}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Layout */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">{tb("layout")}</label>
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
              <label className="text-xs font-medium text-muted-foreground">{tb("backgroundColor")}</label>
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
              <label className="text-xs font-medium text-muted-foreground">{tb("borderRadius")}</label>
              <input
                type="number"
                value={selectedWidget.style?.borderRadius ?? 8}
                onChange={(e) => handleStyleChange("borderRadius", parseInt(e.target.value) || 0)}
                min={0}
                className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              />
            </div>

            {/* Padding */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">{tb("padding")}</label>
              <input
                type="number"
                value={selectedWidget.style?.padding ?? 16}
                onChange={(e) => handleStyleChange("padding", parseInt(e.target.value) || 0)}
                min={0}
                className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              />
            </div>

            {/* Shadow */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">{tb("shadow")}</label>
              <select
                value={selectedWidget.style?.shadow ?? "sm"}
                onChange={(e) => handleStyleChange("shadow", e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              >
                <option value="none">{tb("shadowNone")}</option>
                <option value="sm">{tb("shadowSm")}</option>
                <option value="md">{tb("shadowMd")}</option>
                <option value="lg">{tb("shadowLg")}</option>
              </select>
            </div>
          </div>
        )}

        {/* Options Tab */}
        {activeTab === "options" && (
          <div className="space-y-4">
            {selectedWidget.type === "conditional-slot" ? (
              <ConditionalSlotOptions
                widget={selectedWidget}
                onUpdate={handleUpdate}
              />
            ) : selectedWidget.type === "card" ? (
              <CardWidgetOptions
                widget={selectedWidget}
                onUpdate={handleUpdate}
              />
            ) : selectedWidget.type.startsWith("filter-") ? (
              <FilterWidgetOptions widget={selectedWidget} />
            ) : selectedWidget.type === "form" ? (
              <FormWidgetOptions widget={selectedWidget} />
            ) : (
              <WidgetOptionsDispatch widget={selectedWidget} onUpdate={handleUpdate} widgetLabel={widgetDef?.label ?? selectedWidget.type} />
            )}

            {/* 조건부 표시 — 모든 위젯 타입에서 사용 가능 */}
            <ConditionsEditor widget={selectedWidget} parentCardId={parentCardId} />
          </div>
        )}
      </div>
    </div>
  );
}

// Conditional Slot 위젯 전용 옵션 컴포넌트
function ConditionalSlotOptions({
  widget,
}: {
  widget: { children?: Array<{ id: string; title: I18nLabel; type: string; conditions?: { rules?: unknown[] } }>; options?: Record<string, unknown> };
  onUpdate: (updates: Record<string, unknown>) => void;
}) {
  const locale = useLocale();
  const tb = useTranslations("builder");
  const children = widget.children ?? [];

  return (
    <>
      <p className="text-xs text-muted-foreground">
        {tb("conditionalSlotHint")}
      </p>

      <div>
        <label className="text-xs font-medium text-muted-foreground">
          {tb("slotCount", { count: children.length })}
        </label>
        <div className="mt-2 space-y-1.5">
          {children.map((child, idx) => {
            const hasConditions = (child.conditions?.rules?.length ?? 0) > 0;
            return (
              <div
                key={child.id}
                className="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5"
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {idx + 1}.
                </span>
                <span className="flex-1 truncate text-xs">
                  {resolveLabel(child.title, locale)}
                </span>
                <span className="rounded bg-muted px-1 py-0.5 text-[9px] text-muted-foreground">
                  {child.type}
                </span>
                {hasConditions ? (
                  <span className="rounded bg-amber-100 px-1 py-0.5 text-[9px] text-amber-700">
                    {tb("conditional")}
                  </span>
                ) : (
                  <span className="rounded bg-gray-100 px-1 py-0.5 text-[9px] text-gray-500">
                    {tb("slotFallback")}
                  </span>
                )}
              </div>
            );
          })}
          {children.length === 0 && (
            <p className="py-2 text-center text-xs text-muted-foreground">
              {tb("emptyConditionalSlot")}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

// 위젯 타입별 옵션 에디터 디스패치
function WidgetOptionsDispatch({
  widget,
  onUpdate,
  widgetLabel,
}: {
  widget: { type: string; options?: Record<string, unknown> };
  onUpdate: (updates: Record<string, unknown>) => void;
  widgetLabel: string;
}) {
  const tb = useTranslations("builder");

  switch (widget.type) {
    case "kpi-card":
    case "number-card":
      return <KpiCardOptions widget={widget} onUpdate={onUpdate} />;
    case "line-chart":
      return <LineChartOptions widget={widget} onUpdate={onUpdate} />;
    case "bar-chart":
      return <BarChartOptions widget={widget} onUpdate={onUpdate} />;
    case "pie-chart":
      return <PieChartOptions widget={widget} onUpdate={onUpdate} />;
    case "table":
      return <TableOptions widget={widget} onUpdate={onUpdate} />;
    case "gauge":
      return <GaugeOptions widget={widget} onUpdate={onUpdate} />;
    case "map":
      return <MapOptions widget={widget} onUpdate={onUpdate} />;
    case "text":
      return <TextOptions widget={widget} onUpdate={onUpdate} />;
    case "image":
      return <ImageOptions widget={widget} onUpdate={onUpdate} />;
    default:
      return (
        <>
          <p className="text-xs text-muted-foreground">
            {tb("widgetOptions", { widget: widgetLabel })}
          </p>
          <div className="rounded-md bg-muted/50 p-4 text-center text-xs text-muted-foreground">
            {tb("widgetOptionsPlaceholder")}
          </div>
        </>
      );
  }
}

// Card 위젯 전용 옵션 컴포넌트
function CardWidgetOptions({
  widget,
  onUpdate,
}: {
  widget: { options?: Record<string, unknown> };
  onUpdate: (updates: Record<string, unknown>) => void;
}) {
  const tb = useTranslations("builder");
  const options = (widget.options ?? {}) as { showHeader?: boolean; headerTitle?: string };

  return (
    <>
      <p className="text-xs text-muted-foreground">{tb("cardOptions")}</p>

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
          {tb("showHeader")}
        </label>
      </div>

      {(options.showHeader ?? true) && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">{tb("headerTitle")}</label>
          <input
            type="text"
            value={options.headerTitle ?? ""}
            onChange={(e) =>
              onUpdate({ options: { ...options, headerTitle: e.target.value } })
            }
            placeholder={tb("headerTitlePlaceholder")}
            className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}
    </>
  );
}

// 대시보드 위젯에서 filter-* 타입의 filterKey를 수집
function collectFilterKeys(widgets: unknown): string[] {
  if (!Array.isArray(widgets)) return [];
  const keys: string[] = [];
  for (const w of widgets) {
    const widget = w as { type?: string; options?: { filterKey?: string }; children?: unknown[] };
    if (widget.type?.startsWith("filter-") && widget.options?.filterKey) {
      keys.push(widget.options.filterKey);
    }
    // card/conditional-slot 자식도 검색
    if (Array.isArray(widget.children)) {
      keys.push(...collectFilterKeys(widget.children));
    }
  }
  return keys;
}
