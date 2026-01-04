import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

// Next.js Fonts

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://getfittogether.vercel.app'),
  title: "Get Fit Together x VYAIAM Clinic - 8-Week Fitness Challenge",
  description: "Join our gamified 8-week fitness programme combining daily strength training, clean eating, and community accountability. Track progress, earn points, and transform together.",
  keywords: ["fitness challenge", "VYAIAM clinic", "strength training", "habit building", "fitness gamification", "group fitness", "wellness programme"],
  authors: [{ name: "VYAIAM Clinic" }],
  creator: "VYAIAM Clinic",
  publisher: "VYAIAM Clinic",
  alternates: {
    canonical: 'https://getfittogether.vercel.app',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    url: "https://getfittogether.vercel.app",
    title: "Get Fit Together x VYAIAM Clinic",
    description: "8-week gamified fitness challenge with daily check-ins, leaderboards, and community events.",
    siteName: "Get Fit Together",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Get Fit Together x VYAIAM Clinic",
    description: "Join our 8-week fitness transformation challenge",
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
};

// Script to prevent flash of wrong theme
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('theme');
      var isDark = theme === 'dark' || 
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
        (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} ${inter.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
