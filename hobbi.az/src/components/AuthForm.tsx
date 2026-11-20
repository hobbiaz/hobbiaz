"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const r = useRouter();
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setErr("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (!res.ok) { setErr((await res.json()).error ?? "Xəta"); return; }
    r.push("/"); r.refresh();
  }
  return (
    <form className="hb-form" onSubmit={submit}>
      {mode === "register" && <input name="name" placeholder="Ad" required aria-label="Ad" />}
      <input name="email" type="email" placeholder="E-poçt" required aria-label="E-poçt" />
      <input name="password" type="password" placeholder="Şifrə" required aria-label="Şifrə" />
      {mode === "register" && <select name="role" aria-label="Hesab növü"><option value="BUYER">Alıcı</option><option value="SELLER">Satıcı</option></select>}
      {err && <p role="alert" className="hb-error">{err}</p>}
      <button className="hb-btn" disabled={busy}>{mode === "login" ? "Daxil ol" : "Qeydiyyatdan keç"}</button>
    </form>
  );
}
