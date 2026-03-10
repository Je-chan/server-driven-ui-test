"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Database, Server, ArrowRight, BarChart3, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import type { Widget } from "@/src/entities/dashboard";
import { resolveLabel } from "@/src/shared/lib";
import { JsonBlock } from "./JsonBlock";

interface DataFlowDiagramProps {
  widget: Widget;
}

interface DataBinding {
  dataSourceId?: string;
  requestParams?: Record<string, unknown>;
  mapping?: {
    timeField?: string;
    dimensions?: string[];
    measurements?: { field: string; label: string; unit?: string; color?: string }[];
    comparison?: { field: string; type: string };
  };
  transform?: Record<string, unknown>;
}

// WidgetRenderer와 동일한 엔드포인트 매핑
function getEndpoint(dataSourceId: string): string {
  const endpoints: Record<string, string> = {
    ds_inverter: "/api/data/inverter",
    ds_weather: "/api/data/weather",
    ds_kpi: "/api/data/kpi",
    ds_alarm: "/api/data/alarm",
    ds_battery: "/api/data/battery",
    ds_revenue: "/api/data/revenue",
    ds_grid: "/api/data/grid",
    ds_price: "/api/data/price",
    ds_meter: "/api/data/meter",
    ds_maintenance: "/api/data/maintenance",
    ds_module: "/api/data/module",
  };
  return endpoints[dataSourceId] ?? "";
}

// URL에서 파라미터 파싱
function parseUrlParams(url: string): { path: string; params: Record<string, string> } {
  const [path, queryString] = url.split("?");
  const params: Record<string, string> = {};
  if (queryString) {
    for (const part of queryString.split("&")) {
      const [key, value] = part.split("=");
      params[key] = value;
    }
  }
  return { path, params };
}

