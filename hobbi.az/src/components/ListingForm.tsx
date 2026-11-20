"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ListingForm({ categories }: { categories: { slug: string; name: string }[] }) {
  const r = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const fd = new FormData(); fd.append("file", f);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await res.json();
    if (!res.ok) { setErr(j.error ?? "Yükləmə xətası"); return; }
    setErr(""); setImages((p) => [...p, j.key]); e.target.value = "";
  }
  async function submit(form: HTMLFormElement, status: "DRAFT" | "PUBLISHED") {
    setBusy(true); setErr("");
    const body = { ...Object.fromEntries(new FormData(form)), status, images };
    const res = await fetch("/api/listings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    const j = await res.json();
    if (!res.ok) { setErr(j.error ?? "Xəta"); return; }
    r.push(`/listings/${j.id}`);
  }
  return (
    <form className="hb-form" onSubmit={(e) => { e.preventDefault(); void submit(e.currentTarget, "PUBLISHED"); }}>
      <input name="title" placeholder="Başlıq" required aria-label="Başlıq" />
      <textarea name="description" placeholder="Təsvir" rows={5} required aria-label="Təsvir" />
      <input name="priceAzn" type="number" min="0" step="0.01" placeholder="Qiymət (₼)" required aria-label="Qiymət" />
      <select name="categorySlug" required aria-label="Kateqoriya"><option value="">Kateqoriya seçin</option>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
      <select name="condition" aria-label="Vəziyyət"><option value="NEW">Yeni</option><option value="USED">İşlənmiş</option><option value="HANDMADE">Əl işi</option></select>
      <input name="city" placeholder="Şəhər" required aria-label="Şəhər" />
      <label>Şəkil (JPG/PNG/WebP, max 5 MB) <input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} /></label>
      {images.length > 0 && <p>{images.length} şəkil yükləndi</p>}
      {err && <p role="alert" className="hb-error">{err}</p>}
      <div><button className="hb-btn" disabled={busy}>Dərc et</button>{" "}
        <button type="button" className="hb-btn" disabled={busy} onClick={(e) => { const f = e.currentTarget.form; if (f && f.reportValidity()) void submit(f, "DRAFT"); }}>Qaralama saxla</button></div>
    </form>
  );
}
