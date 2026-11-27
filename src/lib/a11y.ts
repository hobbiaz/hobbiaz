import type { KeyboardEvent } from "react";

/**
 * Keyboard support for clickable non-button elements (legacy markup uses <div>/<span>
 * with onClick). Enter / Space on the focused element fires its own click handler.
 */
export function activateOnKey(e: KeyboardEvent<HTMLElement>) {
  if (e.target !== e.currentTarget) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    e.currentTarget.click();
  }
}

/** Spread onto a clickable <div>/<span>: focusable, announced as a button, keyboard-operable. */
export const pressable = { role: "button", tabIndex: 0, onKeyDown: activateOnKey } as const;
