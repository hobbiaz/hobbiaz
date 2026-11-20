"use client";
import { useState } from "react";
export function ReportButton({ listingId }: { listingId: string }) {
  const [msg, setMsg] = useState("");
  async function report() {
    const reason = window.prompt("Səbəb: SPAM, FRAUD, PROHIBITED, OFFENSIVE, OTHER", "OTHER");
    if (!reason) return;
    const res = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId, reason: reason.toUpperCase() }) });
    setMsg(res.ok ? "Şikayətiniz qəbul edildi" : (await res.json()).error ?? "Xəta");
  }
  return <><button className="hb-btn" onClick={report}>Şikayət et</button>{msg && <span role="status"> {msg}</span>}</>;
}
