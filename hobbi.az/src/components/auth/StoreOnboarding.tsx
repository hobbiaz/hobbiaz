"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, uploadImage } from "@/lib/api-client";
import { useUI } from "@/providers/UIProvider";
import { OtpInput, type OtpInputHandle } from "./OtpInput";
import { Confetti } from "./Confetti";
import { isAzPhone, isEmail, passwordProblem, passwordStrength } from "@/lib/password";
import { IconArrowRight, IconAvatarBadge, IconAvatarOverlay, IconAvatarPlaceholder, IconBack, IconCheckCircle, IconCheckFill, IconClose, IconCloseSmall, IconEye, IconEyeOff, IconGallery, IconInfo, IconLightbulb, IconLogin, IconRefresh, IconRegionBaki, IconRegionGence, IconRegionLenkeran, IconRegionMingecevir, IconRegionQebele, IconRegionSearch, IconRegionSeki, IconRegionSumqayit, IconRegionXirdalan, IconRocket, IconStorePlus, IconSuccess, IconTakePhoto } from "@/components/icons";
import { pressable } from "@/lib/a11y";

type StepId = "1" | "2l" | "2r" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "r1" | "r2";
const REGISTER_STEPS: StepId[] = ["2r", "3", "4", "5", "6", "7", "8", "9"];
const NEXT: Partial<Record<StepId, StepId>> = { "2r": "3", "3": "4", "4": "5", "5": "6", "6": "7", "7": "8", "8": "9" };
// After the account is created (step 6) there is no way back into the sign-up steps.
const PREV: Partial<Record<StepId, StepId>> = { "2l": "1", "2r": "1", "3": "2r", "4": "3", "5": "4", "6": "5", r1: "2l", r2: "r1" };
const CLOSE_MS = 420;

const CATEGORIES = [
  ["Keramika", "🏺"], ["Rəsm", "🎨"], ["Zərgərlik", "💍"], ["Toxuculuq", "🧶"],
  ["Ağac işi", "🪵"], ["Musiqi", "🎸"], ["Tikiş", "🧵"], ["Digər", "✨"],
] as const;
/** Wizard card → store category slug (same slugs as the feed filters). */
const CATEGORY_SLUG: Record<string, string> = {
  Keramika: "keramika", Rəsm: "resm", Zərgərlik: "zergerllik", Toxuculuq: "toxuculuq",
  "Ağac işi": "agac", Musiqi: "musiqi", Tikiş: "toxuculuq", Digər: "digər",
};

const REGIONS: { name: string; icon: React.ReactNode }[] = [
  { name: "Bakı", icon: <IconRegionBaki /> },
  { name: "Sumqayıt", icon: <IconRegionSumqayit /> },
  { name: "Gəncə", icon: <IconRegionGence /> },
  { name: "Lənkəran", icon: <IconRegionLenkeran /> },
  { name: "Şəki", icon: <IconRegionSeki /> },
  { name: "Qəbələ", icon: <IconRegionQebele /> },
  { name: "Mingəçevir", icon: <IconRegionMingecevir /> },
  { name: "Xırdalan", icon: <IconRegionXirdalan /> },
];

