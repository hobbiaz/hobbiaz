/* ══════════════════════════════════
   PRODUCT DETAIL MODULE
══════════════════════════════════ */
(function() {

/* ── STATE ── */
var _currentProduct = null;
var _historyStack = [];
var _reviewPhotos = [];
var _descExpanded = false;

/* ── PRODUCTS DATA ── (tam genişləndirilmiş data modeli) */
var PD_PRODUCTS = [];

/* This function merges PRODUCTS from the main app into PD_PRODUCTS with extra fields */
function buildPdProducts() {
  if (typeof PRODUCTS === 'undefined') return;
  PD_PRODUCTS = PRODUCTS.map(function(p) {
    var imgs = (p.images && p.images.length) ? p.images.slice() : (p.photo ? [p.photo] : ['https://lh3.googleusercontent.com/aida-public/AB6AXuDumSPXdSSqqxSgDCo_-yY-y9GOpH3VEdKwoyihM1ZPsc7bwKV0uClM-ijrCEFI2uW_iyGYNvpqtmR9q-0rjcMmZw7LmnZRq1rZXQX8frsXo7GahP-0D1DD1c9UzTPWAnTDWrEzvXz6Rpj1h6EdNSb7VaNl58exTntIBAudhdPK-GOB7r84unUqQvZF9lIyH1mHPVDR1ROG2MgYDuGmQaOkZhSoUpLS59R33_tORQ74WvmykPSr-oWvM1P6TqQG-huEF-Qe0JAo6t8']);
    return {
      id: p.id,
      title: p.title,
      images: imgs,
      phone: p.phone || '+994 50 000 00 00',
      postedAt: p.postedAt || '2 saat əvvəl',
      location: p.location || 'Bakı, Azərbaycan',
      price: (p.price || '45') + ' AZN',
      oldPrice: p.oldPrice ? (p.oldPrice + ' AZN') : null,
      rating: '5',
      creator: {
        name: p.shop || 'Hobbi.az',
        avatar: 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=60&h=60&fit=crop&crop=face',
        profileId: 'user_' + p.id
      },
      description: p.desc || (p.title + ' — əl işi, unikal dizayn. Hər bir məhsul xüsusi hazırlanır.'),
      reviews: [
        {
          id: 1,
          user: 'Aynur',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face',
          text: 'Çox gözəl məhsul, gözləntilərimə tam cavab verdi!',
          images: [],
          replies: []
        },
        {
          id: 2,
          user: 'Elçin',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face',
          text: 'Keyfiyyəti mükəmməldir. Tövsiyə edirəm.',
          images: [],
          replies: [{ user: 'Satıcı', text: 'Təşəkkür edirik! 😊' }]
        }
      ],
      isLiked: !!(p.liked),
      likesCount: p.likesCount || (Math.floor(Math.random() * 200) + 20),
      isVideo: !!(p.isVideo),
      videoUrl: p.videoUrl || null
    };
  });
}

/* ── OPEN PRODUCT DETAIL ── */
window.openProductDetail = function(id) {
  buildPdProducts();
  var p = PD_PRODUCTS.find(function(x) { return x.id === id; });
  if (!p) {
    // Fallback: try from PRODUCTS
    if (typeof PRODUCTS !== 'undefined') {
      var raw = PRODUCTS.find(function(x) { return x.id === id; });
      if (raw) {
        buildPdProducts();
        p = PD_PRODUCTS.find(function(x) { return x.id === id; });
      }
    }
    if (!p) return;
  }

  _currentProduct = p;

  // Render
  renderPdCarousel(p);
  renderPdDesktopGallery(p);
  renderPdMeta(p);
  renderPdDiscovery(p);
  renderPdReviews(p);
  renderAdminAdControls();
  resetPdPhoneButtons();

  // Open panel
  var panel = document.getElementById('pd-panel');
  panel.scrollTop = 0;
  panel.classList.remove('pd-closing');
  panel.classList.add('pd-open');

  // Lock body scroll
  document.body.style.overflow = 'hidden';

  // Update navbar: only home icon filled
  updateNavbarForDetail(true);

  // Push browser history
  history.pushState({ pdOpen: true, pdId: id }, '', '#producto=' + id);
};

/* ── OVERRIDE openProductModal ── redirect to our new panel */
var _origOpenProductModal = window.openProductModal;
window.openProductModal = function(id) {
  openProductDetail(id);
};

/* ── CLOSE ── */
window.closePdPanel = function() {
  var panel = document.getElementById('pd-panel');
  panel.classList.remove('pd-open');
  panel.classList.add('pd-closing');
  document.body.style.overflow = '';
  updateNavbarForDetail(false);
  _currentProduct = null;
  _historyStack = [];
  setTimeout(function() {
    panel.classList.remove('pd-closing');
  }, 350);
};

/* ── BACK button: navigate history stack ── */
document.getElementById('pd-back-btn').addEventListener('click', function() {
  if (_historyStack.length > 0) {
    var prevId = _historyStack.pop();
    // Open previous product without pushing new history
    buildPdProducts();
    var p = PD_PRODUCTS.find(function(x) { return x.id === prevId; });
    if (p) {
      _currentProduct = p;
      var panel = document.getElementById('pd-panel');
      panel.scrollTop = 0;
      renderPdCarousel(p);
      renderPdDesktopGallery(p);
      renderPdMeta(p);
      renderPdDiscovery(p);
      renderPdReviews(p);
      resetPdPhoneButtons();
    }
  } else {
    if (window.history.state && window.history.state.pdOpen) {
      history.back();
    } else {
      closePdPanel();
    }
  }
});

window.addEventListener('popstate', function(e) {
  if (e.state && e.state.pdOpen) return;
  var panel = document.getElementById('pd-panel');
  if (panel.classList.contains('pd-open')) {
    closePdPanel();
  }
});

/* ── RENDER CAROUSEL ── */
function renderPdCarousel(p) {
  var track = document.getElementById('pd-track');
  var dotsEl = document.getElementById('pd-dots');
  var imgs = p.images && p.images.length ? p.images : [''];

  track.innerHTML = '';
  dotsEl.innerHTML = '';

  imgs.forEach(function(src, i) {
    var slide = document.createElement('div');
    slide.className = 'pd-carousel-slide';
    if (p.isVideo && p.videoUrl && i === 0) {
      slide.innerHTML = '<video src="' + p.videoUrl + '" autoplay loop muted playsinline></video>';
    } else {
      slide.innerHTML = '<img src="' + src + '" alt="' + (p.title || '') + '" onerror="this.style.display=\'none\'">';
    }
    track.appendChild(slide);

    var dot = document.createElement('div');
    dot.className = 'pd-dot' + (i === 0 ? ' active' : '');
    dotsEl.appendChild(dot);
  });

  // Hide dots if only 1 image
  dotsEl.style.display = imgs.length <= 1 ? 'none' : 'flex';

  // Scroll → dots sync
  track.addEventListener('scroll', function() {
    var idx = Math.round(track.scrollLeft / track.clientWidth);
    var dots = dotsEl.querySelectorAll('.pd-dot');
    dots.forEach(function(d, i) { d.classList.toggle('active', i === idx); });
  }, { passive: true });

  // Rating
  document.getElementById('pd-rating-num').textContent = p.rating || '5';
}

/* ── DESKTOP GALLERY (thumbnails + main image) ── */
function renderPdDesktopGallery(p) {
  var thumbsEl = document.getElementById('pd-thumbs-desktop');
  var mainEl = document.getElementById('pd-main-img-desktop');
  if (!thumbsEl || !mainEl) return;

  var imgs = p.images && p.images.length ? p.images : [''];
  var title = p.title || '';

  thumbsEl.innerHTML = '';
  imgs.forEach(function(src, i) {
    var thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.className = 'pd-thumb' + (i === 0 ? ' active' : '');
    thumb.innerHTML = '<img src="' + src + '" alt="' + title + ' – eskiz ' + (i + 1) + '">';
    thumb.addEventListener('click', function() {
      thumbsEl.querySelectorAll('.pd-thumb').forEach(function(t) { t.classList.remove('active'); });
      thumb.classList.add('active');
      var mainImg = mainEl.querySelector('.pd-main-photo');
      if (mainImg) mainImg.src = src;
    });
    thumbsEl.appendChild(thumb);
  });

  var liked = p.isLiked;
  mainEl.innerHTML =
    '<img class="pd-main-photo" src="' + imgs[0] + '" alt="' + title + '">'
    + '<button type="button" class="pd-fav-desktop" id="pd-fav-desktop" aria-label="Bəyən">'
    + '<svg width="22" height="22" viewBox="0 0 24 24" fill="' + (liked ? '#e85c5c' : 'none') + '" stroke="' + (liked ? '#e85c5c' : 'currentColor') + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M7.5 4C4.46 4 2 6.46 2 9.5C2 15 8.5 20 12 21.163C15.5 20 22 15 22 9.5C22 6.46 19.54 4 16.5 4C14.64 4 13 4.92 12 6.34C11 4.92 9.36 4 7.5 4Z"/></svg>'
    + '</button>'
    + '<div class="pd-rating-badge-desktop">'
    + '<span class="pd-rating-num">' + (p.rating || '5') + '</span>'
    + '<span class="pd-rating-star">★</span>'
    + '</div>';

  var favBtn = document.getElementById('pd-fav-desktop');
  if (favBtn) favBtn.addEventListener('click', function(e) { e.stopPropagation(); pdToggleLike(); });
}

/* ── RENDER META ── */
function renderPdMeta(p) {
  // Price
  document.getElementById('pd-price-new').textContent = p.price || '';
  document.getElementById('pd-price-old').textContent = p.oldPrice || '';
  document.getElementById('pd-price-old').style.display = p.oldPrice ? 'inline' : 'none';

  // Like
  var likeBtn = document.getElementById('pd-like-btn');
  var heartSvg = document.getElementById('pd-heart-svg');
  document.getElementById('pd-like-count').textContent = p.likesCount || 0;
  if (p.isLiked) {
    likeBtn.classList.add('liked');
    heartSvg.style.fill = '#e85c5c';
    heartSvg.style.stroke = '#e85c5c';
  } else {
    likeBtn.classList.remove('liked');
    heartSvg.style.fill = 'none';
    heartSvg.style.stroke = 'currentColor';
  }

  // Creator
  document.getElementById('pd-creator-name').textContent = p.creator ? p.creator.name : '';
  var img = document.getElementById('pd-creator-img');
  img.src = p.creator ? (p.creator.avatar || '') : '';
  img.alt = p.creator ? p.creator.name : '';

  var creatorRow = document.getElementById('pd-creator-row');
  creatorRow.onclick = function() {
    if (p.creator) openPdSeller(p.creator, p);
  };

  // Description
  _descExpanded = false;
  var descEl = document.getElementById('pd-desc-text');
  var full = p.description || '';
  var short = full.length > 80 ? full.substring(0, 80) + '...' : full;
  descEl.textContent = short;
  descEl._full = full;
  descEl._short = short;

  var toggleBtn = document.getElementById('pd-desc-toggle');
  toggleBtn.style.display = full.length > 80 ? 'block' : 'none';
  toggleBtn.onclick = function() {
    _descExpanded = !_descExpanded;
    descEl.textContent = _descExpanded ? full : short;
    toggleBtn.innerHTML = _descExpanded
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="18 15 12 9 6 15"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 12 15 18 9"/></svg>';
  };

  // Desktop header, seller card, about
  var titleDesktop = document.getElementById('pd-title-desktop');
  if (titleDesktop) titleDesktop.textContent = p.title || '';

  var headerPrice = document.getElementById('pd-header-price');
  if (headerPrice) {
    var priceNum = (p.price || '').replace(/\s*AZN/i, '').trim();
    headerPrice.innerHTML = priceNum + ' <span>AZN</span>';
  }

  var postedEl = document.getElementById('pd-posted-time');
  if (postedEl) postedEl.textContent = 'Paylaşılma vaxtı: ' + (p.postedAt || '2 saat əvvəl');

  var sellerCard = document.getElementById('pd-seller-card-desktop');
  var sellerName = document.getElementById('pd-seller-card-name');
  var sellerImg = document.getElementById('pd-seller-card-img');
  var sellerLoc = document.getElementById('pd-seller-card-location');
  if (sellerName) sellerName.textContent = p.creator ? p.creator.name : '';
  if (sellerImg && p.creator) {
    sellerImg.src = p.creator.avatar || '';
    sellerImg.alt = p.creator.name || '';
  }
  if (sellerLoc) sellerLoc.textContent = p.location || 'Bakı, Azərbaycan';
  if (sellerCard) {
    sellerCard.onclick = function() {
      if (p.creator) openPdSeller(p.creator, p);
    };
  }

  var descDesktop = document.getElementById('pd-desc-text-desktop');
  var toggleDesktop = document.getElementById('pd-desc-toggle-desktop');
  if (descDesktop) {
    descDesktop.textContent = short;
    descDesktop._full = full;
    descDesktop._short = short;
  }
  if (toggleDesktop) {
    toggleDesktop.style.display = full.length > 80 ? 'block' : 'none';
    toggleDesktop.onclick = function() {
      _descExpanded = !_descExpanded;
      if (descDesktop) descDesktop.textContent = _descExpanded ? full : short;
      toggleDesktop.innerHTML = _descExpanded
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="18 15 12 9 6 15"/></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 12 15 18 9"/></svg>';
    };
  }
}

function resetPdPhoneButtons() {
  document.querySelectorAll('.pd-reveal-phone-btn').forEach(function(btn) {
    btn.dataset.revealed = '0';
    btn.classList.remove('pd-phone-revealed');
    var textEl = btn.querySelector('.pd-phone-text');
    if (textEl) textEl.textContent = 'Nömrəni göstər';
    var iconWrap = btn.querySelector('.pd-phone-icon');
    if (iconWrap) {
      iconWrap.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>';
    }
  });
}

window.pdRevealPhone = function(btn) {
  var p = _currentProduct;
  if (!p || !btn || btn.dataset.revealed === '1') return;
  btn.dataset.revealed = '1';
  var textEl = btn.querySelector('.pd-phone-text');
  if (textEl) textEl.textContent = p.phone || '+994 50 000 00 00';
  var iconWrap = btn.querySelector('.pd-phone-icon');
  if (iconWrap) {
    iconWrap.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#25D366" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  }
  btn.classList.add('pd-phone-revealed');
};

/* ── RENDER DISCOVERY ── */
function renderPdDiscovery(p) {
  buildPdProducts();
  var others = PD_PRODUCTS.filter(function(x) { return x.id !== p.id; });
  // Shuffle
  others.sort(function() { return Math.random() - .5; });

  var grid = document.getElementById('pd-discovery-grid');
  if (!grid) {
    // Fallback: try old column approach
    var leftCol = document.getElementById('pd-col-left');
    var rightCol = document.getElementById('pd-col-right');
    if (leftCol) leftCol.innerHTML = '';
    if (rightCol) rightCol.innerHTML = '';
    return;
  }
  grid.innerHTML = '';

  others.slice(0, 8).forEach(function(item) {
    var card = document.createElement('div');
    card.className = 'pd-rec-card';
    card.onclick = function() {
      if (_currentProduct) _historyStack.push(_currentProduct.id);
      openProductDetail(item.id);
    };

    if (item.isVideo && item.videoUrl) {
      card.innerHTML = '<video src="' + item.videoUrl + '" autoplay loop muted playsinline></video>'
        + '<span class="pd-rec-price">' + (item.price || '') + '</span>';
    } else {
      card.innerHTML = '<img src="' + (item.images[0] || '') + '" alt="' + item.title + '" loading="lazy">'
        + '<span class="pd-rec-price">' + (item.price || '') + '</span>';
    }
    grid.appendChild(card);
  });

  // Ad card
  grid.appendChild(buildAdCard());
}

/* ── BUILD AD CARD ── */
function buildAdCard() {
  var div = document.createElement('div');
  div.className = 'pd-ad-card';
  div.id = 'pd-ad-card';

  var adData = getAdData();
  div.innerHTML =
    '<div class="pd-ad-top">'
    + '<img class="pd-ad-logo" src="' + adData.logo + '" alt="' + adData.title + '">'
    + '<span class="pd-ad-arrow">↗</span>'
    + '</div>'
    + '<div><div class="pd-ad-title">' + adData.title + '</div>'
    + '<div class="pd-ad-sub">' + adData.sub + '</div>'
    + '<div class="pd-ad-sponsored"><div class="pd-ad-check"><svg width="8" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round"/></svg></div><span class="pd-ad-sponsored-text">SPONSORLU</span></div>'
    + '</div>'
    + '<div class="pd-ad-admin-controls" id="pd-ad-admin-ctrls">'
    + '<button class="pd-admin-btn" onclick="pdAdEdit()">Dəyiş</button>'
    + '<button class="pd-admin-btn" onclick="pdAdDelete()">Sil</button>'
    + '</div>';

  if (adData.link) {
    div.style.cursor = 'pointer';
    div.addEventListener('click', function(e) {
      if (e.target.classList.contains('pd-admin-btn')) return;
      window.open(adData.link, '_blank');
    });
  }

  renderAdminAdControls();
  return div;
}

function getAdData() {
  var stored = null;
  try { stored = JSON.parse(localStorage.getItem('pd_ad_data')); } catch(e) {}
  return stored || {
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0dBj8SKkpqVnMuYQo1pRdu_Fd9NS4ZAp5V1TAFMyHalGFh-eyNA8z5Agcqa0N-AGAY9m8jj-kNf2WhM3bRhyY1oQNahtb0Vx187etJwJmThU1rN-oqF5v9twGHeVpu2xJyor1GWi6cxwDSqoNaYQtTDrSz23Qqe7AbLyiT9lHHSKbfoPEEoRFTgBkoijzNleBsDrwBkKDPpWWGLgzqDzVsreh_qvc0NK242YoayHw90CX0nUxLIrexNcewh1OoJx4-fVuXwWM_wI',
    title: 'Yükləyin',
    sub: 'Duolingo: Dil Dərsləri',
    link: 'https://duolingo.com'
  };
}

function renderAdminAdControls() {
  setTimeout(function() {
    var ctrls = document.getElementById('pd-ad-admin-ctrls');
    if (!ctrls) return;
    var isAdmin = localStorage.getItem('isAdmin') === 'true';
    ctrls.classList.toggle('show', isAdmin);
  }, 100);
}

window.pdAdEdit = function() {
  var logo = prompt('Reklam logo URL:', getAdData().logo);
  if (logo === null) return;
  var title = prompt('Reklam başlığı:', getAdData().title);
  if (title === null) return;
  var sub = prompt('Alt mətn:', getAdData().sub);
  if (sub === null) return;
  var link = prompt('Link URL:', getAdData().link || '');
  localStorage.setItem('pd_ad_data', JSON.stringify({ logo: logo, title: title, sub: sub, link: link }));
  if (_currentProduct) renderPdDiscovery(_currentProduct);
  if (typeof showToast === 'function') showToast('Reklam yeniləndi ✅');
};

window.pdAdDelete = function() {
  if (!confirm('Reklamı silmək istəyirsiniz?')) return;
  localStorage.removeItem('pd_ad_data');
  if (_currentProduct) renderPdDiscovery(_currentProduct);
};

/* ── RENDER REVIEWS ── */
function renderPdReviews(p) {
  var listEl = document.getElementById('pd-reviews-list');
  listEl.innerHTML = '';

  var reviews = (p.reviews || []).concat(p._extraReviews || []);
  reviews.forEach(function(r) {
    listEl.appendChild(buildReviewItem(r, p));
  });
}

function buildReviewItem(r, p) {
  var wrap = document.createElement('div');
  wrap.className = 'pd-review-item';
  wrap.dataset.reviewId = r.id;

  var avatarHtml = r.avatar
    ? '<img src="' + r.avatar + '" alt="' + r.user + '" onerror="this.outerHTML=\'<div style=\\\'width:100%;height:100%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem\\\'>' + (r.user[0] || '?') + '</div>\'">'
    : '<div style="width:100%;height:100%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem">' + (r.user[0] || '?') + '</div>';

  var imgsHtml = '';
  if (r.images && r.images.length) {
    imgsHtml = '<div class="pd-review-images">' + r.images.map(function(src) {
      return '<img class="pd-review-img" src="' + src + '" alt="">';
    }).join('') + '</div>';
  }

  var repliesHtml = '';
  if (r.replies && r.replies.length) {
    repliesHtml = '<div class="pd-replies">' + r.replies.map(function(rep) {
      return '<div class="pd-reply-item"><div class="pd-reply-avatar">' + (rep.user[0] || '?') + '</div>'
        + '<div class="pd-reply-body"><div class="pd-reply-user">' + rep.user + '</div>'
        + '<div class="pd-reply-text">' + rep.text + '</div></div></div>';
    }).join('') + '</div>';
  }

  wrap.innerHTML =
    '<div class="pd-review-avatar" onclick="openPdUserProfile(\'' + r.user + '\', \'' + (r.avatar || '') + '\')">' + avatarHtml + '</div>'
    + '<div class="pd-review-body">'
    + '<div class="pd-review-header">'
    + '<span class="pd-review-user" onclick="openPdUserProfile(\'' + r.user + '\', \'' + (r.avatar || '') + '\')">' + r.user + '</span>'
    + '</div>'
    + '<div class="pd-review-text">' + r.text + '</div>'
    + imgsHtml
    + '<div class="pd-review-actions"><button class="pd-reply-btn" onclick="pdToggleReplyForm(this,' + r.id + ')">Cavab yaz</button></div>'
    + '<div class="pd-reply-form" id="pd-reply-form-' + r.id + '">'
    + '<input type="text" class="pd-reply-input" placeholder="Cavabınızı yazın...">'
    + '<button class="pd-reply-send" onclick="pdSendReply(' + r.id + ', this)">Göndər</button>'
    + '</div>'
    + repliesHtml
    + '</div>';

  return wrap;
}

/* ── TOGGLE REPLY FORM ── */
window.pdToggleReplyForm = function(btn, reviewId) {
  var form = document.getElementById('pd-reply-form-' + reviewId);
  if (!form) return;
  var isOpen = form.classList.toggle('open');
  btn.textContent = isOpen ? 'Ləğv et' : 'Cavab yaz';
  if (isOpen) form.querySelector('.pd-reply-input').focus();
};

/* ── SEND REPLY ── */
window.pdSendReply = function(reviewId, btn) {
  var form = document.getElementById('pd-reply-form-' + reviewId);
  if (!form) return;
  var input = form.querySelector('.pd-reply-input');
  var text = input.value.trim();
  if (!text) return;

  // Add reply to data
  var p = _currentProduct;
  if (!p) return;
  var review = (p.reviews || []).concat(p._extraReviews || []).find(function(r) { return r.id === reviewId; });
  if (!review) return;
  if (!review.replies) review.replies = [];
  review.replies.push({ user: 'Siz', text: text });

  // Re-render
  renderPdReviews(p);

  input.value = '';
  form.classList.remove('open');
};

/* ── ADD REVIEW PHOTOS ── */
window.pdAddReviewPhotos = function(input) {
  var files = Array.from(input.files);
  var container = document.getElementById('pd-photo-previews');

  files.forEach(function(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var src = e.target.result;
      _reviewPhotos.push(src);

      var wrap = document.createElement('div');
      wrap.className = 'pd-photo-thumb-wrap';
      var idx = _reviewPhotos.length - 1;
      wrap.innerHTML = '<img class="pd-photo-thumb" src="' + src + '">'
        + '<button class="pd-photo-thumb-remove" onclick="pdRemoveReviewPhoto(' + idx + ')">✕</button>';
      container.appendChild(wrap);
    };
    reader.readAsDataURL(file);
  });
  input.value = '';
};

window.pdRemoveReviewPhoto = function(idx) {
  _reviewPhotos.splice(idx, 1);
  var container = document.getElementById('pd-photo-previews');
  var items = container.querySelectorAll('.pd-photo-thumb-wrap');
  if (items[idx]) items[idx].remove();
  // Re-index buttons
  container.querySelectorAll('.pd-photo-thumb-remove').forEach(function(btn, i) {
    btn.setAttribute('onclick', 'pdRemoveReviewPhoto(' + i + ')');
  });
};

/* ── SUBMIT REVIEW ── */
window.pdSubmitReview = function() {
  var textarea = document.getElementById('pd-review-input');
  var text = textarea.value.trim();
  if (!text) { if (typeof showToast === 'function') showToast('Zəhmət olmasa rəy yazın'); return; }

  var p = _currentProduct;
  if (!p) return;
  if (!p._extraReviews) p._extraReviews = [];

  var newReview = {
    id: Date.now(),
    user: 'Siz',
    avatar: '',
    text: text,
    images: _reviewPhotos.slice(),
    replies: []
  };
  p._extraReviews.push(newReview);

  textarea.value = '';
  _reviewPhotos = [];
  document.getElementById('pd-photo-previews').innerHTML = '';
  renderPdReviews(p);
  if (typeof showToast === 'function') showToast('Rəyiniz əlavə edildi ✅');

  // Scroll to reviews
  setTimeout(function() {
    var el = document.getElementById('pd-reviews-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, 150);
};

/* ── LIKE ── */
window.pdToggleLike = function() {
  var p = _currentProduct;
  if (!p) return;
  p.isLiked = !p.isLiked;
  p.likesCount = p.isLiked ? p.likesCount + 1 : p.likesCount - 1;

  var likeBtn = document.getElementById('pd-like-btn');
  var heartSvg = document.getElementById('pd-heart-svg');
  var countEl = document.getElementById('pd-like-count');

  likeBtn.classList.toggle('liked', p.isLiked);
  heartSvg.style.fill = p.isLiked ? '#e85c5c' : 'none';
  heartSvg.style.stroke = p.isLiked ? '#e85c5c' : 'currentColor';
  countEl.textContent = p.likesCount;

  var favDesktop = document.getElementById('pd-fav-desktop');
  if (favDesktop) {
    var favSvg = favDesktop.querySelector('svg');
    if (favSvg) {
      favSvg.setAttribute('fill', p.isLiked ? '#e85c5c' : 'none');
      favSvg.setAttribute('stroke', p.isLiked ? '#e85c5c' : 'currentColor');
    }
  }

  // Animate
  likeBtn.classList.add('liked');
  setTimeout(function() {
    if (!p.isLiked) likeBtn.classList.remove('liked');
  }, 300);
};

/* ── SHARE ── */
window.pdShare = function() {
  var p = _currentProduct;
  if (!p) return;
  var url = window.location.href.split('#')[0] + '#producto=' + p.id;
  var text = p.title + ' – hobbi.az-da tap!';

  if (navigator.share) {
    navigator.share({ title: p.title, text: text, url: url }).catch(function() {});
  } else {
    navigator.clipboard ? navigator.clipboard.writeText(url).then(function() {
      if (typeof showToast === 'function') showToast('Link kopyalandı ✅');
    }) : (function() {
      var t = document.createElement('textarea');
      t.value = url;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      document.body.removeChild(t);
      if (typeof showToast === 'function') showToast('Link kopyalandı ✅');
    })();
  }
};

/* ── MARAQLAN ── */
window.pdMaraqlan = function() {
  var p = _currentProduct;
  if (!p) return;
  if (typeof showToast === 'function') showToast('Satıcı ilə əlaqə başladıldı 📩');
};

/* ── SİFARİŞ ET ── */
window.pdSifarish = function() {
  if (typeof showToast === 'function') showToast('Sifariş tamamlandı! Tezliklə əlaqə saxlanılacaq 🎉');
};

/* ── ADD TO CART ── */
window.pdAddToCart = function() {
  if (typeof addToCart === 'function' && _currentProduct) addToCart(_currentProduct.id);
  if (typeof showToast === 'function') showToast('Səbətə əlavə edildi 🛒');
};

/* ── SCROLL TO REVIEWS ── */
window.pdScrollToReviews = function() {
  var el = document.getElementById('pd-reviews-section');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

/* ── SELLER PROFILE ── */
window.openPdSeller = function(creator, product) {
  document.getElementById('pd-seller-name').textContent = creator.name;
  document.getElementById('pd-seller-meta').textContent = 'Hobbi.az satıcısı • Reytinq: 4.9 ★';
  var img = document.getElementById('pd-seller-avatar-img');
  img.src = creator.avatar || '';
  img.alt = creator.name;

  // Fill seller products grid with same-shop items
  buildPdProducts();
  var grid = document.getElementById('pd-seller-grid');
  grid.innerHTML = '';
  var sellerProducts = PD_PRODUCTS.filter(function(p) {
    return p.creator && p.creator.name === creator.name;
  }).slice(0, 6);
  if (!sellerProducts.length) sellerProducts = PD_PRODUCTS.slice(0, 4);

  sellerProducts.forEach(function(sp) {
    var card = document.createElement('div');
    card.className = 'pd-seller-card';
    card.onclick = function() {
      closePdSeller();
      if (_currentProduct) _historyStack.push(_currentProduct.id);
      openProductDetail(sp.id);
    };
    card.innerHTML = '<img src="' + (sp.images[0] || '') + '" alt="' + sp.title + '" loading="lazy">'
      + '<div class="pd-seller-card-info"><div class="pd-seller-card-title">' + sp.title + '</div>'
      + '<div class="pd-seller-card-price">' + sp.price + '</div></div>';
    grid.appendChild(card);
  });

  document.getElementById('pd-seller-panel').classList.add('open');
};

window.closePdSeller = function() {
  document.getElementById('pd-seller-panel').classList.remove('open');
};

/* ── USER PROFILE CLICK ON REVIEWER ── */
window.openPdUserProfile = function(name, avatar) {
  openPdSeller({ name: name, avatar: avatar, profileId: 'review_user' }, _currentProduct);
};

/* ── NAVBAR STATE ── */
function updateNavbarForDetail(isOpen) {
  var bnHome = document.getElementById('bn-home');
  var bnVideo = document.getElementById('bn-video');
  var bnSearch = document.getElementById('bn-search');
  var bnMsg = document.getElementById('bn-messages');
  var bnProfile = document.getElementById('bn-profile');

  if (isOpen) {
    // Home filled, rest outline
    [bnHome, bnVideo, bnSearch, bnMsg, bnProfile].forEach(function(el) {
      if (!el) return;
      el.classList.remove('active');
      el.querySelectorAll('.icon-filled').forEach(function(i) { i.style.display = 'none'; });
      el.querySelectorAll('.icon-outline').forEach(function(i) { i.style.display = 'inline-flex'; });
    });
    if (bnHome) {
      bnHome.classList.add('active');
      bnHome.querySelectorAll('.icon-outline').forEach(function(i) { i.style.display = 'none'; });
      bnHome.querySelectorAll('.icon-filled').forEach(function(i) { i.style.display = 'inline-flex'; });
    }
  } else {
    // Restore all
    [bnHome, bnVideo, bnSearch, bnMsg, bnProfile].forEach(function(el) {
      if (!el) return;
      el.querySelectorAll('.icon-filled, .icon-outline').forEach(function(i) { i.style.display = ''; });
    });
  }
}

})();


const PRODUCTS=[
  {id:0,title:"Gümüşü Minimalist Sırğalar",price:"45",oldPrice:"89",shop:"ZərgərStudio",badge:null,
   color:"#c8d8e4",cat:"zergerllik",emoji:"💍",phone:"+994 50 111 22 33",
   photo:"https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=500&fit=crop",
   images:["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=500&fit=crop","https://images.unsplash.com/photo-1611591437281-460bfbeff0a5?w=400&h=500&fit=crop","https://images.unsplash.com/photo-1605100804763-247f67b35585?w=400&h=500&fit=crop"],
   desc:"Gümüş ərintilərdən əl ilə hazırlanmış minimalist sırğalar."},
  {id:1,title:"Dəri Üzlük (Sifarişlə)",price:"32",oldPrice:"58",shop:"DəriSənət",badge:"YENİ",
   color:"#d4a57a",cat:"digər",emoji:"👜",phone:"+994 50 222 33 44",
   photo:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop",
   images:["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop","https://images.unsplash.com/photo-1590874103328-eac03a683814?w=400&h=400&fit=crop","https://images.unsplash.com/photo-1584917865442-de89d76c862a?w=400&h=400&fit=crop"],
   desc:"Sifarişlə hazırlanan natürel dəri üzlük."},
  {id:2,title:"Taxta Masaüstü Düzənləyici",price:"28",oldPrice:"45",shop:"ağacMaster",badge:null,
   color:"#b5977a",cat:"agac",emoji:"🪵",phone:"+994 50 333 44 55",
   photo:"https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=520&fit=crop",
   images:["https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=520&fit=crop","https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=520&fit=crop","https://images.unsplash.com/photo-1616628188859-7a11abb6fcc8?w=400&h=520&fit=crop"],
   desc:"Qoz ağacından hazırlanmış masaüstü düzənləyici."},
  {id:3,title:"Rəngli Keramika Fincanlar",price:"18",oldPrice:"35",shop:"GilStudio",badge:"POPULYAR",
   color:"#7eb8a0",cat:"keramika",emoji:"🏺",phone:"+994 50 444 55 66",
   photo:"https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop",
   images:["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop","https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop","https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=400&h=400&fit=crop"],
   desc:"Əl ilə şəkilləndirilmiş unikal rəngarəng sırlı keramika fincanlar."},
  {id:4,title:"Əl İşi Macramé",price:"55",oldPrice:"90",shop:"LifeDecor",badge:null,
   color:"#c9b8d0",cat:"toxuculuq",emoji:"🧵",phone:"+994 50 555 66 77",
   photo:"https://images.unsplash.com/photo-1558171813-30e3c04a7db8?w=400&h=520&fit=crop",
   images:["https://images.unsplash.com/photo-1558171813-30e3c04a7db8?w=400&h=520&fit=crop","https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=520&fit=crop","https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&h=520&fit=crop"],
   desc:"Premium pambıq ipindən hazırlanmış divar dekorasiyası."},
  {id:5,title:"Akvarel Çiçək Tablosu",price:"80",oldPrice:"130",shop:"ArtByLeyla",badge:"ENDİRİM",
   color:"#e8c4b8",cat:"resm",emoji:"🎨",phone:"+994 50 666 77 88",
   photo:"https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop",
   images:["https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop","https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop","https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&h=400&fit=crop"],
   desc:"Rəssam Leyla tərəfindən əl ilə çəkilmiş A3 formatlı akvarel tablosu."},
  {id:6,title:"Abstrakt Kətan (Sifarişlə)",price:"120",oldPrice:"190",shop:"RəqəmsalArt",badge:"POPULYAR",
   color:"#7a9e87",cat:"resm",emoji:"🖼️",phone:"+994 50 777 88 99",
   photo:"https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&h=520&fit=crop",
   images:["https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&h=520&fit=crop","https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=520&fit=crop","https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=520&fit=crop"],
   desc:"Müştəri tələbinə uyğun abstrakt kətan rəsm. Çatdırılma 7–10 gün."},
  {id:7,title:"Minimal Keramika Vaza",price:"35",oldPrice:"62",shop:"GilStudio",badge:null,
   color:"#c5cfe0",cat:"keramika",emoji:"🏺",phone:"+994 50 888 99 00",
   photo:"https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=400&h=400&fit=crop",
   images:["https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=400&h=400&fit=crop","https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop","https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop"],
   desc:"Skandinav üslubunda minimal dizaynlı ağ keramika vaza."},
  {id:8,title:"Ağac Çərçivə Güzgü",price:"42",oldPrice:"75",shop:"ağacMaster",badge:"YENİ",
   color:"#c4a882",cat:"agac",emoji:"🪞",phone:"+994 50 999 00 11",
   photo:"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=520&fit=crop",
   images:["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=520&fit=crop","https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=520&fit=crop","https://images.unsplash.com/photo-1616628188859-7a11abb6fcc8?w=400&h=520&fit=crop"],
   desc:"Əl işi ağac çərçivəli divar güzgüsü."},
  {id:9,title:"İpək Boyunbağı Dəsti",price:"68",oldPrice:"110",shop:"ZərgərStudio",badge:"POPULYAR",
   color:"#e8d5b0",cat:"zergerllik",emoji:"📿",phone:"+994 50 000 00 00",
   photo:"https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop",
   images:["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop","https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop","https://images.unsplash.com/photo-1611591437281-460bfbeff0a5?w=400&h=400&fit=crop"],
   desc:"Əl ilə toxunmuş ipək saplardan hazırlanmış boyunbağı dəsti."},
];

const IDEAS=[
  {title:"Gil qabı necə hazırlanır?",views:"12.5K baxış",color:"#5a6a5c",emoji:"🏺"},
  {title:"Akvarel texnikası: Çiçəklər",views:"8.2K baxış",color:"#8a6a50",emoji:"🎨"},
  {title:"Dəri emalı dərsləri",views:"24.1K baxış",color:"#4a5a68",emoji:"👜"},
  {title:"Gümüş zinət əşyaları",views:"5.9K baxış",color:"#2d3d50",emoji:"💍"},
];
const VIDEOS=[
  {title:"Əl işi Turkuaz Vaza",creator:"@keramika_dunyam",badge:"YARADICI",price:"120 AZN",views:"12.4K",likes:"2.1K",comments:"45",
   gradient:"linear-gradient(135deg,#1a4a40,#006b58,#0a8a6d)",emoji:"🏺"},
  {title:"Gümüş üzük sənəti",creator:"@zergerstudio",badge:"POPULYAR",price:"85 AZN",views:"8.7K",likes:"1.4K",comments:"32",
   gradient:"linear-gradient(135deg,#2d3a4a,#3d5a6a,#4a7a8a)",emoji:"💍"},
  {title:"Akvarel çiçəklər",creator:"@artbyleyla",badge:"YARADICI",price:"60 AZN",views:"15.2K",likes:"3.2K",comments:"78",
   gradient:"linear-gradient(135deg,#4a2a3a,#7a3a5a,#944a6a)",emoji:"🎨"},
];
const PROFILE_PRODUCTS=[
  {title:"Minimalist Vaza",price:"45.00 AZN",color:"#c0c8d0",badge:null,emoji:"🏺"},
  {title:"Abstrakt Kətan (Sifarişlə)",price:"120.00 AZN",color:"#2d6a50",badge:"POPULYAR",emoji:"🖼️"},
  {title:"Rəqəmsal Print",price:"15.00 AZN",color:"#5a7a8a",badge:null,emoji:"🎨"},
];

function makeProductCard(p, i) {
  const isLiked = p.liked ?? (i === 0 || i === 3 || i === 4);
  const priceCurrent = `${p.price || '45'} ₼`;
  const priceOld = p.oldPrice ? `${p.oldPrice} ₼` : '';
  return `
    <article class="card product-card fade-up" style="animation-delay:${i*.05}s" onclick="openProductModal(${p.id})">
      <div class="card-image-wrapper product-img-wrap">
        <img class="card-image pimg pimg-photo" src="${p.photo}" alt="${p.title}"
          onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="pimg card-image-fallback" style="background:${p.color};display:none;border-radius:16px" aria-hidden="true">${p.emoji}</div>
        <button type="button" class="wishlist-btn${isLiked ? ' is-active' : ''}"
          aria-label="${isLiked ? 'İstək siyahısından çıxart' : 'İstək siyahısına əlavə et'}"
          aria-pressed="${isLiked}"
          data-liked="${isLiked}"
          onclick="event.stopPropagation();toggleWishSvg(this)">
          <svg class="heart-outline" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.5 4C4.4625 4 2 6.4625 2 9.5C2 15 8.5 20 12 21.163C15.5 20 22 15 22 9.5C22 6.4625 19.5375 4 16.5 4C14.64 4 12.995 4.9235 12 6.337C11.4928 5.61469 10.819 5.0252 10.0357 4.61841C9.25238 4.21162 8.38263 3.9995 7.5 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <svg class="heart-filled" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M17 4.5C14.9 4.5 13.05 5.55 12 7.2C10.95 5.55 9.1 4.5 7 4.5C3.7 4.5 1 7.2 1 10.5C1 16.45 12 22.5 12 22.5C12 22.5 23 16.5 23 10.5C23 7.2 20.3 4.5 17 4.5Z" fill="#e85c5c"/></svg>
        </button>
      </div>
      <h3 class="card-title product-title">${p.title}</h3>
      <div class="card-price-row product-footer">
        <div class="card-prices">
          <span class="price-current product-price">${priceCurrent}</span>
          ${priceOld ? `<span class="price-old">${priceOld}</span>` : ''}
        </div>
        <button type="button" class="cart-icon" aria-label="Səbətə əlavə et"
          onclick="event.stopPropagation();addToCart(${p.id})">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M8.96169 6.21237H5.85463C4.80326 6.21237 3.93309 7.02984 3.86751 8.07917L3.38528 15.7948C3.17037 19.2334 5.9013 22.1404 9.34665 22.1404H15.5452C18.9906 22.1404 21.7215 19.2334 21.5066 15.7948L21.0244 8.07917C20.9588 7.02984 20.0886 6.21237 19.0372 6.21237H15.9302H8.96169Z" fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M15.9302 9.69662C15.9302 11.6209 14.3702 13.1809 12.4459 13.1809C10.5216 13.1809 8.96168 11.6209 8.96168 9.69662M19.0372 6.21237H5.85463M15.9302 6.21237V4.71912C15.9302 2.79482 14.3702 1.23486 12.4459 1.23486C10.5216 1.23486 8.96169 2.79482 8.96169 4.71912V6.21237M15.9302 6.21237H8.96169" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
        <button type="button" class="btn-interest" onclick="event.stopPropagation();maraqlan(${p.id})">Maraqlan</button>
      </div>
    </article>`;
}

function renderProducts(list){
  list=list||PRODUCTS;
  const g=document.getElementById('products-grid');
  const g2=document.getElementById('products-grid-2');
  if(!list.length){
    if(g) g.innerHTML='<p style="color:var(--outline);padding:2rem;text-align:center;columns:initial">Bu kateqoriyada məhsul tapılmadı.</p>';
    if(g2) g2.innerHTML='';
    return;
  }
  const half=Math.ceil(list.length/2);
  if(g) g.innerHTML=list.slice(0,half).map((p,i)=>makeProductCard(p,i)).join('');
  if(g2) g2.innerHTML=list.slice(half).map((p,i)=>makeProductCard(p,i)).join('');
}
function renderIdeas(){
  const ideasGrid=document.getElementById('ideas-grid');
  if(ideasGrid) ideasGrid.innerHTML=IDEAS.map(i=>`
    <div class="idea-card">
      <div class="ibg" style="background:${i.color}">${i.emoji}</div>
      <div class="idea-overlay"><div class="idea-title">${i.title}</div><div class="idea-views">👁 ${i.views}</div></div>
    </div>`).join('');
}
function renderVideos() {
  const videoFeed = document.getElementById('video-feed');
  if (!videoFeed) return;

  const STAR_PATH = 'M17.9185 14.3201C17.6595 14.5711 17.5405 14.9341 17.5995 15.2901L18.4885 20.2101C18.5635 20.6271 18.3875 21.0491 18.0385 21.2901C17.6965 21.5401 17.2415 21.5701 16.8685 21.3701L12.4395 19.0601C12.2855 18.9781 12.1145 18.9341 11.9395 18.9291H11.6685C11.5745 18.9431 11.4825 18.9731 11.3985 19.0191L6.96851 21.3401C6.74951 21.4501 6.50151 21.4891 6.25851 21.4501C5.66651 21.3381 5.27151 20.7741 5.36851 20.1791L6.25851 15.2591C6.31751 14.9001 6.19851 14.5351 5.93951 14.2801L2.32851 10.7801C2.02651 10.4871 1.92151 10.0471 2.05951 9.65012C2.19351 9.25412 2.53551 8.96512 2.94851 8.90012L7.91851 8.17912C8.29651 8.14012 8.62851 7.91012 8.79851 7.57012L10.9885 3.08012C11.0405 2.98012 11.1075 2.88812 11.1885 2.81012L11.2785 2.74012C11.3255 2.68812 11.3795 2.64512 11.4395 2.61012L11.5485 2.57012L11.7185 2.50012H12.1395C12.5155 2.53912 12.8465 2.76412 13.0195 3.10012L15.2385 7.57012C15.3985 7.89712 15.7095 8.12412 16.0685 8.17912L21.0385 8.90012C21.4585 8.96012 21.8095 9.25012 21.9485 9.65012C22.0795 10.0511 21.9665 10.4911 21.6585 10.7801L17.9185 14.3201Z';

  const ratingStarsHtml = [1,2,3,4,5].map(n => `
    <button type="button" class="rating-star-btn" data-value="${n}" aria-label="${n} ulduz ver">
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        <path class="star-empty" d="${STAR_PATH}"/>
        <path class="star-filled" d="${STAR_PATH}"/>
      </svg>
    </button>`).join('');

  const videos = [
    {
      id: 1,
      creator: "yourname",
      creatorAvatar: "Y",
      isSeller: true,
      caption: "Qiymətində endirim oldu ✨",
      address: "Bakı",
      phone: "050 277 00 77",
      ratingCount: 5000,
      commentCount: 6000,
      shareCount: 7000,
      gradient: "linear-gradient(135deg,#1a4a40,#006b58,#0a8a6d)",
      emoji: "🏺",
      title: "Əl işi Turkuaz Vaza",
      video: "https://assets.mixkit.co/videos/16164/16164-720.mp4"
    },
    {
      id: 2,
      creator: "zergerstudio",
      creatorAvatar: "Z",
      isSeller: true,
      caption: "Gümüş üzük sənəti",
      address: "Sumqayıt",
      phone: "055 123 45 67",
      ratingCount: 3200,
      commentCount: 1400,
      shareCount: 2100,
      gradient: "linear-gradient(135deg,#2d3a4a,#3d5a6a,#4a7a8a)",
      emoji: "💍",
      title: "Gümüş üzük sənəti",
      video: "https://assets.mixkit.co/videos/5222/5222-360.mp4"
    }
  ];

  function fmtCount(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }

  videoFeed.innerHTML = videos.map(v => `
    <div class="video-card reels-desktop" data-video-id="${v.id}">
    <div class="reels-stage">
      <div class="video-frame">
      <div class="video-bg-art" style="background:${v.gradient}">${v.emoji}</div>
      ${v.video ? `<video class="video-real-el" src="${v.video}" autoplay loop muted playsinline onerror="this.style.display='none'"></video>` : ''}
     
      
      <!-- Sağ Sidebar (mobil: absolute; desktop: reels-stage sibling) -->
      <div class="video-sidebar reels-mobile-sidebar">
        <div class="video-action">
          <button class="video-action-btn rating-btn" data-id="${v.id}">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.9185 14.3201C17.6595 14.5711 17.5405 14.9341 17.5995 15.2901L18.4885 20.2101C18.5635 20.6271 18.3875 21.0491 18.0385 21.2901C17.6965 21.5401 17.2415 21.5701 16.8685 21.3701L12.4395 19.0601C12.2855 18.9781 12.1145 18.9341 11.9395 18.9291H11.6685C11.5745 18.9431 11.4825 18.9731 11.3985 19.0191L6.96851 21.3401C6.74951 21.4501 6.50151 21.4891 6.25851 21.4501C5.66651 21.3381 5.27151 20.7741 5.36851 20.1791L6.25851 15.2591C6.31751 14.9001 6.19851 14.5351 5.93951 14.2801L2.32851 10.7801C2.02651 10.4871 1.92151 10.0471 2.05951 9.65012C2.19351 9.25412 2.53551 8.96512 2.94851 8.90012L7.91851 8.17912C8.29651 8.14012 8.62851 7.91012 8.79851 7.57012L10.9885 3.08012C11.0405 2.98012 11.1075 2.88812 11.1885 2.81012L11.2785 2.74012C11.3255 2.68812 11.3795 2.64512 11.4395 2.61012L11.5485 2.57012L11.7185 2.50012H12.1395C12.5155 2.53912 12.8465 2.76412 13.0195 3.10012L15.2385 7.57012C15.3985 7.89712 15.7095 8.12412 16.0685 8.17912L21.0385 8.90012C21.4585 8.96012 21.8095 9.25012 21.9485 9.65012C22.0795 10.0511 21.9665 10.4911 21.6585 10.7801L17.9185 14.3201Z" fill="white"/></svg>
          </button>
          <span>${fmtCount(v.ratingCount)}</span>
        </div>
        <div class="video-action">
          <button class="video-action-btn" onclick="openReelsComments(${v.id})">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.8021 17.1362C20.6655 15.6499 21.16 13.9227 21.16 12.08C21.16 6.51297 16.647 2 11.08 2C5.51297 2 1 6.51297 1 12.08C1 17.647 5.51297 22.16 11.08 22.16C13.0924 22.16 14.967 21.5703 16.5405 20.5543L22 22.16L19.8021 17.1362Z" stroke="white" stroke-width="1.68" stroke-linejoin="round"/></svg>
          </button>
          <span>${fmtCount(v.commentCount)}</span>
        </div>
        <div class="video-action">
          <button class="video-action-btn" onclick="openReelsShare(${v.id})">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.64897 11.4317L11.0025 22.2933L22.1818 4H1L8.64897 11.4317ZM22.1818 4L8.64897 11.4317" stroke="white" stroke-width="1.92561" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <span>${fmtCount(v.shareCount)}</span>
        </div>
        <div class="video-action">
          <button class="video-action-btn three-dots-btn" data-id="${v.id}">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0)"><circle cx="2.27586" cy="11.181" r="2.27586" fill="white"/><circle cx="12" cy="11.181" r="2.27586" fill="white"/><circle cx="21.7241" cy="11.181" r="2.27586" fill="white"/></g><defs><clipPath id="clip0"><rect width="24" height="4.55172" fill="white" transform="translate(0 8.90515)"/></clipPath></defs></svg>
          </button>
          <span></span>
        </div>
        <div class="video-action">
          <button class="video-action-btn">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.96169 6.21237H5.85463C4.80326 6.21237 3.93309 7.02984 3.86751 8.07917L3.38528 15.7948C3.17037 19.2334 5.9013 22.1404 9.34665 22.1404H15.5452C18.9906 22.1404 21.7215 19.2334 21.5066 15.7948L21.0244 8.07917C20.9588 7.02984 20.0886 6.21237 19.0372 6.21237H15.9302H8.96169Z" fill="black" fill-opacity="0.15"/><path d="M15.9302 9.69662C15.9302 11.6209 14.3702 13.1809 12.4459 13.1809C10.5216 13.1809 8.96168 11.6209 8.96168 9.69662M19.0372 6.21237H5.85463M19.0372 6.21237C20.0886 6.21237 20.9588 7.02984 21.0244 8.07917L21.5066 15.7948C21.7215 19.2334 18.9906 22.1404 15.5452 22.1404H9.34665C5.9013 22.1404 3.17037 19.2334 3.38528 15.7948L3.86751 8.07917C3.93309 7.02984 4.80326 6.21237 5.85463 6.21237M19.0372 6.21237H15.9302M5.85463 6.21237H8.96169M15.9302 6.21237V4.71912C15.9302 2.79482 14.3702 1.23486 12.4459 1.23486C10.5216 1.23486 8.96169 2.79482 8.96169 4.71912V6.21237M15.9302 6.21237H8.96169" stroke="white" stroke-width="1.991" stroke-linecap="round"/></svg>
          </button>
          <span></span>
        </div>
      </div>

      <div class="rating-overlay" aria-hidden="true">
        <div class="rating-row">
          <div class="rating-bar">
            <div class="rating-stars" role="group" aria-label="Ulduz reytinqi">${ratingStarsHtml}</div>
          </div>
          <span class="rating-value">0/5</span>
        </div>
        <button type="button" class="rating-reset-btn rerating-btn" hidden aria-label="Reytinqi sıfırla">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 3v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 16H3v5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Sıfırla
        </button>
      </div>

      <!-- Sol alt informasiya -->
      <div class="video-info">
        <div class="video-info-bottom">
          <div class="profile-row">
            <div class="profile-left">
              <div class="video-creator-avatar">${v.creatorAvatar}</div>
              <div class="video-creator-name">
                @${v.creator}
                ${v.isSeller ? `<svg class="seller-badge" viewBox="0 0 24 24" fill="none" width="20" height="20"><path d="M16.5 8.49004L19.5 2.58754C19.5658 2.47353 19.6004 2.3442 19.6004 2.21254C19.6004 2.08089 19.5658 1.95156 19.5 1.83754C19.4299 1.73115 19.334 1.64434 19.2211 1.58529C19.1083 1.52624 18.9823 1.49691 18.855 1.50004H14.895C14.7565 1.50046 14.6208 1.53923 14.503 1.61204C14.3851 1.68485 14.2898 1.78886 14.2275 1.91254L12 6.29254L9.74996 1.91254C9.68941 1.79219 9.59755 1.69038 9.48406 1.61779C9.37056 1.54521 9.23961 1.50453 9.10496 1.50004H5.14496C5.01552 1.49929 4.88809 1.53205 4.77506 1.59513C4.66204 1.65822 4.56726 1.74948 4.49996 1.86004C4.43413 1.97406 4.39948 2.10339 4.39948 2.23504C4.39948 2.3667 4.43413 2.49603 4.49996 2.61004L7.49996 8.51254C7.56331 8.63483 7.65911 8.73731 7.77685 8.80875C7.89459 8.88019 8.02974 8.91783 8.16746 8.91754H9.86246C9.7537 9.24922 9.69802 9.59599 9.69746 9.94504C9.69688 10.3396 9.76803 10.731 9.90746 11.1H8.57246C8.21619 11.0946 7.86961 11.2161 7.59477 11.4428C7.31992 11.6696 7.13477 11.9867 7.07246 12.3375L6.82496 13.71L5.75996 14.61C5.49525 14.8389 5.31888 15.1531 5.26136 15.4982C5.20383 15.8433 5.26878 16.1977 5.44496 16.5L6.14246 17.7075L5.90246 19.08C5.84078 19.4281 5.90404 19.7868 6.08105 20.0928C6.25806 20.3988 6.53746 20.6325 6.86996 20.7525L8.17496 21.2325L8.87996 22.44C9.01148 22.6678 9.20059 22.8571 9.42833 22.9887C9.65606 23.1203 9.91441 23.1898 10.1775 23.19C10.3514 23.1898 10.524 23.1594 10.6875 23.1L12 22.605L13.3125 23.085C13.6443 23.2064 14.0083 23.2067 14.3403 23.086C14.6723 22.9653 14.9511 22.7312 15.1275 22.425L15.825 21.2175L17.13 20.7375C17.4624 20.6175 17.7418 20.3838 17.9189 20.0778C18.0959 19.7718 18.1591 19.4131 18.0975 19.065L17.8575 17.6925L18.555 16.5C18.7306 16.1945 18.793 15.8369 18.7313 15.4899C18.6696 15.143 18.4877 14.8288 18.2175 14.6025L17.145 13.7025L16.905 12.33C16.8426 11.9792 16.6575 11.6621 16.3826 11.4353C16.1078 11.2086 15.7612 11.0871 15.405 11.0925H14.16C14.2994 10.7235 14.3705 10.3321 14.37 9.93754C14.3824 9.58599 14.342 9.23457 14.25 8.89504H15.8925C16.0198 8.88488 16.1425 8.84234 16.2488 8.77146C16.3551 8.70058 16.4416 8.60371 16.5 8.49004Z" fill="url(#paint0_linear)"/><defs><linearGradient id="paint0_linear" x1="12" y1="23.175" x2="12" y2="1.50004" gradientUnits="userSpaceOnUse"><stop stop-color="#12C2E9"/><stop offset="1" stop-color="#C471ED"/></linearGradient></defs></svg>` : ''}
              </div>
            </div>
            <button class="msg-btn">Mesaj göndər</button>
          </div>
          <div class="caption-text">${v.caption} <span style="color:rgba(255,255,255,.75)">#əl_işi #hobbi</span></div>
          <div class="reels-music-ticker" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" style="flex-shrink:0;opacity:.85"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            <div class="reels-music-ticker-inner">
              <span>Orijinal səs — @${v.creator}</span>
              <span>Orijinal səs — @${v.creator}</span>
            </div>
          </div>
          <div class="info-tags">
            <button class="info-tag" onclick="showToast('Ünvan: ${v.address}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
              ${v.address}
            </button>
            <button class="info-tag" onclick="window.location.href='tel:${v.phone.replace(/\s/g,'')}'">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              ${v.phone}
            </button>
          </div>
        </div>
      </div>
      </div><!-- /.video-frame -->
      <div class="video-sidebar reels-desktop-sidebar">
        <div class="video-action">
          <button class="video-action-btn rating-btn" data-id="${v.id}">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" class="star-icon"><path d="M10.4378 2.88174C10.5942 2.61345 10.8181 2.39085 11.0874 2.23613C11.3566 2.08142 11.6617 2 11.9722 2C12.2827 2 12.5878 2.08142 12.857 2.23613C13.1263 2.39085 13.3502 2.61345 13.5066 2.88174L15.6589 6.57557C15.7828 6.78876 15.9498 6.97382 16.1491 7.11895C16.3485 7.26408 16.5759 7.3661 16.8168 7.41852L20.996 8.32304C21.2994 8.38899 21.5801 8.53332 21.8103 8.74161C22.0405 8.94991 22.212 9.2149 22.3079 9.51017C22.4037 9.80544 22.4205 10.1207 22.3565 10.4244C22.2925 10.7282 22.15 11.0099 21.9432 11.2414L19.0959 14.4297C18.9316 14.6135 18.8074 14.8295 18.7312 15.0639C18.6549 15.2983 18.6283 15.546 18.6531 15.7912L19.0828 20.045C19.1142 20.354 19.0639 20.6658 18.9371 20.9493C18.8102 21.2328 18.6113 21.4781 18.36 21.6607C18.1088 21.8433 17.8141 21.9568 17.5053 21.9899C17.1965 22.023 16.8844 21.9745 16.6002 21.8493L12.6885 20.1255C12.4628 20.0261 12.2188 19.9747 11.9722 19.9747C11.7256 19.9747 11.4816 20.0261 11.2559 20.1255L7.34426 21.8493C7.06003 21.9745 6.74795 22.023 6.43914 21.9899C6.13033 21.9568 5.83561 21.8433 5.58437 21.6607C5.33314 21.4781 5.13418 21.2328 5.00735 20.9493C4.88052 20.6658 4.83026 20.354 4.86158 20.045L5.29134 15.7912C5.31622 15.546 5.28981 15.2984 5.21378 15.064C5.13776 14.8296 5.01378 14.6136 4.84974 14.4297L2.00123 11.2414C1.79443 11.0099 1.65193 10.7282 1.58794 10.4244C1.52395 10.1207 1.54071 9.80544 1.63654 9.51017C1.73236 9.2149 1.90392 8.94991 2.13409 8.74161C2.36427 8.53332 2.64502 8.38899 2.94836 8.32304L7.1276 7.41852C7.36866 7.36639 7.59622 7.26462 7.79577 7.11969C7.99533 6.97476 8.16251 6.78986 8.28666 6.57675L10.4378 2.88174Z"stroke="currentColor" stroke-width="1.7" fill="none"/></svg>
           </button>
          <span>${fmtCount(v.ratingCount)}</span>
        </div>
        <div class="video-action">
          <button class="video-action-btn" onclick="openReelsComments(${v.id})"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M19.8021 17.1362C20.6655 15.6499 21.16 13.9227 21.16 12.08C21.16 6.51297 16.647 2 11.08 2C5.51297 2 1 6.51297 1 12.08C1 17.647 5.51297 22.16 11.08 22.16C13.0924 22.16 14.967 21.5703 16.5405 20.5543L22 22.16L19.8021 17.1362Z" stroke="white" stroke-width="1.68" stroke-linejoin="round"/></svg></button>
          <span>${fmtCount(v.commentCount)}</span>
        </div>
        <div class="video-action">
          <button class="video-action-btn" onclick="openReelsShare(${v.id})"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M8.64897 11.4317L11.0025 22.2933L22.1818 4H1L8.64897 11.4317ZM22.1818 4L8.64897 11.4317" stroke="white" stroke-width="1.92561" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <span>${fmtCount(v.shareCount)}</span>
        </div>
        <div class="video-action">
          <button class="video-action-btn three-dots-btn" data-id="${v.id}"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="2.28" cy="11.18" r="2.28" fill="white"/><circle cx="12" cy="11.18" r="2.28" fill="white"/><circle cx="21.72" cy="11.18" r="2.28" fill="white"/></svg></button>
        </div>
        <div class="video-action">
          <button class="video-action-btn" onclick="showToast('Səbətə əlavə edildi 🛒')"><svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M8.96 6.21H5.85C4.8 6.21 3.93 7.03 3.87 8.08L3.39 15.79C3.17 19.23 5.9 22.14 9.35 22.14H15.55C19 22.14 21.72 19.23 21.51 15.79L21.02 8.08C20.96 7.03 20.09 6.21 19.04 6.21H15.93H8.96Z" stroke="white" stroke-width="1.99" stroke-linecap="round"/><path d="M15.93 9.7C15.93 11.62 14.37 13.18 12.45 13.18C10.52 13.18 8.96 11.62 8.96 9.7" stroke="white" stroke-width="1.99" stroke-linecap="round"/></svg></button>
          <span>Səbətə</span>
        </div>
      </div>
    </div><!-- /.reels-stage -->
    </div>
  `).join('');
  
  // Rating və three dots modal hadisələrini bağla (əgər funksiyalar artıq varsa, onları saxlayın)
  attachReelsEvents();
  syncAllSidebarRatingBtns();
}


// Qlobal modal elementləri yaradın (bir dəfə)
function createModals() {
  if (!document.getElementById('three-dots-modal')) {
    const dotsModal = document.createElement('div');
    dotsModal.id = 'three-dots-modal';
    dotsModal.className = 'three-dots-modal';
    dotsModal.innerHTML = `
      <div class="modal-item" id="save-item">📌 Saxla</div>
      <div class="modal-item" id="copy-link-item">🔗 Linki kopyala və ya Paylaş</div>
      <div class="modal-item" id="report-item">⚠️ Şikayət bildir</div>
    `;
    document.body.appendChild(dotsModal);
    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay-dark';
    overlay.className = 'modal-overlay-dark';
    document.body.appendChild(overlay);
  }

  // Reels Rəylər (Comments) Modal
  if (!document.getElementById('reels-comments-modal')) {
    const cm = document.createElement('div');
    cm.id = 'reels-comments-modal';
    cm.style.cssText = 'position:fixed;inset:0;z-index:2000;display:none;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.5)';
    cm.innerHTML = `
      <div style="background:#1a1a1a;border-radius:20px 20px 0 0;width:100%;max-width:560px;max-height:75vh;display:flex;flex-direction:column;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid #333">
          <span style="color:#fff;font-weight:700;font-size:1rem">Rəylər</span>
          <button onclick="closeReelsComments()" style="background:none;border:none;color:#aaa;font-size:1.4rem;cursor:pointer;line-height:1">×</button>
        </div>
        <div id="reels-comments-list" style="flex:1;overflow-y:auto;padding:1rem 1.25rem;display:flex;flex-direction:column;gap:.85rem">
          <div style="display:flex;gap:.75rem;align-items:flex-start">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#e76262,#944a00);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:.85rem">A</div>
            <div><div style="color:#fff;font-size:.85rem;font-weight:600">@aysel_art <span style="color:#888;font-weight:400">2 saat əvvəl</span></div><div style="color:#ddd;font-size:.88rem;margin-top:.2rem">Çox gözəl iş! 🔥</div></div>
          </div>
          <div style="display:flex;gap:.75rem;align-items:flex-start">
            <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#3a7bd5,#1a4a8a);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:.85rem">O</div>
            <div><div style="color:#fff;font-size:.85rem;font-weight:600">@orxan_design <span style="color:#888;font-weight:400">4 saat əvvəl</span></div><div style="color:#ddd;font-size:.88rem;margin-top:.2rem">Qiymət nədir?</div></div>
          </div>
        </div>
        <div style="padding:.75rem 1.25rem;border-top:1px solid #333;display:flex;gap:.65rem;align-items:center">
          <input id="reels-comment-input" type="text" placeholder="Rəy yazın..." onkeydown="checkReelsEnter(event)" style="flex:1;background:#2a2a2a;border:1px solid #444;border-radius:999px;padding:.55rem 1rem;color:#fff;font-size:.88rem;outline:none;font-family:inherit">
          <button onclick="submitReelsPriceComment()" style="background:#ffffff;color:#F3660E;border:none;border-radius:13px;padding:.5rem 1rem;font-size:.85rem;font-weight:600;cursor:pointer;white-space:nowrap">Qiymət</button>
        </div>
      </div>`;
    cm.addEventListener('click', e => { if(e.target===cm) closeReelsComments(); });
    document.body.appendChild(cm);
  }

  // Reels Paylaş (Share via Messages) Modal
  if (!document.getElementById('reels-share-modal')) {
    const sm = document.createElement('div');
    sm.id = 'reels-share-modal';
    sm.style.cssText = 'position:fixed;inset:0;z-index:2000;display:none;align-items:flex-end;justify-content:center;background:rgba(0,0,0,.5)';
    sm.innerHTML = `
      <div style="background:#1a1a1a;border-radius:20px 20px 0 0;width:100%;max-width:560px;max-height:70vh;display:flex;flex-direction:column;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:1rem 1.25rem;border-bottom:1px solid #333">
          <span style="color:#fff;font-weight:700;font-size:1rem">Mesaj vasitəsilə göndər</span>
          <button onclick="closeReelsShare()" style="background:none;border:none;color:#aaa;font-size:1.4rem;cursor:pointer;line-height:1">×</button>
        </div>
        <div style="padding:.85rem 1.25rem;overflow-y:auto;flex:1">
          <div style="display:flex;gap:.5rem;overflow-x:auto;scrollbar-width:none;padding-bottom:.5rem" id="reels-share-contacts">
            ${['Aysel','Orxan','Lalə','Nigar','Elvin'].map((n,i)=>`
              <div onclick="sendReelsToContact(this,'${n}')" style="display:flex;flex-direction:column;align-items:center;gap:.45rem;cursor:pointer;flex-shrink:0;min-width:64px">
                <div style="width:56px;height:56px;border-radius:50%;background:${['linear-gradient(135deg,#e76262,#944a00)','linear-gradient(135deg,#3a7bd5,#1a4a8a)','linear-gradient(135deg,#944a00,#fc8f34)','linear-gradient(135deg,#7a3a8a,#b05ac0)','linear-gradient(135deg,#1a7a5e,#006b58)'][i]};display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:1.05rem;border:2px solid transparent;transition:border .15s" class="share-contact-avatar">${n[0]}</div>
                <span style="color:#ddd;font-size:.75rem;text-align:center">${n}</span>
              </div>`).join('')}
          </div>
        </div>
        <div style="padding:.75rem 1.25rem;border-top:1px solid #333">
          <button onclick="closeReelsShare();showToast('Video göndərildi! ✅')" style="width:100%;background:#e76262;color:white;border:none;border-radius:12px;padding:.8rem;font-size:.9rem;font-weight:700;cursor:pointer">Göndər</button>
        </div>
      </div>`;
    sm.addEventListener('click', e => { if(e.target===sm) closeReelsShare(); });
    document.body.appendChild(sm);
  }
}

function openReelsComments(videoId) {
  const m = document.getElementById('reels-comments-modal');
  if(m){ m.style.display='flex'; document.body.style.overflow='hidden'; }
}
function closeReelsComments() {
  const m = document.getElementById('reels-comments-modal');
  if(m){ m.style.display='none'; document.body.style.overflow=''; }
}
function submitReelsComment() {
  const input = document.getElementById('reels-comment-input');
  if(!input || !input.value.trim()) return;
  const list = document.getElementById('reels-comments-list');
  if(list){
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;gap:.75rem;align-items:flex-start';
    div.innerHTML = `<div style="width:36px;height:36px;border-radius:50%;background:#e76262;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:.85rem">S</div><div><div style="color:#fff;font-size:.85rem;font-weight:600">@siz <span style="color:#888;font-weight:400">indi</span></div><div style="color:#ddd;font-size:.88rem;margin-top:.2rem">${input.value.trim()}</div></div>`;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
  }
  input.value = '';
  showToast('Rəyiniz əlavə edildi ✅');
}
function openReelsShare(videoId) {
  const m = document.getElementById('reels-share-modal');
  if(m){ m.style.display='flex'; document.body.style.overflow='hidden'; }
}
function closeReelsShare() {
  const m = document.getElementById('reels-share-modal');
  if(m){ m.style.display='none'; document.body.style.overflow=''; }
}
function sendReelsToContact(el, name) {
  const avatar = el.querySelector('.share-contact-avatar');
  if(avatar) avatar.style.border = '2px solid #e76262';
  showToast(`${name}-ə göndərildi ✅`);
}

let currentVideoId = null;
const RATING_BURST_MS = 480;

function getSavedRating(videoId) {
  return parseInt(localStorage.getItem(`rating_${videoId}`) || '0', 10);
}

function updateSidebarRatingBtn(card, rating, animate) {
  const btn = card.querySelector('.rating-btn');
  if (!btn) return;
  const path = btn.querySelector('svg path');
  const value = Math.max(0, Math.min(5, rating));
  btn.classList.toggle('is-rated', value > 0);
  if (path) {
    path.setAttribute('fill', value > 0 ? '#ffe70f' : 'none');
    path.setAttribute('stroke', value > 0 ? '#ffe70f' : 'white');
  }
  if (animate && value > 0) {
    btn.classList.remove('star-pop');
    void btn.offsetWidth;
    btn.classList.add('star-pop');
    setTimeout(() => btn.classList.remove('star-pop'), 450);
  }
}

function syncAllSidebarRatingBtns() {
  document.querySelectorAll('.video-card').forEach(card => {
    updateSidebarRatingBtn(card, getSavedRating(card.dataset.videoId), false);
  });
}

function updateRatingOverlayUI(overlay, rating) {
  const value = Math.max(0, Math.min(5, rating));
  overlay.querySelectorAll('.rating-star-btn').forEach((btn, idx) => {
    btn.classList.toggle('is-filled', idx < value);
    btn.setAttribute('aria-pressed', idx < value ? 'true' : 'false');
  });
  const valueEl = overlay.querySelector('.rating-value');
  valueEl.textContent = `${value}/5`;
  valueEl.classList.toggle('is-rated', value > 0);
  const resetBtn = overlay.querySelector('.rating-reset-btn');
  if (resetBtn) resetBtn.hidden = value === 0;
}

function closeAllRatingOverlays(instant) {
  // Portal-ı bağla (mobil)
  const portal = document.getElementById('rating-portal');
  if (portal && portal.classList.contains('active')) {
    if (instant) {
      portal.classList.remove('active', 'pop-in', 'burst-out');
    } else {
      closePortalBurst(portal);
    }
  }
  document.querySelectorAll('.rating-overlay.active').forEach(overlay => {
    if (instant) {
      overlay.classList.remove('active', 'pop-in', 'burst-out');
      overlay.setAttribute('aria-hidden', 'true');
      return;
    }
    const card = overlay.closest('.video-card');
    closeRatingOverlayBurst(overlay, card);
  });
}

function openRatingOverlay(card, overlay) {
  const videoId = card.dataset.videoId;
  currentVideoId = videoId;
  const saved = getSavedRating(videoId);

  const isMobile = window.innerWidth <= 900;

  if (isMobile) {
    // ── PORTAL yanaşması: tək fixed div body-də ──
    let portal = document.getElementById('rating-portal');
    if (!portal) {
      // İlk dəfə: overlay-in HTML-ini kopyala, body-yə əlavə et
      portal = document.createElement('div');
      portal.id = 'rating-portal';
      portal.innerHTML = overlay.innerHTML;
      document.body.appendChild(portal);
    } else {
      // Mövcud portalu başqa videoya bağlamaq üçün HTML-i yenilə
      if (portal._currentVideoId !== videoId) {
        portal.innerHTML = overlay.innerHTML;
      }
    }
    initRatingPortal(portal, videoId, card);
    updateRatingOverlayUI(portal, saved);
    portal.classList.remove('burst-out', 'pop-in', 'active');
    void portal.offsetWidth;
    portal.classList.add('active');
    portal.setAttribute('aria-hidden', 'false');
    void portal.offsetWidth;
    portal.classList.add('pop-in');
    return;
  }

  // ── Desktop: köhnə davranış ──
  updateRatingOverlayUI(overlay, saved);
  overlay.classList.remove('burst-out', 'pop-in');
  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  void overlay.offsetWidth;
  overlay.classList.add('pop-in');
}

function initRatingPortal(portal, videoId, card) {
  // Hər dəfə yeni listener əlavə etməmək üçün portal üzərindən köhnə event-i sil
  const oldPortal = portal;
  // Event delegation ilə işlə - data atributlardan oxu
  if (!portal._delegated) {
    portal._delegated = true;
    portal.addEventListener('click', (e) => {
      e.stopPropagation();
      const starBtn = e.target.closest('.rating-star-btn');
      const resetBtn = e.target.closest('.rating-reset-btn');
      const vid = portal._currentVideoId;
      const c = portal._currentCard;
      if (!vid || !c) return;

      if (starBtn) {
        const val = parseInt(starBtn.dataset.value, 10);
        localStorage.setItem(`rating_${vid}`, val);
        updateSidebarRatingBtn(c, val, true);
        closePortalBurst(portal, () => updateRatingOverlayUI(portal, val));
      } else if (resetBtn) {
        localStorage.removeItem(`rating_${vid}`);
        updateSidebarRatingBtn(c, 0, false);
        closePortalBurst(portal, () => updateRatingOverlayUI(portal, 0));
      }
    });
  }
  // Cari video məlumatlarını portal-a yaz
  portal._currentVideoId = videoId;
  portal._currentCard = card;
}

function closePortalBurst(portal, afterClose) {
  if (!portal || portal.classList.contains('burst-out')) return;
  portal.classList.remove('pop-in');
  portal.classList.add('burst-out');
  portal.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    portal.classList.remove('active', 'burst-out', 'pop-in');
    if (afterClose) afterClose();
  }, RATING_BURST_MS);
}

function closeRatingOverlayBurst(overlay, card, afterClose) {
  // Mobilde portal-ı bağla
  if (window.innerWidth <= 900) {
    const portal = document.getElementById('rating-portal');
    if (portal && portal.classList.contains('active')) {
      closePortalBurst(portal, afterClose);
      return;
    }
  }
  if (!overlay || overlay.classList.contains('burst-out')) return;
  overlay.classList.remove('pop-in');
  overlay.classList.add('burst-out');
  overlay.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    overlay.classList.remove('active', 'burst-out');
    overlay.style.top = '';
    overlay.style.left = '';
    if (afterClose) afterClose();
  }, RATING_BURST_MS);
}

