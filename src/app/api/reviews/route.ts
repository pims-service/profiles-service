import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { calculateProfileScore } from "@/lib/ranking";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { psychiatristId, patientName, rating, comment } = body;

    if (!psychiatristId || !patientName || !rating || !comment) {
      return NextResponse.json(
        { success: false, error: "Missing mandatory review fields." },
        { status: 400 }
      );
    }

    const isMockMode = !process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY.includes("your-private-key");

    if (isMockMode) {
      console.warn("⚠️ Running reviews API in offline mock mode.");
      return NextResponse.json({
        success: true,
        review: {
          id: "mock-review-id",
          psychiatristId,
          patientName,
          rating: parseInt(rating),
          comment,
          createdAt: new Date(),
        }
      });
    }

    // 1. Create the new review in the subcollection
    const docRef = db.collection("psychiatrists").doc(psychiatristId);
    const reviewRef = docRef.collection("reviews").doc();

    const reviewData = {
      id: reviewRef.id,
      psychiatristId,
      patientName,
      rating: parseInt(rating),
      comment,
      isApproved: true,
      createdAt: new Date(),
    };

    await reviewRef.set(reviewData);

    // 2. Dynamically fetch and recalculate the doctor's ranking score in Firestore
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      const refreshedProfile = docSnap.data()!;
      const reviewsSnap = await docRef.collection("reviews").get();
      const availabilitySnap = await docRef.collection("availability").get();

      const reviews = reviewsSnap.docs.map(r => r.data());
      const availability = availabilitySnap.docs.map(a => a.data());

      const updatedScore = calculateProfileScore({
        ...refreshedProfile,
        reviews,
        availability,
      });

      await docRef.update({ searchScore: updatedScore });
    }

    return NextResponse.json({
      success: true,
      review: reviewData,
    });
  } catch (error: any) {
    console.error("🚨 Review API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during review operation." },
      { status: 500 }
    );
  }
}
