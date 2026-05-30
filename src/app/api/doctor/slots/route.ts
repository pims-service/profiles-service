import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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

    const start = new Date(startTime);
    const end = new Date(start);
    end.setHours(start.getHours() + 1); // 1 hour slot default

    // Create the slot
    const slot = await prisma.availabilitySlot.create({
      data: {
        psychiatristId: profileId,
        startTime: start,
        endTime: end,
        isBooked: false,
      },
    });

    // Update profile ranking score since availability slots count increased!
    const doctor = await prisma.psychiatristProfile.findUnique({
      where: { id: profileId },
      include: { reviews: true, availability: true },
    });

    if (doctor) {
      const score = calculateProfileScore(doctor);
      await prisma.psychiatristProfile.update({
        where: { id: profileId },
        data: { searchScore: score },
      });
    }

    return NextResponse.json({
      success: true,
      slot,
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

    // Verify slot is not booked before deleting
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      return NextResponse.json(
        { success: false, error: "Slot not found." },
        { status: 404 }
      );
    }

    if (slot.isBooked) {
      return NextResponse.json(
        { success: false, error: "Cannot delete a booked session slot." },
        { status: 400 }
      );
    }

    await prisma.availabilitySlot.delete({
      where: { id: slotId },
    });

    // Recalculate ranking score
    const doctor = await prisma.psychiatristProfile.findUnique({
      where: { id: profileId },
      include: { reviews: true, availability: true },
    });

    if (doctor) {
      const score = calculateProfileScore(doctor);
      await prisma.psychiatristProfile.update({
        where: { id: profileId },
        data: { searchScore: score },
      });
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
