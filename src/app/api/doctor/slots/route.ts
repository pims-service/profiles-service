import { NextResponse } from "next/server";
import { db, admin } from "@/lib/firebaseAdmin";
import { calculateProfileScore } from "@/lib/ranking";

// Create availability slot
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { profileId, startTime } = body;

    if (!profileId || !startTime) {
      return NextResponse.json(
        { success: false, error: "Profile ID and start time are required." },
        { status: 400 }
      );
    }

    const isMockMode = !process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY.includes("your-private-key");

    const start = new Date(startTime);
    const end = new Date(start);
    end.setHours(start.getHours() + 1); // 1 hour slot default

    if (isMockMode) {
      console.warn("⚠️ Running create slot in offline mock mode.");
      return NextResponse.json({
        success: true,
        slot: {
          id: "mock-new-slot-id",
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          isBooked: false,
        }
      });
    }

    const docRef = db.collection("psychiatrists").doc(profileId);
    const slotRef = docRef.collection("availability").doc();

    const slotData = {
      id: slotRef.id,
      startTime: admin.firestore.Timestamp.fromDate(start),
      endTime: admin.firestore.Timestamp.fromDate(end),
      isBooked: false,
    };

    await slotRef.set(slotData);

    // Update profile ranking score since availability slots count increased!
    const refreshedSnap = await docRef.get();
    if (refreshedSnap.exists) {
      const refreshedProfile = refreshedSnap.data()!;
      const reviewsSnap = await docRef.collection("reviews").get();
      const availabilitySnap = await docRef.collection("availability").get();

      const reviews = reviewsSnap.docs.map(r => r.data());
      const availability = availabilitySnap.docs.map(a => a.data());

      const score = calculateProfileScore({
        ...refreshedProfile,
        reviews,
        availability,
      });

      await docRef.update({ searchScore: score });
    }

    return NextResponse.json({
      success: true,
      slot: {
        ...slotData,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("🚨 Create Slot Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create availability slot." },
      { status: 500 }
    );
  }
}

// Delete availability slot
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get("slotId");
    const profileId = searchParams.get("profileId");

    if (!slotId || !profileId) {
      return NextResponse.json(
        { success: false, error: "slotId and profileId are required." },
        { status: 400 }
      );
    }

    const isMockMode = !process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY.includes("your-private-key");

    if (isMockMode) {
      console.warn("⚠️ Running delete slot in offline mock mode.");
      return NextResponse.json({
        success: true,
        message: "Availability slot deleted successfully.",
      });
    }

    const docRef = db.collection("psychiatrists").doc(profileId);
    const slotRef = docRef.collection("availability").doc(slotId);
    const slotSnap = await slotRef.get();

    if (!slotSnap.exists) {
      return NextResponse.json(
        { success: false, error: "Slot not found." },
        { status: 404 }
      );
    }

    const slot = slotSnap.data()!;
    if (slot.isBooked) {
      return NextResponse.json(
        { success: false, error: "Cannot delete a booked session slot." },
        { status: 400 }
      );
    }

    await slotRef.delete();

    // Recalculate ranking score
    const refreshedSnap = await docRef.get();
    if (refreshedSnap.exists) {
      const refreshedProfile = refreshedSnap.data()!;
      const reviewsSnap = await docRef.collection("reviews").get();
      const availabilitySnap = await docRef.collection("availability").get();

      const reviews = reviewsSnap.docs.map(r => r.data());
      const availability = availabilitySnap.docs.map(a => a.data());

      const score = calculateProfileScore({
        ...refreshedProfile,
        reviews,
        availability,
      });

      await docRef.update({ searchScore: score });
    }

    return NextResponse.json({
      success: true,
      message: "Availability slot deleted successfully.",
    });
  } catch (error: any) {
    console.error("🚨 Delete Slot Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete slot." },
      { status: 500 }
    );
  }
}