function initRatingOverlay(overlay) {
  const card = overlay.closest('.video-card');
  if (!card) return;
  const videoId = card.dataset.videoId;

  overlay.querySelectorAll('.rating-star-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = parseInt(btn.dataset.value, 10);
      localStorage.setItem(`rating_${videoId}`, val);
      updateSidebarRatingBtn(card, val, true);
      closeRatingOverlayBurst(overlay, card, () => updateRatingOverlayUI(overlay, val));
    });
  });

  overlay.querySelector('.rating-reset-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    localStorage.removeItem(`rating_${videoId}`);
    updateSidebarRatingBtn(card, 0, false);
    closeRatingOverlayBurst(overlay, card, () => updateRatingOverlayUI(overlay, 0));
  });

  overlay.addEventListener('click', (e) => e.stopPropagation());
}

function attachReelsEvents() {
  const feed = document.getElementById('video-feed');
  if (feed && !feed.dataset.reelsEventsBound) {
    feed.dataset.reelsEventsBound = '1';
    feed.addEventListener('click', (e) => {
      const ratingBtn = e.target.closest('.rating-btn');
      if (ratingBtn) {
        e.stopPropagation();
        handleRatingClick({ currentTarget: ratingBtn, stopPropagation: () => e.stopPropagation() });
        return;
      }
      const dotsBtn = e.target.closest('.three-dots-btn');
      if (dotsBtn) handleThreeDotsClick({ currentTarget: dotsBtn });
    });
  }
  document.querySelectorAll('.rating-overlay').forEach(overlay => {
    if (overlay.dataset.initialized) return;
    overlay.dataset.initialized = '1';
    initRatingOverlay(overlay);
  });
}

