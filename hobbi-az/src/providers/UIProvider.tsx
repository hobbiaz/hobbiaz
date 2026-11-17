"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CategorySlug, Lang, Product, Theme } from "@/types";
import { PRODUCTS } from "@/data/products";
import { readStorage, writeStorage } from "@/lib/storage-client";

/** Overlays that are mutually exclusive (only one open at a time). */
export type ModalName = "auth" | "filter" | "listing" | "create" | "share" | "search";

interface UIState {
  // feedback
  toast: (message: string) => void;
  reelsToast: (message: string) => void;
  // theme & language
  theme: Theme;
  setTheme: (theme: Theme, announce?: boolean) => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
  // home feed
  category: CategorySlug;
  /** Selects a category and navigates to the home feed (legacy `filterCat`). */
  filterCategory: (cat: CategorySlug) => void;
  resetCategory: () => void;
  products: Product[];
  setFilteredProducts: (list: Product[] | null) => void;
  // overlays
  modal: ModalName | null;
  openModal: (name: ModalName) => void;
  closeModal: () => void;
  // product detail panel (stacked navigation like the legacy history stack)
  productId: number | null;
  openProduct: (id: number, pushCurrent?: boolean) => void;
  backProduct: () => void;
  closeProduct: () => void;
}

const UIContext = createContext<UIState | null>(null);

const THEME_LABEL: Record<Theme, string> = { auto: "Avtomatik", light: "Açıq", dark: "Tünd" };

export function UIProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // ── toast ────────────────────────────────────────────────
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toast = useCallback((message: string) => {
    setToastMsg(message);
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2200);
  }, []);

  const [reelsToastMsg, setReelsToastMsg] = useState<{ text: string; key: number } | null>(null);
  const reelsToast = useCallback((text: string) => {
    setReelsToastMsg({ text, key: Date.now() });
    setTimeout(() => setReelsToastMsg(null), 2500);
  }, []);

  // ── theme / lang ─────────────────────────────────────────
  const [theme, setThemeState] = useState<Theme>("auto");
  const [lang, setLangState] = useState<Lang>("az");
  useEffect(() => {
    setThemeState((readStorage("theme") as Theme) || "auto");
    setLangState((readStorage("hobbi_lang") as Lang) || "az");
  }, []);
  const setTheme = useCallback((next: Theme, announce = true) => {
    setThemeState(next);
    document.documentElement.setAttribute("data-theme", next);
    writeStorage("theme", next);
    if (announce) toast("Tema: " + THEME_LABEL[next]);
  }, [toast]);
  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    writeStorage("hobbi_lang", next);
    toast("Dil dəyişdirildi: " + (next === "az" ? "Azərbaycan" : "Русский"));
  }, [toast]);

  // ── home feed ────────────────────────────────────────────
  const [category, setCategory] = useState<CategorySlug>("all");
  const [filtered, setFiltered] = useState<Product[] | null>(null);
  const filterCategory = useCallback((cat: CategorySlug) => {
    setCategory(cat);
    setFiltered(null);
    router.push("/");
  }, [router]);
  const resetCategory = useCallback(() => { setCategory("all"); setFiltered(null); }, []);
  const products = useMemo(() => {
    if (filtered) return filtered;
    return category === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === category);
  }, [category, filtered]);

  // ── overlays ─────────────────────────────────────────────
  const [modal, setModal] = useState<ModalName | null>(null);
  const openModal = useCallback((name: ModalName) => setModal(name), []);
  const closeModal = useCallback(() => setModal(null), []);

  const [productStack, setProductStack] = useState<number[]>([]);
  const productId = productStack.length ? productStack[productStack.length - 1] : null;
  const openProduct = useCallback((id: number, pushCurrent = false) => {
    setProductStack((s) => {
      if (!s.length) window.history.pushState({ pdOpen: true, pdId: id }, "", "#producto=" + id);
      return pushCurrent ? [...s, id] : [id];
    });
  }, []);
  const closeProduct = useCallback(() => setProductStack([]), []);
  const backProduct = useCallback(() => {
    setProductStack((s) => {
      if (s.length > 1) return s.slice(0, -1);
      if (window.history.state?.pdOpen) window.history.back();
      return [];
    });
  }, []);
  useEffect(() => {
    const onPop = (e: PopStateEvent) => { if (!e.state?.pdOpen) setProductStack([]); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Lock page scroll while any overlay is open (legacy: body.style.overflow = 'hidden').
  useEffect(() => {
    const locked = modal !== null && modal !== "search" || productId !== null;
    document.body.style.overflow = locked ? "hidden" : "";
  }, [modal, productId]);

  // Escape closes the active overlay.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setModal(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const value: UIState = {
    toast, reelsToast, theme, setTheme, lang, setLang,
    category, filterCategory, resetCategory, products, setFilteredProducts: setFiltered,
    modal, openModal, closeModal, productId, openProduct, backProduct, closeProduct,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
      <div
        id="app-toast"
        role="status"
        aria-live="polite"
        style={{
          position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,.82)",
          color: "#fff", padding: ".55rem 1.1rem", borderRadius: 9999, fontSize: ".85rem", zIndex: 9999,
          whiteSpace: "nowrap", transition: "opacity .3s", opacity: toastVisible ? 1 : 0, pointerEvents: "none",
        }}
      >
        {toastMsg}
      </div>
      {reelsToastMsg && (
        <div key={reelsToastMsg.key} id="reels-toast-notice" className="reels-toast-notice">
          {reelsToastMsg.text}
        </div>
      )}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used inside <UIProvider>");
  return ctx;
}
