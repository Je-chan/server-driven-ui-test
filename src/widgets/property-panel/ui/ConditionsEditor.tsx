/**
 * ConditionsEditor — 빌더 속성 패널의 조건부 렌더링 규칙 편집기.
 *
 * conditional-slot 위젯의 자식 위젯에 conditions를 설정할 때 사용한다.
 * 관리자가 로우코드 빌더에서 드래그 앤 드롭이 아닌 폼 UI로 조건 규칙을 편집할 수 있게 해준다.
 *
 * 기능:
 * - 규칙 추가/삭제: + 버튼으로 새 규칙 추가, 휴지통 아이콘으로 삭제
 * - variable 선택: 대시보드 내 모든 filter-* 위젯의 filterKey를 드롭다운으로 표시
 *                  (filterKey가 없으면 직접 텍스트 입력 가능)
 * - operator 선택: eq, neq, in, notIn, exists, notExists 중 선택
 * - value 입력: in/notIn은 쉼표 구분 배열 입력, exists/notExists는 value 불필요
 * - logic 토글: 2개 이상 규칙 시 AND/OR 토글 표시
 *
 * 데이터 흐름:
 * 1. 관리자가 규칙 수정
 * 2. handleUpdate() → builderStore.updateWidget() 또는 updateChildWidget() 호출
 * 3. Zustand 스토어에 스키마 반영
 * 4. 저장 시 API로 DB에 persist
 * 5. 뷰어에서 evaluateConditions()가 이 규칙을 평가
 *
 * 사용처: PropertyPanel → ConditionsEditor (빌더 우측 패널)
 */
"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useBuilderStore } from "@/src/features/dashboard-builder/model/builder.store";
import type { Widget, WidgetConditions } from "@/src/entities/dashboard";

interface ConditionsEditorProps {
  widget: Widget;                    // 조건을 편집할 대상 위젯
  parentCardId: string | null;       // conditional-slot 부모 ID (자식 편집 시 필요)
}

