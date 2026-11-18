/*
 * 백엔드 API 응답·요청 형식. backend의 record와 같게 둔다.
 * - QuestionView: content/QuestionView.java
 * - TodayCheck: learning/DelayedCheckController.TodayCheck
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
  /** 1 = 3일 뒤 확인, 2 = 7일 뒤 확인 */
  attemptNo: number;
  dueDate: string;
  question: QuestionView;
}

export interface LessonSummary {
  id: number;
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

export interface KokApi {
  todayChecks(): Promise<TodayCheck[]>;
  lessons(): Promise<LessonSummary[]>;
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
