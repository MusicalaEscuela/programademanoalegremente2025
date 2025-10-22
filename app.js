'use strict';

/* Helper */
const $ = (id) => document.getElementById(id);

/* DOM */
const menuBtn      = $('menuBtn');
const closeDrawer  = $('closeDrawer');
const drawer       = $('drawer');
const scrim        = $('scrim');

const sceneMenu     = $('sceneMenu');
const tiles         = $('tiles');

const sceneTitle    = $('sceneTitle');
const sceneSubtitle = $('sceneSubtitle');
const sceneChips    = $('sceneChips');

const sceneIntro = $('sceneIntro');
const sceneSense = $('sceneSense');
const sceneImage = $('sceneImage');

const sceneCast = $('sceneCast');
const castGrid  = $('castGrid');

const q        = $('q');
const main     = $('main');

/* Bienvenida */
const welcome  = $('welcome');
const wClose   = $('wClose');
const wStart   = $('wStart');
const wDont    = $('wDontShow');

/* Modal Persona */
const pm       = $('pm');
const pmPhoto  = $('pmPhoto');
const pmName   = $('pmName');
const pmRole   = $('pmRole');
const pmBio    = $('pmBio');
const pmTags   = $('pmTags');
const pmClose  = $('pmClose');

/* Créditos */
const creditsGrid = $('creditsGrid');

/* Estado */
let DATA = { info:{}, escenas:[] };
let activeId = null;

/* ───── Drawer ───── */
function openDrawer(){ drawer?.classList.add('open'); scrim?.classList.add('show'); drawer?.focus(); }
function closeDrawerFn(){ drawer?.classList.remove('open'); scrim?.classList.remove('show'); menuBtn?.focus(); }
menuBtn?.addEventListener('click', openDrawer);
closeDrawer?.addEventListener('click', closeDrawerFn);
scrim?.addEventListener('click', closeDrawerFn);

/* Lazy IMG helper */
function makeLazyImg({src, alt='', cls=''}){
  const img = new Image();
  img.loading = 'lazy';
  img.decoding = 'async';
  img.alt = alt;
  if (cls) img.className = cls;
  img.src = src;
  return img;
}

