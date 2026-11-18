# Retrievo 프론트엔드

Next.js 16(App Router) + TypeScript + Tailwind CSS v4로 만든 모바일 웹이다. 화면 시안과 디자인 규칙은 노션 설계 문서 20장과 ADR-018에 있다.

## 실행

```bash
pnpm install
pnpm dev
```

- 기본은 **목 API**다. 백엔드 없이 `http://localhost:3000`에서 오늘 화면과 꺼내기 흐름을 끝까지 볼 수 있다
- 실제 백엔드에 붙이려면 `.env.example`을 `.env.local`로 복사하고 `NEXT_PUBLIC_API_MODE=http`로 바꾼다. 백엔드는 `local` 프로필로 띄운다 (`X-Dev-User-Id` 임시 로그인)
- `/api/*` 요청은 `next.config.ts`의 rewrites가 `RETRIEVO_API_ORIGIN`(기본 `http://localhost:8080`)으로 보낸다. 브라우저에는 같은 도메인으로 보인다 (ADR-010)

## 검사

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 구조

| 경로 | 내용 |
| --- | --- |
| `src/app/` | 라우트. `/` 오늘, `/check` 오늘의 지연 확인 |
| `src/features/today/` | 오늘 화면, 첫 사용 안내 |
| `src/features/check/` | 답 먼저 적기 → 보기와 확신도 → 해설 |
| `src/components/ui/` | 버튼, 확인 막대, 코드 블록, 확신도 탭, 하단 메뉴 |
| `src/lib/api/` | API 타입(백엔드 record와 같은 형식), 실제 클라이언트, 목 API |
| `src/lib/highlight.ts` | 코드 문제용 Java 신택스 하이라이터 |

## 디자인 규칙 (ADR-018)

- 흰 바탕에 검은 글자가 기본. 카드와 그림자 대신 얇은 선과 여백으로 나눈다
- 골드(`gold`)는 "꺼내기에 성공했다"는 뜻으로만 쓴다: 통과한 확인 막대, 맞힌 답, 졸업
- 빨강(`wrong`)은 틀림 표시의 작은 점과 줄 표시에만 쓴다
- 색 토큰은 `src/app/globals.css`의 `@theme`에 있다
