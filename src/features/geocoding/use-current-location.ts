import { useState } from "react";
import { logger } from "@/lib/logger";
import type { Market } from "@/lib/phone";
import { type GeocodedAddress, getGeocodingService } from "./services";

export type LocationStatus =
  | "idle"
  | "locating"
  | "found"
  | "denied"
  | "timeout"
  | "unavailable"
  | "no_result"
  | "out_of_country";

const TIMEOUT_MS = 10_000;

function getPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: TIMEOUT_MS,
      maximumAge: 60_000,
    });
  });
}

function statusForError(error: unknown): LocationStatus {
  if (
    typeof GeolocationPositionError !== "undefined" &&
    error instanceof GeolocationPositionError
  ) {
    if (error.code === error.PERMISSION_DENIED) return "denied";
    if (error.code === error.TIMEOUT) return "timeout";
    return "unavailable";
  }
  // Plain objects in some browsers (and tests): same numeric codes.
  const code = (error as { code?: number } | null)?.code;
  if (code === 1) return "denied";
  if (code === 3) return "timeout";
  return "unavailable";
}

/**
 * "Use my current location": asks for permission only when `locate()` runs (on click), then
 * reverse-geocodes. Resolves with the address, or null with `status` saying why not. Every
 * failure leaves manual entry working.
 */
export function useCurrentLocation(market: Market) {
  const [status, setStatus] = useState<LocationStatus>("idle");

  async function locate(): Promise<GeocodedAddress | null> {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("unavailable");
      return null;
    }
    setStatus("locating");
    try {
      const { coords } = await getPosition();
      const address = await getGeocodingService().reverse(coords);
      if (!address) {
        setStatus("no_result");
        return null;
      }
      if (address.country !== market) {
        setStatus("out_of_country");
        return null;
      }
      setStatus("found");
      return address;
    } catch (error) {
      const next = statusForError(error);
      if (next === "unavailable") logger.warn("Location lookup failed", { error });
      setStatus(next);
      return null;
    }
  }

  return { status, locate, reset: () => setStatus("idle") };
}
