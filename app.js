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
const pm      = $('personModal');
const pmName  = $('pmName');
const pmPhoto = $('pmPhoto');
const pmRole  = $('pmRole');
const pmBio   = $('pmBio');
const pmTags  = $('pmTags');
const pmClose = $('pmClose');

/* Créditos */
const creditsGrid = $('creditsGrid');

/* Estado */
let DATA = { info:{}, escenas:[] };
let activeId = null;

/* ───── Menu drawer ───── */
function openDrawer(){
  drawer.classList.add('open');
  scrim.hidden = false;
  menuBtn?.setAttribute('aria-expanded','true');
  drawer.setAttribute('aria-hidden','false');
}
function closeDrawerFn(){
  drawer.classList.remove('open');
  scrim.hidden = true;
  menuBtn?.setAttribute('aria-expanded','false');
  drawer.setAttribute('aria-hidden','true');
}
menuBtn?.addEventListener('click', openDrawer);
closeDrawer?.addEventListener('click', closeDrawerFn);
scrim?.addEventListener('click', closeDrawerFn);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeDrawerFn(); if (welcome?.open) welcome.close(); }
});

/* ───── Data ───── */
async function loadData() {
  const res = await fetch('data.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`No se pudo cargar data.json (${res.status})`);
  DATA = await res.json();
  console.log('Cargado data.json', DATA);
}

/* ───── Render: menú (drawer) ───── */
function renderMenu(list) {
  sceneMenu.innerHTML = '';
  list.forEach((sc, i) => {
    const count = sc.participantes?.length || 0;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.id = sc.id;
    btn.innerHTML = `
      <div class="thumb"><img src="${sc.imagen}" alt="" loading="lazy" decoding="async"></div>
      <div class="row">
        <span>${i + 1}. ${sc.titulo}</span>
        <span class="badge">${count} ${count === 1 ? 'artista' : 'artistas'}</span>
      </div>
    `;
    btn.addEventListener('click', () => { selectScene(sc.id); closeDrawerFn(); });
    sceneMenu.appendChild(btn);
  });
}

/* ───── Render: mosaico (home) ───── */
function renderTiles(list){
  tiles.innerHTML = '';
  list.forEach((sc, i) => {
    const card = document.createElement('article');
    card.className = 'tile';
    card.innerHTML = `
      <span class="num">${i+1}</span>
      <img src="${sc.imagen}" alt="" loading="lazy" decoding="async">
      <div class="overlay"><div class="title">${sc.titulo}</div></div>
    `;
    card.addEventListener('click', () => {
      selectScene(sc.id);
      window.scrollTo({ top: document.querySelector('.main').offsetTop - 12, behavior:'smooth' });
    });
    tiles.appendChild(card);
  });
}

/* ───── Elenco: detección de área + grupos ───── */
const AREA_ORDER = ['Teatro','Danza','Música','Orquesta','Artes plásticas','Coro','Elenco'];

function detectArea(p){
  const tag = (p.tags || [])[0] || '';
  if (['Teatro','Danza','Música','Coro'].includes(tag)) return tag;
  if (tag === 'Plástico') return 'Artes plásticas';

  const r = (p.rol || '').toLowerCase();
  // Orquesta por instrumentos (detectar varios nombres comunes)
  if (/(violin|violín|viola|cello|contraba|contrabajo|flauta|clarinete|trompeta|trombón|saxo|saxofón|oboe|fagot|piano|teclado|guitarra|bajo|percusi|timbales|batería|marimba)/.test(r)) return 'Orquesta';
  if (/(coro|voz|cantante)/.test(r)) return 'Coro';
  if (/(danza|bailar)/.test(r)) return 'Danza';
  if (/(teatr|actor|actriz|protagonista|antagonista|poeta)/.test(r)) return 'Teatro';
  if (/(plást|máscaras|escenograf|trenzadoras|artes plásticas)/.test(r)) return 'Artes plásticas';
  if (/(músic|tambores)/.test(r)) return 'Música';
  return 'Elenco';
}

function groupCast(list){
  const map = new Map();
  list.forEach(p => {
    const area = detectArea(p);
    if(!map.has(area)) map.set(area, []);
    map.get(area).push(p);
  });
  const ordered = Array.from(map.entries()).sort((a,b) => {
    const ia = AREA_ORDER.indexOf(a[0]); const ib = AREA_ORDER.indexOf(b[0]);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
  return ordered;
}

function renderCastGroups(list){
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
        <img src="${p.foto || 'placeholder.jpg'}" alt="Foto de ${p.nombre || 'Artista'}" loading="lazy" decoding="async">
        <b>${p.nombre || 'Artista'}</b>
        <span class="role">${p.rol || ''}</span>
      `;
      el.addEventListener('click', () => openPerson(p));
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

  sceneTitle.textContent = sc.titulo || 'Escena';
  sceneSubtitle.textContent = sc.musica
    ? `Música: ${sc.musica}${sc.ubicacionMusica ? ` · ${sc.ubicacionMusica}` : ''}`
    : '';

  sceneChips.innerHTML = '';
  (sc.centros || []).forEach(c => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = c;
    sceneChips.appendChild(chip);
  });

  sceneSense.textContent = sc.sentido || '';
  sceneImage.src = sc.imagen || 'placeholder.jpg';
  sceneImage.alt = sc.titulo ? `Imagen alusiva: ${sc.titulo}` : 'Imagen de la escena';
  sceneIntro.hidden = false;

  // Elenco por áreas (vertical)
  const cast = sc.participantes || [];
  if (!cast.length) {
    sceneCast.hidden = true;
  } else {
    renderCastGroups(cast);
    sceneCast.hidden = false;
  }

  main.focus({ preventScroll: false });
}

/* ───── Modal persona ───── */
function openPerson(p) {
  if (!pm) return;
  pmName.textContent  = p.nombre || 'Artista';
  pmPhoto.src         = p.foto || 'placeholder.jpg';
  pmPhoto.alt         = `Foto de ${p.nombre || 'Artista'}`;
  pmRole.textContent  = p.rol || '';
  pmBio.textContent   = p.bio || '';
  pmTags.innerHTML    = '';
  (p.tags || []).forEach(t => {
    const s = document.createElement('span');
    s.className = 'chip';
    s.textContent = t;
    pmTags.appendChild(s);
  });
  pm.showModal();
}
pmClose?.addEventListener('click', () => pm?.close());
pm?.addEventListener('click', e => { if (e.target === pm) pm.close(); });

/* ───── Búsqueda (filtra menú + mosaico) ───── */
function applySearch() {
  const term = (q.value || '').trim().toLowerCase();
  const items = DATA.escenas.map(sc => {
    const inScene = [sc.titulo, sc.sentido, sc.musica].filter(Boolean).join(' ').toLowerCase().includes(term);
    const inCast = (sc.participantes || []).some(p =>
      [p.nombre, p.rol, ...(p.tags || [])].filter(Boolean).join(' ').toLowerCase().includes(term)
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
  if (localStorage.getItem('pmano.welcomed') === '1') return;
  welcome?.showModal();
}
wClose?.addEventListener('click', () => welcome?.close());
wStart?.addEventListener('click', () => {
  if (wDont?.checked) localStorage.setItem('pmano.welcomed','1');
  welcome?.close();
});

/* ───── Init ───── */
(async function init() {
  try {
    await loadData();
    renderMenu(DATA.escenas);
    renderTiles(DATA.escenas);
    renderCredits(DATA.creditos || DATA.info?.creditos);
    maybeShowWelcome();
  } catch (err) {
    console.error(err);
    // mensaje visible si el JSON falla
    const box = document.createElement('div');
    box.className = 'card wrap';
    box.innerHTML = `<div class="content"><b>No pudimos cargar <code>data.json</code>.</b><br>
    Asegúrate de que el archivo esté en la misma carpeta que <code>index.html</code> y que el JSON sea válido.</div>`;
    document.body.prepend(box);
  }
})();
