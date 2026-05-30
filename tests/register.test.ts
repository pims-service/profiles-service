import { test, describe } from "node:test";
import assert from "node:assert";
import * as fs from "fs";
import * as path from "path";
import { resolveCoordinates, saveBase64Video } from "../src/app/api/doctor/register/route";

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
  describe("Optimized Video Upload Offloader", () => {
    const mockBase64 = "data:video/webm;base64,ZXhhbXBsZXZpZGVvY2xpcA=="; // Decodes to "examplevideoclip"

    test("Should pass through standard HTTPS links directly", () => {
      const link = "https://www.youtube.com/watch?v=intro";
      const result = saveBase64Video(link);
      assert.strictEqual(result, link);
    });

    test("Should return null for empty payloads", () => {
      assert.strictEqual(saveBase64Video(""), null);
      assert.strictEqual(saveBase64Video("   "), null);
    });

    test("Should decode base64, save physical file on disk, and return relative path", () => {
      const resultUrl = saveBase64Video(mockBase64);
      
      // Assert result is in valid relative path format
      assert.ok(resultUrl);
      assert.ok(resultUrl.startsWith("/uploads/videos/"));
      assert.ok(resultUrl.endsWith(".webm"));

      // Assert physical file actually got written to filesystem
      const filename = path.basename(resultUrl);
      const filePath = path.join(process.cwd(), "public", "uploads", "videos", filename);
      assert.ok(fs.existsSync(filePath), `Physical file should exist at: ${filePath}`);

      // Verify file content decodes correctly
      const writtenContent = fs.readFileSync(filePath, "utf-8");
      assert.strictEqual(writtenContent, "examplevideoclip");

      // Cleanup generated testing mock file
      fs.unlinkSync(filePath);
    });
  });

});
