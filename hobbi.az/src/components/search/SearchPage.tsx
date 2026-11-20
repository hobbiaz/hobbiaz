"use client";

import { IDEAS } from "@/data/ideas";
import { POPULAR_CATEGORIES } from "@/data/content";
import { useUI } from "@/providers/UIProvider";
import { IconSearchLarge } from "@/components/icons";

export function SearchPage() {
  const { filterCategory } = useUI();

  return (
    <div className="page active" id="page-search">
      <div className="search-page">
        <div className="search-page-hero">
          <h1>Nə axtarırsınız?</h1>
          <div className="search-box-wrap">
            <IconSearchLarge />
            <input type="text" id="search-input" placeholder="Məhsul, mağaza və ya sənətkar axtar..." />
            <button className="search-btn">Axtar</button>
          </div>
        </div>

        <div className="section-header" style={{ marginBottom: ".75rem" }}>
          <h2>İdeya və İlham</h2>
          <a href="#">Hamısına bax</a>
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
              <span key={c.slug} className={`chip${c.orange ? " orange" : ""}`} onClick={() => filterCategory(c.slug)}>
                {c.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