export function DataFlowDiagram({ widget }: DataFlowDiagramProps) {
  const locale = useLocale();
  const dataBinding = widget.dataBinding as DataBinding | undefined;
  const [response, setResponse] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const endpoint = dataBinding?.dataSourceId
    ? getEndpoint(dataBinding.dataSourceId)
    : "";

  // 실제 API 호출하여 Response 가져오기
  useEffect(() => {
    if (!endpoint) return;
    setLoading(true);
    setResponse(null);
    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => setResponse(data))
      .catch(() => setResponse({ error: "Failed to fetch" }))
      .finally(() => setLoading(false));
  }, [endpoint]);

  if (!dataBinding?.dataSourceId) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-muted-foreground">
        이 위젯에는 데이터 바인딩이 설정되어 있지 않습니다
      </div>
    );
  }

  const { path: endpointPath, params: queryParams } = parseUrlParams(endpoint);

  const toggle = (id: string) => setExpandedStep(expandedStep === id ? null : id);

  // Response 요약 생성
  const responseSummary = (() => {
    if (loading) return "Loading...";
    if (!response) return "No data";
    const res = response as Record<string, unknown>;
    if (res.success === false) return `Error: ${res.error}`;
    const dataArr = res.data as unknown[];
    return `${dataArr?.length ?? 0} records`;
  })();

  const steps = [
    {
      id: "widget",
      icon: <BarChart3 className="h-5 w-5 text-blue-500" />,
      label: "Widget",
      summary: `${widget.type} — "${resolveLabel(widget.title, locale)}"`,
      color: "border-blue-200 bg-blue-50",
      expandable: false,
    },
    {
      id: "binding",
      icon: <Database className="h-5 w-5 text-emerald-500" />,
      label: "DataBinding",
      summary: `dataSourceId: ${dataBinding.dataSourceId}`,
      color: "border-emerald-200 bg-emerald-50",
      expandable: true,
      detail: (
        <div className="mt-2 space-y-2">
          <JsonBlock data={dataBinding} title="dataBinding" maxHeight={250} />
          {dataBinding.mapping && (
            <div className="space-y-1.5 text-xs">
              {dataBinding.mapping.timeField && (
                <div className="flex gap-2">
                  <span className="font-medium text-emerald-700">timeField:</span>
                  <code className="rounded bg-emerald-100 px-1">{dataBinding.mapping.timeField}</code>
                </div>
              )}
              {dataBinding.mapping.dimensions && dataBinding.mapping.dimensions.length > 0 && (
                <div className="flex gap-2">
                  <span className="font-medium text-emerald-700">dimensions:</span>
                  <span>{dataBinding.mapping.dimensions.map((d) => (
                    <code key={d} className="mr-1 rounded bg-emerald-100 px-1">{d}</code>
                  ))}</span>
                </div>
              )}
              {dataBinding.mapping.measurements && (
                <div>
                  <span className="font-medium text-emerald-700">measurements:</span>
                  <div className="mt-1 space-y-1 pl-2">
                    {dataBinding.mapping.measurements.map((m) => (
                      <div key={m.field} className="flex items-center gap-2">
                        {m.color && (
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: m.color }}
                          />
                        )}
                        <code className="rounded bg-emerald-100 px-1">{m.field}</code>
                        <span className="text-muted-foreground">→ {m.label}</span>
                        {m.unit && <span className="text-muted-foreground">({m.unit})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "endpoint",
      icon: <Server className="h-5 w-5 text-amber-500" />,
      label: "API Endpoint",
      summary: endpoint || "unknown",
      color: "border-amber-200 bg-amber-50",
      expandable: true,
      detail: (
        <div className="mt-2 space-y-2 text-xs">
          <div className="flex gap-2">
            <span className="font-medium text-amber-700">Method:</span>
            <code className="rounded bg-amber-100 px-1">GET</code>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-amber-700">Path:</span>
            <code className="rounded bg-amber-100 px-1">{endpointPath}</code>
          </div>
          {Object.keys(queryParams).length > 0 && (
            <div>
              <span className="font-medium text-amber-700">Query Parameters:</span>
              <div className="mt-1 space-y-1 pl-2">
                {Object.entries(queryParams).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <code className="rounded bg-amber-100 px-1">{key}</code>
                    <span className="text-muted-foreground">=</span>
                    <code className="rounded bg-amber-100 px-1">{value}</code>
                  </div>
                ))}
              </div>
            </div>
          )}
          {dataBinding.requestParams && Object.keys(dataBinding.requestParams).length > 0 && (
            <div>
              <span className="font-medium text-amber-700">requestParams (schema 정의):</span>
              <div className="mt-1">
                <JsonBlock data={dataBinding.requestParams} maxHeight={120} />
              </div>
            </div>
          )}
          <div className="rounded border border-amber-300 bg-amber-50 p-2 text-amber-800">
            <strong>Endpoint 결정 방식:</strong> <code>dataSourceId</code>({dataBinding.dataSourceId})에서
            {" "}<code>ds_</code> prefix를 제거하고 <code>/api/data/</code> 경로에 매핑.
            위젯 타입이 차트({widget.type})이면 timeseries 파라미터, 아니면 latest 파라미터 사용.
          </div>
        </div>
      ),
    },
    {
      id: "response",
      icon: <Database className="h-5 w-5 text-purple-500" />,
      label: "Response",
      summary: responseSummary,
      color: "border-purple-200 bg-purple-50",
      expandable: true,
      detail: (
        <div className="mt-2">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
            </div>
          ) : response ? (
            <JsonBlock data={response} title="API Response" maxHeight={300} />
          ) : (
            <p className="text-xs text-muted-foreground">No response</p>
          )}
        </div>
      ),
    },
    {
      id: "rendered",
      icon: <BarChart3 className="h-5 w-5 text-rose-500" />,
      label: "Rendered",
      summary: resolveLabel(widget.title, locale),
      color: "border-rose-200 bg-rose-50",
      expandable: false,
    },
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">Data Flow</h4>
      <div className="flex flex-col gap-2">
        {steps.map((step, idx) => (
          <div key={step.id}>
            {/* Step Card */}
            <div
              className={`rounded-lg border ${step.color} ${
                step.expandable ? "cursor-pointer" : ""
              } ${expandedStep === step.id ? "ring-1 ring-offset-1" : ""}`}
              onClick={() => step.expandable && toggle(step.id)}
            >
              <div className="flex items-center gap-3 p-3">
                {step.icon}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{step.label}</div>
                  <div className="truncate text-xs text-muted-foreground">{step.summary}</div>
                </div>
                {step.expandable && (
                  expandedStep === step.id
                    ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              {/* Expanded Detail */}
              {step.expandable && expandedStep === step.id && (
                <div className="border-t px-3 pb-3">
                  {step.detail}
                </div>
              )}
            </div>
            {/* Arrow */}
            {idx < steps.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowRight className="h-4 w-4 rotate-90 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
