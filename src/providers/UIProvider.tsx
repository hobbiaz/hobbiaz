"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isCategorySlug, type CategorySlug, type Lang, type Product, type SessionUser, type Theme } from "@/types";
import { PRODUCTS } from "@/data/products";
import { NOTIFICATIONS as DEMO_NOTIFICATIONS } from "@/data/content";
import { readJSON, readStorage, writeStorage } from "@/lib/storage-client";
import { searchProducts } from "@/lib/filters";
import { api, ApiError } from "@/lib/api-client";

/** Overlays that are mutually exclusive (only one open at a time). */
export type ModalName = "auth" | "filter" | "listing" | "create" | "share" | "search" | "reelUpload";
export type AuthMode = "register" | "login" | "reset";
/**
 * "online": the API and database answer — real data.
 * "offline": no database (e.g. a fresh clone without .env) — the built-in demo catalogue.
 */
export type Backend = "checking" | "online" | "offline";

interface ListingsPage { items: Product[]; total: number; hasMore: boolean }
export interface AppNotification { id: string; icon: string; title: string; text: string; at: string; unread: boolean; href?: string }

interface UIState {
  // feedback
  toast: (message: string) => void;
  reelsToast: (message: string) => void;
  // theme & language
  theme: Theme;
  setTheme: (theme: Theme, announce?: boolean) => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
  // backend + session
  backend: Backend;
  user: SessionUser | null;
  refreshUser: () => Promise<SessionUser | null>;
  logout: () => Promise<void>;
  /** Opens the sign-in sheet and returns false when nobody is signed in. */
  requireAuth: (reason?: string) => boolean;
  authMode: AuthMode;
  openAuth: (mode?: AuthMode) => void;
  // home feed
  category: CategorySlug;
  /** Selects a category and navigates to the home feed (legacy `filterCat`). */
  filterCategory: (cat: CategorySlug) => void;
  resetCategory: () => void;
  /** Free-text search: shows matches on the home feed and puts ?q= in the URL. */
  search: (query: string) => void;
  query: string;
  products: Product[];
  /** Everything loaded so far (feed + opened products): the filter panel works on this. */
  catalog: Product[];
  feedLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refreshFeed: () => void;
  setFilteredProducts: (list: Product[] | null) => void;
  getProduct: (id: string) => Product | undefined;
  fetchProduct: (id: string) => Promise<Product | null>;
  rememberProducts: (list: Product[]) => void;
  // wishlist: server-side when signed in, localStorage for guests
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  // notifications (polled while signed in)
  notifications: AppNotification[];
  unreadMessages: number;
  markNotificationsSeen: () => void;
  refreshNotifications: () => void;
  // overlays
  modal: ModalName | null;
  openModal: (name: ModalName) => void;
  closeModal: () => void;
  /** The filter sheet opens on top of whatever is showing (the page or the search panel). */
  filterOpen: boolean;
  closeFilter: () => void;
  /** Last texts searched on this device, newest first. */
  recentSearches: string[];
  // product detail panel (stacked navigation like the legacy history stack)
  productId: string | null;
  openProduct: (id: string, pushCurrent?: boolean) => void;
  backProduct: () => void;
  closeProduct: () => void;
}

const UIContext = createContext<UIState | null>(null);

const FAVORITES_KEY = "hobbi_favorites";
const RECENT_SEARCHES_KEY = "hobbi_recent_searches";
const RECENT_SEARCHES_MAX = 3;
const PRODUCT_HASH = /^#producto=([\w-]{1,64})$/;

