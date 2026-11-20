"use client";

import { useRef, useState } from "react";
import { useUI } from "@/providers/UIProvider";
import { IconCloseThin, IconUploadImage } from "@/components/icons";
import { Modal } from "./Modal";

/** "Məhsul Hazırlat" — a buyer asks makers to produce a custom item. */
export function CreateProductModal() {
  const { modal, closeModal, toast } = useUI();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");

  const submit = () => {
    if (!title.trim()) {
      alert("Zəhmət olmasa başlıq daxil edin.");
      return;
    }
    closeModal();
    toast("Məhsul hazırlatma sorğusu göndərildi! 🎨");
    setTitle(""); setDesc(""); setPrice(""); setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Modal id="create-product-modal" open={modal === "create"} onClose={closeModal} boxStyle={{ maxWidth: 480, padding: 0, overflow: "hidden" }}>
      <div className="create-modal-inner">
        <div className="create-modal-header">
          <div className="create-modal-title">Məhsul Hazırlat</div>
          <button className="create-modal-close" onClick={closeModal} aria-label="Bağla">
            <IconCloseThin />
          </button>
        </div>
        <div className="create-modal-divider" />
        <div className="create-field-group">
          <label className="create-field-label">Hazırlatmaq istədiyiniz məhsulun şəklini əlavə edin</label>
          <div className="create-upload-zone" onClick={() => fileRef.current?.click()}>
            <input
              ref={fileRef}
              type="file"
              id="create-file-input"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
            <div className="create-upload-icon"><IconUploadImage /></div>
            <div className="create-upload-title" id="create-upload-title">{fileName ?? "Şəkil yükləyin"}</div>
            <div className="create-upload-sub">JPG, PNG (maks. 5MB)</div>
          </div>
        </div>
        <div className="create-field-group">
          <label className="create-field-label" htmlFor="create-title">Başlıq</label>
          <input className="create-input" id="create-title" type="text" placeholder="Başlıq əlavə edin" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="create-field-group">
          <label className="create-field-label" htmlFor="create-desc">Açıqlama</label>
          <textarea className="create-textarea" id="create-desc" placeholder="Açıqlama yazın..." value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="create-field-group">
          <label className="create-field-label" htmlFor="create-price">Büdcə (AZN)</label>
          <div className="create-price-wrap">
            <input className="create-input" id="create-price" type="number" min="0" placeholder="Təklif edə biləcəyiniz məbləğ (max)" value={price} onChange={(e) => setPrice(e.target.value)} />
            <span className="create-price-symbol">₼</span>
          </div>
          <div className="create-price-note">* Qiymət təxminidir və müzakirə oluna bilər.</div>
        </div>
        <button className="create-submit-btn" onClick={submit}>Sifarişi Paylaş</button>
      </div>
    </Modal>
  );
}