/* Cargar JSON */
async function loadData(){
  const res = await fetch('data.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`No se pudo cargar data.json (${res.status})`);
  DATA = await res.json();
  console.log('Cargado data.json', DATA);
}

/* Helper: contar elementos en escena.galeria */
function countGaleria(sc){
  try{
    return Object.values(sc.galeria || {}).reduce((acc, arr) => acc + ((arr && arr.length) || 0), 0);
  }catch(_){ return 0; }
}

/* ───── Render: menú (drawer) ───── */
function renderMenu(list) {
  if (!sceneMenu) return;
  sceneMenu.innerHTML = '';
  list.forEach((sc, i) => {
    const count = countGaleria(sc) || (sc.participantes?.length || 0);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.id = sc.id;
    btn.innerHTML = `
      <div class="thumb"></div>
      <div class="meta">
        <div class="tit"><span class="num">${i+1}</span>${sc.titulo}</div>
        <div class="chips">${(sc.centros || []).map(c => `<span class="chip">${c}</span>`).join('')}</div>
        <div class="muted small">${count ? `${count} artista${count>1?'s':''}` : 'Sin elenco'}</div>
      </div>
    `;
    const t = btn.querySelector('.thumb');
    if (t) t.appendChild(makeLazyImg({ src: sc.imagen, alt: sc.titulo }));
    btn.addEventListener('click', () => {
      closeDrawerFn();
      selectScene(sc.id);
      const target = document.querySelector('.main');
      if (target) window.scrollTo({ top: target.offsetTop - 12, behavior:'smooth' });
    });
    sceneMenu.appendChild(btn);
  });
}

/* ───── Render: mosaico (home) ───── */
function renderTiles(list){
  if (!tiles) return;
  tiles.innerHTML = '';
  list.forEach((sc, i) => {
    const card = document.createElement('article');
    card.className = 'tile';
    card.innerHTML = `
      <span class="num">${i+1}</span>
      <div class="img-wrap"></div>
      <div class="overlay"><div class="title">${sc.titulo}</div></div>
    `;
    const wrap = card.querySelector('.img-wrap');
    if (wrap) {
      wrap.appendChild(makeLazyImg({ src: sc.imagen, alt: '', cls: '' }));
    }
    card.addEventListener('click', () => {
      selectScene(sc.id);
      const target = document.querySelector('.main');
      if (target) window.scrollTo({ top: target.offsetTop - 12, behavior:'smooth' });
    });
    tiles.appendChild(card);
  });
}

/* ───── Elenco: detección de área + grupos ───── */
const AREA_ORDER = ['Teatro','Danza','Música','Orquesta','Artes plásticas','Coro','Elenco'];

function detectArea(p){
  // Compatibilidad con estructura antigua (personaje/tags)
  if (p?.tags?.length) {
    const map = { 'Teatro':'Teatro', 'Danza':'Danza', 'Música':'Música', 'Orquesta':'Orquesta', 'Plástico':'Artes plásticas', 'Coro':'Coro', 'Final':'Elenco' };
    for (const t of p.tags) if (map[t]) return map[t];
  }
  // Fallback
  return 'Elenco';
}

function groupCast(list){
  const groups = {};
  list.forEach(p => {
    const area = detectArea(p);
    groups[area] = groups[area] || [];
    groups[area].push(p);
  });
  const ordered = Object.entries(groups).sort(([a],[b]) => {
    const ia = AREA_ORDER.indexOf(a);
    const ib = AREA_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  return ordered;
}

/* ───── Render elenco por grupos (estructura antigua) ───── */
function renderCastGroups(list){
  if (!castGrid) return;
  castGrid.innerHTML = '';
  const groups = groupCast(list);
  groups.forEach(([area, people]) => {
    const wrap = document.createElement('div');
    wrap.className = 'cast-group';
    wrap.innerHTML = `<div class="group-title">${area}</div><div class="cast-rows"></div>`;
    const rows = wrap.querySelector('.cast-rows');

    people.forEach(p => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'person';
      el.innerHTML = `
        <div class="ph"></div>
        <b class="nombre-real">${p.nombre || 'Artista'}</b>
        ${p.personaje ? `<span class="rol">${p.personaje}</span>` : ''}
      `;
      const ph = el.querySelector('.ph');
      if (ph) {
        ph.appendChild(makeLazyImg({
          src: p.foto || 'placeholder.jpg',
          alt: `Foto de ${p.nombre || 'Artista'}`
        }));
      }
      el.addEventListener('click', () => openPerson(p));
      rows.appendChild(el);
    });

    castGrid.appendChild(wrap);
  });
}

/* ───── Render galería por centro (escena.galeria) ───── */
function renderGalleryByCenter(galeria){
  if (!castGrid) return;
  castGrid.innerHTML = '';

  const label = (key) => ({
    arroyo:'Arroyo', betania:'Betania', jerusalen:'Jerusalén',
    padre:'Padre Misericordioso', santo:'Santo Domingo', gmmmc:'GMMMC',
    lucero:'Lucero', colegio:'Colegio'
  }[key] || key);

  Object.entries(galeria || {}).forEach(([centro, personas]) => {
    const wrap = document.createElement('div');
    wrap.className = 'cast-group';
    wrap.innerHTML = `<div class="group-title">${label(centro)}</div><div class="cast-rows"></div>`;
    const rows = wrap.querySelector('.cast-rows');
    (personas || []).forEach(p => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'person';
      el.innerHTML = `
        <div class="ph"></div>
        <b class="nombre-real">${p.nombre || 'Artista'}</b>
      `;
      const ph = el.querySelector('.ph');
      if (ph) {
        ph.appendChild(makeLazyImg({
          src: p.foto || 'placeholder.jpg',
          alt: `Foto de ${p.nombre || 'Artista'}`
        }));
      }
      el.addEventListener('click', () => openPerson({ nombre:p.nombre, foto:p.foto }));
      rows.appendChild(el);
    });
    castGrid.appendChild(wrap);
  });
}

/* ───── Selección de escena ───── */
function selectScene(id) {
  activeId = id;
  document.querySelectorAll('.menu button')
    .forEach(b => b.classList.toggle('active', b.dataset.id === id));

  const sc = DATA.escenas.find(e => e.id === id);
  if (!sc) return;

  if (sceneTitle) sceneTitle.textContent = sc.titulo || 'Escena';
  if (sceneSubtitle) {
    sceneSubtitle.textContent = sc.musica
      ? `Música: ${sc.musica}${sc.ubicacionMusica ? ` · ${sc.ubicacionMusica}` : ''}`
      : '';
  }

  if (sceneChips) {
    sceneChips.innerHTML = '';
    (sc.centros || []).forEach(c => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = c;
      sceneChips.appendChild(chip);
    });
  }

  if (sceneSense) {
    sceneSense.innerHTML = sc.sentido
      ? `<h3>Sinopsis</h3><p>${sc.sentido}</p>`
      : '';
  }

  // Imagen principal
  if (sceneImage) {
    sceneImage.innerHTML = '';
    sceneImage.appendChild(makeLazyImg({ src: sc.imagen, alt: sc.titulo }));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    }, { threshold: .2 });
    Array.from(sceneImage.querySelectorAll('img')).forEach(img => observer.observe(sceneImage));
  }

  if (sceneIntro) sceneIntro.hidden = false;

  const gal = sc.galeria || {};
  if (!Object.keys(gal).length) {
    if (sceneCast) sceneCast.hidden = true;
  } else {
    renderGalleryByCenter(gal);
    if (sceneCast) sceneCast.hidden = false;
  }

  main?.focus({ preventScroll: false });
}

