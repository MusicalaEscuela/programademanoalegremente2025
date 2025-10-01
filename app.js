/* ===========================
   Musicala · Programa de mano
   app.js
   =========================== */

'use strict';

/* ---------- Utilidad rápida ---------- */
const $ = (id) => document.getElementById(id);

/* ---------- Referencias DOM ---------- */
const sceneMenu     = $('sceneMenu');
const sceneTitle    = $('sceneTitle');
const sceneSubtitle = $('sceneSubtitle');
const sceneChips    = $('sceneChips');

const sceneIntro = $('sceneIntro');
const sceneSense = $('sceneSense');
const sceneMeta  = $('sceneMeta');
const sceneImage = $('sceneImage');

const sceneCast = $('sceneCast');
const castGrid  = $('castGrid');

const q    = $('q');
const main = $('main');

/* Modal Persona */
const pm      = $('personModal');
const pmName  = $('pmName');
const pmPhoto = $('pmPhoto');
const pmRole  = $('pmRole');
const pmBio   = $('pmBio');
const pmTags  = $('pmTags');
const pmClose = $('pmClose');

/* ---------- Estado ---------- */
let DATA = { info:{}, escenas:[] };
let activeId = null;

/* ---------- Funciones ---------- */

// Cargar data.json
async function loadData() {
  const res = await fetch('data.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`No se pudo cargar data.json (${res.status})`);
  DATA = await res.json();
}

// Pintar menú de escenas
function renderMenu(list) {
  sceneMenu.innerHTML = '';
  list.forEach((sc, i) => {
    const count = sc.participantes?.length || 0;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.id = sc.id;
    btn.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px">
        <span>${i + 1}. ${sc.titulo}</span>
        <span class="badge">${count} ${count === 1 ? 'artista' : 'artistas'}</span>
      </div>
    `;
    btn.addEventListener('click', () => selectScene(sc.id));
    sceneMenu.appendChild(btn);
  });
}

// Seleccionar escena
function selectScene(id) {
  activeId = id;
  document.querySelectorAll('.menu button')
    .forEach(b => b.classList.toggle('active', b.dataset.id === id));

  const sc = DATA.escenas.find(e => e.id === id);
  if (!sc) return;

  // Título y subtítulo
  sceneTitle.textContent = sc.titulo || 'Escena';
  sceneSubtitle.textContent = sc.musica
    ? `Música: ${sc.musica}${sc.ubicacionMusica ? ` · ${sc.ubicacionMusica}` : ''}`
    : '';

  // Chips de centros
  sceneChips.innerHTML = '';
  (sc.centros || []).forEach(c => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = c;
    sceneChips.appendChild(chip);
  });

  // Sentido e imagen
  sceneSense.textContent = sc.sentido || '';
  sceneImage.src = sc.imagen || 'placeholder.jpg';
  sceneImage.alt = sc.titulo ? `Imagen alusiva: ${sc.titulo}` : 'Imagen de la escena';
  sceneIntro.hidden = false;

  // Elenco
  castGrid.innerHTML = '';
  const cast = sc.participantes || [];
  if (!cast.length) {
    sceneCast.hidden = true;
  } else {
    cast.forEach(p => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'person';
      el.innerHTML = `
        <img src="${p.foto || 'placeholder.jpg'}" alt="Foto de ${p.nombre}">
        <div>
          <b>${p.nombre || 'Artista'}</b>
          <span class="role">${p.rol || ''}</span>
        </div>
      `;
      el.addEventListener('click', () => openPerson(p));
      castGrid.appendChild(el);
    });
    sceneCast.hidden = false;
  }

  // Foco para accesibilidad
  main.focus({ preventScroll: false });
}

// Abrir modal de persona
function openPerson(p) {
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

// Buscar escenas/personas
function applySearch() {
  const term = (q.value || '').trim().toLowerCase();
  const items = DATA.escenas.map(sc => {
    const inScene = (sc.titulo || '').toLowerCase().includes(term) ||
                    (sc.sentido || '').toLowerCase().includes(term) ||
                    (sc.musica || '').toLowerCase().includes(term);
    const inCast = (sc.participantes || []).some(p =>
      [p.nombre, p.rol, ...(p.tags || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
    return { sc, show: !term || inScene || inCast };
  }).filter(x => x.show).map(x => x.sc);

  renderMenu(items);
  if (items.length) {
    const keep = items.find(s => s.id === activeId) ? activeId : items[0].id;
    selectScene(keep);
  } else {
    sceneTitle.textContent = 'Sin resultados';
    sceneSubtitle.textContent = '';
    sceneIntro.hidden = true;
    sceneCast.hidden = true;
  }
}

/* ---------- Eventos ---------- */
pmClose.addEventListener('click', () => pm.close());
pm.addEventListener('click', (e) => { if (e.target === pm) pm.close(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && typeof pm.close === 'function') pm.close();
});

q.addEventListener('input', applySearch);

/* ---------- Inicio ---------- */
(async function init() {
  try {
    await loadData();
    renderMenu(DATA.escenas);
    if (DATA.escenas.length) selectScene(DATA.escenas[0].id);
  } catch (err) {
    console.error(err);
    sceneTitle.textContent = 'Error cargando el programa';
    sceneSubtitle.textContent = 'Revisa data.json';
  }
})();
