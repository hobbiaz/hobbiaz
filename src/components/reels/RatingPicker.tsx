"use client";

import { IconReset } from "@/components/icons";
import { PickerStar } from "./StarIcons";
import { pressable } from "@/lib/a11y";

export type RatingPhase = "enter" | "open" | "closing";

const phaseClass: Record<RatingPhase, string> = {
  enter: "active",
  open: "active pop-in",
  closing: "active burst-out",
};

/** 1–5 star picker that pops in over a reel. Rendered in the card (desktop) or as a fixed portal (phone). */
export function RatingPicker({
  id, className = "rating-overlay", phase, value, onRate, onReset,
}: {
  id?: string;
  className?: string;
  phase: RatingPhase | null;
  value: number;
  onRate: (value: number) => void;
  onReset: () => void;
}) {
  return (
    <div {...pressable}
      id={id}
      className={`${className} ${phase ? phaseClass[phase] : ""}`.trim() || undefined}
      aria-hidden={phase === null || phase === "closing"}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="rating-row">
        <div className="rating-bar">
          <div className="rating-stars" role="group" aria-label="Ulduz reytinqi">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`rating-star-btn${n <= value ? " is-filled" : ""}`}
                data-value={n}
                aria-label={`${n} ulduz ver`}
                aria-pressed={n <= value}
                onClick={() => onRate(n)}
              >
                <PickerStar />
              </button>
            ))}
          </div>
        </div>
        <span className={`rating-value${value > 0 ? " is-rated" : ""}`}>{value}/5</span>
      </div>
      <button type="button" className="rating-reset-btn rerating-btn" hidden={value === 0} aria-label="Reytinqi sıfırla" onClick={onReset}>
        <IconReset />
        Sıfırla
      </button>
    </div>
  );
}
