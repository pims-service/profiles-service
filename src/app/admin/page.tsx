"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
      <div className="bg-white min-h-screen flex items-center justify-center font-sans text-slate-800">
        <div className="text-center select-none animate-pulse">
          <div className="text-xs text-slate-400 font-medium">
            Loading Admin Console...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col md:flex-row font-sans text-slate-800 antialiased">
      
      {/* Premium Minimal Sidebar */}
      <aside className="w-full md:w-60 bg-slate-50/50 flex-shrink-0 flex flex-col justify-between p-6 h-auto md:h-screen sticky top-0 z-20 select-none border-b md:border-b-0 md:border-r border-slate-200/60">
        <div className="flex flex-col gap-8">
          
          {/* Brand Header */}
          <div className="pb-4 border-b border-slate-200/60">
            <span className="font-display font-bold text-sm tracking-tight text-slate-900">
              mindlink <span className="font-normal text-slate-400 text-xs">admin</span>
            </span>
          </div>

          {/* Links navigation list */}
          <nav className="flex flex-col gap-4">
            <button 
              onClick={() => setActiveTab("pipeline")}
              className={`text-sm sm:text-base text-left py-2 font-semibold transition-colors cursor-pointer block border-l-2 pl-3 -ml-3 ${
                activeTab === "pipeline" 
                  ? "text-slate-950 border-slate-950 font-bold" 
                  : "text-slate-400 border-transparent hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Verification Queue ({stats.pending})
            </button>
            <button 
              onClick={() => setActiveTab("registry")}
              className={`text-sm sm:text-base text-left py-2 font-semibold transition-colors cursor-pointer block border-l-2 pl-3 -ml-3 ${
                activeTab === "registry" 
                  ? "text-slate-950 border-slate-950 font-bold" 
                  : "text-slate-400 border-transparent hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Clinic Database
            </button>
          </nav>
        </div>

        {/* Bottom profile info - Minimal text, zero icons */}
        <div className="border-t border-slate-200/60 pt-4 mt-6 hidden md:flex flex-col gap-1">
          <strong className="text-[11px] text-slate-900 font-semibold">System Admin</strong>
          <span className="text-[10px] text-slate-400">Full Clearance</span>
        </div>
      </aside>

      {/* Main Content Workspace Panel */}
      <main className="flex-grow bg-white p-6 sm:p-10 lg:p-12 overflow-y-auto">
        
        {/* Simple Page Header */}
        <div className="mb-6 select-none">
          <h1 className="text-lg font-bold tracking-tight text-slate-950">
            {activeTab === "pipeline" ? "Verification Queue" : "Clinic Database"}
          </h1>
        </div>

        {/* Stats ribbon - Sleek text line, zero flashy cards */}
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-slate-500 select-none mb-8 pb-6 border-b border-slate-100">
          <div>
            <span className="text-slate-400">Total Listings:</span> <strong className="text-slate-900 font-semibold">{stats.total}</strong>
          </div>
          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
          <div>
            <span className="text-slate-400">Pending Audit:</span> <strong className="text-slate-900 font-semibold">{stats.pending}</strong>
          </div>
          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
          <div>
            <span className="text-slate-400">Verified Registries:</span> <strong className="text-slate-900 font-semibold">{stats.approved}</strong>
          </div>
          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
          <div>
            <span className="text-slate-400">Suspended:</span> <strong className="text-slate-900 font-semibold">{stats.suspended}</strong>
          </div>
        </div>

        {/* Dynamic Panels */}
        <div className="transition-opacity duration-200">
          
          {/* Tab 1: Verification Queue */}
          {activeTab === "pipeline" && (
            <div className="flex flex-col divide-y divide-slate-100">
              {pendingDoctors.length === 0 ? (
                <div className="py-16 text-center select-none">
                  <p className="text-slate-400 text-xs">All licensing queue pipelines are resolved and verified.</p>
                </div>
              ) : (
                pendingDoctors.map(doc => (
                  <div key={doc.id} className="py-8 first:pt-0 last:pb-0 flex flex-col lg:flex-row justify-between gap-6">
                    
                    {/* Primary Info */}
                    <div className="flex-grow max-w-3xl">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h2 className="font-bold text-base text-slate-950">{doc.user.name}</h2>
                        <span className="text-xs text-slate-400">{doc.licenseType}</span>
                      </div>
                      
                      <p className="text-xs text-slate-500 mt-1">{doc.clinicName} &bull; {doc.city}, {doc.state}</p>

                      {/* License details - Clean labels */}
                      <div className="text-xs text-slate-500 mt-3 font-mono">
                        NPI: <span className="text-slate-900 font-medium mr-4">{doc.npiNumber}</span>
                        License: <span className="text-slate-900 font-medium">{doc.licenseNumber} ({doc.licenseState})</span>
                      </div>

                      <div className="mt-4">
                        <p className="text-xs text-slate-600 italic bg-slate-50 border border-slate-100 p-3 rounded-lg leading-relaxed">
                          "{doc.bioPreview}"
                        </p>
                      </div>
                    </div>

                    {/* PDF viewer controls - Extremely minimal inline link & standard grey/black buttons */}
                    <div className="w-full lg:w-56 flex-shrink-0 flex flex-col justify-between items-start lg:items-end lg:text-right">
                      <div className="mb-4 lg:mb-0">
                        <a 
                          href="#" 
                          onClick={(e) => { e.preventDefault(); alert(`Downloading document: LICENSE_DOCUMENT.PDF for ${doc.user.name}`); }}
                          className="text-xs text-slate-600 hover:text-slate-950 underline font-medium transition-colors"
                        >
                          View License Certificate (PDF)
                        </a>
                      </div>

                      <div className="flex gap-4 w-full mt-4 lg:mt-0 select-none">
                        <button 
                          onClick={() => setSelectedDocForRejection(doc)}
                          className="flex-1 lg:flex-initial text-xs font-medium text-slate-500 hover:text-red-650 py-2 px-3 rounded cursor-pointer transition-colors border border-transparent hover:border-red-100 hover:bg-red-50/30"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleApprove(doc.id)}
                          className="flex-1 lg:flex-initial text-xs font-semibold text-white bg-slate-950 hover:bg-slate-800 py-2 px-4 rounded cursor-pointer transition-colors shadow-sm"
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

          {/* Tab 2: Clinic Database registry */}
          {activeTab === "registry" && (
            <div>
              <div className="mb-6">
                <input 
                  type="text" 
                  placeholder="Filter by practitioner name, clinic or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50/55 border border-slate-250 rounded-lg px-3 py-2 text-xs outline-none transition-all max-w-md font-medium text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:bg-white"
                />
              </div>

              {filteredRegistry.length === 0 ? (
                <p className="text-slate-400 text-xs italic py-12 select-none">No active database records matched.</p>
              ) : (
                <div className="overflow-x-auto border border-slate-100 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 select-none bg-slate-50/30 font-medium">
                        <th className="py-3 px-4">Practitioner</th>
                        <th className="py-3 px-4">Registry ID</th>
                        <th className="py-3 px-4">Clinic & Location</th>
                        <th className="py-3 px-4">Rating</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegistry.map(doc => (
                        <tr key={doc.id} className={`border-b border-slate-100 last:border-b-0 hover:bg-slate-50/20 ${doc.isSuspended ? 'bg-slate-50/30 text-slate-400' : ''}`}>
                          
                          <td className="py-3 px-4 font-medium text-slate-900">
                            <div>{doc.user.name}, <span className="font-normal text-slate-400">{doc.licenseType}</span></div>
                            <span className="text-[10px] text-slate-400 font-mono font-normal">{doc.user.email}</span>
                          </td>

                          <td className="py-3 px-4 text-slate-500 font-mono">{doc.npiNumber}</td>

                          <td className="py-3 px-4">
                            <div className="font-medium text-slate-700">{doc.clinicName}</div>
                            <span className="text-[10px] text-slate-400">{doc.city}, {doc.state}</span>
                          </td>

                          <td className="py-3 px-4 text-slate-600 font-medium">{doc.searchScore}</td>

                          <td className="py-3 px-4 select-none">
                            {doc.isSuspended ? (
                              <span className="text-[10px] text-slate-400">Suspended</span>
                            ) : doc.verificationStatus === "APPROVED" ? (
                              <span className="text-[10px] text-slate-900 font-medium">Verified</span>
                            ) : doc.verificationStatus === "PENDING" ? (
                              <span className="text-[10px] text-slate-500">Pending</span>
                            ) : (
                              <span className="text-[10px] text-red-650">Rejected</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right select-none">
                            <button 
                              onClick={() => handleToggleSuspend(doc.id, doc.isSuspended)}
                              className="text-[11px] text-slate-500 hover:text-slate-950 underline transition-colors cursor-pointer"
                            >
                              {doc.isSuspended ? "Activate" : "Suspend"}
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

      </main>

      {/* Flag / Rejection Reason modal */}
      {selectedDocForRejection && (
        <div className="fixed inset-0 z-50 bg-slate-950/20 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 border border-slate-200/80 shadow-xl relative animate-fade">
            <div className="flex justify-between items-center mb-4 select-none">
              <h3 className="font-bold text-sm text-slate-950">Flag Application</h3>
              <button 
                onClick={() => setSelectedDocForRejection(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRejectionSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Administrative Reason</label>
                <select 
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400 font-medium"
                >
                  <option value="">Select audit flag reason...</option>
                  <option value="Uploaded medical board license certificate is expired. Please upload active renewal files.">Expired medical certificate file</option>
                  <option value="Registered NPI number record does not match clinical board registry databases. Check NPI entries.">NPI credentials mismatch</option>
                  <option value="The clinical office location ZIP code mismatches registered state licensing limits.">Zoning licensing mismatch</option>
                  <option value="Low resolution avatar headshot. Upload a professional clinic profile photo.">Avatar photo unapproved</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Custom details</label>
                <textarea 
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400 font-medium" 
                  rows={2}
                  style={{ resize: "none" }}
                  placeholder="Detail license check issues..."
                />
              </div>

              <div className="flex gap-3 mt-2 select-none">
                <button 
                  type="button" 
                  onClick={() => setSelectedDocForRejection(null)}
                  className="flex-1 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-50 border border-slate-200/60 py-2 rounded cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={rejecting || !rejectionReason}
                  className="flex-1 text-xs font-semibold text-white bg-slate-950 hover:bg-slate-800 py-2 rounded cursor-pointer shadow-sm transition-colors"
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
