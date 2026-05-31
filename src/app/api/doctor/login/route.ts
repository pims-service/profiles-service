import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

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

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
    if (!apiKey || apiKey === "your-api-key" || apiKey === "mock-api-key") {
      // Mock login for offline testing if credentials are not configured
      if (email.endsWith("@pims.com") && (password === "Password123!" || password === "AdminPass123!")) {
        const isAdmin = email === "admin@pims.com";
        return NextResponse.json({
          success: true,
          user: {
            id: isAdmin ? "admin-uid" : "doctor-uid",
            email,
            name: isAdmin ? "Dr. Sarah Jenkins" : "Dr. Marcus Keller",
            role: isAdmin ? "ADMIN" : "PSYCHIATRIST",
            profileId: isAdmin ? null : "doctor-uid",
            verificationStatus: "APPROVED",
          },
          mock: true
        });
      }
      return NextResponse.json(
        { success: false, error: "Firebase credentials not configured. Please fill in .env.local file." },
        { status: 400 }
      );
    }

    // Call Firebase Auth REST API to verify password
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      return NextResponse.json(
        { success: false, error: data.error?.message || "Invalid email or password records." },
        { status: 401 }
      );
    }

    const uid = data.localId;

    // Fetch user details from Firestore
    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json(
        { success: false, error: "User profile record not found." },
        { status: 404 }
      );
    }

    const userData = userSnap.data();
    const role = userData?.role || "PATIENT";

    if (role !== "PSYCHIATRIST" && role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "This credential does not possess administrative or provider privileges." },
        { status: 403 }
      );
    }

    // Fetch psychiatrist profile details if provider
    let profileId = null;
    let verificationStatus = null;

    if (role === "PSYCHIATRIST") {
      const profileSnap = await db.collection("psychiatrists").doc(uid).get();
      if (profileSnap.exists) {
        const profileData = profileSnap.data();
        profileId = profileData?.id || uid;
        verificationStatus = profileData?.verificationStatus || "PENDING";
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: uid,
        email: data.email,
        name: userData?.name || data.displayName || "Clinical Provider",
        role,
        profileId,
        verificationStatus,
        idToken: data.idToken,
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
