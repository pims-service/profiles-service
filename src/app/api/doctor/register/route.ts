import { NextResponse } from "next/server";
import { auth as adminAuth, db as adminDb, storage as adminStorage } from "@/lib/firebaseAdmin";
import * as crypto from "crypto";
import * as geofire from "geofire-common";

// Helper to save base64 video to Cloud Storage for Firebase (Stateless & Global)
export async function saveBase64VideoToCloud(base64Data: string): Promise<string | null> {
  try {
    if (!base64Data || base64Data.trim() === "") return null;

    // Detect format from standard base64 prefix
    const matches = base64Data.match(/^data:(video\/[a-zA-Z0-9]+);base64,(.+)$/);
    let rawBase64 = base64Data;
    let extension = "webm";
    let mimeType = "video/webm";

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      rawBase64 = matches[2];
      extension = mimeType.split("/")[1] || "webm";
    } else if (base64Data.includes("http://") || base64Data.includes("https://")) {
      // Already a direct URL
      return base64Data;
    }

    const buffer = Buffer.from(rawBase64, "base64");
    const uuidFilename = `${crypto.randomBytes(16).toString("hex")}.${extension}`;

    const bucket = adminStorage.bucket();
    const file = bucket.file(`videos/${uuidFilename}`);
    
    await file.save(buffer, {
      metadata: { contentType: mimeType },
      public: true,
    });
    
    return `https://storage.googleapis.com/${bucket.name}/${file.name}`;
  } catch (error) {
    console.error("Failed to upload base64 video to Firebase storage:", error);
    return null;
  }
}

