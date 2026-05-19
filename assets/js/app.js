const $ = (id) => document.getElementById(id);
const ASSET_IMG = 'assets/img/';
const STORE_IMAGE_BASE = 'soumicrochet.store/';
const WHATSAPP_NUMBER = '212662711995';
const SUPABASE_URL = 'https://axgcycsojorwztwlfprg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_1YuKU9O3wuH1Zbikx_OonQ_ayCIjmSR';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const SESSION_ID_KEY = 'soumi_session_id';

let products = [];
let currentLang = localStorage.getItem('soumi_lang') || 'fr';
let selectedProduct = null;
let selectedImageIndex = 0;
let modalProduct = null;
let modalImageIndex = 0;
let revealObserver;

function ensureSessionId(){
  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if(!sessionId){
    sessionId = (crypto.randomUUID ? crypto.randomUUID() : `soumi-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

function getOneSignalUserId(){
  try{
    if(window.OneSignal?.User?.PushSubscription?.id) return window.OneSignal.User.PushSubscription.id;
    if(window.OneSignal?.User?.onesignalId) return window.OneSignal.User.onesignalId;
  }catch(err){}
  return localStorage.getItem('soumi_onesignal_user_id') || '';
}

async function refreshOneSignalUserId(){
  try{
    const id = getOneSignalUserId();
    if(id){
      localStorage.setItem('soumi_onesignal_user_id', id);
      await supabaseClient?.from('subscribers').insert({
        onesignal_player_id: id,
        city: $('customerCity')?.value || null,
        device_info: {
          platform: navigator.platform || 'web',
          user_agent: navigator.userAgent || '',
          language: navigator.language || '',
          subscribed_at: new Date().toISOString()
        }
      });
    }
  }catch(err){ console.warn('OneSignal subscriber sync skipped', err); }
}

let cachedIpAddress = null;
async function getVisitorIp(){
  if(cachedIpAddress !== null) return cachedIpAddress;
  try{
    const response = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
    if(!response.ok) throw new Error('IP lookup failed');
    const data = await response.json();
    cachedIpAddress = data.ip || null;
  }catch(err){
    cachedIpAddress = null;
  }
  return cachedIpAddress;
}

async function trackEvent(eventType, extra={}){
  if(!supabaseClient) return;
  try{
    const ipAddress = await getVisitorIp();
    await supabaseClient.from('analytics').insert({
      session_id: ensureSessionId(),
      ip_address: ipAddress,
      city: $('customerCity')?.value || null,
      page_url: window.location.href,
      event_type: eventType,
      form_draft: extra.form_draft || null,
      onesignal_user_id: getOneSignalUserId(),
      time_spent_seconds: extra.time_spent_seconds || Math.max(1, Math.round((Date.now() - window.__soumiStartTime) / 1000))
    });
  }catch(err){ console.warn('Analytics event skipped', err); }
}

function buildFormDraft(){
  return {
    customer_name: $('customerName')?.value || '',
    phone: $('customerPhone')?.value || '',
    city: $('customerCity')?.value || '',
    address: $('customerAddress')?.value || '',
    product_id: selectedProduct?.id || '',
    product_name: selectedProduct ? productName(selectedProduct) : '',
    price: selectedProduct?.price || 0,
    selected_image: $('selectedProductImage')?.value || ''
  };
}
window.__soumiStartTime = Date.now();


const translations = {
  ar:{
    navProducts:'الموديلات',navStory:'القصة',navReviews:'آراء الزبونات',navFaq:'الأسئلة',navGuarantees:'الضمانات',
    heroTitle:'✨ تألقي بلمسة فريدة.. صيكان هماوية مخدومة باليد! 👜',
    heroLead:'تشكيلة حصرية من حقائب الكروشي والعقيق 💎. خدمة متقونة، جودة عالية، وتفاصيل كتخطف الأنظار 😍. اختاري الستايل لي يواتيك وكوني متميزة فكل مناسبة 👑.',
    badge1:'مخدوم باليد',badge2:'الدفع عند الاستلام',badge3:'موديلات محدودة',
    primaryCta:'🛒 اطلبي الصاك ديالك دابا',secondaryCta:'👇 اكتشفي جميع الموديلات',
    productsTitle:'اختاري الموديل لي خطف قلبك',
    productsLead:'زلاقي يمين ويسار باش تشوفي الموديلات. كل بطاقة كتبيّن الصورة الرئيسية فقط، والتفاصيل كيتفتحو فالمودال.',
    storyTitle:'✨ ماشي غير صاك.. هادي تحفة فنية مخدومة بحب! 💖',
    storyBody:'كل صاك من soumicrochet 🧶 كيهز معاه قصة ديال إبداع، صبر، ودقة متناهية ⏳. ملي كتشوفي داك العقيق الكحل البراق مستف حبة حبة 🖤، ولا ديك الغرزة ديال الكروشي السميكة لي مخدومة باليد بعناية 🧵، غتعرفي بلي هادشي ماشي خدمة د الماكينة ولا إنتاج بالجملة 🚫.. هادي خدمة د اليدين 🤲 لي عطات وقتها وروحها باش تخرج ليك بياسة وحدة وفريدة 👑. التفاصيل عندنا هي كلشي! 🔍 من السنسلة الذهبية لي كتعطي لمسة ديال الفخامة ✨، للقفل المتين 🔒، وصولاً للهيكل لي كيخلي الصاك شاد راسو وعامر تبارك الله 👜.',
    storyCta:'نطلب موديل ديالي',reviewsTitle:'آراء زبونات Soumi Crochet',faqTitle:'أسئلة كطرحوها بزاف',
    faqQ1:'واش الصيكان مخدومين باليد 100%؟',faqA1:'نعم، كل صاك مخدوم بعناية ودقة عالية من طرف حرفيين، وهادشي كياخد وقت باش نضمنو ليك جودة هماوية وموديل ماكاينش بحالو.',
    faqQ2:'واش نقدر نخلص حتى يوصلني الصاك؟',faqA2:'بطبيعة الحال! الدفع كيكون عند الاستلام (Cash on Delivery) باش تكوني مرتاحة وتأكدي من الجودة ديال صاكك عاد تخلصي.',
    faqQ3:'شحال كياخد التوصيل؟',faqA3:'التوصيل سريع وكياخد بين 24 حتى 48 ساعة كأقصى حد لجميع المدن المغربية.',
    faqQ4:'واش التصاور حقيقيين؟',faqA4:'أكيد، كاع التصاور لي كتشوفي هما ديال الصيكان الحقيقيين ديالنا، وتأكدي بلي غيوصلك نفس الموديل لي شفتي وعجبك.',
    trustTitle:'✨ وعودنا ليك.. باش تقداي ونتي مرتاحة 100%!',
    trust1Title:'🥇 جودة مافيهاش نقاش',trust1Desc:'صيكان مخدومين بحب وعناية، كل غرزة وكل عقيقة بلاصتها باش يدومو معاك سنين.',
    trust2Title:'🤝 أثمنة معقولة بزاف',trust2Desc:'الجودة ديالنا كتسوى كثر، ولكن حيت كنخدمو ديريكت من يدينا ليديك وفرنا ليك أحسن ثمن.',
    trust3Title:'🚚 خلصي حتى تشدي صاكك',trust3Desc:'شوفي صاكك بعينيك، قيسيه وعجبك وتأكدي من الجودة ديالو، عاد خلصي.',
    trust4Title:'📞 خدمة ما بعد البيع',trust4Desc:'حنا معاك ديما، أي استفسار، فريقنا فالواتساب محلول ليك فكل وقت باش يجاوبك بسرعة.',
    orderBtn:'طلبها',confirm:'تأكيد الطلب',orderTitle:'كملي معلومات الطلب',nextBtn:'التالي',backBtn:'رجوع',
    nameLabel:'الاسم الكامل',phoneLabel:'رقم الهاتف',cityLabel:'المدينة',addressLabel:'العنوان الكامل',
    submitBtn:'تأكيد الطلب',stickyCta:'اطلبي الصاك ديالك دابا',waIntro:'سلام، كيفاش نقدر نعاونك؟ اختاري جواب سريع:',
    footerText:'صيكان كروشي وعقيق مخدومين باليد فالمغرب. أناقة حرفية، توصيل سريع، والدفع عند الاستلام.',
    policiesLink:'سياسة التوصيل والضمان',priceLabel:'الثمن'
  },
  fr:{
    navProducts:'Produits',navStory:'Histoire',navReviews:'Avis',navFaq:'FAQ',navGuarantees:'Garanties',
    heroTitle:'✨ Brillez avec une touche unique.. des sacs handmade qui captivent! 👜',
    heroLead:'Collection exclusive de sacs crochet et perles 💎. Finition soignée, haute qualité, et des détails qui attirent tous les regards 😍. Choisissez le style qui vous ressemble et soyez unique à chaque occasion 👑.',
    badge1:'Fait main',badge2:'Paiement à la livraison',badge3:'Modèles limités',
    primaryCta:'🛒 Commander mon sac maintenant',secondaryCta:'👇 Découvrir tous les modèles',
    productsTitle:'Choisissez le modèle qui vous fait craquer',
    productsLead:'Glissez à gauche et à droite pour découvrir les modèles. Chaque carte montre l’image principale; les détails s’ouvrent dans le modal.',
    storyTitle:'✨ Pas juste un sac.. une œuvre d’art faite avec amour! 💖',
    storyBody:'Chaque sac soumicrochet 🧶 porte une histoire de créativité, de patience et de précision extrême ⏳. Quand vous voyez ces perles noires brillantes posées une par une 🖤, ou cette maille crochet épaisse travaillée soigneusement à la main 🧵, vous savez que ce n’est ni une machine ni une production de masse 🚫.. c’est le travail des mains 🤲 qui donnent du temps et de l’âme pour créer une pièce unique 👑. Les détails sont tout pour nous! 🔍 De la chaîne dorée qui apporte une touche de luxe ✨, au fermoir solide 🔒, jusqu’à la structure qui garde le sac bien formé et généreux 👜.',
    storyCta:'Commander mon modèle',reviewsTitle:'Avis des clientes Soumi Crochet',faqTitle:'Questions fréquentes',
    faqQ1:'Les sacs sont-ils 100% faits main?',faqA1:'Oui, chaque sac est travaillé avec soin et haute précision par des artisans, ce qui demande du temps pour garantir une qualité premium et un modèle unique.',
    faqQ2:'Puis-je payer à la livraison?',faqA2:'Bien sûr! Le paiement se fait à la réception pour que vous soyez rassurée et que vous vérifiiez la qualité de votre sac avant de payer.',
    faqQ3:'Combien de temps prend la livraison?',faqA3:'La livraison est rapide et prend entre 24 et 48 heures maximum dans toutes les villes du Maroc.',
    faqQ4:'Les photos sont-elles réelles?',faqA4:'Oui, toutes les photos montrent nos vrais sacs. Vous recevrez le même modèle que vous avez vu et choisi.',
    trustTitle:'✨ Nos Engagements.. Pour un achat en toute sérénité!',
    trust1Title:'🥇 Qualité irréprochable',trust1Desc:'Des sacs faits main avec passion et précision pour durer.',
    trust2Title:'🤝 Prix juste et transparent',trust2Desc:"En travaillant directement de l'artisan à vous, nous offrons le meilleur prix.",
    trust3Title:'🚚 Paiement à la livraison',trust3Desc:'Vérifiez votre sac de vos propres yeux, assurez-vous de la qualité, et payez à la réception.',
    trust4Title:'📞 Service client dédié',trust4Desc:'Nous sommes toujours là pour vous. Notre équipe est disponible sur WhatsApp pour vous.',
    orderBtn:'Commander',confirm:'Confirmer la commande',orderTitle:'Finaliser votre commande',nextBtn:'Suivant',backBtn:'Retour',
    nameLabel:'Nom complet',phoneLabel:'Téléphone',cityLabel:'Ville',addressLabel:'Adresse complète',
    submitBtn:'Confirmer la commande',stickyCta:'Commander maintenant',waIntro:'Bonjour, comment pouvons-nous vous aider?',
    footerText:'Sacs crochet et perles faits main au Maroc. Élégance artisanale, livraison rapide, paiement à la réception.',
    policiesLink:'Politiques & garanties',priceLabel:'Prix'
  }
};

function escapeHTML(value){
  return String(value || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function asset(path){ return path || ''; }
function imageUrl(path){ return STORE_IMAGE_BASE + String(path || '').replace(/^\/+/,''); }
function productName(p){ return p?.name?.[currentLang] || p?.name?.fr || p?.name?.ar || ''; }
function productDesc(p){ return p?.description?.[currentLang] || p?.description?.fr || p?.description?.ar || ''; }
function priceText(p){ return currentLang === 'ar' ? `${p.price} درهم` : `${p.price} DH`; }
function oldPriceText(p){ return currentLang === 'ar' ? `${p.oldPrice} درهم` : `${p.oldPrice} DH`; }
function priceFullText(p){ return `${oldPriceText(p)} → ${priceText(p)}`; }
function priceHtml(p){
  return `<span class="price-tag"><span>${translations[currentLang].priceLabel}:</span> <del class="old-price">${oldPriceText(p)}</del> <strong>${priceText(p)}</strong></span>`;
}
function safeSet(id, value){ const el = $(id); if(el) el.textContent = value; }

async function loadProducts(){
  const response = await fetch('products.json', {cache:'no-store'});
  if(!response.ok) throw new Error('products.json not found');
  const data = await response.json();
  if(!Array.isArray(data)) throw new Error('products.json must be an array');
  products = data
    .filter(p => p && p.id && p.name && p.description && Array.isArray(p.images) && p.images.length)
    .map(p => ({
      ...p,
      price: Number(p.price || 0),
      oldPrice: Number(p.oldPrice || p.price || 0),
      images: p.images.filter(Boolean)
    }));
  if(!products.length) throw new Error('No valid products found');
  selectedProduct = products[0];
  modalProduct = products[0];
}

function applyTranslations(){
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if(translations[currentLang][key]) el.textContent = translations[currentLang][key];
  });
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('soumi_lang', currentLang);
  document.querySelectorAll('#langSwitch span').forEach(s => s.classList.toggle('active', s.textContent.toLowerCase() === currentLang));
  renderProducts();
  renderPicker();
  setSelectedProduct(selectedProduct || products[0], selectedImageIndex);
  prepareTypeTargets(true);
  typeHeroTargets();
}

function renderProducts(){
  const wrap = $('productCarousel');
  if(!wrap || !products.length) return;
  wrap.innerHTML = products.map((p, idx) => `
    <article class="product-card glass reveal">
      <button class="product-media" type="button" data-open-product="${p.id}" aria-label="${escapeHTML(productName(p))}">
        <img src="${asset(p.images[0])}" alt="${escapeHTML(productName(p))}" loading="lazy" />
        <span class="product-badge">${String(idx+1).padStart(2,'0')}</span>
      </button>
      <div class="product-card-body">
        <h3>${escapeHTML(productName(p))}</h3>
        ${priceHtml(p)}
        <p class="type-target product-desc-type">${escapeHTML(productDesc(p))}</p>
        <button class="btn btn-primary btn-small btn-glow pulse" type="button" data-order-product="${p.id}">${translations[currentLang].orderBtn}</button>
      </div>
    </article>`).join('');

  wrap.querySelectorAll('[data-open-product]').forEach(btn => btn.addEventListener('click', () => openProductModal(btn.dataset.openProduct)));
  wrap.querySelectorAll('[data-order-product]').forEach(btn => btn.addEventListener('click', () => openProductModal(btn.dataset.orderProduct)));
  prepareTypeTargets(true, wrap);
  observeReveal();
}

function renderPicker(){
  const grid = $('visualPickerGrid');
  if(!grid || !products.length) return;
  grid.innerHTML = products.map(p => `
    <button type="button" class="${selectedProduct && selectedProduct.id === p.id ? 'active':''}" data-pick-product="${p.id}">
      <img src="${asset(p.images[0])}" alt="${escapeHTML(productName(p))}" loading="lazy" />
      <strong>${escapeHTML(productName(p))}</strong>
      <span class="picker-price">${priceHtml(p)}</span>
    </button>`).join('');

  grid.querySelectorAll('[data-pick-product]').forEach(btn => btn.addEventListener('click', () => {
    const p = products.find(x => x.id === btn.dataset.pickProduct) || products[0];
    setSelectedProduct(p, 0);
    renderPicker();
  }));
}

function setSelectedProduct(product, imgIndex = 0){
  selectedProduct = product || products[0];
  if(!selectedProduct) return;
  selectedImageIndex = imgIndex || 0;
  const file = selectedProduct.images[selectedImageIndex] || selectedProduct.images[0];
  const fullUrl = imageUrl(file);
  if($('selectedModelName')) $('selectedModelName').value = productName(selectedProduct);
  if($('selectedProductImage')) $('selectedProductImage').value = fullUrl;
  if($('selectedProductPrice')) $('selectedProductPrice').value = priceFullText(selectedProduct);
  if($('selectedProductId')) $('selectedProductId').value = selectedProduct.id || '';
  if($('oneSignalUserId')) $('oneSignalUserId').value = getOneSignalUserId();
  if($('sessionId')) $('sessionId').value = ensureSessionId();
  if($('sourcePage')) $('sourcePage').value = window.location.href;
  if($('selectedPreview')) {$('selectedPreview').src = asset(file); $('selectedPreview').alt = productName(selectedProduct);}
  safeSet('selectedLabel', productName(selectedProduct));
  if($('selectedPriceLabel')) $('selectedPriceLabel').innerHTML = priceHtml(selectedProduct);
  safeSet('selectedUrlText', fullUrl);
  safeSet('finalProductName', productName(selectedProduct));
  if($('finalProductPrice')) $('finalProductPrice').innerHTML = priceHtml(selectedProduct);
  safeSet('finalProductUrl', fullUrl);
}

function openProductModal(id){
  const p = products.find(x => x.id === id) || products[0];
  modalProduct = p;
  modalImageIndex = 0;
  renderProductModal();
  trackEvent('product_view', { form_draft: { product_id: p.id, product_name: productName(p), price: p.price } });
  openModal('productModal');
}

function renderProductModal(){
  const node = $('productModalContent');
  if(!node || !modalProduct) return;
  const imgs = modalProduct.images || [];
  const file = imgs[modalImageIndex] || imgs[0];
  node.innerHTML = `
    <div class="modal-product-grid">
      <div class="modal-carousel">
        <img id="modalCarouselImage" src="${asset(file)}" alt="${escapeHTML(productName(modalProduct))}" />
        <button class="carousel-arrow prev" type="button" id="modalPrev" aria-label="Previous image">‹</button>
        <button class="carousel-arrow next" type="button" id="modalNext" aria-label="Next image">›</button>
        <div class="carousel-dots">${imgs.map((_,i)=>`<button type="button" class="${i===modalImageIndex?'active':''}" data-modal-dot="${i}" aria-label="Image ${i+1}"></button>`).join('')}</div>
      </div>
      <div class="modal-info">
        <span class="eyebrow">SOUMI DETAILS</span>
        <h2>${escapeHTML(productName(modalProduct))}</h2>
        ${priceHtml(modalProduct)}
        <p>${escapeHTML(productDesc(modalProduct))}</p>
        <div class="modal-thumbs">${imgs.map((img,i)=>`<button type="button" class="${i===modalImageIndex?'active':''}" data-modal-thumb="${i}"><img src="${asset(img)}" alt="${escapeHTML(productName(modalProduct))} ${i+1}" /></button>`).join('')}</div>
        <button class="btn btn-primary btn-xl btn-glow pulse" type="button" id="confirmModalOrder">${translations[currentLang].confirm}</button>
      </div>
    </div>`;

  $('modalPrev')?.addEventListener('click', () => changeModalImage(-1));
  $('modalNext')?.addEventListener('click', () => changeModalImage(1));
  document.querySelectorAll('[data-modal-dot],[data-modal-thumb]').forEach(btn => btn.addEventListener('click', () => {
    modalImageIndex = Number(btn.dataset.modalDot ?? btn.dataset.modalThumb);
    renderProductModal();
  }));
  $('confirmModalOrder')?.addEventListener('click', () => {
    setSelectedProduct(modalProduct, modalImageIndex);
    closeModal('productModal');
    showStep(1);
    renderPicker();
    openModal('orderModal');
  });
  setupSwipe(node.querySelector('.modal-carousel'), (dir) => changeModalImage(dir));
}

function changeModalImage(direction){
  if(!modalProduct) return;
  const total = modalProduct.images.length;
  modalImageIndex = (modalImageIndex + direction + total) % total;
  renderProductModal();
}

function setupSwipe(el, cb){
  if(!el) return;
  let sx=0, sy=0;
  el.addEventListener('touchstart', e => {sx=e.touches[0].clientX; sy=e.touches[0].clientY;}, {passive:true});
  el.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx;
    const dy = e.changedTouches[0].clientY - sy;
    if(Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) cb(dx > 0 ? -1 : 1);
  }, {passive:true});
}

function openModal(id){
  const node = $(id);
  if(!node) return;
  node.classList.add('show');
  node.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
}

function closeModal(id){
  const node = $(id);
  if(!node) return;
  node.classList.remove('show');
  node.setAttribute('aria-hidden','true');
  if(!document.querySelector('.modal.show')) document.body.classList.remove('modal-open');
}

function showStep(step){
  document.querySelectorAll('.form-step').forEach(s => s.classList.toggle('active', s.dataset.step === String(step)));
  document.querySelectorAll('.order-progress span').forEach((s,i)=>s.classList.toggle('active', i < step));
  prepareTypeTargets(true, $('orderForm'));
  if(step === 1) renderPicker();
}

function validateStep(step){
  if(step === 2){
    const name = $('customerName'); const phone = $('customerPhone');
    if(!name.value.trim()){name.focus(); return false;}
    phone.value = normalizePhone(phone.value);
    if(!/^0[5-7][0-9]{8}$/.test(phone.value)){
      phone.focus();
      alert(currentLang === 'ar' ? 'دخل رقم هاتف مغربي صحيح بحال 06XXXXXXXX' : 'Entrez un numéro marocain valide comme 06XXXXXXXX');
      return false;
    }
  }
  return true;
}

function normalizePhone(value){
  let v = (value || '').replace(/\s+/g,'').replace(/[^0-9]/g,'');
  if(v.startsWith('212')) v = '0' + v.slice(3);
  return v;
}

function initOrderForm(){
  document.querySelectorAll('.js-open-order').forEach(btn => btn.addEventListener('click', () => {
    showStep(1);
    renderPicker();
    setSelectedProduct(selectedProduct || products[0], selectedImageIndex);
    openModal('orderModal');
  }));
  $('closeProductModal')?.addEventListener('click', () => closeModal('productModal'));
  $('closeOrderSheet')?.addEventListener('click', () => closeModal('orderModal'));
  document.querySelectorAll('[data-close="product"]').forEach(x => x.addEventListener('click', () => closeModal('productModal')));
  document.querySelectorAll('[data-close="order"]').forEach(x => x.addEventListener('click', () => closeModal('orderModal')));
  document.querySelectorAll('.next-step').forEach(btn => btn.addEventListener('click', () => {
    const current = Number(document.querySelector('.form-step.active')?.dataset.step || 1);
    if(validateStep(current)) showStep(Number(btn.dataset.next));
  }));
  document.querySelectorAll('.prev-step').forEach(btn => btn.addEventListener('click', () => showStep(Number(btn.dataset.prev))));
  let draftTimer = null;
  ['customerName','customerPhone','customerCity','customerAddress'].forEach(id => {
    $(id)?.addEventListener('input', () => {
      clearTimeout(draftTimer);
      draftTimer = setTimeout(() => trackEvent('form_draft', { form_draft: buildFormDraft() }), 650);
    });
  });


  $('orderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!supabaseClient){
      alert(currentLang === 'ar' ? 'تعذر الاتصال بقاعدة البيانات. المرجو المحاولة لاحقاً.' : 'Connexion à la base de données indisponible. Réessayez plus tard.');
      return;
    }
    setSelectedProduct(selectedProduct, selectedImageIndex);
    const step3Inputs = Array.from(document.querySelectorAll('.form-step[data-step="3"] input[required]'));
    for(const input of step3Inputs){ if(!input.value.trim()){ input.focus(); return; } }

    const selectedImageFile = selectedProduct.images[selectedImageIndex] || selectedProduct.images[0];
    const payload = {
      name: $('customerName')?.value || '',
      phone: $('customerPhone')?.value || '',
      city: $('customerCity')?.value || '',
      address: $('customerAddress')?.value || '',
      product: productName(selectedProduct),
      product_id: selectedProduct.id,
      price: priceText(selectedProduct),
      numeric_price: selectedProduct.price,
      oldPrice: oldPriceText(selectedProduct),
      image: $('selectedProductImage')?.value || imageUrl(selectedImageFile),
      imageAsset: asset(selectedImageFile),
      session_id: ensureSessionId(),
      onesignal_user_id: getOneSignalUserId()
    };
    const encodedPayload = JSON.stringify(payload);
    sessionStorage.setItem('soumi_last_order', encodedPayload);
    localStorage.setItem('soumi_last_order_backup', encodedPayload);
    try{ history.replaceState({soumiLastOrder: payload}, document.title, window.location.href); }catch(err){}

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if(submitBtn){
      submitBtn.textContent = currentLang === 'ar' ? 'جاري حفظ الطلب...' : 'Enregistrement...';
      submitBtn.disabled = true;
    }

    try{
      await refreshOneSignalUserId();
      const { error } = await supabaseClient.from('orders').insert({
        customer_name: payload.name,
        phone: normalizePhone(payload.phone),
        city: payload.city,
        address: payload.address,
        product_id: payload.product_id,
        product_name: payload.product,
        price: payload.numeric_price,
        status: 'pending',
        onesignal_user_id: payload.onesignal_user_id,
        session_id: payload.session_id
      });
      if(error) throw error;
      await trackEvent('form_submit', { form_draft: buildFormDraft() });
      window.location.href = 'thankyou.html';
    }catch(err){
      console.error('Supabase order insert failed:', err);
      alert(currentLang === 'ar' ? 'وقع مشكل فحفظ الطلب. المرجو المحاولة أو التواصل عبر واتساب.' : 'Erreur lors de l’enregistrement. Veuillez réessayer ou contacter WhatsApp.');
      if(submitBtn){ submitBtn.textContent = originalText; submitBtn.disabled = false; }
    }
  });
}


function initReviewModal(){
  const openBtn = $('openReviewModalBtn');
  const closeBtn = $('closeReviewModal');
  const form = $('reviewForm');
  const message = $('reviewFormMessage');

  openBtn?.addEventListener('click', () => openModal('reviewModal'));
  closeBtn?.addEventListener('click', () => closeModal('reviewModal'));
  document.querySelectorAll('[data-close="review"]').forEach(x => x.addEventListener('click', () => closeModal('reviewModal')));

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!supabaseClient){
      if(message) message.textContent = currentLang === 'ar' ? 'تعذر الاتصال. المرجو المحاولة لاحقاً.' : 'Connexion indisponible. Réessayez plus tard.';
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if(submitBtn){
      submitBtn.disabled = true;
      submitBtn.textContent = currentLang === 'ar' ? 'جاري الإرسال...' : 'Envoi en cours...';
    }
    if(message) message.textContent = '';

    const payload = {
      reviewer_name: $('reviewerName')?.value.trim() || '',
      phone: normalizePhone($('reviewerPhone')?.value || ''),
      city: $('reviewerCity')?.value.trim() || '',
      rating: Number(document.querySelector('input[name="rating"]:checked')?.value || 5),
      review_text: $('reviewText')?.value.trim() || '',
      is_published: false
    };

    if(!payload.reviewer_name || !payload.phone || !payload.city || !payload.review_text){
      if(message) message.textContent = currentLang === 'ar' ? 'كملي جميع المعلومات.' : 'Veuillez remplir tous les champs.';
      if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = originalText; }
      return;
    }

    try{
      const { error } = await supabaseClient.from('reviews').insert(payload);
      if(error) throw error;
      if(message) message.textContent = currentLang === 'ar' ? 'شكراً! غادي نراجعو الرأي ديالك قبل النشر.' : 'Merci! Votre avis sera vérifié avant publication.';
      form.reset();
      const rating5 = $('rating5');
      if(rating5) rating5.checked = true;
      setTimeout(() => {
        closeModal('reviewModal');
        if(message) message.textContent = '';
        if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = originalText; }
      }, 2000);
    }catch(err){
      console.error('Review insert failed:', err);
      if(message) message.textContent = currentLang === 'ar' ? 'وقع مشكل فإرسال الرأي. عاودي المحاولة.' : 'Erreur lors de l’envoi. Réessayez.';
      if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = originalText; }
    }
  });
}

function initMenu(){
  $('menuToggle')?.addEventListener('click', () => {
    const menu = $('mainNav');
    const btn = $('menuToggle');
    const open = !menu.classList.contains('show');
    menu.classList.toggle('show', open);
    btn.classList.toggle('active', open);
    btn.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('#mainNav a').forEach(a => a.addEventListener('click', () => {
    $('mainNav')?.classList.remove('show');
    $('menuToggle')?.classList.remove('active');
    $('menuToggle')?.setAttribute('aria-expanded','false');
  }));
}

function initWhatsApp(){
  $('waToggle')?.addEventListener('click', () => $('waChat')?.classList.toggle('show'));
  $('waClose')?.addEventListener('click', () => $('waChat')?.classList.remove('show'));
  document.querySelectorAll('[data-wa]').forEach(btn => btn.addEventListener('click', () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(btn.dataset.wa)}`, '_blank', 'noopener');
  }));
}

