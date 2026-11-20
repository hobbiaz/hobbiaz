"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUI } from "@/providers/UIProvider";
import { api } from "@/lib/api-client";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { readJSON, writeStorage } from "@/lib/storage-client";
import { DEFAULT_PROFILE, SETTINGS_ACTIVITIES, SETTINGS_BLOCKED, SETTINGS_META, type SettingsSection } from "@/data/settings";
import type { ProfileData } from "@/types";
import { IconBloklanmis, IconBloklanmis2, IconBloklanmisHesablar, IconCihazlar, IconCixisEt, IconCixisEt2, IconDestek, IconDestek2, IconDil, IconDil2, IconDil3, IconFealiyyetler, IconFealiyyetler2, IconGorunus, IconGorunus2, IconGorunus3, IconHaqqinda, IconHesabMelumatlarim, IconHesabMelumatlarim2, IconHesabMelumatlarim3, IconHesabMelumatlarim4, IconHesabTipi, IconHesabTipi2, IconInterfeysDili, IconIstifadeSertleri, IconIstifadeSertleri2, IconLightbulb, IconMexfilikSiyaseti, IconMexfilikSiyaseti2, IconParametrler2, IconSettingsBack, IconSpDeskExtraArrow, IconSpMobItemArrow, IconTehlukesizlik } from "@/components/icons";
import { pressable } from "@/lib/a11y";

const PROFILE_KEY = "hobbi_profile";
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "destek@hobbi.az";
const loadProfile = (): ProfileData => ({ ...DEFAULT_PROFILE, ...readJSON<Partial<ProfileData>>(PROFILE_KEY, {}) });

/**
 * Parametrlər. Phones get a list that opens full-screen sub-panels; ≥900px gets a
 * two-column layout where the same sections render as panes.
 */
