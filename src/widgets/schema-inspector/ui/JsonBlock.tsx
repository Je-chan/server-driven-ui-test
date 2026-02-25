"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, ChevronUp, Maximize2, Search, X } from "lucide-react";

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

// 검색어 하이라이트를 JSON 구문 강조 위에 적용
function highlightSearch(html: string, query: string): { html: string; count: number } {
  if (!query) return { html, count: 0 };

  // HTML 태그를 제외한 텍스트에서만 검색어 하이라이트
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?<=>)([^<]*?)(?=<)|^([^<]+)`, "g");
  let count = 0;

  const result = html.replace(regex, (segment) => {
    const searchRegex = new RegExp(`(${escaped})`, "gi");
    return segment.replace(searchRegex, (match) => {
      count++;
      return `<mark class="bg-yellow-400/80 text-slate-900 rounded-sm px-0.5">${match}</mark>`;
    });
  });

  return { html: result, count };
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
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const jsonString = JSON.stringify(data, null, 2);
  const baseHighlighted = useMemo(() => highlightJson(jsonString), [jsonString]);

  const { html: finalHtml, count: matchCount } = useMemo(
    () => highlightSearch(baseHighlighted, query),
    [baseHighlighted, query],
  );

  // 활성 매치 하이라이트 — activeIndex 번째 <mark>에 다른 스타일 적용
  const displayHtml = useMemo(() => {
    if (matchCount === 0 || !query) return finalHtml;
    let idx = 0;
    return finalHtml.replace(
      /<mark class="bg-yellow-400\/80 text-slate-900 rounded-sm px-0.5">/g,
      () => {
        const cls = idx === activeIndex
          ? "bg-orange-400 text-slate-900 rounded-sm px-0.5 ring-2 ring-orange-300"
          : "bg-yellow-400/40 text-slate-100 rounded-sm px-0.5";
        idx++;
        return `<mark class="${cls}">`;
      },
    );
  }, [finalHtml, activeIndex, matchCount, query]);

  // 활성 매치로 스크롤
  useEffect(() => {
    if (!preRef.current || matchCount === 0) return;
    const marks = preRef.current.querySelectorAll("mark");
    marks[activeIndex]?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeIndex, matchCount, displayHtml]);

  // query 변경 시 activeIndex 리셋
  useEffect(() => setActiveIndex(0), [query]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (query) {
          setQuery("");
          inputRef.current?.focus();
        } else {
          onClose();
        }
        return;
      }
      // Ctrl/Cmd+F → 검색 인풋 포커스
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      // Enter / Shift+Enter → 다음/이전 매치
      if (e.key === "Enter" && document.activeElement === inputRef.current && matchCount > 0) {
        e.preventDefault();
        if (e.shiftKey) {
          setActiveIndex((prev) => (prev - 1 + matchCount) % matchCount);
        } else {
          setActiveIndex((prev) => (prev + 1) % matchCount);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, query, matchCount]);

  // 모달 열리면 검색 인풋 포커스
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const goNext = () => {
    if (matchCount > 0) setActiveIndex((prev) => (prev + 1) % matchCount);
  };
  const goPrev = () => {
    if (matchCount > 0) setActiveIndex((prev) => (prev - 1 + matchCount) % matchCount);
  };

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

        {/* Search Bar */}
        <div className="flex items-center gap-2 border-b border-slate-700 px-5 py-2">
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search... (Enter: next, Shift+Enter: prev)"
            className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
          />
          {query && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">
                {matchCount > 0 ? `${activeIndex + 1}/${matchCount}` : "0"}
              </span>
              <button onClick={goPrev} className="rounded p-0.5 text-slate-500 hover:text-slate-300" disabled={matchCount === 0}>
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={goNext} className="rounded p-0.5 text-slate-500 hover:text-slate-300" disabled={matchCount === 0}>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setQuery("")} className="rounded p-0.5 text-slate-500 hover:text-slate-300">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        <pre
          ref={preRef}
          className="flex-1 overflow-auto p-5 text-sm leading-relaxed text-slate-100"
          dangerouslySetInnerHTML={{ __html: displayHtml }}
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
