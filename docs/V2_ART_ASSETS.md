# 냥냥식당 v2 아트·모션·소리 기록

공통 제작 기준은 따뜻한 그림책풍, 크림·살구·민트·코코아 팔레트, 둥근 형태와 읽기 쉬운 실루엣이다. 이미지 생성은 Codex 내장 `image_gen`으로 수행했다. 외부 상용 이미지나 유료 음원을 사용하지 않았다.

## 새로 생성한 비트맵

| 게임 파일 | 제작 지시 요약 | 사용 위치 |
| --- | --- | --- |
| `public/game/family-mother.png`, `family-father.png`, `family-sibling.png` | 기존 주인공과 같은 그림체의 투명 전신 컷아웃. 엄마·아빠·어린 동생의 옷, 얼굴, 실루엣을 서로 구별. | 가족 선택과 식사 시작 |
| `public/game/family-mother-happy.png`, `family-father-happy.png`, `family-sibling-happy.png` | 바로 앞의 각 캐릭터를 참조해 옷과 외형을 유지하면서 즐겁게 먹은 뒤 웃는 눈·입과 팔 자세를 변경. | 가족별 식사 반응 끝 프레임 |
| `public/game/chef-mint-outfit.png`, `chef-berry-outfit.png`, `chef-sky-outfit.png` | 기존 고양이 셰프를 참조해 얼굴·체형을 유지하고 앞치마 색과 작은 옷 장식을 각각 변경. 투명 배경. | 의상 구매·장착 결과 |
| `public/game/bg-evening.png`, `bg-garden.png` | 기존 식당 배경의 구도·그림체를 참조해 노을과 꽃밭 분위기로 변형. UI와 인물을 놓을 중앙 공간 확보. | 식당 배경 꾸미기 |
| `public/game/food-fruit-skewers-v3.png` | 기존 과일 요거트 그림을 화풍 참고로 사용해 딸기·바나나 꼬치 세 개를 민트 접시에 담은 투명 컷아웃으로 생성. 기존 그림은 수정하지 않음. | 추가 레시피의 선택·조리·완성 그림 |

딸기 바나나 꼬치 이미지는 Codex 내장 `image_gen`으로 만들었다. 최종 프롬프트는 다음과 같다. `food-fruit-yogurt-v3.webp`는 그림체 참고 이미지로만 사용했다.

```text
Use case: stylized-concept
Asset type: transparent game food sprite for a Korean children's cooking game, square 1024x1024
Primary request: A finished plate of colorful strawberry-banana fruit skewers. Three short child-safe wooden skewers, each alternating fresh glossy halved strawberries and round banana slices, arranged like a fan on a small scalloped mint ceramic plate with a few tiny yogurt dots. Make the fruit clearly recognizable and appetizing.
Input image: the supplied fruit-yogurt sprite is a STYLE REFERENCE ONLY, not an edit target. Match its polished hand-painted children's storybook rendering, rich food texture, soft warm highlights, fine dark outlines, subtle dimensional shading, and clean transparent cutout.
Composition: centered 3/4 top-down view, entire plate and food visible with generous transparent margins. No background environment or floor shadow beyond the plate.
Constraints: no text, no lettering, no watermark, no faces, no unrelated fruit. Real alpha transparency. The result should look like a premium finished dish from the same game.
```

생성 원본은 위 PNG 파일 그대로 게임 저장소에 포함했다. 생성 도구의 작업 출력은 이 컴퓨터의 `C:\Users\10116\.codex\generated_images\01a0dc51-5aca-72a2-bcfa-8e99b90c08bc`에도 남아 있다. 기존 v1의 주인공 기본 모습, 일반·스페셜 손님과 표정, 기본 식당·마트·주방, 팬·냄비·보울 WebP는 [v1 아트 기록](ART_ASSETS.md)의 자산을 계속 사용했다. v2에서 새로 필요한 가족·의상·배경은 같은 방향으로 제작했다.

## 코드로 만든 그림과 모션

- `src/v2/FoodArt.tsx`, `IngredientVisual.tsx`, `GearArt.tsx`: 음식, 재료, 모자·목걸이·배지의 SVG. 작은 모바일 화면에서도 선명하다.
- `src/v2/CookScene.tsx`: 씻기·썰기·젓기·뒤집기·바르기·붓기·쌓기·굽기·깨기·뿌리기에서 도구와 재료의 위치·색·조각·채움 정도가 손동작 진행에 맞춰 바뀐다.
- `src/v2/AppV2.tsx`의 `EatingScene` 및 `AppV2.css`: 접시가 상대에게 이동하고 먹는 장면 뒤에 고객·가족별 기쁨 프레임으로 교체된다. 엄마·아빠·동생은 각기 다른 몸짓을 사용한다. 장면 전환·버튼 누름·장바구니·도어 열림을 CSS로 표현했다. OS의 움직임 줄이기 설정을 존중한다.
- 요리 단계는 방향별 포인터 이동으로 진행한다. 젓기는 원운동, 썰기·붓기·깨기는 세로, 씻기·바르기는 가로 입력이다. 키보드와 단계 도움 버튼도 제공한다.

## BGM과 효과음

`src/v2/audio.ts`가 Web Audio로 다섯 장소의 직접 제작 MP3를 재생하고, 파일 로딩에 실패하면 짧은 멜로디를 합성한다. 자산과 제작 방식은 [음악 자산 표](AUDIO_ASSETS.md)에 기록했다. 장소를 이동하면 이전 음악 버스를 감쇠시키고 새 음악을 서서히 켠다. 첫 사용자 제스처 후에만 `AudioContext`를 시작한다. 효과음은 재료 선택, 썰기, 젓기, 받기, 완성, 서빙, 보상, 실수에 서로 다른 음형을 사용한다. BGM·효과음은 각각 켜기/끄기와 음량을 설정할 수 있다.

브라우저 자동 테스트는 음악 컨텍스트 시작, 장소 전환, 음소거·설정 복원을 확인한다. 실제 8세 어린이의 그림·음악 선호도와 물리 휴대전화 스피커의 음색 평가는 별도 사용성 확인이 필요하다.
