"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useBuilderStore } from "@/src/features/dashboard-builder/model/builder.store";
import type { Widget } from "@/src/entities/dashboard";

interface FilterWidgetOptionsProps {
  widget: Widget;
}

export function FilterWidgetOptions({ widget }: FilterWidgetOptionsProps) {
  const { updateWidget } = useBuilderStore();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const opts = (widget.options ?? {}) as Record<string, unknown>;
  const widgetType = widget.type;

  const updateOption = (key: string, value: unknown) => {
    updateWidget(widget.id, {
      options: { ...opts, [key]: value },
    });
  };

  const filterKey = (opts.filterKey as string) ?? "";
  const options = (opts.options as { value: string; label: string }[]) ?? [];
  const placeholder = (opts.placeholder as string) ?? "";
  const defaultValue = opts.defaultValue as string | undefined;
  const fixedValue = opts.fixedValue as string | undefined;
  const visible = opts.visible as boolean | undefined;
  const variant = (opts.variant as string) ?? "pill";

  // 옵션 추가
  const handleAddOption = () => {
    updateOption("options", [...options, { value: "", label: "" }]);
  };

  const handleOptionChange = (index: number, key: "value" | "label", value: string) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [key]: value };
    updateOption("options", updated);
  };

  const handleRemoveOption = (index: number) => {
    updateOption("options", options.filter((_, i) => i !== index));
  };

  // Datepicker 전용
  const presets = (opts.presets as string[]) ?? [];
  const outputKeys = (opts.outputKeys as { start: string; end: string }) ?? { start: "startTime", end: "endTime" };

  const togglePreset = (preset: string) => {
    const updated = presets.includes(preset)
      ? presets.filter((p) => p !== preset)
      : [...presets, preset];
    updateOption("presets", updated);
  };

  return (
    <div className="space-y-4">
      {/* Filter Key */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Filter Key</label>
        <input
          type="text"
          value={filterKey}
          onChange={(e) => updateOption("filterKey", e.target.value)}
          placeholder="예: selectedSite"
          className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <p className="mt-1 text-[10px] text-muted-foreground">
          {`위젯에서 {{filter.${filterKey || "KEY"}}} 로 참조됩니다`}
        </p>
      </div>

      {/* 옵션 목록 (select, multiselect, treeselect, tab) */}
      {["filter-select", "filter-multiselect", "filter-treeselect", "filter-tab"].includes(widgetType) && (
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">옵션 목록</label>
            <button
              onClick={handleAddOption}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
            >
              <Plus className="h-3 w-3" />
              추가
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <input
                  type="text"
                  value={opt.value}
                  onChange={(e) => handleOptionChange(idx, "value", e.target.value)}
                  placeholder="값"
                  className="w-1/3 rounded border bg-background px-2 py-1 text-xs"
                />
                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) => handleOptionChange(idx, "label", e.target.value)}
                  placeholder="라벨"
                  className="flex-1 rounded border bg-background px-2 py-1 text-xs"
                />
                <button
                  onClick={() => handleRemoveOption(idx)}
                  className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {options.length === 0 && (
              <p className="py-2 text-center text-xs text-muted-foreground">
                옵션이 없습니다
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab Variant */}
      {widgetType === "filter-tab" && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Variant</label>
          <select
            value={variant}
            onChange={(e) => updateOption("variant", e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
          >
            <option value="pill">Pill</option>
            <option value="tab">Tab</option>
            <option value="button">Button</option>
          </select>
        </div>
      )}

      {/* Placeholder (input, select) */}
      {["filter-input", "filter-select", "filter-treeselect"].includes(widgetType) && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Placeholder</label>
          <input
            type="text"
            value={placeholder}
            onChange={(e) => updateOption("placeholder", e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </div>
      )}

      {/* Default Value */}
      {widgetType !== "filter-datepicker" && (
        <div>
          <label className="text-xs font-medium text-muted-foreground">기본값</label>
          <input
            type="text"
            value={String(defaultValue ?? "")}
            onChange={(e) => updateOption("defaultValue", e.target.value || undefined)}
            placeholder="기본 선택값"
            className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
          />
        </div>
      )}

      {/* Datepicker: presets, outputKeys */}
      {widgetType === "filter-datepicker" && (
        <>
          <div>
            <label className="text-xs font-medium text-muted-foreground">프리셋</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {["today", "yesterday", "last7days", "last30days", "thisMonth"].map((preset) => (
                <button
                  key={preset}
                  onClick={() => togglePreset(preset)}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    presets.includes(preset)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">기본 프리셋</label>
            <select
              value={String(defaultValue ?? "today")}
              onChange={(e) => updateOption("defaultValue", e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              {presets.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Start Key</label>
              <input
                type="text"
                value={outputKeys.start}
                onChange={(e) => updateOption("outputKeys", { ...outputKeys, start: e.target.value })}
                className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">End Key</label>
              <input
                type="text"
                value={outputKeys.end}
                onChange={(e) => updateOption("outputKeys", { ...outputKeys, end: e.target.value })}
                className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
              />
            </div>
          </div>
        </>
      )}

      {/* Advanced Settings */}
      <div className="border-t pt-3">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {showAdvanced ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          고급 설정
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3">
            {/* visible */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="filter-visible"
                checked={visible !== false}
                onChange={(e) => updateOption("visible", e.target.checked)}
                className="h-4 w-4 rounded border"
              />
              <label htmlFor="filter-visible" className="text-xs text-muted-foreground">
                뷰어에서 표시
              </label>
            </div>

            {/* fixedValue */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">고정값 (읽기 전용)</label>
              <input
                type="text"
                value={String(fixedValue ?? "")}
                onChange={(e) => updateOption("fixedValue", e.target.value || undefined)}
                placeholder="비워두면 사용자 변경 가능"
                className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
              />
            </div>

            {/* dependsOn */}
            {["filter-select", "filter-treeselect"].includes(widgetType) && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">의존 필터 Key</label>
                <input
                  type="text"
                  value={(opts.dependsOn as { filterKey?: string } | undefined)?.filterKey ?? ""}
                  onChange={(e) => {
                    const currentDeps = (opts.dependsOn as { filterKey: string; optionsMap: Record<string, { value: string; label: string }[]> } | undefined) ?? { filterKey: "", optionsMap: {} };
                    updateOption("dependsOn", e.target.value ? { ...currentDeps, filterKey: e.target.value } : undefined);
                  }}
                  placeholder="부모 filterKey"
                  className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
