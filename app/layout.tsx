import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google"; // Using Google Fonts
import "./globals.css";
import { Header } from "@/components/Header";

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
  description: "Visual Kanji frequency explorer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${notoSansJP.variable} font-sans antialiased`}
      >
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
