# graham-watchlist 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 코스피200 마스터 리스트 소스 | KRX Open API에는 지수 구성종목 데이터가 없음을 확인함 (지수/주식 카테고리 모두 시세·기본정보만 제공). data.go.kr `금융위원회_주식시세정보`로 KOSPI 시장 전체를 받아 시가총액(`mrktTotAmt`) 상위 200개를 추출하는 근사 리스트로 대체 | 이미 키가 검증된 API를 재사용, 추가 승인 대기 없음. 화면에 "실제 지수와 다를 수 있음" 안내 필요 |
| 종목코드 ↔ DART 고유번호 매핑 | DART 재무정보 API는 8자리 `corp_code`가 필요하고 종목코드(6자리)만으로는 조회 불가. DART `corpCode.xml`(전체 상장사 고유번호 목록)을 한 번 받아 매핑해 마스터 리스트에 포함 | 런타임마다 매핑을 조회하지 않고 정적 데이터에 미리 포함해 API 호출 횟수와 실패 지점을 줄임 |
| 외부 API 호출 위치 | DART/data.go.kr 호출은 모두 Next.js Route Handler(서버)에서 수행 | API 키를 클라이언트 번들에 노출하지 않기 위함 (이전 대화에서 확정) |
| 그레이엄 판정 로직 | `lib/`의 순수 함수로 구현, 부작용 없음 | 유닛 테스트로 시나리오 4/5/6의 모든 분기(정상/PER N/A/데이터 없음)를 빠르게 검증 가능 |
| 워치리스트 영속성 | `localStorage`에 종목코드만 저장, 가격·재무데이터는 저장하지 않고 화면 로드마다 재조회 | spec 불변 규칙(서버 미저장) + 시나리오 9(재방문 시 최신 데이터 갱신) |
| 상세 화면 레이아웃 | 모바일: 별도 화면(전체 화면 전환) / 데스크톱(`@md:` 이상): 워치리스트 화면 내 2컬럼(리스트+상세 패널), 화면 전환 없음 | wireframe.html에서 확정된 레이아웃 |
| 상태 관리 | React `useState`/커스텀 훅 + `localStorage`, 외부 상태관리 라이브러리 없음 | 단일 사용자 로컬 도구로 범위가 작음 |
| 테스트 범위 | Vitest(단위·통합)만 작성, Playwright e2e는 이번 범위에서 제외 | 사용자 결정 (시간 예산) |

## 인프라 리소스

| 리소스 | 유형 | 선언 위치 | 생성 Task |
|---|---|---|---|
| `DART_API_KEY` | Env var | `.env.local` | 이미 완료 (대화 중 발급·등록됨) |
| `DATA_GO_KR_API_KEY` | Env var | `.env.local` | 이미 완료 (대화 중 발급·등록됨) |
| 코스피200(근사) 마스터 리스트 | 정적 JSON 파일 | `public/data/kospi200.json` | Task 1 |

## 데이터 모델

### StockMasterEntry (`public/data/kospi200.json`의 각 항목)
- code: string — 6자리 종목코드
- name: string — 종목명
- corpCode: string — DART 8자리 고유번호

### StockPrice
- code, name
- price: number — 현재가
- changeRate: number — 전일 대비 등락률(%)
- marketCap: number — 시가총액

### StockFinancials
- code
- netIncome: number | null — 당기순이익
- totalAssets, totalLiabilities, totalEquity: number | null
- revenue: number | null — 매출액 (그레이엄 판정에는 미사용, 참고용)

### GrahamCriterion
- key: "per" | "pbr" | "debtRatio" | "profitable"
- label: string
- value: string — 화면 표시용 (예: "PER 9.8", "N/A", "데이터 없음")
- status: "pass" | "fail" | "unavailable"

### GrahamResult
- criteria: GrahamCriterion[] — 항상 4개, 순서 고정
- satisfiedCount: number
- evaluableCount: number — status가 "unavailable"이 아닌 기준 개수

