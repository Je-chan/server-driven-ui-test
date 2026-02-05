import { create } from "zustand";
import type { DashboardJson, Widget, WidgetLayout } from "@/src/entities/dashboard";

interface BuilderState {
  // 대시보드 스키마
  schema: DashboardJson;
  originalSchema: DashboardJson | null;
  isDirty: boolean;

  // UI 상태
  selectedWidgetId: string | null;
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

  // Selection
  selectWidget: (widgetId: string | null) => void;

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

const generateId = () => `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useBuilderStore = create<BuilderState>((set, get) => ({
  schema: {
    version: "1.0.0",
    settings: {
      refreshInterval: 0,
      theme: "light",
      gridColumns: 24,
      rowHeight: 40,
    },
    dataSources: [],
    filters: [],
    widgets: [],
    linkages: [],
  },
  originalSchema: null,
  isDirty: false,
  selectedWidgetId: null,
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
      id: generateId(),
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
            x: newLayout.x,
            y: newLayout.y,
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

  selectWidget: (widgetId) => {
    set({ selectedWidgetId: widgetId });
  },

  togglePreview: () => {
    set((state) => ({ isPreviewMode: !state.isPreviewMode }));
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      set({
        schema: state.history[newIndex],
        historyIndex: newIndex,
        isDirty: true,
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      set({
        schema: state.history[newIndex],
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
