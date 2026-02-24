"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ClipboardList, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { resolveLabel, type I18nLabel } from "@/src/shared/lib";
import type { Widget } from "@/src/entities/dashboard";
import type { FormManagerReturn, SubmitConfig } from "@/src/features/dashboard-form";
import { FormField, type FormFieldDef } from "./FormField";

interface FormButtonDef {
  label: I18nLabel;
  buttonType: "submit" | "reset" | "button";
  variant?: "primary" | "secondary" | "destructive" | "outline";
}

interface FormWidgetOptions {
  formId?: string;
  columns?: 1 | 2 | 3;
  fields?: FormFieldDef[];
  buttons?: FormButtonDef[];
  submitConfig?: {
    endpoint: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    headers?: Record<string, string>;
    contentType?: "application/json" | "multipart/form-data";
    confirmation?: { enabled: boolean; title?: I18nLabel; message: I18nLabel };
    onSuccess?: { message?: I18nLabel; redirect?: string; resetForm?: boolean };
    onError?: { message?: I18nLabel };
  };
}

interface FormWidgetProps {
  widget: Widget;
  formManager: FormManagerReturn;
}

const variantClasses: Record<string, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
};

export function FormWidget({ widget, formManager }: FormWidgetProps) {
  const locale = useLocale();
  const tc = useTranslations("common");
  const rl = (v: I18nLabel | undefined) => resolveLabel(v, locale);
  const [showConfirm, setShowConfirm] = useState(false);

  const opts = (widget.options ?? {}) as FormWidgetOptions;
  const formId = opts.formId ?? "";
  const columns = opts.columns ?? 1;
  const fields = opts.fields ?? [];
  const buttons = opts.buttons ?? [];
  const submitConfig = opts.submitConfig;

  if (!formId) {
    return (
      <div className="flex h-full items-center justify-center gap-2 p-4 text-muted-foreground">
        <ClipboardList className="h-5 w-5" />
        <span className="text-sm">{tc("setFormId")}</span>
      </div>
    );
  }

  if (fields.length === 0 && buttons.length === 0) {
    return (
      <div className="flex h-full items-center justify-center gap-2 p-4 text-muted-foreground">
        <ClipboardList className="h-5 w-5" />
        <span className="text-sm">{tc("addFields")}</span>
      </div>
    );
  }

  const submitting = formManager.isSubmitting(formId);
  const submitError = formManager.getSubmitError(formId);
  const submitSuccess = formManager.getSubmitSuccess(formId);

  const handleButtonClick = (btn: FormButtonDef) => {
    if (btn.buttonType === "reset") {
      formManager.resetForm(formId);
      return;
    }

    if (btn.buttonType === "submit" && submitConfig) {
      if (submitConfig.confirmation?.enabled) {
        setShowConfirm(true);
        return;
      }
      doSubmit();
    }
  };

  const doSubmit = () => {
    setShowConfirm(false);
    if (!submitConfig) return;

    const config: SubmitConfig = {
      endpoint: submitConfig.endpoint,
      method: submitConfig.method,
      headers: submitConfig.headers,
      contentType: submitConfig.contentType,
      onSuccess: submitConfig.onSuccess,
      onError: submitConfig.onError,
    };

    formManager.submitForm(formId, config);
  };

  const gridCols =
    columns === 3 ? "grid-cols-3" : columns === 2 ? "grid-cols-2" : "grid-cols-1";

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      {/* 필드 그리드 */}
      <div className={`grid gap-4 ${gridCols}`}>
        {fields.map((field) => (
          <div
            key={field.fieldName}
            style={field.colSpan ? { gridColumn: `span ${field.colSpan}` } : undefined}
          >
            <FormField field={field} formId={formId} formManager={formManager} />
          </div>
        ))}
      </div>

      {/* 버튼 영역 */}
      {buttons.length > 0 && (
        <div className="flex items-center gap-2 pt-2">
          {buttons.map((btn, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleButtonClick(btn)}
              disabled={submitting}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors disabled:opacity-50 ${
                variantClasses[btn.variant ?? "primary"] ?? variantClasses.primary
              }`}
            >
              {submitting && btn.buttonType === "submit" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {rl(btn.label)}
            </button>
          ))}
        </div>
      )}

      {/* 상태 메시지 */}
      {submitSuccess && (
        <div className="flex items-center gap-1.5 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span>{rl(submitConfig?.onSuccess?.message) || tc("submitSuccess")}</span>
        </div>
      )}
      {submitError && (
        <div className="flex items-center gap-1.5 text-sm text-destructive">
          <XCircle className="h-4 w-4" />
          <span>{submitError}</span>
        </div>
      )}

      {/* 확인 다이얼로그 */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-80 rounded-lg bg-card p-6 shadow-xl">
            <h3 className="text-sm font-semibold">
              {rl(submitConfig?.confirmation?.title) || tc("confirm")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {rl(submitConfig?.confirmation?.message) || tc("submitConfirm")}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent"
              >
                {tc("cancel")}
              </button>
              <button
                type="button"
                onClick={doSubmit}
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {tc("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
