"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const sessRaw = localStorage.getItem("doctor_session");
    if (sessRaw) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSession(JSON.parse(sessRaw));
      } catch {
        localStorage.removeItem("doctor_session");
      }
    } else {
      setSession(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("doctor_session");
    setSession(null);
    router.push("/");
  };

  const role = session?.role;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-slate-900 hover:opacity-90">
          <div className="h-6 w-6 rounded bg-emerald-600 flex items-center justify-center text-white text-[10px] font-black tracking-tighter shadow-sm">ML</div>
          <span>MindLink</span>
        </Link>

        {/* Quick Links */}
        <nav className="hidden md:flex gap-8">
          <Link 
            href="/" 
            className={`text-sm font-semibold pb-1 pt-1 ${
              pathname === "/" 
                ? "text-slate-900 border-b-2 border-emerald-600" 
                : "text-slate-500 hover:text-slate-900 transition-colors"
            }`}
          >
            Find Doctors
          </Link>
          
          {/* Doctor Workspace link - Only visible if logged-in role is PSYCHIATRIST */}
          {role === "PSYCHIATRIST" && (
            <Link 
              href="/doctor" 
              className={`text-sm font-semibold pb-1 pt-1 ${
                pathname === "/doctor" 
                  ? "text-slate-900 border-b-2 border-emerald-600" 
                  : "text-slate-500 hover:text-slate-900 transition-colors"
              }`}
            >
              Doctor Workspace
            </Link>
          )}

          {/* Admin Console link - Only visible if logged-in role is ADMIN */}
          {role === "ADMIN" && (
            <Link 
              href="/admin" 
              className={`text-sm font-semibold pb-1 pt-1 ${
                pathname === "/admin" 
                  ? "text-slate-900 border-b-2 border-emerald-600" 
                  : "text-slate-500 hover:text-slate-900 transition-colors"
              }`}
            >
              Admin Console
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          
          {/* Join Directory button - Only visible to unregistered visitors */}
          {!session && (
            <Link 
              href="/doctor/register" 
              className="hidden sm:inline-flex text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all rounded-lg px-4 py-2"
            >
              Join Directory
            </Link>
          )}

          <Link 
            href="/" 
            className="inline-flex text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10 rounded-lg px-4 py-2"
          >
            Book Slot
          </Link>

          {/* Session Authentication status */}
          {session ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <span className="hidden lg:inline text-xs text-slate-400 font-semibold truncate max-w-[120px]">
                {session.name}
              </span>
              <button 
                onClick={handleLogout} 
                className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer bg-transparent border-none outline-none"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link 
              href="/doctor/login" 
              className="text-xs font-bold text-slate-650 hover:text-slate-900 transition-colors pl-2"
            >
              Login
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
