import type { Metadata, Viewport } from "next";
import "./globals.css";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: `${env.siteName} — Learn the 3DEXPERIENCE® platform (Dassault Systèmes)`,
    template: `%s · ${env.siteName}`,
  },
  description:
    "Full-stack CAD/CAE learning platform for CATIA, SIMULIA, ENOVIA and DELMIA on the 3DEXPERIENCE platform: structured courses, YouTube & Google Drive lessons, progress tracking, certificates, and an admin panel to publish them.",
  keywords: [
    "3DEXPERIENCE",
    "Dassault Systemes",
    "CATIA V5",
    "xDesign",
    "SIMULIA Abaqus",
    "ENOVIA PLM",
    "DELMIA",
    "CAD courses",
    "engineering learning platform",
  ],
  openGraph: {
    title: `${env.siteName} — 3DEXPERIENCE learning platform`,
    description: "Structured CATIA / SIMULIA / ENOVIA / DELMIA courses with Google sign-in, student & admin dashboards.",
    type: "website",
    images: [{ url: "/media/hero.jpg", width: 1280, height: 720, alt: "Engineering students reviewing a 3D CAD model on the 3DEXPERIENCE platform" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${env.siteName} — learn the 3DEXPERIENCE® platform`,
    images: ["/media/hero.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1233",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col">{children}</div>
      </body>
    </html>
  );
}
