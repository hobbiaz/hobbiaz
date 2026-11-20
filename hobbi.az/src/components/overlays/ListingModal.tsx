"use client";

import { useRef, useState } from "react";
import { useUI } from "@/providers/UIProvider";
import { Icon25Tamamlandi, IconAcarSozler, IconArrowNext, IconBunlariTetbiqEt, IconElaveEt, IconGunduzIsigindanIstifadeEdin, IconKateqoriyaSecimi, IconLSelectChevron, IconLSelectChevron2, IconListingTipsCard, IconListingVideoAside, IconMehsulunAciqlamasi, IconQisaVideoElaveEt, IconQisaVideoElaveEt2, IconQisaVideoElaveEt3, IconSekil, IconSekilleriBuraSurukleyinVe, IconSekillerleUygunluq, IconVideo, IconYeniElan } from "@/components/icons";

const STEPS = {
  1: { cardTitle: "Məhsulun təsvirlərini yükləyin", pct: "25% Tamamlandı", progress: "25%" },
  2: { cardTitle: "Məhsul Məlumatı", pct: "50% Tamamlandı", progress: "50%" },
  3: { cardTitle: "Kateqoriya və Təsvir", pct: "75% Tamamlandı", progress: "75%" },
  4: { cardTitle: "Açar sözlər", pct: "100% Tamamlandı", progress: "100%" },
} as const;
type Step = keyof typeof STEPS;

const MAX_PHOTOS = 10;
const MAX_TAGS = 13;
const PRESET_TAGS = ["Yeni", "Zəmanətli", "Keyfiyyətli"];

interface Photo { id: number; src: string }

