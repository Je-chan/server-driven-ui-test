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
  Search,
  ClipboardList,
  LayoutGrid,
  Layers,
  Type,
  ImageIcon,
  type LucideIcon,
} from "lucide-react";

export interface WidgetTypeDefinition {
  type: string;
  label: string;
  icon: LucideIcon;
  category: "filter" | "chart" | "card" | "table" | "map" | "status" | "form" | "container";
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
    defaultSize: { w: 6, h: 120 },
    minSize: { w: 3, h: 80 },
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
    defaultSize: { w: 12, h: 300 },
    minSize: { w: 6, h: 150 },
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
    defaultSize: { w: 12, h: 300 },
    minSize: { w: 6, h: 150 },
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
    defaultSize: { w: 8, h: 300 },
    minSize: { w: 4, h: 150 },
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
    defaultSize: { w: 12, h: 300 },
    minSize: { w: 6, h: 150 },
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
    defaultSize: { w: 6, h: 200 },
    minSize: { w: 4, h: 120 },
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
    defaultSize: { w: 12, h: 350 },
    minSize: { w: 6, h: 200 },
    defaultOptions: {
      center: [36.5, 127.5],
      zoom: 7,
    },
  },
  // ── 정적 위젯 ──
  {
    type: "text",
    label: "Text",
    icon: Type,
    category: "card",
    description: "정적 텍스트 블록",
    defaultSize: { w: 6, h: 80 },
    minSize: { w: 3, h: 40 },
    defaultOptions: {
      content: "",
      align: "left",
      fontSize: 14,
    },
  },
  {
    type: "image",
    label: "Image",
    icon: ImageIcon,
    category: "card",
    description: "이미지 표시",
    defaultSize: { w: 6, h: 200 },
    minSize: { w: 3, h: 80 },
    defaultOptions: {
      src: "",
      alt: "",
      fit: "contain",
    },
  },
  // ── 필터 위젯 ──
  {
    type: "filter-select",
    label: "Select",
    icon: ListFilter,
    category: "filter",
    description: "드롭다운 선택 필터",
    defaultSize: { w: 4, h: 50 },
    minSize: { w: 3, h: 36 },
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
    defaultSize: { w: 4, h: 50 },
    minSize: { w: 3, h: 36 },
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
    defaultSize: { w: 4, h: 50 },
    minSize: { w: 3, h: 36 },
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
    defaultSize: { w: 4, h: 50 },
    minSize: { w: 3, h: 36 },
    defaultOptions: {
      filterKey: "",
      placeholder: "",
    },
  },
  {
    type: "filter-toggle",
    label: "Toggle",
    icon: ToggleLeft,
    category: "filter",
    description: "On/Off 토글 스위치",
    defaultSize: { w: 4, h: 50 },
    minSize: { w: 3, h: 36 },
    defaultOptions: {
      filterKey: "",
      onValue: "on",
      offValue: "off",
      defaultValue: "off",
      onLabel: "ON",
      offLabel: "OFF",
    },
  },
  {
    type: "filter-tab",
    label: "Tab",
    icon: ToggleLeft,
    category: "filter",
    description: "탭/버튼 선택 필터",
    defaultSize: { w: 6, h: 50 },
    minSize: { w: 4, h: 36 },
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
    defaultSize: { w: 8, h: 50 },
    minSize: { w: 4, h: 36 },
    defaultOptions: {
      filterKey: "timeRange",
      presets: ["today", "yesterday", "last7days", "last30days", "thisMonth"],
      defaultValue: "today",
      outputKeys: { start: "startTime", end: "endTime" },
    },
  },
  {
    type: "filter-submit",
    label: "Submit",
    icon: Search,
    category: "filter",
    description: "필터 적용 버튼 (수동 조회 모드)",
    defaultSize: { w: 3, h: 40 },
    minSize: { w: 2, h: 32 },
    defaultOptions: { label: "조회", variant: "primary" },
  },
  // ── 폼 위젯 ──
  {
    type: "form",
    label: "Form",
    icon: ClipboardList,
    category: "form",
    description: "폼 카드 (필드 + 버튼)",
    defaultSize: { w: 12, h: 400 },
    minSize: { w: 6, h: 150 },
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
  // ── 컨테이너 위젯 ──
  {
    type: "card",
    label: "Card",
    icon: LayoutGrid,
    category: "container",
    description: "위젯을 그룹화하는 컨테이너 카드",
    defaultSize: { w: 12, h: 8 },
    minSize: { w: 4, h: 3 },
    defaultOptions: { showHeader: true, headerTitle: "" },
  },
  {
    type: "conditional-slot",
    label: "Conditional Slot",
    icon: Layers,
    category: "container",
    description: "조건에 따라 다른 위젯을 전환하는 컨테이너",
    defaultSize: { w: 12, h: 300 },
    minSize: { w: 4, h: 100 },
    defaultOptions: {},
  },
];

export const getWidgetType = (type: string): WidgetTypeDefinition | undefined => {
  return WIDGET_TYPES.find((w) => w.type === type);
};

export const getWidgetsByCategory = (category: WidgetTypeDefinition["category"]) => {
  return WIDGET_TYPES.filter((w) => w.category === category);
};
