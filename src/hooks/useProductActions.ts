"use client";

import { useCallback } from "react";
import { useUI } from "@/providers/UIProvider";
import { api } from "@/lib/api-client";
import type { Product } from "@/types";

/**
 * Real actions behind the legacy buttons: "Maraqlan" (message the seller), "Sifariş et"
 * (order request), "Şikayət et" (report). Demo products only show a hint.
 */
export function useProductActions() {
  const { requireAuth, toast, user } = useUI();

  const guard = useCallback((p: Product, reason: string) => {
    if (p.id.startsWith("demo-") || !p.ownerId) { toast("Bu demo məhsuldur"); return false; }
    if (!requireAuth(reason)) return false;
    if (user?.id === p.ownerId) { toast("Bu sizin öz məhsulunuzdur"); return false; }
    return true;
  }, [requireAuth, toast, user]);

  const interested = useCallback(async (p: Product) => {
    if (!guard(p, "Satıcıya yazmaq üçün daxil olun")) return;
    try {
      await api("/api/conversations", { method: "POST", body: { recipientId: p.ownerId, listingId: p.id, body: `Salam! "${p.title}" ilə maraqlanıram.` } });
      toast("Mesaj satıcıya göndərildi 💬");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Xəta");
    }
  }, [guard, toast]);

  const order = useCallback(async (p: Product) => {
    if (!guard(p, "Sifariş üçün daxil olun")) return;
    const note = window.prompt(`"${p.title}" — ${p.price} AZN\nSatıcıya qeyd (istəyə bağlı: ölçü, rəng, çatdırılma ünvanı):`, "");
    if (note === null) return;
    try {
      await api("/api/orders", { method: "POST", body: { listingId: p.id, note: note.trim() || undefined } });
      toast("Sifariş satıcıya göndərildi 🎉 Profil → Sifarişlərim");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Xəta");
    }
  }, [guard, toast]);

  const report = useCallback(async (p: Product) => {
    if (!guard(p, "Şikayət üçün daxil olun")) return;
    const details = window.prompt("Şikayətin səbəbi (saxtakarlıq, qadağan olunmuş məhsul, spam…):", "");
    if (details === null) return;
    try {
      await api("/api/reports", { method: "POST", body: { listingId: p.id, reason: "OTHER", details: details.trim() || undefined } });
      toast("Şikayətiniz moderatora göndərildi");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Xəta");
    }
  }, [guard, toast]);

  return { interested, order, report };
}