function handleRatingClick(e) {
  e.stopPropagation();
  const card = e.currentTarget.closest('.video-card');
  if (!card) return;
  const overlay = card.querySelector('.rating-overlay');
  if (!overlay) return;

  // Mobil: portal açıqsa bağla
  if (window.innerWidth <= 900) {
    const portal = document.getElementById('rating-portal');
    if (portal && portal.classList.contains('active') && !portal.classList.contains('burst-out')) {
      closePortalBurst(portal);
      return;
    }
    openRatingOverlay(card, overlay);
    return;
  }

  // Desktop: əvvəlki davranış
  if (overlay.classList.contains('active') && !overlay.classList.contains('burst-out')) {
    closeRatingOverlayBurst(overlay, card);
    return;
  }
  document.querySelectorAll('.rating-overlay.active').forEach(other => {
    if (other !== overlay) {
      other.classList.remove('active', 'pop-in', 'burst-out');
      other.setAttribute('aria-hidden', 'true');
    }
  });
  openRatingOverlay(card, overlay);
}

function handleThreeDotsClick(e) {
  const btn = e.currentTarget;
  currentVideoId = btn.closest('.video-card').dataset.videoId;
  const modal = document.getElementById('three-dots-modal');
  const overlay = document.getElementById('modal-overlay-dark');
  modal.classList.add('open');
  overlay.classList.add('active');
  document.getElementById('save-item').onclick = () => {
    showToast('Məhsul saxlanıldı');
    closeThreeDotsModal();
  };
  document.getElementById('copy-link-item').onclick = () => {
    const url = `https://hobbi.az/reels/${currentVideoId}`;
    navigator.clipboard.writeText(url);
    showToast('Link kopyalandı');
    closeThreeDotsModal();
  };
  document.getElementById('report-item').onclick = () => {
    showToast('Şikayətiniz qeydə alındı');
    closeThreeDotsModal();
  };
  overlay.onclick = closeThreeDotsModal;
}

