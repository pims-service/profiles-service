import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
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

    const isMockMode = !process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY.includes("your-private-key");

    if (isMockMode) {
      console.warn("⚠️ Running doctor profile update in offline mock mode.");
      return NextResponse.json({
        success: true,
        data: {
          id: profileId,
          clinicName: clinicName || "Manhattan Integrative Psychiatry",
          address: address || "120 Broadway, Suite 1400",
          city: city || "New York",
          state: state || "NY",
          zipCode: zipCode || "10005",
          sessionFormat: sessionFormat || "TELEHEALTH",
          sessionFee: parseFloat(sessionFee) || 320,
          slidingScale: !!slidingScale,
          introVideoUrl: introVideoUrl || null,
          bioFull: bioFull || "",
          searchScore: 95,
        }
      });
    }

    const docRef = db.collection("psychiatrists").doc(profileId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Profile not found." },
        { status: 404 }
      );
    }

    const profile = docSnap.data()!;

    // Perform updates
    const updatedData = {
      clinicName: clinicName || profile.clinicName,
      address: address || profile.address,
      city: city || profile.city,
      state: state || profile.state,
      zipCode: zipCode || profile.zipCode,
      sessionFormat: sessionFormat || profile.sessionFormat,
      sessionFee: parseFloat(sessionFee) || profile.sessionFee,
      slidingScale: slidingScale !== undefined ? !!slidingScale : profile.slidingScale,
      introVideoUrl: introVideoUrl !== undefined ? introVideoUrl : (profile.introVideoUrl || null),
      bioFull: bioFull || profile.bioFull,
      lastActive: new Date(), // Set active timestamp
    };

    await docRef.update(updatedData);

    // Fetch refreshed complete state for score recalculation
    const refreshedSnap = await docRef.get();
    const refreshedProfile = refreshedSnap.data()!;

    const reviewsSnap = await docRef.collection("reviews").get();
    const availabilitySnap = await docRef.collection("availability").get();

    const reviews = reviewsSnap.docs.map(r => r.data());
    const availability = availabilitySnap.docs.map(a => a.data());

    // Calculate score
    const updatedScore = calculateProfileScore({
      ...refreshedProfile,
      reviews,
      availability,
    });

    // Write final score
    await docRef.update({ searchScore: updatedScore });

    const finalizedProfile = {
      ...refreshedProfile,
      searchScore: updatedScore,
    };

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
