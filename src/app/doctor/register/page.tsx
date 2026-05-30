"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PakistaniDoctorRegister() {
  const router = useRouter();
  const [status, setStatus] = useState<"FORM" | "SUBMITTING" | "SUCCESS" | "ERROR">("FORM");
  const [errorMessage, setErrorMessage] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [licenseType, setLicenseType] = useState("MS Clinical Psychology");
  const [licenseNumber, setLicenseNumber] = useState(""); // Holds PMC / PMDC or PPA number
  const [cnicNumber, setCnicNumber] = useState(""); // Holds CNIC in XXXXX-XXXXXXX-X format
  
  const [clinicName, setClinicName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Karachi");
  const [province, setProvince] = useState("Sindh");
  const [sessionFee, setSessionFee] = useState("2000");

  const [bioPreview, setBioPreview] = useState("");
  const [headshotUrl, setHeadshotUrl] = useState("");

  // CNIC input formatter helper (e.g. XXXXX-XXXXXXX-X)
  const handleCnicChange = (val: string) => {
    // Remove all non-digits
    const clean = val.replace(/\D/g, "");
    let formatted = clean;
    if (clean.length > 5) {
      formatted = `${clean.slice(0, 5)}-${clean.slice(5)}`;
    }
    if (clean.length > 12) {
      formatted = `${formatted.slice(0, 13)}-${clean.slice(12, 13)}`;
    }
    setCnicNumber(formatted.slice(0, 15));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate CNIC length (must be exactly 15 chars e.g. 42101-1234567-1)
    if (cnicNumber.length !== 15) {
      setErrorMessage("Please input a valid 13-digit Pakistani CNIC number (Format: XXXXX-XXXXXXX-X).");
      return;
    }

    setStatus("SUBMITTING");
    setErrorMessage("");

    try {
      const res = await fetch("/api/doctor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, 
          email, 
          password,
          licenseType, 
          licenseState: province, 
          licenseNumber, // PMC / PPA number
          npiNumber: cnicNumber, // Mapping CNIC to npiNumber field in DB
          clinicName: clinicName || "Private Clinic Clinic", 
          address, 
          city, 
          state: province, 
          zipCode: city === "Karachi" ? "74200" : city === "Lahore" ? "54000" : "44000",
          specialties: ["Anxiety", "Depression"],
          treatmentModalities: ["CBT", "Mindfulness"],
          targetDemographics: ["Adults"],
          languages: ["Urdu", "English"],
          bioPreview: bioPreview || `Licensed clinical psychologist practicing in ${city}, providing evidence-based emotional support.`,
          bioFull: `Clinical psychologist holds a registered degree of ${licenseType} with license registration code ${licenseNumber}. Dedicated to offering compassionate wellness support.`,
          headshotUrl: headshotUrl || "https://images.unsplash.com/photo-1594824813573-246434de83fb?q=80&w=250&auto=format&fit=crop",
          sessionFormat: "HYBRID",
          sessionFee: parseFloat(sessionFee),
          slidingScale: false
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setStatus("SUCCESS");
      } else {
        setErrorMessage(data.error || "Onboarding failed.");
        setStatus("ERROR");
      }
    } catch {
      setErrorMessage("Network error during Pakistan registry onboarding.");
      setStatus("ERROR");
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl p-6 sm:p-8 shadow-sm">
        
        {status === "SUCCESS" ? (
          <div className="text-center py-10 animate-fade">
            <span className="text-5xl">🇵🇰</span>
            <h2 className="font-display text-2xl font-extrabold text-slate-900 mt-4 mb-2">Registration Submitted!</h2>
            <p className="text-slate-500 text-xs max-w-md mx-auto mb-6 leading-relaxed">
              Your credentials (CNIC: <strong className="text-slate-800">{cnicNumber}</strong>, Registration ID: <strong className="text-slate-800">{licenseNumber}</strong>) along with degree certificates have been saved. MindLink's Pakistani Moderation Board will verify your details within 24 hours.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/" className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg">
                View Search Directory
              </Link>
              <Link href="/doctor/login" className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg shadow-sm">
                Sign In to Workspace
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="border-b border-slate-100 pb-4 mb-6">
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Pakistani Provider Registry
              </span>
              <h1 className="font-display text-xl font-bold text-slate-900 mt-2">Register as a Clinical Practitioner</h1>
              <p className="text-slate-400 text-xs mt-0.5">Please provide standard CNIC, medical commission, or association details to initiate verification.</p>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 rounded-lg mb-6 text-center font-medium">
                🚨 {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Account details & credentials */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1 uppercase tracking-wide">1. Provider & Account Details</h3>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Full Clinical Name *</label>
                  <input type="text" required placeholder="e.g. Dr. Ayesha Khan" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-emerald-500 focus:bg-white" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Clinical Email *</label>
                    <input type="email" required placeholder="ayesha@mindlink.pk" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-emerald-500 focus:bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Secure Password *</label>
                    <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-emerald-500 focus:bg-white" />
                  </div>
                </div>

                <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1 uppercase tracking-wide mt-2">2. Licensing & Identity Card</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Clinical Qualification *</label>
                    <select value={licenseType} onChange={(e) => setLicenseType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none cursor-pointer">
                      <option value="MS Clinical Psychology">MS Clinical Psychology</option>
                      <option value="ADCP (Clinical Psychology)">ADCP Clinical Psychology</option>
                      <option value="MBBS + FCPS Psychiatry">MBBS + FCPS Psychiatry</option>
                      <option value="PhD Clinical Psychology">PhD Clinical Psychology</option>
                      <option value="PMD Clinical Psychology">PMD Clinical Psychology</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">PMC / PMDC or PPA Reg ID *</label>
                    <input type="text" required placeholder="e.g. 78421-P" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-emerald-500 focus:bg-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">National Identity CNIC Number *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="XXXXX-XXXXXXX-X (e.g. 42101-1234567-1)" 
                    value={cnicNumber}
                    onChange={(e) => handleCnicChange(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-emerald-500 focus:bg-white font-mono" 
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Government-issued identity cards are audited for clinical credential clearance.</span>
                </div>
              </div>

              {/* Right Column: Practice Location & file proof uploads */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-bold text-slate-800 border-b border-slate-100 pb-1 uppercase tracking-wide">3. Practice details & PKR Fees</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Province *</label>
                    <select value={province} onChange={(e) => setProvince(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none cursor-pointer">
                      <option value="Sindh">Sindh</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa (KPK)</option>
                      <option value="Balochistan">Balochistan</option>
                      <option value="Islamabad Capital Territory">Islamabad Capital Territory</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Practice City *</label>
                    <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none cursor-pointer">
                      <option value="Karachi">Karachi</option>
                      <option value="Lahore">Lahore</option>
                      <option value="Islamabad">Islamabad</option>
                      <option value="Rawalpindi">Rawalpindi</option>
                      <option value="Peshawar">Peshawar</option>
                      <option value="Faisalabad">Faisalabad</option>
                      <option value="Quetta">Quetta</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Session Fee (PKR) *</label>
                    <input type="number" required placeholder="e.g. 2500" value={sessionFee} onChange={(e) => setSessionFee(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-emerald-500 focus:bg-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">Clinic Name (or private practice)</label>
                    <input type="text" placeholder="e.g. Mindspace Clinic" value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Practice Address</label>
                  <input type="text" placeholder="e.g. 24-C, 5th Zamzama Lane, DHA Phase 5" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Short bio preview</label>
                  <input type="text" maxLength={270} placeholder="Brief pitch of your psychologist practice..." value={bioPreview} onChange={(e) => setBioPreview(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none" />
                </div>

                {/* Upload proof files */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Verification Document proofs</label>
                  <div className="border border-dashed border-slate-200 bg-slate-50 rounded-xl p-4 text-center">
                    <span className="text-xl">📄</span>
                    <strong className="block text-[10px] text-slate-800 mt-1">Upload Scanned CNIC & PMC License proofs</strong>
                    <span className="text-[9px] text-slate-400">Attach scanned CNIC card and Board Degree Certificate PDF.</span>
                    <input type="file" disabled className="text-[9px] block mx-auto mt-2 text-slate-400 border-none bg-transparent" />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="md:col-span-2 border-t border-slate-100 pt-6 mt-2 flex justify-between items-center gap-4">
                <Link href="/doctor/login" className="text-xs font-semibold text-slate-500 hover:text-slate-700">
                  Already registered? Sign In
                </Link>
                <button 
                  type="submit" 
                  disabled={status === "SUBMITTING"} 
                  className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all rounded-lg px-6 py-3 shadow-md shadow-emerald-600/10 cursor-pointer"
                >
                  {status === "SUBMITTING" ? "Registering provider..." : "Submit Registration Application"}
                </button>
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
}
