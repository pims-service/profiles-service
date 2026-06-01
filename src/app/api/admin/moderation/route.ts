import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { calculateProfileScore } from "@/lib/ranking";
import { resolveCoordinates } from "@/app/api/doctor/register/route";
import * as geofire from "geofire-common";

// Get admin statistics and all doctor profiles
export async function GET() {
  try {
    const isMockMode = !process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY.includes("your-private-key");

    if (isMockMode) {
      console.warn("⚠️ Running admin moderation API in offline mock mode.");
      // Return offline mock profiles to preview UI
      const mockDocs = [
        {
          id: "doctor-uid",
          userId: "doctor-uid",
          licenseType: "MD",
          licenseState: "NY",
          licenseNumber: "NY-MD-884920",
          npiNumber: "1928374650",
          isVerified: true,
          verificationStatus: "APPROVED",
          clinicName: "Manhattan Integrative Psychiatry",
          city: "New York",
          state: "NY",
          zipCode: "10005",
          sessionFee: 320,
          searchScore: 95,
          headshotUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=250&auto=format&fit=crop",
          bioPreview: "Dr. Keller is a board-certified psychiatrist with over 15 years of experience specializing in adult ADHD and complex mood disorders.",
          user: { name: "Dr. Marcus Keller", email: "dr.keller@pims.com" },
          reviews: [{ id: "r1", rating: 5 }],
          isSuspended: false,
        },
        {
          id: "doctor-pending-uid",
          userId: "doctor-pending-uid",
          licenseType: "MD",
          licenseState: "TX",
          licenseNumber: "TX-MD-883719",
          npiNumber: "1028374910",
          isVerified: false,
          verificationStatus: "PENDING",
          clinicName: "Austin Psychiatric Wellness",
          city: "Austin",
          state: "TX",
          zipCode: "78701",
          sessionFee: 240,
          searchScore: 60,
          headshotUrl: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=250&auto=format&fit=crop",
          bioPreview: "Dr. Hargrove is a newly registering psychiatrist in Austin focusing on young adults, college mental health, and integrative ADHD management.",
          user: { name: "Dr. Lisa Hargrove", email: "dr.hargrove@pims.com" },
          reviews: [],
          isSuspended: false,
        }
      ];

      return NextResponse.json({
        success: true,
        stats: { total: 2, pending: 1, approved: 1, rejected: 0, suspended: 0 },
        data: mockDocs,
      });
    }

    const psychiatristsSnap = await db.collection("psychiatrists").get();
    const usersSnap = await db.collection("users").get();
    const usersMap = new Map(usersSnap.docs.map(doc => [doc.id, doc.data()]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profiles: any[] = [];
    for (const doc of psychiatristsSnap.docs) {
      const data = doc.data();
      const userData = usersMap.get(data.userId);

      // Fetch reviews for rating calculation
      const reviewsSnap = await db.collection("psychiatrists").doc(doc.id).collection("reviews").get();
      const reviews = reviewsSnap.docs.map(r => r.data());

      profiles.push({
        ...data,
        user: {
          name: userData?.name || "Clinical Provider",
          email: userData?.email || "",
        },
        reviews,
      });
    }

    // Sort by createdAt descending
    profiles.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    const stats = {
      total: profiles.length,
      pending: profiles.filter(p => p.verificationStatus === "PENDING").length,
      approved: profiles.filter(p => p.verificationStatus === "APPROVED").length,
      rejected: profiles.filter(p => p.verificationStatus === "REJECTED").length,
      suspended: profiles.filter(p => p.isSuspended).length,
    };

    return NextResponse.json({
      success: true,
      stats,
      data: profiles,
    });
  } catch (error) {
    console.error("🚨 Admin Moderation API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load directory moderation list." },
      { status: 500 }
    );
  }
}

// Approve or Reject or Suspend a profile
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { profileId, action, reason } = body; // action: "APPROVE" | "REJECT" | "TOGGLE_SUSPEND"

    if (!profileId || !action) {
      return NextResponse.json(
        { success: false, error: "profileId and action are required." },
        { status: 400 }
      );
    }

    const isMockMode = !process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY.includes("your-private-key");

    if (isMockMode) {
      console.warn("⚠️ Running admin moderation PUT in offline mock mode.");
      return NextResponse.json({
        success: true,
        data: {
          id: profileId,
          clinicName: "Manhattan Integrative Psychiatry",
          licenseType: "MD",
          licenseState: "NY",
          licenseNumber: "NY-MD-884920",
          npiNumber: "1928374650",
          verificationStatus: action === "APPROVE" ? "APPROVED" : action === "REJECT" ? "REJECTED" : "PENDING",
          isVerified: action === "APPROVE",
          isSuspended: action === "TOGGLE_SUSPEND" ? true : false,
          rejectionReason: action === "REJECT" ? reason : null,
          city: "New York",
          state: "NY",
          zipCode: "10005",
          sessionFee: 320,
          searchScore: 95,
          headshotUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=250&auto=format&fit=crop",
          bioPreview: "Dr. Keller is a board-certified psychiatrist with over 15 years of experience specializing in adult ADHD and complex mood disorders.",
          user: { name: "Dr. Marcus Keller", email: "dr.keller@pims.com" },
          reviews: [],
        }
      });
    }

    const docRef = db.collection("psychiatrists").doc(profileId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Profile record not found." },
        { status: 404 }
      );
    }

    const currentProfile = docSnap.data()!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updatedData: any = {};

    if (action === "APPROVE") {
      const city = currentProfile.city || "New York";
      const state = currentProfile.state || "NY";
      const { latitude, longitude } = resolveCoordinates(city, state);
      const hashValue = geofire.geohashForLocation([latitude, longitude]);

      updatedData = {
        verificationStatus: "APPROVED",
        isVerified: true,
        rejectionReason: null,
        latitude,
        longitude,
        geohash: hashValue,
      };
    } else if (action === "REJECT") {
      updatedData = {
        verificationStatus: "REJECTED",
        isVerified: false,
        rejectionReason: reason || "Credentials verification failed. Please check state board registry entries.",
      };
    } else if (action === "TOGGLE_SUSPEND") {
      updatedData = {
        isSuspended: !currentProfile.isSuspended,
      };
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action specifier." },
        { status: 400 }
      );
    }

    // Write primary updates
    await docRef.update(updatedData);

    // Fetch refreshed complete state for score recalculation
    const refreshedSnap = await docRef.get();
    const refreshedProfile = refreshedSnap.data()!;

    const reviewsSnap = await docRef.collection("reviews").get();
    const availabilitySnap = await docRef.collection("availability").get();

    const reviews = reviewsSnap.docs.map(r => r.data());
    const availability = availabilitySnap.docs.map(a => a.data());

    // Calculate score
    const finalScore = calculateProfileScore({
      ...refreshedProfile,
      reviews,
      availability,
    });

    // Write final score
    await docRef.update({ searchScore: finalScore });

    const userSnap = await db.collection("users").doc(refreshedProfile.userId).get();
    const userData = userSnap.data();

    const finalizedProfile = {
      ...refreshedProfile,
      ...updatedData,
      searchScore: finalScore,
      user: {
        name: userData?.name || "Clinical Provider",
        email: userData?.email || "",
      },
      reviews,
    };

    return NextResponse.json({
      success: true,
      data: finalizedProfile,
    });
  } catch (error) {
    console.error("🚨 Admin Action Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to execute moderation action." },
      { status: 500 }
    );
  }
}
