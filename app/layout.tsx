import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google"; // Using Google Fonts
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthSyncBootstrap } from "@/components/Auth/AuthSyncBootstrap";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-jp",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Kanji Kaisen",
  description: "Gamified Kanji learning platform with AI stroke recognition and elemental progression paths.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${notoSansJP.variable} font-sans antialiased flex flex-col min-h-screen`}
      >
        <AuthSyncBootstrap />
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
