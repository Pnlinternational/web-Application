// Adapter seam: swap the console sink for Sentry/Datadog via setLogger() at startup.
export type LogContext = Record<string, unknown>;

export interface Logger {
  error(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
}

const consoleLogger: Logger = {
  error: (message, context) => console.error(message, context ?? ""),
  warn: (message, context) => console.warn(message, context ?? ""),
  info: (message, context) => console.info(message, context ?? ""),
};

let sink: Logger = consoleLogger;

export function setLogger(next: Logger) {
  sink = next;
}

export const logger: Logger = {
  error: (message, context) => sink.error(message, context),
  warn: (message, context) => sink.warn(message, context),
  info: (message, context) => sink.info(message, context),
};
