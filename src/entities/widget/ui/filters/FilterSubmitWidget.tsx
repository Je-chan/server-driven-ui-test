/**
 * FilterSubmitWidget — 필터 적용(조회) 버튼.
 *
 * manual 필터 모드에서 사용되는 "조회" 버튼 위젯.
 * 이 위젯이 대시보드에 존재하면 useFilterValues가 자동으로 manual 모드로 전환된다.
 *
 * 동작 원리:
 * - 사용자가 필터를 변경하면 pendingValues만 갱신 (UI 반영)
 * - 이 버튼을 클릭하면 applyFilters() 호출 → pendingValues를 URL에 기록
 * - URL 변경 → appliedValues 갱신 → 데이터 위젯 리페치
 * - hasPendingChanges가 false이면 버튼 비활성화 (변경사항 없음)
 *
 * 스타일 변형:
 * - "primary": 배경색이 채워진 기본 버튼
 * - "outline": 테두리만 있는 아웃라인 버튼
 *
 * 스키마 예시:
 * { type: "filter-submit", options: { label: "조회", variant: "primary" } }
 */
"use client";

import { Search } from "lucide-react";
import { useLocale } from "next-intl";
import { resolveLabel } from "@/src/shared/lib";
import type { Widget } from "@/src/entities/dashboard";

interface FilterSubmitWidgetProps {
  widget: Widget;
  applyFilters: () => void;
  hasPendingChanges: boolean;
}

export function FilterSubmitWidget({ widget, applyFilters, hasPendingChanges }: FilterSubmitWidgetProps) {
  const locale = useLocale();

  const opts = widget.options as {
    label?: string;
    variant?: "primary" | "outline";
  } | undefined;

  const rawLabel = opts?.label ?? "조회";
  const variant = opts?.variant ?? "primary";

  const baseClasses =
    "flex h-full w-full items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  const variantClasses =
    variant === "outline"
      ? "border border-primary text-primary hover:bg-primary/10 disabled:hover:bg-transparent"
      : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:hover:bg-primary";

  return (
    <div className="flex h-full items-center justify-center p-2">
      <button
        onClick={applyFilters}
        disabled={!hasPendingChanges}
        className={`${baseClasses} ${variantClasses}`}
      >
        <Search className="h-4 w-4" />
        {resolveLabel(rawLabel, locale)}
      </button>
    </div>
  );
}
