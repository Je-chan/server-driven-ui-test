import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

/**
 * SelectFilterWidget 단위 테스트.
 *
 * 핵심 검증:
 * 1. 정적 옵션 렌더링
 * 2. API 옵션 로드 시 자동 선택 (Gap 4)
 * 3. fixedValue로 잠긴 필터
 * 4. dependsOn optionsMap 기반 동적 옵션
 */

// ── 외부 의존성 모킹 ──

// next-intl 모킹
vi.mock("next-intl", () => ({
  useLocale: () => "ko",
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      select: "선택하세요",
      setFilterKey: "필터 키를 설정하세요",
    };
    return map[key] ?? key;
  },
}));

// resolveLabel 모킹: 그냥 문자열 반환
vi.mock("@/src/shared/lib", () => ({
  resolveLabel: (label: unknown) => (typeof label === "string" ? label : JSON.stringify(label)),
}));

// useFilterOptions 모킹
const mockUseFilterOptions = vi.fn();
vi.mock("@/src/shared/api", () => ({
  useFilterOptions: (...args: unknown[]) => mockUseFilterOptions(...args),
}));

import { SelectFilterWidget } from "../SelectFilterWidget";
import type { Widget } from "@/src/entities/dashboard";

function makeWidget(overrides: Partial<Widget> = {}): Widget {
  return {
    id: "w_filter_1",
    type: "filter-select",
    title: "테스트 필터",
    layout: { x: 0, y: 0, w: 4, h: 2 },
    options: { filterKey: "testKey" },
    ...overrides,
  };
}

