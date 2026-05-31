import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { resolveLocation, calculateDistance } from "@/lib/geo";
import { calculateProfileScore } from "@/lib/ranking";
import * as geofire from "geofire-common";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse filters
    const locationQuery = searchParams.get("location") || "";
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const distanceLimit = parseFloat(searchParams.get("distance") || "25");
    const specialty = searchParams.get("specialty") || "";
    const insurance = searchParams.get("insurance") || "";
    const format = searchParams.get("format") || "";
    const minFee = parseFloat(searchParams.get("minFee") || "0");
    const maxFee = parseFloat(searchParams.get("maxFee") || "9999");
    const sortBy = searchParams.get("sort") || "best_match";

    const isMockMode = !process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY.includes("your-private-key");

    let psychiatrists: any[] = [];
    let originCoords: { lat: number; lng: number } | null = null;
    let resolvedName = "";

    // 1. Determine Search Origin Coordinates
    if (latParam && lngParam) {
      originCoords = {
        lat: parseFloat(latParam),
        lng: parseFloat(lngParam),
      };
      resolvedName = "Current Geolocation Location";
    } else if (locationQuery) {
      const resolved = resolveLocation(locationQuery);
      if (resolved) {
        originCoords = { lat: resolved.lat, lng: resolved.lng };
        resolvedName = resolved.name;
      }
    }

    if (isMockMode) {
      console.warn("⚠️ Running search API in offline mock mode.");
      // Return 2 realistic mock profiles to let homepage map rendering and searches work!
      const mockKeller = {
        id: "doctor-uid",
        userId: "doctor-uid",
        licenseType: "MD",
        licenseState: "NY",
        licenseNumber: "NY-MD-884920",
        npiNumber: "1928374650",
        isVerified: true,
        verificationStatus: "APPROVED",
        clinicName: "Manhattan Integrative Psychiatry",
        address: "120 Broadway, Suite 1400",
        city: "New York",
        state: "NY",
        zipCode: "10005",
        latitude: 40.7078,
        longitude: -74.0115,
        geohash: "dr5rs",
        specialties: JSON.stringify(["ADHD", "Anxiety", "Depression", "Bipolar Disorder"]),
        treatmentModalities: JSON.stringify(["Medication Management", "CBT", "Psychodynamic Therapy"]),
        targetDemographics: JSON.stringify(["Adults", "Seniors"]),
        languages: JSON.stringify(["English", "German"]),
        bioPreview: "Dr. Keller is a board-certified psychiatrist with over 15 years of experience specializing in adult ADHD and complex mood disorders.",
        bioFull: "Dr. Marcus Keller is a graduate of Columbia University College of Physicians and Surgeons...",
        headshotUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=250&auto=format&fit=crop",
        introVideoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        sessionFormat: "HYBRID",
        sessionFee: 320.0,
        slidingScale: true,
        acceptedInsurances: JSON.stringify(["Aetna", "Blue Cross Blue Shield", "UnitedHealthcare"]),
        searchScore: 95,
        isSponsored: true,
        isSuspended: false,
        user: { name: "Dr. Marcus Keller", email: "dr.keller@pims.com" },
        reviews: [{ rating: 5 }, { rating: 4 }, { rating: 5 }],
      };

      const mockChen = {
        id: "doctor-chen-uid",
        userId: "doctor-chen-uid",
        licenseType: "DO",
        licenseState: "CA",
        licenseNumber: "CA-DO-394820",
        npiNumber: "1029384756",
        isVerified: true,
        verificationStatus: "APPROVED",
        clinicName: "Pacific Mind & Wellness",
        address: "8383 Wilshire Blvd, Suite 210",
        city: "Beverly Hills",
        state: "CA",
        zipCode: "90211",
        latitude: 34.0664,
        longitude: -118.3725,
        geohash: "9q5ct",
        specialties: JSON.stringify(["PTSD", "Anxiety", "Obsessive-Compulsive Disorder (OCD)", "Trauma"]),
        treatmentModalities: JSON.stringify(["EMDR", "Medication Management", "Mindfulness-Based CBT"]),
        targetDemographics: JSON.stringify(["Adolescents", "Adults"]),
        languages: JSON.stringify(["English", "Mandarin"]),
        bioPreview: "Dr. Chen is a dual-board certified osteopathic psychiatrist specializing in trauma recovery, PTSD, and anxiety.",
        bioFull: "Dr. Evelyn Chen received her Doctor of Osteopathic Medicine from Touro University...",
        headshotUrl: "https://images.unsplash.com/photo-1594824813573-246434de83fb?q=80&w=250&auto=format&fit=crop",
        introVideoUrl: null,
        sessionFormat: "TELEHEALTH",
        sessionFee: 260.0,
        slidingScale: false,
        acceptedInsurances: JSON.stringify(["Cigna", "Blue Cross Blue Shield", "Aetna"]),
        searchScore: 88,
        isSponsored: false,
        isSuspended: false,
        user: { name: "Dr. Evelyn Chen", email: "dr.chen@pims.com" },
        reviews: [{ rating: 4 }, { rating: 5 }],
      };

      psychiatrists = [mockKeller, mockChen];
    } else {
      // 2. Fetch doctors from Cloud Firestore
      const usersSnap = await db.collection("users").get();
      const usersMap = new Map(usersSnap.docs.map(doc => [doc.id, doc.data()]));

      if (originCoords) {
        // Run Geohash bounding range query on Cloud Firestore
        const center: [number, number] = [originCoords.lat, originCoords.lng];
        const radiusInM = distanceLimit * 1609.34; // Convert miles to meters
        const bounds = geofire.geohashQueryBounds(center, radiusInM);
        
        const promises = [];
        for (const b of bounds) {
          const q = db.collection("psychiatrists")
            .orderBy("geohash")
            .startAt(b[0])
            .endAt(b[1]);
          promises.push(q.get());
        }

        const snapshots = await Promise.all(promises);
        const docsMap = new Map<string, any>(); // Prevent duplicate matches in overlapping geohash bounds

        for (const snap of snapshots) {
          for (const doc of snap.docs) {
            const data = doc.data();
            if (data.verificationStatus === "APPROVED" && !data.isSuspended) {
              docsMap.set(doc.id, data);
            }
          }
        }

        for (const profile of docsMap.values()) {
          const distance = calculateDistance(originCoords.lat, originCoords.lng, profile.latitude, profile.longitude);
          if (distance <= distanceLimit) {
            const userData = usersMap.get(profile.userId);
            const reviewsSnap = await db.collection("psychiatrists").doc(profile.id).collection("reviews").get();
            const reviews = reviewsSnap.docs.map(r => r.data());
            const availabilitySnap = await db.collection("psychiatrists").doc(profile.id).collection("availability").get();
            const availability = availabilitySnap.docs.map(a => a.data());

            psychiatrists.push({
              ...profile,
              user: {
                name: userData?.name || "Clinical Provider",
                email: userData?.email || "",
              },
              reviews,
              availability,
            });
          }
        }
      } else {
        // No location query, fetch all verified active psychiatrists
        const snapshot = await db.collection("psychiatrists")
          .where("verificationStatus", "==", "APPROVED")
          .where("isSuspended", "==", false)
          .get();

        for (const doc of snapshot.docs) {
          const profile = doc.data();
          const userData = usersMap.get(profile.userId);
          const reviewsSnap = await db.collection("psychiatrists").doc(doc.id).collection("reviews").get();
          const reviews = reviewsSnap.docs.map(r => r.data());
          const availabilitySnap = await db.collection("psychiatrists").doc(doc.id).collection("availability").get();
          const availability = availabilitySnap.docs.map(a => a.data());

          psychiatrists.push({
            ...profile,
            user: {
              name: userData?.name || "Clinical Provider",
              email: userData?.email || "",
            },
            reviews,
            availability,
          });
        }
      }
    }

    // 3. Compute dynamic ranking scores & metrics
    let results = psychiatrists.map(doc => {
      const score = calculateProfileScore(doc);
      
      let distance = 9999;
      if (originCoords) {
        distance = calculateDistance(originCoords.lat, originCoords.lng, doc.latitude, doc.longitude);
      }

      const reviews = doc.reviews || [];
      const avgRating = reviews.length > 0 
        ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length 
        : 0;

      let specialtiesList: string[] = [];
      let insurancesList: string[] = [];
      try { specialtiesList = typeof doc.specialties === "string" ? JSON.parse(doc.specialties || "[]") : doc.specialties; } catch {}
      try { insurancesList = typeof doc.acceptedInsurances === "string" ? JSON.parse(doc.acceptedInsurances || "[]") : doc.acceptedInsurances; } catch {}

      return {
        ...doc,
        name: doc.user?.name || doc.name || "Clinical Provider",
        specialtiesList: specialtiesList || [],
        insurancesList: insurancesList || [],
        computedScore: score,
        computedDistance: distance,
        avgRating,
        reviewCount: reviews.length,
      };
    });

    // 4. Apply Filters on Edge
    if (specialty) {
      results = results.filter(doc => 
        doc.specialtiesList.some((s: string) => s.toLowerCase() === specialty.toLowerCase())
      );
    }

    if (insurance) {
      results = results.filter(doc => 
        doc.insurancesList.some((i: string) => i.toLowerCase() === insurance.toLowerCase())
      );
    }

    if (format && format !== "ANY") {
      results = results.filter(doc => {
        if (format === "TELEHEALTH") return doc.sessionFormat === "TELEHEALTH" || doc.sessionFormat === "HYBRID";
        if (format === "IN_PERSON") return doc.sessionFormat === "IN_PERSON" || doc.sessionFormat === "HYBRID";
        return doc.sessionFormat === format;
      });
    }

    if (minFee > 0 || maxFee < 9999) {
      results = results.filter(doc => doc.sessionFee >= minFee && doc.sessionFee <= maxFee);
    }

    // 5. Perform Sorting
    if (sortBy === "distance" && originCoords) {
      results.sort((a, b) => a.computedDistance - b.computedDistance);
    } else if (sortBy === "rating") {
      results.sort((a, b) => b.avgRating - a.avgRating || b.reviewCount - a.reviewCount);
    } else if (sortBy === "price_low") {
      results.sort((a, b) => a.sessionFee - b.sessionFee);
    } else if (sortBy === "price_high") {
      results.sort((a, b) => b.sessionFee - a.sessionFee);
    } else {
      // Default market sorting: sponsored first, then profile searchScore
      results.sort((a, b) => {
        if (a.isSponsored && !b.isSponsored) return -1;
        if (!a.isSponsored && b.isSponsored) return 1;
        return b.computedScore - a.computedScore;
      });
    }

    return NextResponse.json({
      success: true,
      resolvedLocationName: resolvedName,
      resultsCount: results.length,
      data: results,
    });
  } catch (error: any) {
    console.error("🚨 Search API Proximity Query Error:", error);
    return NextResponse.json(
      { success: false, error: "Search execution error." },
      { status: 500 }
    );
  }
}
