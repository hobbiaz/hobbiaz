"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/home/ProductCard";
import { demoCollection } from "@/hooks/useCollections";
import { api, ApiError, timeAgo } from "@/lib/api-client";
import { copyText } from "@/lib/storage-client";
import { useUI } from "@/providers/UIProvider";
import type { CollectionDetail } from "@/types";

/** Share a link: the system share sheet where available, else copy it. */
export async function shareLink(url: string, title: string, toast: (m: string) => void) {
  if (typeof navigator !== "undefined" && navigator.share) {
    try { await navigator.share({ title, url }); return; } catch { /* cancelled → fall back to copying */ }
  }
  await copyText(url);
  toast("Link kopyalandı ✅");
}

/** /collections/<id>: a curated or user-made collection with its products. */
export function CollectionView({ id }: { id: string }) {
  const { backend, rememberProducts, toast } = useUI();
  const justCreated = useSearchParams()?.get("created") === "1";
  const [data, setData] = useState<CollectionDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (backend === "checking") return;
    if (backend === "offline") {
      const c = demoCollection(id);
      if (c) setData(c); else setError("Kolleksiya tapılmadı");
      return;
    }
    api<CollectionDetail>(`/api/collections/${encodeURIComponent(id)}`)
      .then((c) => { setData(c); rememberProducts(c.items); })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Kolleksiyanı yükləmək alınmadı"));
  }, [backend, id, rememberProducts]);

  const url = typeof window !== "undefined" ? `${window.location.origin}/collections/${encodeURIComponent(id)}` : "";
  const share = () => { if (data) void shareLink(url, data.title, toast); };
  const shareText = data ? encodeURIComponent(`${data.title} — hobbi.az kolleksiyası: `) : "";

  return (
    <div className="page active" id="page-collection">
      <div className="section collection-page">
        {error ? (
          <div className="collection-empty">
            <p>{error}</p>
            <Link href="/" className="store-cta-btn">Ana səhifə</Link>
          </div>
        ) : !data ? (
          <p className="collection-empty">Yüklənir…</p>
        ) : (
          <>
            {justCreated && (
              <div className="collection-created">
                <div>
                  <strong>Kolleksiyanız paylaşıldı! 🎉</strong>
                  <span>Artıq hamı onu “Sizin üçün seçilmiş kolleksiyalar” bölməsində görür. Linki dostlarınıza göndərin:</span>
                </div>
                <div className="collection-share-row">
                  <button type="button" className="collection-share-btn primary" onClick={() => { void copyText(url).then(() => toast("Link kopyalandı ✅")); }}>Linki kopyala</button>
                  <a className="collection-share-btn" href={`https://wa.me/?text=${shareText}${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                  <a className="collection-share-btn" href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${shareText}`} target="_blank" rel="noopener noreferrer">Telegram</a>
                </div>
              </div>
            )}
            <div className="collection-head">
              <div>
                <h1 className="collection-title">{data.title}</h1>
                <div className="collection-meta">
                  {[`${data.count} əşya`, data.ownerName && `Kolleksiya: ${data.ownerName}`, data.updatedAt && timeAgo(data.updatedAt)].filter(Boolean).join(" • ")}
                </div>
              </div>
              <button type="button" className="collection-share-btn" onClick={share}>Paylaş</button>
            </div>
            {data.items.length === 0
              ? <p className="collection-empty">Bu kolleksiyada hələ məhsul yoxdur.</p>
              : <div className="product-grid-masonry">{data.items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>}
          </>
        )}
      </div>
    </div>
  );
}
