"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, Maximize2, X } from "lucide-react";

interface JsonBlockProps {
  data: unknown;
  title?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  maxHeight?: number;
}

// JSON 구문 강조 (regex 기반)
function highlightJson(json: string): string {
  return json.replace(
    /("(?:\\.|[^"\\])*")\s*:/g,
    '<span class="text-blue-400">$1</span>:'
  ).replace(
    /:\s*("(?:\\.|[^"\\])*")/g,
    ': <span class="text-emerald-400">$1</span>'
  ).replace(
    /:\s*(\d+\.?\d*)/g,
    ': <span class="text-amber-400">$1</span>'
  ).replace(
    /:\s*(true|false)/g,
    ': <span class="text-purple-400">$1</span>'
  ).replace(
    /:\s*(null)/g,
    ': <span class="text-red-400">$1</span>'
  );
}

function JsonExpandModal({
  data,
  title,
  onClose,
}: {
  data: unknown;
  title?: string;
  onClose: () => void;
}) {
  const jsonString = JSON.stringify(data, null, 2);
  const highlighted = highlightJson(jsonString);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-8"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-3">
          <span className="text-sm font-medium text-slate-300">
            {title ?? "JSON"}
          </span>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <pre
          className="flex-1 overflow-auto p-5 text-sm leading-relaxed text-slate-100"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>
    </div>,
    document.body,
  );
}

export function JsonBlock({
  data,
  title,
  collapsible = false,
  defaultCollapsed = false,
  maxHeight,
}: JsonBlockProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [expanded, setExpanded] = useState(false);
  const jsonString = JSON.stringify(data, null, 2);
  const highlighted = highlightJson(jsonString);

  const handleClose = useCallback(() => setExpanded(false), []);

  return (
    <>
      <div className="rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
        {title && (
          <div className="flex items-center border-b border-slate-700">
            <button
              onClick={() => collapsible && setCollapsed(!collapsed)}
              className={`flex flex-1 items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 ${
                collapsible ? "cursor-pointer hover:bg-slate-800" : "cursor-default"
              }`}
            >
              {collapsible && (
                collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
              )}
              {title}
            </button>
            <button
              onClick={() => setExpanded(true)}
              className="px-3 py-2 text-slate-500 transition-colors hover:text-slate-200"
              title="확대"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {!title && (
          <div className="flex justify-end border-b border-slate-700">
            <button
              onClick={() => setExpanded(true)}
              className="px-3 py-1.5 text-slate-500 transition-colors hover:text-slate-200"
              title="확대"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {!collapsed && (
          <pre
            className="overflow-auto p-4 text-xs leading-relaxed text-slate-100"
            style={{ maxHeight: maxHeight ? `${maxHeight}px` : undefined }}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        )}
      </div>

      {expanded && (
        <JsonExpandModal data={data} title={title} onClose={handleClose} />
      )}
    </>
  );
}
