import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * /api/options/assets API 라우트 단위 테스트.
 *
 * Prisma를 모킹하여 DB 없이 API 로직만 검증한다.
 */

// Prisma 모킹
const mockFindMany = vi.fn();
vi.mock("@/src/shared/lib/prisma", () => ({
  prisma: {
    asset: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

// NextResponse 모킹
vi.mock("next/server", () => ({
  NextRequest: class {
    nextUrl: { searchParams: URLSearchParams };
    constructor(url: string) {
      this.nextUrl = { searchParams: new URL(url).searchParams };
    }
  },
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      _body: body,
      status: init?.status ?? 200,
      json() { return Promise.resolve(body); },
    }),
  },
}));

import { GET } from "../route";

function makeRequest(queryString = "") {
  const url = `http://localhost/api/options/assets${queryString ? `?${queryString}` : ""}`;
  // NextRequest-like object
  return {
    nextUrl: {
      searchParams: new URLSearchParams(queryString),
    },
  } as Parameters<typeof GET>[0];
}

describe("GET /api/options/assets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("siteId 없이 호출하면 전체 asset 반환", async () => {
    const mockAssets = [
      { id: "a1", name: "인버터1", type: "inverter", ratedCapacity: 100, status: "active", siteId: "s1" },
      { id: "a2", name: "인버터2", type: "inverter", ratedCapacity: 200, status: "active", siteId: "s2" },
    ];
    mockFindMany.mockResolvedValue(mockAssets);

    const response = await GET(makeRequest());
    const json = await response.json() as { success: boolean; data: typeof mockAssets };

    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);

    // where 조건이 undefined (전체 조회)
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    );
  });

  it("siteId 파라미터로 필터링된 asset 반환", async () => {
    const mockAssets = [
      { id: "a1", name: "인버터1", type: "inverter", ratedCapacity: 100, status: "active", siteId: "s1" },
    ];
    mockFindMany.mockResolvedValue(mockAssets);

    const response = await GET(makeRequest("siteId=s1"));
    const json = await response.json() as { success: boolean; data: typeof mockAssets };

    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);

    // where 조건에 siteId가 포함됨
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { siteId: "s1" } })
    );
  });

  it("빈 결과도 정상 반환", async () => {
    mockFindMany.mockResolvedValue([]);

    const response = await GET(makeRequest("siteId=nonexistent"));
    const json = await response.json() as { success: boolean; data: unknown[] };

    expect(json.success).toBe(true);
    expect(json.data).toEqual([]);
  });

  it("DB 에러 시 500 반환", async () => {
    mockFindMany.mockRejectedValue(new Error("DB connection failed"));

    const response = await GET(makeRequest());

    expect(response.status).toBe(500);
    const json = await response.json() as { success: boolean; error: string };
    expect(json.success).toBe(false);
    expect(json.error).toBe("Failed to fetch assets");
  });

  it("select 필드가 올바르게 지정됨", async () => {
    mockFindMany.mockResolvedValue([]);

    await GET(makeRequest());

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          name: true,
          type: true,
          ratedCapacity: true,
          status: true,
          siteId: true,
        },
      })
    );
  });

  it("이름순 정렬", async () => {
    mockFindMany.mockResolvedValue([]);

    await GET(makeRequest());

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { name: "asc" } })
    );
  });
});
