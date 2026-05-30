import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
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

    // 1. Create the new review
    const review = await prisma.review.create({
      data: {
        psychiatristId,
        patientName,
        rating: parseInt(rating),
        comment,
      },
    });

    // 2. Dynamically fetch and recalculate the doctor's ranking score in the database!
    const doctor = await prisma.psychiatristProfile.findUnique({
      where: { id: psychiatristId },
      include: {
        reviews: true,
        availability: true,
      },
    });

    if (doctor) {
      const updatedScore = calculateProfileScore(doctor);
      await prisma.psychiatristProfile.update({
        where: { id: psychiatristId },
        data: { searchScore: updatedScore },
      });
    }

    return NextResponse.json({
      success: true,
      review,
    });
  } catch (error: any) {
    console.error("🚨 Review API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during review operation." },
      { status: 500 }
    );
  }
}
