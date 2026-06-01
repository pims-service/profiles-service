import { test, describe } from "node:test";
import assert from "node:assert";
import { PUT } from "../src/app/api/doctor/profile/route";

describe("Doctor Profile Update Endpoint Suite", () => {
  
  test("Should fail if profileId is missing", async () => {
    const req = new Request("http://localhost/api/doctor/profile", {
      method: "PUT",
      body: JSON.stringify({
        name: "Dr. Marcus Keller",
        clinicName: "Manhattan Integrative Psychiatry",
      }),
    });
    
    const res = await PUT(req);
    assert.strictEqual(res.status, 400);
    const json = await res.json();
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.error, "Missing doctor profile ID identifier.");
  });

  test("Should successfully process and return updated mock details in mock mode", async () => {
    const req = new Request("http://localhost/api/doctor/profile", {
      method: "PUT",
      body: JSON.stringify({
        profileId: "mock-doctor-uid",
        name: "Dr. Evelyn Chen",
        clinicName: "Pacific Mind & Wellness",
        city: "Beverly Hills",
        state: "CA",
        zipCode: "90211",
        sessionFormat: "TELEHEALTH",
        sessionFee: "350",
        slidingScale: true,
        specialties: ["PTSD", "Anxiety"],
        languages: ["English", "Mandarin"],
      }),
    });

    const res = await PUT(req);
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.data);
    
    // Assert returned structure and values
    assert.strictEqual(json.data.id, "mock-doctor-uid");
    assert.strictEqual(json.data.clinicName, "Pacific Mind & Wellness");
    assert.strictEqual(json.data.city, "Beverly Hills");
    assert.strictEqual(json.data.state, "CA");
    assert.strictEqual(json.data.zipCode, "90211");
    assert.strictEqual(json.data.sessionFormat, "TELEHEALTH");
    assert.strictEqual(json.data.sessionFee, 350);
    assert.strictEqual(json.data.slidingScale, true);
    
    // Check list field serialization in mock return format
    const specialties = JSON.parse(json.data.specialties);
    assert.deepStrictEqual(specialties, ["PTSD", "Anxiety"]);
    
    const languages = JSON.parse(json.data.languages);
    assert.deepStrictEqual(languages, ["English", "Mandarin"]);
    
    assert.strictEqual(json.data.user.name, "Dr. Evelyn Chen");
  });

});
