"use client";

import type { CSSProperties, ReactNode } from "react";

/** Legacy `.modal-overlay` + `.modal-box` pair. Clicking the dimmed backdrop closes it. */
export function Modal({
  id, open, onClose, boxStyle, children,
}: {
  id: string;
  open: boolean;
  onClose: () => void;
  boxStyle?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div className={`modal-overlay${open ? " open" : ""}`} id={id} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={boxStyle} role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}
