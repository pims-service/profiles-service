"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DoctorResult {
  id: string;
  name: string;
  licenseType: string;
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
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [distance, setDistance] = useState("25");
  const [specialty, setSpecialty] = useState("");
  const [insurance, setInsurance] = useState("");
  const [format, setFormat] = useState("ANY");
  const [maxFee, setMaxFee] = useState("400");
  const [sort, setSort] = useState("best_match");

  // State
  const [doctors, setDoctors] = useState<DoctorResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState<"IDLE" | "PROMPTING" | "SUCCESS" | "DENIED">("IDLE");
  const [hoveredDocId, setHoveredDocId] = useState<string | null>(null);
  const [selectedDocForBooking, setSelectedDocForBooking] = useState<DoctorResult | null>(null);
  
  // Booking Form State
  const [bookingName, setBookingName] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [bookingInsurance, setBookingInsurance] = useState("");
  const [bookingStatus, setBookingStatus] = useState<"IDLE" | "PENDING" | "SUCCESS" | "ERROR">("IDLE");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Trigger Browser Geolocation Prompt
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocationStatus("PROMPTING");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setLocation("Current GPS Location");
        setLocationStatus("SUCCESS");
      },
      (error) => {
        console.error("GPS Access Denied:", error);
        setLocationStatus("DENIED");
        alert("Location access was denied. Please input your ZIP code or city manually.");
      }
    );
  };

  // Fetch search results
  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        distance,
        specialty,
        insurance,
        format,
        maxFee,
        sort
      });

      if (lat && lng) {
        params.append("lat", lat.toString());
        params.append("lng", lng.toString());
      } else {
        params.append("location", location);
      }

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

  useEffect(() => {
    fetchResults();
  }, [location, lat, lng, distance, specialty, insurance, format, maxFee, sort]);

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
        }, 2000);
      } else {
        setBookingStatus("ERROR");
      }
    } catch {
      setBookingStatus("ERROR");
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Sleek, Clean Hero Search Banner */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-12 px-6 shadow-sm">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
            Find Verified Psychiatrists Near You
          </h1>
          <p className="text-slate-300 text-lg mb-8 font-light max-w-2xl mx-auto">
            Enable location services to discover nearby practitioners instantly with standard rankings and live booking slots.
          </p>

          {/* Decluttered Unified Search Input Bar */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 p-2 rounded-2xl max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-12 gap-2 shadow-lg">
            
            {/* Specialty */}
            <div className="sm:col-span-4 flex items-center bg-transparent border-b sm:border-b-0 sm:border-r border-white/10 px-3">
              <span className="text-emerald-400 mr-2">🔍</span>
              <select 
                value={specialty} 
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full bg-transparent text-white text-sm outline-none cursor-pointer py-3 pr-4 [&>option]:text-slate-900"
              >
                <option value="">All Specialties / Symptoms</option>
                <option value="ADHD">ADHD / Attention Focus</option>
                <option value="Anxiety">Anxiety & Panic Disorders</option>
                <option value="Depression">Depression & Moods</option>
                <option value="PTSD">PTSD & Trauma Recovery</option>
                <option value="Bipolar Disorder">Bipolar Disorder</option>
                <option value="Sleep Disorders">Sleep / Insomnia</option>
                <option value="Women's Mental Health">Women's Mental Health</option>
              </select>
            </div>

            {/* Manually Input Location or coordinates */}
            <div className="sm:col-span-4 flex items-center bg-transparent border-b sm:border-b-0 sm:border-r border-white/10 px-3">
              <span className="text-emerald-400 mr-2">📍</span>
              <input 
                type="text" 
                placeholder="City or ZIP Code"
                value={location}
                onChange={(e) => {
                  setLat(null);
                  setLng(null);
                  setLocation(e.target.value);
                }}
                className="w-full bg-transparent text-white text-sm outline-none py-3 placeholder-white/50"
              />
            </div>

            {/* Geolocation target trigger button */}
            <div className="sm:col-span-4 flex items-center justify-between px-2 gap-2">
              <button 
                onClick={handleGeolocate}
                className="flex-grow inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-100 bg-white/15 hover:bg-white/25 transition-all py-3 px-3 rounded-lg cursor-pointer"
              >
                🎯 {locationStatus === "PROMPTING" ? "Locating..." : locationStatus === "SUCCESS" ? "GPS Active" : "Detect My Location"}
              </button>
              <button 
                onClick={fetchResults}
                className="inline-flex items-center justify-center text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all py-3 px-6 rounded-lg cursor-pointer shadow-md"
              >
                Find Slots
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Decluttered Horizontal Filter Bar under Hero */}
      <section className="bg-white border-b border-slate-200 py-4 px-6 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Session format pill */}
            <select 
              value={format} 
              onChange={(e) => setFormat(e.target.value)}
              className="bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 px-3 py-2 rounded-lg border-none outline-none cursor-pointer"
            >
              <option value="ANY">Any Format</option>
              <option value="TELEHEALTH">Telehealth Only</option>
              <option value="IN_PERSON">In-Office Clinic</option>
            </select>

            {/* Insurances accepted pill */}
            <select 
              value={insurance} 
              onChange={(e) => setInsurance(e.target.value)}
              className="bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 px-3 py-2 rounded-lg border-none outline-none cursor-pointer"
            >
              <option value="">Select Insurance Provider</option>
              <option value="Aetna">Aetna</option>
              <option value="Blue Cross Blue Shield">Blue Cross Blue Shield</option>
              <option value="Cigna">Cigna</option>
              <option value="UnitedHealthcare">UnitedHealthcare</option>
              <option value="Medicare">Medicare</option>
            </select>

            {/* Fee Limits pill */}
            <select 
              value={maxFee} 
              onChange={(e) => setMaxFee(e.target.value)}
              className="bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 px-3 py-2 rounded-lg border-none outline-none cursor-pointer"
            >
              <option value="999">Any Budget Price</option>
              <option value="200">Max $200 / session</option>
              <option value="300">Max $300 / session</option>
              <option value="400">Max $400 / session</option>
            </select>

            {/* Sort Mode pill */}
            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value)}
              className="bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 px-3 py-2 rounded-lg border-none outline-none cursor-pointer"
            >
              <option value="best_match">⭐ Sort: Best Match</option>
              <option value="distance">📍 Sort: Closest Distance</option>
              <option value="rating">👍 Sort: Top Patient Rating</option>
              <option value="price_low">💰 Sort: Fee (Low to High)</option>
            </select>
          </div>

          <div className="text-xs font-medium text-slate-500">
            {doctors.length} active psychiatrists resolved
          </div>
        </div>
      </section>

      {/* Decluttered Main Columns Layout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Simple Doctor Listing Grid */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {loading ? (
            <div className="text-center py-20 text-slate-500 font-medium">
              🌀 Finding clinic availability nearby...
            </div>
          ) : doctors.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <span className="text-4xl">🧐</span>
              <h3 className="text-lg font-bold text-slate-900 mt-4 mb-2">No Verified Providers Found</h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                There are no active clinic matches listed within this radius. Try selecting "🎯 Detect My Location" or search "New York" to load live demo data.
              </p>
              <button 
                onClick={() => { setLocation("New York"); setSpecialty(""); }}
                className="inline-flex text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all rounded-lg px-4 py-2"
              >
                Reset Search to Manhattan
              </button>
            </div>
          ) : (
            doctors.map((doc) => (
              <div 
                key={doc.id}
                onMouseEnter={() => setHoveredDocId(doc.id)}
                onMouseLeave={() => setHoveredDocId(null)}
                className={`bg-white border rounded-2xl p-6 transition-all duration-300 flex flex-col sm:flex-row gap-6 shadow-sm hover:shadow-md hover:border-emerald-200 ${doc.isSponsored ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200'}`}
              >
                {/* Photo */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shadow-inner border border-slate-100 flex-shrink-0 bg-slate-50">
                  <img src={doc.headshotUrl} alt={doc.name} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                      <div>
                        <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                          {doc.name}
                          <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                            ✓ Verified
                          </span>
                        </h3>
                        <p className="text-xs font-bold text-slate-500 mt-0.5">{doc.clinicName} &bull; {doc.licenseType}</p>
                      </div>

                      {/* Score indicator badge */}
                      <div className="bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl text-center flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Standing</span>
                        <strong className="text-sm font-extrabold text-emerald-600">{doc.computedScore}/100</strong>
                      </div>
                    </div>

                    {/* Ratings */}
                    <div className="flex items-center gap-1 text-amber-500 font-semibold text-xs mt-2">
                      <span>{"★".repeat(Math.round(doc.avgRating))}</span>
                      <span className="text-slate-300">{"★".repeat(5 - Math.round(doc.avgRating))}</span>
                      <span className="text-slate-900 ml-1">{doc.avgRating ? doc.avgRating.toFixed(1) : "NEW"}</span>
                      <span className="text-slate-400 font-normal">({doc.reviewCount} patient reviews)</span>
                    </div>

                    {/* Bio Narrative */}
                    <p className="text-slate-500 text-xs mt-3 leading-relaxed line-clamp-2">
                      {doc.bioPreview}
                    </p>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {doc.specialtiesList.slice(0, 3).map((spec, i) => (
                        <span key={i} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{spec}</span>
                      ))}
                    </div>
                  </div>

                  {/* Financials & distance log */}
                  <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex gap-6 text-[11px] text-slate-500">
                      <div>
                        💰 <strong className="text-slate-800">${doc.sessionFee}</strong> / session
                      </div>
                      <div>
                        💻 <strong>{doc.sessionFormat === "HYBRID" ? "Hybrid Clinic" : doc.sessionFormat === "TELEHEALTH" ? "Virtual Only" : "In-Person Clinic"}</strong>
                      </div>
                      {doc.computedDistance !== 9999 && (
                        <div>
                          📍 <strong>{doc.computedDistance.toFixed(1)} miles</strong> away
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/doctor/${doc.id}`} className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all rounded-lg px-3 py-2">
                        Profile Details
                      </Link>
                      <button 
                        onClick={() => setSelectedDocForBooking(doc)}
                        className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all rounded-lg px-4 py-2 cursor-pointer shadow-sm shadow-emerald-600/10"
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

        {/* Right Column: Sleek Map Panel Grid */}
        <aside className="lg:col-span-4 h-[calc(100vh-180px)] sticky top-36">
          <div className="bg-white border border-slate-200 rounded-2xl h-full flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-shrink-0">
              <div>
                <h4 className="font-display font-bold text-sm text-slate-900">Geospatial Clinic Map</h4>
                <p className="text-[10px] text-slate-500">Active offices relative to search origin</p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">GPS Live</span>
            </div>

            {/* Map Body Canvas Grid */}
            <div className="flex-grow bg-slate-100 relative overflow-hidden flex items-center justify-center">
              {/* Radial maps mock vectors */}
              <svg className="absolute w-full h-full inset-0 opacity-15" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50%" cy="50%" r="50" fill="none" stroke="black" strokeWidth="1" />
                <circle cx="50%" cy="50%" r="100" fill="none" stroke="black" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="50%" cy="50%" r="150" fill="none" stroke="black" strokeWidth="1" />
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="black" strokeWidth="1" />
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="black" strokeWidth="1" />
              </svg>

              {/* Central origin marker badge */}
              <div className="absolute text-[11px] font-extrabold uppercase tracking-wide text-slate-400 select-none pointer-events-none">
                {location || "GPS POINT"}
              </div>

              {/* Pin points plotted on scaled grid */}
              {!loading && doctors.map((doc, idx) => {
                const seedRandomLat = Math.sin(idx * 45) * 100 + 170;
                const seedRandomLng = Math.cos(idx * 45) * 100 + 160;
                const isActive = hoveredDocId === doc.id;

                return (
                  <div 
                    key={doc.id}
                    className="absolute cursor-pointer -translate-x-1/2 -translate-y-full transition-all duration-300"
                    style={{ top: `${seedRandomLat}px`, left: `${seedRandomLng}px`, zIndex: isActive ? 50 : 10 }}
                    onMouseEnter={() => setHoveredDocId(doc.id)}
                    onMouseLeave={() => setHoveredDocId(null)}
                  >
                    <div className="flex flex-col items-center">
                      <div className={`px-2 py-1 text-[10px] font-bold text-white rounded-lg border border-white shadow-md transition-all duration-300 whitespace-nowrap ${isActive ? 'scale-110 -translate-y-1 bg-emerald-600' : 'bg-slate-800'}`}>
                        {doc.name.split(" ")[1]}
                      </div>
                      <div className={`w-3 h-3 rounded-full border border-white shadow-sm mt-0.5 transition-colors ${isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

      </section>

      {/* Quick Booking Modal Checkout */}
      {selectedDocForBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-2xl relative animate-fade">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-lg text-slate-900">Book Session Slot</h3>
              <button 
                onClick={() => setSelectedDocForBooking(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl mb-6">
              <img src={selectedDocForBooking.headshotUrl} alt={selectedDocForBooking.name} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">{selectedDocForBooking.name}</h4>
                <p className="text-xs text-slate-500">{selectedDocForBooking.clinicName}</p>
              </div>
            </div>

            {bookingStatus === "SUCCESS" ? (
              <div className="text-center py-8 text-emerald-600">
                <span className="text-4xl">🎉</span>
                <h3 className="font-bold text-base mt-4 mb-2">Slot Booked Successfully!</h3>
                <p className="text-slate-500 text-xs">
                  Your appointment slot is locked. The clinic coordinator will issue email intake instructions shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Selected Session Slot *</label>
                  <select 
                    required 
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none"
                  >
                    <option value="">Choose an open hour...</option>
                    {selectedDocForBooking.availability
                      .filter(slot => !slot.isBooked)
                      .slice(0, 8)
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
                  {selectedDocForBooking.availability.filter(slot => !slot.isBooked).length === 0 && (
                    <div className="text-red-500 text-[10px] mt-1">No upcoming availability found. Contact clinic for schedule.</div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Your Full Name *</label>
                  <input 
                    type="text" 
                    required
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-colors" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Your Email *</label>
                    <input 
                      type="email" 
                      required
                      value={bookingEmail}
                      onChange={(e) => setBookingEmail(e.target.value)}
                      placeholder="john@email.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-colors" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Mobile Phone *</label>
                    <input 
                      type="tel" 
                      required
                      value={bookingPhone}
                      onChange={(e) => setBookingPhone(e.target.value)}
                      placeholder="(555) 000-0000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-colors" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Insurance Provider (Optional)</label>
                  <input 
                    type="text" 
                    value={bookingInsurance}
                    onChange={(e) => setBookingInsurance(e.target.value)}
                    placeholder="e.g. Aetna"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-colors" 
                  />
                </div>

                {bookingStatus === "ERROR" && (
                  <div className="text-red-500 text-xs text-center">🚨 Slot already reserved. Select another opening.</div>
                )}

                <div className="flex gap-3 mt-2">
                  <button 
                    type="button" 
                    onClick={() => setSelectedDocForBooking(null)}
                    className="flex-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 py-3 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={bookingStatus === "PENDING" || !selectedSlotId}
                    className="flex-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 py-3 rounded-lg cursor-pointer shadow-md shadow-emerald-600/10"
                  >
                    {bookingStatus === "PENDING" ? "Confirming..." : "Confirm Booking"}
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
