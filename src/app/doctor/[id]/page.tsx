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
    fetchDoctor();
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
        // Update slot locally
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
        }, 3000);
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
        // Append newly created review locally
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
        }, 3000);
      } else {
        setReviewStatus("ERROR");
      }
    } catch {
      setReviewStatus("ERROR");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "120px", color: "var(--text-muted)" }}>
        🌀 Loading profile statistics...
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px" }}>
        <h3>Profile Not Found</h3>
        <p style={{ color: "var(--text-muted)", margin: "10px 0 20px" }}>This doctor is suspended or undergoing credential review.</p>
        <Link href="/" className="btn btn-primary">Back to Directory</Link>
      </div>
    );
  }

  // Parse lists
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
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", paddingBottom: "80px" }}>
      {/* Dynamic JSON-LD SEO Structured Data for Google/Search Crawlers */}
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
            "priceRange": `$$ (Session Fee: $${doc.sessionFee})`,
            "aggregateRating": doc.reviews.length > 0 ? {
              "@type": "AggregateRating",
              "ratingValue": avgRating.toFixed(1),
              "reviewCount": doc.reviews.length
            } : undefined
          })
        }}
      />

      {/* Doctor Header Banner */}
      <section style={{
        background: "linear-gradient(135deg, hsl(215, 28%, 10%), hsl(var(--primary-hue), 40%, 18%))",
        color: "white",
        padding: "50px 20px"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", gap: "30px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{
            width: "160px",
            height: "160px",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            border: "4px solid rgba(255,255,255,0.15)",
            boxShadow: "var(--shadow-lg)",
            flexShrink: 0
          }}>
            <img src={doc.headshotUrl} alt={doc.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>

          {/* Info */}
          <div style={{ flexGrow: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
              <span className="badge badge-primary" style={{ background: "var(--primary)", color: "white" }}>
                ✓ Verified Practitioner
              </span>
              <span className="badge badge-secondary" style={{ background: "rgba(255,255,255,0.1)", color: "white" }}>
                NPI: {doc.npiNumber}
              </span>
            </div>

            <h1 style={{ fontSize: "2.6rem", color: "white", marginBottom: "4px" }}>{doc.user.name}, {doc.licenseType}</h1>
            <p style={{ color: "var(--primary-light)", fontSize: "1.1rem", fontWeight: 600, marginBottom: "8px" }}>
              {doc.clinicName}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", fontSize: "0.95rem", color: "hsl(210, 10%, 80%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent)" }}>
                <span>{"★".repeat(Math.round(avgRating))}</span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>{"★".repeat(5 - Math.round(avgRating))}</span>
                <strong style={{ color: "white", marginLeft: "4px" }}>{avgRating ? avgRating.toFixed(1) : "NEW"}</strong>
                <span style={{ color: "hsl(210, 10%, 80%)" }}>({doc.reviews.length} reviews)</span>
              </div>
              <div>📍 {doc.address}, {doc.city}, {doc.state} {doc.zipCode}</div>
            </div>
          </div>

          {/* Score Circle */}
          <div className="glass-panel" style={{
            padding: "16px 24px",
            textAlign: "center",
            background: "rgba(255,255,255,0.06)",
            borderColor: "rgba(255,255,255,0.12)",
            flexShrink: 0
          }}>
            <div style={{ fontSize: "0.7rem", color: "hsl(210, 10%, 75%)", textTransform: "uppercase", fontWeight: 800 }}>Search Standing</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--primary)" }}>{doc.searchScore}<span style={{ fontSize: "1rem", color: "hsl(210, 10%, 70%)" }}>/100</span></div>
            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Completeness & sentiment</div>
          </div>
        </div>
      </section>

      {/* Main Layout Grid */}
      <section className="profile-grid">
        
        {/* Left Column - Detailed Bio and Reviews */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          
          {/* Elevator Pitch Box */}
          <div className="glass-panel" style={{ padding: "30px", background: "var(--bg-card)" }}>
            <h3 style={{ fontSize: "1.3rem", marginBottom: "15px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>About</h3>
            <p style={{ fontSize: "1.1rem", lineHeight: "1.7", color: "var(--text-main)", marginBottom: "20px", fontStyle: "italic", borderLeft: "3px solid var(--primary)", paddingLeft: "15px" }}>
              "{doc.bioPreview}"
            </p>
            <p style={{ fontSize: "0.98rem", color: "var(--text-muted)", whiteSpace: "pre-line" }}>
              {doc.bioFull}
            </p>
          </div>

          {/* Video Introduction Box (If present) */}
          {doc.introVideoUrl && (
            <div className="glass-panel" style={{ padding: "30px", background: "var(--bg-card)" }}>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "15px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>Video Introduction</h3>
              <div style={{ background: "hsl(215, 20%, 94%)", borderRadius: "var(--radius-sm)", height: "240px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1.5px dashed var(--border-color)" }}>
                <span style={{ fontSize: "2.5rem", cursor: "pointer" }}>▶️</span>
                <div style={{ fontWeight: 700, margin: "10px 0 4px" }}>Introductory Video Consultation</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>YouTube Link: <a href={doc.introVideoUrl} target="_blank" style={{ color: "var(--primary)", textDecoration: "underline" }}>{doc.introVideoUrl}</a></div>
              </div>
            </div>
          )}

          {/* Practice & Taxonomies */}
          <div className="glass-panel" style={{ padding: "30px", background: "var(--bg-card)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "12px", color: "var(--primary)", fontWeight: 700 }}>Clinical Specialties</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {specialties.map((s, i) => (
                  <span key={i} className="badge badge-secondary" style={{ fontSize: "0.75rem" }}>{s}</span>
                ))}
              </div>
            </div>
            
            <div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "12px", color: "var(--primary)", fontWeight: 700 }}>Therapeutic Modalities</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {modalities.map((m, i) => (
                  <span key={i} className="badge badge-primary" style={{ fontSize: "0.75rem" }}>{m}</span>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "12px", color: "var(--primary)", fontWeight: 700 }}>Languages Spoken</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {languages.map((l, i) => (
                  <span key={i} className="badge badge-secondary" style={{ fontSize: "0.75rem", background: "var(--border-color)", color: "var(--text-main)" }}>{l}</span>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "12px", color: "var(--primary)", fontWeight: 700 }}>Target Demographics</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {demographics.map((d, i) => (
                  <span key={i} className="badge badge-secondary" style={{ fontSize: "0.75rem" }}>{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Patient Reviews Section */}
          <div className="glass-panel" style={{ padding: "30px", background: "var(--bg-card)" }}>
            <h3 style={{ fontSize: "1.3rem", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Patient Reviews</span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{doc.reviews.length} Patient Feedbacks</span>
            </h3>

            {/* Submit a review */}
            {reviewStatus === "SUCCESS" ? (
              <div className="glass-panel" style={{ padding: "16px", background: "var(--primary-light)", color: "var(--primary)", textAlign: "center", marginBottom: "20px" }}>
                <strong>Thank you!</strong> Your patient review was published successfully.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} style={{ background: "var(--bg-main)", padding: "20px", borderRadius: "var(--radius-sm)", marginBottom: "30px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <h4 style={{ fontSize: "1rem" }}>Write a Patient Review</h4>
                
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
                  <input 
                    type="text" 
                    required 
                    placeholder="Your Name (e.g. Robert L.)" 
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="form-input" 
                  />
                  <select 
                    value={reviewRating}
                    onChange={(e) => setReviewerRating(parseInt(e.target.value))}
                    className="form-input"
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
                  className="form-input"
                  rows={3}
                  style={{ resize: "none" }}
                />

                <button type="submit" disabled={reviewStatus === "PENDING"} className="btn btn-primary" style={{ alignSelf: "flex-end", padding: "8px 16px" }}>
                  {reviewStatus === "PENDING" ? "Publishing..." : "Submit Review"}
                </button>
              </form>
            )}

            {/* List Reviews */}
            {doc.reviews.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "20px" }}>
                No reviews yet. Be the first to share your experience!
              </p>
            ) : (
              doc.reviews.map((rev) => (
                <div key={rev.id} style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "16px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <strong style={{ fontSize: "0.95rem" }}>{rev.patientName}</strong>
                    <span style={{ color: "var(--accent)" }}>{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</span>
                  </div>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>"{rev.comment}"</p>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    Posted on {new Date(rev.createdAt).toLocaleDateString()} &bull; Verified Appointment Review
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Scheduler and Financial details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          
          {/* Session Booking Card */}
          <div className="glass-panel" style={{ padding: "24px", background: "var(--bg-card)", border: "1.5px solid var(--primary-glow)", position: "sticky", top: "90px" }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "16px", color: "var(--text-main)" }}>Clinic Scheduler</h3>

            {bookingStatus === "SUCCESS" ? (
              <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--success)" }}>
                <span style={{ fontSize: "3.5rem" }}>🎉</span>
                <h4 style={{ margin: "16px 0 8px", fontSize: "1.1rem" }}>Session Booked!</h4>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Your appointment slot is confirmed. Email notifications have been issued.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>Available Time Slots</label>
                  <select 
                    required 
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Select an opening...</option>
                    {doc.availability
                      .filter(s => !s.isBooked)
                      .map((slot) => {
                        const date = new Date(slot.startTime);
                        return (
                          <option key={slot.id} value={slot.id}>
                            📅 {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </option>
                        );
                      })}
                  </select>
                  {doc.availability.filter(s => !s.isBooked).length === 0 && (
                    <div style={{ color: "var(--danger)", fontSize: "0.75rem", marginTop: "4px" }}>
                      No remaining availability slots. Check back soon.
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>Your Full Name *</label>
                  <input 
                    type="text" 
                    required
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="form-input" 
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>Your Email *</label>
                  <input 
                    type="email" 
                    required
                    value={bookingEmail}
                    onChange={(e) => setBookingEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="form-input" 
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>Mobile Number *</label>
                  <input 
                    type="tel" 
                    required
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="form-input" 
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>Insurance Provider (Optional)</label>
                  <input 
                    type="text" 
                    value={bookingInsurance}
                    onChange={(e) => setBookingInsurance(e.target.value)}
                    placeholder="e.g. Blue Cross"
                    className="form-input" 
                  />
                </div>

                {bookingStatus === "ERROR" && (
                  <div style={{ color: "var(--danger)", fontSize: "0.8rem", textAlign: "center" }}>
                    🚨 Booking failed. Slot may have been taken.
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={bookingStatus === "PENDING" || !selectedSlotId}
                  className="btn btn-primary" 
                  style={{ width: "100%", marginTop: "6px" }}
                >
                  {bookingStatus === "PENDING" ? "Booking slot..." : "Confirm Booking"}
                </button>
              </form>
            )}

            {/* Financial Details Box */}
            <div style={{ borderTop: "1px solid var(--border-color)", marginTop: "20px", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Session Cost</span>
                <strong>${doc.sessionFee}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Sliding Scale</span>
                <strong>{doc.slidingScale ? "Yes, offered" : "No, standard"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Session format</span>
                <strong>{doc.sessionFormat}</strong>
              </div>
              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "10px", marginTop: "4px" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>Accepted Insurances:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {insurances.map((ins, i) => (
                    <span key={i} className="badge badge-secondary" style={{ fontSize: "0.65rem", textTransform: "none" }}>{ins}</span>
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
