import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/LogoutButton";
import "./globals.css";

export const metadata: Metadata = { title: "hobbi.az", description: "Əl işi və hobbi məhsulları bazarı" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="az">
      <body>
        <header className="hb-nav">
          <Link href="/" className="hb-logo">hobbi.az</Link>
          <nav aria-label="Əsas naviqasiya">
            <Link href="/reels">Reels</Link>
            {user ? (<>
              {user.role !== "BUYER" && <Link href="/listings/new">Elan yerləşdir</Link>}
              <Link href="/favorites">Seçilmişlər</Link>
              <span>{user.name}</span><LogoutButton />
            </>) : (<><Link href="/login">Daxil ol</Link><Link href="/register">Qeydiyyat</Link></>)}
          </nav>
        </header>
        <main className="hb-main">{children}</main>
      </body>
    </html>
  );
}
