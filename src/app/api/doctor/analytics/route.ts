import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");

    if (!doctorId) {
      return NextResponse.json({ success: false, error: "doctorId required" }, { status: 400 });
    }

    // Don't execute Firebase logic if running in pure mock environment
    if (!process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY.includes("your-private-key")) {
      return NextResponse.json({
        success: true,
        mock: true,
        data: {
          profileViews: { total: 0, weekly: [] },
          uniqueVisitors: 0,
          searchAppearances: 0,
          conversionRate: 0,
          referralSources: [],
          geographicReach: []
        }
      });
    }

    // 1. Fetch Firebase Analytics Events (last 30 days to keep it fast)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    const eventsSnapshot = await db.collection("analytics_events")
      .where("doctorId", "==", doctorId)
      .where("createdAt", ">=", thirtyDaysAgoStr)
      .get();

    let totalViews = 0;
    let searchAppearances = 0;
    const uniqueSessions = new Set<string>();
    
    // Day aggregation map (Mon, Tue, Wed, etc.)
    const weeklyViewsMap: Record<string, number> = {
      "Sun": 0, "Mon": 0, "Tue": 0, "Wed": 0, "Thu": 0, "Fri": 0, "Sat": 0
    };
    
    // 7 days ago timestamp
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const sourcesMap: Record<string, number> = {};
    const citiesMap: Record<string, number> = {};

    eventsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const eventType = data.eventType;
      const createdAt = new Date(data.createdAt);

      if (eventType === "PROFILE_VIEW") {
        totalViews++;
        if (data.sessionId) uniqueSessions.add(data.sessionId);
        
        if (createdAt >= sevenDaysAgo) {
          const dayName = createdAt.toLocaleDateString("en-US", { weekday: "short" });
          weeklyViewsMap[dayName] = (weeklyViewsMap[dayName] || 0) + 1;
        }
      } else if (eventType === "SEARCH_APPEARANCE") {
        searchAppearances++;
      }

      // Referral sources & Geo reach
      if (data.source) {
        sourcesMap[data.source] = (sourcesMap[data.source] || 0) + 1;
      }
      if (data.city) {
        citiesMap[data.city] = (citiesMap[data.city] || 0) + 1;
      }
    });

    // Format weekly arrays
    // Sort from 6 days ago up to today
    const weeklyViews = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      weeklyViews.push({
        day: dayName,
        val: weeklyViewsMap[dayName] || 0
      });
    }

    // Format referral sources
    const totalReferrals = Object.values(sourcesMap).reduce((acc, curr) => acc + curr, 0);
    const referralSources = Object.entries(sourcesMap)
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => {
        const share = totalReferrals > 0 ? Math.round((count / totalReferrals) * 100) : 0;
        let name = source;
        if (source === "MAP") name = "Geospatial Map Matches";
        if (source === "CITY_ZIP") name = "City & Zip Filters";
        if (source === "SPECIALTY") name = "Specialty Selection";
        if (source === "DIRECT") name = "Direct URLs & Shares";
        return { name, count, share: `${share}%` };
      });

    // Format geographic reach
    const totalCities = Object.values(citiesMap).reduce((acc, curr) => acc + curr, 0);
    const geographicReach = Object.entries(citiesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3) // Top 3
      .map(([city, count]) => {
        const share = totalCities > 0 ? Math.round((count / totalCities) * 100) : 0;
        return { city, reach: `${share}%`, description: `Query referrals originating from ${city}` };
      });

    // 2. Fetch Bookings count from Firebase
    const bookingsSnap = await db.collection("psychiatrists").doc(doctorId).collection("bookings").get();
    const bookingsCount = bookingsSnap.size;

    const conversionRate = totalViews > 0 ? ((bookingsCount / totalViews) * 100).toFixed(1) : "0.0";

    return NextResponse.json({
      success: true,
      data: {
        profileViews: {
          total: totalViews,
          weekly: weeklyViews
        },
        uniqueVisitors: uniqueSessions.size,
        searchAppearances,
        conversionRate: `${conversionRate}%`,
        referralSources,
        geographicReach
      }
    });

  } catch (error) {
    console.error("Analytics Aggregation Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch analytics" }, { status: 500 });
  }
}