function initDesktopGalleryArrows(){
  const carousel = $('productCarousel');
  const prev = $('galleryPrev');
  const next = $('galleryNext');
  if(!carousel || !prev || !next) return;
  const scroll = (visualDirection) => {
    const amount = Math.round(carousel.clientWidth * 0.82);
    const isRTL = document.documentElement.dir === 'rtl';
    carousel.scrollBy({ left: visualDirection * amount * (isRTL ? -1 : 1), behavior:'smooth' });
  };
  prev.addEventListener('click', () => scroll(-1));
  next.addEventListener('click', () => scroll(1));
}

function initCursorGlow(){
  const glow = document.querySelector('.cursor-glow');
  if(!glow || matchMedia('(pointer: coarse)').matches) return;
  window.addEventListener('pointermove', (e) => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
  }, {passive:true});
}

function prepareTypeTargets(reset=false, scope=document){
  scope.querySelectorAll('.type-target').forEach(el => {
    if(reset || !el.dataset.fullText){
      el.dataset.fullText = el.textContent.trim();
      el.dataset.typed = '';
      el.dataset.typeRun = String((Number(el.dataset.typeRun || 0) + 1));
      el.textContent = '';
      el.classList.add('typing-ready');
      el.classList.remove('typing-active','typed');
      el.dataset.observed = '';
    }
  });
  observeReveal();
}

