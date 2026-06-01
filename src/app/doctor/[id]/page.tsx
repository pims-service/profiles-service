"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface Review {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Slot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

interface DoctorProfile {
  id: string;
  licenseType: string;
  licenseState: string;
  licenseNumber: string;
  npiNumber: string;
  clinicName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  specialties: string;
  treatmentModalities: string;
  targetDemographics: string;
  languages: string;
  bioPreview: string;
  bioFull: string;
  headshotUrl: string;
  introVideoUrl: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  sessionFormat: string;
  sessionFee: number;
  slidingScale: boolean;
  acceptedInsurances: string;
  searchScore: number;
  user: { name: string; email: string };
  reviews: Review[];
  availability: Slot[];
}

export default function DoctorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [doc, setDoc] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Booking states
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [bookingName, setBookingName] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingInsurance, setBookingInsurance] = useState("");
  const [bookingStatus, setBookingStatus] = useState<"IDLE" | "PENDING" | "SUCCESS" | "ERROR">("IDLE");

  // Review states
  const [reviewerName, setReviewerName] = useState("");
  const [reviewRating, setReviewerRating] = useState(5);
  const [reviewComment, setReviewerComment] = useState("");
  const [reviewStatus, setReviewStatus] = useState<"IDLE" | "PENDING" | "SUCCESS" | "ERROR">("IDLE");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const fetchDoctor = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/doctor/${id}`);
      const data = await res.json();
      if (data.success) {
        setDoc(data.data);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDoctor();

    // Fire Profile View Analytics Event
    const sessionId = localStorage.getItem("visitor_session") || Math.random().toString(36).substring(2, 15);
    localStorage.setItem("visitor_session", sessionId);

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: id,
        eventType: "PROFILE_VIEW",
        source: "DIRECT",
        city: "Unknown", 
        sessionId
      })
    }).catch(err => console.error("Tracking failed", err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) return;
    setBookingStatus("PENDING");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          psychiatristId: doc?.id,
          slotId: selectedSlotId,
          patientName: bookingName,
          patientEmail: bookingEmail,
          patientPhone: bookingPhone,
          insurance: bookingInsurance,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingStatus("SUCCESS");
        setDoc(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            availability: prev.availability.map(s => s.id === selectedSlotId ? { ...s, isBooked: true } : s)
          };
        });
        setTimeout(() => {
          setBookingStatus("IDLE");
          setBookingName("");
          setBookingEmail("");
          setBookingPhone("");
          setSelectedSlotId("");
        }, 2000);
      } else {
        setBookingStatus("ERROR");
      }
    } catch {
      setBookingStatus("ERROR");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName || !reviewComment) return;
    setReviewStatus("PENDING");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          psychiatristId: doc?.id,
          patientName: reviewerName,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewStatus("SUCCESS");
        setDoc(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            reviews: [data.review, ...prev.reviews]
          };
        });
        setTimeout(() => {
          setReviewStatus("IDLE");
          setReviewerName("");
          setReviewerRating(5);
          setReviewerComment("");
        }, 2000);
      } else {
        setReviewStatus("ERROR");
      }
    } catch {
      setReviewStatus("ERROR");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 text-slate-500 font-medium">
        🌀 Fetching profile specifications...
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="text-center py-20 px-4 max-w-sm mx-auto">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Practitioner Not Listed</h3>
        <p className="text-slate-500 text-xs mb-6">This listing may be suspended or undergoing administrative license verification.</p>
        <Link href="/" className="inline-flex text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all rounded-lg px-4 py-2">
          Return to Directory
        </Link>
      </div>
    );
  }

  // Parse arrays
  let specialties: string[] = [];
  let modalities: string[] = [];
  let demographics: string[] = [];
  let languages: string[] = [];
  let insurances: string[] = [];
  try { specialties = JSON.parse(doc.specialties || "[]"); } catch {}
  try { modalities = JSON.parse(doc.treatmentModalities || "[]"); } catch {}
  try { demographics = JSON.parse(doc.targetDemographics || "[]"); } catch {}
  try { languages = JSON.parse(doc.languages || "[]"); } catch {}
  try { insurances = JSON.parse(doc.acceptedInsurances || "[]"); } catch {}

  const avgRating = doc.reviews.length > 0 
    ? doc.reviews.reduce((sum, r) => sum + r.rating, 0) / doc.reviews.length 
    : 0;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Dynamic Schema.org Physician SEO structured metadata */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Physician",
            "name": doc.user.name,
            "image": doc.headshotUrl,
            "medicalSpecialty": specialties,
            "telephone": doc.user.email,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": doc.address,
              "addressLocality": doc.city,
              "addressRegion": doc.state,
              "postalCode": doc.zipCode,
              "addressCountry": "US"
            },
            "priceRange": `$$ (Session Cost: $${doc.sessionFee})`,
            "aggregateRating": doc.reviews.length > 0 ? {
              "@type": "AggregateRating",
              "ratingValue": avgRating.toFixed(1),
              "reviewCount": doc.reviews.length
            } : undefined
          })
        }}
      />

      {/* Crisp Light-Themed Human-Designed Doctor Header */}
      <section className="bg-white border-b border-slate-200/80 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex-shrink-0 bg-slate-50">
            <img src={doc.headshotUrl} alt={doc.user.name} className="w-full h-full object-cover" />
          </div>

          <div className="flex-grow text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2.5 py-0.5 rounded uppercase tracking-wider">
                Verified Provider
              </span>
              <span className="text-[9px] font-semibold bg-slate-105 text-slate-500 border border-slate-200/60 px-2.5 py-0.5 rounded">
                Registration Code: {doc.npiNumber}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight mb-1 text-slate-900">{doc.user.name}, {doc.licenseType}</h1>
            <p className="text-emerald-700 font-semibold text-xs mb-3">{doc.clinicName}</p>

            {/* Social handles & Portfolio links */}
            {(doc.websiteUrl || doc.linkedinUrl || doc.twitterUrl) && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4 select-none">
                {doc.websiteUrl && (
                  <a href={doc.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/40 px-3 py-1 rounded-lg transition-colors">
                    🌐 Website
                  </a>
                )}
                {doc.linkedinUrl && (
                  <a href={doc.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/40 px-3 py-1 rounded-lg transition-colors">
                    🔗 LinkedIn
                  </a>
                )}
                {doc.twitterUrl && (
                  <a href={doc.twitterUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200/40 px-3 py-1 rounded-lg transition-colors">
                    🐦 Twitter/X
                  </a>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-5 text-xs text-slate-500">
              <div className="flex items-center gap-1 text-slate-500">
                <span className="text-amber-500">★</span>
                <strong className="text-slate-800 font-semibold">{avgRating ? avgRating.toFixed(1) : "NEW"}</strong>
                <span className="text-slate-400">({doc.reviews.length} {doc.reviews.length === 1 ? 'review' : 'reviews'})</span>
              </div>
              <div className="text-slate-300">&bull;</div>
              <div>{doc.address}, {doc.city}, {doc.state} {doc.zipCode}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Decluttered Profile Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Decluttered Clinical Information */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* About Bio */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h3 className="font-display font-bold text-base text-slate-900 mb-4 border-b border-slate-100 pb-2">About Clinical Practice</h3>
            <p className="text-sm font-medium text-slate-800 border-l-2 border-emerald-500 pl-4 py-1 italic mb-4 leading-relaxed">
              &quot;{doc.bioPreview}&quot;
            </p>
            <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line">
              {doc.bioFull}
            </p>

            {/* Interactive video pitch player */}
            {doc.introVideoUrl && (
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h4 className="font-display font-bold text-xs text-slate-800 uppercase tracking-wide mb-3">Introductory Video Pitch</h4>
                <div className="max-w-md rounded-xl overflow-hidden border border-slate-200 bg-slate-950 aspect-video shadow-md">
                  <video src={doc.introVideoUrl} controls className="w-full h-full object-cover" />
                </div>
              </div>
            )}
          </div>

          {/* Specialties and Modalities */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-3">Clinical Specialties</h4>
              <div className="flex flex-wrap gap-1.5">
                {specialties.map((s, i) => (
                  <span key={i} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-3">Treatment Modalities</h4>
              <div className="flex flex-wrap gap-1.5">
                {modalities.map((m, i) => (
                  <span key={i} className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">{m}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-3">Target Demographics</h4>
              <div className="flex flex-wrap gap-1.5">
                {demographics.map((d, i) => (
                  <span key={i} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{d}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-3">Languages Spoken</h4>
              <div className="flex flex-wrap gap-1.5">
                {languages.map((l, i) => (
                  <span key={i} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{l}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <h3 className="font-display font-bold text-base text-slate-900 mb-6 border-b border-slate-100 pb-2 flex justify-between items-center">
              <span>Patient Feedback</span>
              <span className="text-xs font-semibold text-slate-400">{doc.reviews.length} reviews</span>
            </h3>

            {/* Submit review */}
            {reviewStatus === "SUCCESS" ? (
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-700 text-xs font-semibold text-center mb-6">
                Thank you! Your patient session review was submitted successfully.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl mb-8 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-slate-900">Add a Public Review</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    required 
                    placeholder="Your Name (e.g. Robert L.)" 
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-950 outline-none focus:border-emerald-500" 
                  />
                  <select 
                    value={reviewRating}
                    onChange={(e) => setReviewerRating(parseInt(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-950 outline-none focus:border-emerald-500"
                  >
                    <option value="5">★★★★★ (5 Stars)</option>
                    <option value="4">★★★★☆ (4 Stars)</option>
                    <option value="3">★★★☆☆ (3 Stars)</option>
                    <option value="2">★★☆☆☆ (2 Stars)</option>
                    <option value="1">★☆☆☆☆ (1 Star)</option>
                  </select>
                </div>

                <textarea 
                  required 
                  placeholder="Share details of your clinical session..." 
                  value={reviewComment}
                  onChange={(e) => setReviewerComment(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs text-slate-955 outline-none focus:border-emerald-500"
                  rows={2}
                  style={{ resize: "none" }}
                />

                <button type="submit" disabled={reviewStatus === "PENDING"} className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 py-2 px-4 rounded-lg self-end cursor-pointer">
                  {reviewStatus === "PENDING" ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            )}

            {/* List Reviews */}
            {doc.reviews.length === 0 ? (
              <p className="text-slate-400 text-xs italic text-center py-6">
                No session feedback records yet. Be the first to list yours!
              </p>
            ) : (
              <div className="flex flex-col gap-6">
                {doc.reviews.map((rev) => (
                  <div key={rev.id} className="border-b border-slate-100 last:border-b-0 pb-6 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-xs text-slate-800 font-bold">{rev.patientName}</strong>
                      <span className="text-amber-400 text-xs">{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</span>
                    </div>
                    <p className="text-slate-500 text-xs">&quot;{rev.comment}&quot;</p>
                    <div className="text-[10px] text-slate-400 mt-2">
                      Posted on {mounted ? new Date(rev.createdAt).toLocaleDateString() : new Date(rev.createdAt).toISOString().split('T')[0]} &bull; Verified Appointment
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Decluttered Scheduler Booking Form Box */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-24">
            <h3 className="font-display font-bold text-sm text-slate-900 mb-4">Clinic Scheduler</h3>

            {bookingStatus === "SUCCESS" ? (
              <div className="text-center py-8 text-emerald-600">
                <span className="text-4xl">🎉</span>
                <h4 className="font-bold text-sm mt-4 mb-2">Appointment Confirmed!</h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Your booking has been finalized. Confirmed slots are locked. Email intakes are issued.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="flex flex-col gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Available Session Openings</label>
                  <select 
                    required 
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none"
                  >
                    <option value="">Select an hour...</option>
                    {doc.availability
                      .filter(s => !s.isBooked)
                      .map((slot) => {
                        const date = new Date(slot.startTime);
                        return (
                          <option key={slot.id} value={slot.id}>
                            {mounted 
                              ? `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              : date.toISOString().split('T')[0]
                            }
                          </option>
                        );
                      })}
                  </select>
                  {doc.availability.filter(s => !s.isBooked).length === 0 && (
                    <div className="text-red-500 text-[10px] mt-1">No slots available. Contact clinic for inquiries.</div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                  <input 
                    type="text" 
                    required
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    required
                    value={bookingEmail}
                    onChange={(e) => setBookingEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Phone *</label>
                  <input 
                    type="tel" 
                    required
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Insurance Provider (Optional)</label>
                  <input 
                    type="text" 
                    value={bookingInsurance}
                    onChange={(e) => setBookingInsurance(e.target.value)}
                    placeholder="Aetna"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none" 
                  />
                </div>

                {bookingStatus === "ERROR" && (
                  <div className="text-red-500 text-xs text-center">🚨 Transaction failed. Try another slot.</div>
                )}

                <button 
                  type="submit" 
                  disabled={bookingStatus === "PENDING" || !selectedSlotId}
                  className="w-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 py-3 rounded-lg cursor-pointer shadow-md shadow-emerald-600/10"
                >
                  {bookingStatus === "PENDING" ? "Processing..." : "Confirm Booking"}
                </button>
              </form>
            )}

            {/* Financial Details */}
            <div className="border-t border-slate-100 mt-6 pt-4 flex flex-col gap-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Consultation Fee</span>
                <strong className="text-slate-800">{doc.sessionFee > 500 ? `PKR ${doc.sessionFee}` : `$${doc.sessionFee}`}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sliding Scale Options</span>
                <strong className="text-slate-800">{doc.slidingScale ? "Available" : "Not Offered"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Consultation Format</span>
                <strong className="text-slate-800">{doc.sessionFormat}</strong>
              </div>
              <div className="border-t border-slate-100 pt-3 mt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Accepted Insurances:</span>
                <div className="flex flex-wrap gap-1">
                  {insurances.map((ins, i) => (
                    <span key={i} className="text-[9px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{ins}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
}
