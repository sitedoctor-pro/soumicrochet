const $ = (id) => document.getElementById(id);
const products = window.SOUMI_PRODUCTS || [];
const ASSET_IMG = 'assets/img/';
const STORE_IMAGE_BASE = 'soumicrochet.store/assets/img/';
const WHATSAPP_NUMBER = '212662711995';
let currentLang = localStorage.getItem('soumi_lang') || 'fr';
let selectedProduct = products[0];
let selectedImageIndex = 0;
let modalProduct = products[0];
let modalImageIndex = 0;
let revealObserver;

const translations = {
  ar:{
    strip1:'🚚 التوصيل سريع 24-48 ساعة',strip2:'💵 الدفع عند الاستلام',strip3:'👜 قطع محدودة مخدومة باليد',
    navHome:'الرئيسية',navProducts:'الموديلات',navStory:'القصة',navReviews:'آراء',navFaq:'الأسئلة',
    heroTitle:'✨ تألقي بلمسة فريدة.. صيكان هماوية مخدومة باليد! 👜',
    heroLead:'تشكيلة حصرية من حقائب الكروشي والعقيق 💎. خدمة متقونة، جودة عالية، وتفاصيل كتخطف الأنظار 😍. اختاري الستايل لي يواتيك وكوني متميزة فكل مناسبة 👑.',
    badge1:'مخدومة باليد',badge2:'الدفع عند الاستلام',badge3:'موديلات محدودة',primaryCta:'🛒 اطلبي الصاك ديالك دابا',secondaryCta:'👇 اكتشفي جميع الموديلات',
    productsTitle:'اختاري الموديل لي خطف قلبك',productsLead:'سحبي يمين ويسار وشوفي الموديلات. كل بطاقة كتبيّن غير الصورة الرئيسية، والتفاصيل كتفتحيهم فالمودال.',
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
    orderBtn:'طلبها',confirm:'تأكيد الطلب',priceLabel:'الثمن',currency:'درهم',step1Title:'اختاري الصاك',step1Lead:'ضغطي على الموديل لي بغيتي، وتقدري ترجعي تبدليه قبل ما تسالي الطلب.',
    step2Title:'معلوماتك',step2Lead:'خلي الاسم ورقم الهاتف باش نأكدو الطلب بسرعة.',step3Title:'التوصيل',step3Lead:'كملي المدينة والعنوان باش يتوجد الطلب ديالك.',
    nextBtn:'التالي',backBtn:'رجوع',submitBtn:'تأكيد الطلب',nameLabel:'الاسم الكامل',phoneLabel:'رقم الهاتف',cityLabel:'المدينة',addressLabel:'العنوان',stickyCta:'اطلبي الصاك ديالك دابا',waIntro:'سلام، كيفاش نقدر نعاونك؟ اختاري جواب سريع:'
  },
  fr:{
    strip1:'🚚 Livraison rapide 24-48h',strip2:'💵 Paiement à la livraison',strip3:'👜 Pièces limitées faites main',
    navHome:'Accueil',navProducts:'Modèles',navStory:'Histoire',navReviews:'Avis',navFaq:'FAQ',
    heroTitle:'✨ Brillez avec une touche unique.. des sacs faits main! 👜',
    heroLead:'Collection exclusive de sacs crochet et perles 💎. Finition soignée, haute qualité, et des détails qui attirent tous les regards 😍. Choisissez le style qui vous ressemble et soyez unique à chaque occasion 👑.',
    badge1:'Fait main',badge2:'Paiement à la livraison',badge3:'Modèles limités',primaryCta:'🛒 Commander mon sac maintenant',secondaryCta:'👇 Découvrir tous les modèles',
    productsTitle:'Choisissez le modèle qui vous fait craquer',productsLead:'Glissez à gauche et à droite pour découvrir les modèles. Chaque carte montre l’image principale; les détails s’ouvrent dans le modal.',
    storyTitle:'✨ Pas juste un sac.. une œuvre d’art faite avec amour! 💖',
    storyBody:'Chaque sac soumicrochet 🧶 porte une histoire de créativité, de patience et de précision extrême ⏳. Quand vous voyez ces perles noires brillantes posées une par une 🖤, ou cette maille crochet épaisse travaillée soigneusement à la main 🧵, vous savez que ce n’est ni une machine ni une production de masse 🚫.. c’est le travail des mains 🤲 qui donnent du temps et de l’âme pour créer une pièce unique 👑. Les détails sont tout pour nous! 🔍 De la chaîne dorée qui apporte une touche de luxe ✨, au fermoir solide 🔒, jusqu’à la structure qui garde le sac bien formé et généreux 👜.',
    storyCta:'Commander mon modèle',reviewsTitle:'Avis des clientes Soumi Crochet',faqTitle:'Questions fréquentes',
    faqQ1:'Les sacs sont-ils 100% faits main?',faqA1:'Oui, chaque sac est travaillé avec soin et haute précision par des artisans, ce qui demande du temps pour garantir une qualité premium et un modèle unique.',
    faqQ2:'Puis-je payer à la livraison?',faqA2:'Bien sûr! Le paiement se fait à la livraison (Cash on Delivery) pour que vous soyez rassurée et que vous validiez la qualité de votre sac avant de payer.',
    faqQ3:'Combien de temps prend la livraison?',faqA3:'La livraison est rapide et prend entre 24 et 48 heures maximum dans toutes les villes du Maroc.',
    faqQ4:'Les photos sont-elles réelles?',faqA4:'Oui, toutes les photos affichées sont celles de nos vrais sacs, et vous recevrez le même modèle que celui que vous avez choisi.',
    trustTitle:'✨ Nos Engagements.. Pour un achat en toute sérénité!',
    trust1Title:'🥇 Qualité irréprochable',trust1Desc:'Des sacs faits main avec passion et précision pour durer.',
    trust2Title:'🤝 Prix juste et transparent',trust2Desc:'En travaillant directement de l\'artisan à vous, nous offrons le meilleur prix.',
    trust3Title:'🚚 Paiement à la livraison',trust3Desc:'Vérifiez votre sac de vos propres yeux, assurez-vous de la qualité, et payez à la réception.',
    trust4Title:'📞 Service client dédié',trust4Desc:'Nous sommes toujours là pour vous. Notre équipe est disponible sur WhatsApp pour vous.',
    orderBtn:'Commander',confirm:'Confirmer la commande',priceLabel:'Prix',currency:'DH',step1Title:'Choisissez le sac',step1Lead:'Cliquez sur le modèle souhaité. Vous pouvez le changer avant de finaliser la commande.',
    step2Title:'Vos informations',step2Lead:'Laissez votre nom et téléphone pour confirmer rapidement la commande.',step3Title:'Livraison',step3Lead:'Complétez la ville et l’adresse pour préparer votre commande.',
    nextBtn:'Suivant',backBtn:'Retour',submitBtn:'Confirmer la commande',nameLabel:'Nom complet',phoneLabel:'Téléphone',cityLabel:'Ville',addressLabel:'Adresse',stickyCta:'Commandez votre sac maintenant',waIntro:'Bonjour, comment pouvons-nous vous aider? Choisissez une réponse rapide:'
  }
};

