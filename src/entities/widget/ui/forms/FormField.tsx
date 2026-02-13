"use client";

import type { FormManagerReturn } from "@/src/features/dashboard-form";

export interface FormFieldDef {
  fieldName: string;
  type: "input" | "select" | "radio" | "checkbox" | "textarea";
  label?: string;
  inputType?: "text" | "number" | "email" | "password" | "tel" | "url";
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

interface FormFieldProps {
  field: FormFieldDef;
  formId: string;
  formManager: FormManagerReturn;
}

export function FormField({ field, formId, formManager }: FormFieldProps) {
  const { fieldName } = field;
  const value = formManager.getFieldValue(formId, fieldName);
  const error = formManager.getFieldError(formId, fieldName);
  const touched = formManager.isFieldTouched(formId, fieldName);

  const errorBorder = touched && error ? "border-destructive" : "border-border/50";

  switch (field.type) {
    case "input":
      return (
        <div className="flex flex-col gap-1">
          {field.label && (
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              {field.label}
            </label>
          )}
          <input
            type={field.inputType ?? "text"}
            value={String(value ?? "")}
            onChange={(e) => {
              const v = field.inputType === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value;
              formManager.setFieldValue(formId, fieldName, v);
            }}
            onBlur={() => formManager.setFieldTouched(formId, fieldName)}
            disabled={field.disabled}
            placeholder={field.placeholder ?? ""}
            className={`h-8 w-full rounded-md border bg-card px-2 text-sm shadow-sm transition-colors hover:border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 ${errorBorder}`}
          />
          {touched && error && <span className="text-[10px] text-destructive">{error}</span>}
        </div>
      );

    case "select": {
      const options = field.options ?? [];

      if (field.multiple) {
        const selectedValues = Array.isArray(value) ? (value as string[]) : [];
        const toggleValue = (optValue: string) => {
          const next = selectedValues.includes(optValue)
            ? selectedValues.filter((v) => v !== optValue)
            : [...selectedValues, optValue];
          formManager.setFieldValue(formId, fieldName, next);
        };

        return (
          <div className="flex flex-col gap-1">
            {field.label && (
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                {field.label}
              </label>
            )}
            <div className={`flex flex-wrap gap-1 rounded-md border p-1.5 ${errorBorder}`}>
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleValue(opt.value)}
                  onBlur={() => formManager.setFieldTouched(formId, fieldName)}
                  disabled={field.disabled}
                  className={`rounded px-2 py-0.5 text-xs transition-colors ${
                    selectedValues.includes(opt.value)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  } disabled:opacity-50`}
                >
                  {opt.label}
                </button>
              ))}
              {options.length === 0 && <span className="text-xs text-muted-foreground">옵션 없음</span>}
            </div>
            {touched && error && <span className="text-[10px] text-destructive">{error}</span>}
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-1">
          {field.label && (
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              {field.label}
            </label>
          )}
          <select
            value={String(value ?? "")}
            onChange={(e) => formManager.setFieldValue(formId, fieldName, e.target.value)}
            onBlur={() => formManager.setFieldTouched(formId, fieldName)}
            disabled={field.disabled}
            className={`h-8 w-full rounded-md border bg-card px-2 text-sm shadow-sm transition-colors hover:border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 ${errorBorder}`}
          >
            <option value="">{field.placeholder ?? "선택..."}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {touched && error && <span className="text-[10px] text-destructive">{error}</span>}
        </div>
      );
    }

    case "radio": {
      const options = field.options ?? [];
      const isHorizontal = field.direction === "horizontal";

      return (
        <div className="flex flex-col gap-1">
          {field.label && (
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              {field.label}
            </label>
          )}
          <div className={`flex gap-2 ${isHorizontal ? "flex-row flex-wrap" : "flex-col"}`}>
            {options.map((opt) => (
              <label key={opt.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  name={`${formId}-${fieldName}`}
                  value={opt.value}
                  checked={String(value) === opt.value}
                  onChange={() => formManager.setFieldValue(formId, fieldName, opt.value)}
                  onBlur={() => formManager.setFieldTouched(formId, fieldName)}
                  disabled={field.disabled}
                  className="h-3.5 w-3.5 accent-primary disabled:opacity-50"
                />
                <span className="text-xs">{opt.label}</span>
              </label>
            ))}
            {options.length === 0 && <span className="text-xs text-muted-foreground">옵션 없음</span>}
          </div>
          {touched && error && <span className="text-[10px] text-destructive">{error}</span>}
        </div>
      );
    }

    case "checkbox": {
      const isSingle = (field.mode ?? "single") === "single";
      const isHorizontal = field.direction === "horizontal";

      if (isSingle) {
        return (
          <div className="flex flex-col gap-1">
            {field.label && (
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                {field.label}
              </label>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => formManager.setFieldValue(formId, fieldName, e.target.checked)}
                onBlur={() => formManager.setFieldTouched(formId, fieldName)}
                disabled={field.disabled}
                className="h-4 w-4 rounded border accent-primary disabled:opacity-50"
              />
              <span className="text-sm">{field.checkboxLabel ?? ""}</span>
            </label>
            {touched && error && <span className="text-[10px] text-destructive">{error}</span>}
          </div>
        );
      }

      const selectedValues = Array.isArray(value) ? (value as string[]) : [];
      const options = field.options ?? [];
      const toggleValue = (optValue: string) => {
        const next = selectedValues.includes(optValue)
          ? selectedValues.filter((v) => v !== optValue)
          : [...selectedValues, optValue];
        formManager.setFieldValue(formId, fieldName, next);
      };

      return (
        <div className="flex flex-col gap-1">
          {field.label && (
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              {field.label}
            </label>
          )}
          <div className={`flex gap-2 ${isHorizontal ? "flex-row flex-wrap" : "flex-col"}`}>
            {options.map((opt) => (
              <label key={opt.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(opt.value)}
                  onChange={() => toggleValue(opt.value)}
                  onBlur={() => formManager.setFieldTouched(formId, fieldName)}
                  disabled={field.disabled}
                  className="h-3.5 w-3.5 rounded border accent-primary disabled:opacity-50"
                />
                <span className="text-xs">{opt.label}</span>
              </label>
            ))}
            {options.length === 0 && <span className="text-xs text-muted-foreground">옵션 없음</span>}
          </div>
          {touched && error && <span className="text-[10px] text-destructive">{error}</span>}
        </div>
      );
    }

    case "textarea": {
      const textValue = String(value ?? "");

      return (
        <div className="flex flex-col gap-1">
          {field.label && (
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
              {field.label}
            </label>
          )}
          <textarea
            value={textValue}
            onChange={(e) => formManager.setFieldValue(formId, fieldName, e.target.value)}
            onBlur={() => formManager.setFieldTouched(formId, fieldName)}
            disabled={field.disabled}
            placeholder={field.placeholder ?? ""}
            rows={field.rows ?? 4}
            maxLength={field.maxLength}
            className={`w-full resize-none rounded-md border bg-card px-2 py-1.5 text-sm shadow-sm transition-colors hover:border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 ${errorBorder}`}
          />
          <div className="flex items-center justify-between">
            {touched && error ? (
              <span className="text-[10px] text-destructive">{error}</span>
            ) : (
              <span />
            )}
            {field.maxLength && (
              <span className="text-[10px] text-muted-foreground">
                {textValue.length}/{field.maxLength}
              </span>
            )}
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="text-xs text-muted-foreground">
          Unknown field type: {field.type}
        </div>
      );
  }
}
