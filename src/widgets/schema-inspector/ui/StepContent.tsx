"use client";

import type { DashboardJson, Widget } from "@/src/entities/dashboard";
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
        <h4 className="text-sm font-semibold text-blue-900">Server-Driven UI란?</h4>
        <p className="mt-1 text-sm text-blue-800">
          서버가 JSON 스키마로 화면 구성을 정의하고, 프론트엔드는 범용 렌더러로 이를 동적 렌더링합니다.
          코드 배포 없이 대시보드를 수정할 수 있습니다.
        </p>
      </div>

      <h4 className="text-sm font-medium text-foreground">스키마 최상위 구조</h4>
      <JsonBlock data={schemaOverview} title="DashboardJson" />

      <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-blue-900">구성 요소</h4>
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
  return (
    <div className="space-y-4">
      <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-blue-900">Settings</h4>
        <p className="mt-1 text-sm text-blue-800">
          대시보드의 기본 레이아웃과 동작을 제어하는 설정입니다.
          react-grid-layout이 이 값을 사용하여 위젯 배치를 계산합니다.
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
          value={`${schema.settings?.rowHeight ?? 40}px`}
          description="그리드 1행의 높이. 위젯의 h 값에 곱해져 실제 픽셀 높이가 결정됩니다."
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
  if (selectedWidget) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
          <h4 className="text-sm font-semibold text-blue-900">
            선택된 위젯: {selectedWidget.title}
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
        <h4 className="text-sm font-semibold text-blue-900">Widgets</h4>
        <p className="mt-1 text-sm text-blue-800">
          캔버스의 위젯을 클릭하면 해당 위젯의 JSON 정의를 확인할 수 있습니다.
        </p>
      </div>

      <h4 className="text-sm font-medium text-foreground">
        위젯 목록 ({schema.widgets.length}개)
      </h4>
      <div className="space-y-2">
        {schema.widgets.map((widget) => (
          <div
            key={widget.id}
            className="rounded-lg border p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{widget.title}</span>
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
  if (selectedWidget) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
          <h4 className="text-sm font-semibold text-blue-900">
            {selectedWidget.title}의 데이터 바인딩
          </h4>
          <p className="mt-1 text-sm text-blue-800">
            위젯이 데이터를 가져오는 과정을 시각화합니다.
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
        <h4 className="text-sm font-semibold text-blue-900">Data Binding</h4>
        <p className="mt-1 text-sm text-blue-800">
          위젯은 <code className="rounded bg-blue-200 px-1">dataBinding</code>을 통해
          데이터 소스와 연결됩니다. 캔버스에서 위젯을 클릭하면 바인딩 상세를 볼 수 있습니다.
        </p>
      </div>

      <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-blue-900">바인딩 구조</h4>
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
            데이터 소스 ({schema.dataSources.length}개)
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
  const widgetTypes = schema.widgets.reduce<Record<string, number>>((acc, w) => {
    acc[w.type] = (acc[w.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
        <h4 className="text-sm font-semibold text-blue-900">렌더링 결과</h4>
        <p className="mt-1 text-sm text-blue-800">
          JSON 스키마가 프론트엔드 렌더러에 의해 실제 대시보드 화면으로 변환된 결과입니다.
          좌측 캔버스에서 최종 결과를 확인하세요.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="위젯 수" value={String(schema.widgets.length)} />
        <SummaryCard label="데이터 소스" value={String(schema.dataSources?.length ?? 0)} />
        <SummaryCard label="필터" value={String(schema.filters?.length ?? 0)} />
        <SummaryCard label="테마" value={schema.settings?.theme ?? "light"} />
        <SummaryCard label="그리드 컬럼" value={String(schema.settings?.gridColumns ?? 24)} />
        <SummaryCard
          label="자동 갱신"
          value={schema.settings?.refreshInterval ? `${schema.settings.refreshInterval / 1000}s` : "Off"}
        />
      </div>

      <h4 className="text-sm font-medium text-foreground">위젯 타입별 분포</h4>
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
        <h4 className="text-sm font-semibold text-blue-900">렌더링 파이프라인</h4>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-blue-800">
          <li>서버에서 JSON 스키마를 로드</li>
          <li>settings로 그리드 레이아웃 구성</li>
          <li>widgets 배열을 순회하며 WidgetRenderer 호출</li>
          <li>각 위젯이 dataBinding으로 API 데이터 fetch</li>
          <li>차트, 테이블, KPI 카드 등으로 렌더링</li>
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
