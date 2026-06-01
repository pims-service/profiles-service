import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebaseAdmin";
import { calculateProfileScore } from "@/lib/ranking";
import { resolveCoordinates } from "@/app/api/doctor/register/route";
import * as geofire from "geofire-common";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      profileId,
      name,
      licenseType, licenseState, licenseNumber, npiNumber,
      clinicName, address, city, state, zipCode,
      sessionFormat, sessionFee, slidingScale, introVideoUrl, bioFull,
      bioPreview, headshotUrl, websiteUrl, linkedinUrl, twitterUrl,
      specialties, treatmentModalities, targetDemographics, languages
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
          licenseType: licenseType || "MD",
          licenseState: licenseState || "NY",
          licenseNumber: licenseNumber || "NY-MD-884920",
          npiNumber: npiNumber || "1928374650",
          bioPreview: bioPreview || "Dr. Marcus Keller is a board-certified psychiatrist...",
          headshotUrl: headshotUrl || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=250&auto=format&fit=crop",
          websiteUrl: websiteUrl || null,
          linkedinUrl: linkedinUrl || null,
          twitterUrl: twitterUrl || null,
          specialties: Array.isArray(specialties) ? JSON.stringify(specialties) : (specialties || "[]"),
          treatmentModalities: Array.isArray(treatmentModalities) ? JSON.stringify(treatmentModalities) : (treatmentModalities || "[]"),
          targetDemographics: Array.isArray(targetDemographics) ? JSON.stringify(targetDemographics) : (targetDemographics || "[]"),
          languages: Array.isArray(languages) ? JSON.stringify(languages) : (languages || "[]"),
          user: { name: name || "Dr. Marcus Keller", email: "dr.keller@pims.com" }
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

    // Perform Uniqueness Checks for NPI and License (excluding self)
    const newNpi = npiNumber !== undefined ? npiNumber.toString().trim() : profile.npiNumber;
    const newLicense = licenseNumber !== undefined ? licenseNumber.toString().trim() : profile.licenseNumber;

    if (newNpi && newNpi !== profile.npiNumber) {
      const npiQuery = await db.collection("psychiatrists").where("npiNumber", "==", newNpi).limit(1).get();
      if (!npiQuery.empty) {
        return NextResponse.json({ success: false, error: "A provider with this NPI number is already registered in our system." }, { status: 400 });
      }
    }

    if (newLicense && newLicense !== profile.licenseNumber) {
      const licenseQuery = await db.collection("psychiatrists").where("licenseNumber", "==", newLicense).limit(1).get();
      if (!licenseQuery.empty) {
        return NextResponse.json({ success: false, error: "A provider with this License number is already registered in our system." }, { status: 400 });
      }
    }

    // Perform User Display Name updates
    if (name) {
      try {
        await Promise.all([
          db.collection("users").doc(profile.userId).update({ name }),
          auth.updateUser(profile.userId, { displayName: name })
        ]);
      } catch (authError) {
        console.error("Auth User profile name updates failed:", authError);
      }
    }

    // Perform updates
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedData: any = {
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
      lastActive: new Date(),

      licenseType: licenseType || profile.licenseType,
      licenseState: licenseState || profile.licenseState,
      licenseNumber: licenseNumber || profile.licenseNumber,
      npiNumber: npiNumber || profile.npiNumber,
      bioPreview: bioPreview !== undefined ? bioPreview : profile.bioPreview,
      headshotUrl: headshotUrl || profile.headshotUrl,
      websiteUrl: websiteUrl !== undefined ? websiteUrl : profile.websiteUrl,
      linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : profile.linkedinUrl,
      twitterUrl: twitterUrl !== undefined ? twitterUrl : profile.twitterUrl,
      specialties: specialties ? (Array.isArray(specialties) ? JSON.stringify(specialties) : specialties) : profile.specialties,
      treatmentModalities: treatmentModalities ? (Array.isArray(treatmentModalities) ? JSON.stringify(treatmentModalities) : treatmentModalities) : profile.treatmentModalities,
      targetDemographics: targetDemographics ? (Array.isArray(targetDemographics) ? JSON.stringify(targetDemographics) : targetDemographics) : profile.targetDemographics,
      languages: languages ? (Array.isArray(languages) ? JSON.stringify(languages) : languages) : profile.languages,
    };

    // Geospatial Coordinates & Geohash recalculation
    if (city !== profile.city || state !== profile.state) {
      const { latitude, longitude } = resolveCoordinates(city || profile.city, state || profile.state);
      updatedData.latitude = latitude;
      updatedData.longitude = longitude;
      updatedData.geohash = geofire.geohashForLocation([latitude, longitude]);
    }

    await docRef.update(updatedData);

    // Fetch refreshed complete state, reviews, availability, and users metadata in parallel
    // to recalculate score and return finalized info in a single network round-trip.
    const [refreshedSnap, reviewsSnap, availabilitySnap, userSnap] = await Promise.all([
      docRef.get(),
      docRef.collection("reviews").get(),
      docRef.collection("availability").get(),
      db.collection("users").doc(profile.userId).get()
    ]);

    const refreshedProfile = refreshedSnap.data()!;
    const reviews = reviewsSnap.docs.map(r => r.data());
    const availability = availabilitySnap.docs.map(a => a.data());
    const userData = userSnap.data();

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
      user: {
        name: userData?.name || name || "Clinical Provider",
        email: userData?.email || "",
      }
    };

    return NextResponse.json({
      success: true,
      data: finalizedProfile,
    });
  } catch (error) {
    console.error("🚨 Doctor Profile Update Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update psychiatrist profile details." },
      { status: 500 }
    );
  }
}
