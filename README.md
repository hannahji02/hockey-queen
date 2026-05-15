# 🏒 Hockey Queen

아이스하키 동호회 워크샵 추첨 룰렛 웹앱

## Phase 1: UI Skeleton (현재 단계)

- Next.js 14 App Router + TypeScript + Tailwind CSS 세팅
- 3분할 다크모드 레이아웃 (좌측 패널 / 중앙 캔버스 / 우측 순위)
- 정적 UI 골격만 구현 (인터랙션 비활성화)

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## Vercel 배포

1. GitHub 저장소에 push
2. [Vercel](https://vercel.com) 에서 Import → 자동 빌드 & 배포
3. 별도 환경변수 불필요

## 개발 단계 로드맵

- [x] Phase 1: 프로젝트 골격 + 3분할 UI
- [ ] Phase 2: CSV 업로드 + 참가자 관리
- [ ] Phase 3: Matter.js 물리엔진 연결
- [ ] Phase 4: 장애물 + 페이스오프 깔때기
- [ ] Phase 5: 1등/꼴등 판정 + 실시간 순위
- [ ] Phase 6: 화려/축제형 당첨 애니메이션
- [ ] Phase 7: 디자인 폴리싱
- [ ] Phase 8: 이미지 자산 교체
- [ ] Phase 9: Vercel 프로덕션 배포

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Physics** (예정): Matter.js
- **Animation** (예정): Framer Motion + canvas-confetti
