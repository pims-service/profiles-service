import { NextResponse } from "next/server";
import { auth as adminAuth } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    const isMockMode = !process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY.includes("your-private-key");

    if (isMockMode) {
      console.warn("⚠️ Firebase Admin credentials are not configured. Mocking account creation.");
      return NextResponse.json({
        success: true,
        uid: "mock-new-doc-id",
        mock: true
      });
    }

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }
    
    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters long for security." }, { status: 400 });
    }

    // 1. Check duplicate email in Firebase Auth
    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      // User exists. If they are already verified, maybe they abandoned the form?
      // We will return the UID, but we don't send the verification email again unless they are unverified.
      // But we don't have their password, so they need to log in to get ID token to verify.
      // Actually, if the account already exists, they should use the login page or we just let them resume if they are verified.
      if (existingUser.emailVerified) {
        return NextResponse.json({ 
          success: true, 
          uid: existingUser.uid,
          message: "Account already exists and is verified. Proceeding to resume profile."
        });
      } else {
        return NextResponse.json(
          { success: false, error: "An account with this email exists but is not verified. Please check your inbox or reset your password." },
          { status: 400 }
        );
      }
    } catch (err: unknown) {
      // "auth/user-not-found" is what we want for a fresh account!
      const error = err as { code?: string };
      if (error.code !== "auth/user-not-found") {
        throw err;
      }
    }

    // 2. Create User in Firebase Authentication
    const authUser = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });
    const uid = authUser.uid;

    // Set custom role claim for authorization
    await adminAuth.setCustomUserClaims(uid, { role: "PSYCHIATRIST" });

    // 3. Trigger Email Verification via REST API
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
    if (apiKey && apiKey !== "your-api-key" && apiKey !== "mock-api-key") {
      try {
        // Sign in briefly to get ID token
        const signInRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        });
        
        if (signInRes.ok) {
          const signInData = await signInRes.json();
          // Send verification email
          await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestType: "VERIFY_EMAIL", idToken: signInData.idToken }),
          });
        }
      } catch (emailErr) {
        console.error("Failed to trigger email verification:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      uid
    });

  } catch (error: unknown) {
    console.error("Account Creation API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create account.";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
