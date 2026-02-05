# Server Driven UI Dashboard

태양광 발전소 모니터링을 위한 Server Driven UI 대시보드 플랫폼입니다.

관리자가 드래그앤드롭으로 대시보드를 구성하면, JSON 스키마로 저장되어 사용자에게 동적으로 렌더링됩니다.

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Architecture**: Feature-Sliced Design (FSD)
- **Database**: SQLite + Prisma ORM
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Grid Layout**: react-grid-layout
- **Validation**: Zod

## 프로젝트 구조 (FSD)

```
src/
├── app/              # Next.js App Router (pages, layouts)
├── views/            # 페이지 컴포넌트
│   ├── dashboard-list/
│   ├── dashboard-builder/
│   └── dashboard-viewer/
├── widgets/          # 복합 UI 블록
│   ├── builder-canvas/
│   ├── viewer-canvas/
│   ├── widget-palette/
│   └── property-panel/
├── features/         # 비즈니스 기능
│   └── dashboard-builder/
├── entities/         # 비즈니스 엔티티
│   ├── dashboard/
│   ├── widget/
│   ├── data-source/
│   └── user/
└── shared/           # 공통 유틸리티
    ├── lib/
    └── ui/
```

## 시작하기

### 설치

```bash
pnpm install
```

### 개발 서버 실행

```bash
pnpm dev
```

`http://localhost:3000`에서 확인할 수 있습니다.

> DB 마이그레이션과 시드 데이터가 자동으로 실행됩니다.

### 빌드

```bash
pnpm build
```

## 주요 기능

### 1. 대시보드 빌더 (관리자)

- 드래그앤드롭으로 위젯 배치
- 해상도별 레이아웃 미리보기 (1920x1080, 2560x1440 등)
- 위젯 속성 편집 (스타일, 데이터 바인딩)
- Undo/Redo 지원
- JSON 스키마로 저장

### 2. 대시보드 뷰어 (사용자)

- 저장된 스키마 기반 동적 렌더링
- 실시간 데이터 연동
- 해상도 선택 가능

### 3. 위젯 타입

| 타입 | 설명 |
|------|------|
| `kpi-card` | KPI 지표 카드 |
| `line-chart` | 라인 차트 |
| `bar-chart` | 바 차트 |
| `table` | 데이터 테이블 |
| `gauge` | 게이지 차트 |
| `pie-chart` | 파이 차트 |

## API 엔드포인트

### 대시보드

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/dashboards/:id` | 대시보드 조회 |
| PUT | `/api/dashboards/:id` | 대시보드 수정 |
| DELETE | `/api/dashboards/:id` | 대시보드 삭제 |

### 데이터 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/data/inverter` | 인버터 데이터 |
| GET | `/api/data/weather` | 기상 데이터 |
| GET | `/api/data/kpi` | KPI 지표 |
| GET | `/api/data/sites` | 발전소 목록 |

### 쿼리 파라미터

```
# 인버터 데이터
/api/data/inverter?aggregation=latest    # 최신 데이터
/api/data/inverter?siteId=xxx            # 특정 사이트
/api/data/inverter?startTime=...&endTime=...  # 시간 범위

# 기상 데이터
/api/data/weather?aggregation=latest
/api/data/weather?siteId=xxx

# KPI 데이터
/api/data/kpi?siteId=xxx
/api/data/kpi?startDate=...&endDate=...
```

## 데이터 구조

### Dashboard JSON Schema

```typescript
{
  version: string;
  settings: {
    refreshInterval: number;
    theme: "light" | "dark" | "system";
    gridColumns: number;
    rowHeight: number;
  };
  dataSources: DataSource[];
  filters: Filter[];
  widgets: Widget[];
  linkages: Linkage[];
}
```

### Widget

```typescript
{
  id: string;
  type: string;
  title: string;
  layout: { x, y, w, h, minW?, minH? };
  dataBinding?: {
    dataSourceId: string;
    mapping: {
      timeField?: string;
      dimensions?: string[];
      measurements: MeasurementMapping[];
    };
  };
  style?: {
    backgroundColor?: string;
    borderRadius?: number;
    shadow?: "none" | "sm" | "md" | "lg";
  };
  options?: Record<string, unknown>;
}
```

## Mock 데이터

시드 데이터로 다음이 생성됩니다:

- **발전소 3개**: 서울(500kW), 부산(750kW), 제주(1000kW)
- **인버터 23개**: 발전소별 5~10개
- **시계열 데이터**: 24시간 인버터/기상 데이터
- **KPI 데이터**: 30일 일별 지표

## 스크립트

```bash
pnpm dev          # 개발 서버
pnpm build        # 프로덕션 빌드
pnpm start        # 프로덕션 서버
pnpm db:setup     # DB 마이그레이션 + 시드
pnpm db:studio    # Prisma Studio
pnpm lint         # ESLint
```
