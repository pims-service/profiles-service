import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateProfileScore } from "@/lib/ranking";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      profileId,
      clinicName, address, city, state, zipCode,
      sessionFormat, sessionFee, slidingScale, introVideoUrl, bioFull
    } = body;

    if (!profileId) {
      return NextResponse.json(
        { success: false, error: "Missing doctor profile ID identifier." },
        { status: 400 }
      );
    }

    // 1. Fetch current profile
    const profile = await prisma.psychiatristProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Profile not found." },
        { status: 404 }
      );
    }

    // 2. Perform updates
    const updatedProfile = await prisma.psychiatristProfile.update({
      where: { id: profileId },
      data: {
        clinicName: clinicName || profile.clinicName,
        address: address || profile.address,
        city: city || profile.city,
        state: state || profile.state,
        zipCode: zipCode || profile.zipCode,
        sessionFormat: sessionFormat || profile.sessionFormat,
        sessionFee: parseFloat(sessionFee) || profile.sessionFee,
        slidingScale: slidingScale !== undefined ? !!slidingScale : profile.slidingScale,
        introVideoUrl: introVideoUrl !== undefined ? introVideoUrl : profile.introVideoUrl,
        bioFull: bioFull || profile.bioFull,
        lastActive: new Date(), // Set active timestamp
      },
      include: {
        reviews: true,
        availability: true,
      },
    });

    // 3. Recalculate Search score!
    const updatedScore = calculateProfileScore(updatedProfile);
    const finalizedProfile = await prisma.psychiatristProfile.update({
      where: { id: profileId },
      data: { searchScore: updatedScore },
    });

    return NextResponse.json({
      success: true,
      data: finalizedProfile,
    });
  } catch (error: any) {
    console.error("🚨 Doctor Profile Update Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update psychiatrist profile details." },
      { status: 500 }
    );
  }
}
