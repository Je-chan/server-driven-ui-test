import {
  BarChart3,
  LineChart,
  PieChart,
  Table,
  Gauge,
  Map,
  Activity,
  type LucideIcon,
} from "lucide-react";

export interface WidgetTypeDefinition {
  type: string;
  label: string;
  icon: LucideIcon;
  category: "chart" | "card" | "table" | "map" | "status";
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
];

export const getWidgetType = (type: string): WidgetTypeDefinition | undefined => {
  return WIDGET_TYPES.find((w) => w.type === type);
};

export const getWidgetsByCategory = (category: WidgetTypeDefinition["category"]) => {
  return WIDGET_TYPES.filter((w) => w.category === category);
};
