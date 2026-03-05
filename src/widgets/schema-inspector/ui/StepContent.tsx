/**
 * StepContent — 발표 모드 Inspector 패널의 스텝별 콘텐츠 렌더러.
 *
 * PresentationPage의 우측 패널(SchemaInspector)에서 현재 스텝에 따라
 * 적절한 설명/JSON/다이어그램을 렌더링한다.
 *
 * 스텝별 콘텐츠:
 * - overview: 스키마 최상위 구조 요약 + Server-Driven UI 개념 설명
 * - settings: gridColumns, rowHeight, theme, filterMode 등 설정 해설
 * - filters: 필터 시스템 아키텍처 (타입, filterKey, 데이터 흐름, auto/manual)
 * - widgets: 위젯 목록 + 선택 시 JSON 상세 보기
 * - data-binding: 데이터 바인딩 구조 + DataFlowDiagram 시각화
 * - form: 폼 위젯 구조 (fields, buttons, submitConfig)
 * - switch-slot: 조건부 렌더링 메커니즘 (conditions, evaluateConditions)
 * - rendered: 최종 렌더링 결과 요약 + 렌더링 파이프라인 설명
 *
 * 위젯 선택 시 해당 위젯의 상세 JSON과 관련 설명을 표시한다.
 */
"use client";

import type { DashboardJson, Widget } from "@/src/entities/dashboard";
import { useLocale, useTranslations } from "next-intl";
import { resolveLabel } from "@/src/shared/lib";
import { JsonBlock } from "./JsonBlock";
import { DataFlowDiagram } from "./DataFlowDiagram";

interface StepContentProps {
  stepId: string;                    // 현재 활성 스텝 ID
  schema: DashboardJson;            // 대시보드 JSON 스키마
  selectedWidget: Widget | null;     // 캔버스에서 클릭된 위젯 (없으면 null)
}

/** 스텝 ID에 따라 적절한 콘텐츠 컴포넌트를 switch로 분기 */
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

/** Step: Schema Overview — Server-Driven UI 개념 소개 + 스키마 최상위 구조 요약 */
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

/** Step: Settings — gridColumns, rowHeight, theme, filterMode 등 대시보드 설정 해설 */
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

