"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div role="alert"><h2>Xəta baş verdi</h2><button className="hb-btn" onClick={reset}>Yenidən cəhd et</button></div>;
}
