"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export type Remote<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : "불러오지 못했어요";
}

/**
 * 마운트할 때 한 번 불러오고, retry로 다시 불러온다.
 * 첫 상태가 이미 loading이라 effect 안에서는 결과가 왔을 때만 상태를 바꾼다.
 */
export function useRemote<T>(fetcher: () => Promise<T>): [Remote<T>, () => void] {
  const [state, setState] = useState<Remote<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    fetcher()
      .then((data) => alive && setState({ status: "ready", data }))
      .catch((e: unknown) => alive && setState({ status: "error", message: messageOf(e) }));
    return () => {
      alive = false;
    };
  }, [fetcher, attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return [state, retry];
}

const noopSubscribe = () => () => {};

/** 브라우저에서만 알 수 있는 값. 서버 렌더에서는 serverValue를 쓰고, 하이드레이션 뒤에 브라우저 값으로 바뀐다 */
export function useClientValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(noopSubscribe, read, () => serverValue);
}