/** `?cat=` of the current URL when it names a known category, else "all". */
function categoryFromUrl(): CategorySlug {
  const cat = new URLSearchParams(window.location.search).get("cat");
  return isCategorySlug(cat) ? cat : "all";
}

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
    toastTimer.current = setTimeout(() => setToastVisible(false), 2600);
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

  // ── overlays ─────────────────────────────────────────────
  const [modal, setModal] = useState<ModalName | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  // "filter" does not replace the open overlay: it stacks on top of it (e.g. over the search panel).
  const openModal = useCallback((name: ModalName) => (name === "filter" ? setFilterOpen(true) : setModal(name)), []);
  const closeModal = useCallback(() => setModal(null), []);
  const closeFilter = useCallback(() => setFilterOpen(false), []);
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const openAuth = useCallback((mode: AuthMode = "register") => { setAuthMode(mode); setModal("auth"); }, []);

  // ── backend + session ────────────────────────────────────
  const [backend, setBackend] = useState<Backend>("checking");
  const [user, setUser] = useState<SessionUser | null>(null);
  const refreshUser = useCallback(async () => {
    try {
      const me = await api<SessionUser | null>("/api/me");
      setUser(me);
      setBackend("online");
      return me;
    } catch (e) {
      setUser(null);
      if (e instanceof ApiError) setBackend(e.offline ? "offline" : "online");
      return null;
    }
  }, []);
  useEffect(() => { void refreshUser(); }, [refreshUser]);
  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
    toast("Çıxış edildi. Görüşənədək! 👋");
    router.push("/");
  }, [router, toast]);
  const requireAuth = useCallback((reason?: string) => {
    if (user) return true;
    if (backend === "offline") { toast("Demo rejim: server qoşulmayıb"); return false; }
    if (reason) toast(reason);
    openAuth("login");
    return false;
  }, [user, backend, toast, openAuth]);

  // ── product cache ────────────────────────────────────────
  const [cache, setCache] = useState<Record<string, Product>>({});
  const rememberProducts = useCallback((list: Product[]) => {
    if (list.length) setCache((c) => ({ ...c, ...Object.fromEntries(list.map((p) => [p.id, p])) }));
  }, []);
  const getProduct = useCallback(
    (id: string) => cache[id] ?? (id.startsWith("demo-") ? PRODUCTS.find((p) => p.id === id) : undefined),
    [cache],
  );
  const fetchProduct = useCallback(async (id: string) => {
    if (id.startsWith("demo-")) return PRODUCTS.find((p) => p.id === id) ?? null;
    try {
      const p = await api<Product>(`/api/listings/${encodeURIComponent(id)}`);
      rememberProducts([p]);
      return p;
    } catch {
      return null;
    }
  }, [rememberProducts]);

  // ── home feed ────────────────────────────────────────────
  const [category, setCategory] = useState<CategorySlug>("all");
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<Product[] | null>(null);
  const [feed, setFeed] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedVersion, setFeedVersion] = useState(0);

  // The category / search live in the URL (/?cat=resm, /?q=xalça) so they survive refresh.
  const filterCategory = useCallback((cat: CategorySlug) => {
    setCategory(cat);
    setFiltered(null);
    setQuery("");
    router.push(cat === "all" ? "/" : `/?cat=${encodeURIComponent(cat)}`, { scroll: false });
  }, [router]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  useEffect(() => {
    const saved = readJSON<unknown>(RECENT_SEARCHES_KEY, []);
    if (Array.isArray(saved)) setRecentSearches(saved.map(String).slice(0, RECENT_SEARCHES_MAX));
  }, []);
  const search = useCallback((q: string) => {
    const text = q.trim();
    if (text) {
      setRecentSearches((list) => {
        const next = [text, ...list.filter((x) => x.toLocaleLowerCase("az") !== text.toLocaleLowerCase("az"))].slice(0, RECENT_SEARCHES_MAX);
        writeStorage(RECENT_SEARCHES_KEY, JSON.stringify(next));
        return next;
      });
    }
    setCategory("all");
    setQuery(text);
    setFiltered(null);
    router.push(text ? `/?q=${encodeURIComponent(text)}` : "/", { scroll: false });
  }, [router]);
  useEffect(() => {
    const syncFromUrl = () => {
      if (window.location.pathname !== "/") return;
      const q = new URLSearchParams(window.location.search).get("q")?.trim() ?? "";
      setCategory(q ? "all" : categoryFromUrl());
      setQuery(q);
      setFiltered(null);
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);
  const resetCategory = useCallback(() => { setCategory("all"); setFiltered(null); setQuery(""); }, []);

  // Load page 1 whenever the filter changes (or after the backend check finished).
  useEffect(() => {
    if (backend === "checking") return;
    if (backend === "offline") {
      const base = category === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.cat === category);
      setFeed(query ? searchProducts(base, query) : base);
      setHasMore(false);
      return;
    }
    let cancelled = false;
    setFeedLoading(true);
    const params = new URLSearchParams({ page: "1" });
    if (category !== "all") params.set("category", category);
    if (query) params.set("q", query);
    api<ListingsPage>(`/api/listings?${params}`)
      .then((r) => {
        if (cancelled) return;
        setFeed(r.items);
        setHasMore(r.hasMore);
        setPage(1);
        rememberProducts(r.items);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError && e.offline) setBackend("offline");
        else toast(e instanceof Error ? e.message : "Məhsulları yükləmək alınmadı");
      })
      .finally(() => { if (!cancelled) setFeedLoading(false); });
    return () => { cancelled = true; };
  }, [backend, category, query, feedVersion, rememberProducts, toast]);

  const loadMore = useCallback(() => {
    if (!hasMore || feedLoading || backend !== "online") return;
    setFeedLoading(true);
    const params = new URLSearchParams({ page: String(page + 1) });
    if (category !== "all") params.set("category", category);
    if (query) params.set("q", query);
    api<ListingsPage>(`/api/listings?${params}`)
      .then((r) => {
        setFeed((f) => [...f, ...r.items.filter((p) => !f.some((x) => x.id === p.id))]);
        setHasMore(r.hasMore);
        setPage((n) => n + 1);
        rememberProducts(r.items);
      })
      .catch((e) => toast(e instanceof Error ? e.message : "Xəta"))
      .finally(() => setFeedLoading(false));
  }, [hasMore, feedLoading, backend, page, category, query, rememberProducts, toast]);
  const refreshFeed = useCallback(() => setFeedVersion((v) => v + 1), []);

  const products = filtered ?? feed;
  const catalog = useMemo(() => {
    const all = new Map<string, Product>();
    for (const p of backend === "offline" ? PRODUCTS : Object.values(cache)) all.set(p.id, p);
    for (const p of feed) all.set(p.id, p);
    return [...all.values()].filter((p) => !p.status || p.status === "PUBLISHED");
  }, [backend, cache, feed]);

  // ── wishlist ─────────────────────────────────────────────
  const [favorites, setFavorites] = useState<string[]>([]);
  const guestFavorites = () => {
    const saved = readJSON<unknown>(FAVORITES_KEY, []);
    return Array.isArray(saved) ? saved.map(String) : [];
  };
  useEffect(() => {
    if (backend === "checking") return;
    if (!user) { setFavorites(guestFavorites()); return; }
    let cancelled = false;
    (async () => {
      // Merge favourites saved while signed out into the account, once.
      const local = guestFavorites().filter((id) => !id.startsWith("demo-"));
      for (const id of local) await api("/api/favorites", { method: "POST", body: { listingId: id, favorited: true } }).catch(() => {});
      if (local.length) writeStorage(FAVORITES_KEY, null);
      const ids = await api<string[]>("/api/favorites?ids=1").catch(() => []);
      if (!cancelled) setFavorites(ids);
    })();
    return () => { cancelled = true; };
  }, [backend, user]);
  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites]);
  const toggleFavorite = useCallback((id: string) => {
    const on = !favorites.includes(id);
    setFavorites((f) => (on ? [...f, id] : f.filter((x) => x !== id)));
    if (user && !id.startsWith("demo-")) {
      api("/api/favorites", { method: "POST", body: { listingId: id, favorited: on } }).catch((e) => {
        setFavorites((f) => (on ? f.filter((x) => x !== id) : [...f, id]));
        toast(e instanceof Error ? e.message : "Xəta");
      });
    } else {
      const next = on ? [...favorites, id] : favorites.filter((x) => x !== id);
      writeStorage(FAVORITES_KEY, JSON.stringify(next));
    }
  }, [favorites, user, toast]);

  // ── notifications ────────────────────────────────────────
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const refreshNotifications = useCallback(() => {
    if (!user) return;
    api<{ items: AppNotification[]; unreadMessages: number }>("/api/notifications")
      .then((r) => { setNotifications(r.items); setUnreadMessages(r.unreadMessages); })
      .catch(() => {});
  }, [user]);
  useEffect(() => {
    if (backend === "offline") {
      setNotifications(DEMO_NOTIFICATIONS.map((n) => ({ id: String(n.id), icon: n.icon, title: n.title, text: n.text, at: n.time, unread: n.unread })));
      return;
    }
    if (!user) { setNotifications([]); setUnreadMessages(0); return; }
    refreshNotifications();
    const t = setInterval(() => { if (document.visibilityState === "visible") refreshNotifications(); }, 45_000);
    return () => clearInterval(t);
  }, [backend, user, refreshNotifications]);
  const markNotificationsSeen = useCallback(() => {
    setNotifications((list) => list.map((n) => ({ ...n, unread: false })));
    if (user) api("/api/notifications", { method: "POST" }).catch(() => {});
  }, [user]);

  // ── product panel ────────────────────────────────────────
  const [productStack, setProductStack] = useState<string[]>([]);
  const productId = productStack.length ? productStack[productStack.length - 1] : null;
  const openProduct = useCallback((id: string, pushCurrent = false) => {
    setProductStack((s) => {
      // Keep Next's own history state (it reloads the page on entries without it).
      if (!s.length) window.history.pushState({ ...window.history.state, pdOpen: true, pdId: id }, "", "#producto=" + id);
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
  // Shared links (…/#producto=<id>) open that product on load; the panel fetches it.
  const deepLinked = useRef(false);
  useEffect(() => {
    if (deepLinked.current) return; // once per page load (StrictMode runs effects twice)
    deepLinked.current = true;
    const m = PRODUCT_HASH.exec(window.location.hash);
    if (!m) return;
    // Put a clean entry underneath so "back" closes the panel instead of leaving the site.
    const base = window.location.pathname + window.location.search;
    const navState = { ...window.history.state, pdOpen: false };
    window.history.replaceState(navState, "", base);
    window.history.pushState({ ...navState, pdOpen: true, pdId: m[1] }, "", base + m[0]);
    setProductStack([m[1]]);
  }, []);

  // Lock page scroll while any overlay is open (legacy: body.style.overflow = 'hidden').
  useEffect(() => {
    const locked = modal !== null && modal !== "search" || filterOpen || productId !== null;
    document.body.style.overflow = locked ? "hidden" : "";
  }, [modal, filterOpen, productId]);

  // Escape closes the active modal, or else steps back out of the product panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (filterOpen) setFilterOpen(false);
      else if (modal !== null) setModal(null);
      else if (productId !== null) backProduct();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal, filterOpen, productId, backProduct]);

  // Memoised so consumers re-render only when something they can read changed.
  const value = useMemo<UIState>(() => ({
    toast, reelsToast, theme, setTheme, lang, setLang,
    backend, user, refreshUser, logout, requireAuth, authMode, openAuth,
    category, filterCategory, resetCategory, search, query, products, catalog, feedLoading, hasMore, loadMore, refreshFeed,
    setFilteredProducts: setFiltered, getProduct, fetchProduct, rememberProducts,
    isFavorite, toggleFavorite, notifications, unreadMessages, markNotificationsSeen, refreshNotifications,
    modal, openModal, closeModal, filterOpen, closeFilter, recentSearches, productId, openProduct, backProduct, closeProduct,
  }), [toast, reelsToast, theme, setTheme, lang, setLang, backend, user, refreshUser, logout, requireAuth, authMode, openAuth,
    category, filterCategory, resetCategory, search, query, products, catalog, feedLoading, hasMore, loadMore, refreshFeed,
    getProduct, fetchProduct, rememberProducts, isFavorite, toggleFavorite,
    notifications, unreadMessages, markNotificationsSeen, refreshNotifications,
    modal, openModal, closeModal, filterOpen, closeFilter, recentSearches, productId, openProduct, backProduct, closeProduct]);

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
          maxWidth: "calc(100vw - 32px)", overflow: "hidden", textOverflow: "ellipsis",
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
