/**
 * 시간 버킷 집계 유틸리티
 * interval 파라미터에 따라 시계열 데이터를 버킷별로 집계
 */

/** interval 문자열을 밀리초로 변환 */
function intervalToMs(interval: string): number {
  const match = interval.match(/^(\d+)(m|h|d)$/);
  if (!match) return 5 * 60 * 1000; // 기본 5분
  const [, num, unit] = match;
  const n = parseInt(num);
  switch (unit) {
    case "m": return n * 60 * 1000;
    case "h": return n * 60 * 60 * 1000;
    case "d": return n * 24 * 60 * 60 * 1000;
    default: return 5 * 60 * 1000;
  }
}

/** 타임스탬프를 interval 크기의 버킷 키로 변환 */
function toBucketKey(timestamp: Date, intervalMs: number): number {
  return Math.floor(timestamp.getTime() / intervalMs) * intervalMs;
}

interface AggregateOptions {
  interval: string;
  timeField: string;
  valueFields: string[];
  aggregation?: "avg" | "sum";
}

/** 시계열 데이터를 시간 버킷별로 집계 */
export function aggregateTimeBuckets(
  data: Record<string, unknown>[],
  options: AggregateOptions
): Record<string, unknown>[] {
  const { interval, timeField, valueFields, aggregation = "avg" } = options;
  const intervalMs = intervalToMs(interval);

  // 버킷별로 그룹핑
  const buckets = new Map<number, { values: Map<string, number[]>; count: number }>();

  for (const row of data) {
    const ts = row[timeField];
    if (!ts) continue;
    const date = ts instanceof Date ? ts : new Date(ts as string);
    const bucketKey = toBucketKey(date, intervalMs);

    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, { values: new Map(), count: 0 });
    }

    const bucket = buckets.get(bucketKey)!;
    bucket.count++;

    for (const field of valueFields) {
      const val = row[field];
      if (typeof val === "number") {
        if (!bucket.values.has(field)) bucket.values.set(field, []);
        bucket.values.get(field)!.push(val);
      }
    }
  }

  // 정렬된 버킷 키로 집계 결과 생성
  const sortedKeys = Array.from(buckets.keys()).sort((a, b) => a - b);
  const result: Record<string, unknown>[] = [];

  for (const key of sortedKeys) {
    const bucket = buckets.get(key)!;
    const entry: Record<string, unknown> = {
      [timeField]: new Date(key).toISOString(),
    };

    for (const field of valueFields) {
      const vals = bucket.values.get(field);
      if (vals && vals.length > 0) {
        if (aggregation === "sum") {
          entry[field] = vals.reduce((a, b) => a + b, 0);
        } else {
          entry[field] = vals.reduce((a, b) => a + b, 0) / vals.length;
        }
      }
    }

    // 비수치 필드는 첫 번째 레코드에서 복사 (siteId, assetId 등)
    result.push(entry);
  }

  return result;
}

/** 날짜 범위에 따라 적절한 interval 자동 결정 */
export function autoInterval(start: Date, end: Date): string {
  const diffMs = end.getTime() - start.getTime();
  const diffDays = diffMs / (24 * 60 * 60 * 1000);

  if (diffDays <= 1) return "5m";
  if (diffDays <= 7) return "15m";
  if (diffDays <= 30) return "1h";
  return "1d";
}
