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
    case "filters":
      return <FiltersContent schema={schema} selectedWidget={selectedWidget} />;
    case "widgets":
      return <WidgetsContent schema={schema} selectedWidget={selectedWidget} />;
    case "data-binding":
      return <DataBindingContent schema={schema} selectedWidget={selectedWidget} />;
    case "form":
      return <FormContent schema={schema} selectedWidget={selectedWidget} />;
    case "switch-slot":
      return <SwitchSlotContent schema={schema} selectedWidget={selectedWidget} />;
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

  const filterWidgetCount = schema.widgets.filter((w) => w.type.startsWith("filter-")).length;

  // 전체 스키마의 최상위 키만 보여주는 요약
  const schemaOverview = {
    version: schema.version,
    settings: `{ gridColumns: ${schema.settings?.gridColumns ?? 24}, theme: "${schema.settings?.theme ?? "light"}", filterMode: "${schema.settings?.filterMode ?? "auto"}", ... }`,
    dataSources: `[ ${schema.dataSources?.length ?? 0} items ]`,
    filters: `(legacy) [ ${schema.filters?.length ?? 0} items ]`,
    "widgets (filter-*)": `[ ${filterWidgetCount} items ]`,
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
          <li><strong>settings</strong> — 그리드 레이아웃, 테마, 자동 갱신 주기, 필터 모드</li>
          <li><strong>dataSources</strong> — API 엔드포인트와 캐시 설정 정의</li>
          <li><strong>filters</strong> — (레거시) 글로벌 필터 정의 — 현재는 filter-* 위젯으로 대체</li>
          <li><strong>widgets</strong> — 위젯 인스턴스 (일반 위젯 + 필터 위젯 + 폼 + 컨테이너)</li>
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
        <FieldExplanation
          field="filterMode"
          value={schema.settings?.filterMode ?? "auto"}
          description="필터 적용 방식. 'auto'는 필터 변경 즉시 적용, 'manual'은 조회 버튼(filter-submit) 클릭 시 적용."
        />
      </div>
    </div>
  );
}

