import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { psychiatristId, slotId, patientName, patientEmail, patientPhone, insurance } = body;

    if (!psychiatristId || !slotId || !patientName || !patientEmail || !patientPhone) {
      return NextResponse.json(
        { success: false, error: "Missing mandatory booking fields." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(patientEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address format." },
        { status: 400 }
      );
    }

    const isMockMode = !process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY.includes("your-private-key");

    if (isMockMode) {
      console.warn("⚠️ Running booking API in offline mock mode.");
      return NextResponse.json({
        success: true,
        booking: {
          id: "mock-booking-id",
          psychiatristId,
          slotId,
          patientName,
          patientEmail,
          patientPhone,
          insurance,
          status: "PENDING",
          createdAt: new Date(),
        }
      });
    }

    // 1. Use an atomic transaction to prevent double booking race conditions
    const docRef = db.collection("psychiatrists").doc(psychiatristId);
    const slotRef = docRef.collection("availability").doc(slotId);
    const bookingRef = docRef.collection("bookings").doc();

    const bookingData = {
      id: bookingRef.id,
      psychiatristId,
      slotId,
      patientName,
      patientEmail,
      patientPhone,
      insurance: insurance || null,
      status: "PENDING",
      createdAt: new Date(),
    };

    try {
      await db.runTransaction(async (transaction) => {
        const slotSnap = await transaction.get(slotRef);
        if (!slotSnap.exists) {
          throw new Error("Selected slot does not exist.");
        }
        if (slotSnap.data()?.isBooked) {
          throw new Error("Selected slot is already booked.");
        }
        
        transaction.update(slotRef, { isBooked: true });
        transaction.set(bookingRef, bookingData);
      });
    } catch (txError) {
      const error = txError as Error;
      return NextResponse.json(
        { success: false, error: error.message || "Failed to book slot." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: bookingData,
    });
  } catch (error) {
    console.error("🚨 Booking API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during booking transaction." },
      { status: 500 }
    );
  }
}