/** "Mağaza Aç" — multi-step store onboarding / login sheet. */
export function StoreOnboarding() {
  const { modal, closeModal, toast, authMode, backend, refreshUser } = useUI();
  const router = useRouter();
  const isOpen = modal === "auth";
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<"register" | "login">("register");
  const [step, setStep] = useState<StepId>("1");
  const [goingBack, setGoingBack] = useState(false);
  const [category, setCategory] = useState<string | null>(null);
  const [brand, setBrand] = useState("");
  const [contact, setContact] = useState<"phone" | "email">("phone");
  const [otpTarget, setOtpTarget] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [avatar, setAvatar] = useState<string | null>(null);
  const [region, setRegion] = useState("Bakı");
  const [regionQuery, setRegionQuery] = useState("");
  const [otpHelp, setOtpHelp] = useState(false);
  const [shaking, setShaking] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [brandStatus, setBrandStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPw, setResetPw] = useState("");
  const sheetRef = useRef<HTMLDivElement>(null);
  const otpRef = useRef<OtpInputHandle>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const loginId = useRef<HTMLInputElement>(null);
  const loginPw = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // open: mount with display:flex, then add .open two frames later so the sheet animates in
  useEffect(() => {
    if (isOpen) {
      setMode(authMode === "register" ? "register" : "login");
      setStep(authMode === "login" ? "2l" : authMode === "reset" ? "r1" : "1");
      setGoingBack(false); setCategory(null); setRegion("Bakı");
      setPassword(""); setConfirmPw(""); setVerificationToken(""); setBusy(false); setAvatar(null);
      setMounted(true);
      let r2 = 0;
      const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setVisible(true)); });
      return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }
    setVisible(false);
    setOtpHelp(false);
    const t = setTimeout(() => setMounted(false), CLOSE_MS);
    return () => clearTimeout(t);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Brand-name availability, checked against the server while typing.
  useEffect(() => {
    const name = brand.trim();
    if (name.length < 4 || backend !== "online") { setBrandStatus("idle"); return; }
    setBrandStatus("checking");
    const t = setTimeout(() => {
      api<{ available: boolean }>(`/api/stores/check?name=${encodeURIComponent(name)}`)
        .then((r) => setBrandStatus(r.available ? "ok" : "taken"))
        .catch(() => setBrandStatus("idle"));
    }, 350);
    return () => clearTimeout(t);
  }, [brand, backend]);

  // focus the first text input of each step
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      if (step === "5") { otpRef.current?.reset(); return; }
      sheetRef.current?.querySelector<HTMLInputElement>(`#auth-step-${step} input:not([type=checkbox]):not([type=file])`)?.focus();
    }, 80);
    return () => clearTimeout(t);
  }, [step, visible]);

  const go = (next: StepId, back = false) => { setGoingBack(back); setStep(next); };
  const close = closeModal;
  const shake = (id: string) => { setShaking(id); setTimeout(() => setShaking(null), 400); };
  const stepCls = (id: StepId) => `auth-step${step === id ? " active" : ""}${step === id && goingBack ? " anim-back" : ""}`;
  const shakeCls = (id: string) => (shaking === id ? " is-shaking" : "");

  const startRegister = () => { setMode("register"); setCategory(null); go("2r"); };
  const startLogin = () => { setMode("login"); go("2l"); };
  /** Blocks the step with a shake + message; returns false so `next` can bail out. */
  const reject = (id: string, message: string) => { shake(id); toast(message); return false; };
  const validStep = (): boolean => {
    switch (step) {
      case "3":
        if (!brandOk) return reject("auth-brand-name", "Marka adı ən azı 4 simvol olmalıdır");
        if (brandStatus === "taken") return reject("auth-brand-name", "Bu marka adı artıq tutulub");
        return true;
      case "4": {
        if (contact === "phone" && !isAzPhone(phoneRef.current?.value ?? ""))
          return reject("auth-phone", "Nömrəni düzgün daxil edin, məs: 50 123 45 67");
        return isEmail(emailRef.current?.value ?? "") || reject("auth-email", "E-mail ünvanı düzgün deyil");
      }
      case "5":
        return (otpRef.current?.value().length === 6) || reject("auth-otp", "6 rəqəmli kodu tam daxil edin");
      case "6": {
        const problem = passwordProblem(password);
        if (problem) return reject("auth-pw-new", problem);
        return confirmPw === password || reject("auth-pw-confirm", "Şifrələr eyni deyil");
      }
      default:
        return true;
    }
  };
  const phoneValue = () => {
    const v = phoneRef.current?.value.replace(/[\s-]/g, "").replace(/^0/, "") ?? "";
    return contact === "phone" && v ? `+994${v}` : undefined;
  };
  /** Runs a server step with a busy flag; shows the server's message on failure. */
  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try { await fn(); } catch (e) { toast(e instanceof Error ? e.message : "Xəta baş verdi"); } finally { setBusy(false); }
  };
  /** Sends the code; true when a dev code was shown (local development without e-mail). */
  const sendCode = (to: string, purpose: "SIGNUP" | "RESET") =>
    api<{ devCode?: string }>("/api/auth/otp", { method: "POST", body: { email: to, purpose } }).then((r) => {
      if (r.devCode) toast(`Test rejimi: kod ${r.devCode}`);
      return Boolean(r.devCode);
    });

  const next = () => {
    const target = NEXT[step];
    if (!target || !validStep()) return;
    if (backend === "offline" && ["4", "5", "6"].includes(step)) { toast("Demo rejim: qeydiyyat üçün server qoşulmalıdır"); return; }
    switch (step) {
      case "4":
        return void run(async () => {
          const to = (emailRef.current?.value ?? "").trim().toLowerCase();
          await sendCode(to, "SIGNUP");
          setEmail(to);
          setOtpTarget(to);
          go(target);
        });
      case "5":
        return void run(async () => {
          const r = await api<{ token: string }>("/api/auth/otp/verify", { method: "POST", body: { email, purpose: "SIGNUP", code: otpRef.current?.value() } });
          setVerificationToken(r.token);
          go(target);
        });
      case "6":
        return void run(async () => {
          await api("/api/auth/register", {
            method: "POST",
            body: { email, password, verificationToken, store: { name: brand.trim(), categorySlug: CATEGORY_SLUG[category ?? "Digər"], region, phone: phoneValue() } },
          });
          await refreshUser();
          go(target);
        });
      case "8":
        return void run(async () => {
          await api("/api/store", { method: "PATCH", body: { region } });
          await refreshUser();
          go(target);
        });
      default:
        go(target);
    }
  };
  const pickAvatar = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(String(ev.target?.result));
    reader.readAsDataURL(file);
    void run(async () => {
      const { key } = await uploadImage(file);
      await api("/api/store", { method: "PATCH", body: { avatarKey: key } });
      toast("Profil şəkli yükləndi ✅");
    });
  };
  const prev = () => {
    const target = PREV[step];
    if (target) go(target, true);
    else close();
  };
  const submitLogin = () => {
    const identity = loginId.current?.value.trim() ?? "";
    const pw = loginPw.current?.value ?? "";
    if (!identity) return reject("login-identity", "E-mail və ya mağaza adını daxil edin");
    if (!pw) return reject("login-password", "Şifrəni daxil edin");
    if (backend === "offline") { toast("Demo rejim: giriş üçün server qoşulmalıdır"); return; }
    void run(async () => {
      await api("/api/auth/login", { method: "POST", body: { identity, password: pw } });
      const me = await refreshUser();
      toast(`Xoş gəldiniz, ${me?.store?.name ?? me?.name ?? ""} 👋`);
      close();
    });
  };
  const resendOtp = () => {
    otpRef.current?.reset();
    void run(async () => { if (!(await sendCode(email, "SIGNUP"))) toast("Kod yenidən göndərildi 📩"); });
  };
  const startReset = () => { setResetEmail(loginId.current?.value.includes("@") ? loginId.current.value.trim() : ""); go("r1"); };
  const sendResetCode = () => {
    if (!isEmail(resetEmail)) return reject("reset-email", "E-mail ünvanı düzgün deyil");
    void run(async () => { await sendCode(resetEmail.trim().toLowerCase(), "RESET"); go("r2"); });
  };
  const submitReset = () => {
    if (!/^\d{6}$/.test(resetCode)) return reject("reset-code", "6 rəqəmli kodu daxil edin");
    const problem = passwordProblem(resetPw);
    if (problem) return reject("reset-pw", problem);
    void run(async () => {
      await api("/api/auth/password-reset", { method: "POST", body: { email: resetEmail.trim().toLowerCase(), code: resetCode, password: resetPw } });
      await refreshUser();
      toast("Şifrə yeniləndi, daxil oldunuz ✅");
      close();
    });
  };
  const finish = () => { close(); router.push("/profile"); };
  const pwType = (id: string) => (shown[id] ? "text" : "password");
  const togglePw = (id: string) => setShown((s) => ({ ...s, [id]: !s[id] }));
  const strength = passwordStrength(password);

  const registerIdx = REGISTER_STEPS.indexOf(step);
  const showProgress = mode === "register" && registerIdx !== -1;
  const progressPct = showProgress ? Math.round(((registerIdx + 1) / REGISTER_STEPS.length) * 100) : 0;
  const brandOk = brand.trim().length > 3;
  const brandHint = !brandOk ? "" : brandStatus === "checking" ? "Yoxlanılır…" : brandStatus === "taken" ? "Bu marka adı artıq tutulub." : "Bu marka adı istifadə edilə bilər.";
  const sheet = useCallback(() => sheetRef.current, []);
  const regions = REGIONS.filter((r) => r.name.toLowerCase().includes(regionQuery.toLowerCase()));

  if (!mounted) return null;

  return (
    <div id="auth-overlay" className={`auth-overlay${visible ? " open" : ""}`} style={{ display: "flex" }} role="dialog" aria-modal="true" aria-label="Mağaza qeydiyyatı">
      <div className="auth-backdrop" onClick={close}></div>

      <div className="auth-sheet" id="auth-sheet" ref={sheetRef}>

        {/* Drag handle (mobile only) */}
        <div className="auth-drag-handle"></div>

        {/* Progress bar (steps 2-9) */}
        <div className={`auth-progress-wrap${showProgress ? " visible" : ""}`} id="auth-progress-wrap">
          <div className="auth-progress-bar"><div className="auth-progress-fill" id="auth-progress-fill" style={{ width: `${progressPct}%` }}></div></div>
          <span className="auth-progress-label" id="auth-progress-label">{showProgress ? `${registerIdx + 1} / ${REGISTER_STEPS.length}` : ""}</span>
        </div>

        {/* Close + Back row */}
        <div className="auth-nav-row">
          <button className={`auth-back-btn${step !== "1" ? " visible" : ""}`} id="auth-back-btn" onClick={prev} aria-label="Geri">
            <IconBack />
          </button>
          <button className="auth-close-btn" onClick={close} aria-label="Bağla">
            <IconClose />
          </button>
        </div>

        {/* ── STEP CONTAINER ── */}
        <div className="auth-steps-wrap" id="auth-steps-wrap">

          {/* STEP 1: Auth Choice */}
          <div className={stepCls("1")} id="auth-step-1">
            <h2 className="auth-step-title">Mağaza Aç</h2>
            <p className="auth-step-sub">Mövcud mağaza hesabınıza daxil olun və ya yeni bir mağaza yaradın.</p>
            <div className="auth-choice-btns">
              <button className="auth-btn-gradient" onClick={startRegister}>
                <IconStorePlus />
                Yeni mağaza hesabı yarat
              </button>
              <button className="auth-btn-outline" onClick={startLogin}>
                <IconLogin />
                Mövcud mağaza hesabına giriş
              </button>
            </div>
            <div className="auth-step1-accent" aria-hidden="true">
              <div className="auth-accent-orb auth-accent-orb-1"></div>
              <div className="auth-accent-orb auth-accent-orb-2"></div>
            </div>
          </div>

          {/* STEP 2L: Login */}
          <div className={stepCls("2l")} id="auth-step-2l">
            <h2 className="auth-step-title">Xoş gəldiniz!</h2>
            <p className="auth-step-sub">Mağaza hesabınıza daxil olun.</p>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="login-identity">Mağaza adı və ya E-mail</label>
              <input ref={loginId} type="text" id="login-identity" className={`auth-input${shakeCls("login-identity")}`} placeholder="Mağaza adı və ya e-mail" autoComplete="username" />
            </div>
            <div className="auth-form-group">
              <div className="auth-label-row">
                <label className="auth-label" htmlFor="login-password">Şifrə</label>
                <button type="button" className="auth-link-sm" style={{ background: "none", border: 0, padding: 0, cursor: "pointer" }} onClick={startReset}>Şifrəni unutmusan?</button>
              </div>
              <div className="auth-input-icon-wrap">
                <input ref={loginPw} type={pwType("login-password")} id="login-password" className={`auth-input${shakeCls("login-password")}`} placeholder="Şifrənizi daxil edin" autoComplete="current-password" />
                <button className="auth-toggle-pw" type="button" onClick={() => togglePw("login-password")} aria-label="Şifrəni göstər">
                  {shown["login-password"] ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>
            <label className="auth-checkbox-row">
              <input type="checkbox" className="auth-checkbox-input" defaultChecked />
              <span className="auth-checkbox-custom"></span>
              <span className="auth-checkbox-text">Məni xatırla</span>
            </label>
            <button className="auth-btn-primary" onClick={submitLogin} disabled={busy}>{busy ? "Yoxlanılır…" : "Giriş et"}</button>
            <div className="auth-divider"><span>və ya</span></div>
            <button className="auth-btn-secondary" onClick={startRegister}>Yeni mağaza hesabı yarat</button>
          </div>

          {/* STEP 2R: Category */}
          <div className={stepCls("2r")} id="auth-step-2r">
            <h2 className="auth-step-title">Kateqoriya seçin</h2>
            <p className="auth-step-sub">Mağazanızın əsas fəaliyyət sahəsini seçin.</p>
            <div className="auth-cat-grid" id="auth-cat-grid">
              {CATEGORIES.map(([name, emoji]) => (
                <button key={name} className={`auth-cat-card${category === name ? " selected" : ""}`} data-cat={name} onClick={() => setCategory(name)}>
                  <span className="auth-cat-emoji">{emoji}</span><span className="auth-cat-label">{name}</span>
                </button>
              ))}
            </div>
            <button className={`auth-btn-primary${category ? "" : " auth-btn-disabled"}`} id="auth-cat-next" onClick={() => category && go("3")} disabled={!category}>İrəli</button>
          </div>

          {/* STEP 3: Brand Name */}
          <div className={stepCls("3")} id="auth-step-3">
            <h2 className="auth-step-title">Marka adı yarat</h2>
            <p className="auth-step-sub">Öz unikal marka adını yarat və ya digər platformalarda istifadə etdiyin adı daxil et.</p>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="auth-brand-name">Marka adı</label>
              <div className="auth-input-validate-wrap">
                <input type="text" id="auth-brand-name" className={`auth-input${shakeCls("auth-brand-name")}`} placeholder="Məs: AyselKeramika" maxLength={40} value={brand} onChange={(e) => setBrand(e.target.value)} />
                <span className={`auth-validate-icon${brandOk && brandStatus !== "taken" && brandStatus !== "checking" ? " show" : ""}`} id="auth-brand-check">
                  <IconCheckCircle />
                </span>
              </div>
              <p className={`auth-field-hint ${brandStatus === "taken" ? "" : "auth-hint-success"}`} style={brandStatus === "taken" ? { color: "#ba1a1a" } : undefined} id="auth-brand-hint">{brandHint}</p>
            </div>
            <div className="auth-tip-box">
              <IconLightbulb />
              <p>Yadda qalan və qısa adlar müştərilərin sizi daha asan tapmasına kömək edir.</p>
            </div>
            <button className="auth-btn-primary" onClick={next}>İrəli</button>
          </div>

          {/* STEP 4: Contact */}
          <div className={stepCls("4")} id="auth-step-4">
            <h2 className="auth-step-title">Əlaqə məlumatı</h2>
            <p className="auth-step-sub">Təsdiq kodu e-mail ünvanınıza göndəriləcək.{contact === "phone" ? " Telefon nömrəsi alıcılara əlaqə üçün göstəriləcək." : ""}</p>
            <div className="auth-contact-toggle">
              <button className={`auth-contact-tab${contact === "phone" ? " active" : ""}`} id="auth-tab-phone" onClick={() => setContact("phone")}>📱 Telefon</button>
              <button className={`auth-contact-tab${contact === "email" ? " active" : ""}`} id="auth-tab-email" onClick={() => setContact("email")}>✉️ E-mail</button>
            </div>
            <div id="auth-contact-phone-wrap" style={{ display: contact === "phone" ? "block" : "none" }}>
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="auth-phone">Telefon nömrəsi</label>
                <div className="auth-phone-input-wrap">
                  <span className="auth-phone-prefix">+994</span>
                  <input ref={phoneRef} type="tel" id="auth-phone" className={`auth-input auth-input-phone${shakeCls("auth-phone")}`} placeholder="50 XXX XX XX" maxLength={12} inputMode="tel" autoComplete="tel-national" />
                </div>
              </div>
            </div>
            <div id="auth-contact-email-wrap">
              <div className="auth-form-group">
                <label className="auth-label" htmlFor="auth-email">E-mail ünvanı</label>
                <input ref={emailRef} type="email" id="auth-email" className={`auth-input${shakeCls("auth-email")}`} placeholder="nümunə@mail.com" autoComplete="email" />
              </div>
            </div>
            <button className="auth-btn-primary" onClick={next} disabled={busy}>{busy ? "Göndərilir…" : "Kodu göndər"}</button>
          </div>

          {/* STEP 5: OTP */}
          <div className={stepCls("5")} id="auth-step-5">
            <h2 className="auth-step-title">Kodu daxil edin</h2>
            <p className="auth-step-sub" id="auth-otp-sub">{otpTarget ? `"${otpTarget}" ünvanına göndərilən 6 rəqəmli kodu daxil edin.` : "Hesabınıza göndərilən 6 rəqəmli kodu daxil edin."}</p>
            <div className={`auth-otp-wrap${shakeCls("auth-otp")}`}><OtpInput ref={otpRef} /></div>
            <div className="auth-otp-actions">
              <button className="auth-btn-primary" onClick={next} disabled={busy}>{busy ? "Yoxlanılır…" : <>İrəli <IconArrowRight /></>}</button>
              <button className="auth-btn-ghost" onClick={() => setOtpHelp(true)}>Kod almadım</button>
            </div>
            <div className="auth-otp-links">
              <button className="auth-link-btn" onClick={resendOtp}>
                <IconRefresh />
                Kodu yenidən göndər
              </button>
            </div>
          </div>

          {/* STEP 6: Password */}
          <div className={stepCls("6")} id="auth-step-6">
            <h2 className="auth-step-title">Şifrə təyin edin</h2>
            <p className="auth-step-sub">Ən azı 8 simvol, içində həm hərf, həm rəqəm olsun.</p>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="auth-pw-new">Şifrə</label>
              <div className="auth-input-icon-wrap">
                <input type={pwType("auth-pw-new")} id="auth-pw-new" className={`auth-input${shakeCls("auth-pw-new")}`} placeholder="Şifrənizi daxil edin" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button className="auth-toggle-pw" type="button" onClick={() => togglePw("auth-pw-new")} aria-label="Şifrəni göstər">
                  {shown["auth-pw-new"] ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              <div className="auth-pw-strength-wrap" id="auth-pw-strength-wrap">
                <div className="auth-pw-strength-bar"><div className="auth-pw-strength-fill" id="auth-pw-strength-fill" style={{ width: strength.width, background: strength.color }}></div></div>
                <span className="auth-pw-strength-label" id="auth-pw-strength-label" style={{ color: strength.color }}>{strength.label}</span>
              </div>
            </div>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="auth-pw-confirm">Şifrəni təkrar daxil edin</label>
              <div className="auth-input-icon-wrap">
                <input type={pwType("auth-pw-confirm")} id="auth-pw-confirm" className={`auth-input${shakeCls("auth-pw-confirm")}`} placeholder="Şifrəni təsdiqləyin" autoComplete="new-password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                <button className="auth-toggle-pw" type="button" onClick={() => togglePw("auth-pw-confirm")} aria-label="Şifrəni göstər">
                  {shown["auth-pw-confirm"] ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>
            <label className="auth-checkbox-row">
              <input type="checkbox" className="auth-checkbox-input" defaultChecked />
              <span className="auth-checkbox-custom"></span>
              <span className="auth-checkbox-text">Məni xatırla</span>
            </label>
            <button className="auth-btn-primary" onClick={next} disabled={busy}>{busy ? "Hesab yaradılır…" : "Hesabı yarat"}</button>
          </div>

          {/* STEP 7: Avatar */}
          <div className={stepCls("7")} id="auth-step-7">
            <h2 className="auth-step-title">Profil şəkli əlavə edin</h2>
            <p className="auth-step-sub">Alıcıların sizi rahat tanıması üçün mağazanıza şəkil əlavə edin.</p>
            <div className="auth-avatar-area">
              <div {...pressable} className="auth-avatar-circle" id="auth-avatar-circle" style={avatar ? { display: "none" } : undefined} onClick={() => avatarInput.current?.click()}>
                <IconAvatarPlaceholder />
                <div className="auth-avatar-overlay"><IconAvatarOverlay /></div>
                <div className="auth-avatar-badge"><IconAvatarBadge /></div>
              </div>
              {avatar && (
                <img id="auth-avatar-preview" className="auth-avatar-preview" alt="Profil şəkli" src={avatar} style={{ display: "block" }} />
              )}
            </div>
            <div className="auth-avatar-options">
              <label className="auth-avatar-option-btn" htmlFor="auth-file-input">
                <IconGallery />
                Qalereyadan seç
              </label>
              <label className="auth-avatar-option-btn" htmlFor="auth-camera-input">
                <IconTakePhoto />
                Şəkil çək
              </label>
            </div>
            <input
              ref={avatarInput}
              type="file"
              id="auth-file-input"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={(e) => { pickAvatar(e.target.files?.[0]); e.target.value = ""; }}
            />
            <input type="file" id="auth-camera-input" accept="image/jpeg,image/png,image/webp" capture="user" style={{ display: "none" }} onChange={(e) => { pickAvatar(e.target.files?.[0]); e.target.value = ""; }} />
            <button className="auth-btn-primary" onClick={() => (avatar ? next() : avatarInput.current?.click())} disabled={busy}>{busy ? "Yüklənir…" : avatar ? "İrəli" : "Şəkil yüklə"}</button>
            <button className="auth-btn-ghost" onClick={next}>Keç</button>
          </div>

          {/* STEP 8: Region */}
          <div className={stepCls("8")} id="auth-step-8">
            <h2 className="auth-step-title">Bölgənizi seçin</h2>
            <p className="auth-step-sub">Mağazanızın əsas yerləşmə yeri.</p>
            <div className="auth-region-search-wrap">
              <IconRegionSearch />
              <input type="text" id="auth-region-search" className="auth-region-search" placeholder="Bölgə axtarın..." value={regionQuery} onChange={(e) => setRegionQuery(e.target.value)} />
            </div>
            <div className="auth-region-list" id="auth-region-list">
              {regions.map((r) => {
                const active = r.name === region;
                return (
                  <button key={r.name} className={`auth-region-item${active ? " active" : ""}`} data-region={r.name} onClick={() => setRegion(r.name)}>
                    <div className={`auth-region-icon${active ? " active" : ""}`}>{r.icon}</div>
                    <span className="auth-region-label">{r.name}</span>
                    {active ? <div className="auth-region-check-fill" style={{ display: "flex" }}><IconCheckFill /></div> : <div className="auth-region-radio-ring" />}
                  </button>
                );
              })}
            </div>
            <div className="auth-info-box">
              <IconInfo />
              <p>Seçdiyiniz bölgə mağazanızın əsas yerləşmə yeri olacaq. Çatdırılma zonalarını sonradan tənzimləmək mümkündür.</p>
            </div>
            <button className="auth-btn-primary" onClick={next} disabled={busy}>{busy ? "Saxlanılır…" : "Davam et"}</button>
          </div>

          {/* STEP 9: Success */}
          <div className={stepCls("9")} id="auth-step-9">
            <div className="auth-success-inner">
              <Confetti active={step === "9" && visible} sizeFrom={sheet} />
              <div className="auth-success-icon">
                <IconSuccess />
              </div>
              <h2 className="auth-success-title" id="auth-success-title">Xoş gəldin, {brand.trim() || "mağaza"}</h2>
              <p className="auth-success-sub" id="auth-success-sub">Mağazan hazırdır. İlk məhsulunu əlavə et!</p>
              <div className="auth-success-stats">
                <div className="auth-success-stat"><span className="auth-success-stat-num">0</span><span className="auth-success-stat-lbl">Məhsul</span></div>
                <div className="auth-success-stat-divider"></div>
                <div className="auth-success-stat"><span className="auth-success-stat-num">0</span><span className="auth-success-stat-lbl">Sifariş</span></div>
                <div className="auth-success-stat-divider"></div>
                <div className="auth-success-stat"><span className="auth-success-stat-num" id="auth-success-region-stat">{region}</span><span className="auth-success-stat-lbl">Bölgə</span></div>
              </div>
              <button className="auth-btn-gradient auth-btn-start" onClick={finish}>
                <IconRocket />
                Başla
              </button>
            </div>
          </div>

          {/* RESET 1: e-mail */}
          <div className={stepCls("r1")} id="auth-step-r1">
            <h2 className="auth-step-title">Şifrəni bərpa et</h2>
            <p className="auth-step-sub">Hesabınızın e-mail ünvanını yazın, ora 6 rəqəmli kod göndərəcəyik.</p>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="reset-email">E-mail ünvanı</label>
              <input type="email" id="reset-email" className={`auth-input${shakeCls("reset-email")}`} placeholder="nümunə@mail.com" autoComplete="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
            </div>
            <button className="auth-btn-primary" onClick={sendResetCode} disabled={busy}>{busy ? "Göndərilir…" : "Kodu göndər"}</button>
          </div>

          {/* RESET 2: code + new password */}
          <div className={stepCls("r2")} id="auth-step-r2">
            <h2 className="auth-step-title">Yeni şifrə</h2>
            <p className="auth-step-sub">&quot;{resetEmail}&quot; ünvanına göndərilən kodu və yeni şifrəni daxil edin.</p>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="reset-code">Kod</label>
              <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} id="reset-code" className={`auth-input${shakeCls("reset-code")}`} placeholder="123456" value={resetCode} onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="auth-form-group">
              <label className="auth-label" htmlFor="reset-pw">Yeni şifrə</label>
              <input type="password" id="reset-pw" className={`auth-input${shakeCls("reset-pw")}`} placeholder="Ən azı 8 simvol, hərf və rəqəm" autoComplete="new-password" value={resetPw} onChange={(e) => setResetPw(e.target.value)} />
            </div>
            <button className="auth-btn-primary" onClick={submitReset} disabled={busy}>{busy ? "Saxlanılır…" : "Şifrəni yenilə"}</button>
          </div>

        </div>{/* /auth-steps-wrap */}

        {/* OTP help sub-sheet (mobile design) */}
        <div className={`auth-sub-overlay${otpHelp ? " open" : ""}`} id="auth-otp-help" onClick={(e) => e.target === e.currentTarget && setOtpHelp(false)}>
          <div className="auth-sub-sheet">
            <div className="auth-sub-handle"></div>
            <button className="auth-sub-close" type="button" onClick={() => setOtpHelp(false)} aria-label="Bağla">
              <IconCloseSmall />
            </button>
            <h3 className="auth-sub-title">Kod almadınız?</h3>
            <div className="auth-sub-options">
              <button className="auth-sub-option" type="button" onClick={() => { resendOtp(); setOtpHelp(false); }}>Təsdiq kodunu yenidən göndər</button>
              <button className="auth-sub-option" type="button" onClick={() => { setOtpHelp(false); prev(); }}>E-mail adresini dəyişdir</button>
              <button className="auth-sub-option" type="button" onClick={() => { setOtpHelp(false); toast("Spam / Promotions qovluğunu da yoxlayın"); }}>Spam qovluğunu yoxla</button>
            </div>
          </div>
        </div>

      </div>{/* /auth-sheet */}
    </div>
  );
}
