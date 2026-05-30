"use client";

import { useState, useEffect } from "react";

interface DoctorResult {
  id: string;
  userId: string;
  name: string;
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
  sessionFormat: string;
  sessionFee: number;
  slidingScale: boolean;
  computedScore: number;
  computedDistance: number;
  avgRating: number;
  reviewCount: number;
  isSponsored: boolean;
  specialtiesList: string[];
  insurancesList: string[];
  bioPreview: string;
  headshotUrl: string;
  availability: Array<{ id: string; startTime: string; endTime: string; isBooked: boolean }>;
}

export default function SearchDirectory() {
  // Search parameters
  const [location, setLocation] = useState("New York");
  const [distance, setDistance] = useState("25");
  const [specialty, setSpecialty] = useState("");
  const [insurance, setInsurance] = useState("");
  const [format, setFormat] = useState("ANY");
  const [minFee, setMinFee] = useState("0");
  const [maxFee, setMaxFee] = useState("400");
  const [sort, setSort] = useState("best_match");

  // State values
  const [doctors, setDoctors] = useState<DoctorResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDocId, setHoveredDocId] = useState<string | null>(null);
  const [selectedDocForBooking, setSelectedDocForBooking] = useState<DoctorResult | null>(null);
  
  // Booking Form State
  const [bookingName, setBookingName] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [bookingInsurance, setBookingInsurance] = useState("");
  const [bookingStatus, setBookingStatus] = useState<"IDLE" | "PENDING" | "SUCCESS" | "ERROR">("IDLE");

  // Fetch search results from our local API
  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        location,
        distance,
        specialty,
        insurance,
        format,
        minFee,
        maxFee,
        sort
      });
      const res = await fetch(`/api/search?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDoctors(data.data);
      }
    } catch (err) {
      console.error("Failed to query doctor search:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run search on mount and whenever main dependencies change
  useEffect(() => {
    fetchResults();
  }, [location, distance, specialty, insurance, format, minFee, maxFee, sort]);

  // Handle appointment booking
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) return;
    setBookingStatus("PENDING");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          psychiatristId: selectedDocForBooking?.id,
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
        // Update local doctor's availability slot to booked
        if (selectedDocForBooking) {
          setDoctors(prev => prev.map(d => {
            if (d.id === selectedDocForBooking.id) {
              return {
                ...d,
                availability: d.availability.map(s => s.id === selectedSlotId ? { ...s, isBooked: true } : s)
              };
            }
            return d;
          }));
        }
        setTimeout(() => {
          setSelectedDocForBooking(null);
          setBookingStatus("IDLE");
          setBookingName("");
          setBookingEmail("");
          setBookingPhone("");
          setSelectedSlotId("");
        }, 2500);
      } else {
        setBookingStatus("ERROR");
      }
    } catch {
      setBookingStatus("ERROR");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Search Hero Area */}
      <section style={{
        background: "linear-gradient(135deg, hsl(215, 28%, 8%), hsl(var(--primary-hue), 40%, 15%))",
        color: "white",
        padding: "60px 40px 80px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          top: "-50%",
          left: "-20%",
          width: "80%",
          height: "100%",
          background: "radial-gradient(circle, hsla(var(--primary-hue), 76%, 42%, 0.15) 0%, transparent 70%)",
          pointerEvents: "none"
        }}></div>

        <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h1 style={{
            fontSize: "3.2rem",
            lineHeight: "1.1",
            marginBottom: "16px",
            color: "white",
            fontFamily: "var(--font-display)"
          }}>
            Find the Right Mind, <span style={{ color: "var(--primary)" }}>Closer to Home</span>
          </h1>
          <p style={{
            color: "hsl(210, 10%, 80%)",
            fontSize: "1.2rem",
            marginBottom: "36px",
            fontWeight: "300"
          }}>
            Search verified board-certified psychiatrists, check accepted insurances, and secure appointments instantly.
          </p>

          {/* Quick Search Bar */}
          <div className="glass-panel" style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr auto",
            gap: "10px",
            padding: "10px",
            borderRadius: "var(--radius-lg)",
            background: "rgba(255,255,255,0.08)",
            borderColor: "rgba(255,255,255,0.12)"
          }}>
            {/* Specialty */}
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <span style={{ position: "absolute", left: "15px", color: "var(--primary)" }}>🔍</span>
              <select 
                value={specialty} 
                onChange={(e) => setSpecialty(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 10px 14px 40px",
                  background: "transparent",
                  border: "none",
                  color: "white",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="" style={{ color: "black" }}>All Specialties / Symptoms</option>
                <option value="ADHD" style={{ color: "black" }}>ADHD / Attention Struggles</option>
                <option value="Anxiety" style={{ color: "black" }}>Anxiety & Panic Attacks</option>
                <option value="Depression" style={{ color: "black" }}>Depression & Moods</option>
                <option value="PTSD" style={{ color: "black" }}>PTSD & Trauma Recovery</option>
                <option value="Bipolar Disorder" style={{ color: "black" }}>Bipolar Disorder</option>
                <option value="Sleep Disorders" style={{ color: "black" }}>Sleep Disorders / Insomnia</option>
                <option value="Women's Mental Health" style={{ color: "black" }}>Women's Mental Health</option>
              </select>
            </div>

            {/* Location Query */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", borderLeft: "1px solid rgba(255,255,255,0.15)" }}>
              <span style={{ position: "absolute", left: "15px", color: "var(--primary)" }}>📍</span>
              <input 
                type="text" 
                placeholder="ZIP Code or City"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 10px 14px 40px",
                  background: "transparent",
                  border: "none",
                  color: "white",
                  fontSize: "0.95rem",
                  outline: "none"
                }}
              />
            </div>

            {/* Radius */}
            <div style={{ position: "relative", display: "flex", alignItems: "center", borderLeft: "1px solid rgba(255,255,255,0.15)" }}>
              <span style={{ position: "absolute", left: "15px", color: "var(--primary)" }}>🧭</span>
              <select 
                value={distance} 
                onChange={(e) => setDistance(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 10px 14px 40px",
                  background: "transparent",
                  border: "none",
                  color: "white",
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  outline: "none"
                }}
              >
                <option value="5" style={{ color: "black" }}>Within 5 miles</option>
                <option value="10" style={{ color: "black" }}>Within 10 miles</option>
                <option value="25" style={{ color: "black" }}>Within 25 miles</option>
                <option value="50" style={{ color: "black" }}>Within 50 miles</option>
              </select>
            </div>

            {/* Search Trigger */}
            <button className="btn btn-primary" onClick={fetchResults} style={{ borderRadius: "var(--radius-md)", padding: "0 24px" }}>
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Main Grid View Container */}
      <section style={{ maxWidth: "1400px", margin: "-40px auto 60px", padding: "0 20px", display: "grid", gridTemplateColumns: "300px 1fr 380px", gap: "24px", zIndex: 5, position: "relative", width: "100%" }}>
        
        {/* Advanced Filters Sidebar */}
        <aside className="glass-panel filter-sidebar" style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}>
          <h3 style={{ fontSize: "1.2rem", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>Filters</h3>
          
          {/* Formats */}
          <div className="filter-section">
            <h4 className="filter-title">Session Format</h4>
            <label className="filter-option">
              <input type="radio" name="format" checked={format === "ANY"} onChange={() => setFormat("ANY")} className="filter-checkbox" />
              <span>Any format</span>
            </label>
            <label className="filter-option">
              <input type="radio" name="format" checked={format === "TELEHEALTH"} onChange={() => setFormat("TELEHEALTH")} className="filter-checkbox" />
              <span>Telehealth / Online</span>
            </label>
            <label className="filter-option">
              <input type="radio" name="format" checked={format === "IN_PERSON"} onChange={() => setFormat("IN_PERSON")} className="filter-checkbox" />
              <span>In-Office Clinic</span>
            </label>
          </div>

          {/* Insurances */}
          <div className="filter-section">
            <h4 className="filter-title">Insurance Provider</h4>
            <select 
              value={insurance} 
              onChange={(e) => setInsurance(e.target.value)}
              className="form-input"
              style={{ fontSize: "0.85rem" }}
            >
              <option value="">Select Insurance Plan</option>
              <option value="Aetna">Aetna</option>
              <option value="Blue Cross Blue Shield">Blue Cross Blue Shield</option>
              <option value="Cigna">Cigna</option>
              <option value="UnitedHealthcare">UnitedHealthcare</option>
              <option value="Humana">Humana</option>
              <option value="Medicare">Medicare</option>
            </select>
          </div>

          {/* Fee Range Slider */}
          <div className="filter-section">
            <h4 className="filter-title" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Max Session Fee</span>
              <span style={{ color: "var(--primary)", fontWeight: 700 }}>${maxFee}</span>
            </h4>
            <input 
              type="range" 
              min="100" 
              max="500" 
              step="20"
              value={maxFee} 
              onChange={(e) => setMaxFee(e.target.value)}
              style={{ width: "100%", accentColor: "var(--primary)", cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
              <span>$100</span>
              <span>$500+</span>
            </div>
          </div>

          {/* Sort Settings */}
          <div className="filter-section" style={{ borderBottom: "none", paddingBottom: 0 }}>
            <h4 className="filter-title">Sort By</h4>
            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value)}
              className="form-input"
              style={{ fontSize: "0.85rem" }}
            >
              <option value="best_match">⭐ Market Best Match (Composite)</option>
              <option value="distance">📍 Location Distance (Closest)</option>
              <option value="rating">👍 Top Patient Rating</option>
              <option value="price_low">💰 Session Fee (Lowest first)</option>
              <option value="price_high">💰 Session Fee (Highest first)</option>
            </select>
          </div>
        </aside>

        {/* Search Results Main Grid */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          
          {/* Header result stats */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", padding: "0 10px" }}>
            <div style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
              {loading ? "Searching profiles..." : `${doctors.length} verified psychiatrist profiles found near ${location}`}
            </div>
          </div>

          {/* Doctor List */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "80px", color: "var(--text-muted)" }}>
              <div className="nav-logo" style={{ animation: "pulse 1.5s infinite", justifyContent: "center", fontSize: "2rem" }}>
                🌀 Loading verified profiles...
              </div>
            </div>
          ) : doctors.length === 0 ? (
            <div className="glass-panel" style={{ padding: "60px 40px", textAlign: "center", background: "var(--bg-card)" }}>
              <span style={{ fontSize: "3rem" }}>🧐</span>
              <h3 style={{ margin: "20px 0 10px" }}>No Rebuilt Profiles Found</h3>
              <p style={{ color: "var(--text-muted)", maxWidth: "450px", margin: "0 auto 20px" }}>
                We resolved your coordinates but found no active clinics in this range. Try widening your distance or searching "New York" or "Los Angeles" to see seed listings!
              </p>
              <button className="btn btn-primary" onClick={() => { setLocation("New York"); setSpecialty(""); }}>
                Reset to Demo City (New York)
              </button>
            </div>
          ) : (
            doctors.map((doc) => (
              <div 
                key={doc.id} 
                className="glass-panel doc-card animated-fade"
                style={{ 
                  background: hoveredDocId === doc.id ? "var(--primary-light)" : "var(--bg-card)",
                  borderColor: doc.isSponsored ? "var(--primary)" : "var(--border-glass)",
                  borderWidth: doc.isSponsored ? "2px" : "1px",
                  position: "relative"
                }}
                onMouseEnter={() => setHoveredDocId(doc.id)}
                onMouseLeave={() => setHoveredDocId(null)}
              >
                {/* Sponsored Badge */}
                {doc.isSponsored && (
                  <span className="badge badge-primary" style={{ position: "absolute", top: "12px", right: "12px", fontSize: "0.65rem", padding: "3px 8px" }}>
                    ⭐ Sponsored Partner
                  </span>
                )}

                {/* Avatar */}
                <div className="doc-avatar-container">
                  <img src={doc.headshotUrl} alt={doc.name} className="doc-avatar" />
                </div>

                {/* Information */}
                <div className="doc-info">
                  <div>
                    {/* Title Name & Score */}
                    <div className="doc-header-row">
                      <div>
                        <h2 className="doc-name" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {doc.name}
                          <span className="badge badge-verified" style={{ fontSize: "0.65rem", textTransform: "none", verticalAlign: "middle" }}>
                            ✓ Verified Profile
                          </span>
                        </h2>
                        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>
                          {doc.clinicName} &bull; {doc.licenseType}
                        </div>
                      </div>
                      
                      {/* Score Badge */}
                      <div className="glass-panel" style={{
                        padding: "6px 12px",
                        textAlign: "center",
                        background: "linear-gradient(135deg, var(--bg-main), var(--bg-card))",
                        borderColor: "var(--primary-glow)",
                        flexShrink: 0
                      }}>
                        <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>Search Score</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--primary)" }}>{doc.computedScore}<span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/100</span></div>
                      </div>
                    </div>

                    {/* Review summaries */}
                    <div className="doc-rating-summary" style={{ margin: "6px 0" }}>
                      <span>{"★".repeat(Math.round(doc.avgRating))}</span>
                      <span style={{ color: "var(--text-muted)" }}>{"★".repeat(5 - Math.round(doc.avgRating))}</span>
                      <span style={{ fontWeight: 700, color: "var(--text-main)", marginLeft: "4px" }}>{doc.avgRating ? doc.avgRating.toFixed(1) : "NEW"}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>({doc.reviewCount} patient reviews)</span>
                    </div>

                    {/* Brief Narrative Bio */}
                    <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", margin: "8px 0 12px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {doc.bioPreview}
                    </p>

                    {/* Specialties row */}
                    <div className="doc-specialties-row">
                      {doc.specialtiesList.slice(0, 3).map((spec, i) => (
                        <span key={i} className="badge badge-secondary" style={{ fontSize: "0.7rem" }}>{spec}</span>
                      ))}
                      {doc.specialtiesList.length > 3 && (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", alignSelf: "center" }}>+{doc.specialtiesList.length - 3} more</span>
                      )}
                    </div>
                  </div>

                  {/* Financials & Distance metadata */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "14px", marginTop: "10px" }}>
                    <div className="doc-meta-grid" style={{ margin: 0, gap: "16px" }}>
                      <div className="meta-item">
                        <span>💰</span>
                        <div>
                          <strong>${doc.sessionFee}</strong>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}> / session</span>
                        </div>
                      </div>
                      <div className="meta-item">
                        <span>💻</span>
                        <div>
                          <strong>{doc.sessionFormat === "HYBRID" ? "Hybrid Clinic" : doc.sessionFormat === "TELEHEALTH" ? "Virtual Only" : "In-Person Clinic"}</strong>
                        </div>
                      </div>
                      {doc.computedDistance !== 9999 && (
                        <div className="meta-item">
                          <span>📍</span>
                          <div>
                            <strong>{doc.computedDistance.toFixed(1)} miles</strong> away
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <a href={`/doctor/${doc.id}`} className="btn btn-secondary" style={{ padding: "8px 14px", fontSize: "0.85rem" }}>
                        View Profile
                      </a>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                        onClick={() => setSelectedDocForBooking(doc)}
                      >
                        Book Slot
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Geospatial Mock Interactive Map */}
        <aside style={{ height: "calc(100vh - 150px)", top: "90px", position: "sticky" }}>
          <div className="glass-panel" style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-card)" }}>
            
            {/* Map Header */}
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border-color)", background: "var(--bg-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h4 style={{ fontSize: "0.95rem" }}>Geospatial Area</h4>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Active clinics plotted on coordinates</div>
              </div>
              <span className="badge badge-primary">Interactive GPS</span>
            </div>

            {/* Map Body Layout */}
            <div style={{ 
              flexGrow: 1, 
              background: "radial-gradient(circle, hsl(210, 30%, 96%) 0%, hsl(210, 16%, 90%) 100%)", 
              position: "relative",
              overflow: "hidden"
            }}>
              {/* Radial city grid mock vectors */}
              <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.6 }} xmlns="http://www.w3.org/2000/svg">
                <circle cx="50%" cy="50%" r="50" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                <circle cx="50%" cy="50%" r="100" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                <circle cx="50%" cy="50%" r="150" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
              </svg>

              {/* Geographic labels inside map */}
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "rgba(0,0,0,0.12)", fontWeight: 800, fontSize: "1.8rem", textTransform: "uppercase", letterSpacing: "0.1em", pointerEvents: "none" }}>
                {location || "GRID AREA"}
              </div>

              {/* Doctors' location coordinate dots */}
              {!loading && doctors.map((doc, idx) => {
                // Calculate random coordinate mapping within bounding box for rendering pins on canvas
                // We base seed coordinates around center
                const seedRandomLat = Math.sin(idx * 45) * 120 + 190;
                const seedRandomLng = Math.cos(idx * 45) * 120 + 190;

                const isActive = hoveredDocId === doc.id;

                return (
                  <div 
                    key={doc.id}
                    style={{
                      position: "absolute",
                      top: `${seedRandomLat}px`,
                      left: `${seedRandomLng}px`,
                      cursor: "pointer",
                      transform: "translate(-50%, -100%)",
                      transition: "var(--transition)",
                      zIndex: isActive ? 50 : 10
                    }}
                    onMouseEnter={() => setHoveredDocId(doc.id)}
                    onMouseLeave={() => setHoveredDocId(null)}
                  >
                    {/* Glowing pin element */}
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}>
                      <div style={{
                        padding: "4px 8px",
                        background: doc.isSponsored ? "var(--secondary)" : "var(--primary)",
                        color: "white",
                        borderRadius: "10px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        boxShadow: isActive ? "0 4px 15px rgba(0,0,0,0.3)" : "none",
                        border: "1.5px solid white",
                        whiteSpace: "nowrap",
                        transform: isActive ? "scale(1.15) translateY(-5px)" : "scale(1)",
                        transition: "var(--transition)"
                      }}>
                        {doc.name.split(" ")[1]}
                      </div>
                      
                      <div style={{
                        width: "12px",
                        height: "12px",
                        background: doc.isSponsored ? "var(--secondary)" : "var(--primary)",
                        border: "2px solid white",
                        borderRadius: "50%",
                        marginTop: "-2px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Map footer coordinates display */}
            <div style={{ padding: "12px", background: "var(--bg-glass)", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <span>Latitude: 40.71° N</span>
              <span>Longitude: 74.00° W</span>
            </div>
          </div>
        </aside>
      </section>

      {/* Quick Booking Modal */}
      {selectedDocForBooking && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div className="glass-panel animate-fade" style={{
            background: "var(--bg-card)",
            width: "100%",
            maxWidth: "500px",
            padding: "30px",
            borderRadius: "var(--radius-md)",
            border: "1.5px solid var(--primary-glow)",
            boxShadow: "var(--shadow-lg)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.4rem" }}>Book Appointment</h3>
              <button 
                onClick={() => setSelectedDocForBooking(null)}
                style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: "flex", gap: "16px", marginBottom: "20px", alignItems: "center" }}>
              <img 
                src={selectedDocForBooking.headshotUrl} 
                alt={selectedDocForBooking.name} 
                style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover" }} 
              />
              <div>
                <h4 style={{ fontSize: "1.1rem" }}>{selectedDocForBooking.name}</h4>
                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{selectedDocForBooking.clinicName}</div>
              </div>
            </div>

            {bookingStatus === "SUCCESS" ? (
              <div style={{ textAlign: "center", padding: "30px 10px", color: "var(--success)" }}>
                <span style={{ fontSize: "3rem" }}>🎉</span>
                <h3 style={{ margin: "16px 0 8px" }}>Booking Successful!</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  Your appointment slot is secured. The clinic will email you confirmation details.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>Select Available Slot *</label>
                  <select 
                    required 
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="form-input"
                  >
                    <option value="">Choose a date & time</option>
                    {selectedDocForBooking.availability
                      .filter(slot => !slot.isBooked)
                      .slice(0, 8)
                      .map((slot) => {
                        const date = new Date(slot.startTime);
                        return (
                          <option key={slot.id} value={slot.id}>
                            📅 {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </option>
                        );
                      })}
                  </select>
                  {selectedDocForBooking.availability.filter(slot => !slot.isBooked).length === 0 && (
                    <div style={{ color: "var(--danger)", fontSize: "0.75rem", marginTop: "4px" }}>No open slots soon. Please contact the office directly.</div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>Your Full Name *</label>
                  <input 
                    type="text" 
                    required
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="form-input" 
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>Email *</label>
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
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>Phone *</label>
                    <input 
                      type="tel" 
                      required
                      value={bookingPhone}
                      onChange={(e) => setBookingPhone(e.target.value)}
                      placeholder="(555) 000-0000"
                      className="form-input" 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px" }}>Insurance Provider (Optional)</label>
                  <input 
                    type="text" 
                    value={bookingInsurance}
                    onChange={(e) => setBookingInsurance(e.target.value)}
                    placeholder="e.g. Aetna"
                    className="form-input" 
                  />
                </div>

                {bookingStatus === "ERROR" && (
                  <div style={{ color: "var(--danger)", fontSize: "0.8rem", textAlign: "center" }}>
                    🚨 Failed to book slot. Please try again.
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                  <button 
                    type="button" 
                    onClick={() => setSelectedDocForBooking(null)} 
                    className="btn btn-secondary" 
                    style={{ flexGrow: 1 }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={bookingStatus === "PENDING" || !selectedSlotId}
                    className="btn btn-primary" 
                    style={{ flexGrow: 1 }}
                  >
                    {bookingStatus === "PENDING" ? "Booking..." : "Confirm Booking"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
