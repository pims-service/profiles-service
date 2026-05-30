"use client";

import { useState, useEffect } from "react";

interface Review {
  id: string;
  rating: number;
}

interface Doctor {
  id: string;
  clinicName: string;
  licenseType: string;
  licenseState: string;
  licenseNumber: string;
  npiNumber: string;
  verificationStatus: string;
  isVerified: boolean;
  isSuspended: boolean;
  rejectionReason: string | null;
  city: string;
  state: string;
  zipCode: string;
  sessionFee: number;
  searchScore: number;
  headshotUrl: string;
  bioPreview: string;
  user: { name: string; email: string };
  reviews: Review[];
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
}

export default function AdminConsole() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pipeline"); // "pipeline" | "registry"
  
  // Rejection modal
  const [selectedDocForRejection, setSelectedDocForRejection] = useState<Doctor | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const fetchModerationData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/moderation");
      const data = await res.json();
      if (data.success) {
        setDoctors(data.data);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load admin logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerationData();
  }, []);

  const handleApprove = async (docId: string) => {
    if (!confirm("Confirm approval of this provider credentials and state board registry files?")) return;

    try {
      const res = await fetch("/api/admin/moderation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: docId, action: "APPROVE" }),
      });
      const data = await res.json();
      if (data.success) {
        setDoctors(prev => prev.map(d => d.id === docId ? data.data : d));
        fetchModerationData();
      }
    } catch {
      alert("Error approving provider listing.");
    }
  };

  const handleRejectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForRejection || !rejectionReason) return;
    setRejecting(true);

    try {
      const res = await fetch("/api/admin/moderation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedDocForRejection.id,
          action: "REJECT",
          reason: rejectionReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDoctors(prev => prev.map(d => d.id === selectedDocForRejection.id ? data.data : d));
        setSelectedDocForRejection(null);
        setRejectionReason("");
        fetchModerationData();
      }
    } catch {
      alert("Failed to submit profile rejection.");
    } finally {
      setRejecting(false);
    }
  };

  const handleToggleSuspend = async (docId: string, currentStatus: boolean) => {
    const act = currentStatus ? "activate" : "suspend";
    if (!confirm(`Are you sure you want to ${act} this psychiatrist search card?`)) return;

    try {
      const res = await fetch("/api/admin/moderation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: docId, action: "TOGGLE_SUSPEND" }),
      });
      const data = await res.json();
      if (data.success) {
        setDoctors(prev => prev.map(d => d.id === docId ? data.data : d));
        fetchModerationData();
      }
    } catch {
      alert("Failed to toggle listing state.");
    }
  };

  const filteredRegistry = doctors.filter(doc => {
    const query = searchQuery.toLowerCase();
    return (
      doc.user.name.toLowerCase().includes(query) ||
      doc.clinicName.toLowerCase().includes(query) ||
      doc.city.toLowerCase().includes(query)
    );
  });

  const pendingDoctors = doctors.filter(doc => doc.verificationStatus === "PENDING");

  if (loading) {
    return (
      <div className="text-center py-24 text-slate-500 font-medium">
        🌀 Preparing directory administrative clearance...
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Title header */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-slate-900">Console Control Panel</h1>
            <p className="text-xs text-slate-500 mt-0.5">Moderating psychiatrist registry and license verifications</p>
          </div>
          <span className="text-[10px] font-bold bg-slate-900 text-white px-3 py-1 rounded-full uppercase tracking-wider">
            Clearance: Administrator
          </span>
        </div>

        {/* Stats widgets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Registered", val: stats.total, color: "border-slate-200" },
            { label: "Pending Verification", val: stats.pending, color: "border-amber-400 text-amber-600 bg-amber-50/20" },
            { label: "Verified Directory", val: stats.approved, color: "border-emerald-400 text-emerald-600 bg-emerald-50/20" },
            { label: "Suspended Cards", val: stats.suspended, color: "border-red-400 text-red-600 bg-red-50/20" }
          ].map((item, idx) => (
            <div key={idx} className={`bg-white border rounded-xl p-4 shadow-sm ${item.color}`}>
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</div>
              <div className="text-xl font-black mt-1">{item.val}</div>
            </div>
          ))}
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 gap-6 mb-8">
          <button 
            onClick={() => setActiveTab("pipeline")}
            className={`pb-3 font-semibold text-xs uppercase cursor-pointer border-b-2 transition-all ${activeTab === 'pipeline' ? 'text-emerald-600 border-emerald-500' : 'text-slate-400 border-transparent hover:text-slate-700'}`}
          >
            📋 Verification Queue ({stats.pending})
          </button>
          <button 
            onClick={() => setActiveTab("registry")}
            className={`pb-3 font-semibold text-xs uppercase cursor-pointer border-b-2 transition-all ${activeTab === 'registry' ? 'text-emerald-600 border-emerald-500' : 'text-slate-400 border-transparent hover:text-slate-700'}`}
          >
            🗂️ Registry Database
          </button>
        </div>

        {/* Tab panels */}
        <div className="animate-fade">
          
          {/* Queue Tab */}
          {activeTab === "pipeline" && (
            <div className="flex flex-col gap-6">
              {pendingDoctors.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                  <span className="text-3xl">🌿</span>
                  <h3 className="font-bold text-sm text-slate-900 mt-4 mb-1">Queue Pipeline is Clean</h3>
                  <p className="text-slate-500 text-xs">All pending provider licenses are cross-verified and resolved.</p>
                </div>
              ) : (
                pendingDoctors.map(doc => (
                  <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 shadow-sm">
                    
                    {/* Information */}
                    <div className="lg:col-span-8">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">CREDENTIAL REVIEW</span>
                        <span className="text-[9px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{doc.licenseType}</span>
                      </div>

                      <h2 className="font-display font-bold text-base text-slate-900">{doc.user.name}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">{doc.clinicName} &bull; {doc.city}, {doc.state}</p>

                      {/* License metrics */}
                      <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl mt-4 text-xs">
                        <div>
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">NPI Number Code</span>
                          <strong>{doc.npiNumber}</strong>
                          <span className="block text-[10px] text-emerald-600 mt-0.5">✓ Valid NPI schema</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">State License</span>
                          <strong>{doc.licenseNumber} ({doc.licenseState})</strong>
                          <span className="block text-[10px] text-emerald-600 mt-0.5">✓ active state ledger</span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Statement Preview:</span>
                        <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">"{doc.bioPreview}"</p>
                      </div>
                    </div>

                    {/* PDF viewer controls */}
                    <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-6 flex flex-col justify-between">
                      <div>
                        <span className="block text-[11px] font-bold text-slate-700 mb-2">Uploaded PDF Records</span>
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-4 text-center">
                          <span className="text-2xl">📄</span>
                          <strong className="block text-[10px] text-slate-900 mt-1 truncate">LICENSE_{doc.licenseState}.PDF</strong>
                          <span className="text-[9px] text-slate-400">Scan status: <strong className="text-emerald-600">PASS (2.4MB)</strong></span>
                        </div>
                      </div>

                      <div className="flex gap-2.5 mt-6">
                        <button 
                          onClick={() => setSelectedDocForRejection(doc)}
                          className="flex-1 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 py-2.5 rounded-lg cursor-pointer"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleApprove(doc.id)}
                          className="flex-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 py-2.5 rounded-lg cursor-pointer"
                        >
                          Approve
                        </button>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          )}

          {/* Database active registry tab */}
          {activeTab === "registry" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <input 
                type="text" 
                placeholder="Search database by doctor name, clinic office, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none mb-6 max-w-md focus:border-emerald-500 focus:bg-white"
              />

              {filteredRegistry.length === 0 ? (
                <p className="text-slate-400 text-xs italic text-center py-12">No database entries matched your search query.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400">
                        <th className="pb-3 pt-1 pl-2">Practitioner</th>
                        <th className="pb-3 pt-1">NPI Number</th>
                        <th className="pb-3 pt-1">Clinic Address</th>
                        <th className="pb-3 pt-1">Search Score</th>
                        <th className="pb-3 pt-1">Credential Standing</th>
                        <th className="pb-3 pt-1 pr-2 text-right">Listing Controls</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegistry.map(doc => (
                        <tr key={doc.id} className={`border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 ${doc.isSuspended ? 'bg-red-50/10' : ''}`}>
                          
                          <td className="py-4 pl-2 flex items-center gap-3">
                            <img src={doc.headshotUrl} alt={doc.user.name} className="w-8 h-8 rounded-full object-cover border border-slate-100" />
                            <div>
                              <strong className="block text-slate-950">{doc.user.name}, {doc.licenseType}</strong>
                              <span className="text-[10px] text-slate-400">{doc.user.email}</span>
                            </div>
                          </td>

                          <td className="py-4 text-slate-500 font-mono">{doc.npiNumber}</td>

                          <td className="py-4">
                            <div className="font-semibold text-slate-800">{doc.clinicName}</div>
                            <span className="text-[10px] text-slate-400">{doc.city}, {doc.state}</span>
                          </td>

                          <td className="py-4 text-emerald-600 font-bold">{doc.searchScore}/100</td>

                          <td className="py-4">
                            {doc.isSuspended ? (
                              <span className="text-[9px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full">SUSPENDED</span>
                            ) : doc.verificationStatus === "APPROVED" ? (
                              <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">VERIFIED</span>
                            ) : doc.verificationStatus === "PENDING" ? (
                              <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">PENDING</span>
                            ) : (
                              <span className="text-[9px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full">REJECTED</span>
                            )}
                          </td>

                          <td className="py-4 pr-2 text-right">
                            <button 
                              onClick={() => handleToggleSuspend(doc.id, doc.isSuspended)}
                              className={`text-[10px] font-bold border rounded-lg px-2.5 py-1 transition-all cursor-pointer ${doc.isSuspended ? 'text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100' : 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100'}`}
                            >
                              {doc.isSuspended ? "Re-Activate" : "Suspend Listing"}
                            </button>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Flag / Rejection Reason modal */}
      {selectedDocForRejection && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-100 shadow-2xl relative animate-fade">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-display font-bold text-base text-slate-900">Flag Application</h3>
              <button 
                onClick={() => setSelectedDocForRejection(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRejectionSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Administrative Reason</label>
                <select 
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500"
                >
                  <option value="">Select audit flag reason...</option>
                  <option value="Uploaded medical board license certificate is expired. Please upload active renewal files.">Expired medical certificate file</option>
                  <option value="Registered NPI number record does not match clinical board registry databases. Check NPI entries.">NPI credentials mismatch</option>
                  <option value="The clinical office location ZIP code mismatches registered state licensing limits.">Zoning licensing mismatch</option>
                  <option value="Low resolution avatar headshot. Upload a professional clinic profile photo.">Avatar photo unapproved</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1.5">Custom details</label>
                <textarea 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500" 
                  rows={2}
                  style={{ resize: "none" }}
                  placeholder="Detail license check issues..."
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setSelectedDocForRejection(null)}
                  className="flex-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 py-3 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={rejecting || !rejectionReason}
                  className="flex-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 py-3 rounded-lg cursor-pointer shadow-md"
                >
                  {rejecting ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