// Filters
function FiltersContent({
  schema,
  selectedWidget,
}: {
  schema: DashboardJson;
  selectedWidget: Widget | null;
}) {
  const locale = useLocale();
  const tp = useTranslations("presentation");

  const filterWidgets = schema.widgets.filter((w) => w.type.startsWith("filter-"));

  if (selectedWidget && selectedWidget.type.startsWith("filter-")) {
    const filterKey = (selectedWidget.options as Record<string, unknown>)?.filterKey as string | undefined;
    return (
      <div className="space-y-4">
        <div className="rounded-lg border-l-4 border-violet-500 bg-violet-50 p-4">
          <h4 className="text-sm font-semibold text-violet-900">
            {tp("selectedWidget", { title: resolveLabel(selectedWidget.title, locale) })}
          </h4>
          <p className="mt-1 text-sm text-violet-800">
            타입: <code className="rounded bg-violet-200 px-1">{selectedWidget.type}</code>
            {filterKey && (
              <>
                {" / "}filterKey: <code className="rounded bg-violet-200 px-1">{filterKey}</code>
                {" → "}<code className="rounded bg-violet-200 px-1">{`{{filter.${filterKey}}}`}</code>
              </>
            )}
          </p>
        </div>

        <JsonBlock data={selectedWidget} title="Filter Widget JSON" maxHeight={500} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-l-4 border-violet-500 bg-violet-50 p-4">
        <h4 className="text-sm font-semibold text-violet-900">{tp("filtersTitle")}</h4>
        <p className="mt-1 text-sm text-violet-800">
          {tp("filtersExplanation")}
        </p>
      </div>

      <div className="rounded-lg border-l-4 border-violet-500 bg-violet-50 p-4">
        <h4 className="text-sm font-semibold text-violet-900">filterMode</h4>
        <p className="mt-1 text-sm text-violet-800">
          {tp("filterModeExplanation")}
        </p>
        <div className="mt-2">
          <span className="rounded bg-violet-200 px-2 py-0.5 text-xs font-mono text-violet-800">
            filterMode: &quot;{schema.settings?.filterMode ?? "auto"}&quot;
          </span>
        </div>
      </div>

      {filterWidgets.length > 0 ? (
        <>
          <h4 className="text-sm font-medium text-foreground">
            {tp("filterWidgetList", { count: filterWidgets.length })}
          </h4>
          <div className="space-y-2">
            {filterWidgets.map((widget) => {
              const filterKey = (widget.options as Record<string, unknown>)?.filterKey as string | undefined;
              return (
                <div key={widget.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{resolveLabel(widget.title, locale)}</span>
                    <span className="rounded bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
                      {widget.type}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    {filterKey && (
                      <span>
                        filterKey: <code className="rounded bg-muted px-1">{filterKey}</code>
                      </span>
                    )}
                    {(widget.options as Record<string, unknown>)?.defaultValue !== undefined && (
                      <span>
                        default: <code className="rounded bg-muted px-1">{String((widget.options as Record<string, unknown>).defaultValue)}</code>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {tp("noFilterWidgets")}
        </div>
      )}
    </div>
  );
}

// Widgets
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

// Form
function FormContent({
  schema,
  selectedWidget,
}: {
  schema: DashboardJson;
  selectedWidget: Widget | null;
}) {
  const locale = useLocale();
  const tp = useTranslations("presentation");

  const formWidgets = schema.widgets.filter((w) => w.type === "form");

  if (selectedWidget && selectedWidget.type === "form") {
    const opts = (selectedWidget.options ?? {}) as Record<string, unknown>;
    return (
      <div className="space-y-4">
        <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
          <h4 className="text-sm font-semibold text-amber-900">
            {tp("selectedForm", { title: resolveLabel(selectedWidget.title, locale) })}
          </h4>
          <p className="mt-1 text-sm text-amber-800">
            formId: <code className="rounded bg-amber-200 px-1">{String(opts.formId ?? "-")}</code>
            {" / "}fields: <code className="rounded bg-amber-200 px-1">{Array.isArray(opts.fields) ? opts.fields.length : 0}</code>
            {" / "}buttons: <code className="rounded bg-amber-200 px-1">{Array.isArray(opts.buttons) ? opts.buttons.length : 0}</code>
          </p>
        </div>

        <JsonBlock data={selectedWidget} title="Form Widget JSON" maxHeight={500} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
        <h4 className="text-sm font-semibold text-amber-900">{tp("formTitle")}</h4>
        <p className="mt-1 text-sm text-amber-800">
          {tp("formExplanation")}
        </p>
      </div>

      <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
        <h4 className="text-sm font-semibold text-amber-900">{tp("formStructureTitle")}</h4>
        <ul className="mt-2 space-y-1 text-sm text-amber-800">
          <li><strong>formId</strong> — 폼 식별자, FormManager에서 상태 추적에 사용</li>
          <li><strong>fields[]</strong> — 필드 배열 (text, number, select, radio, checkbox, textarea 등)</li>
          <li><strong>buttons[]</strong> — 버튼 배열 (submit, reset, button 타입)</li>
          <li><strong>submitConfig</strong> — API 엔드포인트, 메서드, 확인 다이얼로그, 성공/실패 처리</li>
          <li><strong>validation</strong> — 각 필드의 검증 규칙 (required, min, max, pattern 등)</li>
        </ul>
      </div>

      <h4 className="text-sm font-medium text-foreground">
        {tp("formWidgetList", { count: formWidgets.length })}
      </h4>
      <div className="space-y-2">
        {formWidgets.map((widget) => {
          const opts = (widget.options ?? {}) as Record<string, unknown>;
          return (
            <div key={widget.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{resolveLabel(widget.title, locale)}</span>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                  form
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>formId: <code className="rounded bg-muted px-1">{String(opts.formId ?? "-")}</code></span>
                <span>fields: {Array.isArray(opts.fields) ? opts.fields.length : 0}</span>
                <span>buttons: {Array.isArray(opts.buttons) ? opts.buttons.length : 0}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Switch Slot
function SwitchSlotContent({
  schema,
  selectedWidget,
}: {
  schema: DashboardJson;
  selectedWidget: Widget | null;
}) {
  const locale = useLocale();
  const tp = useTranslations("presentation");

  const slotWidgets = schema.widgets.filter((w) => w.type === "conditional-slot");

  if (selectedWidget && selectedWidget.type === "conditional-slot") {
    const children = selectedWidget.children ?? [];
    return (
      <div className="space-y-4">
        <div className="rounded-lg border-l-4 border-teal-500 bg-teal-50 p-4">
          <h4 className="text-sm font-semibold text-teal-900">
            {tp("selectedSwitchSlot", { title: resolveLabel(selectedWidget.title, locale) })}
          </h4>
          <p className="mt-1 text-sm text-teal-800">
            {tp("switchSlotChildren", { count: children.length })}
          </p>
        </div>

        <div className="space-y-2">
          {children.map((child, i) => {
            const hasConditions = child.conditions && child.conditions.rules.length > 0;
            return (
              <div key={child.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Slot {i + 1}: {resolveLabel(child.title, locale)}
                  </span>
                  <span className={`rounded px-2 py-0.5 text-xs ${
                    hasConditions
                      ? "bg-teal-100 text-teal-700"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {hasConditions ? `${child.conditions!.logic.toUpperCase()} (${child.conditions!.rules.length})` : "Fallback"}
                  </span>
                </div>
                {hasConditions && (
                  <div className="mt-2">
                    <JsonBlock data={child.conditions} title="conditions" maxHeight={150} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <JsonBlock data={selectedWidget} title="Conditional Slot JSON" maxHeight={400} collapsible defaultCollapsed />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-l-4 border-teal-500 bg-teal-50 p-4">
        <h4 className="text-sm font-semibold text-teal-900">{tp("switchSlotTitle")}</h4>
        <p className="mt-1 text-sm text-teal-800">
          {tp("switchSlotExplanation")}
        </p>
      </div>

      <div className="rounded-lg border-l-4 border-teal-500 bg-teal-50 p-4">
        <h4 className="text-sm font-semibold text-teal-900">{tp("switchSlotMechanism")}</h4>
        <ul className="mt-2 space-y-1 text-sm text-teal-800">
          <li><strong>children[]</strong> — 여러 후보 위젯을 자식으로 보유</li>
          <li><strong>conditions</strong> — 각 자식에 rules + logic 설정</li>
          <li><strong>evaluateConditions()</strong> — 필터 값과 대조하여 첫 번째 매칭 자식 렌더링</li>
          <li>조건 없는 자식 = <strong>폴백</strong> (기본 표시)</li>
        </ul>
      </div>

      <div className="rounded-lg border-l-4 border-teal-500 bg-teal-50 p-4">
        <h4 className="text-sm font-semibold text-teal-900">{tp("switchSlotOperators")}</h4>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-teal-800">
          <div><code className="rounded bg-teal-200 px-1">eq</code> — 같음</div>
          <div><code className="rounded bg-teal-200 px-1">neq</code> — 같지 않음</div>
          <div><code className="rounded bg-teal-200 px-1">in</code> — 포함</div>
          <div><code className="rounded bg-teal-200 px-1">notIn</code> — 미포함</div>
          <div><code className="rounded bg-teal-200 px-1">exists</code> — 값 존재</div>
          <div><code className="rounded bg-teal-200 px-1">notExists</code> — 값 없음</div>
        </div>
      </div>

      <h4 className="text-sm font-medium text-foreground">
        {tp("switchSlotWidgetList", { count: slotWidgets.length })}
      </h4>
      <div className="space-y-2">
        {slotWidgets.map((widget) => {
          const childCount = widget.children?.length ?? 0;
          return (
            <div key={widget.id} className="rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{resolveLabel(widget.title, locale)}</span>
                <span className="rounded bg-teal-100 px-2 py-0.5 text-xs text-teal-700">
                  conditional-slot
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {tp("switchSlotChildren", { count: childCount })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Rendered Result
function RenderedContent({ schema }: { schema: DashboardJson }) {
  const tp = useTranslations("presentation");

  const filterWidgetCount = schema.widgets.filter((w) => w.type.startsWith("filter-")).length;
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
        <SummaryCard label={tp("filterWidgetCount")} value={String(filterWidgetCount)} />
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
