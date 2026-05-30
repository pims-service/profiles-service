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
  
  // Rejection modal states
  const [selectedDocForRejection, setSelectedDocForRejection] = useState<Doctor | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Search filter inside registry
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
      console.error("Failed to load admin directories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerationData();
  }, []);

  // Approve Doctor listing
  const handleApprove = async (docId: string) => {
    if (!confirm("Confirm approval of this provider credentials and license files?")) return;

    try {
      const res = await fetch("/api/admin/moderation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: docId, action: "APPROVE" }),
      });
      const data = await res.json();
      if (data.success) {
        // Update local state
        setDoctors(prev => prev.map(d => d.id === docId ? data.data : d));
        // Refetch stats
        fetchModerationData();
      }
    } catch (err) {
      alert("Error approving provider listing.");
    }
  };

  // Submit Rejection
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
        // Refetch stats
        fetchModerationData();
      }
    } catch {
      alert("Failed to submit profile rejection.");
    } finally {
      setRejecting(false);
    }
  };

  // Toggle Suspend Status
  const handleToggleSuspend = async (docId: string, currentStatus: boolean) => {
    const act = currentStatus ? "reinstate" : "suspend";
    if (!confirm(`Are you sure you want to ${act} this psychiatrist listing?`)) return;

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

  // Filter doctor registry
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
      <div style={{ textAlign: "center", padding: "120px", color: "var(--text-muted)" }}>
        🌀 Initializing Admin Console...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "90vh", background: "var(--bg-main)", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Console Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div>
            <h1 style={{ fontSize: "2.2rem" }}>Control Panel Center</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Moderating practitioner registrations and licensing verifications</p>
          </div>
          <span className="badge badge-primary" style={{ padding: "8px 14px", fontSize: "0.8rem" }}>
            🔑 Administrator Clearance
          </span>
        </div>

        {/* Dynamic Statistics cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "40px" }}>
          
          <div className="glass-panel" style={{ padding: "20px", background: "var(--bg-card)" }}>
            <span style={{ fontSize: "1.8rem" }}>👥</span>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, marginTop: "10px" }}>Total Accounts</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-main)" }}>{stats.total}</div>
          </div>

          <div className="glass-panel" style={{ padding: "20px", background: "var(--bg-card)", borderLeft: "3.5px solid var(--accent)" }}>
            <span style={{ fontSize: "1.8rem" }}>⏳</span>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, marginTop: "10px" }}>Pending Review</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent)" }}>{stats.pending}</div>
          </div>

          <div className="glass-panel" style={{ padding: "20px", background: "var(--bg-card)", borderLeft: "3.5px solid var(--success)" }}>
            <span style={{ fontSize: "1.8rem" }}>✅</span>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, marginTop: "10px" }}>Verified Listing</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--success)" }}>{stats.approved}</div>
          </div>

          <div className="glass-panel" style={{ padding: "20px", background: "var(--bg-card)", borderLeft: "3.5px solid var(--danger)" }}>
            <span style={{ fontSize: "1.8rem" }}>🚫</span>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, marginTop: "10px" }}>Suspended Cards</div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--danger)" }}>{stats.suspended}</div>
          </div>

        </div>

        {/* Navigation Tab Menu */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", gap: "20px", marginBottom: "30px" }}>
          <button 
            onClick={() => setActiveTab("pipeline")}
            style={{
              padding: "12px 6px",
              background: "transparent",
              border: "none",
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: "1rem",
              color: activeTab === "pipeline" ? "var(--primary)" : "var(--text-muted)",
              borderBottom: activeTab === "pipeline" ? "3px solid var(--primary)" : "3px solid transparent",
              cursor: "pointer",
              transition: "var(--transition)"
            }}
          >
            📋 Moderation Queue ({stats.pending})
          </button>
          <button 
            onClick={() => setActiveTab("registry")}
            style={{
              padding: "12px 6px",
              background: "transparent",
              border: "none",
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: "1rem",
              color: activeTab === "registry" ? "var(--primary)" : "var(--text-muted)",
              borderBottom: activeTab === "registry" ? "3px solid var(--primary)" : "3px solid transparent",
              cursor: "pointer",
              transition: "var(--transition)"
            }}
          >
            🗂️ Active Registry Database
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="animated-fade">
          
          {/* Moderation Queue Pipeline */}
          {activeTab === "pipeline" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {pendingDoctors.length === 0 ? (
                <div className="glass-panel" style={{ padding: "60px 40px", textAlign: "center", background: "var(--bg-card)" }}>
                  <span style={{ fontSize: "3.5rem" }}>🌿</span>
                  <h3 style={{ margin: "20px 0 8px" }}>Clean Moderation Pipeline</h3>
                  <p style={{ color: "var(--text-muted)" }}>No provider registration credentials require pending verification.</p>
                </div>
              ) : (
                pendingDoctors.map((doc) => (
                  <div key={doc.id} className="glass-panel animated-fade" style={{ background: "var(--bg-card)", padding: "30px", display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "30px" }}>
                    
                    {/* Credentials Info Column */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                        <span className="badge badge-pending">PENDING AUDIT</span>
                        <span className="badge badge-secondary">{doc.licenseType} APPLICATION</span>
                      </div>

                      <h2 style={{ fontSize: "1.45rem", marginBottom: "4px" }}>{doc.user.name}</h2>
                      <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "16px" }}>
                        Clinical practice: <strong>{doc.clinicName}</strong> &bull; {doc.city}, {doc.state}
                      </div>

                      {/* Licensing parameters metadata */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "var(--bg-main)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)", marginBottom: "20px", fontSize: "0.88rem" }}>
                        <div>
                          <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>NPI Registry Code</span>
                          <strong>{doc.npiNumber}</strong>
                          <span style={{ color: "var(--success)", fontSize: "0.7rem", display: "block" }}>✓ Valid NPI format</span>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700 }}>State Board License</span>
                          <strong>{doc.licenseNumber} ({doc.licenseState})</strong>
                          <span style={{ color: "var(--primary)", fontSize: "0.7rem", display: "block" }}>Active standing</span>
                        </div>
                      </div>

                      {/* Bio review */}
                      <div>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 700, display: "block", marginBottom: "6px" }}>Narrative Statement:</span>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", background: "var(--bg-main)", padding: "12px", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                          "{doc.bioPreview}"
                        </p>
                      </div>
                    </div>

                    {/* PDF License document viewer Column */}
                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", borderLeft: "1px solid var(--border-color)", paddingLeft: "30px" }}>
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "10px" }}>Uploaded Document Records</div>
                        
                        {/* Mock PDF Card element */}
                        <div style={{
                          background: "linear-gradient(135deg, hsl(210,30%,98%), hsl(210,24%,92%))",
                          border: "1.5px solid var(--border-color)",
                          borderRadius: "8px",
                          padding: "16px",
                          textAlign: "center",
                          position: "relative",
                          overflow: "hidden"
                        }}>
                          <span style={{ fontSize: "2rem" }}>📄</span>
                          <div style={{ fontWeight: 800, fontSize: "0.8rem", color: "var(--text-main)", marginTop: "4px" }}>LICENSE_CERTIFICATE_{doc.licenseState}.PDF</div>
                          <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Verified MD State Registration PDF &bull; 2.4 MB</div>
                          <div style={{ display: "inline-block", background: "var(--primary)", color: "white", padding: "3px 6px", fontSize: "0.6rem", fontWeight: 700, borderRadius: "4px", marginTop: "8px", textTransform: "uppercase" }}>Scan: PASS</div>
                        </div>
                      </div>

                      {/* Approval triggers */}
                      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                        <button 
                          onClick={() => setSelectedDocForRejection(doc)}
                          className="btn btn-secondary" 
                          style={{ border: "1px solid var(--danger)", color: "var(--danger)", flexGrow: 1, padding: "10px" }}
                        >
                          Reject application
                        </button>
                        <button 
                          onClick={() => handleApprove(doc.id)}
                          className="btn btn-primary" 
                          style={{ flexGrow: 1, padding: "10px" }}
                        >
                          Approve Listing
                        </button>
                      </div>
                    </div>

                  </div>
                ))
              )}
            </div>
          )}

          {/* Active Registry Database Grid */}
          {activeTab === "registry" && (
            <div className="glass-panel" style={{ padding: "30px", background: "var(--bg-card)" }}>
              {/* Search Bar */}
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <input 
                  type="text" 
                  placeholder="Search practitioner registry by name, clinic, or city..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input" 
                  style={{ maxWidth: "450px" }}
                />
              </div>

              {filteredRegistry.length === 0 ? (
                <p style={{ color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", padding: "40px" }}>
                  No directory records match your search phrase.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border-color)", color: "var(--text-muted)" }}>
                        <th style={{ padding: "12px" }}>Practitioner Info</th>
                        <th style={{ padding: "12px" }}>NPI Code</th>
                        <th style={{ padding: "12px" }}>Clinic Location</th>
                        <th style={{ padding: "12px" }}>Search Score</th>
                        <th style={{ padding: "12px" }}>Credential Standing</th>
                        <th style={{ padding: "12px", textAlign: "right" }}>Listing Controls</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegistry.map((doc) => (
                        <tr key={doc.id} style={{ borderBottom: "1px solid var(--border-color)", background: doc.isSuspended ? "rgba(220,53,69,0.03)" : "transparent" }}>
                          
                          {/* Practitioner Info */}
                          <td style={{ padding: "12px", display: "flex", gap: "12px", alignItems: "center" }}>
                            <img src={doc.headshotUrl} alt={doc.user.name} style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                            <div>
                              <strong style={{ display: "block" }}>{doc.user.name}, {doc.licenseType}</strong>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{doc.user.email}</span>
                            </div>
                          </td>

                          {/* NPI */}
                          <td style={{ padding: "12px" }}>{doc.npiNumber}</td>

                          {/* Location */}
                          <td style={{ padding: "12px" }}>
                            <div>{doc.clinicName}</div>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{doc.city}, {doc.state}</span>
                          </td>

                          {/* Score */}
                          <td style={{ padding: "12px" }}>
                            <strong style={{ color: "var(--primary)" }}>{doc.searchScore}/100</strong>
                          </td>

                          {/* Standing */}
                          <td style={{ padding: "12px" }}>
                            {doc.isSuspended ? (
                              <span className="badge badge-rejected" style={{ background: "hsl(354,76%,92%)", color: "var(--danger)" }}>SUSPENDED</span>
                            ) : doc.verificationStatus === "APPROVED" ? (
                              <span className="badge badge-verified">VERIFIED</span>
                            ) : doc.verificationStatus === "PENDING" ? (
                              <span className="badge badge-pending">PENDING</span>
                            ) : (
                              <span className="badge badge-rejected">REJECTED</span>
                            )}
                          </td>

                          {/* Controls */}
                          <td style={{ padding: "12px", textAlign: "right" }}>
                            <button 
                              onClick={() => handleToggleSuspend(doc.id, doc.isSuspended)}
                              className="btn btn-secondary" 
                              style={{ 
                                padding: "6px 12px", 
                                fontSize: "0.75rem",
                                color: doc.isSuspended ? "var(--success)" : "var(--danger)",
                                borderColor: doc.isSuspended ? "var(--success)" : "var(--danger)",
                              }}
                            >
                              {doc.isSuspended ? "Activate Card" : "Suspend Card"}
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

      {/* Rejection Reasons Form Modal */}
      {selectedDocForRejection && (
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
          <div className="glass-panel animated-fade" style={{
            background: "var(--bg-card)",
            width: "100%",
            maxWidth: "450px",
            padding: "30px",
            borderRadius: "var(--radius-md)",
            border: "1.5px solid var(--border-color)",
            boxShadow: "var(--shadow-lg)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.25rem" }}>Flag & Reject Application</h3>
              <button 
                onClick={() => setSelectedDocForRejection(null)}
                style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRejectionSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px" }}>Select Rejection Reason Checklist</label>
                <select 
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="form-input"
                >
                  <option value="">Choose standard administrative audit reason...</option>
                  <option value="Uploaded medical board license certificate is expired. Please upload active renewal files.">Expired medical certificate upload</option>
                  <option value="Registered NPI number record does not match clinical board registry databases. Check NPI entries.">NPI credentials check fail</option>
                  <option value="The clinical office location ZIP code mismatches registered state licensing limits.">Geographic zoning discrepancy</option>
                  <option value="Low resolution avatar headshot. Upload a professional clinic profile photo.">Avatar photo unapproved</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px" }}>Custom Rejection Details</label>
                <textarea 
                  value={rejectionReason}
                  onChange={(e) => setReviewerComment(e.target.value)} // Bind update
                  className="form-input" 
                  rows={3}
                  placeholder="Detail custom credentials issues..."
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button 
                  type="button" 
                  onClick={() => setSelectedDocForRejection(null)}
                  className="btn btn-secondary" 
                  style={{ flexGrow: 1 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={rejecting || !rejectionReason}
                  className="btn btn-primary" 
                  style={{ background: "var(--danger)", color: "white", flexGrow: 1 }}
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

  // Bind comment input update in modal
  function setReviewerComment(val: string) {
    setRejectionReason(val);
  }
}
