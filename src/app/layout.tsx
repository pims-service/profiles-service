import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MindLink | Find Verified Psychiatrists Closer to Home",
  description: "Advanced geospatial psychiatrist search matching you with nearby board-certified clinical providers based on GPS geolocation, standard ratings, and live openings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900 antialiased font-sans" suppressHydrationWarning>
        
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight text-slate-900 hover:opacity-90">
              <div className="h-6 w-6 rounded bg-emerald-600 flex items-center justify-center text-white text-[10px] font-black tracking-tighter shadow-sm">ML</div>
              <span>MindLink</span>
            </a>

            {/* Quick Links */}
            <nav className="hidden md:flex gap-8">
              <a href="/" className="text-sm font-semibold text-slate-900 border-b-2 border-emerald-600 pb-1 pt-1">
                Find Doctors
              </a>
              <a href="/doctor" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors pt-1">
                Doctor Workspace
              </a>
              <a href="/admin" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors pt-1">
                Admin Console
              </a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <a href="/doctor/register" className="hidden sm:inline-flex text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all rounded-lg px-4 py-2">
                Join Directory
              </a>
              <a href="/" className="inline-flex text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10 rounded-lg px-4 py-2">
                Book Slot
              </a>
            </div>
          </div>
        </header>

        {/* Core Workspace Page View */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Simple decluttered footer */}
        <footer className="border-t border-slate-200 bg-white py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-display text-md font-bold text-slate-900">
              <div className="h-4 w-4 rounded bg-emerald-600 shadow-sm inline-block"></div>
              <span>MindLink Directory</span>
            </div>
            <div className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} MindLink. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