### WatchlistEntry (localStorage에 저장)
- code: string
- name: string

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| shadcn | 5, 6, 7, 8 | Combobox(자동완성), AlertDialog(중복 확인 팝업), Card/Badge 사용 규칙 준수, phosphor 아이콘 |
| next-best-practices | 1, 3, 4 | Route Handler 작성, 서버/클라이언트 컴포넌트 경계, 데이터 fetching 패턴 |
| vercel-react-best-practices | 6, 8 | 워치리스트 리렌더링·훅 최적화 |
| vercel-composition-patterns | 8 | 모바일 전체화면 ↔ 데스크톱 2컬럼 패널의 컴포넌트 구성 |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `scripts/generate-kospi200-list.ts` | New | 1 |
| `public/data/kospi200.json` | New | 1 |
| `types/stock.ts` | New | 1, 2, 3, 4 |
| `config/graham.ts` | New | 2 |
| `lib/graham.ts` / `.test.ts` | New | 2 |
| `lib/stock-master.ts` / `.test.ts` | New | 5 |
| `services/data-go-kr-client.ts` / `.test.ts` | New | 1, 3 |
| `services/dart-client.ts` / `.test.ts` | New | 1, 4 |
| `app/api/stocks/[code]/price/route.ts` / `.test.ts` | New | 3 |
| `app/api/stocks/[code]/graham/route.ts` / `.test.ts` | New | 4 |
| `hooks/use-watchlist.ts` / `.test.ts` | New | 6, 9, 10 |
| `hooks/use-stock-detail.ts` / `.test.ts` | New | 8, 10 |
| `components/graham-watchlist/stock-search.tsx` / `.test.tsx` | New | 5 |
| `components/graham-watchlist/watchlist.tsx` / `.test.tsx` | New | 6, 9 |
| `components/graham-watchlist/duplicate-dialog.tsx` / `.test.tsx` | New | 7 |
| `components/graham-watchlist/stock-detail.tsx` / `.test.tsx` | New | 8 |
| `app/page.tsx` | Modify | 6 |
| `app/layout.tsx` | Modify | 6 |
| `e2e/smoke.spec.ts` | Modify | 6 |
| `components/component-example.tsx`, `components/example.tsx` | Delete | 6 |

## Tasks

### Task 1: 코스피200(근사) 마스터 리스트 생성 ✅

- **담당 시나리오**: Scenario 1의 전제조건 (마스터 리스트 데이터 자체)
- **크기**: M (3-5 파일)
- **의존성**: None
- **참조**:
  - 금융위원회_주식시세정보 (data.go.kr) — https://www.data.go.kr/data/15094808/openapi.do
  - OpenDART 고유번호 API — https://opendart.fss.or.kr/guide/detail.do?apiGrpCd=DS001&apiId=2019018
- **구현 대상**:
  - `services/data-go-kr-client.ts` — KOSPI 시장 종목 페이지네이션 조회 함수
  - `services/dart-client.ts` — `corpCode.xml` 다운로드·파싱 함수 (zip 응답)
  - `scripts/generate-kospi200-list.ts` — 위 두 소스를 조합해 시가총액 상위 200개 + corpCode 매핑 후 `public/data/kospi200.json` 생성
  - `types/stock.ts` — `StockMasterEntry` 타입
- **수용 기준**:
  - [x] 스크립트 실행 후 `public/data/kospi200.json`에 정확히 200개 항목이 존재한다
  - [x] 각 항목은 `code`(6자리 문자열, 드물게 영문 포함 — 예: 스핀오프 종목), `name`(빈 문자열 아님), `corpCode`(8자리 숫자 문자열)를 모두 갖는다
  - [x] 항목이 시가총액 내림차순으로 정렬되어 있다 (상위 종목이 배열 앞쪽)
- **검증**:
  - `bun run scripts/generate-kospi200-list.ts` 실행 후 결과 파일 확인
  - `bun run test -- kospi200` (생성된 JSON의 구조를 검증하는 Vitest)

---