function closeThreeDotsModal() {
  document.getElementById('three-dots-modal').classList.remove('open');
  document.getElementById('modal-overlay-dark').classList.remove('active');
}
// Səhifə yükləndikdə
function toggleSidebarCats() {
  var el = document.getElementById('sidebar-cats-scroll');
  if (el) el.classList.toggle('is-open');
}

function initDesktopSidebar() {
  var sidebar = document.getElementById('desktop-sidebar');
  if (!sidebar || window.innerWidth < 1024) return;
  var closeTimer;
  function setExpanded(on) {
    sidebar.classList.toggle('is-expanded', on);
    document.body.classList.toggle('sidebar-expanded', on);
  }
  sidebar.addEventListener('mouseenter', function() {
    clearTimeout(closeTimer);
    setExpanded(true);
  });
  sidebar.addEventListener('mouseleave', function() {
    closeTimer = setTimeout(function() { setExpanded(false); }, 180);
  });
}

document.addEventListener('DOMContentLoaded', () => {
 createModals();
  renderVideos();
  updateNotifIcons();
  initDesktopSidebar();
});

function renderProfileProducts(){
  const container=document.getElementById('profile-products');
  if(container) container.innerHTML=PROFILE_PRODUCTS.map(p=>`
    <div class="product-list-card">
      <div style="width:100%;aspect-ratio:16/7;background:${p.color};display:flex;align-items:center;justify-content:center;font-size:3rem">${p.emoji}</div>
      ${p.badge?`<span class="popular-tag">${p.badge}</span>`:''}
      <div class="product-list-overlay">
        <span class="product-list-title">${p.title}</span>
        <span class="product-list-price">${p.price}</span>
      </div>
    </div>`).join('');
}

const PAGES=['home','video','search','messages','profile'];
// Orijinal ikonların nüsxəsini yadda saxlayırıq ki, reels-dən çıxanda köhnə halına qaytara bilək
let originalNavbarIcons = null;

