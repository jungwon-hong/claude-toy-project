---
category: code-review
applied: not-yet
---
## localStorage를 읽는 훅을 추가하면 그 전까지 무해했던 테스트 간 상태 오염이 드러난다

**상황**: Task 10, `useWatchlist`에 mount-time localStorage 복원을 추가하자 `watchlist.test.tsx`의 마지막 테스트("삭제")가 실패했다. 원인은 그 파일에 `window.localStorage.clear()`가 없어서, 앞선 테스트들이 실제 `localStorage`에 남긴 "삼성전자" 항목을 이 훅이 마운트 시점에 그대로 복원해버린 것 — 이전에는 훅이 localStorage를 읽지 않았으니 문제가 드러나지 않았을 뿐이었다.
**판단**: `use-watchlist.test.ts`처럼 `beforeEach(() => window.localStorage.clear())`를 `watchlist.test.tsx`에도 추가.
**다시 마주칠 가능성**: 높음 — 전역 브라우저 저장소(localStorage/sessionStorage/cookies)를 읽는 기능을 추가할 때마다, 그걸 쓰는 모든 테스트 파일에 정리 로직이 있는지 다시 점검해야 한다.

---
category: code-review
applied: not-yet
---
## jsdom에서 Base UI Combobox 팝업이 닫히는 애니메이션 중 pointer-events:none이 남아 이후 상호작용을 막는다

**상황**: Task 10 체크 중 `watchlist.test.tsx`에서 두 번째 검색·클릭 시퀀스가 "pointer-events: none" 에러로 실패. AlertDialog closed-state 때와 같은 원인(jsdom이 exit 애니메이션 종료 이벤트를 발생시키지 않아 오버레이가 그대로 남음).
**판단**: 이 파일의 모든 `userEvent.setup()`을 `userEvent.setup({ pointerEventsCheck: 0 })`로 변경해 우회.
**다시 마주칠 가능성**: 높음 — Base UI/Radix 기반의 애니메이션 있는 오버레이 컴포넌트(Combobox, Dialog, Popover 등)를 여러 번 여닫는 테스트에서 반복적으로 재발할 수 있다. 다음에는 처음부터 `pointerEventsCheck: 0`으로 설정하고 시작하는 게 나을 수 있음.

---
category: code-review
applied: not-yet
---
## Base UI Combobox는 `value`를 초기화해도 입력창 텍스트는 안 지워진다

**상황**: Task 10 체크 중, 두 번째 종목을 검색하는 테스트("SK하이닉스" 검색)가 옵션을 못 찾아 타임아웃. 실제로는 `StockSearch`가 선택 후 `value`만 `null`로 리셋했을 뿐 입력창에는 이전에 선택한 "삼성전자" 텍스트가 그대로 남아 있어서, 사용자가 이어서 입력한 글자가 그 뒤에 이어붙어 어떤 종목명과도 매칭되지 않았다. 실제 브라우저에서도 재현될 실제 버그였다.
**판단**: `inputValue`/`onInputValueChange`를 별도로 controlled 상태로 두고, 선택 시 `setInputValue("")`도 같이 호출하도록 수정.
**다시 마주칠 가능성**: 높음 — Base UI/Radix 계열 Combobox에서 "선택값(value)"과 "입력창 텍스트(inputValue)"는 별개의 controlled 상태라는 점을 항상 확인해야 한다.

---
category: refactor
applied: not-yet
---
## shadcn Combobox는 items/itemToStringLabel/limit로 검색·개수제한을 자체 처리한다

**상황**: Task 5, plan.md가 `lib/stock-master.ts`(부분 일치 검색 순수 함수)를 별도로 만들라고 했다. 만들고 컴포넌트에 연결하지 않은 채로 두었는데, 실제로는 `Combobox`(`@base-ui/react` 기반)에 `items`+`itemToStringLabel`+`limit` prop만 넘기면 locale-aware contains 매칭과 개수 제한을 라이브러리가 전부 처리했다.
**판단**: 미사용 상태였던 `lib/stock-master.ts`와 그 테스트를 삭제. plan.md의 구현 대상·영향받는 파일 표를 갱신. 라이브러리가 이미 제공하는 기능을 직접 구현하기 전에 컴포넌트 API를 먼저 확인해야 했다.
**다시 마주칠 가능성**: 높음 — shadcn/Base UI 계열 컴포넌트를 쓸 때 "직접 필터링 로직 작성"이 필요하다고 가정하기 전에 항상 컴포넌트가 이미 제공하는 prop을 먼저 확인해야 한다.

