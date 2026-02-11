/**
 * KST 로컬 날짜 포맷 및 API용 날짜 파싱 유틸리티
 */

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** 로컬 날짜를 YYYY-MM-DD 형식으로 포맷 (toISOString 대신 사용) */
export function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 날짜 문자열을 KST 자정(시작) Date로 파싱 */
export function parseDateStart(s: string): Date {
  if (s.includes("T")) return new Date(s);
  return new Date(s + "T00:00:00+09:00");
}

/** 날짜 문자열을 KST 하루 끝 Date로 파싱 */
export function parseDateEnd(s: string): Date {
  if (s.includes("T")) return new Date(s);
  return new Date(s + "T23:59:59.999+09:00");
}
