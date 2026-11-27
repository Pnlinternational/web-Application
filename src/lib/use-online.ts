import { onlineManager } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

/** Same signal React Query uses to pause fetching while offline. */
export function useOnline() {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
  );
}
