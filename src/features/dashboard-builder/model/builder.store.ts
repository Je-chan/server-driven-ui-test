import { create } from "zustand";
import type { DashboardJson, DashboardSettings, Widget, ChildWidget, WidgetLayout } from "@/src/entities/dashboard";

interface BuilderState {
  // 대시보드 스키마
  schema: DashboardJson;
  originalSchema: DashboardJson | null;
  isDirty: boolean;

  // UI 상태
  selectedWidgetId: string | null;
  selectedCardId: string | null;
  isPreviewMode: boolean;

  // 히스토리 (Undo/Redo)
  history: DashboardJson[];
  historyIndex: number;

  // Actions
  initSchema: (schema: DashboardJson) => void;

  // Widget CRUD
  addWidget: (widget: Omit<Widget, "id">) => void;
  updateWidget: (widgetId: string, updates: Partial<Widget>) => void;
  removeWidget: (widgetId: string) => void;
  updateWidgetLayout: (widgetId: string, layout: Partial<WidgetLayout>) => void;
  updateAllLayouts: (layouts: Array<{ i: string } & WidgetLayout>) => void;

  // Child Widget CRUD (Card 컨테이너용)
  addChildWidget: (cardId: string, widget: Omit<ChildWidget, "id">) => void;
  updateChildWidget: (cardId: string, childId: string, updates: Partial<ChildWidget>) => void;
  removeChildWidget: (cardId: string, childId: string) => void;
  updateChildLayouts: (cardId: string, layouts: Array<{ i: string } & WidgetLayout>) => void;
  selectCard: (cardId: string | null) => void;
  findWidget: (widgetId: string) => { widget: Widget | ChildWidget; parentCardId: string | null } | null;

  // Selection
  selectWidget: (widgetId: string | null) => void;

  // Settings
  updateSettings: (updates: Partial<DashboardSettings>) => void;

  // Preview
  togglePreview: () => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Save
  getSchema: () => DashboardJson;
  resetDirty: () => void;
}