### Task 2: 그레이엄 체크리스트 판정 로직 ✅

- **담당 시나리오**: Scenario 4 (전체), Scenario 5, Scenario 6
- **크기**: S (1-2 파일)
- **의존성**: None
- **구현 대상**:
  - `types/stock.ts`에 `StockFinancials`, `GrahamCriterion`, `GrahamResult` 타입 추가
  - `config/graham.ts` — 임계값 상수 (`PER_THRESHOLD=15`, `PBR_THRESHOLD=1.5`, `DEBT_RATIO_THRESHOLD=100`)
  - `lib/graham.ts` / `.test.ts` — `evaluateGraham(price, financials): GrahamResult` 순수 함수
- **수용 기준**:
  - [x] PER 9.8, PBR 1.1, 부채비율 42%, 순이익 흑자인 입력 → 4개 기준 모두 `status: "pass"`, `satisfiedCount: 4`
  - [x] PER 18.4(기준 초과), 나머지 통과인 입력 → PER 기준만 `status: "fail"`, `satisfiedCount: 3`
  - [x] `netIncome`이 음수인 입력 → PER 기준이 `value: "N/A"`, `status: "fail"`이고 순이익 흑자 기준도 `status: "fail"`
  - [x] `totalLiabilities`나 `totalEquity`가 `null`인 입력 → 부채비율 기준이 `status: "unavailable"`, `value: "데이터 없음"`이고 `evaluableCount`가 3으로 줄어든다
- **검증**: `bun run test -- graham`

---

### Task 3: 종목 시세 조회 API ✅

- **담당 시나리오**: Scenario 2, Scenario 4 (가격 표시 부분)
- **크기**: M (3-5 파일)
- **의존성**: Task 1 (타입 재사용)
- **참조**:
  - 금융위원회_주식시세정보 — https://www.data.go.kr/data/15094808/openapi.do
- **구현 대상**:
  - `types/stock.ts`에 `StockPrice` 타입 추가
  - `services/data-go-kr-client.ts`에 종목코드 기준 단건 시세 조회 함수 추가
  - `app/api/stocks/[code]/price/route.ts` / `.test.ts`
- **수용 기준**:
  - [x] 존재하는 종목코드로 요청 → `{ price, changeRate, marketCap }`이 포함된 200 응답
  - [x] data.go.kr 응답이 비정상(빈 결과)인 경우 → 명확한 에러 상태코드와 메시지를 반환한다
- **검증**: `bun run test -- price-route` (data.go.kr 호출은 mock)

---

### Task 4: 종목 재무데이터 + 그레이엄 판정 API

- **담당 시나리오**: Scenario 4, 5, 6 (API 레벨)
- **크기**: M (3-5 파일)
- **의존성**: Task 1, Task 2
- **참조**:
  - OpenDART 단일회사 주요계정 — https://opendart.fss.or.kr/guide/detail.do?apiGrpCd=DS003&apiId=2019016
- **구현 대상**:
  - `services/dart-client.ts`에 corpCode 기준 주요계정 조회 함수 추가 (`StockFinancials` 반환)
  - `app/api/stocks/[code]/graham/route.ts` / `.test.ts` — DART 조회 → `evaluateGraham` 호출 → `GrahamResult` 반환
- **수용 기준**:
  - [ ] 재무데이터가 정상인 종목코드 요청 → `GrahamResult` JSON(4개 criteria 포함) 200 응답
  - [ ] 최근 결산 적자 종목 요청 → 응답의 PER criterion이 `value: "N/A"`
  - [ ] DART에 일부 계정이 없는 종목 요청 → 해당 criterion이 `status: "unavailable"`로 응답, 나머지는 정상 판정
- **검증**: `bun run test -- graham-route` (DART 호출은 mock, Task 2의 실제 `evaluateGraham` 사용)

---

### Checkpoint: Task 1-4 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 마스터 리스트가 준비되어 있고, 임의의 코스피200 종목코드로 시세·그레이엄 API를 직접 호출하면(curl 등) 올바른 JSON이 반환된다

