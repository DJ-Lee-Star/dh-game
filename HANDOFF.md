# 냥냥식당 v1.0 인수인계

현재 플레이 가능 범위는 Lv.1~5 첫 시즌이다. 실행·플레이 방법은 `README.md`, 수치 기준은 `docs/Level_Design.md`, 검증 근거는 `docs/QA_REPORT.md`, 이미지 출처와 프롬프트는 `docs/ART_ASSETS.md`를 참조한다.

## 코드 기준점

- `src/game/data.ts`: 레시피, 손님, 재료, 레벨 수치
- `src/game/engine.ts`: 상태 전이, 보상, 저장/복원
- `src/game/engine.test.ts`: 핵심 게임 시나리오 자동 테스트
- `src/App.tsx` / `src/App.css`: 화면, 모바일 레이아웃, 조리 입력과 애니메이션
- `src/components/GameArt.tsx`: 음식·재료·꾸미기 그림과 조리 도구 표시
- `public/game/`: WebP 캐릭터·표정·배경·도구 에셋

`npm test`, `npm run lint`, `npm run build`를 품질 관문으로 사용한다. 브라우저 저장 키는 `nyanyang-restaurant-v2`다. 레벨 5 첫 버터 토스트 정상 서빙 시 완료 화면이 열리고 이후 자유 플레이가 이어진다.
