export interface PresentationStep {
  id: string;
  label: string;
  description: string;
}

export const PRESENTATION_STEPS: PresentationStep[] = [
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
  {
    id: "widgets",
    label: "Widgets",
    description: "위젯의 타입, 레이아웃, 스타일 정의",
  },
  {
    id: "data-binding",
    label: "Data Binding",
    description: "위젯과 데이터 소스 간의 바인딩 구조",
  },
  {
    id: "rendered",
    label: "Rendered Result",
    description: "Server-Driven UI의 최종 렌더링 결과",
  },
];