export function ConditionsEditor({ widget, parentCardId }: ConditionsEditorProps) {
  const tb = useTranslations("builder");
  const tc = useTranslations("common");
  const { schema, updateWidget, updateChildWidget } = useBuilderStore();
  const [expanded, setExpanded] = useState(false);

  const conditions: WidgetConditions = (widget.conditions as WidgetConditions) ?? { logic: "and", rules: [] };
  const rules = conditions.rules ?? [];

  const handleUpdate = (updated: WidgetConditions) => {
    const cleanConditions = updated.rules.length > 0 ? updated : undefined;
    if (parentCardId) {
      updateChildWidget(parentCardId, widget.id, { conditions: cleanConditions });
    } else {
      updateWidget(widget.id, { conditions: cleanConditions });
    }
  };

  // 대시보드 내 모든 filter-* 위젯에서 filterKey 추출
  const filterKeys: string[] = (() => {
    const keys = new Set<string>();
    for (const w of schema.widgets) {
      if (w.type.startsWith("filter-")) {
        const fk = (w.options as { filterKey?: string } | undefined)?.filterKey;
        if (fk) keys.add(fk);
      }
      if (w.children) {
        for (const c of w.children) {
          if (c.type.startsWith("filter-")) {
            const fk = (c.options as { filterKey?: string } | undefined)?.filterKey;
            if (fk) keys.add(fk);
          }
        }
      }
    }
    return Array.from(keys);
  })();

  const handleAddRule = () => {
    handleUpdate({
      ...conditions,
      rules: [...rules, { variable: "", operator: "eq", value: "" }],
    });
    setExpanded(true);
  };

  const handleRemoveRule = (index: number) => {
    const updated = [...rules];
    updated.splice(index, 1);
    handleUpdate({ ...conditions, rules: updated });
  };

  const handleRuleChange = (index: number, key: string, value: unknown) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [key]: value };
    handleUpdate({ ...conditions, rules: updated });
  };

  const handleLogicChange = (logic: "and" | "or") => {
    handleUpdate({ ...conditions, logic });
  };

  const operators = [
    { value: "eq", label: "=" },
    { value: "neq", label: "≠" },
    { value: "in", label: "in" },
    { value: "notIn", label: "not in" },
    { value: "exists", label: "exists" },
    { value: "notExists", label: "not exists" },
  ] as const;

  const needsValue = (op: string) => !["exists", "notExists"].includes(op);
  const isArrayOp = (op: string) => ["in", "notIn"].includes(op);

  return (
    <div className="border-t pt-3">
      <div className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 hover:text-foreground"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {tb("conditionsTitle")}
          {rules.length > 0 && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">
              {rules.length}
            </span>
          )}
        </button>
        <button
          onClick={handleAddRule}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
        >
          <Plus className="h-3 w-3" />
          {tb("conditionsAdd")}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3">
          {rules.length === 0 ? (
            <p className="py-2 text-center text-xs text-muted-foreground">
              {tb("conditionsNone")}
            </p>
          ) : (
            <>
              {/* Logic toggle */}
              {rules.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleLogicChange("and")}
                    className={`rounded px-2 py-1 text-xs transition-colors ${
                      conditions.logic === "and"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tb("conditionsLogicAnd")}
                  </button>
                  <button
                    onClick={() => handleLogicChange("or")}
                    className={`rounded px-2 py-1 text-xs transition-colors ${
                      conditions.logic === "or"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tb("conditionsLogicOr")}
                  </button>
                </div>
              )}

              {/* Rules */}
              {rules.map((rule, idx) => (
                <div key={idx} className="rounded-md border bg-muted/30 p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{tb("conditionsRule")} {idx + 1}</span>
                    <button
                      onClick={() => handleRemoveRule(idx)}
                      className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    {/* Variable */}
                    <div>
                      <label className="text-[10px] text-muted-foreground">{tb("conditionsVariable")}</label>
                      {filterKeys.length > 0 ? (
                        <select
                          value={filterKeys.includes(rule.variable) ? rule.variable : "__custom__"}
                          onChange={(e) => {
                            if (e.target.value === "__custom__") return;
                            handleRuleChange(idx, "variable", e.target.value);
                          }}
                          className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                        >
                          <option value="">{tc("select")}</option>
                          {filterKeys.map((k) => (
                            <option key={k} value={k}>{k}</option>
                          ))}
                          {rule.variable && !filterKeys.includes(rule.variable) && (
                            <option value="__custom__">{rule.variable} ({tb("conditionsCustomInput")})</option>
                          )}
                          <option value="__custom__">{tb("conditionsCustomInput")}</option>
                        </select>
                      ) : null}
                      {(filterKeys.length === 0 || (rule.variable && !filterKeys.includes(rule.variable))) && (
                        <input
                          type="text"
                          value={rule.variable}
                          onChange={(e) => handleRuleChange(idx, "variable", e.target.value)}
                          placeholder="filterKey"
                          className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                        />
                      )}
                    </div>

                    {/* Operator */}
                    <div>
                      <label className="text-[10px] text-muted-foreground">{tb("conditionsOperator")}</label>
                      <select
                        value={rule.operator}
                        onChange={(e) => handleRuleChange(idx, "operator", e.target.value)}
                        className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                      >
                        {operators.map((op) => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Value */}
                    {needsValue(rule.operator) && (
                      <div>
                        <label className="text-[10px] text-muted-foreground">{tb("conditionsValue")}</label>
                        <input
                          type="text"
                          value={
                            isArrayOp(rule.operator)
                              ? (Array.isArray(rule.value) ? rule.value.join(", ") : String(rule.value ?? ""))
                              : String(rule.value ?? "")
                          }
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (isArrayOp(rule.operator)) {
                              handleRuleChange(idx, "value", raw.split(",").map((s) => s.trim()).filter(Boolean));
                            } else {
                              handleRuleChange(idx, "value", raw);
                            }
                          }}
                          placeholder={isArrayOp(rule.operator) ? tb("conditionsCommaSeparated") : ""}
                          className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                        />
                        {isArrayOp(rule.operator) && (
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {tb("conditionsCommaSeparated")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
