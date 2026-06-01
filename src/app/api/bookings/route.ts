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

    // 1. Verify and update calendar slot to booked
    const docRef = db.collection("psychiatrists").doc(psychiatristId);
    const slotRef = docRef.collection("availability").doc(slotId);
    const slotSnap = await slotRef.get();

    if (!slotSnap.exists || slotSnap.data()?.isBooked) {
      return NextResponse.json(
        { success: false, error: "Selected slot is unavailable or already booked." },
        { status: 400 }
      );
    }

    // 2. Perform updates in a batch transaction
    const bookingRef = docRef.collection("bookings").doc();
    const batch = db.batch();

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

    batch.set(bookingRef, bookingData);
    batch.update(slotRef, { isBooked: true });

    await batch.commit();

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
