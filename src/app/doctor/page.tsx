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

function AnalyticsDashboard({ doctorId }: { doctorId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/doctor/analytics?doctorId=${doctorId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [doctorId]);

  if (loading) return <div className="py-24 text-center text-slate-500 font-medium animate-pulse">Loading Live Analytics...</div>;
  if (!data) return <div className="py-24 text-center text-slate-500">Failed to load analytics.</div>;

  const maxWeeklyViews = Math.max(...data.profileViews.weekly.map((w: { val: number }) => w.val), 1);
  const colors = ["bg-emerald-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500"];

  return (
    <div className="flex flex-col gap-8">
      {/* Premium Analytics Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { title: "Profile Views", value: data.profileViews.total, pct: "Last 30 days", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
          { title: "Unique Visitors", value: data.uniqueVisitors, pct: "Last 30 days", color: "text-blue-600 bg-blue-50 border-blue-100" },
          { title: "Search Appearances", value: data.searchAppearances, pct: "Last 30 days", color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
          { title: "Conversion rate", value: data.conversionRate, pct: "Slots booked directly", color: "text-purple-600 bg-purple-50 border-purple-100" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{stat.title}</span>
            <strong className="block text-2xl font-black text-slate-900 mt-1">{stat.value}</strong>
            <div className="flex items-center gap-1 mt-2">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${stat.color}`}>
                {stat.pct}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Graphical Breakdown & Referral grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Visual Bar Chart for Profile Views by Day */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-display font-bold text-sm text-slate-900">Weekly Profile Views</h4>
              <p className="text-[10px] text-slate-500">Reach metrics over the last 7 active days</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">LIVE</span>
          </div>

          <div className="h-48 flex items-end justify-between gap-4 pt-4 px-2">
            {data.profileViews.weekly.map((bar: { val: number, day: string }, idx: number) => {
              const heightPct = `${Math.round((bar.val / maxWeeklyViews) * 100)}%`;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full bg-slate-50 hover:bg-slate-100 rounded-lg flex items-end h-36 relative overflow-hidden transition-all duration-300">
                    <div
                      style={{ height: heightPct }}
                      className="w-full bg-emerald-500 group-hover:bg-emerald-600 rounded-lg transition-all duration-500 shadow-sm"
                    />
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-900 text-white px-1.5 py-0.5 rounded shadow">
                      {bar.val} views
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500">{bar.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Referral source break-down */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h4 className="font-display font-bold text-sm text-slate-900 mb-4 border-b border-slate-100 pb-2">Referral Sources</h4>
          {data.referralSources.length === 0 ? (
            <p className="text-slate-400 text-xs italic">No referral data yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {data.referralSources.map((ref: { name: string, share: string, count: number }, idx: number) => (
                <div key={idx}>
                  <div className="flex justify-between items-center text-[10px] mb-1">
                    <strong className="text-slate-700 font-bold">{ref.name}</strong>
                    <span className="text-slate-400 font-semibold">{ref.share} &bull; {ref.count} views</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: ref.share }} className={`h-full ${colors[idx % colors.length]} rounded-full`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Geographic Reach & Origin breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h4 className="font-display font-bold text-sm text-slate-900 mb-4 border-b border-slate-100 pb-2">Geographic Reach Breakdown</h4>
        {data.geographicReach.length === 0 ? (
          <p className="text-slate-400 text-xs italic">No geographic data yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {data.geographicReach.map((geo: { city: string, reach: string, description: string }, idx: number) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <strong className="text-xs font-bold text-slate-900">{geo.city}</strong>
                  <span className="text-xs font-black text-emerald-600">{geo.reach}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">{geo.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DoctorPortal() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [session, setSession] = useState<any>(null);
  const [doc, setDoc] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("standing"); // "standing" | "calendar" | "settings" | "bookings" | "reviews"

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Settings Form values
  const [name, setName] = useState("");
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
  const [bioPreview, setBioPreview] = useState("");
  const [headshotUrl, setHeadshotUrl] = useState("");
  const [licenseType, setLicenseType] = useState("MD");
  const [licenseState, setLicenseState] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [npiNumber, setNpiNumber] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  
  // List fields in comma-separated string format
  const [specialtiesText, setSpecialtiesText] = useState("");
  const [treatmentModalitiesText, setTreatmentModalitiesText] = useState("");
  const [targetDemographicsText, setTargetDemographicsText] = useState("");
  const [languagesText, setLanguagesText] = useState("");

  const [settingsStatus, setSettingsStatus] = useState<"IDLE" | "PENDING" | "SUCCESS">("IDLE");

  // New Availability Slot Input
  const [newSlotDateTime, setNewSlotDateTime] = useState("");
  const [slotStatus, setSlotStatus] = useState<"IDLE" | "PENDING" | "SUCCESS" | "ERROR">("IDLE");

  useEffect(() => {
    const raw = localStorage.getItem("doctor_session");
    if (!raw) {
      router.push("/doctor/login");
      return;
    }
    const sess = JSON.parse(raw);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(sess);

    if (!sess.profileId) {
      router.push("/doctor/login");
      return;
    }

    fetchDoctorProfile(sess.profileId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchDoctorProfile(profileId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/doctor/${profileId}`);
      const data = await res.json();
      if (data.success) {
        setDoc(data.data);
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
        
        setName(data.data.user?.name || data.data.name || "");
        setBioPreview(data.data.bioPreview || "");
        setHeadshotUrl(data.data.headshotUrl || "");
        setLicenseType(data.data.licenseType || "MD");
        setLicenseState(data.data.licenseState || "");
        setLicenseNumber(data.data.licenseNumber || "");
        setNpiNumber(data.data.npiNumber || "");
        setWebsiteUrl(data.data.websiteUrl || "");
        setLinkedinUrl(data.data.linkedinUrl || "");
        setTwitterUrl(data.data.twitterUrl || "");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parseListToText = (val: any) => {
          if (!val) return "";
          if (Array.isArray(val)) return val.join(", ");
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed.join(", ") : "";
          } catch {
            return "";
          }
        };

        setSpecialtiesText(parseListToText(data.data.specialties));
        setTreatmentModalitiesText(parseListToText(data.data.treatmentModalities));
        setTargetDemographicsText(parseListToText(data.data.targetDemographics));
        setLanguagesText(parseListToText(data.data.languages));
      }
    } catch (err) {
      console.error("Failed to retrieve profile data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("doctor_session");
    router.push("/doctor/login");
  };

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
        setDoc(prev => {
          if (!prev) return prev;
          const updatedSlots = [...prev.availability, data.slot].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
          return {
            ...prev,
            availability: updatedSlots
          };
        });
        fetchDoctorProfile(doc.id);
        setTimeout(() => setSlotStatus("IDLE"), 2000);
        setNewSlotDateTime("");
      } else {
        setSlotStatus("ERROR");
      }
    } catch {
      setSlotStatus("ERROR");
    }
  };

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
        fetchDoctorProfile(doc.id);
      } else {
        alert(data.error);
      }
    } catch {
      alert("Failed to delete slot.");
    }
  };

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
          name,
          clinicName, address, city, state, zipCode,
          sessionFormat, sessionFee, slidingScale, introVideoUrl, bioFull,
          bioPreview, headshotUrl, licenseType, licenseState, licenseNumber, npiNumber,
          websiteUrl, linkedinUrl, twitterUrl,
          specialties: specialtiesText.split(",").map(s => s.trim()).filter(Boolean),
          treatmentModalities: treatmentModalitiesText.split(",").map(t => t.trim()).filter(Boolean),
          targetDemographics: targetDemographicsText.split(",").map(d => d.trim()).filter(Boolean),
          languages: languagesText.split(",").map(l => l.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettingsStatus("SUCCESS");
        setDoc(prev => prev ? {
          ...prev,
          ...data.data,
          availability: prev.availability,
          bookings: prev.bookings,
          reviews: prev.reviews,
        } : data.data);
        
        // Refresh local session name
        const raw = localStorage.getItem("doctor_session");
        if (raw) {
          const sess = JSON.parse(raw);
          sess.name = name;
          localStorage.setItem("doctor_session", JSON.stringify(sess));
          setSession(sess);
        }

        setTimeout(() => setSettingsStatus("IDLE"), 2000);
      }
    } catch {
      setSettingsStatus("IDLE");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 text-slate-500 font-medium">
        🌀 Loading provider dashboard environment...
      </div>
    );
  }

  if (!doc) return null;

  const now = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(now.getDate() + 7);
  const activeSlots = (doc.availability || []).filter(s => !s.isBooked && new Date(s.startTime) >= now && new Date(s.startTime) <= nextWeek).length;

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Workspace header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 shadow-sm">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${doc.verificationStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                Status: {doc.verificationStatus}
              </span>
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                NPI: {doc.npiNumber}
              </span>
            </div>
            <h1 className="font-display text-2xl font-extrabold text-slate-900">Welcome, {session?.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Clinical practice: <strong className="text-slate-800">{doc.clinicName}</strong></p>
          </div>

          <div className="flex gap-2.5">
            <a href={`/doctor/${doc.id}`} target="_blank" className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all rounded-lg px-4 py-2 border border-slate-200">
              Public Profile
            </a>
            <button onClick={handleLogout} className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg px-4 py-2 cursor-pointer">
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

          {/* Premium Sidebar Navigation */}
          <aside className="md:col-span-3 flex flex-col gap-2">
            {[
              { id: "standing", label: "standing optimization", isWip: false },
              { id: "calendar", label: "scheduling slots", isWip: false },
              { id: "settings", label: "profile details", isWip: false },
              { id: "bookings", label: "patient bookings", isWip: true },
              { id: "reviews", label: `feedbacks (${doc.reviews.length})`, isWip: false },
              { id: "analytics", label: "profile analytics", isWip: false }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left font-semibold text-xs capitalize whitespace-nowrap cursor-pointer transition-all flex items-center justify-between p-3.5 rounded-xl border ${activeTab === tab.id
                    ? 'text-emerald-700 bg-emerald-50/70 border-emerald-200/80 shadow-sm'
                    : 'text-slate-600 bg-white hover:bg-slate-50 border-slate-200/60 hover:text-slate-900'
                  }`}
              >
                <span>{tab.label}</span>
                {tab.isWip && (
                  <span className="text-[8px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wider scale-90">
                    WIP
                  </span>
                )}
              </button>
            ))}
          </aside>

          {/* Active Tab Contents */}
          <main className="md:col-span-9 animate-fade">

            {/* Standing tab */}
            {activeTab === "standing" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Radial index card */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 text-center flex flex-col items-center justify-center shadow-sm">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400 mb-6">Search prominence score</h3>
                  <div style={{
                    position: "relative",
                    width: "140px",
                    height: "140px",
                    borderRadius: "50%",
                    background: `conic-gradient(#10b981 ${doc.searchScore * 3.6}deg, #f1f5f9 0deg)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }} className="mb-6 shadow-inner">
                    <div className="w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center shadow-md">
                      <span className="font-display text-3xl font-extrabold text-emerald-600">{doc.searchScore}</span>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">score / 100</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Higher scores increase listing ranking in patient geolocation query grids, boosting booking conversions.
                  </p>
                </div>

                {/* suggestions card */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-display font-bold text-sm text-slate-900 mb-4 border-b border-slate-100 pb-2">Optimization Audit checklist</h3>

                  <div className="flex flex-col gap-4">
                    {[
                      { title: "Introductory Video consult (+5 pts)", desc: "Add a consulte video URL in details to introduce yourself.", met: !!doc.introVideoUrl },
                      { title: "Clinical Narrative details (+5 pts)", desc: "Write a detailed bio narrative statement exceeding 200 characters.", met: !!(doc.bioFull && doc.bioFull.length > 200) },
                      { title: "Near-Term Calendar openings (+20 pts)", desc: "Add at least 6 open slots in the next 7 days.", met: activeSlots >= 6 },
                      { title: "Sliding Scale Financing options (+5 pts)", desc: "Enable sliding scale fee adjustments in your profile.", met: doc.slidingScale }
                    ].map((item, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border flex gap-4 items-start ${item.met ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/50 border-slate-200'}`}>
                        <span className="text-sm mt-0.5">{item.met ? "✅" : "➕"}</span>
                        <div>
                          <strong className={`text-xs block ${item.met ? 'text-emerald-800' : 'text-slate-800'}`}>{item.title}</strong>
                          <p className="text-[10px] text-slate-500 mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Calendar tab */}
            {activeTab === "calendar" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Creator card */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">Open Time Slot</h3>
                  {slotStatus === "SUCCESS" && (
                    <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold p-2.5 rounded-lg text-center mb-4">
                      ✓ Slot Added Successfully
                    </div>
                  )}
                  <form onSubmit={handleAddSlot} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Pick Date & Time</label>
                      <input
                        type="datetime-local"
                        required
                        value={newSlotDateTime}
                        onChange={(e) => setNewSlotDateTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <button type="submit" disabled={slotStatus === "PENDING"} className="w-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 py-3 rounded-lg cursor-pointer">
                      {slotStatus === "PENDING" ? "Adding slot..." : "Open Time Slot"}
                    </button>
                  </form>
                </div>

                {/* slots list card */}
                <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-display font-bold text-sm text-slate-900 mb-4 border-b border-slate-100 pb-2">Active Schedule Slots</h3>

                  {doc.availability.length === 0 ? (
                    <p className="text-slate-400 text-xs italic text-center py-12">No scheduler openings yet. Add slot times to receive patient bookings.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {doc.availability.map(slot => {
                        const date = new Date(slot.startTime);
                        return (
                          <div key={slot.id} className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${slot.isBooked ? 'bg-slate-50 border-slate-200' : 'bg-emerald-50/30 border-emerald-100'}`}>
                            <div>
                              <div className="text-xs font-bold text-slate-800">📅 {mounted ? date.toLocaleDateString() : date.toISOString().split('T')[0]}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">⏰ {mounted ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</div>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${slot.isBooked ? 'bg-slate-200 text-slate-500' : 'bg-emerald-500 text-white'}`}>
                                {slot.isBooked ? "BOOKED" : "AVAILABLE"}
                              </span>
                              {!slot.isBooked && (
                                <button onClick={() => handleDeleteSlot(slot.id)} className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer">
                                  Delete Slot
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

            {/* Settings tab */}
            {activeTab === "settings" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
                <h3 className="font-display font-bold text-sm text-slate-900 mb-6 border-b border-slate-100 pb-2">Clinical Settings</h3>
                {settingsStatus === "SUCCESS" && (
                  <div className="bg-emerald-50 text-emerald-700 text-xs font-semibold p-3 rounded-lg text-center mb-6">
                    ✓ Profile Details Updated and Search Score Standing Recalculated!
                  </div>
                )}
                <form onSubmit={handleSettingsSubmit} className="flex flex-col gap-8">
                  
                  {/* 1. Core Profile Details */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-4 border-b border-emerald-50 pb-1">1. Core Profile Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Full Name</label>
                        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Headshot Photo URL</label>
                        <input type="text" required value={headshotUrl} onChange={(e) => setHeadshotUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* 2. License & Credentials */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-4 border-b border-emerald-50 pb-1">2. License & Credentials</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">License Type</label>
                        <select value={licenseType} onChange={(e) => setLicenseType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none cursor-pointer">
                          <option value="MD">MD</option>
                          <option value="DO">DO</option>
                          <option value="PhD">PhD</option>
                          <option value="LCSW">LCSW</option>
                          <option value="LMFT">LMFT</option>
                          <option value="LPC">LPC</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">License State</label>
                        <input type="text" required value={licenseState} onChange={(e) => setLicenseState(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">License Number</label>
                        <input type="text" required value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">NPI Number</label>
                        <input type="text" required value={npiNumber} onChange={(e) => setNpiNumber(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* 3. Clinic Location & Geospatial details */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-4 border-b border-emerald-50 pb-1">3. Clinic & Location Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Clinic Name</label>
                        <input type="text" required value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Office Address</label>
                        <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-slate-700 mb-1.5">City (Karachi / Lahore / New York etc.)</label>
                          <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1.5">State</label>
                          <input type="text" required value={state} onChange={(e) => setState(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1.5">ZIP Code</label>
                          <input type="text" required value={zipCode} onChange={(e) => setZipCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Session Formats & Financials */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-4 border-b border-emerald-50 pb-1">4. Session Formats & Financials</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Session Format</label>
                        <select value={sessionFormat} onChange={(e) => setSessionFormat(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none cursor-pointer">
                          <option value="TELEHEALTH">Telehealth Only</option>
                          <option value="IN_PERSON">In-Person Clinic</option>
                          <option value="HYBRID">Hybrid Office & Remote</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Session Fee ($ / PKR)</label>
                        <input type="number" required value={sessionFee} onChange={(e) => setSessionFee(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                      </div>
                      <div className="mt-6">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                          <input type="checkbox" checked={slidingScale} onChange={(e) => setSlidingScale(e.target.checked)} className="w-4 h-4 rounded border-slate-200 accent-emerald-500 cursor-pointer" />
                          <span>Sliding Scale Fee Adjustments</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 5. Clinical Focus & Commas List Fields */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-4 border-b border-emerald-50 pb-1">5. Clinical Specialties & Languages</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Specialties (comma-separated)</label>
                        <input type="text" placeholder="Anxiety, Depression, ADHD, PTSD" value={specialtiesText} onChange={(e) => setSpecialtiesText(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Treatment Modalities (comma-separated)</label>
                        <input type="text" placeholder="CBT, EMDR, Medication Management" value={treatmentModalitiesText} onChange={(e) => setTreatmentModalitiesText(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Target Demographics (comma-separated)</label>
                        <input type="text" placeholder="Adults, Adolescents, Children" value={targetDemographicsText} onChange={(e) => setTargetDemographicsText(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Languages Spoken (comma-separated)</label>
                        <input type="text" placeholder="English, Urdu, Punjabi" value={languagesText} onChange={(e) => setLanguagesText(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* 6. Professional Bio Statements */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-4 border-b border-emerald-50 pb-1">6. Professional Bios & Narrative Pitch</h4>
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Short Bio Preview (displayed in search grids)</label>
                        <input type="text" required value={bioPreview} onChange={(e) => setBioPreview(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Introductory Consultation Video URL (YouTube, Vimeo, etc.)</label>
                        <input type="text" value={introVideoUrl} onChange={(e) => setIntroVideoUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Full Clinical Biography Narrative</label>
                        <textarea rows={4} required value={bioFull} onChange={(e) => setBioFull(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" style={{ resize: "none" }} />
                      </div>
                    </div>
                  </div>

                  {/* 7. Social Links */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-4 border-b border-emerald-50 pb-1">7. Professional Web & Social Presence</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Practice Website URL</label>
                        <input type="url" placeholder="https://myclinic.com" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">LinkedIn Profile URL</label>
                        <input type="url" placeholder="https://linkedin.com/in/..." value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Twitter / X Profile URL</label>
                        <input type="url" placeholder="https://x.com/..." value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-slate-100 pt-4 mt-2">
                    <button type="submit" disabled={settingsStatus === "PENDING"} className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-8 py-3 rounded-lg cursor-pointer shadow-sm transition-all">
                      {settingsStatus === "PENDING" ? "Saving Profile..." : "Save Settings & Recalculate Prominence"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Bookings tab (Work in Progress Screen) */}
            {activeTab === "bookings" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[350px]">
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-2xl mb-4 border border-amber-200 animate-pulse">
                  🛠️
                </div>
                <h3 className="font-display text-lg font-bold text-slate-900 mb-2">Workspace Module Under Development</h3>
                <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                  The Patient Bookings pipeline is currently transitioning to a fully automated real-time calendar slot integration. Live clinical session details and synchronization controls will resume shortly!
                </p>
                <div className="mt-6 flex gap-2">
                  <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded font-semibold uppercase tracking-wider">
                    Target Release: Q3 2026
                  </span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded font-semibold uppercase tracking-wider">
                    API Status: MOCK_PROD
                  </span>
                </div>
              </div>
            )}

            {/* Reviews tab */}
            {activeTab === "reviews" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-display font-bold text-sm text-slate-900 mb-4 border-b border-slate-100 pb-2">Patient Rating logs</h3>

                {doc.reviews.length === 0 ? (
                  <p className="text-slate-400 text-xs italic text-center py-12">No patient reviews submitted yet.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {doc.reviews.map(rev => (
                      <div key={rev.id} className="p-4 bg-slate-50 border border-slate-200/50 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <strong className="text-xs text-slate-800 font-bold">{rev.patientName}</strong>
                            <span className="text-[10px] text-slate-400 ml-2">{mounted ? new Date(rev.createdAt).toLocaleDateString() : new Date(rev.createdAt).toISOString().split('T')[0]}</span>
                          </div>
                          <span className="text-amber-400 text-xs">{"★".repeat(rev.rating)}{"☆".repeat(5 - rev.rating)}</span>
                        </div>
                        <p className="text-slate-600 text-xs">&quot;{rev.comment}&quot;</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Analytics tab */}
            {activeTab === "analytics" && <AnalyticsDashboard doctorId={doc.id} />}

          </main>
        </div>

      </div>
    </div>
  );
}
