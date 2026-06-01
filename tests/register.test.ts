import { test, describe } from "node:test";
import assert from "node:assert";
import { resolveCoordinates, saveBase64VideoToCloud } from "../src/app/api/doctor/register/profile/route";

describe("Doctor Onboarding Verification Suite", () => {

  // 1. Assert Coordinate Resolution Mechanics
  describe("Geographic Coordinate Resolution", () => {
    test("Should correctly match Karachi PK coordinates", () => {
      const coords = resolveCoordinates("Karachi", "Sindh");
      assert.strictEqual(coords.latitude, 24.8607);
      assert.strictEqual(coords.longitude, 67.0011);
    });

    test("Should correctly match Lahore PK coordinates", () => {
      const coords = resolveCoordinates("  Lahore  ", " Punjab ");
      assert.strictEqual(coords.latitude, 31.5204);
      assert.strictEqual(coords.longitude, 74.3587);
    });

    test("Should correctly match Seattle US fallback coordinates", () => {
      const coords = resolveCoordinates("Seattle", "WA");
      assert.strictEqual(coords.latitude, 47.6138);
      assert.strictEqual(coords.longitude, -122.3302);
    });

    test("Should fall back to New York default coordinates for unknown queries", () => {
      const coords = resolveCoordinates("Unknown City", "Unknown State");
      assert.strictEqual(coords.latitude, 40.7128);
      assert.strictEqual(coords.longitude, -74.0060);
    });
  });

  // 2. Assert Optimized Video Saving Offloader
  describe("Optimized Video Upload Offloader to Firebase Cloud Storage", () => {
    const mockBase64 = "data:video/webm;base64,ZXhhbXBsZXZpZGVvY2xpcA==";

    test("Should pass through standard HTTPS links directly", async () => {
      const link = "https://www.youtube.com/watch?v=intro";
      const result = await saveBase64VideoToCloud(link);
      assert.strictEqual(result, link);
    });

    test("Should return null for empty payloads", async () => {
      const res1 = await saveBase64VideoToCloud("");
      const res2 = await saveBase64VideoToCloud("   ");
      assert.strictEqual(res1, null);
      assert.strictEqual(res2, null);
    });

    test("Should catch upload errors during offline test runs gracefully", async () => {
      const resultUrl = await saveBase64VideoToCloud(mockBase64);
      // Under mock firebase environment during unit test, it catches the storage save exception and returns null
      assert.strictEqual(resultUrl, null);
    });
  });

});
