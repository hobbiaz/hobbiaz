import "./dev.css";

/** Plain scaffold pages that exercise the API routes. Not part of the product design. */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  return <div className="hb-main">{children}</div>;
}
