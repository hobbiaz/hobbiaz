import { Suspense } from "react";
import { CollectionView } from "@/components/collections/CollectionView";

export const metadata = { title: "Kolleksiya", description: "hobbi.az-da seçilmiş əl işi məhsullar kolleksiyası." };

type Props = { params: Promise<{ id: string }> };

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense>
      <CollectionView id={id} />
    </Suspense>
  );
}
