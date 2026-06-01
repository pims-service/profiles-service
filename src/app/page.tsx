"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-semibold text-xs animate-pulse">
      Loading Clinic Map...
    </div>
  ),
});

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
  const [limit, setLimit] = useState("40");

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
        setSort("distance"); // Automatically sort by distance when GPS is active!
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
        sort,
        limit
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
  }, [location, lat, lng, distance, specialty, insurance, format, maxFee, sort, limit]);

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
      {/* Spaced, Elegant Human-Crafted Hero Search Area */}
      <section className="bg-white border-b border-slate-200/80 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-8 text-slate-900 leading-tight">
            Find a psychologist or psychiatrist near you
          </h1>

          {/* Minimalist Search Input Bar */}
          <div className="bg-white border border-slate-200/80 p-2.5 rounded-2xl max-w-3xl mx-auto flex flex-col md:flex-row gap-2.5 shadow-md shadow-slate-100/50">
            
            {/* Manually Input Location */}
            <div className="flex-grow flex items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-1">
              <input 
                type="text" 
                placeholder="Enter city name (e.g. Karachi or Lahore)"
                value={location}
                onChange={(e) => {
                  setLat(null);
                  setLng(null);
                  setLocation(e.target.value);
                }}
                className="w-full bg-transparent text-slate-800 text-xs font-semibold outline-none py-3 placeholder-slate-400"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 min-w-[280px]">
              <button 
                onClick={handleGeolocate}
                className={`flex-grow inline-flex items-center justify-center text-xs font-bold transition-all py-3.5 px-4 rounded-xl cursor-pointer ${locationStatus === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/50'}`}
              >
                {locationStatus === "PROMPTING" ? "Detecting location..." : locationStatus === "SUCCESS" ? "GPS Location Active" : "Detect Location"}
              </button>
              <button 
                onClick={fetchResults}
                className="inline-flex items-center justify-center text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all py-3.5 px-6 rounded-xl cursor-pointer shadow-sm"
              >
                Search
              </button>
            </div>

          </div>

          {/* Minimalist Filters Ribbon with Radius Search */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs select-none">
            
            {/* Radius Selector */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Radius:</span>
              <select
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 cursor-pointer outline-none focus:border-slate-400 focus:bg-white transition-all"
              >
                <option value="10">10 Miles</option>
                <option value="25">25 Miles</option>
                <option value="50">50 Miles</option>
                <option value="100">100 Miles</option>
                <option value="250">250 Miles</option>
              </select>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

            {/* Specialty Filter */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Specialty:</span>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 cursor-pointer outline-none focus:border-slate-400 focus:bg-white transition-all"
              >
                <option value="">All Specialties</option>
                <option value="Anxiety">Anxiety</option>
                <option value="Depression">Depression</option>
                <option value="ADHD">ADHD</option>
                <option value="Bipolar">Bipolar</option>
                <option value="PTSD">PTSD</option>
              </select>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

            {/* Sort Order */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Sort By:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 cursor-pointer outline-none focus:border-slate-400 focus:bg-white transition-all"
              >
                <option value="best_match">Best Match</option>
                <option value="distance">Distance</option>
                <option value="rating">Rating</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>

          </div>

        </div>
      </section>



      {/* Decluttered Main Columns Layout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Simple Doctor Listing Grid */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {loading ? (
            <div className="text-center py-20 text-slate-500 font-medium">
              Finding clinic availability...
            </div>
          ) : doctors.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2">No verified providers found</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto mb-6 leading-relaxed">
                There are no active clinic matches listed within this radius. Try selecting "Detect Location" or search "New York" to load live demo data.
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
                          <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded">
                            Verified
                          </span>
                        </h3>
                        <p className="text-xs font-bold text-slate-500 mt-0.5">{doc.clinicName} &bull; {doc.licenseType}</p>
                      </div>
                    </div>

                    {/* Ratings */}
                    <div className="flex items-center gap-1.5 text-xs mt-2 text-slate-500">
                      <span className="text-amber-500">★</span>
                      <strong className="text-slate-800 font-semibold">{doc.avgRating ? doc.avgRating.toFixed(1) : "NEW"}</strong>
                      <span>&bull;</span>
                      <span>{doc.reviewCount} {doc.reviewCount === 1 ? 'review' : 'reviews'}</span>
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
                    <div className="flex gap-5 text-slate-500 text-[11px]">
                      <div>
                        Session Fee: <strong className="text-slate-800 font-bold">{doc.sessionFee > 500 ? `PKR ${doc.sessionFee}` : `$${doc.sessionFee}`}</strong>
                      </div>
                      <div>
                        Format: <strong className="text-slate-800 font-bold">{doc.sessionFormat === "HYBRID" ? "Hybrid" : doc.sessionFormat === "TELEHEALTH" ? "Virtual" : "In-Person"}</strong>
                      </div>
                      {doc.computedDistance !== 9999 && (
                        <div>
                          Distance: <strong className="text-slate-800 font-bold">{doc.computedDistance.toFixed(1)} miles</strong>
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
        <aside className="lg:col-span-5 h-[calc(100vh-180px)] sticky top-36">
          <div className="bg-white border border-slate-200 rounded-2xl h-full flex flex-col overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-shrink-0">
              <div>
                <h4 className="font-display font-bold text-sm text-slate-900">Geospatial Clinic Map</h4>
                <p className="text-[10px] text-slate-500">Active offices relative to search origin</p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">GPS Live</span>
            </div>

            {/* Map Body Canvas Grid */}
            <div className="flex-grow bg-slate-100 relative overflow-hidden">
              <Map
                doctors={doctors}
                hoveredDocId={hoveredDocId}
                centerLat={lat}
                centerLng={lng}
                onBookDoc={(doc) => setSelectedDocForBooking(doc)}
                onHoverDoc={(docId) => setHoveredDocId(docId)}
              />
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
                  <div className="text-red-500 text-xs text-center">Slot already reserved. Select another opening.</div>
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
