"use client";

import type { DashboardJson, Widget } from "@/src/entities/dashboard";
import { useLocale, useTranslations } from "next-intl";
import { resolveLabel } from "@/src/shared/lib";
import { JsonBlock } from "./JsonBlock";
import { DataFlowDiagram } from "./DataFlowDiagram";

interface StepContentProps {
  stepId: string;
  schema: DashboardJson;
  selectedWidget: Widget | null;
}

export function StepContent({ stepId, schema, selectedWidget }: StepContentProps) {
  switch (stepId) {
    case "overview":
      return <OverviewContent schema={schema} />;
    case "settings":
      return <SettingsContent schema={schema} />;
    case "widgets":
      return <WidgetsContent schema={schema} selectedWidget={selectedWidget} />;
    case "data-binding":
      return <DataBindingContent schema={schema} selectedWidget={selectedWidget} />;
    case "rendered":
      return <RenderedContent schema={schema} />;
    default:
      return null;
  }
}

// Step 1: Schema Overview
function OverviewContent({ schema }: { schema: DashboardJson }) {
  const locale = useLocale();
  const tp = useTranslations("presentation");

  // 전체 스키마의 최상위 키만 보여주는 요약
  const schemaOverview = {
    version: schema.version,
    settings: `{ gridColumns: ${schema.settings?.gridColumns ?? 24}, theme: "${schema.settings?.theme ?? "light"}", ... }`,
    dataSources: `[ ${schema.dataSources?.length ?? 0} items ]`,
    filters: `[ ${schema.filters?.length ?? 0} items ]`,
    widgets: `[ ${schema.widgets?.length ?? 0} items ]`,
    linkages: `[ ${schema.linkages?.length ?? 0} items ]`,
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-blue-900">{tp("serverDrivenUi")}</h4>
        <p className="mt-1 text-sm text-blue-800">
          {tp("serverDrivenUiDesc")}
        </p>
      </div>

      <h4 className="text-sm font-medium text-foreground">{tp("schemaTopLevel")}</h4>
      <JsonBlock data={schemaOverview} title="DashboardJson" />

      <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-blue-900">{tp("components")}</h4>
        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li><strong>settings</strong> — 그리드 레이아웃, 테마, 자동 갱신 주기</li>
          <li><strong>dataSources</strong> — API 엔드포인트와 캐시 설정 정의</li>
          <li><strong>filters</strong> — 글로벌 필터 (날짜, 자산 선택 등)</li>
          <li><strong>widgets</strong> — 위젯 인스턴스 (타입, 레이아웃, 데이터 바인딩)</li>
          <li><strong>linkages</strong> — 위젯 간 연동 규칙</li>
        </ul>
      </div>

      <JsonBlock
        data={schema}
        title="전체 JSON 스키마"
        collapsible
        defaultCollapsed
        maxHeight={400}
      />
    </div>
  );
}

// Step 2: Settings
function SettingsContent({ schema }: { schema: DashboardJson }) {
  const locale = useLocale();
  const tp = useTranslations("presentation");

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-blue-900">{tp("settings")}</h4>
        <p className="mt-1 text-sm text-blue-800">
          {tp("settingsDesc")}
        </p>
      </div>

      <JsonBlock data={schema.settings} title="schema.settings" />

      <div className="space-y-3">
        <FieldExplanation
          field="gridColumns"
          value={String(schema.settings?.gridColumns ?? 24)}
          description="그리드 시스템의 컬럼 수. 위젯의 x, w 좌표가 이 값을 기준으로 배치됩니다."
        />
        <FieldExplanation
          field="rowHeight"
          value={`${schema.settings?.rowHeight ?? 1}px`}
          description="그리드 1행의 높이. rowHeight=1이면 h 값이 곧 픽셀 높이입니다."
        />
        <FieldExplanation
          field="theme"
          value={schema.settings?.theme ?? "light"}
          description="대시보드 테마 (light / dark / system)"
        />
        <FieldExplanation
          field="refreshInterval"
          value={`${schema.settings?.refreshInterval ?? 0}ms`}
          description="자동 데이터 갱신 주기. 0이면 자동 갱신 비활성화."
        />
      </div>
    </div>
  );
}

