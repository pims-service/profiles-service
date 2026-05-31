import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

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
        <Header />

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
