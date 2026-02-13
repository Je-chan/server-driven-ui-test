# Server Driven UI Dashboard

태양광 발전소 모니터링을 위한 Server Driven UI 대시보드 플랫폼입니다.

관리자가 드래그앤드롭으로 대시보드를 구성하면, JSON 스키마로 저장되어 사용자에게 동적으로 렌더링됩니다.

## 기술 스택

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Architecture**: Feature-Sliced Design (FSD)
- **Database**: SQLite + Prisma ORM
- **State Management**: Zustand
- **Server State**: TanStack Query v5
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: ECharts (echarts-for-react)
- **Grid Layout**: react-grid-layout
- **Validation**: Zod
- **Icons**: Lucide React

## 프로젝트 구조 (FSD)

```
src/
├── app/                  # Layer 1: 앱 초기화, 프로바이더
│   └── providers/
├── views/                # Layer 2: 페이지 컴포지션
│   ├── dashboard-list/
│   ├── dashboard-builder/
│   ├── dashboard-viewer/
│   ├── fullscreen-viewer/
│   └── presentation/
├── widgets/              # Layer 3: 복합 UI 블록
│   ├── builder-canvas/
│   ├── viewer-canvas/
│   ├── presentation-canvas/
│   ├── widget-palette/
│   ├── property-panel/
│   └── schema-inspector/
├── features/             # Layer 4: 비즈니스 기능
│   ├── dashboard-builder/
│   └── dashboard-filter/
├── entities/             # Layer 5: 비즈니스 엔티티
│   ├── dashboard/
│   ├── widget/
│   ├── data-source/
│   └── user/
└── shared/               # Layer 6: 공통 유틸리티
    ├── api/
    ├── config/
    ├── lib/
    ├── types/
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

- 드래그앤드롭으로 위젯 배치 및 리사이즈
- 해상도별 레이아웃 미리보기 (Full HD, QHD, HD, 4K)
- 그리드 설정 커스터마이징 (Row Height, Grid Columns)
- 위젯 속성 편집 (스타일, 데이터 바인딩, 위젯별 옵션)
- Undo/Redo 지원 (Ctrl+Z / Ctrl+Shift+Z)
- JSON 스키마로 저장 (Ctrl+S)

### 2. 대시보드 뷰어 (사용자)

- 저장된 스키마 기반 동적 렌더링
- 실시간 데이터 연동 (TanStack Query 캐시)
- 해상도 선택 가능
- 필터 위젯을 통한 대시보드 데이터 필터링 (auto/manual 모드)

### 3. 전체 화면 / 프레젠테이션 모드

- **전체 화면 뷰어**: 1920x1080 기준 전체 화면 대시보드
- **프레젠테이션 모드**: 대시보드 슬라이드쇼

### 4. 위젯 타입

**콘텐츠 위젯**

| 타입 | 설명 |
|------|------|
| `kpi-card` | KPI 지표 카드 |
| `line-chart` | 라인 차트 (시계열) |
| `bar-chart` | 바 차트 (카테고리 비교) |
| `table` | 데이터 테이블 |
| `pie-chart` | 파이 차트 |
| `gauge` | 게이지 차트 |
| `map` | 지도 위젯 |

**필터 위젯**

| 타입 | 설명 |
|------|------|
| `filter-select` | 드롭다운 선택 |
| `filter-multiselect` | 다중 선택 (칩) |
| `filter-treeselect` | 계층 트리 선택 |
| `filter-input` | 텍스트 입력 |
| `filter-tab` | 탭/버튼 선택 (pill, tab, button 변형) |
| `filter-datepicker` | 날짜 범위 선택 (프리셋 + 직접입력) |

## 라우트

| 경로 | 설명 |
|------|------|
| `/` | 대시보드 목록 |
| `/builder/[dashboardId]` | 대시보드 빌더 |
| `/builder/new` | 새 대시보드 생성 |
| `/dashboard/[dashboardId]` | 대시보드 뷰어 |
| `/view/[dashboardId]` | 대시보드 뷰어 (대안) |
| `/presentation/[dashboardId]` | 프레젠테이션 모드 |

## API 엔드포인트

### 대시보드

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/dashboards` | 대시보드 목록 |
| POST | `/api/dashboards` | 대시보드 생성 |
| GET | `/api/dashboards/:id` | 대시보드 조회 |
| PUT | `/api/dashboards/:id` | 대시보드 수정 |
| DELETE | `/api/dashboards/:id` | 대시보드 삭제 |

### 데이터 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/data/inverter` | 인버터 시계열 데이터 |
| GET | `/api/data/weather` | 기상 데이터 |
| GET | `/api/data/kpi` | KPI 지표 |
| GET | `/api/data/sites` | 발전소 목록 |
| GET | `/api/data/battery` | 배터리/ESS 데이터 |
| GET | `/api/data/revenue` | 수익 데이터 |
| GET | `/api/data/alarm` | 알람 데이터 |
| GET | `/api/data/maintenance` | 유지보수 이력 |
| GET | `/api/data/meter` | 미터 데이터 |
| GET | `/api/data/grid` | 계통 데이터 |
| GET | `/api/data/module` | 모듈 데이터 |
| GET | `/api/data/price` | 전력 가격 데이터 |

### 쿼리 파라미터

```
# 인버터 데이터
/api/data/inverter?aggregation=latest         # 최신 데이터
/api/data/inverter?siteId=xxx                 # 특정 사이트
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
    gridColumns: number;       // default: 24
    rowHeight: number;         // default: 10
    filterMode: "auto" | "manual";
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
    padding?: number;
    shadow?: "none" | "sm" | "md" | "lg";
  };
  options?: Record<string, unknown>;
}
```

## 시드 데이터

시드 데이터로 다음이 생성됩니다:

- **발전소 7개**: 서울(500kW), 부산(750kW), 제주(1000kW), 세종(2000kW), 전남(3000kW), 경북(1500kW), 충남(500kW)
- **인버터 75개**: 발전소별 5~20개
- **시계열 데이터**: 하이브리드 해상도 30일 (24h@1min, 7d@5min, 30d@1h)
- **KPI/수익 데이터**: 60일
- **전력 가격 데이터**: 30일 (3개 지역, 시간별)
- **대시보드 10개**: 8개 도메인별 + 2개 테스트용
- **총 ~517,000 레코드**

## 스크립트

```bash
pnpm dev          # 개발 서버
pnpm build        # 프로덕션 빌드
pnpm start        # 프로덕션 서버
pnpm db:setup     # DB 마이그레이션 + 시드
pnpm db:studio    # Prisma Studio
pnpm lint         # ESLint
```
