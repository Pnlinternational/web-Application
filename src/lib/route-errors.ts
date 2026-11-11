import { notFound } from "@tanstack/react-router";
import { isNotFoundError } from "@/api/errors";

/** In loaders: turn an API 404 into the router's notFound() so the route's notFoundComponent renders. */
export async function orNotFound<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (isNotFoundError(error)) throw notFound();
    throw error;
  }
}
