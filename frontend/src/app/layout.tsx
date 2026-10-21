import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dexartechnologies.in"),
  title: "Dexar – Online Learning Platform",
  description: "Dexar is a modern online learning platform focused on practical, skill-based education, career courses, and real-world projects.",
  icons: {
    icon: [
      { url: "/images/logo-topbar.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/images/logo-topbar.png",
    apple: "/images/logo-topbar.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${geistSans.className} h-full antialiased`}
    >
      <body className={`${geistSans.className} font-sans min-h-full flex flex-col antialiased`}>{children}</body>
    </html>
  );
}

