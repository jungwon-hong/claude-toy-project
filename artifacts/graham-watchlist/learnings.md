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
