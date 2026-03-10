"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface RequestParamsEditorProps {
  params: Record<string, unknown>;
  filterKeys: string[];
  onChange: (params: Record<string, unknown>) => void;
}

// {{filter.xxx}} 패턴에서 filterKey를 추출
function extractFilterKey(value: string): string | null {
  const match = value.match(/^\{\{filter\.(.+)\}\}$/);
  return match ? match[1] : null;
}

export function RequestParamsEditor({ params, filterKeys, onChange }: RequestParamsEditorProps) {
  const tb = useTranslations("builder");
  const tc = useTranslations("common");

  const entries = Object.entries(params);

  const handleAdd = () => {
    onChange({ ...params, "": "" });
  };

  const handleKeyChange = (oldKey: string, newKey: string, index: number) => {
    const newParams: Record<string, unknown> = {};
    let i = 0;
    for (const [k, v] of Object.entries(params)) {
      if (i === index) {
        newParams[newKey] = v;
      } else {
        newParams[k] = v;
      }
      i++;
    }
    onChange(newParams);
  };

  const handleValueChange = (key: string, value: string) => {
    onChange({ ...params, [key]: value });
  };

  const handleRemove = (keyToRemove: string, index: number) => {
    const newParams: Record<string, unknown> = {};
    let i = 0;
    for (const [k, v] of Object.entries(params)) {
      if (i !== index) {
        newParams[k] = v;
      }
      i++;
    }
    onChange(newParams);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">
          {tb("requestParams")}
        </label>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
        >
          <Plus className="h-3 w-3" />
          {tc("add")}
        </button>
      </div>

      <div className="mt-2 space-y-2">
        {entries.map(([key, value], idx) => {
          const strValue = String(value ?? "");
          const boundFilterKey = extractFilterKey(strValue);
          // "filter" = 필터 키 선택 모드, "custom" = 직접 입력 모드
          const isFilterMode = boundFilterKey !== null || strValue === "";

          return (
            <div key={idx} className="rounded-md border bg-muted/30 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{tb("paramKey")}</span>
                <button
                  onClick={() => handleRemove(key, idx)}
                  className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              <input
                type="text"
                value={key}
                onChange={(e) => handleKeyChange(key, e.target.value, idx)}
                placeholder={tb("paramKey")}
                className="mt-1 w-full rounded border bg-background px-2 py-1 text-xs"
              />

              <div className="mt-1.5">
                <label className="text-[10px] text-muted-foreground">{tb("paramValue")}</label>
                {filterKeys.length > 0 ? (
                  <select
                    value={isFilterMode ? (boundFilterKey ?? "") : "__custom__"}
                    onChange={(e) => {
                      const selected = e.target.value;
                      if (selected === "__custom__") {
                        // 직접 입력 모드: 기존 값이 필터 참조면 빈 문자열로
                        handleValueChange(key, boundFilterKey ? "" : strValue);
                      } else if (selected === "") {
                        handleValueChange(key, "");
                      } else {
                        handleValueChange(key, `{{filter.${selected}}}`);
                      }
                    }}
                    className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                  >
                    <option value="">{tc("select")}</option>
                    {filterKeys.map((fk) => (
                      <option key={fk} value={fk}>
                        {fk}
                      </option>
                    ))}
                    <option value="__custom__">{tb("customValue")}</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    value={strValue}
                    onChange={(e) => handleValueChange(key, e.target.value)}
                    placeholder={tb("paramValue")}
                    className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                  />
                )}

                {/* 직접 입력 모드일 때 텍스트 입력 표시 */}
                {filterKeys.length > 0 && !isFilterMode && (
                  <input
                    type="text"
                    value={strValue}
                    onChange={(e) => handleValueChange(key, e.target.value)}
                    placeholder={tb("paramValue")}
                    className="mt-1 w-full rounded border bg-background px-2 py-1 text-xs"
                  />
                )}

                {/* 선택된 필터 키 미리보기 */}
                {boundFilterKey && (
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    → {strValue}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {entries.length === 0 && (
          <p className="py-2 text-center text-xs text-muted-foreground">
            {tb("noParams")}
          </p>
        )}
      </div>
    </div>
  );
}
