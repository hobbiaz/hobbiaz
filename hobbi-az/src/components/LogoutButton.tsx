"use client";
import { useRouter } from "next/navigation";
export function LogoutButton() {
  const r = useRouter();
  return <button className="hb-btn" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); r.push("/"); r.refresh(); }}>Çıxış</button>;
}
