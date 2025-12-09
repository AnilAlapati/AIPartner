/**
 * Simple error logging utility for production monitoring
 */

export interface ErrorLog {
  timestamp: string;
  error: string;
  stack?: string;
  context?: Record<string, any>;
  userAgent: string;
}

export const logError = (
  error: Error | string,
  context?: Record<string, any>
) => {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    error: typeof error === "string" ? error : error.message,
    stack: error instanceof Error ? error.stack : undefined,
    context,
    userAgent: navigator.userAgent,
  };

  // Log to console for Firebase Functions to capture
  console.error("[Client Error]", JSON.stringify(errorLog));

  // Store in localStorage for debugging (keep last 50 errors)
  try {
    const stored = localStorage.getItem("error_logs") || "[]";
    const logs: ErrorLog[] = JSON.parse(stored);
    logs.unshift(errorLog);
    localStorage.setItem("error_logs", JSON.stringify(logs.slice(0, 50)));
  } catch (e) {
    console.error("Failed to store error log", e);
  }

  // TODO: Send to external monitoring service (e.g., Sentry, LogRocket)
  // if (import.meta.env.PROD) {
  //   fetch('/api/log-error', {
  //     method: 'POST',
  //     body: JSON.stringify(errorLog)
  //   }).catch(() => {});
  // }
};

export const getErrorLogs = (): ErrorLog[] => {
  try {
    const stored = localStorage.getItem("error_logs") || "[]";
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const clearErrorLogs = () => {
  localStorage.removeItem("error_logs");
};
