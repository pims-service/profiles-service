import { PsychiatristProfile, Review, AvailabilitySlot } from "@prisma/client";

interface FullProfile extends PsychiatristProfile {
  reviews?: Review[];
  availability?: AvailabilitySlot[];
}

/**
 * Calculates a composite searchScore out of 100 for a psychiatrist profile
 * based on standard market factors: profile completeness, reviews, availability, active status.
 */
export function calculateProfileScore(profile: FullProfile): number {
  let score = 0;

  // 1. Profile Completeness Score (Max: 30 points)
  let completeness = 0;
  if (profile.introVideoUrl) completeness += 5; // 5 pts for intro video
  
  try {
    const langs = JSON.parse(profile.languages || "[]");
    if (langs.length > 0) completeness += 5; // 5 pts for languages
  } catch {}

  try {
    const modalities = JSON.parse(profile.treatmentModalities || "[]");
    if (modalities.length > 0) completeness += 5; // 5 pts for modalities
  } catch {}

  try {
    const demographics = JSON.parse(profile.targetDemographics || "[]");
    if (demographics.length > 0) completeness += 5; // 5 pts for target demographics
  } catch {}

  if (profile.bioFull && profile.bioFull.length > 200) completeness += 5; // 5 pts for detailed bio
  if (profile.slidingScale) completeness += 5; // 5 pts for sliding scale availability
  
  score += completeness;

  // 2. Patient Reviews Sentiment (Max: 30 points)
  // We use a simplified Bayesian average: (avgRating * count + 4.5 * 1) / (count + 1)
  const reviews = profile.reviews || [];
  const reviewCount = reviews.length;
  let reviewScore = 0;

  if (reviewCount > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;
    // Bayesian adjustment
    const bayesianRating = (avgRating * reviewCount + 4.5 * 2) / (reviewCount + 2);
    // Map 1-5 stars to 0-30 points: (bayesianRating - 1) / 4 * 30
    reviewScore = Math.round(((bayesianRating - 1) / 4) * 30);
  } else {
    // Default score if no reviews (uses 4.0 standard starting baseline = 22 points)
    reviewScore = 22;
  }
  score += reviewScore;

  // 3. Dynamic Calendar Availability (Max: 20 points)
  // Prioritize practitioners with near-term schedule slots open
  const slots = profile.availability || [];
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);

  const activeSlots = slots.filter(s => !s.isBooked && new Date(s.startTime) >= now && new Date(s.startTime) <= nextWeek).length;

  if (activeSlots >= 6) {
    score += 20;
  } else if (activeSlots >= 3) {
    score += 12;
  } else if (activeSlots >= 1) {
    score += 6;
  }

  // 4. Verification / Licensure Standing (Max: 10 points)
  if (profile.verificationStatus === "APPROVED" || profile.isVerified) {
    score += 10;
  }

  // 5. Doctor Engagement / Activity (Max: 10 points)
  const lastActiveTime = new Date(profile.lastActive).getTime();
  const timeDiffHours = (now.getTime() - lastActiveTime) / (1000 * 60 * 60);

  if (timeDiffHours <= 24) {
    score += 10; // Login in last 24h
  } else if (timeDiffHours <= 72) {
    score += 6;  // Login in last 72h
  } else {
    score += 2;  // Standard base
  }

  return Math.min(100, score);
}

/**
 * Interface representing actionable dashboard suggestions to improve their search optimization score.
 */
export interface OptimizationSuggestion {
  text: string;
  points: number;
  completed: boolean;
  category: "media" | "practice" | "profile" | "scheduling";
}

export function getOptimizationSuggestions(profile: FullProfile): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  // Video suggestion
  suggestions.push({
    text: "Add an introductory video to show clients your clinical approach.",
    points: 5,
    completed: !!profile.introVideoUrl,
    category: "media",
  });

  // Long bio
  suggestions.push({
    text: "Write a detailed narrative bio (at least 200 characters) sharing your story.",
    points: 5,
    completed: !!(profile.bioFull && profile.bioFull.length > 200),
    category: "profile",
  });

  // Sliding scale
  suggestions.push({
    text: "Configure sliding scale financial options to capture budget-sensitive searches.",
    points: 5,
    completed: profile.slidingScale,
    category: "practice",
  });

  // Calendar openings
  const slots = profile.availability || [];
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);
  const activeSlots = slots.filter(s => !s.isBooked && new Date(s.startTime) >= now && new Date(s.startTime) <= nextWeek).length;

  suggestions.push({
    text: "Add at least 6 open slots in the next 7 days to maximize calendar matching.",
    points: 20,
    completed: activeSlots >= 6,
    category: "scheduling",
  });

  // Regular logins
  const lastActiveTime = new Date(profile.lastActive).getTime();
  const timeDiffHours = (Date.now() - lastActiveTime) / (1000 * 60 * 60);
  suggestions.push({
    text: "Log in regularly to show active standing in searches.",
    points: 10,
    completed: timeDiffHours <= 24,
    category: "profile",
  });

  return suggestions;
}
