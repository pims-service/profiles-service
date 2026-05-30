import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name, email, password,
      licenseType, licenseState, licenseNumber, npiNumber,
      clinicName, address, city, state, zipCode,
      specialties, treatmentModalities, targetDemographics, languages,
      bioPreview, bioFull, headshotUrl, sessionFormat, sessionFee, slidingScale
    } = body;

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    // Set fallback mock coordinates based on city or default (e.g. SF: 37.7749, NY: 40.7128)
    let latitude = 40.7128;
    let longitude = -74.0060;
    if (city.toLowerCase() === "los angeles" || state.toLowerCase() === "ca") {
      latitude = 34.0522;
      longitude = -118.2437;
    } else if (city.toLowerCase() === "boston" || state.toLowerCase() === "ma") {
      latitude = 42.3601;
      longitude = -71.0589;
    } else if (city.toLowerCase() === "houston" || state.toLowerCase() === "tx") {
      latitude = 29.7604;
      longitude = -95.3698;
    }

    // Transaction to create User + Profile
    const passwordHash = crypto.createHash("sha256").update(password).digest("hex");

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
          headshotUrl: headshotUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=250&auto=format&fit=crop",
          sessionFormat: sessionFormat || "TELEHEALTH",
          sessionFee: parseFloat(sessionFee || "200"),
          slidingScale: !!slidingScale,
          acceptedInsurances: JSON.stringify(["Aetna", "Cigna"]), // Default seed
          searchScore: 50, // Base starting score
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
      { success: false, error: "Failed to create psychiatrist registration record." },
      { status: 500 }
    );
  }
}
