"use client";

import { useMutation } from "@tanstack/react-query";

interface FormSubmitParams {
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  contentType?: string;
  data: Record<string, unknown>;
}

export function useFormSubmit() {
  return useMutation({
    mutationFn: async ({ endpoint, method, headers, contentType, data }: FormSubmitParams) => {
      const h: Record<string, string> = { ...headers };
      if (contentType !== "multipart/form-data") {
        h["Content-Type"] = contentType ?? "application/json";
      }

      const opts: RequestInit = { method, headers: h };
      if (method !== "GET") {
        opts.body = JSON.stringify(data);
      }

      const res = await fetch(endpoint, opts);
      if (!res.ok) throw new Error(`요청 실패 (${res.status})`);
      return res.json();
    },
  });
}