function hideSettingsOverlay() {
  const s = document.getElementById('page-settings');
  if (s) {
    s.classList.remove('active');
    s.style.display = '';
  }
  document.body.classList.remove('settings-open', 'sidebar-expanded');
  document.querySelectorAll('.sub-panel.open').forEach(p => p.classList.remove('open'));
  if (typeof toggleAccountEditMode === 'function') toggleAccountEditMode(false);
}

function showPage(name, _fromFilter) {
  if (name !== 'settings') hideSettingsOverlay();

  PAGES.forEach(p => {
    const pageEl = document.getElementById('page-' + p);
    const bnEl = document.getElementById('bn-' + p);
    if (pageEl) pageEl.classList.remove('active');
    if (bnEl) bnEl.classList.remove('active');
  });

  const activePage = document.getElementById('page-' + name);
  const activeBn = document.getElementById('bn-' + name);
  if (activePage) activePage.classList.add('active');
  if (activeBn) activeBn.classList.add('active');

  document.querySelectorAll('.sidebar .nav-item[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === name);
  });

  // Clear category selections when navigating to non-home pages (or home without filter context)
  if (!_fromFilter) {
    document.querySelectorAll('.sidebar .nav-item[data-cat]').forEach(el => el.classList.remove('active'));
    if (name === 'home') {
      // Also reset chip-row to 'all'
      document.querySelectorAll('#chip-row .chip').forEach(c => c.classList.toggle('active', c.dataset.cat === 'all'));
    }
  }

  const ts = document.getElementById('topnav-search');
  if (ts) {
    const hideSearch = ['search','messages','profile'].includes(name);
    hideSearch ? ts.classList.add('hidden') : ts.classList.remove('hidden');
  }
  if (name === 'search') {
    // Klaviatura yalnız istifadəçi özü axtarış çubuğuna bassın, avtomatik açılmasın
    // setTimeout(() => document.getElementById('search-input')?.focus(), 150);
  }

  const content = document.querySelector('.content');
  if (content) {
    if (name === 'video') {
      content.style.paddingBottom = '0';

      if (window.innerWidth <= 900) {
        const videoPageEl = document.getElementById('page-video');
        if (videoPageEl) {
          videoPageEl.style.height = '100dvh';
          videoPageEl.style.maxHeight = '100dvh';
          videoPageEl.style.overflow = 'hidden';
        }
        document.querySelectorAll('.video-card').forEach(card => {
          card.style.height = '100dvh';
        });
      }
    } else {
      content.style.paddingBottom = '';
      const videoPageEl = document.getElementById('page-video');
      if (videoPageEl) {
        videoPageEl.style.height = '';
        videoPageEl.style.maxHeight = '';
        videoPageEl.style.overflow = '';
      }
      document.querySelectorAll('.video-card').forEach(card => {
        card.style.height = '';
      });
    }
  }

  const notifDropdown = document.getElementById('notif-dropdown');
  if (notifDropdown) notifDropdown.classList.remove('open');
  if (content) content.scrollTop = 0;

  const topnav = document.getElementById('topnav-main');
  if (window.innerWidth <= 900) {
    if (topnav) topnav.style.display = (name === 'home') ? '' : 'none';
  } else {
    if (topnav) topnav.style.display = '';
  }

  const profBtn = document.getElementById('topnav-profile-btn');
  if (profBtn) {
    const outline = profBtn.querySelector('.topnav-profile-icon-outline');
    const filled = profBtn.querySelector('.topnav-profile-icon-filled');
    if (name === 'profile') {
      if (outline) outline.style.display = 'none';
      if (filled) filled.style.display = '';
    } else {
      if (outline) outline.style.display = '';
      if (filled) filled.style.display = 'none';
    }
  }

  // ========== REELS ÜÇÜN NAVBAR İKONLARI ==========
  const bottomNav = document.querySelector('.bottom-nav');

  // Orijinal ikonları bir dəfəlik yadda saxla
  if (!window.originalNavbarIcons) {
    window.originalNavbarIcons = {
      home: document.getElementById('bn-home')?.innerHTML || '',
      video: document.getElementById('bn-video')?.innerHTML || '',
      search: document.getElementById('bn-search')?.innerHTML || '',
      messages: document.getElementById('bn-messages')?.innerHTML || '',
      profile: document.getElementById('bn-profile')?.innerHTML || ''
    };
  }

  if (bottomNav) {
    if (name === 'video') {
      // Əgər sayt gündüz rejimindədirsə, qara fon sinfini əlavə et (dark modda artıq qaradır)
      const htmlAttr = document.documentElement.getAttribute('data-theme');
      const isDarkMode = htmlAttr === 'dark' ||
                         (htmlAttr === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (!isDarkMode) {
        bottomNav.classList.add('force-reels-dark');
      }

      // İkonları ağ SVG-lərlə əvəz et (sizin verdiyiniz uzun svg-lər)
      document.getElementById('bn-home').innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.30701 1.25C6.50601 1.25 5.95701 1.25 5.46701 1.383C4.95987 1.52218 4.48769 1.76647 4.08111 2.10001C3.67452 2.43354 3.34264 2.84886 3.10701 3.319C2.88001 3.771 2.77301 4.31 2.61601 5.096L1.99601 8.194C1.8862 8.73708 1.89681 9.29764 2.02708 9.83618C2.15736 10.3747 2.40412 10.8781 2.75001 11.311V14.056C2.75001 15.894 2.75001 17.35 2.90301 18.489C3.06101 19.661 3.39301 20.61 4.14101 21.359C4.88901 22.107 5.83801 22.439 7.01101 22.597C8.15001 22.75 9.60601 22.75 11.443 22.75H12.556C14.394 22.75 15.85 22.75 16.989 22.597C18.161 22.439 19.11 22.107 19.859 21.359C20.607 20.61 20.939 19.661 21.097 18.489C21.25 17.349 21.25 15.894 21.25 14.056V11.312C21.5959 10.8789 21.8425 10.3753 21.9726 9.83659C22.1027 9.29787 22.1131 8.73717 22.003 8.194L21.383 5.096C21.227 4.31 21.119 3.771 20.893 3.319C20.6573 2.84876 20.3252 2.43337 19.9185 2.09983C19.5117 1.76629 19.0393 1.52206 18.532 1.383C18.043 1.25 17.494 1.25 16.692 1.25H7.30701ZM18.268 12.75C18.777 12.7509 19.2809 12.6496 19.75 12.452V14C19.75 15.907 19.748 17.262 19.61 18.29C19.475 19.295 19.221 19.875 18.798 20.298C18.375 20.721 17.795 20.975 16.788 21.11C16.2775 21.1727 15.7642 21.2107 15.25 21.224V18.468C15.25 18.028 15.25 17.648 15.222 17.338C15.192 17.008 15.126 16.682 14.948 16.375C14.7507 16.0329 14.4669 15.7487 14.125 15.551C13.818 15.374 13.492 15.308 13.162 15.278C12.852 15.25 12.472 15.25 12.032 15.25H11.967C11.527 15.25 11.148 15.25 10.837 15.278C10.507 15.308 10.182 15.374 9.87501 15.551C9.53274 15.7485 9.24854 16.0327 9.051 16.375C8.874 16.682 8.80801 17.008 8.77801 17.337C8.75001 17.649 8.75001 18.028 8.75001 18.467V21.224C8.23514 21.2108 7.7212 21.1728 7.21001 21.11C6.20501 20.975 5.62501 20.721 5.20201 20.298C4.77901 19.875 4.52501 19.295 4.39001 18.289C4.25101 17.262 4.25001 15.907 4.25001 14V12.452C5.04919 12.7891 5.93947 12.8433 6.77369 12.6059C7.60791 12.3684 8.33613 11.8534 8.83801 11.146C9.20083 11.6442 9.67656 12.0493 10.2262 12.3281C10.7758 12.6069 11.3837 12.7515 12 12.75C12.6163 12.7515 13.2242 12.6069 13.7738 12.3281C14.3235 12.0493 14.7992 11.6442 15.162 11.146C15.5135 11.6424 15.9791 12.0472 16.5196 12.3264C17.0601 12.6055 17.6597 12.7508 18.268 12.75ZM10.25 21.248C10.638 21.2493 11.0547 21.25 11.5 21.25H12.5C12.9453 21.25 13.362 21.2493 13.75 21.248V18.5C13.75 18.019 13.749 17.708 13.728 17.473C13.708 17.248 13.673 17.166 13.649 17.125C13.5833 17.0112 13.4888 16.9168 13.375 16.851C13.334 16.827 13.252 16.793 13.027 16.772C12.6851 16.7511 12.3425 16.7438 12 16.75C11.519 16.75 11.208 16.75 10.973 16.772C10.747 16.792 10.666 16.827 10.625 16.851C10.5109 16.9166 10.416 17.0111 10.35 17.125C10.327 17.165 10.292 17.248 10.272 17.473C10.251 17.708 10.25 18.019 10.25 18.5V21.248ZM8.67001 2.75H7.41801C6.46401 2.75 6.13301 2.757 5.86501 2.83C5.56078 2.91344 5.2775 3.05992 5.03356 3.25994C4.78961 3.45995 4.59045 3.70903 4.44901 3.991C4.32401 4.24 4.25301 4.562 4.06601 5.498L3.46801 8.488C3.40427 8.79564 3.40396 9.11306 3.4671 9.42082C3.53024 9.72859 3.6555 10.0202 3.83521 10.2779C4.01492 10.5356 4.24531 10.754 4.51229 10.9196C4.77927 11.0852 5.07723 11.1946 5.38795 11.2411C5.69866 11.2877 6.0156 11.2703 6.31938 11.1901C6.62315 11.11 6.90739 10.9687 7.15469 10.7749C7.40199 10.5812 7.60717 10.339 7.75768 10.0632C7.90818 9.78741 8.00084 9.48382 8.03 9.171L8.09901 8.485L8.103 8.443L8.67001 2.75ZM9.591 8.625L10.179 2.75H13.821L14.405 8.592C14.4377 8.92627 14.4004 9.26369 14.2955 9.58275C14.1905 9.9018 14.0202 10.1955 13.7955 10.445C13.5707 10.6946 13.2964 10.8946 12.99 11.0322C12.6836 11.1699 12.3519 11.2422 12.0161 11.2445C11.6802 11.2468 11.3476 11.179 11.0393 11.0456C10.7311 10.9122 10.4541 10.716 10.2259 10.4695C9.99771 10.223 9.82341 9.93173 9.7141 9.61415C9.60479 9.29657 9.56286 8.95969 9.591 8.625ZM18.135 2.83C17.867 2.757 17.536 2.75 16.582 2.75H15.328L15.971 9.17C16.0011 9.48192 16.0944 9.78445 16.2452 10.0592C16.396 10.3339 16.6011 10.575 16.848 10.7679C17.095 10.9608 17.3787 11.1014 17.6817 11.1811C17.9848 11.2609 18.3009 11.2781 18.6108 11.2318C18.9207 11.1854 19.218 11.0765 19.4844 10.9116C19.7509 10.7467 19.981 10.5293 20.1607 10.2726C20.3405 10.0159 20.4661 9.72526 20.5299 9.41846C20.5938 9.11166 20.5945 8.79508 20.532 8.488L19.935 5.498C19.747 4.562 19.676 4.24 19.552 3.991C19.4104 3.70892 19.2111 3.45978 18.967 3.25976C18.7229 3.05974 18.4394 2.91332 18.135 2.83Z" fill="white"/></svg>`;
      document.getElementById('bn-video').innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_2505_49)"><path d="M14.545 2.5C14.545 2.5 14.1653 4.57463 15.2822 6.25C16.3991 7.92537 19.5 7.98711 19.5 7.98711V19.75C19.5 20.7446 19.1049 21.6984 18.4017 22.4016C17.6984 23.1049 16.7446 23.5 15.75 23.5H8.25C7.25544 23.5 6.30161 23.1049 5.59835 22.4016C4.89509 21.6984 4.5 20.7446 4.5 19.75V6.25C4.5 5.25544 4.89509 4.30161 5.59835 3.59835C6.30161 2.89509 7.25544 2.5 8.25 2.5L14.545 2.5ZM11.292 9.853C11.0649 9.7118 10.8042 9.63388 10.5368 9.62732C10.2695 9.62076 10.0052 9.68578 9.77146 9.81567C9.5377 9.94556 9.34291 10.1356 9.20727 10.3661C9.07162 10.5965 9.00007 10.8591 9 11.1265V14.866C9.00007 15.1334 9.07162 15.396 9.20727 15.6264C9.34291 15.8569 9.5377 16.0469 9.77146 16.1768C10.0052 16.3067 10.2695 16.3717 10.5368 16.3652C10.8042 16.3586 11.0649 16.2807 11.292 16.1395L14.295 14.2705C14.5114 14.1358 14.6899 13.9482 14.8137 13.7254C14.9375 13.5026 15.0024 13.2519 15.0024 12.997C15.0024 12.7421 14.9375 12.4914 14.8137 12.2686C14.6899 12.0458 14.5114 11.8582 14.295 11.7235L11.292 9.853Z" fill="white"/><g clip-path="url(#clip1_2505_49)"><path d="M17.9883 6.15205C18.1034 6.23331 18.2405 6.27652 18.3809 6.27605V6.27417C18.5136 6.27452 18.6433 6.23588 18.7541 6.16305C18.865 6.09023 18.9519 5.98644 19.0042 5.86459L19.2922 4.98907C19.3586 4.79072 19.4703 4.61055 19.6185 4.46283C19.7666 4.31511 19.9471 4.20389 20.1456 4.13798L20.9807 3.86649C21.1155 3.81946 21.232 3.73106 21.3135 3.61392C21.395 3.49677 21.4375 3.35686 21.4348 3.21415C21.432 3.07145 21.3843 2.93325 21.2984 2.81928C21.2125 2.70531 21.0928 2.62139 20.9563 2.57951L20.132 2.31178C19.9326 2.24533 19.7515 2.13336 19.603 1.98473C19.4544 1.8361 19.3425 1.65491 19.2762 1.45552L19.0047 0.620864C18.9574 0.487927 18.8698 0.373039 18.7541 0.292163C18.6385 0.211288 18.5005 0.168441 18.3594 0.169578C18.2183 0.170714 18.0811 0.215777 17.9667 0.298504C17.8524 0.381231 17.7667 0.497515 17.7215 0.631197L17.4477 1.4729C17.3815 1.66649 17.2724 1.84256 17.1284 1.98786C16.9844 2.13317 16.8093 2.24392 16.6163 2.31178L15.7816 2.57951C15.6477 2.62586 15.5316 2.71303 15.4497 2.82875C15.3679 2.94447 15.3243 3.08294 15.3252 3.22469C15.3261 3.36644 15.3713 3.50435 15.4546 3.61905C15.5379 3.73374 15.6551 3.81946 15.7896 3.86414L16.6135 4.1314C16.8128 4.19832 16.9939 4.31062 17.1424 4.45946C17.2909 4.6083 17.4028 4.7896 17.4693 4.98907L17.7407 5.82279C17.7872 5.95571 17.8737 6.07079 17.9883 6.15205ZM21.5895 8.52215C21.4998 8.4583 21.4325 8.36795 21.3969 8.26382L21.2428 7.7913C21.213 7.70136 21.1626 7.61961 21.0956 7.55252C21.0287 7.48542 20.9471 7.43483 20.8572 7.40474L20.3917 7.25303C20.2853 7.21695 20.1927 7.14856 20.1269 7.05737C20.0612 6.96619 20.0255 6.85676 20.0249 6.74434C20.0248 6.63257 20.0596 6.52355 20.1246 6.43258C20.1895 6.34161 20.2813 6.27324 20.387 6.23706L20.8596 6.08394C20.9474 6.05271 21.027 6.00175 21.0921 5.93499C21.1573 5.86822 21.2063 5.78742 21.2353 5.69879L21.3875 5.23332C21.4233 5.12799 21.4909 5.03639 21.5811 4.97117C21.6712 4.90596 21.7793 4.87035 21.8906 4.86926C22.0018 4.86818 22.1106 4.90168 22.202 4.96513C22.2934 5.02858 22.3628 5.11885 22.4006 5.22345L22.5552 5.69973C22.5854 5.78901 22.6359 5.87007 22.7028 5.93657C22.7696 6.00306 22.8509 6.05318 22.9403 6.083L23.4063 6.23472C23.5137 6.26831 23.6078 6.33486 23.6753 6.42493C23.7427 6.51501 23.7801 6.62404 23.7821 6.73656C23.7842 6.84908 23.7507 6.95939 23.6865 7.05183C23.6224 7.14428 23.5307 7.21418 23.4246 7.25162L22.9483 7.40615C22.8588 7.43638 22.7774 7.48698 22.7108 7.55398C22.6441 7.62098 22.5939 7.70254 22.5641 7.79224L22.4129 8.25677C22.3762 8.3648 22.3067 8.45874 22.2132 8.5245C22.122 8.58932 22.0128 8.62395 21.901 8.62353C21.7891 8.62311 21.6802 8.58766 21.5895 8.52215Z" fill="white"/></g></g><defs><clipPath id="clip0_2505_49"><rect width="24" height="24" fill="white"/></clipPath><clipPath id="clip1_2505_49"><rect width="11" height="11" fill="white" transform="translate(15 -1)"/></clipPath></defs></svg>`;
      document.getElementById('bn-search').innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 22L17.1745 17.1745M17.1745 17.1745C17.9999 16.3491 18.6547 15.3692 19.1014 14.2907C19.5481 13.2122 19.778 12.0563 19.778 10.889C19.778 9.72169 19.5481 8.5658 19.1014 7.48734C18.6547 6.40887 17.9999 5.42895 17.1745 4.60353C16.3491 3.77811 15.3692 3.12335 14.2907 2.67664C13.2122 2.22992 12.0563 2 10.889 2C9.72169 2 8.5658 2.22992 7.48734 2.67664C6.40887 3.12335 5.42895 3.77811 4.60353 4.60353C2.93652 6.27055 2 8.5315 2 10.889C2 13.2465 2.93652 15.5075 4.60353 17.1745C6.27055 18.8415 8.5315 19.778 10.889 19.778C13.2465 19.778 15.5075 18.8415 17.1745 17.1745Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      document.getElementById('bn-messages').innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 20.5C19.133 20.5 22 16.47 22 11.5C22 6.53 20.133 2.5 12 2.5C4.133 2.5 2 6.53 2 11.5C2 13.571 2.37 15.48 3.372 17C4.632 19 3.992 20.833 3 21.5C4.615 21.5 5.702 20.986 6.392 20.477C6.882 20.115 7.507 19.937 8.098 20.081C9.207 20.353 10.499 20.5 12 20.5Z" stroke="white" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M12.125 11.5H12M16.125 11.5H16M8.125 11.5H8M12.25 11.5C12.25 11.5663 12.2237 11.6299 12.1768 11.6768C12.1299 11.7237 12.0663 11.75 12 11.75C11.9337 11.75 11.8701 11.7237 11.8232 11.6768C11.7763 11.6299 11.75 11.5663 11.75 11.5C11.75 11.4337 11.7763 11.3701 11.8232 11.3232C11.8701 11.2763 11.9337 11.25 12 11.25C12.0663 11.25 12.1299 11.2763 12.1768 11.3232C12.2237 11.3701 12.25 11.4337 12.25 11.5ZM16.25 11.5C16.25 11.5663 16.2237 11.6299 16.1768 11.6768C16.1299 11.7237 16.0663 11.75 16 11.75C15.9337 11.75 15.8701 11.7237 15.8232 11.6768C15.7763 11.6299 15.75 11.5663 15.75 11.5C15.75 11.4337 15.7763 11.3701 15.8232 11.3232C15.8701 11.2763 15.9337 11.25 16 11.25C16.0663 11.25 16.1299 11.2763 16.1768 11.3232C16.2237 11.3701 16.25 11.4337 16.25 11.5ZM8.25 11.5C8.25 11.5663 8.22366 11.6299 8.17678 11.6768C8.12989 11.7237 8.0663 11.75 8 11.75C7.9337 11.75 7.87011 11.7237 7.82322 11.6768C7.77634 11.6299 7.75 11.5663 7.75 11.5C7.75 11.4337 7.77634 11.3701 7.82322 11.3232C7.87011 11.2763 7.9337 11.25 8 11.25C8.0663 11.25 8.12989 11.2763 8.17678 11.3232C8.22366 11.3701 8.25 11.4337 8.25 11.5Z" stroke="white" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      document.getElementById('bn-profile').innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 11C16 12.0609 15.5786 13.0783 14.8284 13.8284C14.0783 14.5786 13.0609 15 12 15C10.9391 15 9.92172 14.5786 9.17157 13.8284C8.42143 13.0783 8 12.0609 8 11C8 9.93913 8.42143 8.92172 9.17157 8.17157C9.92172 7.42143 10.9391 7 12 7C13.0609 7 14.0783 7.42143 14.8284 8.17157C15.5786 8.92172 16 9.93913 16 11Z" fill="white"/><path d="M12 1.90039C17.5782 1.90039 22.0996 6.42177 22.0996 12C22.0996 17.5782 17.5782 22.0996 12 22.0996H11.8633C11.7707 22.0996 11.6779 22.0972 11.5859 22.0918V22.0908C6.20001 21.8736 1.90039 17.4392 1.90039 12C1.90039 6.42177 6.42177 1.90039 12 1.90039ZM12 3.09961C7.08473 3.09961 3.09961 7.08473 3.09961 12C3.09961 14.3009 3.97402 16.3969 5.40723 17.9766C5.39543 17.8614 5.39598 17.7446 5.40918 17.6289C5.43667 17.3883 5.51837 17.1571 5.64746 16.9521C5.77665 16.7471 5.94992 16.5731 6.15527 16.4443C6.36052 16.3157 6.59227 16.235 6.83301 16.208H6.83398C10.7397 15.7757 13.286 15.8147 17.1709 16.2168C17.4122 16.2419 17.6448 16.3217 17.8506 16.4502C18.0564 16.5787 18.2299 16.7531 18.3584 16.959C18.4869 17.1649 18.5667 17.3973 18.5918 17.6387C18.6036 17.7521 18.6023 17.8659 18.5898 17.9785C20.0749 16.346 20.9033 14.2157 20.9004 12C20.9004 7.08473 16.9153 3.09961 12 3.09961Z" fill="white" stroke="white" stroke-width="0.2"/></svg>`;
    } else {
      // Reels səhifəsindən çıxanda qara fon sinfini sil
      bottomNav.classList.remove('force-reels-dark');
      // Orijinal ikonları geri qaytar
      if (window.originalNavbarIcons) {
        document.getElementById('bn-home').innerHTML = window.originalNavbarIcons.home;
        document.getElementById('bn-video').innerHTML = window.originalNavbarIcons.video;
        document.getElementById('bn-search').innerHTML = window.originalNavbarIcons.search;
        document.getElementById('bn-messages').innerHTML = window.originalNavbarIcons.messages;
        document.getElementById('bn-profile').innerHTML = window.originalNavbarIcons.profile;
      }
    }
  }
}