describe("SelectFilterWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본: API 옵션 비활성
    mockUseFilterOptions.mockReturnValue({ data: undefined, isLoading: false });
  });

  it("정적 옵션이 렌더링됨", () => {
    const widget = makeWidget({
      options: {
        filterKey: "selectedSite",
        options: [
          { value: "s1", label: "사이트1" },
          { value: "s2", label: "사이트2" },
        ],
      },
    });

    render(
      <SelectFilterWidget
        widget={widget}
        filterValues={{ selectedSite: "s1" }}
        onFilterChange={vi.fn()}
      />
    );

    const select = screen.getByRole("combobox");
    expect(select).toBeDefined();
    // 옵션 수: placeholder(1) + 정적(2)
    const options = select.querySelectorAll("option");
    expect(options.length).toBe(3);
  });

  it("선택 변경 시 onFilterChange 호출", () => {
    const onFilterChange = vi.fn();
    const widget = makeWidget({
      options: {
        filterKey: "selectedSite",
        options: [
          { value: "s1", label: "사이트1" },
          { value: "s2", label: "사이트2" },
        ],
      },
    });

    render(
      <SelectFilterWidget
        widget={widget}
        filterValues={{ selectedSite: "s1" }}
        onFilterChange={onFilterChange}
      />
    );

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "s2" } });
    expect(onFilterChange).toHaveBeenCalledWith("selectedSite", "s2");
  });

  it("fixedValue가 있으면 disabled", () => {
    const widget = makeWidget({
      options: {
        filterKey: "selectedSite",
        fixedValue: "s1",
        options: [{ value: "s1", label: "사이트1" }],
      },
    });

    render(
      <SelectFilterWidget
        widget={widget}
        filterValues={{ selectedSite: "s1" }}
        onFilterChange={vi.fn()}
      />
    );

    expect(screen.getByRole("combobox")).toHaveProperty("disabled", true);
  });

  it("filterKey가 없으면 설정 안내 표시", () => {
    const widget = makeWidget({
      options: {}, // filterKey 없음
    });

    render(
      <SelectFilterWidget
        widget={widget}
        filterValues={{}}
        onFilterChange={vi.fn()}
      />
    );

    expect(screen.getByText("필터 키를 설정하세요")).toBeDefined();
  });

  // === Gap 4 핵심 테스트: API 옵션 변경 시 자동 선택 ===
  it("API 옵션 로드 후 현재 값이 유효하지 않으면 첫 항목 자동 선택", () => {
    const onFilterChange = vi.fn();
    const apiOptions = [
      { value: "a1", label: "인버터1" },
      { value: "a2", label: "인버터2" },
    ];

    mockUseFilterOptions.mockReturnValue({ data: apiOptions, isLoading: false });

    const widget = makeWidget({
      options: {
        filterKey: "selectedAsset",
        dataSourceId: "ds_assets",
        valueField: "id",
        labelField: "name",
      },
    });

    render(
      <SelectFilterWidget
        widget={widget}
        filterValues={{ selectedAsset: "nonexistent_value" }} // 유효하지 않은 값
        onFilterChange={onFilterChange}
      />
    );

    // 현재 값이 apiOptions에 없으므로 첫 항목으로 자동 선택
    expect(onFilterChange).toHaveBeenCalledWith("selectedAsset", "a1");
  });

  it("API 옵션 로드 후 현재 값이 유효하면 자동 선택 안 함", () => {
    const onFilterChange = vi.fn();
    const apiOptions = [
      { value: "a1", label: "인버터1" },
      { value: "a2", label: "인버터2" },
    ];

    mockUseFilterOptions.mockReturnValue({ data: apiOptions, isLoading: false });

    const widget = makeWidget({
      options: {
        filterKey: "selectedAsset",
        dataSourceId: "ds_assets",
      },
    });

    render(
      <SelectFilterWidget
        widget={widget}
        filterValues={{ selectedAsset: "a2" }} // 유효한 값
        onFilterChange={onFilterChange}
      />
    );

    // 현재 값이 유효하므로 onFilterChange 호출 안 됨
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it("API 옵션이 빈 배열이면 자동 선택 안 함", () => {
    const onFilterChange = vi.fn();
    mockUseFilterOptions.mockReturnValue({ data: [], isLoading: false });

    const widget = makeWidget({
      options: {
        filterKey: "selectedAsset",
        dataSourceId: "ds_assets",
      },
    });

    render(
      <SelectFilterWidget
        widget={widget}
        filterValues={{ selectedAsset: "old" }}
        onFilterChange={onFilterChange}
      />
    );

    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it("fixedValue가 있으면 API 옵션이 있어도 자동 선택 안 함", () => {
    const onFilterChange = vi.fn();
    const apiOptions = [{ value: "a1", label: "인버터1" }];
    mockUseFilterOptions.mockReturnValue({ data: apiOptions, isLoading: false });

    const widget = makeWidget({
      options: {
        filterKey: "selectedAsset",
        dataSourceId: "ds_assets",
        fixedValue: "fixed_asset",
      },
    });

    render(
      <SelectFilterWidget
        widget={widget}
        filterValues={{ selectedAsset: "fixed_asset" }}
        onFilterChange={onFilterChange}
      />
    );

    expect(onFilterChange).not.toHaveBeenCalled();
  });

  it("dataSourceId가 없으면(정적 필터) 자동 선택 로직 안 탐", () => {
    const onFilterChange = vi.fn();
    mockUseFilterOptions.mockReturnValue({ data: undefined, isLoading: false });

    const widget = makeWidget({
      options: {
        filterKey: "interval",
        options: [
          { value: "5m", label: "5분" },
          { value: "1h", label: "1시간" },
        ],
      },
    });

    render(
      <SelectFilterWidget
        widget={widget}
        filterValues={{ interval: "nonexistent" }}
        onFilterChange={onFilterChange}
      />
    );

    // dataSourceId가 없으므로 자동 선택 안 함
    expect(onFilterChange).not.toHaveBeenCalled();
  });

  // === dependsOn 기반 동적 옵션 ===
  it("dependsOn optionsMap에 부모 값이 있으면 자식 옵션으로 렌더링", () => {
    const widget = makeWidget({
      options: {
        filterKey: "selectedInverter",
        dependsOn: {
          filterKey: "selectedSite",
          optionsMap: {
            s1: [
              { value: "inv1", label: "인버터A" },
              { value: "inv2", label: "인버터B" },
            ],
          },
        },
      },
    });

    render(
      <SelectFilterWidget
        widget={widget}
        filterValues={{ selectedSite: "s1", selectedInverter: "inv1" }}
        onFilterChange={vi.fn()}
      />
    );

    const select = screen.getByRole("combobox");
    const options = select.querySelectorAll("option");
    // placeholder(1) + optionsMap에서 온 옵션(2)
    expect(options.length).toBe(3);
    expect(options[1].textContent).toBe("인버터A");
  });

  // === useFilterOptions 호출 파라미터 검증 ===
  it("dataSourceId + dependsOn으로 useFilterOptions에 올바른 파라미터 전달", () => {
    const widget = makeWidget({
      options: {
        filterKey: "selectedAsset",
        dataSourceId: "ds_assets",
        valueField: "id",
        labelField: "name",
        dependsOn: { filterKey: "selectedSite" },
        dependsOnParamKey: "siteId",
      },
    });

    render(
      <SelectFilterWidget
        widget={widget}
        filterValues={{ selectedSite: "s1", selectedAsset: "" }}
        onFilterChange={vi.fn()}
      />
    );

    expect(mockUseFilterOptions).toHaveBeenCalledWith({
      dataSourceId: "ds_assets",
      valueField: "id",
      labelField: "name",
      dependsOnParam: { key: "siteId", value: "s1" },
      enabled: true,
    });
  });

  it("부모 필터 값이 없으면 dependsOnParam이 undefined", () => {
    const widget = makeWidget({
      options: {
        filterKey: "selectedAsset",
        dataSourceId: "ds_assets",
        dependsOn: { filterKey: "selectedSite" },
        dependsOnParamKey: "siteId",
      },
    });

    render(
      <SelectFilterWidget
        widget={widget}
        filterValues={{ selectedAsset: "" }} // selectedSite 없음
        onFilterChange={vi.fn()}
      />
    );

    expect(mockUseFilterOptions).toHaveBeenCalledWith(
      expect.objectContaining({ dependsOnParam: undefined })
    );
  });

  it("로딩 중일 때 로딩 인디케이터 표시", () => {
    mockUseFilterOptions.mockReturnValue({ data: undefined, isLoading: true });

    const widget = makeWidget({
      options: {
        filterKey: "selectedAsset",
        dataSourceId: "ds_assets",
      },
    });

    const { container } = render(
      <SelectFilterWidget
        widget={widget}
        filterValues={{ selectedAsset: "" }}
        onFilterChange={vi.fn()}
      />
    );

    // Loader2 아이콘의 animate-spin 클래스 확인
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).not.toBeNull();
  });
});
