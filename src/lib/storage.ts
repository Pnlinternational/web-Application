import type { z } from "zod";
import { logger } from "./logger";

// Versioned, schema-validated localStorage. Storage can throw (private mode, quota, blocked
// cookies), so every access is guarded and the app keeps working with in-memory state.
interface StoredValue {
  v: number;
  data: unknown;
}

export interface PersistedValue<T> {
  read(): T | null;
  write(value: T): void;
  clear(): void;
}

export function createPersistedValue<T>(options: {
  key: string;
  version: number;
  schema: z.ZodType<T>;
}): PersistedValue<T> {
  const { key, version, schema } = options;

  return {
    read() {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw === null) return null;

        const stored = JSON.parse(raw) as StoredValue;
        if (stored.v !== version) return null;

        const result = schema.safeParse(stored.data);
        if (!result.success) {
          logger.warn(`Discarding invalid persisted value "${key}"`, {
            issues: result.error.issues,
          });
          return null;
        }
        return result.data;
      } catch (error) {
        logger.warn(`Could not read persisted value "${key}"`, { error });
        return null;
      }
    },
    write(value) {
      try {
        window.localStorage.setItem(
          key,
          JSON.stringify({ v: version, data: value } satisfies StoredValue),
        );
      } catch (error) {
        logger.warn(`Could not persist value "${key}"`, { error });
      }
    },
    clear() {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        logger.warn(`Could not clear persisted value "${key}"`, { error });
      }
    },
  };
}