/** "Yeni Elan" — four-step listing wizard (photos → details → category → tags). */
export function ListingModal() {
  const { modal, closeModal, toast } = useUI();
  const open = modal === "listing";
  const [step, setStep] = useState<Step>(1);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [coverId, setCoverId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [desc, setDesc] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(PRESET_TAGS);
  const fileRef = useRef<HTMLInputElement>(null);
  const meta = STEPS[step];
  const stepClass = (s: Step) => `lstep${step === s ? " active" : ""}`;

  // Re-opening the wizard always starts from step 1 (legacy openListingModal).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setStep(1);
  }

  const pickFiles = () => fileRef.current?.click();
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    if (photos.length >= MAX_PHOTOS) { toast("Maksimum 10 şəkil yükləyə bilərsiniz"); return; }
    Array.from(files).slice(0, MAX_PHOTOS - photos.length).filter((f) => f.type.startsWith("image/")).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const photo = { id: Date.now() + Math.random(), src: String(ev.target?.result) };
        setPhotos((list) => [...list, photo]);
        setCoverId((c) => c ?? photo.id);
      };
      reader.readAsDataURL(file);
    });
  };
  const removePhoto = (id: number) => {
    setPhotos((list) => {
      const next = list.filter((p) => p.id !== id);
      if (coverId === id) setCoverId(next[0]?.id ?? null);
      return next;
    });
  };

  const next = () => setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  const prev = () => (step > 1 ? setStep((s) => (s - 1) as Step) : closeModal());
  const saveDraft = () => { toast("Qaralama olaraq saxlandı 📝"); closeModal(); };
  const publish = () => {
    if (!title.trim()) { toast("Zəhmət olmasa başlıq daxil edin"); return; }
    if (!category) { toast("Zəhmət olmasa kateqoriya seçin"); return; }
    toast("Məhsul uğurla dərc edildi! 🎉");
    closeModal();
  };
  const onTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const v = tagInput.trim();
    if (!v || tags.length >= MAX_TAGS) return;
    setTags((t) => [...t, v]);
    setTagInput("");
  };

  return (
    <div id="listing-modal" className={open ? "open" : undefined} onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="listing-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Yeni Elan">
        <header className="listing-header">
          <div className="listing-header-inner">
            <div className="listing-header-left">
              <button type="button" className="listing-back-btn" onClick={prev} aria-label="Geri">
                <IconYeniElan />
              </button>
              <h1 className="listing-header-title">Yeni Elan</h1>
            </div>
            <button type="button" className="listing-help-btn" onClick={() => toast("Kömək mərkəzi tezliklə")} aria-label="Kömək">
              <Icon25Tamamlandi />
            </button>
          </div>
        </header>

        <div className="listing-progress-slim">
          <span className={`listing-progress-slim-text${step === 4 ? " done" : ""}`} id="listing-pct-label">{meta.pct}</span>
          <div className="listing-progress-slim-track">
            <div className="listing-progress-slim-fill" id="listing-progress-bar" style={{ width: meta.progress }}></div>
          </div>
        </div>

        <div className="listing-scroll">
          <div className="listing-inner">
            <div className="listing-progress-card listing-progress-card-desktop">
              <div className="listing-progress-card-head">
                <span className="listing-progress-card-title" id="listing-progress-title-d">{meta.cardTitle}</span>
                <span className={`listing-progress-card-pct${step === 4 ? " done" : ""}`} id="listing-pct-label-d">{meta.pct}</span>
              </div>
              <div className="listing-progress-card-track">
                <div className="listing-progress-card-fill" id="listing-progress-bar-d" style={{ width: meta.progress }}></div>
              </div>
            </div>

          {/* STEP 1 */}
          <div id="lstep-1" className={stepClass(1)}>
            <div className="listing-two-col">
              <div className="listing-step-grid">
                <div className="listing-card listing-card-muted">
                  <div className="listing-card-head">
                    <IconSekil />
                    <h3>Şəkil</h3>
                  </div>
                  <div
                    className={`listing-drop-zone upload-drop-zone${dragOver ? " drag-over" : ""}`}
                    id="drop-zone"
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                    onClick={pickFiles}
                  >
                    <div className="listing-drop-icon-wrap" style={{ background: "transparent", boxShadow: "none" }}>
                    <IconSekilleriBuraSurukleyinVe />
                    </div>
                    <div className="listing-drop-title">Şəkilləri bura sürükləyin və ya seçin</div>
                    <div className="listing-drop-sub">Minimum 3 şəkil tövsiyə olunur (Maks 10)</div>
                  </div>
                  <input ref={fileRef} type="file" id="file-input" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
                  <div className="upload-preview-row" id="preview-row">
                    <div className="listing-thumb-add" onClick={pickFiles}><IconElaveEt /><span>Əlavə et</span></div>
                    <div className="listing-thumb-add" onClick={pickFiles}><IconElaveEt /></div>
                    <div className="listing-thumb-add" onClick={pickFiles}><IconElaveEt /></div>
                    {photos.map((p) => (
                      <div
                        key={p.id}
                        className={`upload-preview-item${coverId === p.id ? " cover-img" : ""}`}
                        title="Üzlük şəkli seçmək üçün klikləyin"
                        onClick={() => setCoverId(p.id)}
                      >
                        <img src={p.src} alt="preview" />
                        <button type="button" className="upload-remove-btn" onClick={(e) => { e.stopPropagation(); removePhoto(p.id); }}>×</button>
                        {coverId === p.id && <div className="cover-tag">ƏSAS</div>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="listing-card listing-card-muted">
                  <div className="listing-card-head">
                    <IconVideo />
                    <h3>Video</h3>
                  </div>
                  <div className="listing-video-row" onClick={() => toast("Video seçin")}>
                    <div className="listing-video-icon">
                    <IconQisaVideoElaveEt />
                    </div>
                    <div className="listing-video-text"><strong>Qısa video əlavə et</strong><span>Maksimum 30 saniyə, MP4 formatda</span></div>
                    <IconQisaVideoElaveEt2 />
                  </div>
                  <div className="listing-video-desktop" onClick={() => toast("Video seçin")}>
                    <div className="listing-video-upload">
                      <div className="listing-video-upload-icon"><IconQisaVideoElaveEt3 /></div>
                      <div className="listing-drop-title">Qısa video əlavə et</div>
                      <div className="listing-drop-sub">Max 30 san, MP4 formatı</div>
                    </div>
                    <div className="listing-video-aside">
                      <div style={{ width: "48px", height: "80px", border: "2px solid #D1D5DB", borderRadius: "6px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ position: "absolute", top: "-4px", width: "16px", height: "2px", background: "#D1D5DB", borderRadius: "2px" }}></div>
                        <IconListingVideoAside />
                      </div>
                      <p>Video şaquli istiqamətdə çəkilmiş 9:16 nisbətdə olmalıdır.</p>
                    </div>
                  </div>
                </div>
                <div className="listing-tips-card listing-tag-tip" style={{ margin: "0" }}>
                  <IconListingTipsCard />
                  <div>
                    <p style={{ margin: "0 0 .75rem", color: "#1E40AF", fontSize: ".8125rem", lineHeight: "1.5" }}>Keyfiyyətli şəkillər satışı sürətləndirir! Şəkilləri təbii işıq altında, təmiz arxa fon qarşısında çəkməyə çalışın.</p>
                    <ul className="listing-tips-list">
                      <li><IconGunduzIsigindanIstifadeEdin />Gündüz işığından istifadə edin</li>
                      <li><IconGunduzIsigindanIstifadeEdin />Fokusun məhsulda olduğuna əmin olun</li>
                      <li><IconGunduzIsigindanIstifadeEdin />Məhsulun qüsurlarını (varsa) gizlətməyin</li>
                    </ul>
                  </div>
                </div>
              </div>
              <aside className="listing-aside listing-tips-card">
                <h3><IconBunlariTetbiqEt /> Bunları tətbiq et</h3>
                <p>Keyfiyyətli şəkillər satışı sürətləndirir! Şəkilləri təbii işıq altında, təmiz arxa fon qarşısında çəkməyə çalışın.</p>
                <ul className="listing-tips-list">
                  <li><IconGunduzIsigindanIstifadeEdin />Gündüz işığından istifadə edin</li>
                  <li><IconGunduzIsigindanIstifadeEdin />Fokusun məhsulda olduğuna əmin olun</li>
                  <li><IconGunduzIsigindanIstifadeEdin />Məhsulun qüsurlarını (varsa) gizlətməyin. Bu müştəridə güvən yaradır</li>
                </ul>
              </aside>
            </div>
          </div>

          {/* STEP 2 */}
          <div id="lstep-2" className={stepClass(2)}>
            <div className="listing-screen-title">
              <h2 id="listing-screen-title-2">Məhsulun Məlumatları</h2>
              <p id="listing-screen-sub-2">Məhsulunuzu daha yaxşı tanıtmaq üçün detalları qeyd edin.</p>
            </div>
            <div className="listing-form-card">
              <div className="listing-form-stack">
                <div className="l-field">
                  <label className="l-label-upper" htmlFor="l-title">BAŞLIQ</label>
                  <input className="l-input" type="text" id="l-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Məs: Əl işi saxsı qab - Minimalist dizayn" maxLength={140} />
                </div>
                <div className="l-row">
                  <div className="l-field">
                    <label className="l-label-upper" htmlFor="l-author">KİM HAZIRLAYIB?</label>
                    <div className="l-select-wrap">
                      <select className="l-select" id="l-author">
                        <option value="">Müəllifi seçin</option>
                        <option>Mən özüm</option>
                        <option>Komandam</option>
                        <option>Başqası (Vintage)</option>
                      </select>
                      <IconLSelectChevron />
                    </div>
                  </div>
                  <div className="l-field l-field-date">
                    <label className="l-label-upper" htmlFor="l-date">NƏ VAXT HAZIRLANIB?</label>
                    <input className="l-input" type="date" id="l-date" placeholder="mm/dd/yyyy" />
                  </div>
                </div>
                <div className="listing-match-tip">
                  <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEPK0oj_uiNCXlCO_1sOZ3aoJnFaDr53GnFwd8MxMKjvq_zivpA9Kgp2E81vN5sIWHdUYFkH4Vci33i6zAioiFP8lmieDsUkqhy7-JZhccfXyxFYyhRqzZvfWUBBYlykP2jURchkiqBLJgCZQAk4NVxBeAGR6ESGmmSq1JCmbmHf65_1gzG8jJFfoVV-Nu4alEQisvlII3UitkeXkLWQkNbs5MN7EohrezcFVfCyH0S2EtdqyLb6tG6G6iAgEzk6UWVWH-zd_4kNQ" alt="Məhsul önizləmə" />
                  <div>
                    <strong>Şəkillərlə uyğunluq</strong>
                    <span>Daxil etdiyiniz başlıq, məhsulunuz ilə əlaqəli olmalıdır.</span>
                  </div>
                </div>
              </div>
              <div className="listing-match-tip-desktop">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEPK0oj_uiNCXlCO_1sOZ3aoJnFaDr53GnFwd8MxMKjvq_zivpA9Kgp2E81vN5sIWHdUYFkH4Vci33i6zAioiFP8lmieDsUkqhy7-JZhccfXyxFYyhRqzZvfWUBBYlykP2jURchkiqBLJgCZQAk4NVxBeAGR6ESGmmSq1JCmbmHf65_1gzG8jJFfoVV-Nu4alEQisvlII3UitkeXkLWQkNbs5MN7EohrezcFVfCyH0S2EtdqyLb6tG6G6iAgEzk6UWVWH-zd_4kNQ" alt="" width="64" height="64" style={{ borderRadius: "8px", objectFit: "cover" }} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: ".35rem", marginBottom: ".35rem" }}>
                    <IconSekillerleUygunluq />
                    <span style={{ fontSize: ".75rem", fontWeight: "700", letterSpacing: ".05em", color: "#1D4ED8" }}>ŞƏKİLLƏRLƏ UYĞUNLUQ</span>
                  </div>
                  <p style={{ margin: "0", fontSize: ".8125rem", color: "#374151", lineHeight: "1.5" }}>Daxil etdiyiniz başlıq yüklədiyiniz şəkillərdəki məhsulu tam əks etdirməlidir. Bu, müştərilərin məhsulunuzu daha rahat tapmasına kömək edir.</p>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3 */}
          <div id="lstep-3" className={stepClass(3)}>
            <div className="listing-screen-title">
              <h2 id="listing-screen-title-3">Kateqoriya və Təsvir</h2>
              <p id="listing-screen-sub-3">Məhsulunuzu düzgün kateqoriyaya yerləşdirin və ətraflı məlumat verin.</p>
            </div>
            <div className="listing-form-stack" style={{ gap: ".75rem" }}>
              <div className="listing-card listing-card-muted" style={{ margin: "0" }}>
                <div className="listing-block-title sm">
                  <IconKateqoriyaSecimi />
                  Kateqoriya Seçimi
                </div>
                <label className="l-label-upper" htmlFor="l-cat" style={{ fontSize: ".75rem", fontWeight: "500", letterSpacing: "0" }}>Əsas Kateqoriya</label>
                <div className="l-select-wrap">
                  <select className="l-select" id="l-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Kateqoriya seçin</option>
                    <option>Keramika</option><option>Rəsm</option><option>Zərgərlik</option>
                    <option>Xalçaçılıq / Toxuculuq</option><option>Ağac işi</option>
                    <option>Musiqi alətləri</option><option>Dəri</option><option>Digər</option>
                  </select>
                  <IconLSelectChevron2 />
                </div>
              </div>
              <div className="listing-card listing-card-muted" style={{ margin: "0" }}>
                <div className="listing-block-title sm">
                  <IconMehsulunAciqlamasi />
                  Məhsulun Açıqlaması
                </div>
                <label className="l-label-upper" htmlFor="l-desc" style={{ fontSize: ".75rem", fontWeight: "500", letterSpacing: "0" }}>Ətrafı məlumat</label>
                <div className="l-textarea-wrap">
                  <textarea className="l-textarea" id="l-desc" maxLength={2000} placeholder="Məhsulunuzun vəziyyəti, rəngi, ölçüsü və digər detalları haqqında yazın..." value={desc} onChange={(e) => setDesc(e.target.value)}></textarea>
                  <span className="l-char-count" id="l-desc-count">{desc.length} / 2000 simvol</span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4 */}
          <div id="lstep-4" className={stepClass(4)}>
            <div className="listing-screen-title">
              <h2 id="listing-screen-title-4">Teqlər</h2>
            </div>
            <div className="listing-form-stack">
              <div>
                <div className="listing-block-title sm" style={{ marginBottom: ".5rem" }}>
                  <IconAcarSozler />
                  Açar sözlər
                </div>
                <p className="listing-tag-intro">Məhsulun axtarışda daha tez tapılması üçün açar sözlər istifadə edin. Bu, potensial alıcıların elanınızı görmə şansını artırır.</p>
                <label className="l-label-upper" htmlFor="l-tag-input" style={{ fontSize: ".75rem", fontWeight: "500", letterSpacing: "0" }}>Teq əlavə edin (məs: Premium)</label>
                <input className="l-input" type="text" id="l-tag-input" placeholder="Məs: Yeni, Zəmanətli..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={onTagKey} />
                <div className="l-tags-wrap" id="l-tags">
                  {tags.map((t, i) => (
                    <span className="listing-tag-chip" key={`${t}-${i}`}>
                      <span className="hash">#</span> {t} <span className="l-tag-x" onClick={() => setTags((list) => list.filter((_, j) => j !== i))}>×</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="listing-tag-tip">
              <IconListingTipsCard />
              <p>Düzgün teqlər məhsulunuzun baxış sayını <strong>40% artıra bilər</strong>. Populyar axtarış sözlərindən istifadə edin.</p>
            </div>
          </div>

          </div>{/* /listing-inner */}
        </div>{/* /listing-scroll */}

        <footer className="listing-footer">
          <div className="listing-footer-inner">
            <button type="button" className="listing-btn-draft" id="listing-draft-btn" onClick={saveDraft}>Qaralama</button>
            <button type="button" className="listing-btn-next" id="listing-next-btn" onClick={step === 4 ? publish : next}>
              {step === 4 ? "Paylaş" : <>Növbəti <IconArrowNext /></>}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
