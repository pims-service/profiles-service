import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const isMockMode = !process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY.includes("your-private-key");

    if (isMockMode) {
      console.warn(`⚠️ Running doctor detail API for id ${id} in offline mock mode.`);
      const isKeller = id === "doctor-uid";
      
      const mockKeller = {
        id: "doctor-uid",
        userId: "doctor-uid",
        licenseType: "MD",
        licenseState: "NY",
        licenseNumber: "NY-MD-884920",
        npiNumber: "1928374650",
        isVerified: true,
        verificationStatus: "APPROVED",
        clinicName: "Manhattan Integrative Psychiatry",
        address: "120 Broadway, Suite 1400",
        city: "New York",
        state: "NY",
        zipCode: "10005",
        latitude: 40.7078,
        longitude: -74.0115,
        geohash: "dr5rs",
        specialties: JSON.stringify(["ADHD", "Anxiety", "Depression", "Bipolar Disorder"]),
        treatmentModalities: JSON.stringify(["Medication Management", "CBT", "Psychodynamic Therapy"]),
        targetDemographics: JSON.stringify(["Adults", "Seniors"]),
        languages: JSON.stringify(["English", "German"]),
        bioPreview: "Dr. Keller is a board-certified psychiatrist with over 15 years of experience specializing in adult ADHD and complex mood disorders.",
        bioFull: "Dr. Marcus Keller is a graduate of Columbia University College of Physicians and Surgeons...",
        headshotUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=250&auto=format&fit=crop",
        introVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        sessionFormat: "HYBRID",
        sessionFee: 320.0,
        slidingScale: true,
        acceptedInsurances: JSON.stringify(["Aetna", "Blue Cross Blue Shield", "UnitedHealthcare"]),
        searchScore: 95,
        isSponsored: true,
        isSuspended: false,
        user: { name: "Dr. Marcus Keller", email: "dr.keller@pims.com" },
        reviews: [
          { id: "r1", patientName: "Alice M.", rating: 5, comment: "Incredibly understanding and professional.", createdAt: new Date() }
        ],
        availability: [
          { id: "s1", startTime: new Date(Date.now() + 86400000).toISOString(), endTime: new Date(Date.now() + 90000000).toISOString(), isBooked: false }
        ],
        bookings: []
      };

      return NextResponse.json({
        success: true,
        data: isKeller ? mockKeller : { ...mockKeller, id, userId: id },
      });
    }

    const docRef = db.collection("psychiatrists").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Psychiatrist profile not found." },
        { status: 404 }
      );
    }

    const profileData = docSnap.data()!;

    // Concurrently fetch all doctor profile subcollections and related metadata
    // to significantly cut down request latency and eliminate event loop block.
    const [userSnap, reviewsSnap, availabilitySnap, bookingsSnap] = await Promise.all([
      db.collection("users").doc(profileData.userId).get(),
      docRef.collection("reviews").get(),
      docRef.collection("availability").get(),
      docRef.collection("bookings").get(),
    ]);

    const userData = userSnap.data();

    // Fetch reviews
    const reviews: any[] = reviewsSnap.docs.map(r => {
      const rData = r.data();
      return {
        ...rData,
        createdAt: rData.createdAt?.toDate ? rData.createdAt.toDate().toISOString() : rData.createdAt,
      };
    });
    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Fetch availability
    const availability: any[] = availabilitySnap.docs.map(a => {
      const aData = a.data();
      return {
        ...aData,
        startTime: aData.startTime?.toDate ? aData.startTime.toDate().toISOString() : aData.startTime,
        endTime: aData.endTime?.toDate ? aData.endTime.toDate().toISOString() : aData.endTime,
      };
    });
    availability.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Fetch bookings
    const bookings: any[] = bookingsSnap.docs.map(b => {
      const bData = b.data();
      // Find matching slot for slot startTime preview
      const matchingSlot = availability.find(s => s.id === bData.slotId);
      return {
        ...bData,
        slot: {
          startTime: matchingSlot?.startTime || new Date().toISOString()
        }
      };
    });

    const combinedProfile = {
      ...profileData,
      user: {
        name: userData?.name || "Clinical Provider",
        email: userData?.email || "",
      },
      reviews,
      availability,
      bookings,
    };

    return NextResponse.json({
      success: true,
      data: combinedProfile,
    });
  } catch (error: any) {
    console.error("🚨 Doctor Detail API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load doctor profile." },
      { status: 500 }
    );
  }
}
