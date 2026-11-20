"use client";

import { useUI } from "@/providers/UIProvider";
import { copyText } from "@/lib/storage-client";
import { Modal } from "./Modal";

const SHARE_LINK = "https://senetkar.az/product/gumus-minimalist-sirgalar";

export function ShareModal() {
  const { modal, closeModal } = useUI();

  const copy = async () => {
    await copyText(SHARE_LINK);
    alert("Link kopyalandı ✅");
  };

  const shareVia = (platform: "whatsapp" | "telegram" | "instagram") => {
    if (platform === "instagram") {
      alert("Instagram paylaşımı üçün link kopyalanıb, bio və ya DM ilə paylaşa bilərsiniz.");
      void copy();
      return;
    }
    const url = encodeURIComponent(SHARE_LINK);
    const text = encodeURIComponent("Bu məhsula bax: ");
    const href = platform === "whatsapp" ? `https://wa.me/?text=${text}${url}` : `https://t.me/share/url?url=${url}&text=${text}`;
    window.open(href, "_blank", "noopener");
  };

  return (
    <Modal id="share-modal" open={modal === "share"} onClose={closeModal} boxStyle={{ maxWidth: 470 }}>
      <button className="modal-close" onClick={closeModal} aria-label="Bağla">×</button>
      <div className="share-options">
        <div className="share-title">Məhsulu paylaş</div>
        <div className="share-sub">Linki kopyala və ya sürətli paylaşım seç.</div>
        <div className="share-product-preview">
          <div>
            <div style={{ fontWeight: 700, fontSize: ".92rem" }}>Gümüşü Minimalist Sırğalar</div>
            <div style={{ fontSize: ".8rem", color: "var(--outline)", marginTop: ".08rem" }}>ZərgərStudio · 45 ₼</div>
          </div>
          <span style={{ fontSize: "1.15rem" }}>💍</span>
        </div>
        <input id="share-link" className="share-link" readOnly value={SHARE_LINK} onFocus={(e) => e.currentTarget.select()} />
        <div className="share-actions">
          <button className="share-btn primary" onClick={copy}>Linki kopyala</button>
          <button className="share-btn" onClick={() => shareVia("whatsapp")}>WhatsApp</button>
          <button className="share-btn" onClick={() => shareVia("telegram")}>Telegram</button>
          <button className="share-btn" onClick={() => shareVia("instagram")}>Instagram</button>
        </div>
      </div>
    </Modal>
  );
}
