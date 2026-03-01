import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WhoAte",
  description: "Split bills with friends. Snap a receipt, claim items, see who owes what.",
  keywords: ["bill splitter", "receipt scanner", "split expenses"],
  authors: [{ name: "CroissanStudio", url: "https://croissanstudio.ru" }],
  openGraph: {
    title: "WhoAte",
    description: "Split bills with friends",
    type: "website",
    url: "https://whoate.app",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans`}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
