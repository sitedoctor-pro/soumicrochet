(() => {
  'use strict';

  const SUPABASE_URL = 'https://axgcycsojorwztwlfprg.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_1YuKU9O3wuH1Zbikx_OonQ_ayCIjmSR';
  const WHATSAPP_NUMBER = '212662711995';
  const ONESIGNAL_APP_ID = '6565128a-14fe-46c3-be87-745cfd90b264';
  const locale = document.documentElement.dataset.locale || (document.documentElement.lang.startsWith('ar') ? 'ar' : 'fr');
  const basePrefix = document.documentElement.dataset.base || (location.pathname.includes('/ar/') ? '../' : './');
  const isAr = locale === 'ar';
  const $ = (id) => document.getElementById(id);
  const qs = (s, root = document) => root.querySelector(s);
  const qsa = (s, root = document) => [...root.querySelectorAll(s)];

  const text = isAr ? {
    price: 'الثمن', order: 'تأكيد الطلب', close: 'إغلاق', prev: 'الصورة السابقة', next: 'الصورة التالية',
    details: 'تفاصيل الموديل', invalidPhone: 'دخل رقم هاتف مغربي صحيح بحال 06XXXXXXXX.',
    missing: 'كملي جميع معلومات الطلب قبل التأكيد.', sending: 'جاري إرسال الطلب...',
    orderError: 'وقع مشكل فإرسال الطلب. عاودي المحاولة أو تواصلي معنا على واتساب.',
    reviewSent: 'شكراً! توصلنا بالرأي ديالك وغادي يتراجع قبل النشر.', reviewError: 'وقع مشكل. عاودي المحاولة.',
    reviewSending: 'جاري الإرسال...', client: 'زبونة', morocco: 'المغرب',
    pushLoading: 'جاري تحضير الإشعارات...', pushSaving: 'جاري تسجيل الجهاز...', pushDone: 'تم تفعيل الإشعارات بنجاح.',
    pushDenied: 'ما تفعلاتش الإشعارات. تأكدي من السماح بها فالمتصفح.', pushUnsupported: 'هاد المتصفح ما كيدعمش الإشعارات.',
    pushError: 'وقع مشكل فالتفعيل. عاودي المحاولة من بعد.', activate: 'تفعيل الإشعارات'
  } : {
    price: 'Prix', order: 'Confirmer la commande', close: 'Fermer', prev: 'Image précédente', next: 'Image suivante',
    details: 'Détails du modèle', invalidPhone: 'Entrez un numéro marocain valide comme 06XXXXXXXX.',
    missing: 'Complétez toutes les informations avant de confirmer.', sending: 'Envoi de la commande...',
    orderError: 'Un problème est survenu. Réessayez ou contactez-nous sur WhatsApp.',
    reviewSent: 'Merci ! Votre avis a été reçu et sera vérifié avant publication.', reviewError: 'Une erreur est survenue. Veuillez réessayer.',
    reviewSending: 'Envoi...', client: 'Cliente', morocco: 'Maroc',
    pushLoading: 'Préparation des notifications...', pushSaving: 'Enregistrement de l’appareil...', pushDone: 'Notifications activées.',
    pushDenied: 'Les notifications n’ont pas été activées. Vérifiez l’autorisation du navigateur.', pushUnsupported: 'Ce navigateur ne prend pas en charge les notifications.',
    pushError: 'Impossible d’activer les notifications pour le moment.', activate: 'Activer les notifications'
  };

  let products = [];
  try { products = JSON.parse($('productData')?.textContent || '[]'); } catch (_) { products = []; }
  let selectedProduct = products[0] || null;
  let selectedImageIndex = 0;
  let modalProduct = products[0] || null;
  let modalImageIndex = 0;
  let modalQuantity = 1;
  let selectedQuantity = 1;
  let activeModal = null;
  let modalReturnFocus = null;
  let revealObserver = null;
  let oneSignalLoading = null;
  let publishedReviews = [];
  const pageStartedAt = Date.now();

  const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  const productName = (p) => p?.name?.[locale] || p?.name?.fr || p?.name?.ar || '';
  const productDesc = (p) => p?.description?.[locale] || p?.description?.fr || p?.description?.ar || '';
  const priceText = (p) => isAr ? `${p.price} درهم` : `${p.price} DH`;
  const oldPriceText = (p) => isAr ? `${p.oldPrice} درهم` : `${p.oldPrice} DH`;
  const priceHTML = (p) => `<span class="price-tag"><span>${text.price}:</span> <del>${oldPriceText(p)}</del> <strong>${priceText(p)}</strong></span>`;
  const runtimePath = (path) => { const clean=String(path||'').replace(/^\/+/, ''); return basePrefix + clean; };
  const absoluteUrl = (path) => /^https?:\/\//i.test(path || '') ? path : `https://soumicrochet.store/${String(path || '').replace(/^\/+/, '')}`;
  const imagePicture = (path, alt, loading = 'eager') => `<img src="${runtimePath(path)}" alt="${escapeHTML(alt)}" loading="${loading}" decoding="async">`;

  async function apiFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set('apikey', SUPABASE_ANON_KEY);
    headers.set('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    return fetch(`${SUPABASE_URL}${path}`, { ...options, headers });
  }

  async function insertRow(table, payload, fallbackRemove = []) {
    const send = async (data) => apiFetch(`/rest/v1/${table}`, {
      method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(data)
    });
    let response = await send(payload);
    if (!response.ok && fallbackRemove.length && response.status === 400) {
      const retryPayload = { ...payload };
      fallbackRemove.forEach(k => delete retryPayload[k]);
      response = await send(retryPayload);
    }
    if (!response.ok) throw new Error(await response.text().catch(() => `HTTP ${response.status}`));
  }

  function initMenu() {
    const btn = $('menuToggle');
    const nav = $('mainNav');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
      const open = !nav.classList.contains('show');
      nav.classList.toggle('show', open);
      btn.classList.toggle('active', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    qsa('a', nav).forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('show'); btn.classList.remove('active'); btn.setAttribute('aria-expanded', 'false');
    }));
  }

  function initReveal() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      qsa('.reveal').forEach(el => el.classList.add('in-view')); return;
    }
    revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in-view'); revealObserver.unobserve(entry.target); }
    }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    qsa('.reveal').forEach(el => { if (!el.classList.contains('in-view')) revealObserver.observe(el); });
  }

  function openModal(modal, opener = document.activeElement) {
    if (!modal) return;
    if (activeModal && activeModal !== modal) closeModal(activeModal, false);
    modalReturnFocus = opener instanceof HTMLElement ? opener : null;
    modal.classList.add('show'); modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open'); activeModal = modal;
    requestAnimationFrame(() => (qs('.modal-close, .sheet-panel, .modal-card', modal))?.focus({ preventScroll: true }));
  }

  function closeModal(modal, restore = true) {
    if (!modal) return;
    modal.classList.remove('show'); modal.setAttribute('aria-hidden', 'true');
    if (activeModal === modal) activeModal = null;
    if (!qs('.modal.show')) document.body.classList.remove('modal-open');
    if (restore && modalReturnFocus?.isConnected) modalReturnFocus.focus({ preventScroll: true });
  }

  function trapModalKeyboard(e) {
    if (!activeModal) return;
    if (e.key === 'Escape') { e.preventDefault(); closeModal(activeModal); return; }
    if (e.key !== 'Tab') return;
    const focusable = qsa('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])', activeModal).filter(el => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function initModals() {
    document.addEventListener('keydown', trapModalKeyboard);
    qsa('[data-close-modal]').forEach(el => el.addEventListener('click', () => closeModal($(el.dataset.closeModal))));
    $('openReviewModalBtn')?.addEventListener('click', e => openModal($('reviewModal'), e.currentTarget));
    $('openAllReviewsBtn')?.addEventListener('click', e => openModal($('allReviewsModal'), e.currentTarget));
    qsa('.js-open-order').forEach(btn => btn.addEventListener('click', e => {
      selectedQuantity = 1;
      setSelectedProduct(selectedProduct || products[0], selectedImageIndex);
      renderPicker();
      showStep(btn.dataset.orderSource === 'product' ? 2 : 1);
      openModal($('orderModal'), e.currentTarget);
    }));
  }

  function renderPicker() {
    const grid = $('visualPickerGrid');
    if (!grid || !products.length) return;
    grid.innerHTML = products.map(p => `<button type="button" class="${selectedProduct?.id === p.id ? 'active' : ''}" data-pick-product="${p.id}"><img src="${runtimePath(p.images[0])}" alt="${escapeHTML(productName(p))}" loading="lazy" width="420" height="420"><strong>${escapeHTML(productName(p))}</strong><span class="picker-price">${priceText(p)}</span></button>`).join('');
    qsa('[data-pick-product]', grid).forEach(btn => btn.addEventListener('click', () => {
      const p = products.find(x => x.id === btn.dataset.pickProduct) || products[0]; setSelectedProduct(p, 0); renderPicker();
    }));
  }

  function setSelectedProduct(product, imageIndex = 0) {
    if (!product) return;
    selectedProduct = product; selectedImageIndex = Number(imageIndex) || 0;
    const file = product.images[selectedImageIndex] || product.images[0];
    $('selectedProductId') && ($('selectedProductId').value = product.id);
    const preview = $('selectedPreview'); if (preview) { preview.src = runtimePath(file); preview.alt = productName(product); }
    if ($('selectedLabel')) $('selectedLabel').textContent = `${productName(product)}${selectedQuantity > 1 ? ` × ${selectedQuantity}` : ''}`;
    const pricedProduct = selectedQuantity > 1 ? { ...product, price:Number(product.price) * selectedQuantity, oldPrice:Number(product.oldPrice) * selectedQuantity } : product;
    if ($('selectedPriceLabel')) $('selectedPriceLabel').innerHTML = priceHTML(pricedProduct);
    const formPreview = $('formSelectedPreview'); if (formPreview) { formPreview.src = runtimePath(file); formPreview.alt = productName(product); }
    if ($('formSelectedLabel')) $('formSelectedLabel').textContent = `${productName(product)}${selectedQuantity > 1 ? ` × ${selectedQuantity}` : ''}`;
    if ($('formSelectedPrice')) $('formSelectedPrice').innerHTML = priceHTML(pricedProduct);
    if ($('finalProductName')) $('finalProductName').textContent = `${productName(product)}${selectedQuantity > 1 ? ` × ${selectedQuantity}` : ''}`;
    if ($('finalProductPrice')) $('finalProductPrice').innerHTML = priceHTML(pricedProduct);
  }

  function openProductModal(id, opener) {
    modalProduct = products.find(x => x.id === id) || products[0];
    if (!modalProduct) return;
    modalImageIndex = 0; modalQuantity = 1; renderProductModal(); openModal($('productModal'), opener);
  }

  const iconSVG = (name) => ({
    hand:`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 12V7a1.5 1.5 0 0 1 3 0v4-6a1.5 1.5 0 0 1 3 0v6-5a1.5 1.5 0 0 1 3 0v5-3a1.5 1.5 0 0 1 3 0v6c0 4-2.5 7-6 7h-1c-2.1 0-3.8-.9-5-2.7L3 14.5a1.6 1.6 0 0 1 2.4-2.1L8 14"/></svg>`,
    truck:`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>`,
    box:`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m4 7 8-4 8 4-8 4-8-4Zm0 0v10l8 4 8-4V7M12 11v10"/></svg>`,
    bag:`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>`,
    wa:`<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.5-4.7A8.5 8.5 0 1 1 20.5 11.6Z"/><path d="M8.4 7.8c.4-.4.8-.3 1 .1l1 2c.2.4.1.7-.2 1l-.7.7c.8 1.7 2.1 3 3.8 3.8l.7-.8c.3-.3.6-.4 1-.2l1.9.9c.5.2.6.6.3 1.1-.5.8-1.3 1.4-2.3 1.4-3.5 0-8.6-5-8.6-8.6 0-.6.7-1.1 2.1-1.4Z"/></svg>`,
    zoom:`<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M10.5 7v7M7 10.5h7"/></svg>`
  }[name] || '');

  function renderProductModal() {
    const node = $('productModalContent');
    if (!node || !modalProduct) return;
    const imgs = modalProduct.images || []; const file = imgs[modalImageIndex] || imgs[0];
    const tag = isAr ? 'الأناقة الطبيعية، مصنوعة باليد' : 'L’élégance naturelle, faite main';
    const qtyLabel = isAr ? 'الكمية' : 'Quantité';
    const orderNow = isAr ? 'اطلبي الآن' : 'Commander maintenant';
    const whatsapp = isAr ? 'تواصلي عبر واتساب' : 'Voir sur WhatsApp';
    const trust = isAr ? ['مصنوع باليد','التوصيل فالمغرب','الدفع عند الاستلام'] : ['Fait main','Livraison au Maroc','Paiement à la livraison'];
    const featureTitle = isAr ? 'التفاصيل' : 'Détails';
    const features = isAr
      ? ['صاك كروشي حرفي مصنوع يدوياً','تفاصيل أنيقة ولمسات مختارة بعناية','إكسسوارات وتشطيب راقٍ','تشطيب متقون من الداخل والخارج','مناسب للاستعمال اليومي والمناسبات']
      : ['Sac crochet artisanal fait main','Détails décoratifs élégants','Fermoir et finitions raffinés','Finition soignée à l’intérieur comme à l’extérieur','Idéal au quotidien ou pour une occasion spéciale'];
    const newBadge = ['p01','p02','p04'].includes(modalProduct.id) ? `<span class="product-status">${isAr?'جديد':'Nouveau'}</span>` : '';
    node.innerHTML = `<div class="ai-image-note"><span aria-hidden="true">✦</span><p>${isAr ? 'ملاحظة: تم تحسين بعض صور المنتجات بالذكاء الاصطناعي وقد تحتوي على اختلاف بصري بسيط. المنتج الحقيقي هو المرجع.' : 'Note image : certaines photos ont été améliorées avec l’IA et peuvent présenter de légères différences visuelles. Le produit réel reste la référence.'}</p></div><div class="product-detail-layout"><div class="product-detail-gallery"><div class="product-detail-main" id="productDetailMain">${imagePicture(file, productName(modalProduct))}${newBadge}<button class="product-zoom-button" id="productZoomButton" type="button" aria-label="${isAr?'تكبير الصورة':'Agrandir l’image'}">${iconSVG('zoom')}</button></div><div class="product-detail-thumbs">${imgs.slice(0,3).map((img,i)=>`<button type="button" class="${i===modalImageIndex?'active':''}" data-modal-thumb="${i}" aria-label="${isAr?'اختيار الصورة':'Choisir l’image'} ${i+1}"><img src="${runtimePath(img)}" alt="" loading="lazy"></button>`).join('')}</div></div><div class="product-detail-copy"><span class="product-detail-kicker">${text.details}</span><h2 id="productModalTitle">${escapeHTML(productName(modalProduct))}</h2><p class="product-detail-tagline">${tag}</p><p class="product-detail-description">${escapeHTML(productDesc(modalProduct))}</p><div class="product-detail-price">${priceHTML(modalProduct)}</div><div class="product-detail-trust"><div class="product-trust-item"><span class="product-trust-icon">${iconSVG('hand')}</span><span>${trust[0]}</span></div><div class="product-trust-item"><span class="product-trust-icon">${iconSVG('truck')}</span><span>${trust[1]}</span></div><div class="product-trust-item"><span class="product-trust-icon">${iconSVG('box')}</span><span>${trust[2]}</span></div></div><div class="product-quantity-row"><span>${qtyLabel}</span><div class="product-quantity" aria-label="${qtyLabel}"><button type="button" id="quantityMinus" aria-label="-">−</button><output id="quantityValue">${modalQuantity}</output><button type="button" id="quantityPlus" aria-label="+">+</button></div></div><div class="product-modal-actions"><button class="product-order-now" type="button" id="confirmModalOrder">${iconSVG('bag')}<span>${orderNow}</span><span aria-hidden="true">→</span></button><button class="product-whatsapp" type="button" id="productWhatsapp">${iconSVG('wa')}<span>${whatsapp}</span></button></div><div class="product-detail-features"><h3>${featureTitle}</h3><ul>${features.map(x=>`<li>${x}</li>`).join('')}</ul><div class="detail-signature">${isAr?'فن الكروشي<br>فكل تفصيل':'L’art du crochet,<br>dans chaque détail'}</div></div></div></div>`;
    qsa('[data-modal-thumb]', node).forEach(btn => btn.addEventListener('click', () => updateModalImage(Number(btn.dataset.modalThumb))));
    $('productZoomButton')?.addEventListener('click', () => $('productDetailMain')?.classList.toggle('zoomed'));
    $('quantityMinus')?.addEventListener('click', () => { modalQuantity = Math.max(1, modalQuantity - 1); const o=$('quantityValue'); if(o)o.value=String(modalQuantity); });
    $('quantityPlus')?.addEventListener('click', () => { modalQuantity = Math.min(9, modalQuantity + 1); const o=$('quantityValue'); if(o)o.value=String(modalQuantity); });
    $('confirmModalOrder')?.addEventListener('click', e => {
      selectedQuantity = modalQuantity;
      setSelectedProduct(modalProduct, modalImageIndex);
      closeModal($('productModal'), false);
      showStep(2);
      openModal($('orderModal'), e.currentTarget);
    });
    $('productWhatsapp')?.addEventListener('click', e => {
      const msg = isAr ? `سلام، بغيت نسول على ${productName(modalProduct)} × ${modalQuantity} (${priceText(modalProduct)})` : `Bonjour, je souhaite avoir des informations sur ${productName(modalProduct)} × ${modalQuantity} (${priceText(modalProduct)})`;
      closeModal($('productModal'), false);
      openWhatsAppComposer(msg, e.currentTarget);
    });
    setupSwipe(qs('.product-detail-main', node));
  }

  function updateModalImage(index) {
    if (!modalProduct?.images?.length) return;
    modalImageIndex = (Number(index) + modalProduct.images.length) % modalProduct.images.length;
    const node = $('productModalContent');
    const img = qs('.product-detail-main img', node);
    if (img) { img.src = runtimePath(modalProduct.images[modalImageIndex]); img.alt = productName(modalProduct); }
    qsa('[data-modal-thumb]', node).forEach(btn => btn.classList.toggle('active', Number(btn.dataset.modalThumb) === modalImageIndex));
    $('productDetailMain')?.classList.remove('zoomed');
  }

  function changeModalImage(direction) {
    if (!modalProduct?.images?.length) return;
    updateModalImage(modalImageIndex + direction);
  }

  function setupSwipe(el) {
    if (!el) return; let sx = 0, sy = 0;
    el.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        const nextDirection = isAr ? -1 : 1; changeModalImage(dx < 0 ? nextDirection : -nextDirection);
      }
    }, { passive: true });
  }

  function initCollectionFilters() {
    const buttons = qsa('[data-collection-filter]');
    const cards = qsa('[data-product-card]');
    const apply = (filter) => {
      buttons.forEach(btn => { const active = btn.dataset.collectionFilter === filter; btn.classList.toggle('active', active); btn.setAttribute('aria-pressed', String(active)); });
      cards.forEach(card => card.classList.toggle('hidden-by-filter', filter !== 'all' && !String(card.dataset.category || '').split(/\s+/).includes(filter)));
      $('productCarousel')?.scrollTo({ left:0, behavior:'smooth' });
    };
    buttons.forEach(btn => btn.addEventListener('click', () => apply(btn.dataset.collectionFilter || 'all')));
  }

  function initFavorites() {
    const key = 'soumi_favorite_products';
    let favorites = [];
    try { favorites = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) { favorites = []; }
    const sync = () => qsa('[data-favorite-product]').forEach(btn => btn.setAttribute('aria-pressed', String(favorites.includes(btn.dataset.favoriteProduct))));
    qsa('[data-favorite-product]').forEach(btn => btn.addEventListener('click', () => {
      const id = btn.dataset.favoriteProduct;
      favorites = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id];
      sync();
      try { localStorage.setItem(key, JSON.stringify(favorites)); } catch (_) {}
    }));
    sync();
  }

  function initProductInteractions() {
    qsa('[data-open-product]').forEach(btn => btn.addEventListener('click', e => openProductModal(btn.dataset.openProduct, e.currentTarget)));
    const carousel = $('productCarousel'), prev = $('galleryPrev'), next = $('galleryNext');
    if (carousel && prev && next) {
      const scroll = (visualDirection) => {
        const amount = Math.round(carousel.clientWidth * .82); const rtl = document.documentElement.dir === 'rtl';
        carousel.scrollBy({ left: visualDirection * amount * (rtl ? -1 : 1), behavior: 'smooth' });
      };
      prev.addEventListener('click', () => scroll(-1)); next.addEventListener('click', () => scroll(1));
    }
  }

  function showStep(step) {
    qsa('.form-step').forEach(s => s.classList.toggle('active', s.dataset.step === String(step)));
    qsa('.order-progress span').forEach((s,i) => s.classList.toggle('active', i < step));
    if (step === 1) renderPicker();
    if (step === 2) $('customerName')?.focus({ preventScroll: true });
    if (step === 3) $('customerCity')?.focus({ preventScroll: true });
  }

  function normalizePhone(value) {
    let v = String(value || '').replace(/\D/g, ''); if (v.startsWith('212')) v = '0' + v.slice(3); return v;
  }
  function validMoroccanPhone(value) { return /^0[5-7]\d{8}$/.test(normalizePhone(value)); }
  function validateStep(step) {
    if (step !== 2) return true;
    const name = $('customerName'), phone = $('customerPhone');
    if (!name?.value.trim()) { name?.focus(); return false; }
    if (phone) phone.value = normalizePhone(phone.value);
    if (!phone || !validMoroccanPhone(phone.value)) { phone?.focus(); alert(text.invalidPhone); return false; }
    return true;
  }

  async function sendPushViaEdge(body) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${SUPABASE_ANON_KEY}`,'apikey':SUPABASE_ANON_KEY}, body:JSON.stringify(body) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`); return true;
    } catch (e) { console.warn('Push delivery skipped:', e); return false; }
  }

  function getStoredPushId() { return localStorage.getItem('soumi_push_subscription_id') || null; }

  async function handleOrderSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget, submit = qs('button[type="submit"]', form), status = $('orderStatus');
    const phone = normalizePhone($('customerPhone')?.value); if ($('customerPhone')) $('customerPhone').value = phone;
    const name = $('customerName')?.value.trim(), city = $('customerCity')?.value.trim(), address = $('customerAddress')?.value.trim();
    const p = selectedProduct;
    if (!p || !name || !city || !address || !validMoroccanPhone(phone)) { if (status) status.textContent = text.missing; return; }
    const original = submit?.textContent || text.order; if (submit) { submit.disabled = true; submit.textContent = text.sending; } if (status) status.textContent = '';
    const imageAsset = p.images[selectedImageIndex] || p.images[0];
    const payload = { customer_name:name, phone, city, address, product_id:p.id, product_name:productName(p), quantity:selectedQuantity, price:Number(p.price) * selectedQuantity, status:'pending', onesignal_user_id:getStoredPushId(), session_id:getSessionId(), image_url:absoluteUrl(imageAsset) };
    try {
      await insertRow('orders', payload, ['image_url','quantity']);
      const lastOrder = { ...payload, image_asset:imageAsset, locale };
      sessionStorage.setItem('soumi_last_order', JSON.stringify(lastOrder));
      const pushImage = absoluteUrl(imageAsset);
      const push = sendPushViaEdge({ targetApp:'admin', title:'👜 طلب جديد من Soumi Crochet', message:`${name} - ${city} - ${phone} - x${selectedQuantity}`, includedSegments:['All'], url:'https://panel.soumicrochet.store/index.html#orders', buttonText:'تأكيد الطلب', buttonUrl:`tel:${phone}`, iconUrl:pushImage, imageUrl:pushImage, data:{type:'new_order',phone,city,product_id:p.id,product_name:productName(p),image_url:pushImage} });
      await Promise.race([push, new Promise(r => setTimeout(r, 900))]);
      location.href = 'thankyou.html';
    } catch (e) {
      console.error('Order insert failed:', e); if (status) status.textContent = text.orderError; if (submit) { submit.disabled = false; submit.textContent = original; }
    }
  }

  function initOrderForm() {
    qsa('.next-step').forEach(btn => btn.addEventListener('click', () => { const cur = Number(qs('.form-step.active')?.dataset.step || 1); if (validateStep(cur)) showStep(Number(btn.dataset.next)); }));
    qsa('.prev-step').forEach(btn => btn.addEventListener('click', () => showStep(Number(btn.dataset.prev))));
    $('orderForm')?.addEventListener('submit', handleOrderSubmit);
    setSelectedProduct(selectedProduct, 0); renderPicker();
  }

  const formatReviewDate = (value) => {
    if (!value) return '';
    try { return new Intl.DateTimeFormat(isAr ? 'ar-MA' : 'fr-FR', { day:'numeric', month:'short', year:'numeric' }).format(new Date(value)); }
    catch (_) { return ''; }
  };

  function reviewCardHTML(r) {
    const rating = Math.max(1, Math.min(5, Number(r.rating) || 5));
    const name = escapeHTML(r.reviewer_name || text.client);
    const city = escapeHTML(r.city || text.morocco);
    const body = escapeHTML(r.review_text || '');
    const date = escapeHTML(formatReviewDate(r.created_at));
    return `<article class="written-review-card"><div class="written-review-top"><div class="stars" aria-label="${rating}/5">${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</div><time class="written-review-date">${date}</time></div><blockquote>“${body}”</blockquote><h3>${name} · ${city}</h3></article>`;
  }

  function renderPublishedReviews() {
    const preview = $('writtenReviewPreview');
    const allList = $('allReviewsList');
    const allBtn = $('openAllReviewsBtn');
    const count = $('allReviewsCount');
    const btnCount = $('allReviewsButtonCount');
    if (preview) preview.innerHTML = publishedReviews.length ? publishedReviews.slice(0,4).map(reviewCardHTML).join('') : `<article class="written-review-empty">${isAr ? 'ما كايناش آراء مكتوبة منشورة دابا.' : 'Aucun avis écrit publié pour le moment.'}</article>`;
    if (allList) allList.innerHTML = publishedReviews.length ? publishedReviews.map(reviewCardHTML).join('') : `<article class="written-review-empty">${isAr ? 'ما كايناش آراء منشورة.' : 'Aucun avis publié.'}</article>`;
    if (count) count.textContent = String(publishedReviews.length);
    if (btnCount) btnCount.textContent = publishedReviews.length > 4 ? `(${publishedReviews.length})` : '';
    if (allBtn) allBtn.hidden = publishedReviews.length <= 4;
  }

  async function loadPublishedReviews() {
    const preview = $('writtenReviewPreview'); if (!preview) return;
    try {
      const params = new URLSearchParams({ select:'reviewer_name,city,rating,review_text,created_at', is_published:'eq.true', order:'created_at.desc', limit:'100' });
      const res = await apiFetch(`/rest/v1/reviews?${params}`); if (!res.ok) { renderPublishedReviews(); return; }
      const data = await res.json();
      publishedReviews = Array.isArray(data) ? data : [];
      renderPublishedReviews();
    } catch (_) { renderPublishedReviews(); }
  }

  function formatAudioTime(seconds) {
    const value = Number.isFinite(seconds) ? Math.max(0, Math.round(seconds)) : 0;
    return `${Math.floor(value/60)}:${String(value%60).padStart(2,'0')}`;
  }

  function initAudioReviews() {
    const cards = qsa('[data-audio-card]');
    cards.forEach(card => {
      const audio = qs('audio', card), button = qs('[data-audio-play]', card), time = qs('[data-audio-time]', card);
      if (!audio || !button) return;
      const syncTime = () => { if (time) time.textContent = formatAudioTime(audio.duration || audio.currentTime || 0); };
      audio.addEventListener('loadedmetadata', syncTime);
      audio.addEventListener('durationchange', syncTime);
      audio.addEventListener('ended', () => card.classList.remove('playing'));
      audio.addEventListener('pause', () => card.classList.remove('playing'));
      audio.addEventListener('play', () => card.classList.add('playing'));
      button.addEventListener('click', async () => {
        cards.forEach(other => { const otherAudio=qs('audio',other); if (other!==card && otherAudio && !otherAudio.paused) otherAudio.pause(); });
        if (audio.paused) { try { await audio.play(); } catch (_) {} } else audio.pause();
      });
    });
  }

  async function handleReviewSubmit(e) {
    e.preventDefault(); const form=e.currentTarget, btn=qs('button[type="submit"]',form), status=$('reviewStatus'); const original=btn?.textContent || '';
    if (btn) { btn.disabled=true; btn.textContent=text.reviewSending; } if (status) status.textContent='';
    const payload={ reviewer_name:$('reviewerName')?.value.trim() || '', phone:$('reviewPhone')?.value.trim() || '', city:$('reviewCity')?.value.trim() || '', rating:Number($('reviewRating')?.value)||5, review_text:$('reviewText')?.value.trim() || '', is_published:false, status:'pending' };
    try {
      await insertRow('reviews',payload,['status']);
      sendPushViaEdge({ targetApp:'admin', title:'⭐ رأي جديد فـ Soumi Crochet', message:`${payload.reviewer_name} - ${payload.city}: ${payload.review_text}`, includedSegments:['All'], url:'https://panel.soumicrochet.store/index.html#reviews', buttonText:'قبول الرأي', data:{type:'new_review',reviewer_name:payload.reviewer_name,city:payload.city} });
      if(status) status.textContent=text.reviewSent; form.reset(); setTimeout(()=>closeModal($('reviewModal')),1300);
    } catch(err) { console.error(err); if(status) status.textContent=text.reviewError; }
    finally { if(btn){btn.disabled=false;btn.textContent=original;} }
  }

  function initReviews() {
    initAudioReviews();
    $('reviewForm')?.addEventListener('submit', handleReviewSubmit);
    const section=$('reviews');
    let loaded=false;
    const load=()=>{ if(loaded) return; loaded=true; loadPublishedReviews(); };
    if(section && 'IntersectionObserver' in window){
      const observer=new IntersectionObserver(entries=>{ if(entries.some(x=>x.isIntersecting)){ observer.disconnect(); load(); } },{rootMargin:'700px 0px'});
      observer.observe(section);
      setTimeout(()=>{ observer.disconnect(); load(); },15000);
    } else setTimeout(load,6000);
  }

  function openWhatsAppComposer(message = '', opener = null) {
    const chat = $('waChat'), input = $('waMessage');
    if (!chat) return;
    chat.hidden=false;
    chat.removeAttribute('inert');
    chat.setAttribute('aria-hidden','false');
    requestAnimationFrame(()=>chat.classList.add('show'));
    if (input) { if (message) input.value = message; requestAnimationFrame(() => input.focus({ preventScroll:true })); }
    if (opener instanceof HTMLElement) chat.dataset.openerId = opener.id || '';
  }

  function closeWhatsAppComposer() {
    const chat = $('waChat');
    if(!chat) return;
    chat.classList.remove('show');
    chat.setAttribute('aria-hidden','true');
    chat.setAttribute('inert','');
    setTimeout(()=>{ if(!chat.classList.contains('show')) chat.hidden=true; },220);
  }

  function initWhatsApp() {
    const chat=$('waChat'), form=$('waForm'), input=$('waMessage');
    $('waToggle')?.addEventListener('click',e=>{
      const open=!chat?.classList.contains('show');
      if(open) openWhatsAppComposer('', e.currentTarget); else closeWhatsAppComposer();
    });
    $('waClose')?.addEventListener('click',closeWhatsAppComposer);
    qsa('[data-open-whatsapp]').forEach(btn=>btn.addEventListener('click',e=>openWhatsAppComposer(btn.dataset.whatsappMessage || '', e.currentTarget)));
    qsa('[data-wa-prefill]').forEach(btn=>btn.addEventListener('click',()=>{ if(input){ input.value=btn.dataset.waPrefill || ''; input.focus({preventScroll:true}); } }));
    form?.addEventListener('submit',e=>{
      e.preventDefault();
      const message=input?.value.trim() || '';
      if(!message){ input?.focus(); return; }
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');
    });
  }

  function getSessionId() { let id=sessionStorage.getItem('soumi_session_id'); if(!id){id=`session_${Date.now()}_${Math.random().toString(36).slice(2,10)}`;sessionStorage.setItem('soumi_session_id',id);} return id; }
  function getGeoCache() { try { const x=JSON.parse(localStorage.getItem('soumi_geo_cache')||'null'); return x && Date.now()-x.at<86400000 ? x : null; } catch(_){ return null; } }
  async function sendAnalytics(eventType, seconds=0, keepalive=false) {
    try { const geo=getGeoCache() || {ip:null,city:null}; const payload={session_id:getSessionId(),ip_address:geo.ip||null,city:geo.city||null,page_url:location.href,event_type:eventType,time_spent_seconds:Math.max(0,Math.round(seconds))}; const res=await apiFetch('/rest/v1/analytics',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(payload),keepalive}); if(!res.ok) return false; return true; } catch(_) { return false; }
  }
  function initFAQMotion() {
    const items=qsa('#faq .faq-item');
    items.forEach(item=>item.addEventListener('toggle',()=>{
      if(!item.open) return;
      items.forEach(other=>{ if(other!==item && other.open) other.open=false; });
    }));
  }

  function initAnalytics() {
    let started=false;
    const start=()=>{ if(started) return; started=true; sendAnalytics('page_view',0,false); };
    ['pointerdown','keydown','touchstart'].forEach(type=>window.addEventListener(type,start,{once:true,passive:true}));
    window.addEventListener('pagehide', () => {
      if(!started) return;
      const seconds=(Date.now()-pageStartedAt)/1000;
      if(seconds>=5) sendAnalytics('engagement',seconds,true);
    }, { passive:true });
  }

  function warmOneSignal() {
    if (oneSignalLoading) return oneSignalLoading;
    oneSignalLoading = new Promise((resolve,reject)=>{
      window.OneSignalDeferred=window.OneSignalDeferred||[];
      window.OneSignalDeferred.push(async function(OneSignal){
        try { await OneSignal.init({appId:ONESIGNAL_APP_ID,serviceWorkerPath:'/OneSignalSDKWorker.js',serviceWorkerParam:{scope:'/'},notifyButton:{enable:false}}); resolve(OneSignal); } catch(e){ reject(e); }
      });
      const s=document.createElement('script');s.src='https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';s.async=true;s.onerror=()=>reject(new Error('OneSignal load failed'));document.head.appendChild(s);
    });
    return oneSignalLoading;
  }

  async function saveSubscriber(id) {
    if(!id) return;
    const geo=getGeoCache(); const payload={onesignal_player_id:id,city:geo?.city||null,device_info:JSON.stringify({app:'website',domain:location.hostname,userAgent:navigator.userAgent,language:navigator.language,subscribed_at:new Date().toISOString()})};
    try { const res=await apiFetch('/rest/v1/subscribers?on_conflict=onesignal_player_id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(payload)}); if(!res.ok) throw new Error(`HTTP ${res.status}`); } catch(_) {}
  }

  async function activatePush(btn) {
    const warning=$('pushWarning'); const original=btn?.textContent || text.activate;
    if(!('Notification' in window)){if(warning)warning.textContent=text.pushUnsupported;return;}
    try {
      if(btn){btn.disabled=true;btn.textContent=text.pushLoading;} const OneSignal=await warmOneSignal();
      if(Notification.permission!=='granted') await OneSignal.Notifications.requestPermission();
      if(Notification.permission!=='granted'){if(warning)warning.textContent=text.pushDenied;return;}
      if(btn)btn.textContent=text.pushSaving;
      try { await OneSignal.User?.PushSubscription?.optIn?.(); } catch(_) {}
      let id=OneSignal.User?.PushSubscription?.id||OneSignal.User?.PushSubscription?.token||null;
      for(let i=0;!id&&i<8;i++){await new Promise(r=>setTimeout(r,250));id=OneSignal.User?.PushSubscription?.id||OneSignal.User?.PushSubscription?.token||null;}
      if(id){localStorage.setItem('soumi_push_subscription_id',id);await saveSubscriber(id);} if(warning)warning.textContent=text.pushDone; setTimeout(()=>closeModal($('pushPromptModal')),900);
    } catch(e){console.warn(e);if(warning)warning.textContent=text.pushError;}
    finally{if(btn){btn.disabled=false;btn.textContent=original;}}
  }

  function initPush() {
    $('openPushPrompt')?.addEventListener('click',e=>{openModal($('pushPromptModal'),e.currentTarget);warmOneSignal().catch(()=>{});});
    $('activatePushBtn')?.addEventListener('click',e=>activatePush(e.currentTarget));
  }

  function runIdle(fn, timeout=1500) { if('requestIdleCallback' in window) requestIdleCallback(fn,{timeout}); else setTimeout(fn,timeout); }

  function init() {
    initMenu(); initReveal(); initModals(); initCollectionFilters(); initFavorites(); initProductInteractions(); initOrderForm(); initReviews(); initWhatsApp(); initFAQMotion(); initAnalytics(); initPush();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true }); else init();
})();
