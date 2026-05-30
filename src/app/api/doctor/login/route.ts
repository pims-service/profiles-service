import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password records." },
        { status: 401 }
      );
    }

    const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
    if (user.passwordHash !== passwordHash) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password records." },
        { status: 401 }
      );
    }

    if (user.role !== "PSYCHIATRIST") {
      return NextResponse.json(
        { success: false, error: "This credential does not possess provider privileges." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileId: user.profile?.id,
        verificationStatus: user.profile?.verificationStatus,
      },
    });
  } catch (error: any) {
    console.error("🚨 Doctor Login API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during login operation." },
      { status: 500 }
    );
  }
}
