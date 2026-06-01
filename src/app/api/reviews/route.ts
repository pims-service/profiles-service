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

    const ratingInt = parseInt(rating);
    if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be a whole number between 1 and 5." },
        { status: 400 }
      );
    }

    if (comment.length > 1000) {
      return NextResponse.json(
        { success: false, error: "Comment must be under 1000 characters." },
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

    // 1. Check if psychiatrist exists
    const docRef = db.collection("psychiatrists").doc(psychiatristId);
    if (!isMockMode) {
      const doctorCheck = await docRef.get();
      if (!doctorCheck.exists) {
        return NextResponse.json(
          { success: false, error: "Target provider does not exist." },
          { status: 404 }
        );
      }
    }

    // 2. Create the new review in the subcollection
    const reviewRef = docRef.collection("reviews").doc();

    const reviewData = {
      id: reviewRef.id,
      psychiatristId,
      patientName,
      rating: ratingInt,
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
  } catch (error) {
    console.error("🚨 Review API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during review operation." },
      { status: 500 }
    );
  }
}