// Helper to dynamically resolve coordinates of cities in US/PK
export function resolveCoordinates(city: string, state: string): { latitude: number; longitude: number } {
  let latitude = 40.7128;
  let longitude = -74.0060;
  
  const cityLower = city.toLowerCase().trim();
  const stateLower = state.toLowerCase().trim();

  // Pakistani Cities Coordinates Resolution
  if (cityLower === "karachi") {
    latitude = 24.8607;
    longitude = 67.0011;
  } else if (cityLower === "lahore") {
    latitude = 31.5204;
    longitude = 74.3587;
  } else if (cityLower === "islamabad") {
    latitude = 33.6844;
    longitude = 73.0479;
  } else if (cityLower === "rawalpindi") {
    latitude = 33.5651;
    longitude = 73.0169;
  } else if (cityLower === "peshawar") {
    latitude = 34.0151;
    longitude = 71.5249;
  } else if (cityLower === "quetta") {
    latitude = 30.1798;
    longitude = 66.9750;
  } else if (cityLower === "faisalabad") {
    latitude = 31.4504;
    longitude = 73.1350;
  } else if (cityLower === "multan") {
    latitude = 30.1575;
    longitude = 71.5249;
  }
  // US Cities Coordinate Fallbacks
  else if (cityLower === "los angeles" || stateLower === "ca") {
    latitude = 34.0522;
    longitude = -118.2437;
  } else if (cityLower === "boston" || stateLower === "ma") {
    latitude = 42.3601;
    longitude = -71.0589;
  } else if (cityLower === "houston" || stateLower === "tx") {
    latitude = 29.7604;
    longitude = -95.3698;
  } else if (cityLower === "chicago" || stateLower === "il") {
    latitude = 41.8781;
    longitude = -87.6298;
  } else if (cityLower === "miami" || stateLower === "fl") {
    latitude = 25.7645;
    longitude = -80.1920;
  } else if (cityLower === "seattle" || stateLower === "wa") {
    latitude = 47.6138;
    longitude = -122.3302;
  }

  return { latitude, longitude };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name, email, password,
      licenseType, licenseState, licenseNumber, npiNumber,
      clinicName, address, city, state, zipCode,
      specialties, treatmentModalities, targetDemographics, languages,
      bioPreview, bioFull, headshotUrl, sessionFormat, sessionFee, slidingScale,
      introVideoUrl, websiteUrl, linkedinUrl, twitterUrl
    } = body;

    const isMockMode = !process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY.includes("your-private-key");

    if (isMockMode) {
      console.warn("⚠️ Firebase Admin credentials are not configured. Running doctor registration in offline mock mode.");
      return NextResponse.json({
        success: true,
        data: {
          user: { id: "mock-new-doc-id", email, name, role: "PSYCHIATRIST" },
          profile: { id: "mock-new-doc-id", city, state, verificationStatus: "PENDING" }
        }
      });
    }

    // 1. Check duplicate email in Firebase Auth
    try {
      await adminAuth.getUserByEmail(email);
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 400 }
      );
    } catch (err: any) {
      // "auth/user-not-found" is what we want!
      if (err.code !== "auth/user-not-found") {
        throw err;
      }
    }

    // 2. Resolve geographic coordinates and geohash
    const { latitude, longitude } = resolveCoordinates(city, state);
    const hashValue = geofire.geohashForLocation([latitude, longitude]);

    // 3. Process webcam intro video pitch
    let resolvedVideoUrl = null;
    if (introVideoUrl) {
      resolvedVideoUrl = await saveBase64VideoToCloud(introVideoUrl);
    }

    // 4. Create User in Firebase Authentication
    const authUser = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });
    const uid = authUser.uid;

    // Set custom role claim for authorization
    await adminAuth.setCustomUserClaims(uid, { role: "PSYCHIATRIST" });

    // 4.1 Trigger Email Verification via REST API
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
    if (apiKey && apiKey !== "your-api-key" && apiKey !== "mock-api-key") {
      try {
        // Sign in briefly to get ID token
        const signInRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        });
        
        if (signInRes.ok) {
          const signInData = await signInRes.json();
          // Send verification email
          await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestType: "VERIFY_EMAIL", idToken: signInData.idToken }),
          });
        }
      } catch (emailErr) {
        console.error("Failed to trigger email verification:", emailErr);
      }
    }

    // 5. Database writes inside Firestore collections
    // Write user profile metadata
    await adminDb.collection("users").doc(uid).set({
      email,
      name,
      role: "PSYCHIATRIST",
      createdAt: new Date(),
    });

    // Write clinical psychiatric parameters
    const profileData = {
      id: uid,
      userId: uid,
      licenseType,
      licenseState,
      licenseNumber,
      npiNumber,
      isVerified: false,
      verificationStatus: "PENDING",
      clinicName,
      address,
      city,
      state,
      zipCode,
      latitude,
      longitude,
      geohash: hashValue,
      specialties: JSON.stringify(specialties || []),
      treatmentModalities: JSON.stringify(treatmentModalities || []),
      targetDemographics: JSON.stringify(targetDemographics || []),
      languages: JSON.stringify(languages || []),
      bioPreview: bioPreview || "",
      bioFull: bioFull || "",
      headshotUrl: headshotUrl || "https://images.unsplash.com/photo-1594824813573-246434de83fb?q=80&w=250&auto=format&fit=crop",
      sessionFormat: sessionFormat || "TELEHEALTH",
      sessionFee: parseFloat(sessionFee || "2000"),
      slidingScale: !!slidingScale,
      acceptedInsurances: JSON.stringify(["Cash Pay", "Private Insurance"]),
      searchScore: 50,
      introVideoUrl: resolvedVideoUrl,
      websiteUrl: websiteUrl || null,
      linkedinUrl: linkedinUrl || null,
      twitterUrl: twitterUrl || null,
      isSuspended: false,
      createdAt: new Date(),
    };

    await adminDb.collection("psychiatrists").doc(uid).set(profileData);

    return NextResponse.json({
      success: true,
      data: {
        user: { id: uid, email, name, role: "PSYCHIATRIST" },
        profile: profileData,
      },
    });
  } catch (error: any) {
    console.error("🚨 Doctor Register API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create psychiatrist registration." },
      { status: 500 }
    );
  }
}