function typeText(el){
  if(!el || el.dataset.typed === 'done') return;
  const text = el.dataset.fullText || el.textContent.trim();
  if(!text) return;
  const run = String((Number(el.dataset.typeRun || 0) + 1));
  el.dataset.typeRun = run;
  el.dataset.typed = 'running';
  el.textContent = '';
  el.classList.add('typing-active');
  el.classList.remove('typing-ready');
  let i = 0;
  const step = () => {
    if(el.dataset.typeRun !== run) return;
    el.textContent = text.slice(0, i);
    i += 1;
    if(i <= text.length){
      setTimeout(step, Math.min(28, Math.max(8, 900 / Math.max(text.length, 1))));
    }else{
      el.dataset.typed = 'done';
      el.classList.add('typed');
    }
  };
  step();
}

function typeHeroTargets(){
  document.querySelectorAll('#home .type-target').forEach(el => {
    if(!el.dataset.fullText) el.dataset.fullText = el.textContent.trim();
    typeText(el);
  });
}

function observeReveal(){
  if(!revealObserver){
    revealObserver = new IntersectionObserver((entries)=>{
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
          if(entry.target.classList.contains('type-target')) typeText(entry.target);
          entry.target.querySelectorAll?.('.type-target').forEach(typeText);
          revealObserver.unobserve(entry.target);
        }
      });
    }, {threshold:.14, rootMargin:'0px 0px -60px 0px'});
  }
  document.querySelectorAll('.reveal, .type-target').forEach(el => {
    if(el.dataset.observed !== '1'){
      el.dataset.observed = '1';
      revealObserver.observe(el);
    }
  });
}

async function init(){
  try{
    await loadProducts();
  }catch(err){
    console.error(err);
    products = [];
  }
  selectedProduct = products[0] || null;
  modalProduct = products[0] || null;
  applyTranslations();
  setSelectedProduct(products[0], 0);
  observeReveal();
  initMenu();
  initOrderForm();
  initWhatsApp();
  initDesktopGalleryArrows();
  initCursorGlow();
  ensureSessionId();
  trackEvent('visit');
  setTimeout(refreshOneSignalUserId, 2500);
  $('langSwitch')?.addEventListener('click', () => {
    currentLang = currentLang === 'ar' ? 'fr' : 'ar';
    applyTranslations();
    typeHeroTargets();
  });
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){
      closeModal('productModal');
      closeModal('orderModal');
      $('waChat')?.classList.remove('show');
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
