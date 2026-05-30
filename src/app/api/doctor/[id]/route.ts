import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const doctor = await prisma.psychiatristProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
        },
        availability: {
          orderBy: { startTime: "asc" },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Psychiatrist profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: doctor,
    });
  } catch (error: any) {
    console.error("🚨 Doctor Detail API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load doctor profile." },
      { status: 500 }
    );
  }
}
