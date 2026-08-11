# AGENTS.md — PapaControl 개발 가이드

> 이 프로젝트에서 작업할 때 먼저 참고하는 기준 문서입니다. Phaser 3 + TypeScript 기반의 모바일 대응 자동 이동 2D 플랫포머를 웹과 GitHub Pages에 배포하는 것이 목표입니다.

## 1. 프로젝트 방향

- 엔진은 Phaser 3, 언어는 TypeScript, 빌드는 Vite, 패키지 매니저는 pnpm을 사용합니다.
- 물리는 Arcade Physics를 사용합니다. 초기 슬로프는 작은 정적 지형 조각을 계단식으로 연결합니다.
- 목표 플랫폼은 모바일 브라우저와 PC 브라우저이며 단일 반응형 캔버스로 대응합니다.
- 플레이어는 정지하지 않습니다. 마지막 방향을 기억해 `roll` 또는 `fly` 상태로 계속 이동합니다.
- 외부 이미지 없이 Phaser 도형으로 프로토타입을 유지하고, 아트 적용은 별도 작업으로 다룹니다.

## 2. 정본 문서

| 파일 | 역할 |
| --- | --- |
| `AGENTS.md` | 개발 규칙, 구조, 검증 절차 |
| `docs/gdd.md` | 조작, 상태, 테스트 레벨 기획 정본 |
| `docs/roadmap.md` | 구현 현황과 다음 작업 |

기능 구현 전 `docs/gdd.md`와 `docs/roadmap.md`를 읽고, 기능 단위 완료 후 로드맵을 갱신합니다.

## 3. 작업 규칙

- 사용자 대화와 완료 보고는 한국어로 작성합니다.
- 구현 전 관련 문서와 소스를 읽고 현재 구조를 유지합니다.
- 사용자 변경사항을 되돌리거나 관련 없는 리팩터링을 하지 않습니다.
- Scene은 레벨 흐름, Entity는 플레이어 상태/행동, System은 Phaser 비의존 규칙, Input은 장치 입력 추상화를 담당합니다.
- 게임 UI는 Phaser 내부에서 구현하며 React/Vue/Tailwind 등 DOM 프레임워크를 추가하지 않습니다.
- `any`를 사용하지 않고, 타입 전용 import는 `import type`을 사용합니다.
- 반복되는 색상, 물리값, 레이아웃값은 `src/constants/`에서 관리합니다.
- `update()`에서 불필요한 객체 생성과 전체 탐색을 피합니다.
- Scene 종료 시 등록한 외부 이벤트 리스너를 정리합니다.

## 4. 파일 구조

```text
src/
├── main.ts                  # Phaser 진입점 및 GameConfig
├── constants/               # 게임 설정값, 색상, Scene 키
├── entities/Player.ts       # roll/fly 상태와 물리 행동
├── input/PlayerInput.ts     # 키보드/멀티터치 액션 통합
├── scenes/GameScene.ts      # 테스트 레벨, HUD, 완료 흐름
└── systems/                 # 체크포인트·모멘텀·tier 순수 규칙 및 테스트
docs/
├── gdd.md
└── roadmap.md
.github/workflows/           # GitHub Pages 자동 배포
```

새 폴더를 추가하면 이 구조를 갱신합니다.

## 5. 화면과 입력

- `Phaser.Scale.RESIZE`를 사용하며 HUD는 `setScrollFactor(0)`로 화면에 고정합니다.
- PC: 방향키 또는 A/D로 방향 전환, Space로 점프/활공, Shift로 boost, 공중에서 아래 방향키/S로 slam합니다.
- 모바일: 하단 좌/우/FLY/BOOST/SLAM 버튼을 제공하고 동시 입력을 지원합니다.
- 좌우 입력을 떼어도 마지막 방향으로 계속 이동해야 합니다.
- 터치 히트 영역은 최소 72px 수준을 유지하고 Safe Area를 고려합니다.

## 6. 레벨 및 안전 규칙

- 바닥 없는 낙사 구간을 만들지 않습니다.
- 보이지 않는 안전 바닥에 닿기 전 현재 진행 위치보다 뒤의 가장 가까운 안전 앵커로 복귀합니다.
- 진행 순서는 평지 → 슬로프 → 경사 조합 → 상층 플랫폼 → fly 전용 공간 → 도착점입니다.
- 완전 자유비행 대신 점프 버튼 유지 중 중력 감소와 약한 상승을 적용합니다.

## 7. 검증

변경 후 아래 순서로 검증합니다.

```bash
pnpm lint
pnpm test
pnpm build
```

순수 System을 추가하거나 변경하면 Vitest 단위 테스트를 함께 갱신합니다. 실행하지 못한 검증은 완료 보고에 이유를 남깁니다.

## 8. Git과 배포

- 각 작업이 완료되고 검증을 통과하면 별도 요청을 기다리지 않고 변경 범위를 확인한 뒤 `main` 브랜치에 커밋하고 `origin/main`으로 푸시합니다.
- 사용자가 특정 작업에서 커밋 또는 푸시를 금지하면 해당 지시를 우선합니다.
- 커밋 전 사용자 변경사항과 작업 범위를 확인하고, 관련 없는 변경은 포함하지 않습니다.
- 커밋 메시지는 `feat`, `fix`, `docs`, `test`, `chore` 등 변경 성격에 맞는 Conventional Commits 형식을 사용합니다.
- `main` 브랜치 push 시 GitHub Actions가 `dist/`를 GitHub Pages에 배포합니다.
- Vite `base`는 저장소 하위 경로에서도 작동하도록 상대 경로를 유지합니다.
- Pages 최초 사용 시 저장소 Settings → Pages → Source를 `GitHub Actions`로 설정합니다.

## 9. 사전 협의 항목

- 새 런타임 라이브러리 또는 UI 프레임워크 추가
- 저장 데이터 형식 도입/변경
- 입력 체계나 플레이어 핵심 물리의 대규모 변경
- 배포 플랫폼 또는 GitHub Actions 구조 변경
- 외부 에셋 파이프라인 도입
