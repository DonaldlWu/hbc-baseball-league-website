import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/src/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "新和週六野球聯盟",
  description:
    "新和週六野球聯盟統計網站 - 球員資料查詢、統計排行榜、數據視覺化",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "新和週六野球聯盟",
    description:
      "新和週六野球聯盟統計網站 - 球員資料查詢、統計排行榜、數據視覺化",
    images: [
      {
        url: "/XYG.png",
        width: 714,
        height: 598,
        alt: "新和週六野球聯盟",
      },
    ],
    locale: "zh_TW",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "新和週六野球聯盟",
    description:
      "新和週六野球聯盟統計網站 - 球員資料查詢、統計排行榜、數據視覺化",
    images: ["/XYG.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navigation />
        {children}
      </body>
    </html>
  );
}
