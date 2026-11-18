import { isCorrect } from "../grading";
import type { KokApi, LessonSummary, QuestionView, SubmissionResult, TodayCheck } from "./types";

/*
 * 백엔드 없이 화면을 개발하는 목 API. 응답 형식은 실제 API와 같다.
 * 문제 내용은 예시다. 실제 문제 원본은 dev-lessons의 YAML 파일이다.
 */

interface MockQuestion extends QuestionView {
  answer: string;
  explanation: string;
  sourceUrl: string | null;
}

const questions: MockQuestion[] = [
  {
    questionVersionId: 101,
    conceptId: 11,
    type: "MULTIPLE_CHOICE",
    body: "아래 코드를 실행하면 SELECT는 모두 몇 번 실행될까요?",
    code: [
      "// 팀 10개, 각 팀의 members는 LAZY",
      "List<Team> teams = teamRepository.findAll();",
      "for (Team t : teams) {",
      "    t.getMembers().size();",
      "}",
    ].join("\n"),
    choices: ["1번", "2번", "10번", "11번"],
    answer: "4",
    explanation:
      "팀 목록을 가져오는 SELECT 1번에, 팀마다 members를 읽는 SELECT가 10번 더 나가요. 목록 1번에 항목마다 N번, 그래서 N+1이에요.",
    sourceUrl: "https://docs.jboss.org/hibernate/orm/6.6/userguide/html_single/Hibernate_User_Guide.html#fetching",
  },
  {
    questionVersionId: 102,
    conceptId: 12,
    type: "LINE_PICK",
    body: "트랜잭션 없이 실행되는 호출이 있는 줄을 고르세요.",
    code: [
      "@Service",
      "class CouponService {",
      "  void issueAll(List<User> users) {",
      "    users.forEach(this::issue);",
      "  }",
      "  @Transactional",
      "  void issue(User u) { /* 발급 */ }",
      "}",
    ].join("\n"),
    choices: null,
    answer: "4",
    explanation:
      "this::issue는 같은 클래스 안의 호출이라 프록시를 거치지 않아요. 그래서 issue()의 @Transactional이 적용되지 않아요.",
    sourceUrl:
      "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html",
  },
  {
    questionVersionId: 103,
    conceptId: 13,
    type: "OX",
    body: "SQL 표준의 REPEATABLE READ 격리 수준은 팬텀 리드를 막는다.",
    code: null,
    choices: null,
    answer: "X",
    explanation:
      "SQL 표준에서 REPEATABLE READ는 팬텀 리드를 허용하고, SERIALIZABLE만 막아요. MySQL InnoDB와 PostgreSQL은 구현 방식 덕분에 REPEATABLE READ에서도 대부분 막아 주지만, 표준이 보장하는 것은 아니에요.",
    sourceUrl: "https://www.postgresql.org/docs/current/transaction-iso.html",
  },
];

const conceptNames: Record<number, string> = {
  11: "JPA · N+1 문제",
  12: "Spring · @Transactional 자기 호출",
  13: "DB · 격리 수준과 팬텀 리드",
};

const attempts: Record<number, number> = { 11: 1, 12: 1, 13: 2 };

const lessons: LessonSummary[] = [
  { id: 1, unit: "JPA", title: "N+1 문제", questionCount: 8 },
  { id: 2, unit: "Spring", title: "@Transactional 자기 호출", questionCount: 8 },
  { id: 3, unit: "DB", title: "격리 수준과 팬텀 리드", questionCount: 8 },
];

/** 같은 clientSubmissionId로 다시 보내면 처음 결과를 돌려준다 (백엔드와 같은 규칙) */
const submitted = new Map<string, SubmissionResult>();
let nextSubmissionId = 1;

function view(q: MockQuestion): QuestionView {
  const { answer: _answer, explanation: _explanation, sourceUrl: _sourceUrl, ...rest } = q;
  void _answer;
  void _explanation;
  void _sourceUrl;
  return rest;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), 150));
}

export const mockApi: KokApi = {
  todayChecks: () =>
    delay<TodayCheck[]>(
      questions.map((q) => ({
        conceptId: q.conceptId,
        conceptName: conceptNames[q.conceptId],
        attemptNo: attempts[q.conceptId],
        dueDate: today(),
        question: view(q),
      })),
    ),

  lessons: () => delay(lessons),

  submit: async (request) => {
    const existing = submitted.get(request.clientSubmissionId);
    if (existing) return delay(existing);

    const q = questions.find((it) => it.questionVersionId === request.questionVersionId);
    if (!q) throw new Error("없는 문제다");

    const result: SubmissionResult = {
      submissionId: nextSubmissionId++,
      correct: isCorrect(q.type, request.selected, q.answer),
      selected: request.selected,
      answer: q.answer,
      confidence: request.confidence,
      explanation: q.explanation,
      sourceUrl: q.sourceUrl,
      delayedCheck: request.mode === "DELAYED_CHECK",
    };
    submitted.set(request.clientSubmissionId, result);
    return delay(result);
  },
};
