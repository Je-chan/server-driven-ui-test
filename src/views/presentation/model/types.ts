import type { DashboardJson } from "@/src/entities/dashboard";

export interface PresentationStep {
  id: string;
  label: string;
  description: string;
}

// 기본 스텝 (항상 포함)
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

// 조건부 스텝 정의
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
