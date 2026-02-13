"use client";

import { useState, useCallback, useMemo } from "react";
import type { Widget } from "@/src/entities/dashboard";
import { runValidation, type ValidationRule } from "./validation";

interface FieldState {
  value: unknown;
  error: string | null;
  touched: boolean;
}

interface FormState {
  fields: Record<string, FieldState>;
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
}

interface FieldConfig {
  fieldName: string;
  defaultValue: unknown;
  validation: ValidationRule[];
}

export interface SubmitConfig {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  contentType?: "application/json" | "multipart/form-data";
  onSuccess?: { message?: string; redirect?: string; resetForm?: boolean };
  onError?: { message?: string };
}

export interface FormManagerReturn {
  getFieldValue: (formId: string, fieldName: string) => unknown;
  getFieldError: (formId: string, fieldName: string) => string | null;
  isFieldTouched: (formId: string, fieldName: string) => boolean;
  setFieldValue: (formId: string, fieldName: string, value: unknown) => void;
  setFieldTouched: (formId: string, fieldName: string) => void;
  submitForm: (formId: string, config: SubmitConfig) => Promise<void>;
  resetForm: (formId: string) => void;
  isSubmitting: (formId: string) => boolean;
  getSubmitError: (formId: string) => string | null;
  getSubmitSuccess: (formId: string) => boolean;
}

// form 위젯에서 formId별 필드 설정 추출
function extractFormConfigs(widgets: Widget[]): Record<string, FieldConfig[]> {
  const result: Record<string, FieldConfig[]> = {};

  for (const w of widgets) {
    if (w.type !== "form") continue;

    const opts = (w.options ?? {}) as Record<string, unknown>;
    const formId = (opts.formId as string) ?? "";
    if (!formId) continue;

    const fields = (opts.fields as { fieldName: string; defaultValue?: unknown; validation?: ValidationRule[] }[]) ?? [];
    if (!result[formId]) result[formId] = [];

    for (const field of fields) {
      if (!field.fieldName) continue;
      result[formId].push({
        fieldName: field.fieldName,
        defaultValue: field.defaultValue ?? "",
        validation: field.validation ?? [],
      });
    }
  }

  return result;
}

function buildInitialFormStates(configs: Record<string, FieldConfig[]>): Record<string, FormState> {
  const states: Record<string, FormState> = {};

  for (const [formId, fields] of Object.entries(configs)) {
    const fieldStates: Record<string, FieldState> = {};
    for (const f of fields) {
      fieldStates[f.fieldName] = {
        value: f.defaultValue ?? "",
        error: null,
        touched: false,
      };
    }
    states[formId] = {
      fields: fieldStates,
      isSubmitting: false,
      submitError: null,
      submitSuccess: false,
    };
  }

  return states;
}