function filterCat(cat){
  document.querySelectorAll('#chip-row .chip').forEach(c=>c.classList.toggle('active',c.dataset.cat===cat));
  document.querySelectorAll('.sidebar .nav-item[data-cat]').forEach(el=>el.classList.toggle('active',el.dataset.cat===cat));
  const filtered=cat==='all'?PRODUCTS:PRODUCTS.filter(p=>p.cat===cat);
  renderProducts(filtered);
  const trendSec=document.getElementById('trend-stores-section');
  const g2wrap=document.getElementById('products-grid-2')?.closest('.section');
  if(trendSec) trendSec.style.display=cat==='all'?'':'none';
  if(g2wrap)   g2wrap.style.display=cat==='all'?'':'none';
  showPage('home', true);
}


function toggleShareMenu(e){
  e.stopPropagation();
  const dd=document.getElementById('share-dropdown');
  if(dd) dd.classList.toggle('open');
  // close notif if open
  const nd=document.getElementById('notif-dropdown');
  if(nd) nd.classList.remove('open');
}
function closeShareMenu(){
  const dd=document.getElementById('share-dropdown');
  if(dd) dd.classList.remove('open');
}
function toggleNotif(e){
  e.stopPropagation();
  const dd=document.getElementById('notif-dropdown');
  if(dd) dd.classList.toggle('open');
  // Close share dropdown when notif opens
  const sd=document.getElementById('share-dropdown');
  if(sd) sd.classList.remove('open');
}

// Close share dropdown on scroll (anywhere on page)
window.addEventListener('scroll', function(){
  const sd = document.getElementById('share-dropdown');
  if(sd) sd.classList.remove('open');
}, true);

// Close notif dropdown on page-level scroll (but NOT when scrolling inside the dropdown)
window.addEventListener('scroll', function(e){
  const nd = document.getElementById('notif-dropdown');
  if(!nd || !nd.classList.contains('open')) return;
  // If the scroll target is inside notif-list, don't close
  const notifList = nd.querySelector('.notif-list');
  if(notifList && notifList.contains(e.target)) return;
  nd.classList.remove('open');
}, true);
// Close share dropdown when clicking outside
document.addEventListener('click',function(e){
  const dd=document.getElementById('share-dropdown');
  const btn=document.getElementById('share-menu-btn');
  if(dd && btn && !btn.contains(e.target) && !dd.contains(e.target)) dd.classList.remove('open');
});
function updateNotifIcons(){
  const unread = document.querySelectorAll('.notif-item.unread').length;
  const empty = document.getElementById('notif-icon-empty');
  const filled = document.getElementById('notif-icon-filled');
  if(empty && filled){
    if(unread > 0){ empty.style.display='none'; filled.style.display=''; }
    else { empty.style.display=''; filled.style.display='none'; }
  }
}
function markAllRead(){
  document.querySelectorAll('.notif-item').forEach(i=>i.classList.remove('unread'));
  document.querySelectorAll('.notif-dot').forEach(d=>d.remove());
  const badge=document.getElementById('notif-badge');
  if(badge) badge.style.display='none';
}
document.addEventListener('click',e=>{
  const dd=document.getElementById('notif-dropdown');
  const btn=document.getElementById('notif-btn');
  if(dd && btn && !btn.contains(e.target) && !dd.contains(e.target)) dd.classList.remove('open');
});

function openProductModal(id){
  const p=PRODUCTS.find(x=>x.id===id);if(!p)return;
  const imgDiv=document.getElementById('modal-img');
  if(imgDiv){
    imgDiv.innerHTML=`<img src="${p.photo}" alt="${p.title}" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:var(--r-lg)" onerror="this.parentElement.innerHTML='<div style=\\'background:${p.color};width:100%;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;font-size:7rem\\'>${p.emoji}</div>'">`;
  }
  const modalShop=document.getElementById('modal-shop');
  const modalTitle=document.getElementById('modal-title');
  const modalPrice=document.getElementById('modal-price');
  const modalDesc=document.getElementById('modal-desc');
  if(modalShop) modalShop.innerHTML=`<span>🏪</span>${p.shop}`;
  if(modalTitle) modalTitle.textContent=p.title;
  if(modalPrice) modalPrice.innerHTML=`${p.price} ₼ ${p.oldPrice?`<span style="font-size:1rem;font-weight:400;color:var(--outline);text-decoration:line-through">${p.oldPrice} ₼</span>`:''}`;
  if(modalDesc) modalDesc.textContent=p.desc;
  openModal('product-modal');
}

function openStoreModal(){ openAuthFlow(); }

/* ═══════════════════════════════════════════════════════════
   MULTI-STEP AUTH / STORE ONBOARDING STATE MACHINE
   ═══════════════════════════════════════════════════════════ */
(function(){

  // ── State ──────────────────────────────────────────────
  var _authMode = 'register'; // 'register' | 'login'
  var _currentStep = '1';     // '1','2l','2r','3','4','5','6','7','8','9'
  var _prevStep = null;
  var _selectedCat = null;
  var _selectedRegion = 'Bakı';
  var _contactMode = 'phone'; // 'phone' | 'email'

  // Register flow steps in order
  var REGISTER_STEPS = ['2r','3','4','5','6','7','8','9'];
  var TOTAL_REGISTER_STEPS = REGISTER_STEPS.length;

  // ── Helpers ────────────────────────────────────────────
  function getEl(id){ return document.getElementById(id); }

  function showStep(stepId, direction){
    // Hide all steps
    document.querySelectorAll('.auth-step').forEach(function(el){
      el.classList.remove('active','anim-back');
    });
    var el = getEl('auth-step-' + stepId);
    if(!el) return;
    if(direction === 'back') el.classList.add('anim-back');
    el.classList.add('active');
    _currentStep = stepId;
    updateUI();
    // Focus first input if present
    var firstInput = el.querySelector('input:not([type="checkbox"]):not([type="file"])');
    if(firstInput) setTimeout(function(){ firstInput.focus(); }, 80);
  }

  function updateUI(){
    var step = _currentStep;
    var progressWrap = getEl('auth-progress-wrap');
    var progressFill = getEl('auth-progress-fill');
    var progressLabel = getEl('auth-progress-label');
    var backBtn = getEl('auth-back-btn');

    // Progress bar: only for register flow steps 2r-9
    var registerIdx = REGISTER_STEPS.indexOf(step);
    if(registerIdx !== -1 && _authMode === 'register'){
      var pct = Math.round(((registerIdx + 1) / TOTAL_REGISTER_STEPS) * 100);
      progressWrap.classList.add('visible');
      progressFill.style.width = pct + '%';
      progressLabel.textContent = (registerIdx + 1) + ' / ' + TOTAL_REGISTER_STEPS;
    } else {
      progressWrap.classList.remove('visible');
      if(progressFill) progressFill.style.width = '0%';
    }

    // Back button visibility
    var showBack = (step !== '1');
    if(backBtn){
      if(showBack) backBtn.classList.add('visible');
      else backBtn.classList.remove('visible');
    }
  }

  // ── Open / Close ────────────────────────────────────────
  window.openAuthFlow = function(){
    _authMode = 'register';
    _currentStep = '1';
    _selectedCat = null;
    _selectedRegion = 'Bakı';
    _prevStep = null;
    document.body.style.overflow = 'hidden';
    var overlay = getEl('auth-overlay');
    overlay.style.display = 'flex';
    // Force reflow then open
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        overlay.classList.add('open');
        showStep('1');
      });
    });
  };

  window.closeAuthFlow = function(){
    var overlay = getEl('auth-overlay');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    authCloseOtpHelp();
    setTimeout(function(){ overlay.style.display = 'none'; }, 420);
    // Stop confetti if running
    _confettiRunning = false;
  };

  // ── Navigation ──────────────────────────────────────────
  window.authStartLogin = function(){
    _authMode = 'login';
    _prevStep = '1';
    showStep('2l');
  };

  window.authStartRegister = function(){
    _authMode = 'register';
    _prevStep = '1';
    showStep('2r');
    // Reset cat grid
    document.querySelectorAll('.auth-cat-card').forEach(function(c){ c.classList.remove('selected'); });
    _selectedCat = null;
    var catNext = getEl('auth-cat-next');
    if(catNext){ catNext.disabled = true; catNext.classList.add('auth-btn-disabled'); }
  };

  window.authNextStep = function(){
    var step = _currentStep;
    _prevStep = step;
    if(step === '2r'){ showStep('3'); return; }
    if(step === '3'){ showStep('4'); return; }
    if(step === '4'){
      updateOtpSub();
      showStep('5');
      setTimeout(authInitOtp, 60);
      return;
    }
    if(step === '5'){ showStep('6'); return; }
    if(step === '6'){ showStep('7'); return; }
    if(step === '7'){ showStep('8'); return; }
    if(step === '8'){
      var regionStat = getEl('auth-success-region-stat');
      if(regionStat) regionStat.textContent = _selectedRegion;
      var brandInp = getEl('auth-brand-name');
      var brandName = (brandInp && brandInp.value.trim()) ? brandInp.value.trim() : 'mağaza';
      var successTitle = getEl('auth-success-title');
      var successSub = getEl('auth-success-sub');
      if(successTitle) successTitle.textContent = 'Təkrar xoş gəldin, ' + brandName;
      if(successSub) successSub.textContent = 'Qeydiyyatı uğurla tamamladın';
      showStep('9');
      setTimeout(authLaunchConfetti, 200);
      return;
    }
  };

  window.authPrevStep = function(){
    var step = _currentStep;
    if(step === '2l' || step === '2r'){ showStep('1', 'back'); return; }
    if(step === '3'){ showStep('2r', 'back'); return; }
    if(step === '4'){ showStep('3', 'back'); return; }
    if(step === '5'){ showStep('4', 'back'); return; }
    if(step === '6'){ showStep('5', 'back'); return; }
    if(step === '7'){ showStep('6', 'back'); return; }
    if(step === '8'){ showStep('7', 'back'); return; }
    if(step === '9'){ showStep('8', 'back'); return; }
    if(step === '1'){ closeAuthFlow(); return; }
  };

  // ── Login submit ────────────────────────────────────────
  window.authLoginSubmit = function(){
    var id = getEl('login-identity');
    var pw = getEl('login-password');
    if(!id || !id.value.trim()){ authShakeInput('login-identity'); return; }
    if(!pw || !pw.value.trim()){ authShakeInput('login-password'); return; }
    // Simulate success
    if(typeof showToast === 'function') showToast('Uğurla daxil oldunuz 👋');
    closeAuthFlow();
  };

  function authShakeInput(id){
    var el = getEl(id);
    if(!el) return;
    el.style.borderColor = '#ba1a1a';
    el.style.animation = 'authShake .35s ease';
    setTimeout(function(){ el.style.animation = ''; el.style.borderColor = ''; }, 400);
  }

  // ── Category ────────────────────────────────────────────
  window.authSelectCat = function(btn){
    document.querySelectorAll('.auth-cat-card').forEach(function(c){ c.classList.remove('selected'); });
    btn.classList.add('selected');
    _selectedCat = btn.getAttribute('data-cat');
    var catNext = getEl('auth-cat-next');
    if(catNext){ catNext.disabled = false; catNext.classList.remove('auth-btn-disabled'); }
  };

  window.authCatNext = function(){
    if(!_selectedCat) return;
    showStep('3');
  };

  // ── Brand name validation ────────────────────────────────
  window.authCheckBrand = function(input){
    var val = input.value.trim();
    var icon = getEl('auth-brand-check');
    var hint = getEl('auth-brand-hint');
    if(val.length > 3){
      if(icon) icon.classList.add('show');
      if(hint){ hint.textContent = 'Bu marka adı istifadə edilə bilər.'; hint.className = 'auth-field-hint auth-hint-success'; }
    } else {
      if(icon) icon.classList.remove('show');
      if(hint) hint.textContent = '';
    }
  };

  // ── Contact toggle ────────────────────────────────────────
  window.authSwitchContact = function(mode){
    _contactMode = mode;
    var tabs = document.querySelectorAll('.auth-contact-tab');
    tabs.forEach(function(t){ t.classList.remove('active'); });
    var tab = getEl('auth-tab-' + mode);
    if(tab) tab.classList.add('active');
    getEl('auth-contact-phone-wrap').style.display = (mode === 'phone') ? 'block' : 'none';
    getEl('auth-contact-email-wrap').style.display = (mode === 'email') ? 'block' : 'none';
    var sub = getEl('auth-step-4') && getEl('auth-step-4').querySelector('.auth-step-sub');
    if(sub) sub.textContent = (mode === 'phone')
      ? 'Hesabınızı təsdiqləmək üçün telefon nömrənizi daxil edin.'
      : 'Hesabınızı təsdiqləmək üçün e-mail ünvanınızı daxil edin.';
  };

  function updateOtpSub(){
    var sub = getEl('auth-otp-sub');
    if(!sub) return;
    var val = (_contactMode === 'phone') ? (getEl('auth-phone') && getEl('auth-phone').value) : (getEl('auth-email') && getEl('auth-email').value);
    if(val && val.trim()) sub.textContent = '"' + val.trim() + '" ünvanına göndərilən 6 rəqəmli kodu daxil edin.';
    else sub.textContent = 'Hesabınıza göndərilən 6 rəqəmli kodu daxil edin.';
  }

  // ── OTP input logic ──────────────────────────────────────
  function authInitOtp(){
    var inputs = document.querySelectorAll('.auth-otp-input');
    inputs.forEach(function(input, i){
      input.value = '';
      input.classList.remove('filled');
      // Remove old listeners by cloning
      var clone = input.cloneNode(true);
      input.parentNode.replaceChild(clone, input);
    });
    var freshInputs = document.querySelectorAll('.auth-otp-input');
    freshInputs.forEach(function(input, i){
      input.addEventListener('input', function(e){
        var val = e.target.value.replace(/[^0-9]/g,'');
        e.target.value = val.slice(0,1);
        if(val) e.target.classList.add('filled');
        else e.target.classList.remove('filled');
        if(val && i < freshInputs.length - 1) freshInputs[i+1].focus();
      });
      input.addEventListener('keydown', function(e){
        if(e.key === 'Backspace' && !e.target.value && i > 0){
          freshInputs[i-1].focus();
          freshInputs[i-1].classList.remove('filled');
        }
      });
      input.addEventListener('paste', function(e){
        e.preventDefault();
        var paste = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g,'');
        freshInputs.forEach(function(inp, j){
          inp.value = paste[j] || '';
          if(inp.value) inp.classList.add('filled');
          else inp.classList.remove('filled');
        });
        var last = Math.min(paste.length, freshInputs.length) - 1;
        if(last >= 0) freshInputs[last].focus();
      });
    });
    if(freshInputs[0]) freshInputs[0].focus();
  }

  window.authResendOtp = function(){
    if(typeof showToast === 'function') showToast('Kod yenidən göndərildi 📩');
    authInitOtp();
  };

  window.authOpenOtpHelp = function(){
    var sub = getEl('auth-otp-help');
    if(sub) sub.classList.add('open');
  };

  window.authCloseOtpHelp = function(){
    var sub = getEl('auth-otp-help');
    if(sub) sub.classList.remove('open');
  };

  // ── Password strength ────────────────────────────────────
  window.authCheckPwStrength = function(val){
    var fill = getEl('auth-pw-strength-fill');
    var label = getEl('auth-pw-strength-label');
    if(!fill || !label) return;
    var score = 0;
    if(val.length >= 8) score++;
    if(/[A-Z]/.test(val)) score++;
    if(/[0-9]/.test(val)) score++;
    if(/[^A-Za-z0-9]/.test(val)) score++;
    var widths  = ['0%','28%','52%','76%','100%'];
    var colors  = ['#e0e0e0','#ba1a1a','#F06328','#FCBC05','#0DB0A0'];
    var labels  = ['','Zəif','Orta','Güclü','Çox güclü'];
    fill.style.width    = widths[score];
    fill.style.background = colors[score];
    label.textContent   = labels[score];
    label.style.color   = colors[score];
  };

  // ── Password toggle ──────────────────────────────────────
  window.authTogglePw = function(inputId, btn){
    var inp = getEl(inputId);
    if(!inp) return;
    var isText = inp.type === 'text';
    inp.type = isText ? 'password' : 'text';
    btn.innerHTML = isText
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
  };

  // ── Avatar upload ────────────────────────────────────────
  window.authHandleAvatar = function(input){
    if(!input.files || !input.files[0]) return;
    var reader = new FileReader();
    reader.onload = function(e){
      var preview = getEl('auth-avatar-preview');
      var circle  = getEl('auth-avatar-circle');
      if(preview){ preview.src = e.target.result; preview.style.display = 'block'; }
      if(circle)  circle.style.display = 'none';
    };
    reader.readAsDataURL(input.files[0]);
  };

  // ── Region selection ────────────────────────────────────
  window.authSelectRegion = function(btn){
    document.querySelectorAll('.auth-region-item').forEach(function(item){
      item.classList.remove('active');
      var icon = item.querySelector('.auth-region-icon');
      if(icon) icon.classList.remove('active');
      var check = item.querySelector('.auth-region-check-fill');
      var radio = item.querySelector('.auth-region-radio-ring');
      if(check) check.style.display = 'none';
      if(radio) radio.style.display = 'block';
    });
    btn.classList.add('active');
    var icon = btn.querySelector('.auth-region-icon');
    if(icon) icon.classList.add('active');
    var check = btn.querySelector('.auth-region-check-fill');
    var radio = btn.querySelector('.auth-region-radio-ring');
    if(check) check.style.display = 'flex';
    if(radio) radio.style.display = 'none';
    _selectedRegion = btn.getAttribute('data-region');
  };

  window.authFilterRegions = function(term){
    term = term.toLowerCase();
    document.querySelectorAll('.auth-region-item').forEach(function(item){
      var region = (item.getAttribute('data-region') || '').toLowerCase();
      item.style.display = region.includes(term) ? '' : 'none';
    });
  };

  // ── Confetti ─────────────────────────────────────────────
  var _confettiRunning = false;
  function authLaunchConfetti(){
    var canvas = getEl('auth-confetti-canvas');
    if(!canvas) return;
    var sheet = getEl('auth-sheet');
    canvas.width  = sheet ? sheet.offsetWidth  : 400;
    canvas.height = sheet ? sheet.offsetHeight : 600;
    var ctx = canvas.getContext('2d');
    var colors = ['#e76262','#4A81EF','#F06328','#FCBC05','#3DA950','#DF4843','#a78bfa'];
    var particles = [];
    for(var i = 0; i < 80; i++){
      particles.push({
        x: Math.random() * canvas.width,
        y: -10 - Math.random() * 40,
        r: 4 + Math.random() * 5,
        d: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 12 - 6,
        tiltIncr: .1 + Math.random() * .2,
        tiltAngle: 0
      });
    }
    _confettiRunning = true;
    function draw(){
      if(!_confettiRunning){ ctx.clearRect(0,0,canvas.width,canvas.height); return; }
      ctx.clearRect(0,0,canvas.width,canvas.height);
      particles.forEach(function(p){
        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 3, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 5);
        ctx.stroke();
        p.tiltAngle += p.tiltIncr;
        p.y += p.d;
        p.tilt = Math.sin(p.tiltAngle) * 12;
        if(p.y > canvas.height + 10){
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      });
      requestAnimationFrame(draw);
    }
    draw();
    // Stop after 4s
    setTimeout(function(){ _confettiRunning = false; }, 4000);
  }

  // ── Keyboard close on Escape ─────────────────────────────
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      var overlay = getEl('auth-overlay');
      if(overlay && overlay.classList.contains('open')) closeAuthFlow();
    }
  });

  // ── Inject authShake keyframe ────────────────────────────
  var styleEl = document.createElement('style');
  styleEl.textContent = '@keyframes authShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}';
  document.head.appendChild(styleEl);

  // ── Init: hide overlay ────────────────────────────────────
  var overlay = getEl('auth-overlay');
  if(overlay) overlay.style.display = 'none';

})();
function copyShareLink(){
  const input=document.getElementById('share-link');
  if(!input) return;
  input.select();
  input.setSelectionRange(0,99999);
  if(navigator.clipboard){
    navigator.clipboard.writeText(input.value).then(()=>alert('Link kopyalandı ✅')).catch(()=>alert('Link kopyalandı ✅'));
  } else {
    document.execCommand('copy');
    alert('Link kopyalandı ✅');
  }
}
function shareVia(platform){
  const url=encodeURIComponent(document.getElementById('share-link')?.value||'');
  const text=encodeURIComponent('Bu məhsula bax: ');
  const links={
    whatsapp:`https://wa.me/?text=${text}${url}`,
    telegram:`https://t.me/share/url?url=${url}&text=${text}`,
    instagram:'#'
  };
  if(platform==='instagram'){alert('Instagram paylaşımı üçün link kopyalanıb, bio və ya DM ilə paylaşa bilərsiniz.');copyShareLink();return;}
  window.open(links[platform], '_blank');
}
function openCreateProductModal(){
  const el=document.getElementById('create-product-modal');
  if(el){el.classList.add('open');document.body.style.overflow='hidden';}
}
function handleCreateUpload(e){
  const file=e.target.files[0];
  if(file){document.getElementById('create-upload-title').textContent=file.name;}
}
function submitCreateProduct(){
  const title=document.getElementById('create-title').value.trim();
  if(!title){alert('Zəhmət olmasa başlıq daxil edin.');return;}
  closeModal('create-product-modal');
  showToast('Məhsul hazırlatma sorğusu göndərildi! 🎨');
  document.getElementById('create-title').value='';
  document.getElementById('create-desc').value='';
  document.getElementById('create-price').value='';
  document.getElementById('create-upload-title').textContent='Şəkil yükləyin';
  const fileInput=document.getElementById('create-file-input');
  if(fileInput) fileInput.value='';
}

