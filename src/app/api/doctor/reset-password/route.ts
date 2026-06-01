import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
    if (!apiKey || apiKey === "your-api-key" || apiKey === "mock-api-key") {
      // Mock mode: just return success to simulate the email being sent.
      return NextResponse.json({
        success: true,
        message: "Mock Mode: Password reset link has been simulated.",
      });
    }

    // Call Firebase Auth REST API to send password reset email
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
    });

    const data = await res.json();
    
    // We return success even if the email doesn't exist to prevent email enumeration attacks
    if (!res.ok && data.error?.message !== "EMAIL_NOT_FOUND") {
      console.error("🚨 Password Reset Error from Firebase:", data.error);
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("🚨 Doctor Password Reset API Error:", error);
    // Generic error to prevent leaking info
    return NextResponse.json(
      { success: true, message: "If an account exists, a password reset link has been sent." }
    );
  }
}
