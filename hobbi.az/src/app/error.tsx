"use client";

import { useEffect } from "react";

/** Route-level error boundary, styled with the app's own tokens (no /dev styles). */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div role="alert" className="page active" style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
      <div style={{ fontSize: "2.5rem" }} aria-hidden="true">⚠️</div>
      <h2 style={{ margin: "1rem 0 .5rem" }}>Xəta baş verdi</h2>
      <p style={{ color: "var(--on-surface-var)", marginBottom: "1.5rem" }}>Səhifəni yükləmək alınmadı. Bir daha yoxlayın.</p>
      <button className="store-cta-btn" onClick={reset}>Yenidən cəhd et</button>
    </div>
  );
}
