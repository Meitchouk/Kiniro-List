"use client";

// Global loading state management for fetch interceptor
type LoadingCallback = (key: string) => void;

let startLoadingCallback: LoadingCallback | null = null;
let stopLoadingCallback: LoadingCallback | null = null;
let requestCounter = 0;

export function setLoadingCallbacks(
  start: LoadingCallback,
  stop: LoadingCallback
) {
  startLoadingCallback = start;
  stopLoadingCallback = stop;
}

export function clearLoadingCallbacks() {
  startLoadingCallback = null;
  stopLoadingCallback = null;
}

// Wrapper fetch that triggers global loading
export async function fetchWithLoading(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const key = `fetch-${++requestCounter}`;
  
  try {
    startLoadingCallback?.(key);
    return await fetch(input, init);
  } finally {
    stopLoadingCallback?.(key);
  }
}
