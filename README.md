# 콕

> 잊을 때쯤 콕, 3분 퀴즈

AI에게 물으면 답은 바로 나오지만, 쉽게 얻은 답은 쉽게 잊는다. 콕은 답을 먼저 떠올리게 하고(인출 연습), 잊을 때쯤 다른 문제로 다시 묻는(간격 반복) 학습 앱이다. 첫 주제는 개발자 면접 대비다.

## 핵심 루프

1. **답 먼저:** 답을 내기 전에는 정답과 해설을 보여주지 않는다
2. **확신도:** 답을 내기 전에 확실 / 애매 / 모름을 고른다. "확실한데 틀린" 개념을 따로 모은다
3. **지연 확인:** 처음 푼 뒤 3일·7일째에 같은 개념을 **다른 문제**로 다시 묻는다

## 구성

| 경로 | 내용 |
| --- | --- |
| `backend/` | Java 21, Spring Boot 3.5, JPA, PostgreSQL, Flyway. 모듈러 모놀리스 |
| `frontend/` | Next.js 16, TypeScript, Tailwind CSS v4. 모바일 웹. [frontend/README.md](frontend/README.md) |
| `docs/` | 문제 파일 형식 등 |

- 문제 원본은 이 저장소가 아니라 콘텐츠 저장소의 파일이다. 개발 주제는 [dev-lessons](https://github.com/wanja727/dev-lessons)
- 로그인은 OAuth만 쓴다. 비밀번호를 저장하지 않는다 (카카오 먼저)
- 프론트는 백엔드 없이도 목 API로 실행된다. 지금은 오늘 화면과 오늘의 지연 확인(답 먼저 적기 → 보기와 확신도 → 해설)까지 있다

## API (1주차)

| 요청 | 내용 |
| --- | --- |
| `GET /api/lessons` | 레슨 목록 (단원·레슨 순서) |
| `GET /api/lessons/{id}/questions` | 레슨의 판정 문제. 정답과 해설은 담지 않는다 |
| `POST /api/submissions` | 답 제출. `clientSubmissionId`, `questionVersionId`, `selected`, `confidence`(SURE/UNSURE/UNKNOWN) 필수. 응답에서 처음으로 정답과 해설을 준다 |
| `GET /api/me/delayed-checks/today` | 오늘 확인할 개념과, 개념마다 처음과 다른 문제 하나. 답은 `mode: DELAYED_CHECK`로 제출 |

- 1주차 로그인은 임시다. `kok.auth.dev-header=true`일 때만 `X-Dev-User-Id` 헤더로 사용자를 정한다 (로컬·테스트). 2주차에 카카오 OAuth와 Redis 세션으로 바꾼다
- 문제는 시작할 때 `kok.content.import-dir`의 YAML 파일에서 가져온다. 형식: [docs/content-format.md](docs/content-format.md)

## 실행

테스트는 Docker(Testcontainers)가 필요하다.

```bash
cd backend
gradle test
```
