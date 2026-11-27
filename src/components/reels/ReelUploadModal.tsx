"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/overlays/Modal";
import { api, ApiError } from "@/lib/api-client";
import { useUI } from "@/providers/UIProvider";
import { REEL_CREATED_EVENT } from "@/lib/events";

const MAX_MB = 100;
const TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/** PUT with upload progress (fetch has no upload progress events). */
function putWithProgress(url: string, file: File, headers: Record<string, string>, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let msg = "Video yüklənmədi";
      try { msg = (JSON.parse(xhr.responseText) as { error?: string }).error ?? msg; } catch { /* R2 answers XML */ }
      reject(new Error(msg));
    };
    xhr.onerror = () => reject(new Error("Şəbəkə xətası: video yüklənmədi"));
    xhr.send(file);
  });
}

/** "Video yüklə" on the Lent page: pick a video, name it, upload (with progress) and publish. */
export function ReelUploadModal() {
  const { modal, closeModal, toast } = useUI();
  const open = modal === "reelUpload";
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [title, setTitle] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) return;
    setFile(null); setTitle(""); setProgress(null); setError("");
  }, [open]);
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f: File | undefined) => {
    setError("");
    if (!f) return;
    if (!TYPES.includes(f.type)) { setError("Yalnız MP4, WebM və MOV videoları qəbul edilir"); return; }
    if (f.size > MAX_MB * 1024 * 1024) { setError(`Video ${MAX_MB} MB-dan böyükdür`); return; }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").slice(0, 120));
  };

  const busy = progress !== null;
  const canSend = Boolean(file) && title.trim().length >= 2 && !busy;

  const upload = async () => {
    if (!file || !canSend) return;
    setError("");
    setProgress(0);
    try {
      const slot = await api<{ key: string; url: string; headers: Record<string, string> }>("/api/reels/upload-url", { method: "POST", body: { mime: file.type, size: file.size } });
      await putWithProgress(slot.url, file, slot.headers, setProgress);
      await api("/api/reels", { method: "POST", body: { key: slot.key, title: title.trim() } });
      toast("Video paylaşıldı ✅");
      window.dispatchEvent(new Event(REEL_CREATED_EVENT));
      closeModal();
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : "Video yüklənmədi");
      setProgress(null);
    }
  };

  return (
    <Modal id="reel-upload-modal" open={open} onClose={() => !busy && closeModal()} boxStyle={{ maxWidth: 480 }}>
      <button className="modal-close" onClick={() => !busy && closeModal()} aria-label="Bağla">×</button>
      <div className="reel-upload">
        <div className="reel-upload-title">Video yüklə</div>
        <div className="reel-upload-sub">MP4, WebM və ya MOV, ən çox {MAX_MB} MB. Şaquli (9:16) videolar lentdə ən yaxşı görünür.</div>

        <input ref={input} type="file" accept={TYPES.join(",")} hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        {preview ? (
          <div className="reel-upload-preview">
            <video src={preview} muted playsInline controls />
            {!busy && <button type="button" className="reel-upload-change" onClick={() => input.current?.click()}>Başqa video seç</button>}
          </div>
        ) : (
          <button
            type="button"
            className="reel-upload-drop"
            onClick={() => input.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
          >
            <span className="reel-upload-icon" aria-hidden="true">🎬</span>
            <strong>Video seçin</strong>
            <span>və ya bura sürüşdürün</span>
          </button>
        )}

        <label className="reel-upload-label" htmlFor="reel-title">Videonun adı</label>
        <input
          id="reel-title"
          className="reel-upload-input"
          type="text"
          maxLength={120}
          placeholder="Məs: Gil vazanın hazırlanması"
          value={title}
          disabled={busy}
          onChange={(e) => setTitle(e.target.value)}
        />

        {busy && (
          <div className="reel-upload-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress ?? 0}>
            <div style={{ width: `${progress ?? 0}%` }} />
            <span>{progress === 100 ? "Yoxlanılır…" : `Yüklənir… ${progress}%`}</span>
          </div>
        )}
        {error && <div className="reel-upload-error" role="alert">{error}</div>}

        <button type="button" className="reel-upload-submit" disabled={!canSend} onClick={upload}>
          {busy ? "Yüklənir…" : "Paylaş"}
        </button>
      </div>
    </Modal>
  );
}
