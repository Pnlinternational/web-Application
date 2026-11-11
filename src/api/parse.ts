import type { z } from "zod";
import { ParseError } from "./errors";

/** Validates a response body so backend shape changes fail loudly instead of rendering garbage. */
export function parseResponse<T>(schema: z.ZodType<T>, data: unknown, endpoint: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ParseError(endpoint, result.error.issues);
  }
  return result.data;
}
