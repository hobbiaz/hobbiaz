"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { shortDescription, toDetail, DESC_PREVIEW } from "@/lib/product-detail";
import { copyText } from "@/lib/storage-client";
import { useUI } from "@/providers/UIProvider";
import type { Product, Review } from "@/types";
import { api } from "@/lib/api-client";
import { useProductActions } from "@/hooks/useProductActions";
import {
  IconChevronDown, IconChevronUp, IconFlag, IconPdBack, IconPdBasket, IconPdComment, IconPdHeart,
  IconPdInstagram, IconPdMore, IconPdShare, IconPdTiktok, IconPhone, IconPhoneRevealed, IconShareSmall,
} from "@/components/icons";
import { Discovery } from "./Discovery";
import { ImageLightbox } from "./ImageLightbox";
import { Reviews } from "./Reviews";
import { SellerPanel, type SellerRef } from "./SellerPanel";
import { pressable } from "@/lib/a11y";

const CLOSE_MS = 350;
const LIKED = "#e85c5c";

function PhoneButton({ phone, className, id }: { phone: string; className: string; id?: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <button
      type="button"
      id={id}
      className={`${className}${revealed ? " pd-phone-revealed" : ""}`}
      data-revealed={revealed ? "1" : "0"}
      onClick={() => (revealed && phone ? window.open(`tel:${phone.replace(/\s/g, "")}`) : setRevealed(true))}
    >
      <span className="pd-phone-icon" aria-hidden="true">{revealed ? <IconPhoneRevealed /> : <IconPhone />}</span>
      <span className="pd-phone-text">{revealed ? phone || "Nömrə qeyd olunmayıb" : "Nömrəni göstər"}</span>
    </button>
  );
}

