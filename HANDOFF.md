# Nyanyang Restaurant (냥냥식당) - Handoff Document

이 문서는 Codex 또는 다른 개발 환경/에이전트가 이 프로젝트를 즉시 이어서 개발할 수 있도록 현재 상태와 컨텍스트를 요약한 핸드오프 문서입니다.

## 📌 1. 프로젝트 개요 (Project Context)
- **장르**: 7~11세 타겟의 모바일 웹 기반 캐주얼 요리 타이쿤 게임
- **기술 스택**: React, TypeScript, Vite, CSS (모바일 `100dvh` 대응)
- **주요 특징**: 귀여운 동물 손님, 레벨 스케일링, 터치 기반 인터랙티브 조리(미니게임), 뽑기(가챠) 및 퀘스트 시스템

## 🚀 2. 현재 진행 상태 (Current Status)
현재 'Phase 2 상용화 업데이트'를 진행 중이며, 많은 시스템이 구축되었습니다. 세부 목표는 `docs/Commercial_Upgrade_TODO.md`에 정의되어 있습니다.

### ✅ 완료된 작업 (Done)
1. **인터랙티브 요리 미니게임** (`src/views/KitchenView.tsx`, `StoveDial.tsx`)
   - 터치/드래그로 다이얼을 돌려 불을 켜는 로직 구현 (Math.atan2 각도 계산)
   - 보울(Bowl) 위를 터치/드래그하여 반죽 게이지를 채우는 로직 구현
2. **사운드 시스템** (`src/utils/audio.ts`)
   - Web Audio API (Oscillator)를 사용하여 에셋 다운로드 없이 효과음(지글지글, 믹싱, 성공 팡파레, 코인 획득) 합성 적용
3. **상용 게임 필수 시스템** (`App.tsx`, `QuestsPopup.tsx`, `GachaPopup.tsx`)
   - 1~20레벨 로그(Log) 스케일링 경험치 곡선 적용 완료
   - 하트 재화를 소모하는 가챠(뽑기) 팝업 추가
   - 일일 퀘스트 및 보상 UI 추가
4. **캐릭터 그래픽 에셋 적용** (`RestaurantView.tsx`)
   - 주인공(냥냥 셰프)이 좌측에, 손님이 우측에 서서 마주보는 UI 레이아웃으로 개편
   - 강아지, 토끼, 여우 에셋 `public/assets/`에 생성 후 `mix-blend-mode: multiply`로 합성 완료

### ⏳ 남은 작업 / 주의사항 (To-Do / Blocks)
1. **이미지 생성 API 할당량 한도 (Quota Exhausted)**:
   - 판다, 수달, 햄스터 등 나머지 손님의 고퀄리티 일러스트를 생성하던 중 API 한도 초과 발생 (약 2~3시간 뒤 해제). 현재는 이모티콘으로 대체 렌더링 중입니다.
   - 한도가 풀리면 `char_panda.jpg`, `char_otter.jpg` 등을 생성하여 `RestaurantView.tsx` 분기문에 추가해야 합니다.
2. **조리 미니게임 고도화**:
   - 도마(Board) 위에서 스와이프(Swipe)하여 재료를 써는 액션이 아직 구현되지 않았습니다.
3. **폴리싱**:
   - `Commercial_Upgrade_TODO.md`의 "5. 테스트 및 QA" 섹션에 기재된 시나리오 기반 버그 픽스 및 애니메이션 최적화 진행 필요.

## 📂 3. 주요 파일 구조 (Key Files)
- `src/App.tsx`: 글로벌 상태(State) 관리, 팝업 렌더링, 레벨 및 경험치 계산 로직.
- `src/views/RestaurantView.tsx`: 주인공과 손님이 상호작용하고 요리를 서빙하여 돈과 하트를 얻는 메인 홀 화면.
- `src/views/KitchenView.tsx`: 재료를 조합하고 인터랙티브 미니게임(다이얼, 믹싱)을 통해 요리 결과를 도출하는 주방 화면.
- `src/views/MartView.tsx`: 레벨에 따라 해금되는 식재료를 구매하는 마트 화면.
- `src/utils/audio.ts`: Web Audio API 기반 효과음 합성 유틸리티.
- `docs/Commercial_Upgrade_TODO.md`: 기획 및 앞으로 구현해야 할 개발 마일스톤 상세 정의 문서.

---
**다음 개발자(또는 에이전트)에게:**
`npm run dev`로 Vite 서버를 띄우고, `docs/Commercial_Upgrade_TODO.md` 문서를 읽은 뒤 미구현된 '도마 썰기 미니게임'이나 '나머지 캐릭터 일러스트 작업'부터 이어서 진행하시면 됩니다. 화이팅! 🐾
