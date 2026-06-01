import { NextResponse } from "next/server";
import { auth as adminAuth } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    const isMockMode = !process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY.includes("your-private-key");

    if (isMockMode) {
      // In mock mode, we immediately return verified to allow the flow to proceed
      return NextResponse.json({
        success: true,
        emailVerified: true
      });
    }

    if (!uid) {
      return NextResponse.json({ success: false, error: "Missing uid parameter." }, { status: 400 });
    }

    const authUser = await adminAuth.getUser(uid);
    
    return NextResponse.json({
      success: true,
      emailVerified: authUser.emailVerified
    });

  } catch (error: unknown) {
    console.error("Verification Check API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to check verification status.";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