---
category: task-ordering
applied: not-yet
---
## Task 순서는 plan.md 순서를 그대로 따름

**상황**: Step 2, Task 의존성 식별. plan.md의 Task 1→10 순서가 이미 의존성(마스터 리스트 → API → UI → 삭제/새로고침)과 위험도(외부 API 연동을 가장 먼저) 기준으로 맞게 배치되어 있었다.
**판단**: 재정렬 없이 그대로 실행.
**다시 마주칠 가능성**: 낮음 — 이번엔 plan이 이미 잘 짜여 있었을 뿐, 항상 그런 건 아니다.

---
category: spec-ambiguity
applied: not-yet
---
## data.go.kr 시세 API는 날짜를 안 주면 전체 히스토리를 반환한다

**상황**: Task 1, `fetchLatestKospiSnapshot` 구현 중. `basDt`(기준일자) 없이 호출하면 `totalCount`가 430만 건(전체 종목의 전체 거래일)으로 나왔다. `basDt`+`mrktCls`를 함께 줘야 그날의 KOSPI 스냅샷(945건)만 온다.
**판단**: "최신 거래일"을 얻기 위해 오늘부터 최대 10일 전까지 날짜를 하나씩 시도하며 데이터가 있는 첫 날짜를 사용하는 방식으로 구현 (주말/공휴일은 0건).
**다시 마주칠 가능성**: 높음 — 한국 공공데이터포털의 일별 시세류 API는 대부분 이 패턴(날짜 필수, 없으면 전체 반환)을 따른다. 이 프로젝트에서 data.go.kr을 또 쓴다면 재발.

---
category: spec-ambiguity
applied: not-yet
---
## 코스피 종목코드가 항상 6자리 숫자는 아니다

**상황**: Task 1, 생성된 `kospi200.json`을 검증하는 테스트 작성 중. `/^\d{6}$/`로 종목코드를 검증했는데 "삼성에피스홀딩스"의 코드가 "0126Z0"(알파벳 포함)이라 실패했다.
**판단**: 정규식을 `/^[0-9A-Z]{6}$/`로 완화. 스핀오프/특수 상장 종목은 알파벳이 섞인 임시 코드를 쓸 수 있다는 걸 실데이터로 확인.
**다시 마주칠 가능성**: 중간 — 종목코드를 다루는 다른 로직(예: URL 파라미터, 정규식 검증)에서도 이 가정이 틀릴 수 있다.

---
category: tooling
applied: not-yet
---
## Vitest가 e2e/ 밑 Playwright 스펙을 잘못 실행하고 있었음

**상황**: Task 1 체크포인트에서 `bun run test` 실행 중 `e2e/smoke.spec.ts`가 Vitest로 실행되며 실패 (Playwright의 `test()`가 Vitest 컨텍스트에선 동작 안 함). 이 프로젝트의 사전 설정 문제였고 이번 feature가 원인은 아니었다.
**판단**: `vitest.config.ts`의 `exclude`에 `"e2e/**"` 추가. Step 6에서 사용자 승인 받아 원칙으로 승격할지 결정할 후보.
**다시 마주칠 가능성**: 높음 — 다음 프로젝트에서도 Vitest+Playwright를 함께 쓰면 재발.

---
category: tooling
applied: not-yet
---
## Bun 전용 문법(`import.meta.main`)을 쓰는 스크립트는 tsconfig에서 제외해야 next build가 안 깨진다

**상황**: Task 1, `scripts/generate-kospi200-list.ts`에서 `import.meta.main`(Bun 전용) 사용 후 `bun run build`가 "Property 'main' does not exist on type 'ImportMeta'"로 실패. Next.js의 `next build` 타입체크가 tsconfig의 `**/*.ts` include를 통해 `scripts/`까지 훑고 있었다.
**판단**: `tsconfig.json` exclude에 `"scripts"` 추가. 앱 코드와 별개인 1회성/빌드타임 스크립트는 애초에 앱 tsconfig 범위 밖에 둬야 한다.
**다시 마주칠 가능성**: 중간 — 이번 프로젝트에서 scripts/를 더 추가하면 이미 해결됐으니 재발 안 함. 다른 프로젝트에 Bun 스크립트를 추가할 때는 재발 가능.
