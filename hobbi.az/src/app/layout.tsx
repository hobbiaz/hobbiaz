import type { Metadata, Viewport } from "next";
import { UIProvider } from "@/providers/UIProvider";
import { AppShell } from "@/components/layout/AppShell";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "hobbi.az — Əl işi və hobbi bazarı", template: "%s · hobbi.az" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "az_AZ",
    title: "hobbi.az — Əl işi və hobbi bazarı",
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary", title: "hobbi.az", description: SITE_DESCRIPTION },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e76262",
};

// Applies the saved theme before first paint so there is no light/dark flash.
const themeInit = `try{document.documentElement.setAttribute('data-theme',localStorage.getItem('theme')||'auto')}catch(e){document.documentElement.setAttribute('data-theme','auto')}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az" data-theme="auto" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700;900&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,400&family=Manrope:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <UIProvider>
          <AppShell>{children}</AppShell>
        </UIProvider>
      </body>
    </html>
  );
}
