// Every POST must be safe to repeat: the API returns the first result for a key instead of
// doing the work twice. Make the key once when the user acts, and reuse it on every retry.
export interface Idempotent<T> {
  data: T;
  idempotencyKey: string;
}

export function createIdempotencyKey() {
  return crypto.randomUUID();
}

/** Call at the moment the user acts (submit/tap); mutation retries reuse the same variables. */
export function withIdempotencyKey<T>(data: T): Idempotent<T> {
  return { data, idempotencyKey: createIdempotencyKey() };
}
