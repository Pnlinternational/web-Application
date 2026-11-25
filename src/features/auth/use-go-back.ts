import { useCanGoBack, useRouter } from "@tanstack/react-router";

/** Goes back in history, or to `fallback` when there is nothing to go back to (e.g. a fresh tab). */
export function useGoBack(fallback: string) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  return function goBack() {
    if (canGoBack) router.history.back();
    else void router.navigate({ href: fallback });
  };
}