/* ───── Modal persona ───── */
function openPerson(p) {
  if (!pm) return;
  if (pmName)  pmName.textContent  = p.nombre || 'Artista';
  if (pmPhoto) {
    pmPhoto.src         = p.foto || 'placeholder.jpg';
    pmPhoto.alt         = `Foto de ${p.nombre || 'Artista'}`;
  }
  if (pmRole)  pmRole.textContent  = '';
  if (pmBio)   pmBio.textContent   = '';
  if (pmTags) {
    pmTags.innerHTML    = '';
    ([]).forEach(t => {
      const s = document.createElement('span');
      s.className = 'chip';
      s.textContent = t;
      pmTags.appendChild(s);
    });
  }
  pm.showModal();
}
pmClose?.addEventListener('click', () => pm?.close());
pm?.addEventListener('click', e => { if (e.target === pm) pm.close(); });

/* ───── Búsqueda ───── */
function applySearch() {
  const term = (q?.value || '').trim().toLowerCase();
  const items = DATA.escenas.map(sc => {
    const inScene = [sc.titulo, sc.sentido, sc.musica].filter(Boolean).join(' ').toLowerCase().includes(term);
    const inCast = Object.values(sc.galeria || {}).flat().some(p =>
      [p.nombre].filter(Boolean).join(' ').toLowerCase().includes(term)
    ) || (sc.participantes || []).some(p =>
      [p.nombre, p.personaje, ...(p.tags || [])].filter(Boolean).join(' ').toLowerCase().includes(term)
    );
    return { sc, show: !term || inScene || inCast };
  }).filter(x => x.show).map(x => x.sc);

  renderMenu(items);
  renderTiles(items);
}
q?.addEventListener('input', applySearch);

/* ───── Créditos ───── */
function renderCredits(data){
  if(!creditsGrid) return;
  creditsGrid.innerHTML = '';
  if(!data || !Object.keys(data).length){
    creditsGrid.innerHTML = '<p class="muted">Pronto subiremos los créditos.</p>';
    return;
  }
  Object.entries(data).forEach(([titulo, personas]) => {
    const block = document.createElement('div');
    block.className = 'credit-block';
    block.innerHTML = `<div class="credit-title">${titulo}</div><div class="credit-list"></div>`;
    const list = block.querySelector('.credit-list');
    (personas || []).forEach(n => {
      const chip = document.createElement('span');
      chip.className = 'credit-chip';
      chip.textContent = n;
      list.appendChild(chip);
    });
    creditsGrid.appendChild(block);
  });
}

/* ───── Bienvenida ───── */
function maybeShowWelcome(){
  if (!welcome) return;
  const seen = localStorage.getItem('am25_welcome');
  if (seen === '1') { welcome.remove(); return; }
  wClose?.addEventListener('click', () => welcome.remove());
  wStart?.addEventListener('click', () => welcome.remove());
  wDont?.addEventListener('click', () => { localStorage.setItem('am25_welcome','1'); welcome.remove(); });
}

/* ───── Init ───── */
(async function(){
  try {
    await loadData();
    renderMenu(DATA.escenas);
    renderTiles(DATA.escenas);
    renderCredits(DATA.creditos || DATA.info?.creditos);
    maybeShowWelcome();
  } catch (err) {
    console.error(err);
    const box = document.createElement('div');
    box.className = 'card wrap';
    box.innerHTML = `<div class="content"><b>No pudimos cargar <code>data.json</code>.</b><br>
    Asegúrate de que el archivo esté en la misma carpeta que <code>index.html</code> y que el JSON sea válido.</div>`;
    document.body.prepend(box);
  }
})();