// Step 3: Widgets
function WidgetsContent({
  schema,
  selectedWidget,
}: {
  schema: DashboardJson;
  selectedWidget: Widget | null;
}) {
  const locale = useLocale();
  const tp = useTranslations("presentation");

  if (selectedWidget) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
          <h4 className="text-sm font-semibold text-blue-900">
            {tp("selectedWidget", { title: resolveLabel(selectedWidget.title, locale) })}
          </h4>
          <p className="mt-1 text-sm text-blue-800">
            타입: <code className="rounded bg-blue-200 px-1">{selectedWidget.type}</code>
            {" / "}위치: ({selectedWidget.layout.x}, {selectedWidget.layout.y})
            {" / "}크기: {selectedWidget.layout.w} x {selectedWidget.layout.h}
          </p>
        </div>

        <JsonBlock data={selectedWidget} title="Widget JSON" maxHeight={500} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-blue-900">{tp("widgetsTitle")}</h4>
        <p className="mt-1 text-sm text-blue-800">
          {tp("widgetsClickHint")}
        </p>
      </div>

      <h4 className="text-sm font-medium text-foreground">
        {tp("widgetsList", { count: schema.widgets.length })}
      </h4>
      <div className="space-y-2">
        {schema.widgets.map((widget) => (
          <div
            key={widget.id}
            className="rounded-lg border p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{resolveLabel(widget.title, locale)}</span>
              <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {widget.type}
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              layout: ({widget.layout.x}, {widget.layout.y}) {widget.layout.w}x{widget.layout.h}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 4: Data Binding
function DataBindingContent({
  schema,
  selectedWidget,
}: {
  schema: DashboardJson;
  selectedWidget: Widget | null;
}) {
  const locale = useLocale();
  const tp = useTranslations("presentation");

  if (selectedWidget) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
          <h4 className="text-sm font-semibold text-blue-900">
            {tp("dataBindingOfWidget", { title: resolveLabel(selectedWidget.title, locale) })}
          </h4>
          <p className="mt-1 text-sm text-blue-800">
            {tp("dataBindingVisualize")}
          </p>
        </div>

        <DataFlowDiagram widget={selectedWidget} />

        {selectedWidget.dataBinding && (
          <JsonBlock
            data={selectedWidget.dataBinding}
            title="dataBinding JSON"
            maxHeight={300}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-blue-900">{tp("dataBindingTitle")}</h4>
        <p className="mt-1 text-sm text-blue-800">
          {tp("dataBindingDesc")}
        </p>
      </div>

      <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-blue-900">{tp("dataBindingStructure")}</h4>
        <ul className="mt-2 space-y-1 text-sm text-blue-800">
          <li><strong>dataSourceId</strong> — 어떤 데이터 소스에서 가져올지</li>
          <li><strong>requestParams</strong> — API 요청 파라미터 (필터 변수 참조 가능)</li>
          <li><strong>mapping</strong> — 응답 데이터의 필드 매핑 (dimensions, measurements)</li>
          <li><strong>transform</strong> — 계산 필드, 정렬, 제한 등 후처리</li>
        </ul>
      </div>

      {schema.dataSources && schema.dataSources.length > 0 && (
        <>
          <h4 className="text-sm font-medium text-foreground">
            {tp("dataSources", { count: schema.dataSources.length })}
          </h4>
          <JsonBlock
            data={schema.dataSources}
            title="schema.dataSources"
            collapsible
            defaultCollapsed
            maxHeight={300}
          />
        </>
      )}
    </div>
  );
}

// Step 5: Rendered Result
function RenderedContent({ schema }: { schema: DashboardJson }) {
  const locale = useLocale();
  const tp = useTranslations("presentation");

  const widgetTypes = schema.widgets.reduce<Record<string, number>>((acc, w) => {
    acc[w.type] = (acc[w.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-blue-900">{tp("renderedResult")}</h4>
        <p className="mt-1 text-sm text-blue-800">
          {tp("renderedResultDesc")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label={tp("widgetCount")} value={String(schema.widgets.length)} />
        <SummaryCard label={tp("dataSourceCount")} value={String(schema.dataSources?.length ?? 0)} />
        <SummaryCard label={tp("filterCount")} value={String(schema.filters?.length ?? 0)} />
        <SummaryCard label="Theme" value={schema.settings?.theme ?? "light"} />
        <SummaryCard label={tp("gridColumns")} value={String(schema.settings?.gridColumns ?? 24)} />
        <SummaryCard
          label={tp("autoRefresh")}
          value={schema.settings?.refreshInterval ? `${schema.settings.refreshInterval / 1000}s` : "Off"}
        />
      </div>

      <h4 className="text-sm font-medium text-foreground">{tp("widgetTypeDistribution")}</h4>
      <div className="space-y-2">
        {Object.entries(widgetTypes).map(([type, count]) => (
          <div key={type} className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm font-medium">{type}</span>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {count}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-blue-900">{tp("renderPipeline")}</h4>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-blue-800">
          <li>{tp("renderStep1")}</li>
          <li>{tp("renderStep2")}</li>
          <li>{tp("renderStep3")}</li>
          <li>{tp("renderStep4")}</li>
          <li>{tp("renderStep5")}</li>
        </ol>
      </div>
    </div>
  );
}

// 공통 컴포넌트
function FieldExplanation({
  field,
  value,
  description,
}: {
  field: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <code className="text-sm font-medium text-blue-600">{field}</code>
        <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono">{value}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3 text-center">
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
