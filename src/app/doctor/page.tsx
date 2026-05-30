"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

interface Booking {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  insurance: string | null;
  status: string;
  slot: { startTime: string };
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
  sessionFormat: string;
  sessionFee: number;
  slidingScale: boolean;
  introVideoUrl: string | null;
  bioFull: string;
  searchScore: number;
  verificationStatus: string;
  reviews: Review[];
  availability: Slot[];
  bookings: Booking[];
}

export default function DoctorPortal() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [doc, setDoc] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("standing"); // "standing" | "calendar" | "settings" | "bookings" | "reviews"
  
  // Settings Form values
  const [clinicName, setClinicName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [sessionFormat, setSessionFormat] = useState("TELEHEALTH");
  const [sessionFee, setSessionFee] = useState("200");
  const [slidingScale, setSlidingScale] = useState(false);
  const [introVideoUrl, setIntroVideoUrl] = useState("");
  const [bioFull, setBioFull] = useState("");
  const [settingsStatus, setSettingsStatus] = useState<"IDLE" | "PENDING" | "SUCCESS">("IDLE");

  // New Availability Slot Input
  const [newSlotDateTime, setNewSlotDateTime] = useState("");
  const [slotStatus, setSlotStatus] = useState<"IDLE" | "PENDING" | "SUCCESS" | "ERROR">("IDLE");

  // Load and verify doctor session
  useEffect(() => {
    const raw = localStorage.getItem("doctor_session");
    if (!raw) {
      router.push("/doctor/login");
      return;
    }
    const sess = JSON.parse(raw);
    setSession(sess);

    if (!sess.profileId) {
      router.push("/doctor/login");
      return;
    }

    fetchDoctorProfile(sess.profileId);
  }, []);

  const fetchDoctorProfile = async (profileId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/doctor/${profileId}`);
      const data = await res.json();
      if (data.success) {
        setDoc(data.data);
        // Prep form settings
        setClinicName(data.data.clinicName);
        setAddress(data.data.address);
        setCity(data.data.city);
        setState(data.data.state);
        setZipCode(data.data.zipCode);
        setSessionFormat(data.data.sessionFormat);
        setSessionFee(data.data.sessionFee.toString());
        setSlidingScale(data.data.slidingScale);
        setIntroVideoUrl(data.data.introVideoUrl || "");
        setBioFull(data.data.bioFull || "");
      }
    } catch (err) {
      console.error("Failed to retrieve profile data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const handleLogout = () => {
    localStorage.removeItem("doctor_session");
    router.push("/doctor/login");
  };

  // Add a new availability opening
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotDateTime || !doc) return;
    setSlotStatus("PENDING");

    try {
      const res = await fetch("/api/doctor/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: doc.id,
          startTime: newSlotDateTime
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSlotStatus("SUCCESS");
        // Append slot locally
        setDoc(prev => {
          if (!prev) return prev;
          const updatedSlots = [...prev.availability, data.slot].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
          return {
            ...prev,
            availability: updatedSlots
          };
        });
        // Refetch to update calculated searchScore
        fetchDoctorProfile(doc.id);
        setTimeout(() => setSlotStatus("IDLE"), 2500);
        setNewSlotDateTime("");
      } else {
        setSlotStatus("ERROR");
      }
    } catch {
      setSlotStatus("ERROR");
    }
  };

  // Delete an open slot
  const handleDeleteSlot = async (slotId: string) => {
    if (!doc) return;
    if (!confirm("Are you sure you want to delete this open time slot?")) return;

    try {
      const res = await fetch(`/api/doctor/slots?slotId=${slotId}&profileId=${doc.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setDoc(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            availability: prev.availability.filter(s => s.id !== slotId)
          };
        });
        // Refetch searchScore
        fetchDoctorProfile(doc.id);
      } else {
        alert(data.error);
      }
    } catch {
      alert("Failed to delete slot.");
    }
  };

  // Save Settings forms
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc) return;
    setSettingsStatus("PENDING");

    try {
      const res = await fetch("/api/doctor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: doc.id,
          clinicName, address, city, state, zipCode,
          sessionFormat, sessionFee, slidingScale, introVideoUrl, bioFull
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsStatus("SUCCESS");
        setDoc(data.data);
        setTimeout(() => setSettingsStatus("IDLE"), 3000);
      }
    } catch {
      setSettingsStatus("IDLE");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "120px", color: "var(--text-muted)" }}>
        🌀 Loading clinical database logs...
      </div>
    );
  }

  if (!doc) return null;

  // Real-time Optimization Checklist Analysis
  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);
  const activeSlots = doc.availability.filter(s => !s.isBooked && new Date(s.startTime) >= now && new Date(s.startTime) <= nextWeek).length;

  return (
    <div style={{ minHeight: "90vh", background: "var(--bg-main)", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Portal Header */}
        <div className="glass-panel" style={{ padding: "24px 30px", background: "var(--bg-card)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px", marginBottom: "30px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="badge badge-verified" style={{ background: doc.verificationStatus === "APPROVED" ? "hsl(142,69%,92%)" : "hsl(38,92%,92%)", color: doc.verificationStatus === "APPROVED" ? "var(--success)" : "var(--accent)" }}>
                ● Directory: {doc.verificationStatus}
              </span>
              <span className="badge badge-secondary">NPI: {doc.npiNumber}</span>
            </div>
            <h1 style={{ fontSize: "2rem", marginTop: "6px" }}>Welcome back, {session?.name}</h1>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Clinical practice: <strong>{doc.clinicName}</strong></div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <a href={`/doctor/${doc.id}`} target="_blank" className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
              🔗 View Public Listing
            </a>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ border: "1px solid var(--danger)", color: "var(--danger)", padding: "8px 16px", fontSize: "0.85rem" }}>
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", gap: "20px", marginBottom: "30px", overflowX: "auto" }}>
          <button 
            onClick={() => setActiveTab("standing")}
            style={{
              padding: "12px 6px",
              background: "transparent",
              border: "none",
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: activeTab === "standing" ? "var(--primary)" : "var(--text-muted)",
              borderBottom: activeTab === "standing" ? "3px solid var(--primary)" : "3px solid transparent",
              cursor: "pointer",
              transition: "var(--transition)",
              whiteSpace: "nowrap"
            }}
          >
            ⭐ Search Optimization Standing
          </button>
          <button 
            onClick={() => setActiveTab("calendar")}
            style={{
              padding: "12px 6px",
              background: "transparent",
              border: "none",
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: activeTab === "calendar" ? "var(--primary)" : "var(--text-muted)",
              borderBottom: activeTab === "calendar" ? "3px solid var(--primary)" : "3px solid transparent",
              cursor: "pointer",
              transition: "var(--transition)",
              whiteSpace: "nowrap"
            }}
          >
            📅 Calendar Availability Slots
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            style={{
              padding: "12px 6px",
              background: "transparent",
              border: "none",
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: activeTab === "settings" ? "var(--primary)" : "var(--text-muted)",
              borderBottom: activeTab === "settings" ? "3px solid var(--primary)" : "3px solid transparent",
              cursor: "pointer",
              transition: "var(--transition)",
              whiteSpace: "nowrap"
            }}
          >
            ⚙️ Edit Listing Details
          </button>
          <button 
            onClick={() => setActiveTab("bookings")}
            style={{
              padding: "12px 6px",
              background: "transparent",
              border: "none",
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: activeTab === "bookings" ? "var(--primary)" : "var(--text-muted)",
              borderBottom: activeTab === "bookings" ? "3px solid var(--primary)" : "3px solid transparent",
              cursor: "pointer",
              transition: "var(--transition)",
              whiteSpace: "nowrap"
            }}
          >
            📝 Bookings Log ({doc.bookings ? doc.bookings.length : 0})
          </button>
          <button 
            onClick={() => setActiveTab("reviews")}
            style={{
              padding: "12px 6px",
              background: "transparent",
              border: "none",
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: activeTab === "reviews" ? "var(--primary)" : "var(--text-muted)",
              borderBottom: activeTab === "reviews" ? "3px solid var(--primary)" : "3px solid transparent",
              cursor: "pointer",
              transition: "var(--transition)",
              whiteSpace: "nowrap"
            }}
          >
            👍 Patient Feedbacks ({doc.reviews.length})
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="animated-fade">
          
          {/* Standing Dashboard */}
          {activeTab === "standing" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: "30px" }}>
              {/* Radial Indicator Score */}
              <div className="glass-panel" style={{ padding: "30px", background: "var(--bg-card)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <h3 style={{ fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--text-muted)", marginBottom: "20px" }}>Optimization Index</h3>
                
                <div style={{
                  position: "relative",
                  width: "160px",
                  height: "160px",
                  borderRadius: "50%",
                  background: `conic-gradient(var(--primary) ${doc.searchScore * 3.6}deg, var(--border-color) 0deg)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px"
                }}>
                  <div style={{
                    width: "135px",
                    height: "135px",
                    borderRadius: "50%",
                    background: "var(--bg-card)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <span style={{ fontSize: "2.4rem", fontWeight: 800, color: "var(--primary)", fontFamily: "var(--font-display)" }}>{doc.searchScore}</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Score / 100</span>
                  </div>
                </div>

                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.5" }}>
                  A higher Search Standing score increases your prominence, displays your card above others in search results, and raises booking frequencies.
                </div>
              </div>

              {/* Suggestions checklists */}
              <div className="glass-panel" style={{ padding: "30px", background: "var(--bg-card)" }}>
                <h3 style={{ fontSize: "1.3rem", marginBottom: "15px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>Standing Audit Checklist</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  
                  {/* Suggestion 1: Video */}
                  <div style={{ display: "flex", gap: "15px", alignItems: "flex-start", background: doc.introVideoUrl ? "hsl(142,69%,96%)" : "var(--bg-main)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                    <span style={{ fontSize: "1.5rem" }}>{doc.introVideoUrl ? "✅" : "➕"}</span>
                    <div>
                      <strong style={{ fontSize: "0.95rem" }}>Clinic Introductory Video (+5 pts)</strong>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        {doc.introVideoUrl ? "Verified! Video consulting link is loaded." : "Add a consult/welcome video URL in settings to introduce your practice values."}
                      </p>
                    </div>
                  </div>

                  {/* Suggestion 2: Bio length */}
                  <div style={{ display: "flex", gap: "15px", alignItems: "flex-start", background: (doc.bioFull && doc.bioFull.length > 200) ? "hsl(142,69%,96%)" : "var(--bg-main)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                    <span style={{ fontSize: "1.5rem" }}>{(doc.bioFull && doc.bioFull.length > 200) ? "✅" : "➕"}</span>
                    <div>
                      <strong style={{ fontSize: "0.95rem" }}>Meticulous Clinical Statement (+5 pts)</strong>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        {(doc.bioFull && doc.bioFull.length > 200) ? `Verified! Narrative contains ${doc.bioFull.length} characters.` : "Write a detailed clinical profile (over 200 characters) sharing your narrative."}
                      </p>
                    </div>
                  </div>

                  {/* Suggestion 3: Near term availability */}
                  <div style={{ display: "flex", gap: "15px", alignItems: "flex-start", background: activeSlots >= 6 ? "hsl(142,69%,96%)" : "var(--bg-main)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                    <span style={{ fontSize: "1.5rem" }}>{activeSlots >= 6 ? "✅" : "➕"}</span>
                    <div>
                      <strong style={{ fontSize: "0.95rem" }}>Near-Term Scheduling Slots (+20 pts)</strong>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        {activeSlots >= 6 ? `Verified! You have ${activeSlots} slots in the next 7 days.` : `Boost slots! You have ${activeSlots} active slots. Add ${6 - activeSlots} more openings in the next 7 days.`}
                      </p>
                    </div>
                  </div>

                  {/* Suggestion 4: Sliding scale */}
                  <div style={{ display: "flex", gap: "15px", alignItems: "flex-start", background: doc.slidingScale ? "hsl(142,69%,96%)" : "var(--bg-main)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                    <span style={{ fontSize: "1.5rem" }}>{doc.slidingScale ? "✅" : "➕"}</span>
                    <div>
                      <strong style={{ fontSize: "0.95rem" }}>Sliding Scale Financing (+5 pts)</strong>
                      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        {doc.slidingScale ? "Verified! Configured sliding scale options." : "Enable sliding scale in settings to grab patient budget queries."}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* Calendar Slots panel */}
          {activeTab === "calendar" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 2fr", gap: "30px" }}>
              
              {/* Add slot form */}
              <div className="glass-panel" style={{ padding: "24px", background: "var(--bg-card)", height: "fit-content" }}>
                <h3 style={{ fontSize: "1.15rem", marginBottom: "15px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>Create Availability Slot</h3>
                
                {slotStatus === "SUCCESS" && (
                  <div style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "10px", borderRadius: "4px", fontSize: "0.85rem", marginBottom: "15px", textAlign: "center" }}>
                    🎉 Time Slot Generated!
                  </div>
                )}

                <form onSubmit={handleAddSlot} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "6px" }}>Select Date & Time</label>
                    <input 
                      type="datetime-local" 
                      required 
                      value={newSlotDateTime}
                      onChange={(e) => setNewSlotDateTime(e.target.value)}
                      className="form-input" 
                    />
                  </div>
                  <button type="submit" disabled={slotStatus === "PENDING"} className="btn btn-primary" style={{ width: "100%" }}>
                    {slotStatus === "PENDING" ? "Generating..." : "Open Time Slot"}
                  </button>
                </form>
              </div>

              {/* Slot listings list */}
              <div className="glass-panel" style={{ padding: "30px", background: "var(--bg-card)" }}>
                <h3 style={{ fontSize: "1.3rem", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>Current Openings Schedule</h3>
                
                {doc.availability.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "40px" }}>
                    No time slots configured. Add openings to increase search scores and receive bookings!
                  </p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
                    {doc.availability.map((slot) => {
                      const date = new Date(slot.startTime);
                      return (
                        <div 
                          key={slot.id} 
                          style={{
                            background: slot.isBooked ? "hsl(210,30%,95%)" : "hsl(142,69%,96%)",
                            border: slot.isBooked ? "1px solid var(--border-color)" : "1px solid var(--primary-glow)",
                            padding: "14px",
                            borderRadius: "var(--radius-sm)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            gap: "10px"
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                              📅 {date.toLocaleDateString()}
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                              ⏰ {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span className="badge" style={{ 
                              background: slot.isBooked ? "var(--border-color)" : "var(--primary)",
                              color: slot.isBooked ? "var(--text-muted)" : "white",
                              fontSize: "0.6rem"
                            }}>
                              {slot.isBooked ? "BOOKED" : "OPEN AVAILABLE"}
                            </span>
                            
                            {!slot.isBooked && (
                              <button 
                                onClick={() => handleDeleteSlot(slot.id)}
                                style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Settings forms panel */}
          {activeTab === "settings" && (
            <div className="glass-panel" style={{ padding: "30px", background: "var(--bg-card)" }}>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>Practice Details Settings</h3>

              {settingsStatus === "SUCCESS" && (
                <div style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "12px", borderRadius: "4px", fontSize: "0.9rem", marginBottom: "20px", textAlign: "center" }}>
                  ✨ Clinical profile and search standing recalculated successfully!
                </div>
              )}

              <form onSubmit={handleSettingsSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>Clinic Office Name</label>
                  <input type="text" value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="form-input" />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>Office Address</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="form-input" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>City</label>
                    <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="form-input" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>State</label>
                    <input type="text" maxLength={2} value={state} onChange={(e) => setState(e.target.value)} className="form-input" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>ZIP</label>
                    <input type="text" value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="form-input" />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>Introductory Video consult URL</label>
                  <input type="text" value={introVideoUrl} onChange={(e) => setIntroVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="form-input" />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>Primary Consultation Format</label>
                  <select value={sessionFormat} onChange={(e) => setSessionFormat(e.target.value)} className="form-input">
                    <option value="TELEHEALTH">Telehealth / Online Only</option>
                    <option value="IN_PERSON">In-Office Clinic Only</option>
                    <option value="HYBRID">Hybrid Office & Remote</option>
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", alignItems: "center" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>Session Fee ($)</label>
                    <input type="number" value={sessionFee} onChange={(e) => setSessionFee(e.target.value)} className="form-input" />
                  </div>
                  <div style={{ marginTop: "24px" }}>
                    <label className="filter-option" style={{ margin: 0 }}>
                      <input type="checkbox" checked={slidingScale} onChange={(e) => setSlidingScale(e.target.checked)} className="filter-checkbox" />
                      <strong>Offer Sliding Scale Fees</strong>
                    </label>
                  </div>
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>Full Bio Statement Statement</label>
                  <textarea rows={5} value={bioFull} onChange={(e) => setBioFull(e.target.value)} className="form-input" style={{ resize: "none" }} />
                </div>

                <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" disabled={settingsStatus === "PENDING"} className="btn btn-primary" style={{ padding: "10px 24px" }}>
                    {settingsStatus === "PENDING" ? "Saving updates..." : "Save Profile Details"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bookings log panel */}
          {activeTab === "bookings" && (
            <div className="glass-panel" style={{ padding: "30px", background: "var(--bg-card)" }}>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>Patient Appointments Log</h3>
              
              {!doc.bookings || doc.bookings.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "40px" }}>
                  No patients have booked appointments yet. Once they book a slot from your public profile, they appear here.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--text-muted)" }}>
                        <th style={{ padding: "12px" }}>Patient Name</th>
                        <th style={{ padding: "12px" }}>Selected Date & Hour</th>
                        <th style={{ padding: "12px" }}>Email</th>
                        <th style={{ padding: "12px" }}>Phone</th>
                        <th style={{ padding: "12px" }}>Insurance Provider</th>
                        <th style={{ padding: "12px" }}>Verification Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doc.bookings.map((book) => {
                        const date = new Date(book.slot.startTime);
                        return (
                          <tr key={book.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                            <td style={{ padding: "12px", fontWeight: 700 }}>{book.patientName}</td>
                            <td style={{ padding: "12px" }}>
                              <strong>{date.toLocaleDateString()}</strong> at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td style={{ padding: "12px" }}>{book.patientEmail}</td>
                            <td style={{ padding: "12px" }}>{book.patientPhone}</td>
                            <td style={{ padding: "12px" }}>
                              {book.insurance ? (
                                <span className="badge badge-secondary" style={{ fontSize: "0.65rem", textTransform: "none" }}>{book.insurance}</span>
                              ) : (
                                <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Private pay</span>
                              )}
                            </td>
                            <td style={{ padding: "12px" }}>
                              <span className="badge badge-verified" style={{ background: "hsl(142,69%,92%)", color: "var(--success)" }}>
                                CONFIRMED
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Patient reviews panel */}
          {activeTab === "reviews" && (
            <div className="glass-panel" style={{ padding: "30px", background: "var(--bg-card)" }}>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>Patient Reviews & Ratings</h3>
              
              {doc.reviews.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "40px" }}>
                  No reviews submitted yet. Patient reviews left on your public page will appear here.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {doc.reviews.map((rev) => (
                    <div key={rev.id} style={{ padding: "20px", background: "var(--bg-main)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <div>
                          <strong style={{ fontSize: "0.95rem" }}>{rev.patientName}</strong>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "10px" }}>Posted on {new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span style={{ color: "var(--accent)" }}>{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</span>
                      </div>
                      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
