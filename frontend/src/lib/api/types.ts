/*
 * 백엔드 API 응답·요청 형식. backend의 record와 같게 둔다.
 * - QuestionView: content/QuestionView.java
 * - TodayCheck, ConceptStatus: learning/DelayedCheckController
 * - LessonSummary: content/LessonQueryService.LessonSummary
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
  /** 레슨의 판정 문제. 정답과 해설은 담지 않는다 */
  lessonQuestions(lessonId: number): Promise<QuestionView[]>;
  /** 풀어 본 개념의 진행 상태 */
  concepts(): Promise<ConceptStatus[]>;
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