function openModal(id){const el=document.getElementById(id);if(el){el.classList.add('open');document.body.style.overflow='hidden';}}
function closeModal(id){const el=document.getElementById(id);if(el){el.classList.remove('open');document.body.style.overflow='';}}
document.querySelectorAll('.modal-overlay').forEach(ov=>{
  ov.addEventListener('click',e=>{if(e.target===ov)closeModal(ov.id)});
});

function switchTab(name,el){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  if(el) el.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  const panel=document.getElementById('tab-'+name);
  if(panel) panel.classList.add('active');
}
function setFilterTab(el){
  if(!el) return;
  const parent=el.parentElement;
  if(parent) parent.querySelectorAll('.filter-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
}
function toggleWishSvg(btn){
  const liked=btn.dataset.liked==='true';
  const newLiked=!liked;
  btn.dataset.liked=newLiked.toString();
  btn.classList.toggle('is-active', newLiked);
  btn.setAttribute('aria-pressed', newLiked.toString());
  btn.setAttribute('aria-label', newLiked ? 'İstək siyahısından çıxart' : 'İstək siyahısına əlavə et');
}
function toggleVideoLike(btn) {
 
  const unlikedSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 4C4.4625 4 2 6.4625 2 9.5C2 15 8.5 20 12 21.163C15.5 20 22 15 22 9.5C22 6.4625 19.5375 4 16.5 4C14.64 4 12.995 4.9235 12 6.337C11.4928 5.61469 10.819 5.0252 10.0357 4.61841C9.25238 4.21162 8.38263 3.9995 7.5 4Z" fill="#D9D9D9" fill-opacity="0.12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  const likedSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 4C4.4625 4 2 6.4625 2 9.5C2 15 8.5 20 12 21.163C15.5 20 22 15 22 9.5C22 6.4625 19.5375 4 16.5 4C14.64 4 12.995 4.9235 12 6.337C11.4928 5.61469 10.819 5.0252 10.0357 4.61841C9.25238 4.21162 8.38263 3.9995 7.5 4Z" fill="#FF688B" stroke="#FF688B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

 
  if (btn.getAttribute('data-liked') === 'true') {
    btn.innerHTML = unlikedSvg;
    btn.setAttribute('data-liked', 'false');
  } else {
    // Əgər bəyənilməyibsə
    btn.innerHTML = likedSvg;
    btn.setAttribute('data-liked', 'true');
  }
}
function shareProduct(id){
  const p=PRODUCTS.find(x=>x.id===id);
  if(!p) return;
  navigator.clipboard?.writeText('https://inself.az/product/'+id).then(()=>showToast('Link kopyalandı ✅')).catch(()=>showToast('Link kopyalandı ✅'));
}
function addToCart(id){
    showToast('Səbətə əlavə edildi 🛒'); // Burada ; olmalıdır
}

function maraqlan(id){
    showToast('Mesaj göndərildi! 💬 "Bu məhsul ilə maraqlanıram"'); // Burada ; olmalıdır
}

function showToast(msg){
    let t = document.getElementById('app-toast');
    if(!t){
        t = document.createElement('div');
        t.id = 'app-toast';
        t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.82);color:#fff;padding:.55rem 1.1rem;border-radius:9999px;font-size:.85rem;z-index:9999;white-space:nowrap;transition:opacity .3s'; // Sonda ;
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1'; 
    if(t._t) clearTimeout(t._t); 
    t._t = setTimeout(() => t.style.opacity = '0', 2200); 
}

document.addEventListener('keydown', e => {
    if(e.key === 'Escape'){
        document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id)); 
        const notifDrop = document.getElementById('notif-dropdown');
        if(notifDrop) notifDrop.classList.remove('open'); 
    }
}); // Dinləyicinin sonunda ;

(function(){
    const saved = localStorage.getItem('theme') || 'auto';
    document.documentElement.setAttribute('data-theme', saved); 
})(); 

function toggleTheme(){
    const html = document.documentElement;
    const cur = html.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : cur === 'light' ? 'auto' : 'dark';
    html.setAttribute('data-theme', next); 
    localStorage.setItem('theme', next); 
    const icons = {'auto':'🌗', 'light':'☀️', 'dark':'🌙'};
    const btn = document.getElementById('theme-toggle-btn');
    if(btn) btn.textContent = icons[next]; 
    showToast('Tema: ' + ({'auto':'Avtomatik', 'light':'Açıq', 'dark':'Tünd'}[next])); 
}


// ── FILTER MODAL ──
function openFilterModal(){document.getElementById('filter-modal').classList.add('open');document.body.style.overflow='hidden'}
function closeFilterModal(){document.getElementById('filter-modal').classList.remove('open');document.body.style.overflow=''}
function filterModalBgClick(e){if(e.target===document.getElementById('filter-modal'))closeFilterModal()}
function toggleFilterSection(head){
  const body=head.nextElementSibling;
  const chevron=head.querySelector('.filter-chevron');
  const isOpen=body&&body.classList.contains('open');
  if(body){body.classList.toggle('open',!isOpen);}
  if(chevron) chevron.classList.toggle('open',!isOpen);
}
function toggleFilterRow(row, filter, value){
  row.classList.toggle('checked');
  const cb=row.querySelector('input[type=checkbox]');
  if(cb) cb.checked=row.classList.contains('checked');
  updateFilterCount();
}
function toggleOzellik(row, value){
  row.classList.toggle('checked');
  const cb=row.querySelector('input[type=checkbox]');
  if(cb) cb.checked=row.classList.contains('checked');
  updateFilterCount();
}
function togglePriceChip(chip, value){
  chip.classList.toggle('selected');
  updateFilterCount();
}
function clearAllFilters(){
  document.querySelectorAll('.filter-check-row.checked').forEach(r=>r.classList.remove('checked'));
  document.querySelectorAll('.ozellik-row.checked').forEach(r=>r.classList.remove('checked'));
  document.querySelectorAll('.price-q-chip.selected').forEach(c=>c.classList.remove('selected'));
  document.querySelectorAll('#filter-modal input[type=checkbox]').forEach(cb=>cb.checked=false);
  const minEl=document.getElementById('f-min-price');if(minEl)minEl.value='0';
  const maxEl=document.getElementById('f-max-price');if(maxEl)maxEl.value='500';
  updateFilterCount();
}
function resetSection(sec){
  document.querySelectorAll(`#filter-modal input[data-filter="${sec}"]`).forEach(cb=>{cb.checked=false;const r=cb.closest('.filter-check-row');if(r)r.classList.remove('checked')});
  updateFilterCount();
}
function toggleColour(btn,colour){btn.classList.toggle('selected');updateFilterCount()}
function updateFilterCount(){
  const checked=document.querySelectorAll('.filter-check-row.checked,.ozellik-row.checked,.price-q-chip.selected').length;
  const filterBtn=document.getElementById('filter-open-btn');
  if(filterBtn) filterBtn.classList.toggle('active-filters',checked>0);
  const cnt=document.getElementById('filter-product-count');
  if(cnt) cnt.textContent=Math.max(1,11-checked+Math.floor(Math.random()*3));
}
document.addEventListener('change',e=>{if(e.target.closest('#filter-modal'))updateFilterCount()});
function applyFilters(){
  const checked=[...document.querySelectorAll('#filter-modal input[type=checkbox]:checked')];
  const catFilters=checked.filter(cb=>cb.dataset.filter==='cat').map(cb=>cb.value);
  const priceRanges=checked.filter(cb=>cb.dataset.filter==='price_range').map(cb=>cb.value);
  let list=PRODUCTS.slice();
  if(catFilters.length) list=list.filter(p=>catFilters.includes(p.cat));
  if(priceRanges.length){
    list=list.filter(p=>{
      const price=parseFloat(p.price)||0;
      return priceRanges.some(r=>{
        if(r==='0-20') return price<=20;
        if(r==='20-50') return price>20&&price<=50;
        if(r==='50-100') return price>50&&price<=100;
        if(r==='100+') return price>100;
      });
    });
  }
  renderProducts(list);
  closeFilterModal();
  showToast('Filtrlər tətbiq edildi ('+list.length+' məhsul)');
}

