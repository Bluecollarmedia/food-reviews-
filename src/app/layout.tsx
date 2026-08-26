import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import BottomNav from "@/components/BottomNav";
import VisitorTracker from "@/components/VisitorTracker";
import AnnouncementScreen from "@/components/AnnouncementScreen";
import { getActiveBanner } from "@/lib/site-settings";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "D&S Food Reviews",
  description: "Honest, brutal, non-biased reviews on food.",
  // Keep the site OUT of Google (and other search engines). Anyone with the
  // direct link can still visit — this only stops it from being listed in
  // search results. Remove this block if you ever want it publicly findable.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#c8102e",
  // Let content extend into the notch/gesture areas so the app is truly
  // edge-to-edge; components use env(safe-area-inset-*) to stay clear.
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const banner = await getActiveBanner();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <head>
        {process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL && (
          <>
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL} />
          </>
        )}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('theme')==='dark'){document.documentElement.setAttribute('data-theme','dark')}}catch(e){}",
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ServiceWorkerRegister />
        <VisitorTracker />
        {banner && <AnnouncementScreen message={banner.message} version={banner.version} />}
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
        <BottomNav />
      </body>
    </html>
  );
}
