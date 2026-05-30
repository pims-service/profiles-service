import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

// Helper to save base64 video pitch into the public local filesystem
export function saveBase64Video(base64Data: string): string | null {
  try {
    if (!base64Data || base64Data.trim() === "") return null;

    // Detect format from standard base64 prefix
    const matches = base64Data.match(/^data:(video\/[a-zA-Z0-9]+);base64,(.+)$/);
    let rawBase64 = base64Data;
    let extension = "webm";

    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      rawBase64 = matches[2];
      extension = mimeType.split("/")[1] || "webm";
    } else if (base64Data.includes("http://") || base64Data.includes("https://")) {
      // Already a direct URL link, do not decode/offload
      return base64Data;
    }

    const buffer = Buffer.from(rawBase64, "base64");
    const uuidFilename = `${crypto.randomBytes(16).toString("hex")}.${extension}`;
    
    // Resolve public uploads path
    const uploadDir = path.join(process.cwd(), "public", "uploads", "videos");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uploadPath = path.join(uploadDir, uuidFilename);
    fs.writeFileSync(uploadPath, buffer);
    
    // Return relative URL that Next.js serves statically
    return `/uploads/videos/${uuidFilename}`;
  } catch (error) {
    console.error("Failed to decode and save practitioner intro video:", error);
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

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    // 1. Resolve geographic coordinates dynamically
    const { latitude, longitude } = resolveCoordinates(city, state);

    // Hash Password
    const passwordHash = crypto.createHash("sha256").update(password).digest("hex");

    // Process and optimize base64 video upload offloading
    let resolvedVideoUrl = null;
    if (introVideoUrl) {
      resolvedVideoUrl = saveBase64Video(introVideoUrl);
    }

    // Database transactional creation
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: "PSYCHIATRIST",
        },
      });

      const profile = await tx.psychiatristProfile.create({
        data: {
          userId: user.id,
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
        },
      });

      return { user, profile };
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("🚨 Doctor Register API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create psychiatrist registration." },
      { status: 500 }
    );
  }
}
