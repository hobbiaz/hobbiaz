"use client";

import { useMemo, useState } from "react";
import { PRODUCTS } from "@/data/products";
import { useUI } from "@/providers/UIProvider";
import { applyFilters, DEFAULT_FILTERS, EMPTY_FILTERS, type Feature, type FilterState, type PriceChip } from "@/lib/filters";
import type { CategorySlug } from "@/types";
import { IconArrowLeft, IconFilterApply } from "@/components/icons";

const CATEGORY_ROWS: { slug: CategorySlug; label: string; count: number }[] = [
  { slug: "zergerllik", label: "Zinət əşyaları", count: 210 },
  { slug: "keramika", label: "Ev və Dekor / Keramika", count: 85 },
  { slug: "resm", label: "Rəsm", count: 95 },
  { slug: "toxuculuq", label: "Xalçaçılıq / Toxuculuq", count: 64 },
];

const PRICE_CHIPS: { value: PriceChip; label: string }[] = [
  { value: "0-20", label: "20 AZN-ə qədər" },
  { value: "20-50", label: "20 – 50 AZN" },
  { value: "50-100", label: "50 – 100 AZN" },
  { value: "discount", label: "Endirimdə olanlar" },
];

const FEATURES: { value: Feature; label: string }[] = [
  { value: "handmade", label: "100% Əl işi (Handmade)" },
  { value: "personal", label: "Fərdiləşdirilə bilən (Ad yazılan)" },
  { value: "custom_order", label: "Sifarişlə hazırlanan" },
  { value: "gift", label: "Hədiyyəlik qablaşdırma" },
];

type SectionKey = "cat" | "price" | "feat" | "material";

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

function Section({ label, open, onToggle, children }: { label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="filter-section">
      <div className="filter-section-head" onClick={onToggle}>
        <span className="filter-section-label">{label}</span>
        <span className={`filter-chevron${open ? " open" : ""}`}>▼</span>
      </div>
      <div className={`filter-section-body${open ? " open" : ""}`}>{children}</div>
    </div>
  );
}

export function FilterModal() {
  const { modal, closeModal, setFilteredProducts, toast } = useUI();
  const [f, setF] = useState<FilterState>(DEFAULT_FILTERS);
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({ cat: true, price: true, feat: true, material: false });
  const flip = (k: SectionKey) => setOpen((o) => ({ ...o, [k]: !o[k] }));
  const count = useMemo(() => applyFilters(PRODUCTS, f).length, [f]);

  const apply = () => {
    const list = applyFilters(PRODUCTS, f);
    setFilteredProducts(list);
    closeModal();
    toast(`Filtrlər tətbiq edildi (${list.length} məhsul)`);
  };

  return (
    <div id="filter-modal" className={modal === "filter" ? "open" : undefined} onClick={(e) => e.target === e.currentTarget && closeModal()}>
      <div className="filter-panel" role="dialog" aria-modal="true" aria-label="Filtrlər">
        <div className="filter-panel-head">
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
            <button
              onClick={closeModal}
              aria-label="Bağla"
              style={{ background: "none", border: "none", cursor: "pointer", color: "#584142", padding: ".1rem", display: "flex", alignItems: "center" }}
            >
              <IconArrowLeft />
            </button>
            <span className="filter-panel-title">Filtrlər</span>
          </div>
          <button className="filter-clear-all" onClick={() => setF(EMPTY_FILTERS)}>Sıfırla</button>
        </div>

        <div className="filter-body">
          <Section label="Kateqoriya" open={open.cat} onToggle={() => flip("cat")}>
            {CATEGORY_ROWS.map((row) => (
              <div
                key={row.slug}
                className={`filter-check-row${f.categories.includes(row.slug) ? " checked" : ""}`}
                onClick={() => setF((s) => ({ ...s, categories: toggle(s.categories, row.slug) }))}
              >
                <div className="filter-custom-cb" />
                <span className="filter-check-label">{row.label}</span>
                <span className="filter-check-count">({row.count})</span>
              </div>
            ))}
            <div style={{ marginTop: ".25rem" }}>
              <span className="filter-show-all" onClick={() => toast("Hamısı göstərilir")}>Hamısını göstər (6) ▾</span>
            </div>
          </Section>

          <Section label="Qiymət" open={open.price} onToggle={() => flip("price")}>
            <div className="price-range-track">
              <div className="price-range-fill" id="price-range-fill" />
              <div className="price-handle left" id="price-handle-left" />
              <div className="price-handle right" id="price-handle-right" />
            </div>
            <div className="price-inputs">
              <div className="price-input-box">
                <span className="price-input-label">Min (AZN)</span>
                <input className="price-input" type="number" id="f-min-price" placeholder="0" min="0" value={f.min} onChange={(e) => setF((s) => ({ ...s, min: e.target.value }))} />
              </div>
              <span className="price-dash">—</span>
              <div className="price-input-box">
                <span className="price-input-label">Max (AZN)</span>
                <input className="price-input" type="number" id="f-max-price" placeholder="500" min="0" value={f.max} onChange={(e) => setF((s) => ({ ...s, max: e.target.value }))} />
              </div>
            </div>
            <div className="price-quick-chips">
              {PRICE_CHIPS.map((chip) => (
                <div
                  key={chip.value}
                  className={`price-q-chip${f.priceChips.includes(chip.value) ? " selected" : ""}`}
                  onClick={() => setF((s) => ({ ...s, priceChips: toggle(s.priceChips, chip.value) }))}
                >
                  <div className="pq-radio" />
                  {chip.label}
                </div>
              ))}
            </div>
          </Section>

          <Section label="Özəlliklər" open={open.feat} onToggle={() => flip("feat")}>
            {FEATURES.map((ft) => (
              <div
                key={ft.value}
                className={`ozellik-row${f.features.includes(ft.value) ? " checked" : ""}`}
                onClick={() => setF((s) => ({ ...s, features: toggle(s.features, ft.value) }))}
              >
                <span className="ozellik-label">{ft.label}</span>
                <div className="ozellik-cb-box" />
              </div>
            ))}
          </Section>

          <div className="filter-section" style={{ borderBottom: "none" }}>
            <div className="material-row-link" onClick={() => flip("material")}>
              <span className="material-row-icon">▧</span>
              <span className="material-row-text">Material</span>
              <span className="material-row-val">Hamısı</span>
              <span className="material-row-arrow">›</span>
            </div>
          </div>
        </div>

        <div className="filter-footer">
          <button className="filter-apply-btn" id="filter-apply-btn" onClick={apply}>
            <IconFilterApply />
            Filtrləri tətbiq et (<span id="filter-product-count">{count}</span> məhsul)
          </button>
        </div>
      </div>
    </div>
  );
}
