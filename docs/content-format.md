# 문제 파일 형식

콕의 문제 원본은 콘텐츠 저장소의 YAML 파일이다. 개발 주제는 [dev-lessons](https://github.com/wanja727/dev-lessons)에 둔다. 파일 하나가 레슨 하나다. 앱은 시작할 때 이 파일들을 서비스 DB로 가져온다.

- 커밋 = 문제 버전, PR 리뷰 = 검수, CI = 형식 검사
- 주제와 상관없는 형식이다. 다른 영역(수학 등)도 같은 형식으로 각자의 콘텐츠 저장소에 둔다

## 예시

```yaml
subject:
  key: dev            # 주제 키. 영문 소문자·숫자·하이픈
  name: 개발자 면접

lesson:
  key: n-plus-1       # 레슨 키. dev-lessons의 레슨 slug와 같게 둔다
  title: N+1 문제
  unit: JPA           # 단원 이름
  order: 6            # 레슨 순서. 단원 순서는 가장 앞선 레슨의 순서를 따른다

concepts:             # 지연 확인은 개념 단위로 다른 문제를 골라 묻는다
  - key: lazy-loop
    name: 지연 로딩 컬렉션을 루프에서 읽을 때 생기는 추가 쿼리

questions:
  - key: lazy-loop-count
    concept: lazy-loop
    type: multiple_choice
    status: reviewed
    difficulty: 2
    body: 팀 10개를 조회한 뒤 각 팀의 members(LAZY)를 루프에서 읽으면 SELECT는 모두 몇 번일까?
    choices: [1번, 2번, 10번, 11번]
    answer: 4         # 보기 번호, 1부터
    explanation: 팀 목록 1번, 팀마다 members 1번씩 10번. 합쳐서 11번이다.
    source: https://docs.jboss.org/hibernate/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#fetching
```

## 문제 항목

| 항목 | 필수 | 설명 |
| --- | --- | --- |
| `key` | 예 | 레슨 안에서 고유. 가져올 때 `주제/레슨/키`가 전역 키가 된다. **한 번 정하면 바꾸지 않는다** (바꾸면 다른 문제로 본다) |
| `concept` | 예 | `concepts`의 키 |
| `type` | 예 | `multiple_choice`, `ox`, `code_predict`, `line_pick`, `descriptive` |
| `status` | 아니오 | `draft`(기본), `reviewed`, `hidden`. 사용자에게는 `reviewed`만 보인다 |
| `difficulty` | 예 | 1~3 |
| `body` | 예 | 질문 |
| `code` | 형태별 | 질문과 함께 보여줄 코드. 줄 고르기는 필수이고, 줄 번호는 적지 않는다 (화면이 붙인다) |
| `choices` | 형태별 | 객관식·코드 예측: 2개 이상 |
| `answer` | 형태별 | 객관식·코드 예측: 보기 번호(1부터). OX: `O` 또는 `X`. 줄 고르기: 줄 번호를 쉼표로 (`"7, 8"`) |
| `checklist` | 형태별 | 서술형: 자기 채점 항목 4~5개 권장 |
| `explanation` | 예 | 답을 낸 뒤에만 보여주는 해설 |
| `source` | 권장 | 근거(공식 문서 링크). 검수 완료 문제에 없으면 경고 |

## 형태와 용도

| type | 용도 | 채점 |
| --- | --- | --- |
| `multiple_choice` | 판정 | 자동 (보기 번호) |
| `ox` | 판정 | 자동 (O/X) |
| `code_predict` | 판정 | 자동 (보기 번호). 정답은 dev-lessons의 검증 테스트로 증명할 수 있다 |
| `line_pick` | 판정 | 자동 (고른 줄 번호 집합이 정답과 같아야 정답). 라인 고르기·버그 찾기 |
| `descriptive` | 연습 | 체크리스트 자기 채점 (4개 이상 정답 / 2~3개 부분 / 1개 이하 오답) |

- 용도는 형태에서 정해진다. 따로 적지 않는다
- 지연 확인(D+3, D+7)은 **판정 문제로만** 한다. 처음 푼 문제와 다른 문제를 내야 하므로 개념마다 검수 완료된 판정 문제가 2개 이상 있어야 한다. 모자라면 가져올 때 경고한다

## 형식 검사 (콘텐츠 저장소 CI)

검사 규칙은 이 저장소에 하나만 둔다. 콘텐츠 저장소의 CI는 이 저장소를 내려받아 검사기를 실행한다. 스프링과 DB 없이 돈다.

```bash
gradle -p kok/backend checkContent -PcontentDir=$PWD/content/questions
```

- 파일마다의 규칙(위 표)에 더해 파일 사이 충돌도 본다: 같은 레슨 키가 두 파일에 있음, 같은 주제 키에 이름이 다름
- 오류가 있으면 실패한다. 경고(지연 확인용 판정 문제 부족, 출처 없음 등)는 알려주기만 한다
- 앱도 시작할 때 같은 검사를 먼저 하고, 오류가 있으면 아무것도 가져오지 않는다

## 가져오기 규칙

- 같은 파일을 다시 가져와도 결과가 같다 (키로 기존 행을 찾는다)
- 문제 내용(질문, 코드, 보기, 정답, 해설, 체크리스트, 출처, 난이도, 형태)이 바뀌면 새 버전을 만든다. 이전 버전과 그 풀이 기록은 남는다
- 검수 상태나 순서만 바뀌면 새 버전을 만들지 않는다
- 파일에서 빠진 문제는 지우지 않고 숨긴다
- 오류가 하나라도 있으면 그 파일은 아무것도 가져오지 않고, 오류를 모두 알려준다. 모르는 항목(오타)도 오류다
