/*
 * 백엔드 API 응답·요청 형식. backend의 record와 같게 둔다.
 * - QuestionView: content/QuestionView.java
 * - TodayCheck, ConceptStatus: learning/DelayedCheckController
 * - LessonSummary, LessonDetail: content/LessonQueryService
 * - Report: learning/ReportController.Report
 * - Me: auth/MeController.Me
 * - LessonSteps: content/file/LessonSteps (콘텐츠 파일의 steps를 그대로 준다)
 * - SubmitRequest / SubmissionResult: learning/SubmitRequest.java, learning/SubmissionResult.java
 */

export type QuestionType = "MULTIPLE_CHOICE" | "OX" | "CODE_PREDICT" | "LINE_PICK" | "DESCRIPTIVE";

export type Confidence = "SURE" | "UNSURE" | "UNKNOWN";

export type SubmissionMode = "LESSON" | "DELAYED_CHECK";

/** 답을 내기 전에 보여주는 문제. 정답과 해설은 담지 않는다 (답 먼저) */
export interface QuestionView {
  questionVersionId: number;
  conceptId: number;
  type: QuestionType;
  body: string;
  code: string | null;
  choices: string[] | null;
}

/** 오늘 확인할 개념과, 개념마다 처음과 다른 문제 하나 */
export interface TodayCheck {
  conceptId: number;
  conceptName: string;
  /** 이번 확인 전까지 통과한 확인 수(1~3). 1 = 3일, 2 = 7일, 3 = 21일 확인. 4가 되면 졸업 */
  attemptNo: number;
  dueDate: string;
  /** 배운 날 기준(같은 날 3번 정답)을 통과한 날 */
  learnedOn: string | null;
  /** 지난 확인에서 확실했는데 틀려서 다음 날 다시 묻는 개념. 목록 맨 앞에 온다 */
  sureWrong: boolean;
  question: QuestionView;
  /** 마지막(21일) 확인일 때만. 판정 문제를 맞혀 졸업한 뒤 동료에게 가르치듯 말해 볼 질문 (자기 채점, 판정에 쓰지 않음) */
  teach: TeachPrompt | null;
}

export interface TeachPrompt {
  questionVersionId: number;
  body: string;
  /** 말했는지 바로 판단할 수 있는 항목 */
  checklist: string[];
}

/** 풀어 본 개념의 진행 상태 */
export interface ConceptStatus {
  conceptId: number;
  conceptName: string;
  lessonId: number;
  lessonTitle: string;
  /** 통과한 확인 수. 0 = 배우는 중, 4 = 졸업 */
  stage: number;
  graduated: boolean;
  learnedOn: string | null;
  dueDate: string | null;
  sureWrong: boolean;
  graduatedAt: string | null;
}

export interface LessonSummary {
  id: number;
  /** dev-lessons의 레슨 slug. 레슨 본문 주소에 쓴다 */
  key: string;
  unit: string;
  title: string;
  questionCount: number;
}

/** 레슨 하나. steps가 null이면 본문이 아직 앱에 없다 (레슨 사이트로 연결한다) */
export interface LessonDetail extends LessonSummary {
  steps: LessonSteps | null;
}

/**
 * 레슨 본문 7단계: 예측 → 배경 → 실습 → 함정 → 해결 → 확인 → 면접 답변.
 * 확인 단계는 레슨의 판정 문제를 푼다. text는 빈 줄로 문단, **굵게**, `코드`만 쓴다.
 * 여기 정답은 본문 안의 연습이라 판정에 쓰지 않는다.
 */
export interface LessonSteps {
  predict: { question: string; text: string | null; code: string | null; choices: string[]; answer: number };
  background: ExplainStep;
  practice: {
    title: string;
    text: string;
    code: string | null;
    runs: { call: string; note: string | null; choices: string[]; answer: number; output: string }[];
    after: string | null;
  };
  pitfall: ExplainStep;
  fix: ExplainStep;
  interview: { question: string; points: { label: string; text: string }[] };
}

export interface ExplainStep {
  title: string;
  text: string;
  code: string | null;
  codeNote: string | null;
  /** 번호 붙은 단계 목록 (도식 대신) */
  flow: string[] | null;
  /** 다른 방법과 주의할 점 */
  alternatives: { title: string; note: string }[] | null;
  /** 다음 단계를 여는 장치. 둘 중 하나만 있다 */
  quiz: { question: string; choices: string[]; answer: number } | null;
  recall: { prompt: string; answer: string } | null;
}

/** "나" 화면의 프로필. joinedOn은 가입한 서비스 날짜, days는 가입한 날을 1일째로 센 오늘 */
export interface Me {
  id: number;
  nickname: string;
  joinedOn: string;
  days: number;
}

/** 맞힌 수와 전체 수. 비율은 화면이 계산한다 (표본이 적은지 함께 보여주려고) */
export interface Rate {
  correct: number;
  total: number;
}

/** 기록 화면. 모두 실제 풀이·확인 기록에서 센 값이다 */
export interface Report {
  today: string;
  /** 배운 날(레슨에서 낸 답)과 3·7·21일 재확인의 정답률 */
  curve: { learnedDay: Rate; day3: Rate; day7: Rate; day21: Rate };
  /** 개념의 단계별 수 */
  stages: { learning: number; passed1: number; passed2: number; passed3: number; graduated: number };
  /** 지금까지 낸 답 수 */
  retrievals: number;
  /** 확실 → 애매 → 모름 순서 */
  confidence: ({ confidence: Confidence } & Rate)[];
  /** 지난 확인에서 확실했는데 틀린 개념 수 */
  sureWrong: number;
  /** 최근 26주 동안 답을 낸 날과 그날 낸 답 수. 답이 없는 날은 빠진다 */
  activity: { date: string; count: number }[];
}

export interface SubmitRequest {
  /** 화면이 문제마다 만드는 UUID. 같은 값으로 다시 보내면 처음 결과를 돌려받는다 */
  clientSubmissionId: string;
  questionVersionId: number;
  /** 객관식·코드 예측: 보기 번호(1부터). OX: O 또는 X. 줄 고르기: "4" 또는 "7,8" */
  selected: string;
  confidence: Confidence;
  mode: SubmissionMode;
}

/** 답을 낸 뒤에야 받는 결과. 정답과 해설은 여기서 처음 보인다 */
export interface SubmissionResult {
  submissionId: number;
  correct: boolean;
  selected: string;
  answer: string;
  confidence: Confidence;
  explanation: string;
  sourceUrl: string | null;
  delayedCheck: boolean;
}

export interface RetrievoApi {
  todayChecks(): Promise<TodayCheck[]>;
  lessons(): Promise<LessonSummary[]>;
  lesson(lessonId: number): Promise<LessonDetail>;
  /** 레슨의 판정 문제. 정답과 해설은 담지 않는다 */
  lessonQuestions(lessonId: number): Promise<QuestionView[]>;
  /** 풀어 본 개념의 진행 상태 */
  concepts(): Promise<ConceptStatus[]>;
  report(): Promise<Report>;
  me(): Promise<Me>;
  submit(request: SubmitRequest): Promise<SubmissionResult>;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
