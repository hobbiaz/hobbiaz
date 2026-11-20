"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NOTIFICATIONS } from "@/data/content";
import { useClickOutside } from "@/hooks/useClickOutside";
import { IconBell, IconBellDot } from "@/components/icons";
import { pressable } from "@/lib/a11y";

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(NOTIFICATIONS);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);

  useClickOutside([btnRef, dropRef], close, open);

  // Page-level scroll closes the menu, but scrolling inside the list does not.
  useEffect(() => {
    if (!open) return;
    const onScroll = (e: Event) => {
      if (listRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  const hasUnread = items.some((n) => n.unread);

  return (
    <div className="notif-wrapper">
      <button
        ref={btnRef}
        className="icon-btn"
        id="notif-btn"
        title="Bildirişlər"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
          window.dispatchEvent(new Event("hobbi:close-share-menu"));
        }}
      >
        {hasUnread ? (
          <span id="notif-icon-filled"><IconBellDot /></span>
        ) : (
          <span id="notif-icon-empty"><IconBell /></span>
        )}
      </button>
      <div ref={dropRef} className={`notif-dropdown${open ? " open" : ""}`} id="notif-dropdown">
        <div className="notif-head">
          <span>Bildirişlər</span>
          <span {...pressable} className="notif-mark" onClick={() => setItems((list) => list.map((n) => ({ ...n, unread: false })))}>
            Oxundu
          </span>
        </div>
        <div className="notif-list" ref={listRef}>
          {items.map((n) => (
            <div key={n.id} className={`notif-item${n.unread ? " unread" : ""}`}>
              <div className="notif-icon">{n.icon}</div>
              <div className="notif-body">
                <div className="notif-title">{n.title}</div>
                <div className="notif-text">{n.text}</div>
                <div className="notif-time">{n.time}</div>
              </div>
              {n.unread && <div className="notif-dot" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
