"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { useBuilderStore } from "@/src/features/dashboard-builder/model/builder.store";
import type { Widget } from "@/src/entities/dashboard";

interface FormFieldDef {
  fieldName: string;
  type: "input" | "select" | "radio" | "checkbox" | "textarea";
  label?: string;
  inputType?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  multiple?: boolean;
  direction?: "horizontal" | "vertical";
  mode?: "single" | "group";
  checkboxLabel?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  defaultValue?: unknown;
  validation?: { type: string; value?: unknown; message: string }[];
  colSpan?: number;
}

interface FormButtonDef {
  label: string;
  buttonType: "submit" | "reset" | "button";
  variant?: "primary" | "secondary" | "destructive" | "outline";
}

interface FormWidgetOptionsProps {
  widget: Widget;
}

export function FormWidgetOptions({ widget }: FormWidgetOptionsProps) {
  const { updateWidget } = useBuilderStore();
  const [expandedField, setExpandedField] = useState<number | null>(null);
  const [showSubmitConfig, setShowSubmitConfig] = useState(false);

  const opts = (widget.options ?? {}) as Record<string, unknown>;
  const formId = (opts.formId as string) ?? "";
  const columns = (opts.columns as number) ?? 1;
  const fields = (opts.fields as FormFieldDef[]) ?? [];
  const buttons = (opts.buttons as FormButtonDef[]) ?? [];
  const submitConfig = (opts.submitConfig as Record<string, unknown>) ?? {};

  const updateOption = (key: string, value: unknown) => {
    updateWidget(widget.id, {
      options: { ...opts, [key]: value },
    });
  };

  const updateFields = (newFields: FormFieldDef[]) => {
    updateOption("fields", newFields);
  };

  const updateButtons = (newButtons: FormButtonDef[]) => {
    updateOption("buttons", newButtons);
  };

  const updateSubmitConfig = (key: string, value: unknown) => {
    updateOption("submitConfig", { ...submitConfig, [key]: value });
  };

  // ── Field CRUD ──
  const handleAddField = () => {
    const newField: FormFieldDef = {
      fieldName: `field_${fields.length + 1}`,
      type: "input",
      label: "",
      placeholder: "",
    };
    updateFields([...fields, newField]);
    setExpandedField(fields.length);
  };

  const handleRemoveField = (index: number) => {
    updateFields(fields.filter((_, i) => i !== index));
    if (expandedField === index) setExpandedField(null);
  };

  const handleFieldChange = (index: number, key: string, value: unknown) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    updateFields(updated);
  };

  // ── Field validation ──
  const handleAddValidation = (fieldIdx: number) => {
    const updated = [...fields];
    const validation = [...(updated[fieldIdx].validation ?? []), { type: "required", message: "" }];
    updated[fieldIdx] = { ...updated[fieldIdx], validation };
    updateFields(updated);
  };

  const handleValidationChange = (fieldIdx: number, ruleIdx: number, key: string, value: unknown) => {
    const updated = [...fields];
    const validation = [...(updated[fieldIdx].validation ?? [])];
    validation[ruleIdx] = { ...validation[ruleIdx], [key]: value };
    updated[fieldIdx] = { ...updated[fieldIdx], validation };
    updateFields(updated);
  };

  const handleRemoveValidation = (fieldIdx: number, ruleIdx: number) => {
    const updated = [...fields];
    const validation = (updated[fieldIdx].validation ?? []).filter((_, i) => i !== ruleIdx);
    updated[fieldIdx] = { ...updated[fieldIdx], validation };
    updateFields(updated);
  };

  // ── Field options (select/radio/checkbox) ──
  const handleAddFieldOption = (fieldIdx: number) => {
    const updated = [...fields];
    const options = [...(updated[fieldIdx].options ?? []), { value: "", label: "" }];
    updated[fieldIdx] = { ...updated[fieldIdx], options };
    updateFields(updated);
  };

  const handleFieldOptionChange = (fieldIdx: number, optIdx: number, key: "value" | "label", value: string) => {
    const updated = [...fields];
    const options = [...(updated[fieldIdx].options ?? [])];
    options[optIdx] = { ...options[optIdx], [key]: value };
    updated[fieldIdx] = { ...updated[fieldIdx], options };
    updateFields(updated);
  };

  const handleRemoveFieldOption = (fieldIdx: number, optIdx: number) => {
    const updated = [...fields];
    const options = (updated[fieldIdx].options ?? []).filter((_, i) => i !== optIdx);
    updated[fieldIdx] = { ...updated[fieldIdx], options };
    updateFields(updated);
  };

  // ── Button CRUD ──
  const handleAddButton = () => {
    updateButtons([...buttons, { label: "버튼", buttonType: "button", variant: "outline" }]);
  };

  const handleRemoveButton = (index: number) => {
    updateButtons(buttons.filter((_, i) => i !== index));
  };

  const handleButtonChange = (index: number, key: string, value: unknown) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], [key]: value };
    updateButtons(updated);
  };

  return (
    <div className="space-y-4">
      {/* Form ID */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Form ID</label>
        <input
          type="text"
          value={formId}
          onChange={(e) => updateOption("formId", e.target.value)}
          placeholder="예: contactForm"
          className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Columns */}
      <div>
        <label className="text-xs font-medium text-muted-foreground">컬럼 수</label>
        <select
          value={columns}
          onChange={(e) => updateOption("columns", parseInt(e.target.value))}
          className="mt-1 w-full rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          <option value={1}>1열</option>
          <option value={2}>2열</option>
          <option value={3}>3열</option>
        </select>
      </div>

      {/* ── Fields ── */}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">필드 ({fields.length})</label>
          <button
            onClick={handleAddField}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
          >
            <Plus className="h-3 w-3" />
            추가
          </button>
        </div>

        <div className="mt-2 space-y-2">
          {fields.map((field, idx) => (
            <div key={idx} className="rounded-md border bg-muted/30">
              {/* Field Header */}
              <button
                onClick={() => setExpandedField(expandedField === idx ? null : idx)}
                className="flex w-full items-center justify-between p-2 text-left"
              >
                <div className="flex items-center gap-1.5">
                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-medium">
                    {field.label || field.fieldName || `필드 ${idx + 1}`}
                  </span>
                  <span className="rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
                    {field.type}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveField(idx); }}
                    className="rounded p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  {expandedField === idx ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </div>
              </button>

              {/* Field Detail */}
              {expandedField === idx && (
                <div className="space-y-3 border-t p-2">
                  {/* Field Name */}
                  <div>
                    <label className="text-[10px] text-muted-foreground">Field Name</label>
                    <input
                      type="text"
                      value={field.fieldName}
                      onChange={(e) => handleFieldChange(idx, "fieldName", e.target.value)}
                      placeholder="예: email"
                      className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="text-[10px] text-muted-foreground">타입</label>
                    <select
                      value={field.type}
                      onChange={(e) => handleFieldChange(idx, "type", e.target.value)}
                      className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                    >
                      <option value="input">Input</option>
                      <option value="select">Select</option>
                      <option value="radio">Radio</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="textarea">Textarea</option>
                    </select>
                  </div>

                  {/* Label */}
                  <div>
                    <label className="text-[10px] text-muted-foreground">라벨</label>
                    <input
                      type="text"
                      value={field.label ?? ""}
                      onChange={(e) => handleFieldChange(idx, "label", e.target.value)}
                      className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                    />
                  </div>

                  {/* colSpan */}
                  {columns > 1 && (
                    <div>
                      <label className="text-[10px] text-muted-foreground">열 차지 (colSpan)</label>
                      <select
                        value={field.colSpan ?? 1}
                        onChange={(e) => handleFieldChange(idx, "colSpan", parseInt(e.target.value))}
                        className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                      >
                        {Array.from({ length: columns }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* ── input 전용 ── */}
                  {field.type === "input" && (
                    <>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Input Type</label>
                        <select
                          value={field.inputType ?? "text"}
                          onChange={(e) => handleFieldChange(idx, "inputType", e.target.value)}
                          className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="email">Email</option>
                          <option value="password">Password</option>
                          <option value="tel">Tel</option>
                          <option value="url">URL</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Placeholder</label>
                        <input
                          type="text"
                          value={field.placeholder ?? ""}
                          onChange={(e) => handleFieldChange(idx, "placeholder", e.target.value)}
                          className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                        />
                      </div>
                    </>
                  )}

                  {/* ── select 전용 ── */}
                  {field.type === "select" && (
                    <>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Placeholder</label>
                        <input
                          type="text"
                          value={field.placeholder ?? ""}
                          onChange={(e) => handleFieldChange(idx, "placeholder", e.target.value)}
                          className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={field.multiple ?? false}
                          onChange={(e) => handleFieldChange(idx, "multiple", e.target.checked)}
                          className="h-3.5 w-3.5 rounded border"
                        />
                        <span className="text-[10px] text-muted-foreground">다중 선택</span>
                      </div>
                    </>
                  )}

                  {/* ── options list (select/radio/checkbox) ── */}
                  {["select", "radio", "checkbox"].includes(field.type) && (
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-muted-foreground">옵션 목록</label>
                        <button
                          onClick={() => handleAddFieldOption(idx)}
                          className="flex items-center gap-0.5 text-[10px] text-primary hover:underline"
                        >
                          <Plus className="h-2.5 w-2.5" /> 추가
                        </button>
                      </div>
                      <div className="mt-1 space-y-1">
                        {(field.options ?? []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-1">
                            <input
                              type="text"
                              value={opt.value}
                              onChange={(e) => handleFieldOptionChange(idx, optIdx, "value", e.target.value)}
                              placeholder="값"
                              className="w-1/3 rounded border bg-background px-1.5 py-0.5 text-[10px]"
                            />
                            <input
                              type="text"
                              value={opt.label}
                              onChange={(e) => handleFieldOptionChange(idx, optIdx, "label", e.target.value)}
                              placeholder="라벨"
                              className="flex-1 rounded border bg-background px-1.5 py-0.5 text-[10px]"
                            />
                            <button
                              onClick={() => handleRemoveFieldOption(idx, optIdx)}
                              className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── direction (radio/checkbox) ── */}
                  {["radio", "checkbox"].includes(field.type) && (
                    <div>
                      <label className="text-[10px] text-muted-foreground">방향</label>
                      <select
                        value={field.direction ?? "vertical"}
                        onChange={(e) => handleFieldChange(idx, "direction", e.target.value)}
                        className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                      >
                        <option value="vertical">세로</option>
                        <option value="horizontal">가로</option>
                      </select>
                    </div>
                  )}

                  {/* ── checkbox 전용 ── */}
                  {field.type === "checkbox" && (
                    <>
                      <div>
                        <label className="text-[10px] text-muted-foreground">모드</label>
                        <select
                          value={field.mode ?? "single"}
                          onChange={(e) => handleFieldChange(idx, "mode", e.target.value)}
                          className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                        >
                          <option value="single">단일</option>
                          <option value="group">그룹</option>
                        </select>
                      </div>
                      {(field.mode ?? "single") === "single" && (
                        <div>
                          <label className="text-[10px] text-muted-foreground">체크박스 라벨</label>
                          <input
                            type="text"
                            value={field.checkboxLabel ?? ""}
                            onChange={(e) => handleFieldChange(idx, "checkboxLabel", e.target.value)}
                            className="mt-0.5 w-full rounded border bg-background px-1.5 py-0.5 text-[10px]"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* ── textarea 전용 ── */}
                  {field.type === "textarea" && (
                    <>
                      <div>
                        <label className="text-[10px] text-muted-foreground">Placeholder</label>
                        <input
                          type="text"
                          value={field.placeholder ?? ""}
                          onChange={(e) => handleFieldChange(idx, "placeholder", e.target.value)}
                          className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-muted-foreground">행 수</label>
                          <input
                            type="number"
                            value={field.rows ?? 4}
                            onChange={(e) => handleFieldChange(idx, "rows", parseInt(e.target.value) || 4)}
                            min={1}
                            className="mt-0.5 w-full rounded border bg-background px-1.5 py-0.5 text-[10px]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground">최대 글자</label>
                          <input
                            type="number"
                            value={field.maxLength ?? ""}
                            onChange={(e) => handleFieldChange(idx, "maxLength", e.target.value ? parseInt(e.target.value) : undefined)}
                            min={1}
                            className="mt-0.5 w-full rounded border bg-background px-1.5 py-0.5 text-[10px]"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Default Value */}
                  <div>
                    <label className="text-[10px] text-muted-foreground">기본값</label>
                    <input
                      type="text"
                      value={String(field.defaultValue ?? "")}
                      onChange={(e) => handleFieldChange(idx, "defaultValue", e.target.value || undefined)}
                      className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
                    />
                  </div>

                  {/* Disabled */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.disabled ?? false}
                      onChange={(e) => handleFieldChange(idx, "disabled", e.target.checked)}
                      className="h-3.5 w-3.5 rounded border"
                    />
                    <span className="text-[10px] text-muted-foreground">비활성화</span>
                  </div>

                  {/* Validation */}
                  <div className="border-t pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        검증 규칙 ({(field.validation ?? []).length})
                      </span>
                      <button
                        onClick={() => handleAddValidation(idx)}
                        className="flex items-center gap-0.5 text-[10px] text-primary hover:underline"
                      >
                        <Plus className="h-2.5 w-2.5" /> 추가
                      </button>
                    </div>
                    <div className="mt-1 space-y-1">
                      {(field.validation ?? []).map((rule, ruleIdx) => (
                        <div key={ruleIdx} className="rounded border bg-background p-1.5">
                          <div className="flex items-center justify-between">
                            <select
                              value={rule.type}
                              onChange={(e) => handleValidationChange(idx, ruleIdx, "type", e.target.value)}
                              className="rounded border px-1 py-0.5 text-[10px]"
                            >
                              <option value="required">필수</option>
                              <option value="min">최소값</option>
                              <option value="max">최대값</option>
                              <option value="minLength">최소 길이</option>
                              <option value="maxLength">최대 길이</option>
                              <option value="pattern">정규식</option>
                            </select>
                            <button
                              onClick={() => handleRemoveValidation(idx, ruleIdx)}
                              className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
                            </button>
                          </div>
                          {rule.type !== "required" && (
                            <input
                              type="text"
                              value={String(rule.value ?? "")}
                              onChange={(e) => handleValidationChange(idx, ruleIdx, "value", e.target.value)}
                              placeholder="값"
                              className="mt-1 w-full rounded border px-1.5 py-0.5 text-[10px]"
                            />
                          )}
                          <input
                            type="text"
                            value={rule.message}
                            onChange={(e) => handleValidationChange(idx, ruleIdx, "message", e.target.value)}
                            placeholder="에러 메시지"
                            className="mt-1 w-full rounded border px-1.5 py-0.5 text-[10px]"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {fields.length === 0 && (
            <p className="py-3 text-center text-xs text-muted-foreground">
              필드가 없습니다. &quot;추가&quot;를 클릭하세요.
            </p>
          )}
        </div>
      </div>

      {/* ── Buttons ── */}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">버튼 ({buttons.length})</label>
          <button
            onClick={handleAddButton}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
          >
            <Plus className="h-3 w-3" />
            추가
          </button>
        </div>

        <div className="mt-2 space-y-2">
          {buttons.map((btn, idx) => (
            <div key={idx} className="flex items-center gap-1.5 rounded-md border bg-muted/30 p-2">
              <input
                type="text"
                value={btn.label}
                onChange={(e) => handleButtonChange(idx, "label", e.target.value)}
                placeholder="라벨"
                className="flex-1 rounded border bg-background px-2 py-1 text-xs"
              />
              <select
                value={btn.buttonType}
                onChange={(e) => handleButtonChange(idx, "buttonType", e.target.value)}
                className="rounded border bg-background px-1 py-1 text-xs"
              >
                <option value="submit">Submit</option>
                <option value="reset">Reset</option>
                <option value="button">Button</option>
              </select>
              <select
                value={btn.variant ?? "primary"}
                onChange={(e) => handleButtonChange(idx, "variant", e.target.value)}
                className="rounded border bg-background px-1 py-1 text-xs"
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
                <option value="destructive">Destructive</option>
                <option value="outline">Outline</option>
              </select>
              <button
                onClick={() => handleRemoveButton(idx)}
                className="rounded p-0.5 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Submit Config ── */}
      <div className="border-t pt-3">
        <button
          onClick={() => setShowSubmitConfig(!showSubmitConfig)}
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {showSubmitConfig ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          Submit 설정
        </button>

        {showSubmitConfig && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-[10px] text-muted-foreground">Endpoint</label>
              <input
                type="text"
                value={(submitConfig.endpoint as string) ?? ""}
                onChange={(e) => updateSubmitConfig("endpoint", e.target.value)}
                placeholder="/api/submit"
                className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Method</label>
              <select
                value={(submitConfig.method as string) ?? "POST"}
                onChange={(e) => updateSubmitConfig("method", e.target.value)}
                className="mt-0.5 w-full rounded border bg-background px-2 py-1 text-xs"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={((submitConfig.confirmation as { enabled?: boolean } | undefined)?.enabled) ?? false}
                onChange={(e) =>
                  updateSubmitConfig("confirmation", {
                    ...((submitConfig.confirmation as Record<string, unknown>) ?? {}),
                    enabled: e.target.checked,
                    message: ((submitConfig.confirmation as { message?: string } | undefined)?.message) ?? "제출하시겠습니까?",
                  })
                }
                className="h-3.5 w-3.5 rounded border"
              />
              <span className="text-[10px] text-muted-foreground">제출 전 확인 다이얼로그</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={((submitConfig.onSuccess as { resetForm?: boolean } | undefined)?.resetForm) ?? false}
                onChange={(e) =>
                  updateSubmitConfig("onSuccess", {
                    ...((submitConfig.onSuccess as Record<string, unknown>) ?? {}),
                    resetForm: e.target.checked,
                  })
                }
                className="h-3.5 w-3.5 rounded border"
              />
              <span className="text-[10px] text-muted-foreground">성공 시 폼 초기화</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
