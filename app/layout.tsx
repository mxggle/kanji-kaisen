import type { Metadata } from "next";
import { Cormorant_Garamond, Shippori_Mincho_B1, Zen_Kaku_Gothic_New } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthSyncBootstrap } from "@/components/Auth/AuthSyncBootstrap";
import { DEFAULT_SKIN, SKIN_SCRIPT } from "@/components/Skin/skin";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Japanese display (kanji, kana). Google serves CJK fonts in unicode-range
// slices, so nothing is preloaded: the browser fetches only the slices a page uses.
const mincho = Shippori_Mincho_B1({
  variable: "--font-jp",
  weight: ["600", "800"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

// Latin display (headings, the logo). Variable weight 500–700 plus italic.
const cormorant = Cormorant_Garamond({
  variable: "--font-disp",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

// UI text (Latin and Japanese).
const gothic = Zen_Kaku_Gothic_New({
  variable: "--font-ui",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – Kanji atlas with stroke order, readings & radical stories`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // Only site-wide defaults here: pages set their own openGraph title/url, and
  // Twitter falls back to it, so nothing generic leaks onto specific pages.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-skin is rewritten before paint by SKIN_SCRIPT, hence suppressHydrationWarning.
    <html
      lang="en"
      data-skin={DEFAULT_SKIN}
      className={`${mincho.variable} ${cormorant.variable} ${gothic.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SKIN_SCRIPT }} />
      </head>
      <body className="font-ui antialiased flex flex-col min-h-screen">
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
