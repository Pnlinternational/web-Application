import { describe, expect, it } from "vite-plus/test";
import { getGeocodingService } from "./services";

describe("stub geocoder", () => {
  const geocoder = getGeocodingService();

  it("tells Nigeria, Ghana and elsewhere apart", async () => {
    expect((await geocoder.reverse({ latitude: 6.6, longitude: 3.35 }))?.country).toBe("NG");
    expect((await geocoder.reverse({ latitude: 5.6, longitude: -0.19 }))?.country).toBe("GH");
    expect((await geocoder.reverse({ latitude: 51.5, longitude: -0.12 }))?.country).toBe("other");
  });

  it("has no address at 0,0", async () => {
    expect(await geocoder.reverse({ latitude: 0, longitude: 0 })).toBeNull();
  });
});