/**
 * FiltersContent — 필터 시스템 설명 스텝.
 * 필터 아키텍처, 데이터 흐름, 필터 위젯 목록을 보여준다.
 * 위젯 선택 시 해당 필터의 상세 JSON과 역할을 설명한다.
 */
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
  const hasSubmit = schema.widgets.some((w) => w.type === "filter-submit");

  // ── 특정 필터 위젯이 선택된 경우: 상세 설명 ──
  if (selectedWidget && selectedWidget.type.startsWith("filter-")) {
    const filterKey = (selectedWidget.options as Record<string, unknown>)?.filterKey as string | undefined;
    const opts = (selectedWidget.options ?? {}) as Record<string, unknown>;
    const hasDependsOn = !!opts.dependsOn;
    const hasFixedValue = opts.fixedValue !== undefined && opts.fixedValue !== null;
    const hasDataSourceId = !!opts.dataSourceId;
    const dependsOnParamKey = opts.dependsOnParamKey as string | undefined;

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

        {/* 필터 위젯의 데이터 흐름 설명 */}
        <div className="rounded-lg border-l-4 border-violet-500 bg-violet-50 p-4">
          <h4 className="text-sm font-semibold text-violet-900">데이터 흐름</h4>
          <div className="mt-2 space-y-1 font-mono text-xs text-violet-800">
            {hasDataSourceId && (
              <>
                <p>useFilterOptions({`{ dataSourceId: "${opts.dataSourceId}" }`})</p>
                <p>→ API에서 옵션 목록 로드</p>
                {hasDependsOn && dependsOnParamKey && (
                  <p>→ 부모 필터 변경 시 ?{dependsOnParamKey}=값 으로 재조회</p>
                )}
                <p>→ 현재 값이 유효하지 않으면 첫 항목 자동 선택</p>
              </>
            )}
            <p>사용자 조작 → onFilterChange(&quot;{filterKey}&quot;, value)</p>
            <p>→ useFilterValues.setFilterValue()</p>
            <p>→ pendingValues[&quot;{filterKey}&quot;] = value</p>
            <p>→ {hasSubmit ? "조회 버튼 클릭 → applyFilters()" : "즉시"} URL SearchParams 기록</p>
            <p>→ appliedValues 갱신</p>
            <p>→ resolveTemplateParams() 에서 {`{{filter.${filterKey}}}`} 치환</p>
            <p>→ 데이터 위젯 리페치</p>
          </div>
        </div>

        {/* 특수 기능 배지 */}
        {(hasDependsOn || hasFixedValue || hasDataSourceId) && (
          <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4">
            <h4 className="text-sm font-semibold text-amber-900">{tp("filterSpecialFeatures")}</h4>
            <ul className="mt-2 space-y-1 text-sm text-amber-800">
              {hasDataSourceId && (
                <li>
                  <strong>dataSourceId</strong> — <code className="rounded bg-amber-200 px-1">{String(opts.dataSourceId)}</code>
                  {" "}에서 API로 옵션 동적 로드
                  {opts.valueField ? <> (value: <code className="rounded bg-amber-200 px-1">{String(opts.valueField)}</code>)</> : null}
                  {opts.labelField ? <> (label: <code className="rounded bg-amber-200 px-1">{String(opts.labelField)}</code>)</> : null}
                </li>
              )}
              {hasDependsOn && (
                <li>
                  <strong>dependsOn</strong> — 부모 필터 값에 따라 이 필터의 선택지가 동적 변경됨
                  {dependsOnParamKey && <> (paramKey: <code className="rounded bg-amber-200 px-1">{dependsOnParamKey}</code>)</>}
                </li>
              )}
              {hasFixedValue && (
                <li><strong>fixedValue</strong> — 관리자가 값을 고정하여 사용자 변경 불가</li>
              )}
            </ul>
          </div>
        )}

        <JsonBlock data={selectedWidget} title="Filter Widget JSON" maxHeight={500} />
      </div>
    );
  }

  // ── 필터 위젯 미선택 시: 전체 필터 시스템 설명 ──
  return (
    <div className="space-y-4">
      <div className="rounded-lg border-l-4 border-violet-500 bg-violet-50 p-4">
        <h4 className="text-sm font-semibold text-violet-900">{tp("filtersTitle")}</h4>
        <p className="mt-1 text-sm text-violet-800">
          {tp("filtersExplanation")}
        </p>
      </div>

      {/* 필터 아키텍처 상세 설명 */}
      <div className="rounded-lg border-l-4 border-violet-500 bg-violet-50 p-4">
        <h4 className="text-sm font-semibold text-violet-900">{tp("filterArchitecture")}</h4>
        <ul className="mt-2 space-y-1 text-sm text-violet-800">
          <li><strong>useFilterValues</strong> — 이중 상태(pending/applied) 관리 훅</li>
          <li><strong>pendingValues</strong> — 필터 UI에 즉시 반영되는 임시 값</li>
          <li><strong>appliedValues</strong> — URL에서 역직렬화한 확정 값 (데이터 위젯이 참조)</li>
          <li><strong>URL 동기화</strong> — 필터 상태를 SearchParams에 저장 (북마크/공유 가능)</li>
          <li><strong>queueMicrotask</strong> — DatepickerFilterWidget의 연속 호출을 하나의 URL 업데이트로 배치</li>
        </ul>
      </div>

      {/* 동적 필터 옵션 로딩 */}
      <div className="rounded-lg border-l-4 border-violet-500 bg-violet-50 p-4">
        <h4 className="text-sm font-semibold text-violet-900">{tp("dynamicFilterOptions")}</h4>
        <ul className="mt-2 space-y-1 text-sm text-violet-800">
          <li><strong>useFilterOptions</strong> — dataSourceId 기반 API 호출로 옵션 동적 로드</li>
          <li><strong>종속 필터</strong> — 부모 필터 변경 시 자식 필터가 API를 재호출하고 첫 항목 자동 선택</li>
          <li><strong>스키마 정규화</strong> — normalizeSchema()가 레퍼런스/레거시 형식을 내부 형식으로 통일</li>
          <li><strong>필드 전달 경로</strong> — config.dataSourceId → migrate-filters → widget.options.dataSourceId → useFilterOptions</li>
        </ul>
      </div>

      {/* filterMode 설명 */}
      <div className="rounded-lg border-l-4 border-violet-500 bg-violet-50 p-4">
        <h4 className="text-sm font-semibold text-violet-900">filterMode</h4>
        <p className="mt-1 text-sm text-violet-800">
          {tp("filterModeExplanation")}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="rounded bg-violet-200 px-2 py-0.5 text-xs font-mono text-violet-800">
            filterMode: &quot;{schema.settings?.filterMode ?? "auto"}&quot;
          </span>
          {hasSubmit && (
            <span className="rounded bg-amber-200 px-2 py-0.5 text-xs font-mono text-amber-800">
              filter-submit 위젯 존재 → manual 모드
            </span>
          )}
        </div>
      </div>

      {/* 필터 타입 요약 */}
      <div className="rounded-lg border-l-4 border-violet-500 bg-violet-50 p-4">
        <h4 className="text-sm font-semibold text-violet-900">필터 위젯 타입</h4>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-violet-800">
          <div><code className="rounded bg-violet-200 px-1">filter-select</code> — 단일 선택</div>
          <div><code className="rounded bg-violet-200 px-1">filter-multiselect</code> — 다중 선택</div>
          <div><code className="rounded bg-violet-200 px-1">filter-datepicker</code> — 날짜 범위</div>
          <div><code className="rounded bg-violet-200 px-1">filter-input</code> — 텍스트 입력</div>
          <div><code className="rounded bg-violet-200 px-1">filter-tab</code> — 탭/버튼 그룹</div>
          <div><code className="rounded bg-violet-200 px-1">filter-toggle</code> — ON/OFF 토글</div>
          <div><code className="rounded bg-violet-200 px-1">filter-treeselect</code> — 트리 선택</div>
          <div><code className="rounded bg-violet-200 px-1">filter-submit</code> — 조회 버튼</div>
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
              const opts = (widget.options ?? {}) as Record<string, unknown>;
              return (
                <div key={widget.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{resolveLabel(widget.title, locale)}</span>
                    <span className="rounded bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
                      {widget.type}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {filterKey && (
                      <span>
                        filterKey: <code className="rounded bg-muted px-1">{filterKey}</code>
                      </span>
                    )}
                    {opts.defaultValue !== undefined && (
                      <span>
                        default: <code className="rounded bg-muted px-1">{String(opts.defaultValue)}</code>
                      </span>
                    )}
                    {opts.fixedValue !== undefined && opts.fixedValue !== null && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-700">
                        fixed
                      </span>
                    )}
                    {!!opts.dependsOn && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">
                        dependsOn
                      </span>
                    )}
                    {!!opts.dataSourceId && (
                      <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700">
                        API: {String(opts.dataSourceId)}
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

/** Step: Widgets — 위젯 목록 표시, 클릭 시 상세 JSON 보기 */
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

/** Step: Data Binding — 위젯↔데이터 소스 연결 구조 + DataFlowDiagram 시각화 */
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

/** Step: Form — 폼 위젯의 fields, buttons, submitConfig 구조 설명 */
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

/**
 * SwitchSlotContent — 조건부 렌더링(conditional-slot) 설명 스텝.
 * ConditionalSlotWidget의 동작 원리, evaluateConditions 엔진,
 * 각 자식 위젯의 조건 규칙을 시각적으로 설명한다.
 */
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

  // ── conditional-slot 위젯이 선택된 경우: 자식별 조건 상세 보기 ──
  if (selectedWidget && selectedWidget.type === "conditional-slot") {
    const children = selectedWidget.children ?? [];
    const conditionedChildren = children.filter((c) => c.conditions?.rules?.length);
    const fallbackChildren = children.filter((c) => !c.conditions?.rules?.length);

    return (
      <div className="space-y-4">
        <div className="rounded-lg border-l-4 border-teal-500 bg-teal-50 p-4">
          <h4 className="text-sm font-semibold text-teal-900">
            {tp("selectedSwitchSlot", { title: resolveLabel(selectedWidget.title, locale) })}
          </h4>
          <p className="mt-1 text-sm text-teal-800">
            {tp("switchSlotChildren", { count: children.length })}
            {" ("}조건부: {conditionedChildren.length}, 폴백: {fallbackChildren.length}{")"}
          </p>
        </div>

        {/* 활성 자식 결정 알고리즘 설명 */}
        <div className="rounded-lg border-l-4 border-teal-500 bg-teal-50 p-4">
          <h4 className="text-sm font-semibold text-teal-900">활성 자식 결정 알고리즘</h4>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-teal-800">
            <li>children 배열이 비어있으면 → 빈 슬롯 플레이스홀더 표시</li>
            <li>filterValues가 없으면 → 첫 번째 자식 렌더링 (빌더 미리보기)</li>
            <li>conditions가 있는 자식들을 순회하며 evaluateConditions()로 매칭 검사</li>
            <li>첫 번째 매칭 자식을 activeChild로 선택</li>
            <li>매칭 없으면 → 조건이 없는 첫 자식(폴백)을 선택</li>
          </ol>
        </div>

        {/* 자식 위젯별 조건 카드 */}
        <div className="space-y-2">
          {children.map((child, i) => {
            const hasConditions = child.conditions && child.conditions.rules.length > 0;
            return (
              <div key={child.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Slot {i + 1}: {resolveLabel(child.title, locale)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {child.type}
                    </span>
                    <span className={`rounded px-2 py-0.5 text-xs ${
                      hasConditions
                        ? "bg-teal-100 text-teal-700"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {hasConditions ? `${child.conditions!.logic.toUpperCase()} (${child.conditions!.rules.length} rules)` : "Fallback"}
                    </span>
                  </div>
                </div>
                {/* 조건이 있는 경우: 각 규칙을 사람이 읽기 좋은 형태로 표시 */}
                {hasConditions && (
                  <div className="mt-2 space-y-1">
                    {child.conditions!.rules.map((rule, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-1 text-xs">
                        {rIdx > 0 && (
                          <span className="rounded bg-teal-200 px-1 py-0.5 text-[10px] font-bold text-teal-700">
                            {child.conditions!.logic.toUpperCase()}
                          </span>
                        )}
                        <code className="rounded bg-muted px-1">{rule.variable}</code>
                        <span className="font-medium text-teal-700">{rule.operator}</span>
                        {rule.value !== undefined && (
                          <code className="rounded bg-muted px-1">{JSON.stringify(rule.value)}</code>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2">
                  <JsonBlock
                    data={hasConditions ? child.conditions : child}
                    title={hasConditions ? "conditions" : "widget (fallback)"}
                    maxHeight={150}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <JsonBlock data={selectedWidget} title="Conditional Slot JSON" maxHeight={400} collapsible defaultCollapsed />
      </div>
    );
  }

  // ── 미선택 시: 조건부 렌더링 시스템 전체 설명 ──
  return (
    <div className="space-y-4">
      <div className="rounded-lg border-l-4 border-teal-500 bg-teal-50 p-4">
        <h4 className="text-sm font-semibold text-teal-900">{tp("switchSlotTitle")}</h4>
        <p className="mt-1 text-sm text-teal-800">
          {tp("switchSlotExplanation")}
        </p>
      </div>

      {/* 렌더링 흐름 다이어그램 */}
      <div className="rounded-lg border-l-4 border-teal-500 bg-teal-50 p-4">
        <h4 className="text-sm font-semibold text-teal-900">렌더링 흐름</h4>
        <div className="mt-2 space-y-1 font-mono text-xs text-teal-800">
          <p>filterValues (useFilterValues)</p>
          <p>{"  ↓"}</p>
          <p>ConditionalSlotWidget.activeChild (useMemo)</p>
          <p>{"  ↓"} evaluateConditions(child.conditions, filterValues)</p>
          <p>{"  ↓"} 첫 번째 매칭 자식 선택</p>
          <p>{"  ↓"} 없으면 → 폴백 자식</p>
          <p>{"  ↓"}</p>
          <p>WidgetRenderer(activeChild)</p>
        </div>
      </div>

      <div className="rounded-lg border-l-4 border-teal-500 bg-teal-50 p-4">
        <h4 className="text-sm font-semibold text-teal-900">{tp("switchSlotMechanism")}</h4>
        <ul className="mt-2 space-y-1 text-sm text-teal-800">
          <li><strong>children[]</strong> — 여러 후보 위젯을 자식으로 보유</li>
          <li><strong>conditions</strong> — 각 자식에 {`{ logic: "and"|"or", rules: [...] }`} 설정</li>
          <li><strong>evaluateConditions()</strong> — filterValues와 대조하여 true/false 판정</li>
          <li>조건 없는 자식 = <strong>폴백</strong> (모든 조건 미매칭 시 기본 표시)</li>
        </ul>
      </div>

      <div className="rounded-lg border-l-4 border-teal-500 bg-teal-50 p-4">
        <h4 className="text-sm font-semibold text-teal-900">{tp("switchSlotOperators")}</h4>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-teal-800">
          <div><code className="rounded bg-teal-200 px-1">eq</code> — 같음 (String 비교)</div>
          <div><code className="rounded bg-teal-200 px-1">neq</code> — 같지 않음</div>
          <div><code className="rounded bg-teal-200 px-1">in</code> — 배열에 포함</div>
          <div><code className="rounded bg-teal-200 px-1">notIn</code> — 배열에 미포함</div>
          <div><code className="rounded bg-teal-200 px-1">exists</code> — 값이 존재하고 비어있지 않음</div>
          <div><code className="rounded bg-teal-200 px-1">notExists</code> — 값 없음 또는 빈 문자열</div>
        </div>
      </div>

      {/* 관련 소스 파일 안내 */}
      <div className="rounded-lg border-l-4 border-teal-500 bg-teal-50 p-4">
        <h4 className="text-sm font-semibold text-teal-900">관련 소스 파일</h4>
        <ul className="mt-2 space-y-1 text-xs font-mono text-teal-800">
          <li>entities/widget/ui/ConditionalSlotWidget.tsx — 조건부 렌더링 컨테이너</li>
          <li>shared/lib/evaluate-conditions.ts — 조건 평가 엔진</li>
          <li>widgets/property-panel/ui/ConditionsEditor.tsx — 빌더 조건 편집 UI</li>
          <li>entities/dashboard/model/types.ts — conditionRuleSchema, widgetConditionsSchema</li>
        </ul>
      </div>

      <h4 className="text-sm font-medium text-foreground">
        {tp("switchSlotWidgetList", { count: slotWidgets.length })}
      </h4>
      <div className="space-y-2">
        {slotWidgets.map((widget) => {
          const childCount = widget.children?.length ?? 0;
          const conditionedCount = widget.children?.filter((c) => c.conditions?.rules?.length).length ?? 0;
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
                {" ("}조건부: {conditionedCount}, 폴백: {childCount - conditionedCount}{")"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Step: Rendered Result — 최종 렌더링 결과 요약 + 렌더링 파이프라인 설명 */
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
          <li>{tp("renderStep1_5")}</li>
          <li>{tp("renderStep2")}</li>
          <li>{tp("renderStep3")}</li>
          <li>{tp("renderStep4")}</li>
          <li>{tp("renderStep4_5")}</li>
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
