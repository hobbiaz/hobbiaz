"use client";

import { useRef } from "react";
import Link from "next/link";
import { IDEAS } from "@/data/ideas";
import { POPULAR_CATEGORIES } from "@/data/content";
import { useUI } from "@/providers/UIProvider";
import { IconSearchLarge } from "@/components/icons";
import { pressable } from "@/lib/a11y";

export function SearchPage() {
  const { filterCategory, search } = useUI();
  const input = useRef<HTMLInputElement>(null);
  const submit = () => search(input.current?.value ?? "");

  return (
    <div className="page active" id="page-search">
      <div className="search-page">
        <div className="search-page-hero">
          <h1>Nə axtarırsınız?</h1>
          <div className="search-box-wrap">
            <IconSearchLarge />
            <input ref={input} type="search" id="search-input" placeholder="Məhsul, mağaza və ya sənətkar axtar..." aria-label="Axtarış" enterKeyHint="search" onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
            <button className="search-btn" onClick={submit}>Axtar</button>
          </div>
        </div>

        <div className="section-header" style={{ marginBottom: ".75rem" }}>
          <h2>İdeya və İlham</h2>
          <Link href="/">Hamısına bax</Link>
        </div>
        <div className="ideas-grid" id="ideas-grid">
          {IDEAS.map((idea) => (
            <div className="idea-card" key={idea.title}>
              <div className="ibg" style={{ background: idea.color }}>{idea.emoji}</div>
              <div className="idea-overlay">
                <div className="idea-title">{idea.title}</div>
                <div className="idea-views">👁 {idea.views}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <div className="section-header" style={{ marginBottom: ".65rem" }}>
            <h2>Populyar Kateqoriyalar</h2>
          </div>
          <div className="chip-row">
            {POPULAR_CATEGORIES.map((c) => (
              <span key={c.slug} {...pressable} className={`chip${c.orange ? " orange" : ""}`} onClick={() => filterCategory(c.slug)}>
                {c.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