// ── LISTING STEPS ──
let _listingStep=1;
const _listingSteps={
  1:{cardTitle:'Məhsulun təsvirlərini yükləyin',pct:'25% Tamamlandı',progress:'25%',screenTitle:null,screenSub:null},
  2:{cardTitle:'Məhsul Məlumatı',pct:'50% Tamamlandı',progress:'50%',screenTitle:'Məhsulun Məlumatları',screenSub:'Məhsulunuzu daha yaxşı tanıtmaq üçün detalları qeyd edin.'},
  3:{cardTitle:'Kateqoriya və Təsvir',pct:'75% Tamamlandı',progress:'75%',screenTitle:'Kateqoriya və Təsvir',screenSub:'Məhsulunuzu düzgün kateqoriyaya yerləşdirin və ətraflı məlumat verin.'},
  4:{cardTitle:'Açar sözlər',pct:'100% Tamamlandı',progress:'100%',screenTitle:'Teqlər',screenSub:null},
};
function openListingModal(){
  _listingStep=1;_renderListingStep();
  document.getElementById('listing-modal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeListingModal(){document.getElementById('listing-modal').classList.remove('open');document.body.style.overflow=''}
function listingModalBgClick(e){if(e.target===document.getElementById('listing-modal'))closeListingModal()}
function _renderListingStep(){
  document.querySelectorAll('.lstep').forEach(s=>s.classList.remove('active'));
  const stepEl=document.getElementById('lstep-'+_listingStep);
  if(stepEl) stepEl.classList.add('active');
  const d=_listingSteps[_listingStep];
  const pctDone=_listingStep===4;
  ['listing-progress-title','listing-progress-title-d'].forEach(id=>{
    const el=document.getElementById(id);if(el) el.textContent=d.cardTitle;
  });
  ['listing-pct-label','listing-pct-label-d'].forEach(id=>{
    const el=document.getElementById(id);
    if(el){el.textContent=d.pct;el.classList.toggle('done',pctDone);}
  });
  ['listing-progress-bar','listing-progress-bar-d'].forEach(id=>{
    const el=document.getElementById(id);if(el) el.style.width=d.progress;
  });
  const stEl=document.getElementById('listing-screen-title-'+_listingStep);
  const sbEl=document.getElementById('listing-screen-sub-'+_listingStep);
  if(stEl&&d.screenTitle) stEl.textContent=d.screenTitle;
  if(sbEl){
    if(d.screenSub){sbEl.textContent=d.screenSub;sbEl.style.display=''}
    else{sbEl.textContent='';sbEl.style.display='none'}
  }
  const nextBtn=document.getElementById('listing-next-btn');
  if(nextBtn){
    if(_listingStep===4){
      nextBtn.innerHTML='Paylaş';
      nextBtn.onclick=publishListing;
    } else {
      nextBtn.innerHTML='Növbəti <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12.175 9H0V7H12.175L6.575 1.4L8 0L16 8L8 16L6.575 14.6L12.175 9Z" fill="white"/></svg>';
      nextBtn.onclick=listingNextStep;
    }
  }
  updateDescCount();
}
function updateDescCount(){
  const ta=document.getElementById('l-desc');
  const cnt=document.getElementById('l-desc-count');
  if(ta&&cnt) cnt.textContent=(ta.value.length)+' / 2000 simvol';
}
function listingNextStep(){
  if(_listingStep<4){_listingStep++;_renderListingStep();}
}
function listingPrevStep(){
  if(_listingStep>1){_listingStep--;_renderListingStep();}
  else closeListingModal();
}
function addTagBtn(){
  const input=document.getElementById('l-tag-input');
  if(!input) return;
  const val=input.value.trim();
  if(!val) return;
  const wrap=document.getElementById('l-tags');
  if(wrap){
    const span=document.createElement('span');
    span.className='listing-tag-chip';
    span.innerHTML='<span class="hash">#</span> '+val+' <span class="l-tag-x" onclick="this.parentElement.remove()">×</span>';
    wrap.appendChild(span);
  }
  input.value='';
}
function handleDrop(e){
  e.preventDefault();
  document.getElementById('drop-zone').classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
}
function handleFileInput(input){handleFiles(input.files)}
function handleFiles(files){
  const row=document.getElementById('preview-row');
  const existing=row.querySelectorAll('.upload-preview-item').length;
  if(existing>=10){showToast('Maksimum 10 şəkil yükləyə bilərsiniz');return}
  Array.from(files).slice(0,10-existing).forEach((file,i)=>{
    if(!file.type.startsWith('image/')) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const div=document.createElement('div');
      div.className='upload-preview-item'+(existing+i===0?' cover-img':'');
      div.title='Üzlük şəkli seçmək üçün klikləyin';
      div.innerHTML=`<img src="${ev.target.result}" alt="preview"><button type="button" class="upload-remove-btn" onclick="event.stopPropagation();removePreview(this)">×</button>${existing+i===0?'<div class="cover-tag">ƏSAS</div>':''}`;
      div.addEventListener('click',function(e){if(!e.target.classList.contains('upload-remove-btn')){setCover(div)}});
      row.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}
function setCover(div){
  document.querySelectorAll('.upload-preview-item').forEach(el=>{el.classList.remove('cover-img');const t=el.querySelector('.cover-tag');if(t)t.remove()});
  div.classList.add('cover-img');
  if(!div.querySelector('.cover-tag')){const t=document.createElement('div');t.className='cover-tag';t.textContent='ƏSAS';div.appendChild(t);}
}
function removePreview(btn){
  const item=btn.parentElement;
  const wasCover=item.classList.contains('cover-img');
  item.remove();
  if(wasCover){const first=document.querySelector('.upload-preview-item');if(first)setCover(first);}
}
let listingTags=[];
function addTag(e){
  if(e.key!=='Enter') return;
  const input=document.getElementById('l-tag-input');
  const val=input.value.trim();
  if(!val||listingTags.length>=13) return;
  listingTags.push(val);
  renderTags();
  input.value='';
}
function removeTag(idx){listingTags.splice(idx,1);renderTags()}
function renderTags(){
  const wrap=document.getElementById('l-tags');
  if(!wrap) return;
  const preset=[...wrap.querySelectorAll('.listing-tag-chip[data-preset]')];
  const dynamic=listingTags.map((t,i)=>`<span class="listing-tag-chip"><span class="hash">#</span> ${t}<span class="l-tag-x" onclick="removeTag(${i})">×</span></span>`).join('');
  wrap.innerHTML=preset.map(el=>el.outerHTML).join('')+dynamic;
}
function togglePersonalization(cb){document.getElementById('person-extra').classList.toggle('open',cb.checked)}
function saveDraft(){showToast('Qaralama olaraq saxlandı 📝');closeListingModal()}
function publishListing(){
  const title=document.getElementById('l-title')?.value.trim();
  const cat=document.getElementById('l-cat')?.value;
  if(!title){showToast('Zəhmət olmasa başlıq daxil edin');return}
  if(!cat){showToast('Zəhmət olmasa kateqoriya seçin');return}
  showToast('Məhsul uğurla dərc edildi! 🎉');
  closeListingModal();
}

// ── SETTINGS PAGE (STABLE) ──
window.openStableSettings = function() {
  // 1. Bütün əsas səhifələri gizlət
  var pages = ['home','video','search','messages','profile'];
  pages.forEach(function(p) {
    var el = document.getElementById('page-' + p);
    if (el) el.classList.remove('active');
  });
  // 2. Açılıb qalan panelləri bağla
  ['.pd-panel','.pd-seller-panel','.detail-overlay','.modal'].forEach(function(sel) {
    document.querySelectorAll(sel).forEach(function(el) {
      el.style.display = 'none';
      el.classList.remove('open','active');
    });
  });
  // 3. Navbar vəziyyətini tənzimlə
  if (typeof updateNavbarForDetail === 'function') updateNavbarForDetail(true);
  // 4. Bottom nav aktiv vəziyyətini sıfırla
  document.querySelectorAll('.bottom-nav-item').forEach(function(b) { b.classList.remove('active'); });
  document.body.classList.remove('page-settings');
  // 5. Settings səhifəsini göstər (yalnız .active sinfi — inline display istifadə etmə)
  var s = document.getElementById('page-settings');
  if (s) { s.style.display = ''; s.classList.add('active'); }
  document.body.classList.add('settings-open');
  if (window.innerWidth >= 900) {
    switchSettingsSection('account');
    renderSettingsProfileDisplay();
    syncSettingsLangThemeUI();
  }
  // 6. Yuxarıya sürüşdür
  window.scrollTo(0, 0);
};

window.closeStableSettings = function() {
  hideSettingsOverlay();
  if (typeof updateNavbarForDetail === 'function') updateNavbarForDetail(false);
  showPage('home');
};

// Köhnə adlar – geriyə uyğunluq üçün
function showSettings() { openStableSettings(); }
function closeSettings() { closeStableSettings(); }

function isDesktopSettingsView() {
  return window.innerWidth >= 900 && document.body.classList.contains('settings-open');
}

const SETTINGS_META = {
  account:      { title: 'Hesab məlumatlarım', sub: 'Şəxsi məlumatlarınızı və hesab tənzimləmələrini idarə edin.' },
  'account-type': { title: 'Hesab tipi', sub: 'Alıcı və ya satıcı hesabı arasında seçim edin.' },
  activity:     { title: 'Fəaliyyətlər', sub: 'Son hesab fəaliyyətlərinizin tarixçəsi.' },
  blocked:      { title: 'Bloklanmış', sub: 'Blokladığınız istifadəçiləri idarə edin.' },
  language:     { title: 'Dil', sub: 'İnterfeys dilini seçin.' },
  appearance:   { title: 'Görünüş', sub: 'Tətbiqin görünüş rejimini tənzimləyin.' },
  privacy:      { title: 'Məxfilik siyasəti', sub: 'Məlumatlarınızın necə qorunduğu haqqında.' },
  terms:        { title: 'İstifadə şərtləri', sub: 'Platformadan istifadə qaydaları.' },
  about:        { title: 'Haqqında', sub: 'Hobbi platforması haqqında məlumat.' },
  support:      { title: 'Dəstək', sub: 'Komandamızla əlaqə saxlayın.' }
};

let SETTINGS_ACTIVITIES = [
  { icon: '🛒', text: 'Keramika fincan sifariş etdiniz', time: '2 saat əvvəl' },
  { icon: '⭐', text: 'Mağazanıza 5 ulduz rəy verdiniz', time: '1 gün əvvəl' },
  { icon: '💬', text: 'Sənətkarla mesajlaşdınız', time: '3 gün əvvəl' },
  { icon: '❤️', text: 'Xalça kolleksiyasını bəyəndiniz', time: '1 həftə əvvəl' }
];

let SETTINGS_BLOCKED = [
  { id: 'u1', name: '@spam_satici', reason: 'Spam mesajlar' },
  { id: 'u2', name: '@fake_shop', reason: 'Saxta məhsul elanı' }
];

function getProfileData() {
  try {
    return JSON.parse(localStorage.getItem('hobbi_profile') || '{}');
  } catch(e) { return {}; }
}

function saveProfileData(data) {
  const merged = Object.assign({ name: 'Orxan Məmmədov', email: 'orxan@example.com', phone: '+994 50 123 45 67', location: 'Bakı, Azərbaycan', bio: 'Keramika həvəskarı. Hər bir əsər bir hekayə danışır. ✨' }, getProfileData(), data);
  localStorage.setItem('hobbi_profile', JSON.stringify(merged));
  return merged;
}

function renderSettingsProfileDisplay() {
  const p = saveProfileData({});
  document.querySelectorAll('[data-profile-name]').forEach(el => { el.textContent = p.name; });
  document.querySelectorAll('[data-profile-email]').forEach(el => { el.textContent = p.email; });
  document.querySelectorAll('[data-profile-phone]').forEach(el => { el.textContent = p.phone; });
  document.querySelectorAll('[data-profile-location]').forEach(el => { el.textContent = '📍 ' + p.location; });
  const bioEl = document.getElementById('sp-profile-bio-input');
  if (bioEl) bioEl.value = p.bio;
  const nameIn = document.getElementById('sp-profile-name-input');
  const emailIn = document.getElementById('sp-profile-email-input');
  const phoneIn = document.getElementById('sp-profile-phone-input');
  const locIn = document.getElementById('sp-profile-location-input');
  if (nameIn) nameIn.value = p.name;
  if (emailIn) emailIn.value = p.email;
  if (phoneIn) phoneIn.value = p.phone;
  if (locIn) locIn.value = p.location;
}

function renderSettingsActivityList() {
  const el = document.getElementById('sp-activity-list');
  if (!el) return;
  if (!SETTINGS_ACTIVITIES.length) {
    el.innerHTML = '<div class="sp-empty-state"><div class="sp-empty-state-icon">📋</div>Son fəaliyyət yoxdur.</div>';
    return;
  }
  el.innerHTML = SETTINGS_ACTIVITIES.map(a =>
    '<div class="sp-activity-item"><div class="sp-activity-icon">' + a.icon + '</div><div><div class="sp-activity-text">' + a.text + '</div><div class="sp-activity-time">' + a.time + '</div></div></div>'
  ).join('');
}

function renderSettingsBlockedList() {
  const el = document.getElementById('sp-blocked-list');
  if (!el) return;
  if (!SETTINGS_BLOCKED.length) {
    el.innerHTML = '<div class="sp-empty-state"><div class="sp-empty-state-icon">🚫</div>Bloklanmış istifadəçi yoxdur.</div>';
    return;
  }
  el.innerHTML = SETTINGS_BLOCKED.map(u =>
    '<div class="sp-blocked-item" data-blocked-id="' + u.id + '"><div class="sp-blocked-avatar">👤</div><div><div class="sp-blocked-name">' + u.name + '</div><div class="sp-blocked-reason">' + u.reason + '</div></div><button class="sp-unblock-btn" onclick="unblockSettingsUser(\'' + u.id + '\')">Bloku aç</button></div>'
  ).join('');
}

function unblockSettingsUser(id) {
  SETTINGS_BLOCKED = SETTINGS_BLOCKED.filter(u => u.id !== id);
  renderSettingsBlockedList();
  showToast('Blok açıldı ✅');
}

function syncSettingsLangThemeUI() {
  const lang = localStorage.getItem('hobbi_lang') || 'az';
  const theme = localStorage.getItem('theme') || document.documentElement.getAttribute('data-theme') || 'auto';
  document.querySelectorAll('.sp-lang-opt').forEach(o => o.classList.toggle('selected', o.dataset.lang === lang));
  document.querySelectorAll('.sp-theme-opt').forEach(o => o.classList.toggle('selected', o.dataset.theme === theme));
  document.querySelectorAll('.lang-option').forEach(o => o.classList.remove('selected'));
  document.getElementById('lang-' + lang)?.classList.add('selected');
  document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('selected'));
  document.getElementById('theme-' + theme)?.classList.add('selected');
  const badge = document.querySelector('.sp-mob-item-badge');
  if (badge) badge.textContent = lang === 'az' ? 'Azərbaycan' : 'Русский';
  document.querySelectorAll('.sp-desk-extra-item').forEach(item => {
    const txt = item.querySelector('.sp-desk-extra-text');
    if (txt && txt.textContent.trim() === 'İnterfeys dili') {
      const sub = item.querySelector('.sp-desk-extra-sub');
      if (sub) sub.textContent = 'Hazırda: ' + (lang === 'az' ? 'Azərbaycan dili' : 'Русский язык');
    }
  });
}

function switchSettingsSection(name) {
  if (!isDesktopSettingsView()) {
    openSubPanel(name);
    return;
  }
  const meta = SETTINGS_META[name] || SETTINGS_META.account;
  document.querySelectorAll('.sp-desk-nav-item[data-section]').forEach(el => {
    el.classList.toggle('active', el.dataset.section === name);
  });
  document.querySelectorAll('.sp-desk-pane').forEach(el => {
    el.classList.toggle('active', el.dataset.section === name);
  });
  const titleEl = document.getElementById('sp-desk-dynamic-title');
  const subEl = document.getElementById('sp-desk-dynamic-sub');
  if (titleEl) titleEl.textContent = meta.title;
  if (subEl) subEl.textContent = meta.sub;
  if (name === 'activity') renderSettingsActivityList();
  if (name === 'blocked') renderSettingsBlockedList();
  if (name === 'language' || name === 'appearance') syncSettingsLangThemeUI();
  if (name === 'account') renderSettingsProfileDisplay();
  const content = document.querySelector('.sp-desk-content');
  if (content) content.scrollTop = 0;
}

function toggleAccountEditMode(show) {
  const view = document.getElementById('sp-account-view');
  const form = document.getElementById('sp-account-edit');
  if (view) view.style.display = show ? 'none' : '';
  if (form) form.style.display = show ? 'block' : 'none';
  if (show) renderSettingsProfileDisplay();
}

function saveAccountProfile() {
  const data = {
    name: document.getElementById('sp-profile-name-input')?.value.trim(),
    email: document.getElementById('sp-profile-email-input')?.value.trim(),
    phone: document.getElementById('sp-profile-phone-input')?.value.trim(),
    location: document.getElementById('sp-profile-location-input')?.value.trim(),
    bio: document.getElementById('sp-profile-bio-input')?.value.trim()
  };
  if (!data.name) { showToast('Ad daxil edin'); return; }
  saveProfileData(data);
  renderSettingsProfileDisplay();
  toggleAccountEditMode(false);
  showToast('Məlumatlar yadda saxlandı ✅');
}

function submitSupportForm() {
  const msg = document.getElementById('sp-support-msg')?.value.trim();
  if (!msg) { showToast('Mesaj yazın'); return; }
  document.getElementById('sp-support-msg').value = '';
  showToast('Müraciətiniz göndərildi ✅');
}

function openSubPanel(name){
  if (isDesktopSettingsView()) {
    switchSettingsSection(name);
    return;
  }
  const p=document.getElementById('sub-'+name);
  if(p) p.classList.add('open');
}
function closeSubPanel(name){
  const p=document.getElementById('sub-'+name);
  if(p) p.classList.remove('open');
}
function selectLang(lang){
  localStorage.setItem('hobbi_lang', lang);
  document.querySelectorAll('.lang-option').forEach(o=>o.classList.remove('selected'));
  document.getElementById('lang-'+lang)?.classList.add('selected');
  syncSettingsLangThemeUI();
  showToast('Dil dəyişdirildi: '+(lang==='az'?'Azərbaycan':'Русский'));
}
function selectTheme(theme){
  document.querySelectorAll('.theme-option').forEach(o=>o.classList.remove('selected'));
  document.getElementById('theme-'+theme)?.classList.add('selected');
  document.documentElement.setAttribute('data-theme',theme);
  localStorage.setItem('theme',theme);
  syncSettingsLangThemeUI();
  showToast('Tema: '+({'auto':'Avtomatik','light':'Açıq','dark':'Tünd'}[theme]));
}
function logoutConfirm(){
  if(confirm('Çıxış etmək istədiyinizə əminsiniz?')){
    showToast('Çıxış edildi. Görüşənədək! 👋');
    closeSettings();
  }
}

// update PAGES array to include settings
PAGES.push('settings');

renderProducts();
renderIdeas();
renderVideos();
renderProfileProducts();
document.addEventListener("DOMContentLoaded", function(){ updateNotifIcons(); });
/* ─────────────────────────────────────────────────────────
   YENİ TƏKMİLLƏŞDİRİLMİŞ REELS QİYMƏT VƏ ENTER SİSTEMİ
   ───────────────────────────────────────────────────────── */

// 1. Təkrar klikləmələri yoxlamaq üçün qoruyucu obyekt
if (!window.reelsPriceCheckedItems) {
  window.reelsPriceCheckedItems = {};
}

// 2. Qiymət Butonu Funksiyası (Spam qorumalı və fərqli videolar üçün unikal)
window.submitReelsPriceComment = function() {
  var currentVideoId = 'global_reels_default';
  
  // Açıq olan rəy siyahısından unikal video ID-si təyin edirik
  var commentsList = document.getElementById('reels-comments-list');
  if (commentsList) {
    var firstComment = commentsList.querySelector('div');
    if (firstComment) {
      currentVideoId = 'video_' + encodeURIComponent(firstComment.innerText.substring(0, 50));
    }
  }

  // Əgər istifadəçi bu videoda artıq maraqlanıbsa, dayandırırıq və bildiriş veririk
  if (window.reelsPriceCheckedItems[currentVideoId]) {
    showReelsToast("Siz artıq qiymət ilə maraqlanmısınız.");
    return; 
  }

  var inp = document.getElementById('reels-comment-input');
  if (!inp) return;

  // İnputa avtomatik "Qiymət?" yazırıq
  inp.value = "Qiymət?";

  // Orijinal rəy göndərmə (bayaq dediyiniz Göndər) funksiyasını çağırırıq
  if (typeof window.submitReelsComment === 'function') {
    window.submitReelsComment();
    
    // Bu video üçün düyməni qoruyuruq
    window.reelsPriceCheckedItems[currentVideoId] = true;
  }
};

// 3. Ekranda görünən Narıncı Toast Bildiriş Funksiyası
function showReelsToast(message) {
  var oldToast = document.getElementById('reels-toast-notice');
  if (oldToast) oldToast.remove();

  var toast = document.createElement('div');
  toast.id = 'reels-toast-notice';
  toast.innerText = message;
  
  toast.style.cssText = `
    position: fixed !important;
    bottom: 120px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    background-color: #F3660E !important;
    color: #ffffff !important;
    padding: 12px 24px !important;
    border-radius: 30px !important;
    font-size: 0.9rem !important;
    font-weight: 600 !important;
    z-index: 999999 !important;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
    text-align: center !important;
    white-space: nowrap !important;
    pointer-events: none !important;
    display: block !important;
    opacity: 1 !important;
    animation: fadeInOutReels 2.5s ease forwards !important;
  `;

  var styleTag = document.getElementById('reels-toast-style');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'reels-toast-style';
    styleTag.innerHTML = `
      @keyframes fadeInOutReels {
        0% { opacity: 0; transform: translate(-50%, 15px); }
        15% { opacity: 1; transform: translate(-50%, 0); }
        85% { opacity: 1; transform: translate(-50%, 0); }
        100% { opacity: 0; transform: translate(-50%, -15px); }
      }
    `;
    document.head.appendChild(styleTag);
  }

  document.body.appendChild(toast);

  setTimeout(function() {
    if (toast.parentNode) toast.remove();
  }, 2500);
}

// 4. Həm Mobil, həm Desktop üçün Enter düyməsi ilə göndərmə mexanizmi
window.checkReelsEnter = function(event) {
  if (event.key === 'Enter' || event.keyCode === 13) {
    event.preventDefault(); 
    if (typeof window.submitReelsComment === 'function') {
      window.submitReelsComment();
    }
  }
}

/* ══ SEARCH MODULE JS ══ */
(function(){
  var isMobile = function(){ return window.innerWidth <= 900; };
  var overlayMobile = document.getElementById('search-overlay-mobile');
  var panelDesktop  = document.getElementById('search-panel-desktop');
  var backdrop      = document.getElementById('search-backdrop');
  var topnavSearch  = document.getElementById('topnav-search');
  var spdInput      = document.getElementById('spd-input');
  var somInput      = document.getElementById('som-input');
  var _searchOpen   = false;
  var _historyPushed = false;

  /* ─── OPEN ─── */
  function openSearch(){
  if(_searchOpen) return;
  _searchOpen = true;

   if(isMobile()){
   overlayMobile.classList.remove('anim-exit','is-open');
   overlayMobile.classList.add('anim-enter');
   // Klaviaturanı 500ms sonra aç (kolleksiyalar görünsün)
    setTimeout(function(){ 
    if(somInput) {
      somInput.focus();
      somInput.click(); // bəzi brauzerlər üçün əlavə təminat
    }
  }, 500);
  }else {
    // desktop versiyası olduğu kimi
    backdrop.classList.remove('bd-closing');
    backdrop.classList.add('bd-open');
    panelDesktop.classList.remove('spd-closing');
    panelDesktop.classList.add('spd-open');
    var folders = panelDesktop.querySelectorAll('.spd-folder');
    folders.forEach(function(f){
      f.style.animation = 'none';
      f.offsetHeight;
      f.style.animation = '';
    });
    setTimeout(function(){ spdInput && spdInput.focus(); }, 80);
  }

  if(!_historyPushed){
    window.history.pushState({searchOpen:true}, '', window.location.href);
    _historyPushed = true;
  }
}

  /* ─── CLOSE MOBILE ─── */
  window.closeSearchMobile = function(){
    if(!_searchOpen) return;
    _searchOpen = false;
    _historyPushed = false;
    overlayMobile.classList.remove('anim-enter','is-open');
    overlayMobile.classList.add('anim-exit');
    overlayMobile.addEventListener('animationend', function onEnd(){
      overlayMobile.removeEventListener('animationend', onEnd);
      overlayMobile.classList.remove('anim-exit');
    }, {once:true});
    // Reset card animations for next open
    overlayMobile.querySelectorAll('.som-card').forEach(function(c){
      c.style.opacity = '0';
      c.style.transform = 'translateX(60px)';
    });
  };

  /* ─── CLOSE DESKTOP ─── */
  window.closeSearchDesktop = function(){
    if(!_searchOpen) return;
    _searchOpen = false;
    _historyPushed = false;
    backdrop.classList.remove('bd-open');
    backdrop.classList.add('bd-closing');
    panelDesktop.classList.remove('spd-open');
    panelDesktop.classList.add('spd-closing');
    backdrop.addEventListener('animationend', function onEnd(){
      backdrop.removeEventListener('animationend', onEnd);
      backdrop.classList.remove('bd-closing','bd-open');
    }, {once:true});
    panelDesktop.addEventListener('animationend', function onEnd(){
      panelDesktop.removeEventListener('animationend', onEnd);
      panelDesktop.classList.remove('spd-closing','spd-open');
    }, {once:true});
  };

  /* ─── CLOSE (auto select by viewport) ─── */
  function closeSearch(){
    if(isMobile()) window.closeSearchMobile();
    else window.closeSearchDesktop();
  }

  /* ─── BROWSER BACK BUTTON ─── */
  window.addEventListener('popstate', function(e){
    if(_searchOpen){
      closeSearch();
      _historyPushed = false;
    }
  });

  /* ─── CLICK ON TOPNAV SEARCH ─── */
  if(topnavSearch){
    topnavSearch.addEventListener('click', function(e){
      if(!isMobile()) openSearch();
    });
    // For mobile, the topnav search is hidden but just in case
    topnavSearch.addEventListener('focus', function(){ if(!isMobile()) openSearch(); }, true);
  }

  /* ─── MOBILE: Trigger from bottom nav search tab ─── */
  // Find the bottom nav search item and intercept click on homepage
  // We hook into the showPage function so when home is active and search icon tapped on mobile
  // we open overlay instead of going to the separate search page
  var _origShowPage = window.showPage;
  // We DO NOT override showPage for the bottom nav search tab to keep bottom-nav search unchanged per instructions
  // Instead we only hook the TOPNAV search input on homepage
  // On mobile, topnav may be hidden, so we also listen to the main topnav input on homepage
  var topnavInput = topnavSearch ? topnavSearch.querySelector('input') : null;
  if(topnavInput){
    topnavInput.addEventListener('focus', function(){
      if(isMobile()){
        topnavInput.blur();
        openSearch();
      } else {
        openSearch();
      }
    });
  }

  /* ─── ESC KEY ─── */
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && _searchOpen) closeSearch();
  });

  /* ─── CATEGORY CLICK HANDLER ─── */
  window.handleCategoryClick = function(cat){
    closeSearch();
    // Optionally filter or navigate
    if(typeof filterCat === 'function'){
      var catMap = {
        'ev-dekoru': 'all',
        'ketan-remler': 'resm',
        'hediyyelik': 'all',
        'deb-aksesuar': 'zergerllik'
      };
      filterCat(catMap[cat] || 'all');
    }
    if(typeof showPage === 'function') showPage('home');
  };

})();