function asset(file){return ASSET_IMG + file;}
function imageUrl(file){return STORE_IMAGE_BASE + file;}
function productName(p){return currentLang === 'ar' ? p.nameAr : p.nameFr;}
function productDesc(p){return currentLang === 'ar' ? p.descAr : p.descFr;}
function priceText(p){const t = translations[currentLang]; return `${t.priceLabel}: ${p.price} ${t.currency}`;}
function priceHtml(p){const t = translations[currentLang]; return `<span class="price-label">${escapeHTML(t.priceLabel)}:</span> <del class="old-price">${Number(p.oldPrice || p.price)} DH</del> <strong>${Number(p.price)} ${escapeHTML(t.currency)}</strong>`;}
function priceFullText(p){return `${priceText(p)} (Old: ${Number(p.oldPrice || p.price)} DH)`;}
function safeSet(id, value){const n=$(id); if(n) n.textContent = value;}
function escapeHTML(str){return String(str).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}

function renderProducts(){
  const wrap = $('productCarousel');
  if(!wrap) return;
  wrap.innerHTML = products.map((p, idx) => `
    <article class="product-card glass reveal">
      <button class="product-media" type="button" data-open-product="${p.id}" aria-label="${escapeHTML(productName(p))}">
        <img src="${asset(p.images[0])}" alt="${escapeHTML(productName(p))}" loading="lazy" />
        <span class="product-badge">${idx < 9 ? '0'+(idx+1) : idx+1}</span>
      </button>
      <div class="product-card-body">
        <h3>${escapeHTML(productName(p))}</h3>
        <span class="price-tag">${priceHtml(p)}</span>
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
  if(!grid) return;
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
  selectedImageIndex = imgIndex || 0;
  const file = selectedProduct.images[selectedImageIndex] || selectedProduct.images[0];
  const fullUrl = imageUrl(file);
  if($('selectedModelName')) $('selectedModelName').value = productName(selectedProduct);
  if($('selectedProductImage')) $('selectedProductImage').value = fullUrl;
  if($('selectedProductPrice')) $('selectedProductPrice').value = priceFullText(selectedProduct);
  if($('sourcePage')) $('sourcePage').value = window.location.href;
  if($('selectedPreview')) {$('selectedPreview').src = asset(file); $('selectedPreview').alt = productName(selectedProduct);}
  safeSet('selectedLabel', productName(selectedProduct));
  if($('selectedPriceLabel')) $('selectedPriceLabel').innerHTML = priceHtml(selectedProduct);
  safeSet('selectedUrlText', fullUrl);
  safeSet('finalProductName', productName(selectedProduct));
  if($('finalProductPrice')) $('finalProductPrice').innerHTML = priceHtml(selectedProduct);
  safeSet('finalProductUrl', fullUrl);
}

function openModal(id){
  const node = $(id); if(!node) return;
  node.classList.add('show'); node.setAttribute('aria-hidden','false'); document.body.classList.add('modal-open');
}
function closeModal(id){
  const node = $(id); if(!node) return;
  node.classList.remove('show'); node.setAttribute('aria-hidden','true');
  if(!document.querySelector('.modal-shell.show')) document.body.classList.remove('modal-open');
}
function openProductModal(id){
  modalProduct = products.find(p => p.id === id) || products[0];
  modalImageIndex = 0;
  renderProductModal();
  openModal('productModal');
}
function renderProductModal(){
  const node = $('productModalContent'); if(!node || !modalProduct) return;
  const imgs = modalProduct.images;
  const file = imgs[modalImageIndex];
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
        <span class="price-tag">${priceHtml(modalProduct)}</span>
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

function showStep(step){
  document.querySelectorAll('.form-step').forEach(s => s.classList.toggle('active', s.dataset.step === String(step)));
  document.querySelectorAll('.order-progress span').forEach((s,i)=>s.classList.toggle('active', i < step));
  prepareTypeTargets(true, $('orderForm'));
}
function validateStep(step){
  if(step === 2){
    const name = $('customerName'); const phone = $('customerPhone');
    if(!name.value.trim()){name.focus(); return false;}
    phone.value = normalizePhone(phone.value);
    if(!/^0[5-7][0-9]{8}$/.test(phone.value)){phone.focus(); alert(currentLang === 'ar' ? 'دخل رقم هاتف مغربي صحيح بحال 06XXXXXXXX' : 'Entrez un numéro marocain valide comme 06XXXXXXXX'); return false;}
  }
  return true;
}
function normalizePhone(value){
  let v = (value || '').replace(/\s+/g,'').replace(/[^0-9]/g,'');
  if(v.startsWith('212')) v = '0' + v.slice(3);
  return v;
}

function typeHeroTargets(){
  document.querySelectorAll('#home .type-target').forEach(el => {
    if(!el.dataset.fullText){
      el.dataset.fullText = el.textContent.trim();
    }
    typeText(el);
  });
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
  setSelectedProduct(selectedProduct || products[0], selectedImageIndex);
  renderPicker();
  prepareTypeTargets(true);
  typeHeroTargets();
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
function prepareTypeTargets(reset=false, scope=document){
  scope.querySelectorAll('.type-target').forEach(el => {
    if(reset || !el.dataset.fullText){
      el.dataset.fullText = el.textContent.trim();
      el.dataset.typed = '';
      el.dataset.typeRun = String((Number(el.dataset.typeRun || 0) + 1));
      el.textContent = '';
      el.classList.add('typing-ready');
      el.classList.remove('typing-active');
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
  el.dataset.typed = 'done';
  el.classList.remove('typing-ready');
  el.classList.add('typing-active');
  el.textContent = '';
  const cursor = document.createElement('span');
  cursor.className = 'type-cursor';
  el.appendChild(cursor);
  let i = 0;
  const speed = el.classList.contains('lead') || el.tagName.toLowerCase() === 'p' ? 9 : 18;
  const tick = () => {
    if(el.dataset.typeRun !== run) return;
    if(i < text.length){
      el.insertBefore(document.createTextNode(text.charAt(i)), cursor);
      i++;
      setTimeout(tick, speed + Math.random()*10);
    }else{
      setTimeout(()=>{ if(el.dataset.typeRun === run) cursor.remove(); }, 450);
    }
  };
  tick();
}

function initWhatsApp(){
  $('waToggle')?.addEventListener('click', () => {
    const chat = $('waChat');
    chat?.classList.toggle('show');
    chat?.setAttribute('aria-hidden', chat.classList.contains('show') ? 'false' : 'true');
  });
  $('waClose')?.addEventListener('click', () => {$('waChat')?.classList.remove('show'); $('waChat')?.setAttribute('aria-hidden','true');});
  document.querySelectorAll('[data-wa]').forEach(btn => btn.addEventListener('click', () => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(btn.dataset.wa)}`, '_blank')));
}
function initDesktopGalleryArrows(){
  const carousel = $('productCarousel');
  const amount = () => Math.max(340, Math.round((carousel?.clientWidth || 900) * .72));
  const move = (visualDirection) => {
    if(!carousel) return;
    const isRtl = document.documentElement.dir === 'rtl';
    const axis = isRtl ? -1 : 1;
    carousel.scrollBy({left: visualDirection * axis * amount(), behavior:'smooth'});
  };
  $('galleryPrev')?.addEventListener('click', () => move(-1));
  $('galleryNext')?.addEventListener('click', () => move(1));
}
function initMenu(){
  $('menuToggle')?.addEventListener('click', () => {
    const nav = $('mainNav'); const btn = $('menuToggle');
    nav?.classList.toggle('show'); btn?.classList.toggle('active');
    btn?.setAttribute('aria-expanded', nav?.classList.contains('show') ? 'true' : 'false');
  });
  document.querySelectorAll('#mainNav a').forEach(a => a.addEventListener('click', () => {
    $('mainNav')?.classList.remove('show'); $('menuToggle')?.classList.remove('active'); $('menuToggle')?.setAttribute('aria-expanded','false');
  }));
}
function initOrderForm(){
  document.querySelectorAll('.js-open-order').forEach(btn => btn.addEventListener('click', () => { showStep(1); renderPicker(); openModal('orderModal'); }));
  $('closeProductModal')?.addEventListener('click', () => closeModal('productModal'));
  $('closeOrderSheet')?.addEventListener('click', () => closeModal('orderModal'));
  document.querySelectorAll('[data-close="product"]').forEach(x => x.addEventListener('click', () => closeModal('productModal')));
  document.querySelectorAll('[data-close="order"]').forEach(x => x.addEventListener('click', () => closeModal('orderModal')));
  document.querySelectorAll('.next-step').forEach(btn => btn.addEventListener('click', () => {
    const current = Number(document.querySelector('.form-step.active')?.dataset.step || 1);
    if(validateStep(current)) showStep(Number(btn.dataset.next));
  }));
  document.querySelectorAll('.prev-step').forEach(btn => btn.addEventListener('click', () => showStep(Number(btn.dataset.prev))));
  $('orderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    setSelectedProduct(selectedProduct, selectedImageIndex);
    const step3Inputs = Array.from(document.querySelectorAll('.form-step[data-step="3"] input[required]'));
    for(const input of step3Inputs){ if(!input.value.trim()){ input.focus(); return; } }

    const selectedImageFile = selectedProduct.images[selectedImageIndex] || selectedProduct.images[0];
    const payload = {
      name: $('customerName')?.value || '',
      product: productName(selectedProduct),
      price: priceText(selectedProduct),
      image: $('selectedProductImage')?.value || imageUrl(selectedImageFile),
      imageAsset: asset(selectedImageFile)
    };
    const encodedPayload = JSON.stringify(payload);
    sessionStorage.setItem('soumi_last_order', encodedPayload);
    localStorage.setItem('soumi_last_order_backup', encodedPayload);
    try{
      history.replaceState({soumiLastOrder: payload}, document.title, window.location.href);
    }catch(err){}

    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if(submitBtn){
      submitBtn.textContent = 'جاري الإرسال... / Envoi...';
      submitBtn.disabled = true;
    }

    try{
      const response = await fetch(form.action, {
        method:'POST',
        body:formData,
        headers:{'Accept':'application/json'}
      });
      if(response.ok){
        window.location.href = 'thankyou.html';
      }else{
        alert("وقع مشكل فإرسال الطلب، المرجو المحاولة. / Erreur lors de l'envoi.");
        if(submitBtn){submitBtn.textContent = originalText; submitBtn.disabled = false;}
      }
    }catch(err){
      window.location.href = 'thankyou.html';
    }
  });}
function initCursorGlow(){
  const glow = document.querySelector('.cursor-glow');
  if(!glow || matchMedia('(pointer: coarse)').matches) return;
  window.addEventListener('pointermove', (e) => {glow.style.left = `${e.clientX}px`; glow.style.top = `${e.clientY}px`;}, {passive:true});
}

function init(){
  applyTranslations();
  typeHeroTargets();
  setSelectedProduct(products[0], 0);
  renderPicker();
  observeReveal();
  initMenu();
  initOrderForm();
  initWhatsApp();
  initDesktopGalleryArrows();
  initCursorGlow();
  $('langSwitch')?.addEventListener('click', () => { currentLang = currentLang === 'ar' ? 'fr' : 'ar'; applyTranslations(); typeHeroTargets(); });
  document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape'){closeModal('productModal'); closeModal('orderModal'); $('waChat')?.classList.remove('show');} });
}

document.addEventListener('DOMContentLoaded', init);
