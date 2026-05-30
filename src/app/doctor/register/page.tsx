"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function PakistaniDoctorRegister() {
  const [activeStep, setActiveStep] = useState(1);
  const [status, setStatus] = useState<"FORM" | "SUBMITTING" | "SUCCESS" | "ERROR">("FORM");
  const [errorMessage, setErrorMessage] = useState("");

  // Form State: Step 1 (Account Details)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Form State: Step 2 (Verification Credentials)
  const [licenseType, setLicenseType] = useState("MS Clinical Psychology");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [cnicNumber, setCnicNumber] = useState("");

  // Form State: Step 3 (Practice & Rates)
  const [province, setProvince] = useState("Sindh");
  const [city, setCity] = useState("Karachi");
  const [sessionFee, setSessionFee] = useState("2000");
  const [clinicName, setClinicName] = useState("");
  const [address, setAddress] = useState("");
  const [bioPreview, setBioPreview] = useState("");

  // Form State: Step 4 (Portfolio Media & Links)
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  
  // HTML5 Webcam Recorder State
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingState, setRecordingState] = useState<"IDLE" | "PREVIEWING" | "RECORDING" | "FINISHED">("IDLE");
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [videoBase64, setVideoBase64] = useState<string | null>(null);
  const [recSeconds, setRecSeconds] = useState(0);

  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recordedPlaybackRef = useRef<HTMLVideoElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic CNIC Formatter: XXXXX-XXXXXXX-X
  const handleCnicChange = (val: string) => {
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

  // HTML5 MediaRecorder - Setup Webcam feed
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 480, height: 360, facingMode: "user" },
        audio: true,
      });
      setStream(mediaStream);
      setRecordingState("PREVIEWING");
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("Webcam access denied. Please grant camera and microphone permissions in your browser.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Start MediaRecorder capture
  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    setRecSeconds(0);

    let options = { mimeType: "video/webm;codecs=vp9,opus" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/webm" };
    }

    try {
      const recorder = new MediaRecorder(stream, options);
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedUrl(videoUrl);

        const fileReader = new FileReader();
        fileReader.readAsDataURL(blob);
        fileReader.onloadend = () => {
          setVideoBase64(fileReader.result as string);
        };

        setRecordingState("FINISHED");
      };

      recorder.start(250);
      setMediaRecorder(recorder);
      setRecordingState("RECORDING");

      timerRef.current = setInterval(() => {
        setRecSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      alert("Failed to initialize video recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopCamera();
  };

  const resetRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setRecordedUrl(null);
    setVideoBase64(null);
    setRecSeconds(0);
    setRecordingState("IDLE");
    startCamera();
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stream]);

  // Step Validation Mechanics
  const handleNextStep = () => {
    setErrorMessage("");
    if (activeStep === 1) {
      if (!name.trim() || !email.trim() || !password.trim()) {
        setErrorMessage("Please fill out all required fields.");
        return;
      }
      if (!email.includes("@")) {
        setErrorMessage("Please input a valid professional email address.");
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      if (!licenseNumber.trim()) {
        setErrorMessage("Please input your clinical registration number.");
        return;
      }
      if (cnicNumber.length !== 15) {
        setErrorMessage("Please enter a valid CNIC (Format: XXXXX-XXXXXXX-X).");
        return;
      }
      setActiveStep(3);
    } else if (activeStep === 3) {
      if (!sessionFee.trim() || parseFloat(sessionFee) <= 0) {
        setErrorMessage("Please input a valid session fee.");
        return;
      }
      if (!address.trim()) {
        setErrorMessage("Please input your clinical office address.");
        return;
      }
      setActiveStep(4);
      setTimeout(() => {
        startCamera();
      }, 200);
    }
  };

  const handleBackStep = () => {
    setErrorMessage("");
    stopCamera();
    setActiveStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("SUBMITTING");
    setErrorMessage("");
    stopCamera();

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
          licenseNumber,
          npiNumber: cnicNumber,
          clinicName: clinicName || "Private Practice",
          address,
          city,
          state: province,
          zipCode: city === "Karachi" ? "74200" : city === "Lahore" ? "54000" : "44000",
          specialties: ["Anxiety", "Depression"],
          treatmentModalities: ["CBT", "Mindfulness"],
          targetDemographics: ["Adults"],
          languages: ["Urdu", "English"],
          bioPreview: bioPreview || `Practicing clinician in ${city}, providing evidence-based mental support.`,
          bioFull: `Registered degree of ${licenseType} with license registration code ${licenseNumber}. Dedicated to offering compassionate care.`,
          headshotUrl: "https://images.unsplash.com/photo-1594824813573-246434de83fb?q=80&w=250&auto=format&fit=crop",
          sessionFormat: "HYBRID",
          sessionFee: parseFloat(sessionFee),
          slidingScale: false,
          introVideoUrl: videoBase64 || null,
          websiteUrl: websiteUrl || null,
          linkedinUrl: linkedinUrl || null,
          twitterUrl: twitterUrl || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus("SUCCESS");
      } else {
        setErrorMessage(data.error || "Onboarding failed.");
        setStatus("FORM");
      }
    } catch {
      setErrorMessage("Network error during clinical onboarding.");
      setStatus("FORM");
    }
  };

  return (
    <div className="bg-slate-50/50 min-h-[calc(100vh-80px)] py-10 px-4 sm:px-8 flex items-center justify-center font-sans border-t border-slate-100 select-none">
      
      {/* Spacious White Rounded Card Wrapper */}
      <div className="bg-white border border-slate-150/80 rounded-3xl w-full max-w-5xl p-8 sm:p-12 md:p-14 shadow-sm shadow-slate-200/50 animate-fade">
        
        {status === "SUCCESS" ? (
          <div className="text-center py-16 animate-fade max-w-md mx-auto my-auto select-none">
            <span className="text-5xl block mb-6">🎉</span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-3">
              Application Registered
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mb-10 leading-relaxed font-normal">
              Practitioner credentials (CNIC: <strong className="text-slate-800 font-semibold">{cnicNumber}</strong>) have been securely saved. The clearance board will review registration within 24 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
              <Link
                href="/"
                className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-6 py-3 rounded-xl border border-slate-200/50 cursor-pointer text-center transition-all"
              >
                Go to Directory
              </Link>
              <Link
                href="/doctor/login"
                className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-xl transition-all cursor-pointer text-center shadow-md shadow-emerald-600/10"
              >
                Sign In to Portal
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col justify-between h-full w-full">
            
            {/* Top UI Circular Stepper matching reference screenshot perfectly */}
            <div className="relative flex items-center justify-between w-full max-w-3xl mx-auto mb-12 select-none border-b border-slate-100 pb-10">
              {/* Connecting horizontal line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0"></div>

              {/* Step 1 */}
              <div className="relative z-10 flex flex-col items-center gap-2 bg-white px-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border ${activeStep === 1 ? 'bg-slate-900 text-white border-slate-900 ring-4 ring-slate-100' : 'bg-white text-slate-400 border-slate-200'}`}>1</div>
                <span className={`text-[10px] font-semibold tracking-wider ${activeStep === 1 ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>Account Setup</span>
              </div>

              {/* Step 2 */}
              <div className="relative z-10 flex flex-col items-center gap-2 bg-white px-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border ${activeStep === 2 ? 'bg-slate-900 text-white border-slate-900 ring-4 ring-slate-100' : 'bg-white text-slate-400 border-slate-200'}`}>2</div>
                <span className={`text-[10px] font-semibold tracking-wider ${activeStep === 2 ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>Licensing</span>
              </div>

              {/* Step 3 */}
              <div className="relative z-10 flex flex-col items-center gap-2 bg-white px-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border ${activeStep === 3 ? 'bg-slate-900 text-white border-slate-900 ring-4 ring-slate-100' : 'bg-white text-slate-400 border-slate-200'}`}>3</div>
                <span className={`text-[10px] font-semibold tracking-wider ${activeStep === 3 ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>Clinic Rates</span>
              </div>

              {/* Step 4 */}
              <div className="relative z-10 flex flex-col items-center gap-2 bg-white px-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border ${activeStep === 4 ? 'bg-slate-900 text-white border-slate-900 ring-4 ring-slate-100' : 'bg-white text-slate-400 border-slate-200'}`}>4</div>
                <span className={`text-[10px] font-semibold tracking-wider ${activeStep === 4 ? 'text-slate-900 font-bold' : 'text-slate-400'}`}>Portfolio Media</span>
              </div>
            </div>

            {/* Form Inputs Panel */}
            <div className="flex-grow flex flex-col justify-center gap-6 py-2">
              
              {/* Form Error Notification */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-150 text-red-700 text-xs px-4 py-3.5 rounded-xl font-semibold animate-fade mb-2">
                  {errorMessage}
                </div>
              )}

              {/* Active Step Header Text */}
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                {activeStep === 1 && "Create your clinical account"}
                {activeStep === 2 && "License & credentials"}
                {activeStep === 3 && "Practice & session rates"}
                {activeStep === 4 && "Intro pitch & portfolio links"}
              </h1>

              {/* STEP 1: Account setup */}
              {activeStep === 1 && (
                <div className="flex flex-col gap-6 animate-fade">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Full practice name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Sarah Jamil"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-semibold"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Professional Email *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="sarah@mindlink.pk"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Account Password *
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-850"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Licensing & CNIC */}
              {activeStep === 2 && (
                <div className="flex flex-col gap-6 animate-fade">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Practitioner Degree *
                      </label>
                      <select
                        value={licenseType}
                        onChange={(e) => setLicenseType(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 text-xs outline-none cursor-pointer focus:border-emerald-500 focus:bg-white font-semibold text-slate-700"
                      >
                        <option value="MS Clinical Psychology">MS Clinical Psychology</option>
                        <option value="ADCP (Clinical Psychology)">ADCP Clinical Psychology</option>
                        <option value="MBBS + FCPS Psychiatry">MBBS + FCPS Psychiatry</option>
                        <option value="PhD Clinical Psychology">PhD Clinical Psychology</option>
                        <option value="PMD Clinical Psychology">PMD Clinical Psychology</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        PMC / PMDC or PPA Registry Code *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 54910-P"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                      National Identity CNIC Number *
                      <span className="normal-case text-[9px] font-medium text-slate-400 ml-1">(Format: XXXXX-XXXXXXX-X)</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 42101-1234567-1"
                      value={cnicNumber}
                      onChange={(e) => handleCnicChange(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-mono font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Practice Locations */}
              {activeStep === 3 && (
                <div className="flex flex-col gap-5 animate-fade">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Province / State *
                      </label>
                      <select
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl p-3.5 text-xs outline-none cursor-pointer focus:border-emerald-500 focus:bg-white font-semibold text-slate-700"
                      >
                        <option value="Sindh">Sindh</option>
                        <option value="Punjab">Punjab</option>
                        <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa (KPK)</option>
                        <option value="Balochistan">Balochistan</option>
                        <option value="Islamabad Capital Territory">Islamabad Capital Territory</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Practice City *
                      </label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl p-3.5 text-xs outline-none cursor-pointer focus:border-emerald-500 focus:bg-white font-semibold text-slate-700"
                      >
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Session Fee (PKR per hour) *
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 2500"
                        value={sessionFee}
                        onChange={(e) => setSessionFee(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl p-3.5 text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Clinic Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Zamzama Mind Wellness"
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl p-3.5 text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Office Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 15-C, Zamzama Lane 2, DHA Phase 5"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl p-3.5 text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Clinical Bio Pitch Narrative (max 270 chars)
                    </label>
                    <input
                      type="text"
                      maxLength={270}
                      placeholder="Brief pitch for search directory header..."
                      value={bioPreview}
                      onChange={(e) => setBioPreview(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl p-3.5 text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: Media pitch & portfolio links */}
              {activeStep === 4 && (
                <div className="flex flex-col gap-6 animate-fade">
                  
                  {/* Flat webcam visual bar */}
                  <div className="bg-slate-50 border border-slate-150/70 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
                    <div className="flex-grow max-w-sm">
                      <strong className="block text-xs text-slate-850 font-bold uppercase tracking-wider mb-1">Webcam Pitch Video</strong>
                      <span className="text-[10px] text-slate-400 block leading-normal mb-3">
                        Record a short pitch natively to display on your clinical profile page.
                      </span>

                      <div className="flex gap-2.5">
                        {recordingState === "IDLE" && (
                          <button
                            type="button"
                            onClick={startCamera}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] px-3.5 py-2 rounded-lg cursor-pointer transition-all shadow-sm"
                          >
                            Enable Camera
                          </button>
                        )}

                        {(recordingState === "PREVIEWING" || recordingState === "RECORDING") && (
                          <>
                            {recordingState === "PREVIEWING" ? (
                              <button
                                type="button"
                                onClick={startRecording}
                                className="bg-red-650 hover:bg-red-750 text-white font-bold text-[9px] px-3.5 py-2 rounded-lg cursor-pointer transition-all shadow-sm"
                              >
                                🔴 Start
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={stopRecording}
                                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-[9px] px-3.5 py-2 rounded-lg cursor-pointer transition-all shadow-sm"
                              >
                                ⏹ Stop ({recSeconds}s)
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="text-slate-450 hover:text-slate-650 text-[9px] font-bold px-2 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {recordingState === "FINISHED" && recordedUrl && (
                          <button
                            type="button"
                            onClick={resetRecording}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[9px] px-3.5 py-2 rounded-lg cursor-pointer border border-slate-300/40"
                          >
                            🔄 Re-record
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="w-40 aspect-video rounded-xl bg-slate-900 overflow-hidden border border-slate-250 flex-shrink-0 relative shadow-inner">
                      {recordingState === "IDLE" && (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                          No Feed
                        </div>
                      )}
                      {(recordingState === "PREVIEWING" || recordingState === "RECORDING") && (
                        <video
                          ref={videoPreviewRef}
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      )}
                      {recordingState === "FINISHED" && recordedUrl && (
                        <video
                          ref={recordedPlaybackRef}
                          src={recordedUrl}
                          controls
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  </div>

                  {/* Portfolio links */}
                  <div className="flex flex-col gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Professional Website URL (Optional)
                      </label>
                      <input
                        type="url"
                        placeholder="https://www.sarahclinic.com"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                          LinkedIn Profile Link (Optional)
                        </label>
                        <input
                          type="url"
                          placeholder="https://linkedin.com/in/username"
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                          Twitter/X Link (Optional)
                        </label>
                        <input
                          type="url"
                          placeholder="https://twitter.com/username"
                          value={twitterUrl}
                          onChange={(e) => setTwitterUrl(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-200/60 rounded-xl p-4 text-xs outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-800 font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Navigation Actions */}
            <div className="border-t border-slate-100 pt-8 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                {activeStep === 1 ? (
                  <Link
                    href="/doctor/login"
                    className="text-xs font-semibold text-slate-450 hover:text-slate-700 transition-colors"
                  >
                    Already registered? Sign In
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleBackStep}
                    className="text-xs font-bold text-slate-500 hover:text-slate-850 transition-all cursor-pointer select-none"
                  >
                    &larr; Back to Step {activeStep - 1}
                  </button>
                )}
              </div>

              <div className="w-full sm:w-auto">
                {activeStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full sm:w-auto text-xs font-bold text-white bg-slate-900 hover:bg-black transition-all rounded-xl px-10 py-3.5 shadow-md shadow-slate-900/10 cursor-pointer text-center"
                  >
                    Continue to Step {activeStep + 1}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={status === "SUBMITTING"}
                    className="w-full sm:w-auto text-xs font-bold text-white bg-slate-900 hover:bg-black transition-all rounded-xl px-12 py-3.5 shadow-md shadow-slate-900/10 cursor-pointer text-center"
                  >
                    {status === "SUBMITTING"
                      ? "Submitting application..."
                      : "Complete Registration"}
                  </button>
                )}
              </div>
            </div>

          </form>
        )}

      </div>
      
    </div>
  );
}
