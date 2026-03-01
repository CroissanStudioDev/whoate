import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WhoAte - The Smartest Way to Split Bills",
  description:
    "Snap a receipt, let AI extract items, swipe to claim, see who owes whom. No sign-up required.",
  keywords: [
    "bill splitter",
    "receipt scanner",
    "split expenses",
    "group expenses",
    "AI receipt",
    "OCR",
    "split bill app",
  ],
  authors: [{ name: "CroissanStudio", url: "https://croissanstudio.ru" }],
  creator: "CroissanStudio",
  openGraph: {
    title: "WhoAte - The Smartest Way to Split Bills",
    description:
      "Snap a receipt, let AI extract items, swipe to claim, see who owes whom.",
    type: "website",
    url: "https://whoate.app",
    siteName: "WhoAte",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "WhoAte - The Smartest Way to Split Bills",
    description:
      "Snap a receipt, let AI extract items, swipe to claim, see who owes whom.",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563EB" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
