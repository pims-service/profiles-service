import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { doctorId, eventType, source, city, sessionId } = body;

    if (!doctorId || !eventType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Don't track if we're in a completely mock environment without Firebase credentials
    if (!process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY.includes("your-private-key")) {
      return NextResponse.json({ success: true, mock: true });
    }

    const docRef = await db.collection("analytics_events").add({
      doctorId,
      eventType,
      source: source || "UNKNOWN",
      city: city || "Unknown",
      sessionId: sessionId || "anonymous",
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Analytics Tracking Error:", error);
    return NextResponse.json({ success: false, error: "Failed to track event" }, { status: 500 });
  }
}
