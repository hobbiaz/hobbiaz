"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useUI } from "@/providers/UIProvider";
import { IconMakeProduct, IconPlusCircle, IconShareProduct } from "@/components/icons";
import { pressable } from "@/lib/a11y";

/** "+" menu in the top bar: publish a listing or request a custom-made product. */
export function ShareMenu() {
  const { openModal } = useUI();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useClickOutside([btnRef, dropRef], close, open);

  useEffect(() => {
    window.addEventListener("scroll", close, true);
    window.addEventListener("hobbi:close-share-menu", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("hobbi:close-share-menu", close);
    };
  }, [close]);

  return (
    <div className="share-wrapper">
      <button
        ref={btnRef}
        className="icon-btn"
        id="share-menu-btn"
        title="Paylaş"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        <IconPlusCircle />
      </button>
      <div ref={dropRef} className={`share-dropdown${open ? " open" : ""}`} id="share-dropdown">
        <div {...pressable} className="share-dropdown-item" onClick={() => { openModal("listing"); close(); }}>
          <IconShareProduct />
          Məhsul Paylaş
        </div>
        <div {...pressable} className="share-dropdown-item" onClick={() => { openModal("create"); close(); }}>
          <IconMakeProduct />
          Məhsul Hazırlat
        </div>
      </div>
    </div>
  );
}