---

### Task 5: 종목 검색 자동완성

- **담당 시나리오**: Scenario 1 (전체)
- **크기**: S (1-2 파일)
- **의존성**: Task 1
- **참조**:
  - shadcn — Combobox 컴포넌트 사용법 (`npx shadcn@latest docs combobox`)
- **구현 대상**:
  - `lib/stock-master.ts` / `.test.ts` — 마스터 리스트 로드 + 부분 일치 검색(최대 5개) 순수 함수
  - `components/graham-watchlist/stock-search.tsx` / `.test.tsx` — shadcn `Combobox` 기반 검색 UI
- **수용 기준**:
  - [ ] "삼성" 입력 → 자동완성 목록에 "삼성"을 포함하는 종목명이 최소 1개, 최대 5개 나타난다
  - [ ] 마스터 리스트에 없는 문자열 입력 → "코스피200 내에서 일치하는 종목이 없습니다" 문구가 나타난다
- **검증**: `bun run test -- stock-search`

---

### Task 6: 워치리스트 추가 및 목록 표시

- **담당 시나리오**: Scenario 2 (전체), Scenario 8 (전체)
- **크기**: M (3-5 파일)
- **의존성**: Task 3, Task 4, Task 5
- **구현 대상**:
  - `hooks/use-watchlist.ts` / `.test.ts` — 추가/목록, `localStorage` 동기화(코드+이름만 저장), 각 항목의 시세·그레이엄 fetch. 삭제 함수의 뼈대는 이 Task에서 만들되 실제 동작 연결은 Task 9에서 완성
  - `components/graham-watchlist/watchlist.tsx` / `.test.tsx` — 목록 렌더링(각 행에 삭제 아이콘 마크업 포함, 클릭 핸들러는 Task 9에서 연결), 빈 상태 문구
  - `app/page.tsx` 교체 — 기존 `ComponentExample` 데모를 이 feature의 진입점으로 변경
  - `app/layout.tsx`의 `<title>`을 앱 실제 이름으로 변경
  - `e2e/smoke.spec.ts`의 기대 타이틀을 새 값으로 갱신
  - `components/component-example.tsx`, `components/example.tsx` 삭제 (더 이상 사용되지 않음)
- **수용 기준**:
  - [ ] 자동완성에서 종목 선택 → 워치리스트에 종목명·현재가·등락률·"n/4 만족" 총점이 표시된다
  - [ ] 워치리스트에 종목이 없는 상태 → "워치리스트가 비어 있습니다. 종목을 검색해 추가하세요" 문구가 표시된다
  - [ ] 종목을 추가한 뒤 `localStorage`에 저장된 워치리스트 값을 직접 읽으면 각 항목이 `code`, `name` 필드만 갖고 있고 가격·재무 데이터는 포함되지 않는다
- **검증**: `bun run test -- watchlist` / `bun run build`

---

### Task 7: 중복 추가 확인 팝업

- **담당 시나리오**: Scenario 3 (전체)
- **크기**: S (1-2 파일)
- **의존성**: Task 6
- **참조**:
  - shadcn — AlertDialog 컴포넌트 사용법
- **구현 대상**:
  - `components/graham-watchlist/duplicate-dialog.tsx` / `.test.tsx` — shadcn `AlertDialog` 기반
  - `hooks/use-watchlist.ts`에 "이미 존재하는 종목 추가 시도" 처리 로직 추가
- **수용 기준**:
  - [ ] 이미 워치리스트에 있는 종목을 자동완성에서 다시 선택 → 확인 팝업이 나타나고 워치리스트 항목 수는 늘지 않는다
  - [ ] 팝업에서 "확인" 클릭 → 해당 종목의 표시된 시세·점수가 다시 조회되어 갱신된다
  - [ ] 팝업에서 "취소" 클릭 → 워치리스트 내용이 이전과 동일하게 유지된다
- **검증**: `bun run test -- duplicate-dialog`

---

