/**
 * 발표 모드 스텝 정의 — 대시보드 스키마를 단계별로 설명하는 프레젠테이션 구조.
 *
 * 각 대시보드의 /presentation 경로에서 사용되며,
 * 스키마의 내용에 따라 동적으로 스텝을 구성한다.
 *
 * 스텝 구성 알고리즘 (buildPresentationSteps):
 * 1. 기본 스텝(overview, settings)은 항상 포함
 * 2. filter-* 위젯이 있으면 "Filters" 스텝 추가
 * 3. widgets, data-binding 스텝은 항상 포함
 * 4. form 위젯이 있으면 "Form" 스텝 추가
 * 5. conditional-slot 위젯이 있으면 "Switch Slot" 스텝 추가
 * 6. 마지막에 "Rendered Result" 스텝 추가
 *
 * 이렇게 스키마 내용 기반으로 스텝을 동적 구성하므로,
 * 필터가 없는 대시보드는 Filters 스텝이 자동으로 빠지고,
 * 조건부 렌더링이 없는 대시보드는 Switch Slot 스텝이 빠진다.
 */
import type { DashboardJson } from "@/src/entities/dashboard";

/** 프레젠테이션의 한 단계를 표현하는 인터페이스 */
export interface PresentationStep {
  id: string;          // 스텝 식별자 (StepContent에서 switch 분기에 사용)
  label: string;       // 헤더에 표시될 스텝 이름
  description: string; // 스텝 설명 텍스트
}

/** 기본 스텝 — 모든 대시보드에 항상 포함 */
const BASE_STEPS: PresentationStep[] = [
  {
    id: "overview",
    label: "Schema Overview",
    description: "대시보드 JSON 스키마의 전체 구조를 살펴봅니다",
  },
  {
    id: "settings",
    label: "Settings",
    description: "그리드 레이아웃, 테마, 갱신 주기 등 대시보드 설정",
  },
];

/** 조건부 스텝 — 스키마 내용에 따라 선택적으로 포함 */
const FILTERS_STEP: PresentationStep = {
  id: "filters",
  label: "Filters",
  description: "필터 위젯(filter-*)의 구조와 동작",
};

const WIDGETS_STEP: PresentationStep = {
  id: "widgets",
  label: "Widgets",
  description: "위젯의 타입, 레이아웃, 스타일 정의",
};

const DATA_BINDING_STEP: PresentationStep = {
  id: "data-binding",
  label: "Data Binding",
  description: "위젯과 데이터 소스 간의 바인딩 구조",
};

const FORM_STEP: PresentationStep = {
  id: "form",
  label: "Form",
  description: "폼 위젯의 필드, 버튼, 제출 설정",
};

const SWITCH_SLOT_STEP: PresentationStep = {
  id: "switch-slot",
  label: "Switch Slot",
  description: "조건부 위젯 전환(conditional-slot)의 동작 원리",
};

const RENDERED_STEP: PresentationStep = {
  id: "rendered",
  label: "Rendered Result",
  description: "Server-Driven UI의 최종 렌더링 결과",
};

/**
 * 대시보드 스키마를 분석하여 프레젠테이션 스텝 배열을 동적으로 구성한다.
 * 스키마에 해당 위젯 타입이 있을 때만 관련 스텝을 포함시킨다.
 */
export function buildPresentationSteps(schema: DashboardJson): PresentationStep[] {
  const steps = [...BASE_STEPS];

  const hasFilterWidgets = schema.widgets.some((w) => w.type.startsWith("filter-"));
  if (hasFilterWidgets) steps.push(FILTERS_STEP);

  // Widgets, Data Binding 은 항상 포함
  steps.push(WIDGETS_STEP, DATA_BINDING_STEP);

  const hasForm = schema.widgets.some((w) => w.type === "form");
  if (hasForm) steps.push(FORM_STEP);

  const hasConditionalSlot = schema.widgets.some((w) => w.type === "conditional-slot");
  if (hasConditionalSlot) steps.push(SWITCH_SLOT_STEP);

  steps.push(RENDERED_STEP);
  return steps;
}
