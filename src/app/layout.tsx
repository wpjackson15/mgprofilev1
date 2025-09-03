import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AdminAuthInitializer from "@/components/AdminAuthInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Genius Profile",
  description: "Build strength-based profiles to share with teachers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AdminAuthInitializer />
        {children}
        <footer className="w-full text-center py-4 text-xs text-gray-500 border-t mt-8">
          <a href="/terms-and-conditions.pdf" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">Terms & Conditions (PDF)</a>
        </footer>
      </body>
    </html>
  );
}
