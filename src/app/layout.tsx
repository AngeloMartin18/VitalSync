import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import DemoBanner from "@/components/DemoBanner";

export const metadata: Metadata = {
  title: "VitalSync — Fitness & Nutrition Tracker",
  description:
    "Track calories, scan barcodes, and build weekly diet & exercise plans.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-erewhon-white text-erewhon-black antialiased">
        <DemoBanner />
        <Navbar />
        <main className="max-w-6xl mx-auto px-6 md:px-12 py-12 md:py-16">
          {children}
        </main>
        <footer className="border-t border-erewhon-border py-8 px-6 md:px-12">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-erewhon-medium tracking-wide uppercase">
            <span>VitalSync</span>
            <span>&copy; {new Date().getFullYear()} — Wellness Tracker</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
