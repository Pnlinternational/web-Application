import { z } from "zod";

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  override readonly name = "ApiError";
  readonly status: number;
  /** Machine-readable error code, e.g. "auth.invalid_credentials". */
  readonly code: string | undefined;
  /** Correlates this failure with the API's logs; include it in bug reports. */
  readonly requestId: string | undefined;
  readonly fieldErrors: FieldErrors;
  readonly details: unknown;

  constructor(init: {
    status: number;
    message: string;
    code?: string;
    requestId?: string;
    fieldErrors?: FieldErrors;
    details?: unknown;
  }) {
    super(init.message);
    this.status = init.status;
    this.code = init.code;
    this.requestId = init.requestId;
    this.fieldErrors = init.fieldErrors ?? {};
    this.details = init.details;
  }
}

export class NetworkError extends Error {
  override readonly name = "NetworkError";

  constructor(cause: unknown) {
    super("Network request failed", { cause });
  }
}

export class ParseError extends Error {
  override readonly name = "ParseError";
  readonly path: string;
  readonly issues: readonly z.core.$ZodIssue[];

  constructor(path: string, issues: readonly z.core.$ZodIssue[]) {
    super(`Unexpected response shape from ${path}`);
    this.path = path;
    this.issues = issues;
  }
}

export type HttpError = ApiError | NetworkError | ParseError;

// API error envelope:
// { "error": { "code": "auth.invalid_credentials", "message": "...", "request_id": "d076…" } }
// Anything else (proxies, gateways, HTML error pages) falls back to the status text.
const errorBodySchema = z.object({
  error: z.looseObject({
    code: z.string(),
    message: z.string(),
    request_id: z.string().optional(),
  }),
});

export function apiErrorFromResponse(response: {
  status: number;
  statusText?: string;
  data: unknown;
}): ApiError {
  const body = errorBodySchema.safeParse(response.data);

  if (!body.success) {
    return new ApiError({
      status: response.status,
      message: response.statusText || `Request failed with status ${response.status}`,
      details: response.data,
    });
  }

  const { code, message, request_id: requestId } = body.data.error;
  return new ApiError({
    status: response.status,
    message,
    code,
    requestId,
    details: response.data,
  });
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isNotFoundError(error: unknown) {
  return isApiError(error) && error.status === 404;
}

export function isUnauthorizedError(error: unknown) {
  return isApiError(error) && error.status === 401;
}

export function isRetryableError(error: unknown) {
  if (error instanceof NetworkError) return true;
  return isApiError(error) && error.status >= 500;
}

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

export function getErrorMessage(error: unknown) {
  if (error instanceof NetworkError) {
    return "We couldn't reach the server. Check your connection and try again.";
  }
  if (isUnauthorizedError(error)) {
    return "Your session has expired. Please sign in again.";
  }
  // 4xx messages come from the API and are meant for users; 5xx and bugs are not.
  if (isApiError(error) && error.status < 500) {
    return error.message;
  }
  return GENERIC_MESSAGE;
}
