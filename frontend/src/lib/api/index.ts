import { httpApi } from "./http";
import { mockApi } from "./mock";
import type { RetrievoApi } from "./types";

/**
 * NEXT_PUBLIC_API_MODE=http 이면 실제 백엔드, 그 밖에는 목 API를 쓴다.
 * 백엔드를 띄우지 않고도 화면을 개발할 수 있게 기본값은 목이다.
 */
export const apiMode: "http" | "mock" = process.env.NEXT_PUBLIC_API_MODE === "http" ? "http" : "mock";

export const api: RetrievoApi = apiMode === "http" ? httpApi : mockApi;

export * from "./types";
