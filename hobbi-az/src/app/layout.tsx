import type { Metadata, Viewport } from "next";
import { UIProvider } from "@/providers/UIProvider";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "hobbi.az — Əl işi və hobbi bazarı",
  description: "Azərbaycanlı əl işi sənətkarlarını alıcılarla birləşdirən platforma.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