### Checkpoint: Task 5-7 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 검색 → 추가 → 중복 추가 시도 → 목록 표시까지 전체 흐름이 브라우저에서 동작 (Human review: `bun run dev`로 직접 확인)

---

### Task 8: 종목 상세 판정 화면

- **담당 시나리오**: Scenario 4 (UI), Scenario 5 (UI), Scenario 6 (UI)
- **크기**: M (3-5 파일)
- **의존성**: Task 4, Task 6
- **참조**:
  - wireframe.html의 "종목 상세 (모바일 전용)" 화면 및 워치리스트 화면 우측 패널
  - vercel-composition-patterns — 반응형 컴포넌트 구성
- **구현 대상**:
  - `hooks/use-stock-detail.ts` / `.test.ts` — 선택된 종목의 그레이엄 결과 fetch
  - `components/graham-watchlist/stock-detail.tsx` / `.test.tsx` — 4개 기준 통과/실패/데이터없음 렌더링 + 총점
  - `components/graham-watchlist/watchlist.tsx` 수정 — 모바일: 행 클릭 시 전체화면 전환 / 데스크톱(`@md:` 이상): 우측 인라인 패널에 표시
- **수용 기준**:
  - [ ] 4개 기준 모두 만족하는 종목 상세 → "4/4 만족"과 4개 항목 모두 통과 아이콘이 나타난다
  - [ ] 일부만 만족하는 종목 상세 → 실패한 기준만 실패 아이콘으로 구분되어 표시된다
  - [ ] 최근 결산 적자 종목 상세 → PER 항목이 "N/A"로 표시된다
  - [ ] 4개 중 1개 지표를 계산할 데이터가 없는 종목 상세 → 해당 기준이 "데이터 없음"으로 표시되고 총점이 spec.md 시나리오 6과 동일한 형식인 "3개 기준 중 n/3 만족"으로 표시된다
- **검증**: `bun run test -- stock-detail`

---

### Task 9: 워치리스트 항목 삭제

- **담당 시나리오**: Scenario 7 (전체)
- **크기**: S (1-2 파일)
- **의존성**: Task 6
- **구현 대상**:
  - `hooks/use-watchlist.ts`의 삭제 함수를 완성 (localStorage 갱신 포함)
  - `components/graham-watchlist/watchlist.tsx`에서 Task 6이 렌더링한 삭제 아이콘의 클릭 핸들러를 실제 삭제 함수에 연결
- **수용 기준**:
  - [ ] 종목 삭제 버튼 클릭 → 해당 종목명이 워치리스트에서 사라지고 나머지 종목은 그대로 남는다
- **검증**: `bun run test -- watchlist`

---

### Task 10: 새로고침 시 데이터 유지 및 갱신

- **담당 시나리오**: Scenario 9 (전체)
- **크기**: S (1-2 파일)
- **의존성**: Task 6
- **구현 대상**:
  - `hooks/use-watchlist.ts` — 마운트 시 `localStorage`에서 종목코드 목록을 복원하고, 각 종목의 시세·그레이엄 데이터를 다시 fetch
- **수용 기준**:
  - [ ] 종목이 담긴 상태에서 페이지 새로고침 → 이전에 추가된 종목명이 모두 그대로 나타난다
  - [ ] 새로고침 시점에 가격이 달라졌다면 → 갱신된 가격이 화면에 표시된다 (mock 응답 값 변경으로 검증)
- **검증**: `bun run test -- use-watchlist`

---

### Checkpoint: 전체 완료
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] Human review: `bun run dev`로 실행 후 검색 → 추가 → 상세 확인 → 삭제 → 새로고침까지 전체 시나리오를 모바일/데스크톱 뷰포트 양쪽에서 직접 확인

## 미결정 항목

없음 — 대화 중 확인된 모든 사항이 반영되었다. 단, data.go.kr/DART 각 API의 정확한 요청 파라미터명은 Task 1, 3, 4 구현 시 참조 문서를 직접 확인해 확정한다 (사용자 의사결정이 필요한 사항은 아님).