export function SettingsPage() {
  const router = useRouter();
  const { toast, openAuth, theme, setTheme, lang, setLang, user, backend, logout: signOut, refreshUser } = useUI();
  const isDesktop = useMediaQuery("(min-width: 900px)");
  const [section, setSection] = useState<SettingsSection>("account");
  const [subPanel, setSubPanel] = useState<SettingsSection | null>(null);
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [draft, setDraft] = useState<ProfileData>(DEFAULT_PROFILE);
  const [editing, setEditing] = useState(false);
  const [blocked, setBlocked] = useState(SETTINGS_BLOCKED);
  const [supportMsg, setSupportMsg] = useState("");
  const meta = SETTINGS_META[section];

  // Signed in: the profile comes from the account; offline demo: from localStorage.
  useEffect(() => {
    if (!user) return;
    setProfile({
      name: user.store?.name ?? user.name,
      email: user.email,
      phone: user.store?.phone ?? user.phone ?? "",
      location: user.store?.region ?? user.city ?? "",
      bio: user.store?.bio ?? user.bio ?? "",
    });
  }, [user]);
  useEffect(() => {
    if (backend === "offline") setProfile(loadProfile());
  }, [backend]);
  useEffect(() => {
    document.body.classList.add("settings-open");
    return () => document.body.classList.remove("settings-open");
  }, []);

  const close = () => router.push("/");
  const switchSection = (name: SettingsSection) => {
    if (!isDesktop) { setSubPanel(name); return; }
    setSection(name);
    setEditing(false);
    document.querySelector(".sp-desk-content")?.scrollTo({ top: 0 });
  };
  const openSub = switchSection;
  const closeSub = () => setSubPanel(null);
  const navCls = (name: SettingsSection) => `sp-desk-nav-item${section === name ? " active" : ""}`;
  const paneCls = (name: SettingsSection) => `sp-desk-pane${section === name ? " active" : ""}`;
  const subCls = (name: SettingsSection) => `sub-panel${subPanel === name ? " open" : ""}`;
  const openStore = () => { if (user) router.push("/profile"); else { openAuth("register"); close(); } };
  const logout = () => {
    if (!user) { openAuth("login"); return; }
    if (!confirm("Çıxış etmək istədiyinizə əminsiniz?")) return;
    void signOut();
  };
  const startEdit = () => { setDraft(profile); setEditing(true); };
  const saveProfile = () => {
    const next = { ...draft, name: draft.name.trim(), email: draft.email.trim(), phone: draft.phone.trim(), location: draft.location.trim(), bio: draft.bio.trim() };
    if (!next.name) { toast("Ad daxil edin"); return; }
    if (!user) {
      if (backend === "online") { openAuth("login"); return; }
      writeStorage(PROFILE_KEY, JSON.stringify(next));
      setProfile(next);
      setEditing(false);
      toast("Məlumatlar yadda saxlandı ✅");
      return;
    }
    void (async () => {
      try {
        if (user.store) {
          // Store name is the brand (unique) and is not renamed here.
          await api("/api/store", { method: "PATCH", body: { phone: next.phone || null, region: next.location || undefined, bio: next.bio || null } });
          await api("/api/me", { method: "PATCH", body: { name: user.name, phone: next.phone || null, city: next.location || null, bio: next.bio || null } });
        } else {
          await api("/api/me", { method: "PATCH", body: { name: next.name, phone: next.phone || null, city: next.location || null, bio: next.bio || null } });
        }
        await refreshUser();
        setEditing(false);
        toast("Məlumatlar yadda saxlandı ✅");
      } catch (e) {
        toast(e instanceof Error ? e.message : "Xəta");
      }
    })();
  };
  const field = (key: keyof ProfileData) => ({ value: draft[key], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft({ ...draft, [key]: e.target.value }) });
  const submitSupport = () => {
    if (!supportMsg.trim()) { toast("Mesaj yazın"); return; }
    // No support inbox yet: open the user's mail app addressed to the team.
    const subject = encodeURIComponent("hobbi.az dəstək");
    const body = encodeURIComponent(supportMsg.trim() + (user ? `\n\n— ${user.email}` : ""));
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    setSupportMsg("");
  };
  const langLabel = lang === "az" ? "Azərbaycan" : "Русский";

  return (
    <>
    <div id="page-settings" className="page active">
    {/* ══ STABLE SETTINGS PAGE ══ */}

    {/* ── MOBİL GÖRÜNÜŞ ── */}
    <div className="sp-mobile">
      <div className="sp-mob-topbar">
        <button className="sp-mob-back" onClick={close}>
          <IconParametrler2 />
        </button>
        <span className="sp-mob-title">Parametrlər</span>
      </div>
      <div className="sp-mob-list">
        <div {...pressable} className="sp-mob-item" onClick={() => openSub("account")}>
          <div className="sp-mob-item-icon"><IconHesabMelumatlarim /></div>
          <span className="sp-mob-item-text">Hesab məlumatlarım</span>
          <span className="sp-mob-item-arrow">›</span>
        </div>
        <div {...pressable} className="sp-mob-item" onClick={() => openSub("account-type")}>
          <div className="sp-mob-item-icon"><IconHesabTipi /></div>
          <span className="sp-mob-item-text">Hesab tipi</span>
          <span className="sp-mob-item-arrow">›</span>
        </div>
        <div {...pressable} className="sp-mob-item" onClick={() => openSub("activity")}>
          <div className="sp-mob-item-icon"><IconFealiyyetler /></div>
          <span className="sp-mob-item-text">Fəaliyyətlər</span>
          <span className="sp-mob-item-arrow">›</span>
        </div>
        <div {...pressable} className="sp-mob-item" onClick={() => openSub("blocked")}>
          <div className="sp-mob-item-icon"><IconBloklanmis /></div>
          <span className="sp-mob-item-text">Bloklanmış</span>
          <span className="sp-mob-item-arrow">›</span>
        </div>
        <div className="sp-mob-divider"></div>
        <div {...pressable} className="sp-mob-item" onClick={() => openSub("language")}>
          <div className="sp-mob-item-icon"><IconDil /></div>
          <span className="sp-mob-item-text">Dil</span>
          <span className="sp-mob-item-badge">{langLabel}</span>
          <span className="sp-mob-item-arrow">›</span>
        </div>
        <div {...pressable} className="sp-mob-item" onClick={() => openSub("appearance")}>
          <div className="sp-mob-item-icon"><IconGorunus /></div>
          <span className="sp-mob-item-text">Görünüş</span>
          <span className="sp-mob-item-arrow">›</span>
        </div>
        <div className="sp-mob-divider"></div>
        <div {...pressable} className="sp-mob-item" onClick={() => openSub("privacy")}>
          <div className="sp-mob-item-icon"><IconMexfilikSiyaseti /></div>
          <span className="sp-mob-item-text">Məxfilik siyasəti</span>
          <IconSpMobItemArrow />
        </div>
        <div {...pressable} className="sp-mob-item" onClick={() => openSub("terms")}>
          <div className="sp-mob-item-icon"><IconIstifadeSertleri /></div>
          <span className="sp-mob-item-text">İstifadə şərtləri</span>
          <IconSpMobItemArrow />
        </div>
        <div {...pressable} className="sp-mob-item" onClick={() => openSub("about")}>
          <div className="sp-mob-item-icon"><IconLightbulb /></div>
          <span className="sp-mob-item-text">Haqqında</span>
          <span className="sp-mob-item-arrow">›</span>
        </div>
        <div {...pressable} className="sp-mob-item" onClick={() => openSub("support")}>
          <div className="sp-mob-item-icon"><IconDestek /></div>
          <span className="sp-mob-item-text">Dəstək</span>
          <span className="sp-mob-item-arrow">›</span>
        </div>
        <div className="sp-mob-divider"></div>
        <div {...pressable} className="sp-mob-item sp-logout" onClick={logout}>
          <div className="sp-mob-item-icon"><IconCixisEt /></div>
          <span className="sp-mob-item-text">Çıxış et</span>
        </div>
        <div className="sp-mob-version">Versiya 2.4.0 (Build 42)</div>
      </div>
    </div>

    {/* ── DESKTOP GÖRÜNÜŞ ── */}
    <div className="sp-desktop">
      {/* Left sidebar */}
      <div className="sp-desk-sidebar">
        <div className="sp-desk-sidebar-head">
          <div className="sp-desk-sidebar-avatar">O</div>
          <div className="sp-desk-sidebar-name">Orxan Məmmədov</div>
          <div className="sp-desk-sidebar-sub">Parametrləri idarə et</div>
        </div>
        <div {...pressable} className={navCls("account")} data-section="account" onClick={() => switchSection("account")}>
          <IconHesabMelumatlarim2 />
          Hesab məlumatlarım
        </div>
        <div {...pressable} className={navCls("account-type")} data-section="account-type" onClick={() => switchSection("account-type")}>
          <IconHesabTipi2 />
          Hesab tipi
        </div>
        <div {...pressable} className={navCls("activity")} data-section="activity" onClick={() => switchSection("activity")}>
          <IconFealiyyetler2 />
          Fəaliyyətlər
        </div>
        <div {...pressable} className={navCls("blocked")} data-section="blocked" onClick={() => switchSection("blocked")}>
          <IconBloklanmis2 />
          Bloklanmış
        </div>
        <div className="sp-desk-nav-divider"></div>
        <div {...pressable} className={navCls("language")} data-section="language" onClick={() => switchSection("language")}>
          <IconDil2 />
          Dil
        </div>
        <div {...pressable} className={navCls("appearance")} data-section="appearance" onClick={() => switchSection("appearance")}>
          <IconGorunus2 />
          Görünüş
        </div>
        <div className="sp-desk-nav-divider"></div>
        <div {...pressable} className={navCls("privacy")} data-section="privacy" onClick={() => switchSection("privacy")}>
          <IconMexfilikSiyaseti2 />
          Məxfilik siyasəti
        </div>
        <div {...pressable} className={navCls("terms")} data-section="terms" onClick={() => switchSection("terms")}>
          <IconIstifadeSertleri2 />
          İstifadə şərtləri
        </div>
        <div {...pressable} className={navCls("about")} data-section="about" onClick={() => switchSection("about")}>
          <IconHaqqinda />
          Haqqında
        </div>
        <div {...pressable} className={navCls("support")} data-section="support" onClick={() => switchSection("support")}>
          <IconDestek2 />
          Dəstək
        </div>
        <div className="sp-desk-nav-divider"></div>
        <div {...pressable} className="sp-desk-nav-item sp-desk-logout" onClick={logout}>
          <IconCixisEt2 />
          Çıxış et
        </div>
      </div>

      {/* Right content pane */}
      <div className="sp-desk-content">
        <div className="sp-desk-close-row">
          <button className="sp-desk-close-btn" onClick={close} title="Bağla">
            <IconHesabMelumatlarim3 />
          </button>
        </div>
        <div className="sp-desk-section-title" id="sp-desk-dynamic-title">{meta.title}</div>
        <div className="sp-desk-section-sub" id="sp-desk-dynamic-sub">{meta.sub}</div>

        {/* ── PANE: Hesab məlumatlarım ── */}
        <div className={paneCls("account")} data-section="account" id="sp-pane-account">
        <div className="sp-bento">
          {/* Profile card (wide) */}
          <div className="sp-bento-card sp-bento-wide">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.2rem" }}>
              <div>
                <div className="sp-bento-card-label">Şəxsi Profil</div>
                <div className="sp-bento-card-title">Digər istifadəçilərin sizi görməsi</div>
              </div>
              <button className="sp-bento-edit-btn" onClick={startEdit}>Redaktə et</button>
            </div>
            <div id="sp-account-view" style={editing ? { display: "none" } : undefined}>
            <div className="sp-profile-row">
              <span className="sp-profile-row-label">Tam ad</span>
              <span className="sp-profile-row-val" data-profile-name="">{profile.name}</span>
            </div>
            <div className="sp-profile-row">
              <span className="sp-profile-row-label">Email</span>
              <span className="sp-profile-row-val" data-profile-email="">{profile.email}</span>
            </div>
            <div className="sp-profile-row">
              <span className="sp-profile-row-label">Telefon</span>
              <span className="sp-profile-row-val" data-profile-phone="">{profile.phone}</span>
            </div>
            <div className="sp-profile-row">
              <span className="sp-profile-row-label">Yer</span>
              <span className="sp-profile-row-val" data-profile-location="">📍 {profile.location}</span>
            </div>
            </div>
            <div id="sp-account-edit" className="sp-account-edit-form" style={{ display: editing ? "block" : "none" }}>
              <div className="l-field"><label className="l-label">Ad Soyad</label><input className="l-input" id="sp-profile-name-input" type="text" {...field("name")} readOnly={Boolean(user?.store)} title={user?.store ? "Mağaza adı (marka) dəyişdirilmir" : undefined} /></div>
              <div className="l-field"><label className="l-label">E-poçt</label><input className="l-input" id="sp-profile-email-input" type="email" {...field("email")} readOnly={Boolean(user)} title={user ? "E-poçt dəyişdirilə bilməz" : undefined} /></div>
              <div className="l-field"><label className="l-label">Telefon</label><input className="l-input" id="sp-profile-phone-input" type="tel" {...field("phone")} /></div>
              <div className="l-field"><label className="l-label">Yer</label><input className="l-input" id="sp-profile-location-input" type="text" {...field("location")} /></div>
              <div className="l-field"><label className="l-label">Bio</label><textarea className="l-textarea" id="sp-profile-bio-input" rows={3} {...field("bio")} /></div>
              <div style={{ display: "flex", gap: ".5rem", marginTop: ".5rem" }}>
                <button className="sp-bento-edit-btn" onClick={saveProfile}>Yadda saxla</button>
                <button className="sp-bento-edit-btn" style={{ background: "transparent", color: "var(--on-surface)", border: "1.5px solid var(--outline-var)" }} onClick={() => setEditing(false)}>Ləğv et</button>
              </div>
            </div>
          </div>

          {/* Security card */}
          <div className="sp-bento-card" style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem" }}>
            <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "var(--primary-container)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: ".8rem" }}>
              <IconTehlukesizlik />
            </div>
            <div className="sp-bento-card-title" style={{ marginBottom: ".35rem" }}>Təhlükəsizlik</div>
            <div className="sp-bento-card-val" style={{ fontSize: ".82rem", lineHeight: "1.5", marginBottom: "1rem" }}>Hesabınız qorunur.<br />Son daxil olma: 2 saat əvvəl.</div>
            <button className="sp-bento-edit-btn" style={{ background: "transparent", color: "var(--on-surface)", border: "1.5px solid var(--outline-var)", width: "100%" }} onClick={() => toast("Təhlükəsizlik yoxlaması")}>Yoxla</button>
          </div>

          {/* Appearance card */}
          <div className="sp-bento-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div className="sp-bento-card-label">Görünüş</div>
              <div className="sp-bento-card-title" style={{ marginBottom: ".25rem" }}>Tema</div>
              <div className="sp-bento-card-val">Qaranlıq rejimi idarə edin.</div>
            </div>
            <div style={{ display: "flex", gap: ".5rem", marginTop: "1rem" }}>
              <button style={{ flex: "1", padding: ".5rem", borderRadius: "8px", border: "1.5px solid var(--outline-var)", fontSize: ".78rem", fontWeight: "600", fontFamily: "'Roboto',sans-serif", cursor: "pointer", background: "var(--surface)", color: "var(--on-surface)", transition: "all .15s" }} onClick={() => setTheme("light")}>☀️ Açıq</button>
              <button style={{ flex: "1", padding: ".5rem", borderRadius: "8px", border: "1.5px solid var(--outline-var)", fontSize: ".78rem", fontWeight: "600", fontFamily: "'Roboto',sans-serif", cursor: "pointer", background: "var(--surface)", color: "var(--on-surface)", transition: "all .15s" }} onClick={() => setTheme("dark")}>🌙 Tünd</button>
              <button style={{ flex: "1", padding: ".5rem", borderRadius: "8px", border: "1.5px solid var(--outline-var)", fontSize: ".78rem", fontWeight: "600", fontFamily: "'Roboto',sans-serif", cursor: "pointer", background: "var(--surface)", color: "var(--on-surface)", transition: "all .15s" }} onClick={() => setTheme("auto")}>🔁 Auto</button>
            </div>
          </div>
        </div>

        {/* Additional settings list */}
        <div className="sp-desk-extra-list">
          <div className="sp-desk-extra-title">Əlavə tənzimləmələr</div>
          <div style={{ background: "var(--surface-card)", border: "1px solid var(--outline-var)", borderRadius: "14px", overflow: "hidden" }}>
            <div {...pressable} className="sp-desk-extra-item" onClick={() => switchSection("language")}>
              <div className="sp-desk-extra-icon"><IconInterfeysDili /></div>
              <div style={{ flex: "1" }}><div className="sp-desk-extra-text">İnterfeys dili</div><div className="sp-desk-extra-sub">Hazırda: {lang === "az" ? "Azərbaycan dili" : "Русский язык"}</div></div>
              <IconSpDeskExtraArrow />
            </div>
            <div style={{ height: "1px", background: "var(--outline-var)", opacity: ".4", margin: "0 1rem" }}></div>
            <div {...pressable} className="sp-desk-extra-item" onClick={() => toast("Cihazlar tezliklə")}>
              <div className="sp-desk-extra-icon"><IconCihazlar /></div>
              <div style={{ flex: "1" }}><div className="sp-desk-extra-text">Cihazlar</div><div className="sp-desk-extra-sub">Aktiv olan sessiyaları idarə edin.</div></div>
              <IconSpDeskExtraArrow />
            </div>
            <div style={{ height: "1px", background: "var(--outline-var)", opacity: ".4", margin: "0 1rem" }}></div>
            <div {...pressable} className="sp-desk-extra-item" onClick={() => switchSection("blocked")}>
              <div className="sp-desk-extra-icon"><IconBloklanmisHesablar /></div>
              <div style={{ flex: "1" }}><div className="sp-desk-extra-text">Bloklanmış hesablar</div><div className="sp-desk-extra-sub">Bloklanmış istifadəçiləri görün.</div></div>
              <IconSpDeskExtraArrow />
            </div>
          </div>
        </div>

        {/* Store CTA card */}
        <div className="sp-cta-card">
          <div style={{ position: "relative", zIndex: "1" }}>
            <div className="sp-cta-card-title">Mağaza hesabı yarat</div>
            <div className="sp-cta-card-sub">Mağazanızı idarə etmək və məhsullarınızı satmaq üçün mağaza hesabı yaradın.</div>
            <button className="sp-cta-card-btn" onClick={openStore}>İndi yarat</button>
          </div>
        </div>
        </div>{/* /sp-pane-account */}

        {/* ── PANE: Hesab tipi ── */}
        <div className={paneCls("account-type")} data-section="account-type" id="sp-pane-account-type">
          <div className="sp-desk-pane-card">
            <div className="sp-bento-card-label">Cari status</div>
            <div className="sp-bento-card-title" style={{ marginBottom: ".5rem" }}>Alıcı hesabı</div>
            <p style={{ color: "var(--on-surface-var)", fontSize: ".88rem", lineHeight: "1.6", marginBottom: "1.2rem" }}>Alıcı hesabı ilə məhsulları sifariş edə, sənətkarlarla mesajlaşa və sevimlilərə əlavə edə bilərsiniz.</p>
            <button className="sp-bento-edit-btn" style={{ width: "100%" }} onClick={openStore}>Satıcı hesabına keç — Mağaza yarat</button>
          </div>
          <div className="sp-desk-pane-card">
            <div className="sp-bento-card-label">Satıcı hesabı üstünlükləri</div>
            <ul style={{ color: "var(--on-surface-var)", fontSize: ".88rem", lineHeight: "1.8", paddingLeft: "1.1rem" }}>
              <li>Məhsul və video paylaşın</li>
              <li>Mağaza səhifəsi yaradın</li>
              <li>Sifarişləri idarə edin</li>
              <li>Statistika və analitika</li>
            </ul>
          </div>
        </div>

        {/* ── PANE: Fəaliyyətlər ── */}
        <div className={paneCls("activity")} data-section="activity" id="sp-pane-activity">
          <div className="sp-desk-pane-card">
            <div id="sp-activity-list">
              {SETTINGS_ACTIVITIES.length === 0 ? (
                <div className="sp-empty-state"><div className="sp-empty-state-icon">📋</div>Son fəaliyyət yoxdur.</div>
              ) : (
                SETTINGS_ACTIVITIES.map((a) => (
                  <div className="sp-activity-item" key={a.text}>
                    <div className="sp-activity-icon">{a.icon}</div>
                    <div><div className="sp-activity-text">{a.text}</div><div className="sp-activity-time">{a.time}</div></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── PANE: Bloklanmış ── */}
        <div className={paneCls("blocked")} data-section="blocked" id="sp-pane-blocked">
          <div className="sp-desk-pane-card">
            <div id="sp-blocked-list">
              {blocked.length === 0 ? (
                <div className="sp-empty-state"><div className="sp-empty-state-icon">🚫</div>Bloklanmış istifadəçi yoxdur.</div>
              ) : (
                blocked.map((u) => (
                  <div className="sp-blocked-item" key={u.id} data-blocked-id={u.id}>
                    <div className="sp-blocked-avatar">👤</div>
                    <div><div className="sp-blocked-name">{u.name}</div><div className="sp-blocked-reason">{u.reason}</div></div>
                    <button className="sp-unblock-btn" onClick={() => { setBlocked((list) => list.filter((x) => x.id !== u.id)); toast("Blok açıldı ✅"); }}>Bloku aç</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── PANE: Dil ── */}
        <div className={paneCls("language")} data-section="language" id="sp-pane-language">
          <div className="sp-desk-pane-card">
            <div {...pressable} className={`sp-lang-opt${lang === "az" ? " selected" : ""}`} data-lang="az" onClick={() => setLang("az")}>
              <span className="sp-lang-opt-text">🇦🇿 Azərbaycan</span><span className="sp-lang-check">✓</span>
            </div>
            <div {...pressable} className={`sp-lang-opt${lang === "ru" ? " selected" : ""}`} data-lang="ru" onClick={() => setLang("ru")}>
              <span className="sp-lang-opt-text">🇷🇺 Русский</span><span className="sp-lang-check">✓</span>
            </div>
          </div>
        </div>

        {/* ── PANE: Görünüş ── */}
        <div className={paneCls("appearance")} data-section="appearance" id="sp-pane-appearance">
          <div className="sp-desk-pane-card">
            <div {...pressable} className={`sp-theme-opt${theme === "auto" ? " selected" : ""}`} data-theme="auto" onClick={() => setTheme("auto")}>
              <span className="sp-theme-opt-text">🌗 Avtomatik (sistem)</span><span className="sp-theme-check">✓</span>
            </div>
            <div {...pressable} className={`sp-theme-opt${theme === "light" ? " selected" : ""}`} data-theme="light" onClick={() => setTheme("light")}>
              <span className="sp-theme-opt-text">☀️ Açıq rejim</span><span className="sp-theme-check">✓</span>
            </div>
            <div {...pressable} className={`sp-theme-opt${theme === "dark" ? " selected" : ""}`} data-theme="dark" onClick={() => setTheme("dark")}>
              <span className="sp-theme-opt-text">🌙 Tünd rejim</span><span className="sp-theme-check">✓</span>
            </div>
          </div>
        </div>

        {/* ── PANE: Məxfilik ── */}
        <div className={paneCls("privacy")} data-section="privacy" id="sp-pane-privacy">
          <div className="sp-desk-pane-card">
            <p style={{ color: "var(--on-surface-var)", lineHeight: "1.75", fontSize: ".9rem" }}>Şəxsi məlumatlarınız yalnız platforma xidmətlərinin göstərilməsi məqsədilə istifadə olunur. Üçüncü şəxslərə ötürülmür.</p>
            <p style={{ color: "var(--on-surface-var)", lineHeight: "1.75", fontSize: ".9rem", marginTop: "1rem" }}>Topladığımız məlumatlar: ad, e-poçt, telefon, məkan və profil şəkli. Ödəniş məlumatları şifrələnmiş ödəniş provayderi vasitəsilə emal olunur.</p>
            <p style={{ color: "var(--on-surface-var)", lineHeight: "1.75", fontSize: ".9rem", marginTop: "1rem" }}>Hesabınızı silmək üçün <a href="#" onClick={(e) => { e.preventDefault(); switchSection("support"); }} style={{ color: "var(--primary)" }}>dəstək</a> ilə əlaqə saxlayın.</p>
          </div>
        </div>

        {/* ── PANE: İstifadə şərtləri ── */}
        <div className={paneCls("terms")} data-section="terms" id="sp-pane-terms">
          <div className="sp-desk-pane-card">
            <p style={{ color: "var(--on-surface-var)", lineHeight: "1.75", fontSize: ".9rem" }}>Platforma qaydaları: Yalnız əl işi məhsullar paylaşıla bilər. Saxtakarlıq aşkar olunarsa hesab bloklanır.</p>
            <p style={{ color: "var(--on-surface-var)", lineHeight: "1.75", fontSize: ".9rem", marginTop: "1rem" }}>Bütün əməliyyatlar platformanın ödəniş sistemi üzərindən aparılır. Platforma xaricində ödəniş təklif etmək qadağandır.</p>
            <p style={{ color: "var(--on-surface-var)", lineHeight: "1.75", fontSize: ".9rem", marginTop: "1rem" }}>Məzmun paylaşarkən müəllif hüquqlarına və Azərbaycan Respublikasının qanunlarına riayət etməlisiniz.</p>
          </div>
        </div>

        {/* ── PANE: Haqqında ── */}
        <div className={paneCls("about")} data-section="about" id="sp-pane-about">
          <div className="sp-desk-pane-card" style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: "700", color: "var(--primary)", marginBottom: ".5rem" }}>hobbi</div>
            <p style={{ color: "var(--on-surface-var)", fontSize: ".9rem", lineHeight: "1.7" }}>Azərbaycanlı əl işi sənətkarlarını alıcılarla birləşdirən platforma.</p>
            <p style={{ color: "var(--outline)", fontSize: ".82rem", marginTop: "1rem" }}>Versiya 2.4.0 (Build 42)<br />© 2025 Hobbi. Bütün hüquqlar qorunur.</p>
          </div>
        </div>

        {/* ── PANE: Dəstək ── */}
        <div className={paneCls("support")} data-section="support" id="sp-pane-support">
          <div className="sp-desk-pane-card sp-support-form">
            <div className="l-field"><label className="l-label">Mövzu</label>
              <select className="l-select" id="sp-support-subject">
                <option>Hesab problemi</option>
                <option>Sifariş problemi</option>
                <option>Texniki problem</option>
                <option>Digər</option>
              </select>
            </div>
            <div className="l-field"><label className="l-label">Mesajınız</label>
              <textarea className="l-textarea" id="sp-support-msg" rows={5} placeholder="Probleminizi ətraflı yazın..." value={supportMsg} onChange={(e) => setSupportMsg(e.target.value)} />
            </div>
            <button className="btn-publish" style={{ width: "100%" }} onClick={submitSupport}>Göndər</button>
          </div>
        </div>

      </div>
    </div>

    </div>

    {/* SUB PANELS */}
    <div className={subCls("language")} id="sub-language">
      <div className="sub-panel-head">
        <button className="settings-back-btn" onClick={closeSub}><IconDil3 /></button>
        <span className="sub-panel-title">Dil</span>
      </div>
      <div className="sub-panel-body">
        <div {...pressable} className={`lang-option${lang === "az" ? " selected" : ""}`} id="lang-az" onClick={() => setLang("az")}>
          <span className="lang-option-text">🇦🇿 Azərbaycan</span><span className="lang-check">✓</span>
        </div>
        <div {...pressable} className={`lang-option${lang === "ru" ? " selected" : ""}`} id="lang-ru" onClick={() => setLang("ru")}>
          <span className="lang-option-text">🇷🇺 Русский</span><span className="lang-check">✓</span>
        </div>
      </div>
    </div>
    <div className={subCls("appearance")} id="sub-appearance">
      <div className="sub-panel-head">
        <button className="settings-back-btn" onClick={closeSub}><IconGorunus3 /></button>
        <span className="sub-panel-title">Görünüş</span>
      </div>
      <div className="sub-panel-body">
        <div {...pressable} className={`theme-option${theme === "auto" ? " selected" : ""}`} id="theme-auto" onClick={() => setTheme("auto")}>
          <span className="theme-option-text">🌗 Avtomatik (sistem)</span><span className="theme-check">✓</span>
        </div>
        <div {...pressable} className={`theme-option${theme === "light" ? " selected" : ""}`} id="theme-light" onClick={() => setTheme("light")}>
          <span className="theme-option-text">☀️ Ağ ekran (Açıq)</span><span className="theme-check">✓</span>
        </div>
        <div {...pressable} className={`theme-option${theme === "dark" ? " selected" : ""}`} id="theme-dark" onClick={() => setTheme("dark")}>
          <span className="theme-option-text">🌙 Qara ekran (Tünd)</span><span className="theme-check">✓</span>
        </div>
      </div>
    </div>
    <div className={subCls("account")} id="sub-account">
      <div className="sub-panel-head">
        <button className="settings-back-btn" onClick={closeSub}><IconHesabMelumatlarim4 /></button>
        <span className="sub-panel-title">Hesab məlumatlarım</span>
      </div>
      <div className="sub-panel-body">
        <div className="l-field"><label className="l-label">Ad Soyad</label><input className="l-input" defaultValue="Orxan Məmmədov" /></div>
        <div className="l-field"><label className="l-label">E-poçt</label><input className="l-input" type="email" defaultValue="orxan@example.com" /></div>
        <div className="l-field"><label className="l-label">Telefon</label><input className="l-input" type="tel" defaultValue="+994 50 xxx xx xx" /></div>
        <div className="l-field"><label className="l-label">Bio</label><textarea className="l-textarea">Keramika həvəskarı. Hər bir əsər bir hekayə danışır. ✨</textarea></div>
        <button className="btn-publish" style={{ width: "100%", marginTop: ".5rem" }} onClick={() => toast("Məlumatlar yadda saxlandı ✅")}>Yadda saxla</button>
      </div>
    </div>
    <div className={subCls("account-type")} id="sub-account-type">
      <div className="sub-panel-head">
        <button className="settings-back-btn" onClick={closeSub}><IconSettingsBack /></button>
        <span className="sub-panel-title">Hesab tipi</span>
      </div>
      <div className="sub-panel-body">
        <p style={{ color: "#5D5D5D", fontSize: ".92rem", marginBottom: "1rem" }}>Cari hesab tipiniz: <b>Alıcı</b></p>
        <button className="btn-publish" style={{ width: "100%" }} onClick={() => { closeSub(); openStore(); }}>Satıcı hesabına keç (Mağaza Yarat)</button>
      </div>
    </div>
    <div className={subCls("activity")} id="sub-activity">
      <div className="sub-panel-head">
        <button className="settings-back-btn" onClick={closeSub}><IconSettingsBack /></button>
        <span className="sub-panel-title">Fəaliyyətlər</span>
      </div>
      <div className="sub-panel-body"><p style={{ color: "#aaa", textAlign: "center", marginTop: "2rem" }}>Son fəaliyyətlər burada göstəriləcək.</p></div>
    </div>
    <div className={subCls("blocked")} id="sub-blocked">
      <div className="sub-panel-head">
        <button className="settings-back-btn" onClick={closeSub}><IconSettingsBack /></button>
        <span className="sub-panel-title">Bloklanmış</span>
      </div>
      <div className="sub-panel-body"><p style={{ color: "#aaa", textAlign: "center", marginTop: "2rem" }}>Bloklanmış istifadəçi yoxdur.</p></div>
    </div>
    <div className={subCls("privacy")} id="sub-privacy">
      <div className="sub-panel-head">
        <button className="settings-back-btn" onClick={closeSub}><IconSettingsBack /></button>
        <span className="sub-panel-title">Məxfilik siyasəti</span>
      </div>
      <div className="sub-panel-body"><p style={{ color: "#5D5D5D", lineHeight: "1.7", fontSize: ".9rem" }}>Şəxsi məlumatlarınız yalnız platforma xidmətlərinin göstərilməsi məqsədilə istifadə olunur. Üçüncü şəxslərə ötürülmür. Hesabınızı silmək üçün dəstək ilə əlaqə saxlayın.</p></div>
    </div>
    <div className={subCls("terms")} id="sub-terms">
      <div className="sub-panel-head">
        <button className="settings-back-btn" onClick={closeSub}><IconSettingsBack /></button>
        <span className="sub-panel-title">İstifadə şərtləri</span>
      </div>
      <div className="sub-panel-body"><p style={{ color: "#5D5D5D", lineHeight: "1.7", fontSize: ".9rem" }}>Platforma qaydaları: Yalnız əl işi məhsullar paylaşıla bilər. Saxtakarlıq aşkar olunarsa hesab bloklanır. Bütün əməliyyatlar platformanın ödəniş sistemi üzərindən aparılır.</p></div>
    </div>
    <div className={subCls("about")} id="sub-about">
      <div className="sub-panel-head">
        <button className="settings-back-btn" onClick={closeSub}><IconSettingsBack /></button>
        <span className="sub-panel-title">Haqqında</span>
      </div>
      <div className="sub-panel-body">
        <p style={{ color: "#5D5D5D", fontSize: ".9rem", lineHeight: "1.7" }}>Hobbi — Azərbaycanlı əl işi sənətkarlarını alıcılarla birləşdirən platforma.<br /><br />Versiya: 1.0.0<br />© 2025 Hobbi. Bütün hüquqlar qorunur.</p>
      </div>
    </div>

    <div className={subCls("support")} id="sub-support">
      <div className="sub-panel-head">
        <button className="settings-back-btn" onClick={closeSub}><IconSettingsBack /></button>
        <span className="sub-panel-title">Dəstək</span>
      </div>
      <div className="sub-panel-body">
        <div className="l-field"><label className="l-label">Probleminizi yazın</label><textarea className="l-textarea" placeholder="Mesajınızı buraya yazın..."></textarea></div>
        <button className="btn-publish" style={{ width: "100%" }} onClick={() => toast("Müraciətiniz göndərildi ✅")}>Göndər</button>
      </div>
    </div>

    </>

  );
}
