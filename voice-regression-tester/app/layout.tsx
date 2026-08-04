import "./globals.css";
import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Voice Regression Tester Dashboard",
  description: "Automated regression testing & evaluation suite for voice agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0b0f17] text-[#f1f5f9] antialiased">
        <header className="border-b border-[#232b3b] bg-[#141a24]/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
                V
              </div>
              <span className="font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Voice Regression Tester
              </span>
            </Link>
            <nav className="flex gap-6 text-sm font-medium text-[#94a3b8]">
              <Link href="/" className="hover:text-white transition-colors">
                Dashboard
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
