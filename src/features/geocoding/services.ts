import type { Market } from "@/lib/phone";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeocodedAddress {
  street: string;
  area: string;
  region: string;
  /** ISO country code, or null when the point isn't in a country we know. */
  country: Market | "other";
}

export interface GeocodingService {
  /** null when there's no address for the point (sea, desert, no data). */
  reverse(coordinates: Coordinates): Promise<GeocodedAddress | null>;
}

// Rough bounding boxes, enough for the stub to tell Nigeria, Ghana and elsewhere apart.
const BOXES: Record<Market, { south: number; north: number; west: number; east: number }> = {
  NG: { south: 4.2, north: 13.9, west: 2.7, east: 14.7 },
  GH: { south: 4.7, north: 11.2, west: -3.3, east: 1.2 },
};

const SAMPLE: Record<Market, Omit<GeocodedAddress, "country">> = {
  NG: { street: "12 Sample Street", area: "Ikeja", region: "Lagos" },
  GH: { street: "12 Sample Street", area: "Osu", region: "Greater Accra" },
};

function countryAt({ latitude, longitude }: Coordinates): Market | "other" {
  for (const [market, box] of Object.entries(BOXES) as [Market, (typeof BOXES)[Market]][]) {
    if (
      latitude >= box.south &&
      latitude <= box.north &&
      longitude >= box.west &&
      longitude <= box.east
    ) {
      return market;
    }
  }
  return "other";
}

/**
 * Stub: no geocoding provider is chosen yet (a paid provider or key needs sign-off). Returns a
 * sample address for points in Nigeria or Ghana, a foreign result elsewhere, and nothing at 0,0
 * ("null island"). Nothing leaves the browser. Swap in a real provider behind this interface.
 */
export function getGeocodingService(): GeocodingService {
  return {
    async reverse(coordinates) {
      if (coordinates.latitude === 0 && coordinates.longitude === 0) return null;
      const country = countryAt(coordinates);
      if (country === "other") return { street: "", area: "", region: "", country };
      return { ...SAMPLE[country], country };
    },
  };
}
