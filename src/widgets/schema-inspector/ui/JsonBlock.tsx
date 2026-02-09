"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

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

export function JsonBlock({
  data,
  title,
  collapsible = false,
  defaultCollapsed = false,
  maxHeight,
}: JsonBlockProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const jsonString = JSON.stringify(data, null, 2);
  const highlighted = highlightJson(jsonString);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
      {title && (
        <button
          onClick={() => collapsible && setCollapsed(!collapsed)}
          className={`flex w-full items-center gap-2 border-b border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 ${
            collapsible ? "cursor-pointer hover:bg-slate-800" : "cursor-default"
          }`}
        >
          {collapsible && (
            collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
          )}
          {title}
        </button>
      )}
      {!collapsed && (
        <pre
          className="overflow-auto p-4 text-xs leading-relaxed text-slate-100"
          style={{ maxHeight: maxHeight ? `${maxHeight}px` : undefined }}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      )}
    </div>
  );
}
