import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ListingForm } from "@/components/ListingForm";
export const dynamic = "force-dynamic";
export default async function NewListing() {
  const me = await getCurrentUser();
  if (!me) redirect("/dev/login");
  if (me.role === "BUYER") return <p>Elan yerləşdirmək üçün satıcı hesabı lazımdır.</p>;
  const categories = await db.category.findMany({ orderBy: { name: "asc" } });
  return <><h1>Yeni elan</h1><ListingForm categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} /></>;
}