const generateWidgetId = () => `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useBuilderStore = create<BuilderState>((set, get) => ({
  schema: {
    version: "1.0.0",
    settings: {
      refreshInterval: 0,
      theme: "light",
      gridColumns: 24,
      rowHeight: 40,
      filterMode: "auto",
    },
    dataSources: [],
    filters: [],
    widgets: [],
    linkages: [],
  },
  originalSchema: null,
  isDirty: false,
  selectedWidgetId: null,
  selectedCardId: null,
  isPreviewMode: false,
  history: [],
  historyIndex: -1,

  initSchema: (schema) => {
    set({
      schema,
      originalSchema: schema,
      isDirty: false,
      selectedWidgetId: null,
      history: [schema],
      historyIndex: 0,
    });
  },

  addWidget: (widget) => {
    const state = get();
    const newWidget: Widget = {
      ...widget,
      id: generateWidgetId(),
    };

    const newSchema = {
      ...state.schema,
      widgets: [...state.schema.widgets, newWidget],
    };

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newSchema);

    set({
      schema: newSchema,
      isDirty: true,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedWidgetId: newWidget.id,
    });
  },

  updateWidget: (widgetId, updates) => {
    const state = get();
    const newWidgets = state.schema.widgets.map((w) =>
      w.id === widgetId ? { ...w, ...updates } : w
    );

    const newSchema = { ...state.schema, widgets: newWidgets };
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newSchema);

    set({
      schema: newSchema,
      isDirty: true,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  removeWidget: (widgetId) => {
    const state = get();
    const newWidgets = state.schema.widgets.filter((w) => w.id !== widgetId);

    const newSchema = { ...state.schema, widgets: newWidgets };
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newSchema);

    set({
      schema: newSchema,
      isDirty: true,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedWidgetId: state.selectedWidgetId === widgetId ? null : state.selectedWidgetId,
    });
  },

  updateWidgetLayout: (widgetId, layout) => {
    const state = get();
    const newWidgets = state.schema.widgets.map((w) =>
      w.id === widgetId ? { ...w, layout: { ...w.layout, ...layout } } : w
    );

    set({
      schema: { ...state.schema, widgets: newWidgets },
      isDirty: true,
    });
  },

  updateAllLayouts: (layouts) => {
    const state = get();
    const layoutMap = new Map(layouts.map((l) => [l.i, l]));

    const newWidgets = state.schema.widgets.map((w) => {
      const newLayout = layoutMap.get(w.id);
      if (newLayout) {
        return {
          ...w,
          layout: {
            x: newLayout.x,y: newLayout.y,
            w: newLayout.w,
            h: newLayout.h,
            minW: w.layout.minW,
            minH: w.layout.minH,
          },
        };
      }
      return w;
    });

    const newSchema = { ...state.schema, widgets: newWidgets };
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newSchema);

    set({
      schema: newSchema,
      isDirty: true,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  addChildWidget: (cardId, widget) => {
    const state = get();
    const newChild: ChildWidget = {
      ...widget,
      id: generateWidgetId(),
    };

    const newWidgets = state.schema.widgets.map((w) => {
      if (w.id !== cardId) return w;

      const updatedChildren = [...(w.children ?? []), newChild];

      // 자식 위젯들이 차지하는 최대 높이 계산 → Card 높이 자동 확장
      const maxChildBottom = updatedChildren.reduce(
        (max, c) => Math.max(max, c.layout.y + c.layout.h),
        0
      );
      const cardHeaderRows = 1;
      const requiredH = maxChildBottom + cardHeaderRows;
      const newH = Math.max(w.layout.h, requiredH);

      return {
        ...w,
        children: updatedChildren,
        layout: { ...w.layout, h: newH },
      };
    });

    const newSchema = { ...state.schema, widgets: newWidgets };
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newSchema);

    set({
      schema: newSchema,
      isDirty: true,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedWidgetId: newChild.id,
    });
  },

  updateChildWidget: (cardId, childId, updates) => {
    const state = get();
    const newWidgets = state.schema.widgets.map((w) => {
      if (w.id !== cardId) return w;
      const newChildren = (w.children ?? []).map((c) =>
        c.id === childId ? { ...c, ...updates } : c
      );
      return { ...w, children: newChildren };
    });

    const newSchema = { ...state.schema, widgets: newWidgets };
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newSchema);

    set({
      schema: newSchema,
      isDirty: true,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  removeChildWidget: (cardId, childId) => {
    const state = get();
    const newWidgets = state.schema.widgets.map((w) => {
      if (w.id !== cardId) return w;
      return { ...w, children: (w.children ?? []).filter((c) => c.id !== childId) };
    });

    const newSchema = { ...state.schema, widgets: newWidgets };
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newSchema);

    set({
      schema: newSchema,
      isDirty: true,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedWidgetId: state.selectedWidgetId === childId ? null : state.selectedWidgetId,
    });
  },

  updateChildLayouts: (cardId, layouts) => {
    const state = get();
    const layoutMap = new Map(layouts.map((l) => [l.i, l]));

    const newWidgets = state.schema.widgets.map((w) => {
      if (w.id !== cardId) return w;
      const newChildren = (w.children ?? []).map((c) => {
        const newLayout = layoutMap.get(c.id);
        if (newLayout) {
          return {
            ...c,
            layout: {
              x: newLayout.x,
              y: newLayout.y,
              w: newLayout.w,
              h: newLayout.h,
              minW: c.layout.minW,
              minH: c.layout.minH,
            },
          };
        }
        return c;
      });
      return { ...w, children: newChildren };
    });

    const newSchema = { ...state.schema, widgets: newWidgets };
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newSchema);

    set({
      schema: newSchema,
      isDirty: true,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  selectCard: (cardId) => {
    set({ selectedCardId: cardId });
  },

  findWidget: (widgetId) => {
    const state = get();
    // 최상위 위젯에서 먼저 검색
    const topLevel = state.schema.widgets.find((w) => w.id === widgetId);
    if (topLevel) return { widget: topLevel, parentCardId: null };

    // Card children에서 검색
    for (const w of state.schema.widgets) {
      if (w.type === "card" && w.children) {
        const child = w.children.find((c) => c.id === widgetId);
        if (child) return { widget: child, parentCardId: w.id };
      }
    }

    return null;
  },

  selectWidget: (widgetId) => {
    set({ selectedWidgetId: widgetId });
  },

  updateSettings: (updates) => {
    const state = get();
    const newSchema = {
      ...state.schema,
      settings: { ...state.schema.settings, ...updates },
    };

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(newSchema);

    set({
      schema: newSchema,
      isDirty: true,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  togglePreview: () => {
    set((state) => ({ isPreviewMode: !state.isPreviewMode }));
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      const newSchema = state.history[newIndex];
      set({
        schema: newSchema,
        historyIndex: newIndex,
        isDirty: true,
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      const newSchema = state.history[newIndex];
      set({
        schema: newSchema,
        historyIndex: newIndex,
        isDirty: true,
      });
    }
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  getSchema: () => get().schema,

  resetDirty: () => {
    set({ isDirty: false, originalSchema: get().schema });
  },
}));
