"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DoctorLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetStatus, setResetStatus] = useState<"IDLE" | "PENDING" | "SUCCESS" | "ERROR">("IDLE");
  const [resetMessage, setResetMessage] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus("PENDING");
    setResetMessage("");
    
    try {
      const res = await fetch("/api/doctor/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setResetStatus("SUCCESS");
        setResetMessage(data.message);
      } else {
        setResetStatus("ERROR");
        setResetMessage(data.error || "Failed to send reset email.");
      }
    } catch {
      setResetStatus("ERROR");
      setResetMessage("Network connection issue.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/doctor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        // Save doctor session mock to localStorage
        localStorage.setItem("doctor_session", JSON.stringify(data.user));
        if (data.user.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/doctor");
        }
      } else {
        setError(data.error || "Login failed. Check your clinical email.");
      }
    } catch {
      setError("Network connection issue.");
    } finally {
      setLoading(false);
    }
  };

  // Automated Mock Session shortcuts for testing
  const handleQuickLogin = async (mockEmail: string) => {
    const isSysAdmin = mockEmail === "admin@pims.com";
    const pass = isSysAdmin ? "AdminPass123!" : "Password123!";

    setEmail(mockEmail);
    setPassword(pass);
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/doctor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mockEmail, password: pass }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("doctor_session", JSON.stringify(data.user));
        if (isSysAdmin) {
          router.push("/admin");
        } else {
          router.push("/doctor");
        }
      } else {
        setError(data.error || "Auto sign-in failed.");
      }
    } catch {
      setError("Network issue during auto sign-in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "var(--bg-main)" }}>
      <div className="glass-panel" style={{
        background: "var(--bg-card)",
        width: "100%",
        maxWidth: "420px",
        padding: "40px 30px",
        borderRadius: "var(--radius-md)",
        border: "1.5px solid var(--border-glass)",
        boxShadow: "var(--shadow-lg)"
      }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h2 style={{ fontSize: "1.8rem", color: "var(--text-main)", fontFamily: "var(--font-display)" }}>Provider Portal</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "4px" }}>Manage your scheduler and update your search scores</p>
        </div>

        {error && (
          <div style={{ background: "hsl(354, 76%, 92%)", color: "var(--danger)", padding: "12px", borderRadius: "4px", marginBottom: "20px", fontSize: "0.85rem", textAlign: "center" }}>
            🚨 {error}
          </div>
        )}

        {isForgotPassword ? (
          <div>
            <h3 style={{ fontSize: "1.2rem", color: "var(--text-main)", marginBottom: "15px", textAlign: "center" }}>Reset Password</h3>
            {resetStatus === "SUCCESS" && (
              <div style={{ background: "hsl(150, 60%, 92%)", color: "var(--primary)", padding: "12px", borderRadius: "4px", marginBottom: "20px", fontSize: "0.85rem", textAlign: "center" }}>
                ✅ {resetMessage}
              </div>
            )}
            {resetStatus === "ERROR" && (
              <div style={{ background: "hsl(354, 76%, 92%)", color: "var(--danger)", padding: "12px", borderRadius: "4px", marginBottom: "20px", fontSize: "0.85rem", textAlign: "center" }}>
                🚨 {resetMessage}
              </div>
            )}
            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>Registered Email Address</label>
                <input 
                  type="email" 
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="dr.keller@pims.com" 
                  className="form-input" 
                />
              </div>
              <button type="submit" disabled={resetStatus === "PENDING"} className="btn btn-primary" style={{ width: "100%", padding: "12px", marginTop: "10px" }}>
                {resetStatus === "PENDING" ? "Sending Request..." : "Send Reset Link"}
              </button>
            </form>
            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <button onClick={() => setIsForgotPassword(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline" }}>Back to Login</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>Clinical Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dr.keller@pims.com" 
                className="form-input" 
              />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700 }}>Secure Password</label>
                <button type="button" onClick={() => setIsForgotPassword(true)} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.75rem", cursor: "pointer" }}>Forgot Password?</button>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="form-input" 
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%", padding: "12px", marginTop: "10px" }}>
              {loading ? "Authenticating doctor..." : "Sign In to Clinic Workspace"}
            </button>
          </form>
        )}

        <div style={{ textTransform: "none", fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", marginTop: "20px" }}>
          Don&apos;t have a listing? <Link href="/doctor/register" style={{ color: "var(--primary)", fontWeight: 700 }}>Join the Directory</Link>
        </div>

        {/* Rapid testing console */}
        <div style={{ marginTop: "30px", borderTop: "1px dashed var(--border-color)", paddingTop: "20px" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--text-muted)", marginBottom: "12px", textAlign: "center" }}>
            ⚡ Developer Quick Login Shortcuts
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button 
              onClick={() => handleQuickLogin("dr.keller@pims.com")}
              className="btn btn-secondary" 
              style={{ fontSize: "0.75rem", width: "100%", padding: "8px", justifyContent: "flex-start", gap: "6px" }}
            >
              👨‍⚕️ Log in as <strong>Dr. Marcus Keller, MD (NY)</strong>
            </button>
            <button 
              onClick={() => handleQuickLogin("dr.chen@pims.com")}
              className="btn btn-secondary" 
              style={{ fontSize: "0.75rem", width: "100%", padding: "8px", justifyContent: "flex-start", gap: "6px" }}
            >
              👩‍⚕️ Log in as <strong>Dr. Evelyn Chen, DO (CA)</strong>
            </button>
            <button 
              onClick={() => handleQuickLogin("admin@pims.com")}
              className="btn btn-secondary" 
              style={{ fontSize: "0.75rem", width: "100%", padding: "8px", justifyContent: "flex-start", gap: "6px" }}
            >
              👑 Log in as <strong>System Administrator (Admin)</strong>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
