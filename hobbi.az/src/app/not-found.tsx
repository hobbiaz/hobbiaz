import Link from "next/link";

export const metadata = { title: "Səhifə tapılmadı" };

export default function NotFound() {
  return (
    <div className="page active" style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
      <div style={{ fontSize: "3rem", fontWeight: 800, color: "var(--primary)" }}>404</div>
      <h2 style={{ margin: ".75rem 0 .5rem" }}>Səhifə tapılmadı</h2>
      <p style={{ color: "var(--on-surface-var)", marginBottom: "1.5rem" }}>Axtardığınız səhifə silinib və ya heç vaxt olmayıb.</p>
      <Link href="/" className="store-cta-btn" style={{ display: "inline-block" }}>Ana səhifəyə qayıt</Link>
    </div>
  );
}