export function useFormManager(widgets: Widget[]): FormManagerReturn {
  const formConfigs = useMemo(() => extractFormConfigs(widgets), [widgets]);
  const initialStates = useMemo(() => buildInitialFormStates(formConfigs), [formConfigs]);

  const [forms, setForms] = useState<Record<string, FormState>>(initialStates);

  const ensureForm = useCallback((formId: string): FormState => {
    return forms[formId] ?? { fields: {}, isSubmitting: false, submitError: null, submitSuccess: false };
  }, [forms]);

  const validateField = useCallback((formId: string, fieldName: string, value: unknown): string | null => {
    const configs = formConfigs[formId];
    if (!configs) return null;
    const config = configs.find((c) => c.fieldName === fieldName);
    if (!config || config.validation.length === 0) return null;
    return runValidation(value, config.validation);
  }, [formConfigs]);

  const getFieldValue = useCallback((formId: string, fieldName: string): unknown => {
    return ensureForm(formId).fields[fieldName]?.value ?? "";
  }, [ensureForm]);

  const getFieldError = useCallback((formId: string, fieldName: string): string | null => {
    return ensureForm(formId).fields[fieldName]?.error ?? null;
  }, [ensureForm]);

  const isFieldTouched = useCallback((formId: string, fieldName: string): boolean => {
    return ensureForm(formId).fields[fieldName]?.touched ?? false;
  }, [ensureForm]);

  const setFieldValue = useCallback((formId: string, fieldName: string, value: unknown) => {
    setForms((prev) => {
      const form = prev[formId] ?? { fields: {}, isSubmitting: false, submitError: null, submitSuccess: false };
      const field = form.fields[fieldName] ?? { value: "", error: null, touched: false };
      const error = field.touched ? validateField(formId, fieldName, value) : field.error;
      return {
        ...prev,
        [formId]: {
          ...form,
          submitSuccess: false,
          fields: {
            ...form.fields,
            [fieldName]: { ...field, value, error },
          },
        },
      };
    });
  }, [validateField]);

  const setFieldTouched = useCallback((formId: string, fieldName: string) => {
    setForms((prev) => {
      const form = prev[formId] ?? { fields: {}, isSubmitting: false, submitError: null, submitSuccess: false };
      const field = form.fields[fieldName] ?? { value: "", error: null, touched: false };
      const error = validateField(formId, fieldName, field.value);
      return {
        ...prev,
        [formId]: {
          ...form,
          fields: {
            ...form.fields,
            [fieldName]: { ...field, touched: true, error },
          },
        },
      };
    });
  }, [validateField]);

  const resetForm = useCallback((formId: string) => {
    const initial = initialStates[formId];
    if (initial) {
      setForms((prev) => ({ ...prev, [formId]: initial }));
    }
  }, [initialStates]);

  const submitForm = useCallback(async (formId: string, config: SubmitConfig) => {
    const configs = formConfigs[formId] ?? [];

    // 전체 필드 검증
    let hasErrors = false;
    setForms((prev) => {
      const form = prev[formId] ?? { fields: {}, isSubmitting: false, submitError: null, submitSuccess: false };
      const updatedFields = { ...form.fields };

      for (const c of configs) {
        const field = updatedFields[c.fieldName] ?? { value: "", error: null, touched: false };
        const error = runValidation(field.value, c.validation);
        if (error) hasErrors = true;
        updatedFields[c.fieldName] = { ...field, touched: true, error };
      }

      return {
        ...prev,
        [formId]: { ...form, fields: updatedFields, isSubmitting: !hasErrors, submitError: null, submitSuccess: false },
      };
    });

    if (hasErrors) return;

    // 폼 데이터 수집
    const formState = forms[formId] ?? { fields: {} };
    const data: Record<string, unknown> = {};
    for (const c of configs) {
      data[c.fieldName] = formState.fields[c.fieldName]?.value ?? "";
    }

    try {
      const headers: Record<string, string> = { ...config.headers };
      if (config.contentType !== "multipart/form-data") {
        headers["Content-Type"] = config.contentType ?? "application/json";
      }

      const fetchOptions: RequestInit = {
        method: config.method,
        headers,
      };

      if (config.method !== "GET") {
        fetchOptions.body = JSON.stringify(data);
      }

      const response = await fetch(config.endpoint, fetchOptions);

      if (!response.ok) {
        throw new Error(config.onError?.message ?? `요청 실패 (${response.status})`);
      }

      setForms((prev) => {
        const form = prev[formId] ?? { fields: {}, isSubmitting: false, submitError: null, submitSuccess: false };
        return {
          ...prev,
          [formId]: { ...form, isSubmitting: false, submitError: null, submitSuccess: true },
        };
      });

      if (config.onSuccess?.resetForm) {
        resetForm(formId);
      }

      if (config.onSuccess?.redirect) {
        window.location.href = config.onSuccess.redirect;
      }
    } catch (err) {
      setForms((prev) => {
        const form = prev[formId] ?? { fields: {}, isSubmitting: false, submitError: null, submitSuccess: false };
        return {
          ...prev,
          [formId]: {
            ...form,
            isSubmitting: false,
            submitError: err instanceof Error ? err.message : "알 수 없는 오류",
            submitSuccess: false,
          },
        };
      });
    }
  }, [formConfigs, forms, resetForm]);

  const isSubmittingFn = useCallback((formId: string): boolean => {
    return ensureForm(formId).isSubmitting;
  }, [ensureForm]);

  const getSubmitError = useCallback((formId: string): string | null => {
    return ensureForm(formId).submitError;
  }, [ensureForm]);

  const getSubmitSuccess = useCallback((formId: string): boolean => {
    return ensureForm(formId).submitSuccess;
  }, [ensureForm]);

  return {
    getFieldValue,
    getFieldError,
    isFieldTouched,
    setFieldValue,
    setFieldTouched,
    submitForm,
    resetForm,
    isSubmitting: isSubmittingFn,
    getSubmitError,
    getSubmitSuccess,
  };
}
