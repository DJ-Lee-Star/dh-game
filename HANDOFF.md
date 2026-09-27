# 냥냥식당 v2 후속 개편 핸드오프

작성: 2026-09-27 · 작업 브랜치: `main`

## 현재 상태

[v2 후속 개편 계획](docs/V2_FOLLOWUP_PLAN.md)의 0~5단계를 구현했다. 식당 앞 조리대와 인물 레이어, 외형이 다른 가족 세 명, 곰 주인아저씨 계산대에서 이어지는 연속 마트 진열대, 화면 속 도구를 잡아 하는 조리, 꾸미기·재료·음식·미니게임 아트 정리, 종료 5초 안내를 포함한다. 새 자산 목록은 [후속 아트 조사](docs/V2_FOLLOWUP_ART_AUDIT.md), 실제 검증 결과와 스크린샷은 [후속 QA 보고서](docs/V2_FOLLOWUP_QA_REPORT.md)를 본다. 과거 [v2 QA 보고서](docs/V2_QA_REPORT.md)는 이전 화면의 기록이다.

## 저장·Git 기준

- 사용자가 다른 지시를 하지 않는 한 모든 PC에서 `main`으로 작업한다. 시작 전에 `git status --short --branch`를 확인하고 기존 변경을 보존한다. 이 기준은 [AGENTS.md](AGENTS.md)에도 있다.
- 이 PC에는 원래 플레이 DB `data/nyanyang.sqlite`가 없었다. E2E는 Git 제외 경로 `data/e2e.sqlite`를 사용한다. 다른 PC의 SQLite 플레이 기록과 브라우저 `localStorage` 토큰은 Git으로 옮겨지지 않는다. 원본 DB·브라우저 기록을 지우거나 초기화하지 말고 [README](README.md)의 백업·이전 절차를 따른다.
- 구매·조리·서빙·미니게임·꾸미기 상태와 요청 ID 중복 방지 규칙은 `src/v2/engine.ts`, `server/index.ts`에 남아 있다. 화면 수정을 할 때 트랜잭션 동작을 유지한다.

## 코드와 자산 출발점

| 위치 | 역할 |
| --- | --- |
| `src/v2/AppV2.tsx`, `AppV2.css` | 식당 레이어, 가족, 마트 공간·장바구니, 주방·미니게임·꾸미기 화면 |
| `src/v2/CookingInteraction.tsx`, `CookScene.tsx` | 화면상 도구·목표의 직접 포인터 입력과 단계별 음식 변화. 시범 버튼은 진행도를 주지 않는다. |
| `src/v2/FoodArt.tsx`, `IngredientVisual.tsx`, `GearArt.tsx`, `StorageArt.tsx`, `BasketArt.tsx` | 음식·재료·꾸미기·보관 장소·바구니의 코드 그림 |
| `public/game/family-*-v2.png` | 가족 3명의 기본·기쁨 투명 이미지 6장. 원래 가족 이미지는 역사 보존용. |
| `src/v2/audio.ts` | 식당·마트 BGM 및 미니게임 카운트다운 소리. 음소거 설정을 존중한다. |
| `e2e/game.e2e.ts` | 모바일 크기, 모든 레시피, 터치 스크롤, 가족, 저장·중복 구매·오디오·이미지 디코딩 검사. 새 스크린샷은 `docs/qa-v2-followup/`. |

## 다른 PC에서 실행·검증

Node.js 24 이상을 사용한다.

```powershell
npm ci
npm run dev
npm test
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

개발 화면은 `http://127.0.0.1:5173/`, API는 `127.0.0.1:4174`이다. 기존 v1 브라우저 기록을 옮길 때는 같은 호스트·포트에서 실행해야 하므로 [README](README.md)의 설명을 따른다.

## 공개 배포

`main` 푸시의 자동 배포는 [GitHub Actions 워크플로](.github/workflows/deploy.yml)와 [배포 안내](deploy/README.md)에 있다. 서버 초기 설정은 `deploy/server-setup.sh`, 새 릴리스 활성화와 실패 시 복원은 `deploy/activate.sh`가 맡는다. 공개 주소는 <https://leedada.duckdns.org/>이며, 서버의 프로필 DB는 릴리스와 별도인 `/var/lib/dh-game/nyanyang.sqlite`에 둔다. 배포 상태는 Actions 실행 결과와 공개 주소의 `/api/health`로 확인한다.

## 남은 현장 확인

실제 7~11세 어린이의 재미·난도·반복 피로도와 실제 iOS/Android 기기의 터치·음색·발열은 이 PC의 Chromium 검증만으로 판정하지 않는다. 현장 결과가 생기면 새 QA 보고서에 기록하고 조리 길이·음향을 조정한다.
