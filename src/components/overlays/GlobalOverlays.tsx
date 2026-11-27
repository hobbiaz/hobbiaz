"use client";

import { StoreOnboarding } from "@/components/auth/StoreOnboarding";
import { ProductDetailPanel } from "@/components/product/ProductDetailPanel";
import { SearchOverlay } from "@/components/search/SearchOverlay";
import { ReelUploadModal } from "@/components/reels/ReelUploadModal";
import { CreateProductModal } from "./CreateProductModal";
import { FilterModal } from "./FilterModal";
import { ListingModal } from "./ListingModal";
import { ShareModal } from "./ShareModal";

/** Every app-wide overlay, mounted once next to the page chrome. */
export function GlobalOverlays() {
  return (
    <>
      <StoreOnboarding />
      <ShareModal />
      <CreateProductModal />
      <FilterModal />
      <ListingModal />
      <SearchOverlay />
      <ReelUploadModal />
      <ProductDetailPanel />
    </>
  );
}
