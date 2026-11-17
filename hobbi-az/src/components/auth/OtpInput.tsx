"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export interface OtpInputHandle {
  reset: () => void;
  focus: () => void;
}

const LENGTH = 6;

/** Six single-digit boxes (3 — 3) with auto-advance, backspace and paste support. */
export const OtpInput = forwardRef<OtpInputHandle>(function OtpInput(_, ref) {
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      setDigits(Array(LENGTH).fill(""));
      inputs.current[0]?.focus();
    },
    focus: () => inputs.current[0]?.focus(),
  }));

  const set = (i: number, v: string) => setDigits((d) => d.map((x, j) => (j === i ? v : x)));

  const box = (i: number) => (
    <input
      key={i}
      ref={(el) => { inputs.current[i] = el; }}
      className={`auth-otp-input${digits[i] ? " filled" : ""}`}
      type="text"
      inputMode="numeric"
      maxLength={1}
      autoComplete={i === 0 ? "one-time-code" : undefined}
      aria-label={`Kodun ${i + 1}-ci rəqəmi`}
      value={digits[i]}
      onChange={(e) => {
        const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 1);
        set(i, v);
        if (v && i < LENGTH - 1) inputs.current[i + 1]?.focus();
      }}
      onKeyDown={(e) => {
        if (e.key === "Backspace" && !digits[i] && i > 0) {
          set(i - 1, "");
          inputs.current[i - 1]?.focus();
        }
      }}
      onPaste={(e) => {
        e.preventDefault();
        const paste = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
        setDigits(Array.from({ length: LENGTH }, (_, j) => paste[j] || ""));
        const last = Math.min(paste.length, LENGTH) - 1;
        if (last >= 0) inputs.current[last]?.focus();
      }}
    />
  );

  return (
    <div className="auth-otp-grid" id="auth-otp-grid">
      {box(0)}{box(1)}{box(2)}
      <span className="auth-otp-sep">—</span>
      {box(3)}{box(4)}{box(5)}
    </div>
  );
});
