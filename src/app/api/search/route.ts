import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveLocation, calculateDistance } from "@/lib/geo";
import { calculateProfileScore } from "@/lib/ranking";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const locationQuery = searchParams.get("location") || "";
    const distanceLimit = parseFloat(searchParams.get("distance") || "25");
    const specialty = searchParams.get("specialty") || "";
    const insurance = searchParams.get("insurance") || "";
    const format = searchParams.get("format") || "";
    const minFee = parseFloat(searchParams.get("minFee") || "0");
    const maxFee = parseFloat(searchParams.get("maxFee") || "9999");
    const sortBy = searchParams.get("sort") || "best_match";

    // 1. Query all APPROVED and verified psychiatrist profiles from Prisma
    const doctors = await prisma.psychiatristProfile.findMany({
      where: {
        verificationStatus: "APPROVED",
        isSuspended: false,
      },
      include: {
        reviews: true,
        availability: true,
      },
    });

    // 2. Geolocation Matching
    let originCoords: { lat: number; lng: number } | null = null;
    if (locationQuery) {
      const resolved = resolveLocation(locationQuery);
      if (resolved) {
        originCoords = { lat: resolved.lat, lng: resolved.lng };
      }
    }

    // 3. Map, compute and filter profiles
    let results = doctors.map(doc => {
      // Calculate real-time search score out of 100
      const score = calculateProfileScore(doc);
      
      // Calculate distance if search coordinates are resolved
      let distance = 9999;
      if (originCoords) {
        distance = calculateDistance(originCoords.lat, originCoords.lng, doc.latitude, doc.longitude);
      }

      // Calculate rating
      const reviews = doc.reviews || [];
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0;

      // Parse JSON fields
      let specialtiesList: string[] = [];
      let insurancesList: string[] = [];
      try { specialtiesList = JSON.parse(doc.specialties || "[]"); } catch {}
      try { insurancesList = JSON.parse(doc.acceptedInsurances || "[]"); } catch {}

      return {
        ...doc,
        specialtiesList,
        insurancesList,
        computedScore: score,
        computedDistance: distance,
        avgRating,
        reviewCount: reviews.length,
      };
    });

    // 4. Apply Filters
    // Location Distance filter
    if (originCoords) {
      results = results.filter(doc => doc.computedDistance <= distanceLimit);
    }

    // Specialty filter
    if (specialty) {
      results = results.filter(doc => 
        doc.specialtiesList.some(s => s.toLowerCase() === specialty.toLowerCase())
      );
    }

    // Insurance filter
    if (insurance) {
      results = results.filter(doc => 
        doc.insurancesList.some(i => i.toLowerCase() === insurance.toLowerCase())
      );
    }

    // Format filter ("IN_PERSON", "TELEHEALTH", "HYBRID")
    if (format && format !== "ANY") {
      results = results.filter(doc => {
        if (format === "TELEHEALTH") return doc.sessionFormat === "TELEHEALTH" || doc.sessionFormat === "HYBRID";
        if (format === "IN_PERSON") return doc.sessionFormat === "IN_PERSON" || doc.sessionFormat === "HYBRID";
        return doc.sessionFormat === format;
      });
    }

    // Fee range filter
    if (minFee > 0 || maxFee < 9999) {
      results = results.filter(doc => doc.sessionFee >= minFee && doc.sessionFee <= maxFee);
    }

    // 5. Apply Sorting Logics
    if (sortBy === "distance" && originCoords) {
      results.sort((a, b) => a.computedDistance - b.computedDistance);
    } else if (sortBy === "rating") {
      results.sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount);
    } else if (sortBy === "price_low") {
      results.sort((a, b) => a.sessionFee - b.sessionFee);
    } else if (sortBy === "price_high") {
      results.sort((a, b) => b.sessionFee - a.sessionFee);
    } else {
      // Default: best_match (Standard market sorting)
      // Boost sponsored listings to the top, then sort by computedScore descending
      results.sort((a, b) => {
        if (a.isSponsored && !b.isSponsored) return -1;
        if (!a.isSponsored && b.isSponsored) return 1;
        return b.computedScore - a.computedScore;
      });
    }

    return NextResponse.json({
      success: true,
      resolvedLocation: originCoords ? locationQuery : null,
      resultsCount: results.length,
      data: results,
    });
  } catch (error: any) {
    console.error("🚨 Search API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to perform search operations." },
      { status: 500 }
    );
  }
}