/** Full-screen product page that slides over the feed (legacy #pd-panel). */
export function ProductDetailPanel() {
  const { productId, openProduct, backProduct, toast, isFavorite, toggleFavorite, getProduct, fetchProduct, user, requireAuth } = useUI();
  const actions = useProductActions();
  // Keep rendering the last product during the close animation.
  const [shownId, setShownId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  useEffect(() => {
    if (productId !== null) {
      setShownId(productId);
      setClosing(false);
      return;
    }
    if (shownId === null) return;
    setClosing(true);
    const t = setTimeout(() => { setShownId(null); setClosing(false); }, CLOSE_MS);
    return () => clearTimeout(t);
  }, [productId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cached card data shows instantly; the full record (with rating) is fetched in the background.
  const [full, setFull] = useState<Record<string, Product & { rating?: number | null }>>({});
  const [likeBase, setLikeBase] = useState<Record<string, number>>({});
  const [missing, setMissing] = useState<string | null>(null);
  const product = shownId !== null ? full[shownId] ?? getProduct(shownId) : undefined;
  const detail = useMemo(() => (product ? toDetail(product) : null), [product]);
  useEffect(() => {
    if (shownId === null || shownId.startsWith("demo-") || full[shownId]) return;
    let cancelled = false;
    void fetchProduct(shownId).then((p) => {
      if (cancelled) return;
      if (p) {
        // favoriteCount already includes me if I had saved it: remember the count without me.
        setLikeBase((b) => ({ ...b, [p.id]: (p.favoriteCount ?? 0) - (isFavorite(p.id) ? 1 : 0) }));
        setFull((f) => ({ ...f, [p.id]: p }));
      }
      else if (!getProduct(shownId)) setMissing(shownId);
    });
    return () => { cancelled = true; };
  }, [shownId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (missing === null) return;
    toast("Məhsul tapılmadı və ya silinib");
    setMissing(null);
    backProduct();
  }, [missing, toast, backProduct]);

  const panelRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);
  const [mainImg, setMainImg] = useState(0);
  const [expanded, setExpanded] = useState(false);
  /** Index of the photo open in the full-screen viewer, or null. */
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [reviews, setReviews] = useState<Record<string, Review[]>>({});
  // Real reviews come from the API (demo products keep their built-in ones).
  useEffect(() => {
    if (shownId === null || shownId.startsWith("demo-") || reviews[shownId]) return;
    let cancelled = false;
    api<Review[]>(`/api/listings/${encodeURIComponent(shownId)}/reviews`)
      .then((list) => { if (!cancelled) setReviews((r) => ({ ...r, [shownId]: list })); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [shownId]); // eslint-disable-line react-hooks/exhaustive-deps
  const [seller, setSeller] = useState<SellerRef | null>(null);

  // Reset per-product view state whenever another product is shown.
  useEffect(() => {
    setSlide(0);
    setMainImg(0);
    setExpanded(false);
    setLightbox(null);
    panelRef.current?.scrollTo({ top: 0 });
    trackRef.current?.scrollTo({ left: 0 });
  }, [shownId]);

  if (!detail || !product) {
    return (
      <div id="pd-panel" role="region" aria-label="Məhsul Təfərrüatı" className={shownId !== null ? "pd-open" : undefined}>
        {shownId !== null && <p style={{ padding: "4rem 1.5rem", textAlign: "center", color: "var(--outline)" }}>Yüklənir…</p>}
      </div>
    );
  }

  // Same wishlist as the product cards, so the heart matches everywhere.
  const liked = isFavorite(detail.id);
  const isDemo = detail.id.startsWith("demo-");
  const like = { liked, count: (likeBase[detail.id] ?? (isDemo ? detail.likesCount : Math.max(0, detail.likesCount - (liked ? 1 : 0)))) + (liked ? 1 : 0) };
  const productReviews = reviews[detail.id] ?? detail.demoReviews;
  const isOwner = Boolean(user && user.id === product.ownerId);
  const toggleLike = () => toggleFavorite(detail.id);
  const desc = expanded ? detail.description : shortDescription(detail.description);
  const hasMore = detail.description.length > DESC_PREVIEW;
  const openSeller = (s: SellerRef) => setSeller(s);
  const goTo = (id: string) => { setSeller(null); openProduct(id, true); };

  const share = () => {
    const url = window.location.href.split("#")[0] + "#producto=" + detail.id;
    if (navigator.share) {
      navigator.share({ title: detail.title, text: `${detail.title} – hobbi.az-da tap!`, url }).catch(() => {});
    } else {
      void copyText(url).then(() => toast("Link kopyalandı ✅"));
    }
  };
  const order = () => void actions.order(product);
  const interested = () => void actions.interested(product);
  const report = () => void actions.report(product);
  const submitReview = async (text: string, rating: number) => {
    if (isDemo) {
      setReviews((r) => ({ ...r, [detail.id]: [...productReviews, { id: Date.now(), user: "Siz", avatar: "", text, images: [], replies: [] }] }));
      return true;
    }
    if (!requireAuth("Rəy yazmaq üçün daxil olun")) return false;
    try {
      const created = await api<Review>(`/api/listings/${encodeURIComponent(detail.id)}/reviews`, { method: "POST", body: { body: text, rating } });
      setReviews((r) => ({ ...r, [detail.id]: [created, ...(r[detail.id] ?? [])] }));
      return true;
    } catch (e) {
      toast(e instanceof Error ? e.message : "Xəta");
      return false;
    }
  };
  const replyReview = async (review: Review, text: string) => {
    if (isDemo) {
      setReviews((r) => ({ ...r, [detail.id]: productReviews.map((x) => (x.id === review.id ? { ...x, replies: [...x.replies, { user: "Siz", text }] } : x)) }));
      return;
    }
    try {
      const updated = await api<Review>(`/api/listings/${encodeURIComponent(detail.id)}/reviews`, { method: "PATCH", body: { reviewId: review.id, reply: text } });
      setReviews((r) => ({ ...r, [detail.id]: (r[detail.id] ?? []).map((x) => (x.id === updated.id ? updated : x)) }));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Xəta");
    }
  };
  const scrollToReviews = () => reviewsRef.current?.scrollIntoView({ behavior: "smooth" });
  const priceNumber = detail.price.replace(/\s*AZN/i, "").trim();
  const descToggle = expanded ? <IconChevronUp /> : <IconChevronDown />;

  return (
    <>
      <div
        id="pd-panel"
        ref={panelRef}
        className={closing ? "pd-closing" : "pd-open"}
        role="region"
        aria-label="Məhsul Təfərrüatı"
      >
        <div className="pd-top-grid">
          <div className="pd-gallery-col">
            <div className="pd-thumbs-desktop" id="pd-thumbs-desktop" aria-hidden="true">
              {detail.images.map((src, i) => (
                <button key={src + i} type="button" className={`pd-thumb${mainImg === i ? " active" : ""}`} onClick={() => setMainImg(i)}>
                  <img src={src} alt={`${detail.title} – eskiz ${i + 1}`} />
                </button>
              ))}
            </div>

            <div className="pd-carousel-wrap">
              <div
                className="pd-carousel-track"
                id="pd-track"
                ref={trackRef}
                onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
              >
                {detail.images.map((src, i) => (
                  <div className="pd-carousel-slide pd-zoomable" key={src + i} onClick={() => setLightbox(i)}>
                    <img src={src} alt={detail.title} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                  </div>
                ))}
              </div>
              <div className="pd-main-img-desktop pd-zoomable" id="pd-main-img-desktop" aria-hidden="true" onClick={() => detail.images.length && setLightbox(mainImg)}>
                <img className="pd-main-photo" src={detail.images[mainImg]} alt={detail.title} title="Böyütmək üçün klikləyin" />
                <button
                  type="button"
                  className="pd-fav-desktop"
                  id="pd-fav-desktop"
                  aria-label="Bəyən"
                  onClick={(e) => { e.stopPropagation(); toggleLike(); }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={like.liked ? LIKED : "none"} stroke={like.liked ? LIKED : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7.5 4C4.46 4 2 6.46 2 9.5C2 15 8.5 20 12 21.163C15.5 20 22 15 22 9.5C22 6.46 19.54 4 16.5 4C14.64 4 13 4.92 12 6.34C11 4.92 9.36 4 7.5 4Z" />
                  </svg>
                </button>
                {detail.rating && (
                  <div className="pd-rating-badge-desktop">
                    <span className="pd-rating-num">{detail.rating}</span>
                    <span className="pd-rating-star">★</span>
                  </div>
                )}
              </div>
              <button className="pd-back-btn" id="pd-back-btn" aria-label="Geri" onClick={backProduct}>
                <IconPdBack />
              </button>
              {detail.rating && (
                <div className="pd-rating-badge" id="pd-rating-badge">
                  <span className="pd-rating-num" id="pd-rating-num">{detail.rating}</span>
                  <span className="pd-rating-star">★</span>
                </div>
              )}
              <div className="pd-dots" id="pd-dots" style={{ display: detail.images.length <= 1 ? "none" : "flex" }}>
                {detail.images.map((src, i) => <div key={src + i} className={`pd-dot${slide === i ? " active" : ""}`} />)}
              </div>
              <button className="pd-basket-btn" aria-label="Sifariş et" title="Sifariş et" onClick={order}>
                <IconPdBasket />
              </button>
            </div>
          </div>

          <div className="pd-info-col">
            <header className="pd-header-desktop pd-lg-only">
              <h1 className="pd-title-desktop" id="pd-title-desktop">{detail.title}</h1>
              <div className="pd-header-price-wrap">
                <div className="pd-header-price" id="pd-header-price">{priceNumber} <span>AZN</span></div>
              </div>
            </header>
            <p className="pd-posted-time pd-lg-only" id="pd-posted-time">Paylaşılma vaxtı: {detail.postedAt}</p>

            <div {...pressable} className="pd-seller-card-desktop pd-lg-only" id="pd-seller-card-desktop" onClick={() => openSeller({ name: detail.creator.name, avatar: detail.creator.avatar, slug: detail.creator.slug })}>
              <div className="pd-seller-card-left">
                <div className="pd-seller-card-avatar">
                  {detail.creator.avatar ? <img id="pd-seller-card-img" src={detail.creator.avatar} alt={detail.creator.name} /> : <div className="pd-avatar-fallback">{detail.creator.name[0]}</div>}
                </div>
                <div>
                  <div className="pd-seller-card-name" id="pd-seller-card-name">{detail.creator.name}</div>
                  <div className="pd-seller-card-location" id="pd-seller-card-location">{detail.location}</div>
                </div>
              </div>
              {(detail.creator.instagram || detail.creator.tiktok) && (
                <div className="pd-seller-socials">
                  {detail.creator.instagram && <a href={detail.creator.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" onClick={(e) => e.stopPropagation()}><IconPdInstagram /></a>}
                  {detail.creator.tiktok && <a href={detail.creator.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" onClick={(e) => e.stopPropagation()}><IconPdTiktok /></a>}
                </div>
              )}
            </div>

            <div className="pd-interaction-row pd-mobile-only">
              <div className="pd-actions-left">
                <button className={`pd-act-btn pd-like-btn${like.liked ? " liked" : ""}`} id="pd-like-btn" onClick={toggleLike}>
                  <span className="pd-heart-icon">
                    <IconPdHeart style={{ fill: like.liked ? LIKED : "none", stroke: like.liked ? LIKED : "currentColor" }} />
                  </span>
                  <span id="pd-like-count">{like.count}</span>
                </button>
                <button className="pd-act-btn" onClick={scrollToReviews} aria-label="Rəylər"><IconPdComment /></button>
                <button className="pd-act-btn" onClick={share} aria-label="Paylaş"><IconPdShare /></button>
                <button className="pd-act-btn" aria-label="Şikayət et" title="Şikayət et" onClick={report}><IconPdMore /></button>
              </div>
              <button className="pd-maraqlan-btn" onClick={interested}>Maraqlan</button>
            </div>

            <div className="pd-price-row pd-mobile-only">
              <span className="pd-price-new" id="pd-price-new">{detail.price}</span>
              <span className="pd-price-old" id="pd-price-old" style={{ display: detail.oldPrice ? "inline" : "none" }}>{detail.oldPrice}</span>
            </div>

            <div className="pd-about-desktop pd-lg-only">
              <h4 className="pd-about-title">Haqqında</h4>
              <div className="pd-description">
                <p className="pd-desc-text" id="pd-desc-text-desktop">{desc}</p>
                <button className="pd-desc-toggle" id="pd-desc-toggle-desktop" type="button" style={{ display: hasMore ? "block" : "none" }} onClick={() => setExpanded((x) => !x)}>
                  {descToggle}
                </button>
              </div>
            </div>

            <div className="pd-creator-section pd-mobile-only">
              <div {...pressable} className="pd-creator-row" id="pd-creator-row" onClick={() => openSeller({ name: detail.creator.name, avatar: detail.creator.avatar, slug: detail.creator.slug })}>
                <div className="pd-creator-avatar" id="pd-creator-avatar">
                  {detail.creator.avatar ? <img id="pd-creator-img" src={detail.creator.avatar} alt={detail.creator.name} /> : <div className="pd-avatar-fallback">{detail.creator.name[0]}</div>}
                </div>
                <span className="pd-creator-name" id="pd-creator-name">{detail.creator.name}</span>
              </div>
              <div className="pd-description">
                <p className="pd-desc-text" id="pd-desc-text">{desc}</p>
                <button className="pd-desc-toggle" id="pd-desc-toggle" style={{ display: hasMore ? "block" : "none" }} onClick={() => setExpanded((x) => !x)}>
                  {descToggle}
                </button>
              </div>
            </div>

            <div className="pd-cta-desktop pd-lg-only">
              <button className="pd-order-btn" type="button" onClick={order}>Sifariş et</button>
              <div className="pd-cta-grid">
                <PhoneButton key={`d-${detail.id}`} id="pd-reveal-phone-btn" className="pd-reveal-phone-btn" phone={detail.phone} />
                <button type="button" className="pd-maraqlan-desktop" onClick={interested}>Maraqlan</button>
              </div>
              <div className="pd-footer-links-desktop">
                <button type="button" className="pd-footer-link-btn" onClick={share}>
                  <IconShareSmall />
                  Paylaş
                </button>
                <button type="button" className="pd-footer-link-btn" onClick={report}>
                  <IconFlag />
                  Şikayət et
                </button>
              </div>
            </div>

            <div className="pd-order-btn-wrap pd-mobile-only">
              <button className="pd-order-btn" type="button" onClick={order}>Sifariş et</button>
              <PhoneButton key={`m-${detail.id}`} className="pd-reveal-phone-btn pd-reveal-phone-mobile" phone={detail.phone} />
            </div>
          </div>
        </div>

        <div className="pd-below-section">
          <Discovery productId={detail.id} onOpen={goTo} />
          <Reviews
            ref={reviewsRef}
            reviews={productReviews}
            onSubmit={submitReview}
            onReply={replyReview}
            canReply={isDemo || isOwner}
            canWrite={!isOwner}
            onOpenUser={(name, avatar) => openSeller({ name, avatar })}
          />
        </div>
      </div>

      <SellerPanel seller={seller} onClose={() => setSeller(null)} onOpenProduct={goTo} />
      {lightbox !== null && detail.images.length > 0 && (
        <ImageLightbox
          title={detail.title}
          images={detail.images}
          start={Math.min(lightbox, detail.images.length - 1)}
          liked={like.liked}
          onLike={toggleLike}
          phoneButton={<PhoneButton key={`lb-${detail.id}`} className="pd-reveal-phone-btn lb-phone-btn" phone={detail.phone} />}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
