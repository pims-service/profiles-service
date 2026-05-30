"use client";

import { useState } from "react";
import Link from "next/link";

export default function DoctorOnboardingWizard() {
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<"FORM" | "SUBMITTING" | "SUCCESS" | "ERROR">("FORM");
  const [errorMessage, setErrorMessage] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [licenseType, setLicenseType] = useState("MD");
  const [licenseState, setLicenseState] = useState("NY");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [npiNumber, setNpiNumber] = useState("");

  const [clinicName, setClinicName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("NY");
  const [zipCode, setZipCode] = useState("");

  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedModalities, setSelectedModalities] = useState<string[]>([]);
  const [selectedDemographics, setSelectedDemographics] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"]);

  const [bioPreview, setBioPreview] = useState("");
  const [bioFull, setBioFull] = useState("");
  const [headshotUrl, setHeadshotUrl] = useState("");
  
  const [sessionFormat, setSessionFormat] = useState("TELEHEALTH");
  const [sessionFee, setSessionFee] = useState("200");
  const [slidingScale, setSlidingScale] = useState(false);

  // Lists
  const specialtiesList = ["ADHD", "Anxiety", "Depression", "PTSD", "Bipolar Disorder", "Sleep Disorders", "OCD", "Addiction", "Autism Spectrum Disorder", "Women's Mental Health"];
  const modalitiesList = ["Medication Management", "CBT", "EMDR", "Psychodynamic Therapy", "TMS", "Mindfulness", "Family Systems Therapy", "ACT"];
  const demographicsList = ["Children", "Adolescents", "Adults", "Seniors"];
  const languagesList = ["English", "Spanish", "Mandarin", "French", "German", "Hindi", "Punjabi", "Portuguese"];

  const handleCheckboxToggle = (val: string, list: string[], setList: (arr: string[]) => void) => {
    if (list.includes(val)) {
      setList(list.filter(x => x !== val));
    } else {
      setList([...list, val]);
    }
  };

  const handleNext = () => {
    if (step === 1 && (!name || !email || !password)) return;
    if (step === 2 && (!licenseNumber || !npiNumber)) return;
    if (step === 3 && (!clinicName || !address || !city || !zipCode)) return;
    if (step === 4 && (selectedSpecialties.length === 0 || selectedModalities.length === 0)) return;
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("SUBMITTING");

    try {
      const res = await fetch("/api/doctor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, password,
          licenseType, licenseState, licenseNumber, npiNumber,
          clinicName, address, city, state, zipCode,
          specialties: selectedSpecialties,
          treatmentModalities: selectedModalities,
          targetDemographics: selectedDemographics,
          languages: selectedLanguages,
          bioPreview, bioFull, headshotUrl,
          sessionFormat, sessionFee, slidingScale
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("SUCCESS");
      } else {
        setErrorMessage(data.error || "Onboarding submission failed.");
        setStatus("ERROR");
      }
    } catch {
      setErrorMessage("Network error during wizard processing.");
      setStatus("ERROR");
    }
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "var(--bg-main)" }}>
      <div className="glass-panel" style={{
        background: "var(--bg-card)",
        width: "100%",
        maxWidth: "680px",
        padding: "40px",
        borderRadius: "var(--radius-md)",
        border: "1.5px solid var(--border-glass)",
        boxShadow: "var(--shadow-lg)"
      }}>
        
        {status === "SUCCESS" ? (
          <div style={{ textAlign: "center", padding: "40px 0" }} className="animated-fade">
            <span style={{ fontSize: "4rem" }}>📝</span>
            <h2 style={{ fontSize: "2rem", margin: "20px 0 10px", color: "var(--primary)" }}>Onboarding Submitted!</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", lineHeight: "1.6", maxWidth: "450px", margin: "0 auto 30px" }}>
              Your psychiatric licensing credentials, NPI number, and clinic parameters have been logged. MindLink administration is reviewing your records. Verification completes in 24-48 hours.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <Link href="/" className="btn btn-secondary">Return to Directory</Link>
              <Link href="/doctor/login" className="btn btn-primary">Proceed to Sign In</Link>
            </div>
          </div>
        ) : (
          <div>
            {/* Step Wizard Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid var(--border-color)", paddingBottom: "15px" }}>
              <div>
                <span className="badge badge-primary">Step {step} of 5</span>
                <h2 style={{ fontSize: "1.5rem", marginTop: "4px" }}>
                  {step === 1 && "Account Information"}
                  {step === 2 && "State Licensing & Credentials"}
                  {step === 3 && "Clinic Location details"}
                  {step === 4 && "Clinical Specialities & Taxonomies"}
                  {step === 5 && "Profile Narrative & Financials"}
                </h2>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Wizard Completeness: <strong style={{ color: "var(--primary)" }}>{step * 20}%</strong>
              </div>
            </div>

            {errorMessage && (
              <div style={{ background: "hsl(354, 76%, 92%)", color: "var(--danger)", padding: "12px 16px", borderRadius: "var(--radius-sm)", marginBottom: "20px", fontSize: "0.9rem" }}>
                🚨 {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Step 1 */}
              {step === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="animated-fade">
                  <div>
                    <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "6px" }}>Full Name *</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dr. Marcus Keller" className="form-input" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "6px" }}>Clinic Email *</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dr.keller@example.com" className="form-input" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "6px" }}>Portal Password *</label>
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="form-input" />
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="animated-fade">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "6px" }}>License Type *</label>
                      <select value={licenseType} onChange={(e) => setLicenseType(e.target.value)} className="form-input">
                        <option value="MD">MD (Medical Doctor)</option>
                        <option value="DO">DO (Osteopathic Doctor)</option>
                        <option value="PMHNP">PMHNP-BC (Psych Nurse Practitioner)</option>
                        <option value="PhD">PhD (Clinical Psychology)</option>
                        <option value="PsyD">PsyD (Clinical Psychology)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "6px" }}>License State *</label>
                      <select value={licenseState} onChange={(e) => setLicenseState(e.target.value)} className="form-input">
                        <option value="NY">New York (NY)</option>
                        <option value="CA">California (CA)</option>
                        <option value="TX">Texas (TX)</option>
                        <option value="MA">Massachusetts (MA)</option>
                        <option value="FL">Florida (FL)</option>
                        <option value="WA">Washington (WA)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "6px" }}>State License Number *</label>
                    <input type="text" required value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="e.g. NY-MD-884920" className="form-input" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "6px" }}>National Provider Identifier (NPI Number) *</label>
                    <input type="text" maxLength={10} required value={npiNumber} onChange={(e) => setNpiNumber(e.target.value)} placeholder="10-digit NPI record" className="form-input" />
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>Used to verify board standing with national health registries.</span>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="animated-fade">
                  <div>
                    <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "6px" }}>Clinic Practice Name *</label>
                    <input type="text" required value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="e.g. Manhattan Integrative Psychiatry" className="form-input" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "6px" }}>Practice Full Street Address *</label>
                    <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 120 Broadway, Suite 1400" className="form-input" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "6px" }}>City *</label>
                      <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York" className="form-input" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "6px" }}>State *</label>
                      <input type="text" required maxLength={2} value={state} onChange={(e) => setState(e.target.value)} placeholder="NY" className="form-input" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "6px" }}>ZIP Code *</label>
                      <input type="text" required value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="10005" className="form-input" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4 */}
              {step === 4 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animated-fade">
                  <div>
                    <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "10px" }}>Select Clinical Specialties * (Choose at least one)</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {specialtiesList.map((spec, i) => (
                        <label key={i} className="filter-option">
                          <input type="checkbox" checked={selectedSpecialties.includes(spec)} onChange={() => handleCheckboxToggle(spec, selectedSpecialties, setSelectedSpecialties)} className="filter-checkbox" />
                          <span>{spec}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "10px" }}>Treatment Modalities * (Choose at least one)</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {modalitiesList.map((mod, i) => (
                        <label key={i} className="filter-option">
                          <input type="checkbox" checked={selectedModalities.includes(mod)} onChange={() => handleCheckboxToggle(mod, selectedModalities, setSelectedModalities)} className="filter-checkbox" />
                          <span>{mod}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "8px" }}>Languages Spoken</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "120px", overflowY: "auto", border: "1px solid var(--border-color)", padding: "8px", borderRadius: "4px" }}>
                        {languagesList.map((lang, i) => (
                          <label key={i} className="filter-option" style={{ margin: 0 }}>
                            <input type="checkbox" checked={selectedLanguages.includes(lang)} onChange={() => handleCheckboxToggle(lang, selectedLanguages, setSelectedLanguages)} className="filter-checkbox" />
                            <span>{lang}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "8px" }}>Target Demographics</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "120px", overflowY: "auto", border: "1px solid var(--border-color)", padding: "8px", borderRadius: "4px" }}>
                        {demographicsList.map((demo, i) => (
                          <label key={i} className="filter-option" style={{ margin: 0 }}>
                            <input type="checkbox" checked={selectedDemographics.includes(demo)} onChange={() => handleCheckboxToggle(demo, selectedDemographics, setSelectedDemographics)} className="filter-checkbox" />
                            <span>{demo}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5 */}
              {step === 5 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="animated-fade">
                  <div>
                    <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "6px" }}>Short Bio Elevator Pitch * (Displays in search previews - max 270 chars)</label>
                    <input type="text" maxLength={270} required value={docBioPreview()} onChange={(e) => setBioPreview(e.target.value)} placeholder="e.g. Dr. Keller is a board-certified psychiatrist with over 15 years of experience specializing in adult ADHD..." className="form-input" />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "6px" }}>Full Clinical Narrative Bio * (Education, training, treatment values)</label>
                    <textarea rows={4} required value={bioFull} onChange={(e) => setBioFull(e.target.value)} placeholder="Write details about your university credentials, training residency, and psychotherapy values..." className="form-input" style={{ resize: "none" }} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "6px" }}>Avatar Headshot URL</label>
                      <input type="text" value={headshotUrl} onChange={(e) => setHeadshotUrl(e.target.value)} placeholder="https://unsplash.com/... or blank for mock avatar" className="form-input" />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "6px" }}>Primary Session Format</label>
                      <select value={sessionFormat} onChange={(e) => setSessionFormat(e.target.value)} className="form-input">
                        <option value="TELEHEALTH">Telehealth / Online Only</option>
                        <option value="IN_PERSON">In-Office Clinic Only</option>
                        <option value="HYBRID">Hybrid Office & Remote</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "14px", alignItems: "center" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, marginBottom: "6px" }}>Standard Session Fee ($) *</label>
                      <input type="number" required value={sessionFee} onChange={(e) => setSessionFee(e.target.value)} placeholder="200" className="form-input" />
                    </div>
                    <div style={{ marginTop: "24px" }}>
                      <label className="filter-option" style={{ margin: 0 }}>
                        <input type="checkbox" checked={slidingScale} onChange={(e) => setSlidingScale(e.target.checked)} className="filter-checkbox" />
                        <strong>Offer Sliding Scale Fees</strong>
                      </label>
                    </div>
                  </div>

                  {/* Document upload mock field */}
                  <div style={{ background: "hsl(210, 30%, 96%)", border: "1.5px dashed var(--border-color)", padding: "16px", borderRadius: "8px", textAlign: "center", marginTop: "10px" }}>
                    <span style={{ fontSize: "1.5rem" }}>📄</span>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", margin: "4px 0 2px" }}>Upload License Proof Documents</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Medical license certificate, state ID card, or board certificates. PDF or images.</div>
                    <input type="file" disabled style={{ fontSize: "0.8rem", marginTop: "10px", width: "100%", maxWidth: "250px", border: "none", background: "transparent" }} />
                  </div>
                </div>
              )}

              {/* Navigation triggers */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
                {step > 1 ? (
                  <button type="button" onClick={handleBack} className="btn btn-secondary">
                    Back
                  </button>
                ) : (
                  <Link href="/doctor/login" className="btn btn-secondary">Already Registered? Sign In</Link>
                )}

                {step < 5 ? (
                  <button type="button" onClick={handleNext} className="btn btn-primary">
                    Continue Wizard
                  </button>
                ) : (
                  <button type="submit" disabled={status === "SUBMITTING"} className="btn btn-primary">
                    {status === "SUBMITTING" ? "Registering provider..." : "Submit Application"}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );

  // Fallback for bio previews matching typing length
  function docBioPreview() {
    return bioPreview;
  }
}
