import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    // 1. Verify and update calendar slot to booked
    const slot = await prisma.availabilitySlot.findFirst({
      where: {
        id: slotId,
        psychiatristId,
        isBooked: false,
      },
    });

    if (!slot) {
      return NextResponse.json(
        { success: false, error: "Selected slot is unavailable or already booked." },
        { status: 400 }
      );
    }

    // 2. Perform transactional update
    const [booking] = await prisma.$transaction([
      prisma.booking.create({
        data: {
          psychiatristId,
          slotId,
          patientName,
          patientEmail,
          patientPhone,
          insurance,
          status: "PENDING",
        },
      }),
      prisma.availabilitySlot.update({
        where: { id: slotId },
        data: { isBooked: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error: any) {
    console.error("🚨 Booking API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during booking transaction." },
      { status: 500 }
    );
  }
}
