import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateProfileScore } from "@/lib/ranking";
import { resolveCoordinates } from "@/app/api/doctor/register/route";

// Get admin statistics and all doctor profiles
export async function GET() {
  try {
    const profiles = await prisma.psychiatristProfile.findMany({
      include: {
        user: {
          select: { name: true, email: true },
        },
        reviews: true,
        availability: true,
      },
      orderBy: { createdAt: "desc" },
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
  } catch (error: any) {
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

    const currentProfile = await prisma.psychiatristProfile.findUnique({
      where: { id: profileId },
    });

    if (!currentProfile) {
      return NextResponse.json(
        { success: false, error: "Profile record not found." },
        { status: 404 }
      );
    }

    let updatedData: any = {};

    if (action === "APPROVE") {
      // Dynamic geospatial coordinate resolution on approval
      const city = currentProfile.city || "New York";
      const state = currentProfile.state || "NY";
      const { latitude, longitude } = resolveCoordinates(city, state);

      updatedData = {
        verificationStatus: "APPROVED",
        isVerified: true,
        rejectionReason: null,
        latitude,
        longitude,
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

    const updatedProfile = await prisma.psychiatristProfile.update({
      where: { id: profileId },
      data: updatedData,
      include: {
        reviews: true,
        availability: true,
      },
    });

    // Recalculate ranking score since verification state or suspension modified it!
    const finalScore = calculateProfileScore(updatedProfile);
    const finalizedProfile = await prisma.psychiatristProfile.update({
      where: { id: profileId },
      data: { searchScore: finalScore },
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    return NextResponse.json({
      success: true,
      data: finalizedProfile,
    });
  } catch (error: any) {
    console.error("🚨 Admin Action Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to execute moderation action." },
      { status: 500 }
    );
  }
}
