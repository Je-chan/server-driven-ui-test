import {
  BarChart3,
  LineChart,
  PieChart,
  Table,
  Gauge,
  Map,
  Activity,
  ListFilter,
  ListChecks,
  FolderTree,
  TextCursorInput,
  ToggleLeft,
  Calendar,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

export interface WidgetTypeDefinition {
  type: string;
  label: string;
  icon: LucideIcon;
  category: "filter" | "chart" | "card" | "table" | "map" | "status" | "form";
  description: string;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  defaultOptions: Record<string, unknown>;
}

export const WIDGET_TYPES: WidgetTypeDefinition[] = [
  {
    type: "kpi-card",
    label: "KPI Card",
    icon: Activity,
    category: "card",
    description: "단일 지표를 표시하는 카드",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 3, h: 3 },
    defaultOptions: {
      showTrend: true,
      icon: "Activity",
    },
  },
  {
    type: "line-chart",
    label: "Line Chart",
    icon: LineChart,
    category: "chart",
    description: "시계열 데이터 추이",
    defaultSize: { w: 12, h: 8 },
    minSize: { w: 6, h: 4 },
    defaultOptions: {
      showLegend: true,
      smooth: true,
      showArea: false,
    },
  },
  {
    type: "bar-chart",
    label: "Bar Chart",
    icon: BarChart3,
    category: "chart",
    description: "카테고리별 비교",
    defaultSize: { w: 12, h: 8 },
    minSize: { w: 6, h: 4 },
    defaultOptions: {
      showLegend: true,
      horizontal: false,
    },
  },
  {
    type: "pie-chart",
    label: "Pie Chart",
    icon: PieChart,
    category: "chart",
    description: "비율 표시",
    defaultSize: { w: 8, h: 8 },
    minSize: { w: 4, h: 4 },
    defaultOptions: {
      showLegend: true,
      donut: false,
    },
  },
  {
    type: "table",
    label: "Data Table",
    icon: Table,
    category: "table",
    description: "데이터 테이블",
    defaultSize: { w: 12, h: 8 },
    minSize: { w: 6, h: 4 },
    defaultOptions: {
      pagination: true,
      pageSize: 10,
      sortable: true,
    },
  },
  {
    type: "gauge",
    label: "Gauge",
    icon: Gauge,
    category: "status",
    description: "게이지 차트",
    defaultSize: { w: 6, h: 6 },
    minSize: { w: 4, h: 4 },
    defaultOptions: {
      min: 0,
      max: 100,
      thresholds: [],
    },
  },
  {
    type: "map",
    label: "Map",
    icon: Map,
    category: "map",
    description: "지도 위젯",
    defaultSize: { w: 12, h: 10 },
    minSize: { w: 6, h: 6 },
    defaultOptions: {
      center: [36.5, 127.5],
      zoom: 7,
    },
  },
  // ── 필터 위젯 ──
  {
    type: "filter-select",
    label: "Select",
    icon: ListFilter,
    category: "filter",
    description: "드롭다운 선택 필터",
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    defaultOptions: {
      filterKey: "",
      options: [],
    },
  },
  {
    type: "filter-multiselect",
    label: "Multi Select",
    icon: ListChecks,
    category: "filter",
    description: "다중 선택 필터",
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 3, h: 3 },
    defaultOptions: {
      filterKey: "",
      options: [],
    },
  },
  {
    type: "filter-treeselect",
    label: "Tree Select",
    icon: FolderTree,
    category: "filter",
    description: "계층 트리 선택 필터",
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 3, h: 3 },
    defaultOptions: {
      filterKey: "",
      options: [],
    },
  },
  {
    type: "filter-input",
    label: "Input",
    icon: TextCursorInput,
    category: "filter",
    description: "텍스트 입력 필터",
    defaultSize: { w: 4, h: 4 },
    minSize: { w: 3, h: 3 },
    defaultOptions: {
      filterKey: "",
      placeholder: "",
    },
  },
  {
    type: "filter-tab",
    label: "Tab",
    icon: ToggleLeft,
    category: "filter",
    description: "탭/버튼 선택 필터",
    defaultSize: { w: 6, h: 4 },
    minSize: { w: 4, h: 3 },
    defaultOptions: {
      filterKey: "",
      options: [],
      variant: "pill",
    },
  },
  {
    type: "filter-datepicker",
    label: "Datepicker",
    icon: Calendar,
    category: "filter",
    description: "날짜 범위 선택 필터",
    defaultSize: { w: 8, h: 4 },
    minSize: { w: 4, h: 3 },
    defaultOptions: {
      filterKey: "timeRange",
      presets: ["today", "yesterday", "last7days", "last30days", "thisMonth"],
      defaultValue: "today",
      outputKeys: { start: "startTime", end: "endTime" },
    },
  },
  // ── 폼 위젯 ──
  {
    type: "form",
    label: "Form",
    icon: ClipboardList,
    category: "form",
    description: "폼 카드 (필드 + 버튼)",
    defaultSize: { w: 12, h: 10 },
    minSize: { w: 6, h: 4 },
    defaultOptions: {
      formId: "",
      columns: 1,
      fields: [],
      buttons: [
        { label: "제출", buttonType: "submit", variant: "primary" },
        { label: "초기화", buttonType: "reset", variant: "outline" },
      ],
    },
  },
];

export const getWidgetType = (type: string): WidgetTypeDefinition | undefined => {
  return WIDGET_TYPES.find((w) => w.type === type);
};

export const getWidgetsByCategory = (category: WidgetTypeDefinition["category"]) => {
  return WIDGET_TYPES.filter((w) => w.category === category);
};
