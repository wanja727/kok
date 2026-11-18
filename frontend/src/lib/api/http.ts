import { ApiError, type KokApi, type LessonSummary, type SubmissionResult, type SubmitRequest, type TodayCheck } from "./types";

/*
 * 실제 백엔드 클라이언트. /api 요청은 next.config의 rewrites가 Spring으로 보낸다 (같은 도메인, ADR-010).
 * 로그인은 아직 임시다: 백엔드의 kok.auth.dev-header=true일 때 X-Dev-User-Id 헤더로 사용자를 정한다.
 * 카카오 로그인과 Redis 세션이 붙으면 이 헤더를 빼고 세션 쿠키만 쓴다.
 */
const devUserId = process.env.NEXT_PUBLIC_DEV_USER_ID;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body) headers.set("Content-Type", "application/json");
  if (devUserId) headers.set("X-Dev-User-Id", devUserId);

  const response = await fetch(path, { ...init, headers, credentials: "same-origin" });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const problem = (await response.json()) as { detail?: string };
      if (problem.detail) detail = problem.detail;
    } catch {
      // 본문이 JSON이 아니면 상태 문구만 쓴다
    }
    throw new ApiError(response.status, detail);
  }
  return (await response.json()) as T;
}

export const httpApi: KokApi = {
  todayChecks: () => request<TodayCheck[]>("/api/me/delayed-checks/today"),
  lessons: () => request<LessonSummary[]>("/api/lessons"),
  submit: (body: SubmitRequest) =>
    request<SubmissionResult>("/api/submissions", { method: "POST", body: JSON.stringify(body) }),
};
