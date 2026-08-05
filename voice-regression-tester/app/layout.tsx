// app/layout.tsx
import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-display" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" });

export const metadata: Metadata = { title: "Voice Regression Lab" };

const GLASS_PANEL = "border border-glass-border bg-glass-fill backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_50px_-20px_rgba(0,0,0,0.7)]";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable}`}>
      <body className={`${inter.className} relative min-h-screen overflow-x-hidden bg-[radial-gradient(ellipse_at_top,_var(--color-page-bg-1),_var(--color-page-bg-2)_65%)] text-ink font-light`}>
        {/* single restrained ambient glow — no more color-blob soup */}
        <div aria-hidden className="pointer-events-none fixed left-1/2 top-0 -z-10 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-amber/20 blur-[130px]" />

        <div className="flex min-h-screen p-6 gap-6">
          <aside className={`w-60 shrink-0 h-fit sticky top-6 rounded-[28px] ${GLASS_PANEL} p-5`}>
            <Link href="/" className={`${plexMono.className} block text-xs tracking-widest text-ink-muted uppercase mb-8`}>
              Voice Regression Lab
            </Link>
            <nav className="space-y-1 text-sm font-normal">
              <Link href="/" className="block rounded-2xl px-3 py-2 hover:bg-white/[0.06] transition-colors">Test cases</Link>
            </nav>
          </aside>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}