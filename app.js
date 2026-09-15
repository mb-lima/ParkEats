// ── Supabase config ───────────────────────────────────────────────────────────
const _a = atob;
const _b = [
  'aHR0cHM6Ly9wdnFuYmtpbHJhaGplc3R2cW1iaS5zdXBhYmFzZS5jbw==',
  'ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SnBjM01pT2lKemRYQmhZbUZ6WlNJc0luSmxaaUk2SW5CMmNXNWlhMmxzY21Gb2FtVnpkSFp4YldKcElpd2ljbTlzWlNJNkltRnViMjRpTENKcFlYUWlPakUzT0RrME1qTTFNaklzSW1WNGNDSTZNakV3TkRrNU9UVXlNbjAucUlEM21paFV0TWJLeWRjb1JYQUtxTTZmblJHRnFUU1B2ZVRabFotREd3TQ==',
];
const SUPABASE_URL = _a(_b[0]);
const SUPABASE_KEY = _a(_b[1]);

function sbFetch(path, options = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || '',
      ...(options.headers || {}),
    },
  });
}

// ── navigation ────────────────────────────────────────────────────────────────
const VIEWS = { home: 'viewHome', search: 'viewSearch', review: 'viewReview' };
let currentView = 'home';
let searchPlaceForReview = null;

function showView(name) {
  Object.values(VIEWS).forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById(VIEWS[name]).classList.add('active');
  currentView = name;
  document.getElementById('backBtn').classList.toggle('visible', name !== 'home');
  window.scrollTo(0, 0);
}

document.getElementById('backBtn').addEventListener('click', () => showView('home'));
document.getElementById('logoArea').addEventListener('click', () => showView('home'));
document.getElementById('btnSearch').addEventListener('click', () => showView('search'));
document.getElementById('btnReview').addEventListener('click', () => {
  searchPlaceForReview = null;
  setupReviewPlace(null);
  showView('review');
});

// ── single-select helper ──────────────────────────────────────────────────────
function singleSelect(containerSel, clickedEl) {
  document.querySelectorAll(`${containerSel} .chip, ${containerSel} .park-card`)
    .forEach(el => el.classList.remove('active'));
  clickedEl.classList.add('active');
}

// ── chip data ─────────────────────────────────────────────────────────────────
const CHIPS = {
  local: {
    pos: [
      { v: 'muitas_vagas',    label: 'Muitas vagas' },
      { v: 'vagas_espacosas', label: 'Vagas espaçosas' },
      { v: 'seguro',          label: 'Seguro' },
      { v: 'limpo',           label: 'Limpo' },
      { v: 'valet',           label: 'Valet' },
      { v: 'coberto',         label: 'Coberto' },
      { v: 'facil_manobrar',  label: 'Fácil de manobrar' },
    ],
    neg: [
      { v: 'poucas_vagas',     label: 'Poucas vagas' },
      { v: 'vagas_apertadas',  label: 'Vagas apertadas' },
      { v: 'inseguro',         label: 'Não me senti seguro' },
      { v: 'sujo',             label: 'Sujo' },
      { v: 'sem_cobertura',    label: 'Sem cobertura' },
      { v: 'dificil_manobrar', label: 'Difícil de manobrar' },
      { v: 'caro',             label: 'Caro' },
    ],
  },
  proximo: {
    pos: [
      { v: 'facil_encontrar', label: 'Fácil de encontrar' },
      { v: 'proximo',         label: 'Bem próximo' },
      { v: 'seguro',          label: 'Seguro' },
      { v: 'iluminado',       label: 'Bem iluminado' },
      { v: 'preco_justo',     label: 'Preço justo' },
      { v: 'vagas_espacosas', label: 'Vagas espaçosas' },
    ],
    neg: [
      { v: 'dificil_encontrar', label: 'Difícil de encontrar' },
      { v: 'longe',             label: 'Longe do restaurante' },
      { v: 'inseguro',          label: 'Não me senti seguro' },
      { v: 'pouca_iluminacao',  label: 'Mal iluminado' },
      { v: 'caro',              label: 'Caro' },
      { v: 'vagas_apertadas',   label: 'Vagas apertadas' },
    ],
  },
  rua: {
    pos: [
      { v: 'facil_vaga',    label: 'Fácil de encontrar vaga' },
      { v: 'vaga_proxima',  label: 'Vaga próxima' },
      { v: 'seguro',        label: 'Seguro' },
      { v: 'iluminado',     label: 'Bem iluminado' },
      { v: 'rua_tranquila', label: 'Rua tranquila' },
    ],
    neg: [
      { v: 'dificil_vaga',      label: 'Difícil de encontrar vaga' },
      { v: 'vaga_distante',     label: 'Vaga distante' },
      { v: 'inseguro',          label: 'Não me senti seguro' },
      { v: 'pouca_iluminacao',  label: 'Mal iluminado' },
      { v: 'rua_movimentada',   label: 'Rua muito movimentada' },
    ],
  },
};
const STAR_WORDS = { 1: 'Péssima', 2: 'Ruim', 3: 'Regular', 4: 'Bom', 5: 'Excelente' };
const MAX_CHIPS = 3;

let selectedParking = null;
let selectedRating  = null;
let selectedPeriod  = null;
let selectedPlaceRv = null;
let selectedChips   = [];

function chipsForContext(parking, rating) {
  if (!parking || !rating) return [];
  const s = CHIPS[parking];
  if (!s) return [];
  if (rating >= 4) return s.pos;
  if (rating <= 2) return s.neg;
  return [...s.pos, ...s.neg];
}

function renderChips() {
  const container = document.getElementById('dynamicChips');
  const section   = document.getElementById('chipsSection');
  const chips     = chipsForContext(selectedParking, selectedRating);
  if (!chips.length) { section.classList.remove('visible'); return; }
  selectedChips = [];
  container.innerHTML = '';
  chips.forEach(({ v, label }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.dataset.v = v;
    btn.textContent = label;
    btn.addEventListener('click', () => toggleChip(btn, v));
    container.appendChild(btn);
  });
  section.classList.add('visible');
}

function toggleChip(btn, v) {
  const isActive = btn.classList.contains('active');
  if (!isActive && selectedChips.length >= MAX_CHIPS) return;
  btn.classList.toggle('active');
  if (btn.classList.contains('active')) {
    selectedChips.push(v);
  } else {
    selectedChips = selectedChips.filter(c => c !== v);
  }
  const all = document.querySelectorAll('#dynamicChips .chip');
  const lim = selectedChips.length >= MAX_CHIPS;
  all.forEach(c => { if (!c.classList.contains('active')) c.disabled = lim; });
}

// ── review: parking cards ─────────────────────────────────────────────────────
document.getElementById('parkingCards').addEventListener('click', e => {
  const card = e.target.closest('.park-card');
  if (!card) return;
  singleSelect('#parkingCards', card);
  selectedParking = card.dataset.v;
  document.getElementById('distField').classList.toggle('visible', selectedParking === 'proximo');
  renderChips();
});

// ── review: stars ─────────────────────────────────────────────────────────────
document.querySelectorAll('.star-rating input').forEach(input => {
  input.addEventListener('change', () => {
    selectedRating = parseInt(input.value);
    const w = document.getElementById('starWord');
    w.textContent = STAR_WORDS[selectedRating];
    w.style.color = selectedRating >= 4 ? 'var(--curb-green)'
                  : selectedRating <= 2 ? 'var(--curb-red)'
                  : '#8a8f80';
    renderChips();
  });
});

// ── review: period chips ──────────────────────────────────────────────────────
document.getElementById('periodChips').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  singleSelect('#periodChips', chip);
  selectedPeriod = chip.dataset.v;
});

// ── review: place search ──────────────────────────────────────────────────────
let reviewAutoEl = null;

function setupReviewPlace(prefilled) {
  const preBox = document.getElementById('prefilledPlace');
  const sfWrap = document.getElementById('searchFieldWrap');
  const selBox = document.getElementById('selectedPlaceBox');
  if (prefilled) {
    selectedPlaceRv = prefilled;
    document.getElementById('prefilledName').textContent = prefilled.name;
    document.getElementById('prefilledAddr').textContent = prefilled.address || '';
    preBox.style.display = 'flex';
    sfWrap.style.display = 'none';
    selBox.style.display = 'none';
  } else {
    selectedPlaceRv = null;
    preBox.style.display = 'none';
    sfWrap.style.display = 'block';
    selBox.style.display = 'none';
    if (reviewAutoEl && reviewAutoEl.value !== undefined) reviewAutoEl.value = '';
  }
}

document.getElementById('clearPrefilledBtn').addEventListener('click', () => setupReviewPlace(null));
document.getElementById('changePlaceBtn').addEventListener('click', () => {
  selectedPlaceRv = null;
  document.getElementById('selectedPlaceBox').style.display = 'none';
  document.getElementById('searchFieldWrap').style.display = 'block';
  if (reviewAutoEl && reviewAutoEl.value !== undefined) reviewAutoEl.value = '';
});

function selectPlaceRv(name, address) {
  selectedPlaceRv = { name, address };
  document.getElementById('selectedPlaceName').textContent = name;
  document.getElementById('selectedPlaceAddr').textContent = address || '';
  document.getElementById('selectedPlaceBox').style.display = 'flex';
  document.getElementById('searchFieldWrap').style.display = 'none';
}

// ── review: submit ────────────────────────────────────────────────────────────
document.getElementById('reviewForm').addEventListener('submit', async e => {
  e.preventDefault();
  const status = document.getElementById('reviewStatus');
  const btn    = document.getElementById('reviewBtn');
  if (!selectedPlaceRv) {
    status.textContent = 'Preencha o restaurante.';
    status.className = 'status-msg err';
    return;
  }
  if (!selectedRating) {
    status.textContent = 'Dê uma nota (as estrelas).';
    status.className = 'status-msg err';
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  const payload = {
    restaurante:         selectedPlaceRv.name,
    endereco:            selectedPlaceRv.address,
    nota_geral:          selectedRating,
    tipo_estacionamento: selectedParking,
    distancia:           selectedParking === 'proximo' ? document.getElementById('rDist').value.trim() : '',
    atributos:           selectedChips.join(', '),
    horario:             selectedPeriod,
    nome:                document.getElementById('rAuthor').value.trim(),
    comentario:          document.getElementById('rComment').value.trim(),
  };
  try {
    const r = await sbFetch('avaliacoes', {
      method: 'POST',
      prefer: 'return=minimal',
      body: JSON.stringify(payload),
    });
    if (r.ok || r.status === 201) {
      status.textContent = 'Valeu! Sua avaliação foi enviada.';
      status.className = 'status-msg ok';
      document.getElementById('reviewForm').reset();
      selectedParking = null; selectedRating = null; selectedPeriod = null;
      selectedPlaceRv = null; selectedChips = [];
      setupReviewPlace(null);
      document.getElementById('distField').classList.remove('visible');
      document.getElementById('chipsSection').classList.remove('visible');
      document.getElementById('starWord').textContent = '';
      document.querySelectorAll('#parkingCards .park-card, #periodChips .chip')
        .forEach(b => b.classList.remove('active'));
    } else {
      const err = await r.json().catch(() => ({}));
      console.error('Supabase error', err);
      throw new Error();
    }
  } catch {
    status.textContent = 'Não deu pra enviar agora, tenta de novo.';
    status.className = 'status-msg err';
  }
  btn.disabled = false;
  btn.textContent = 'Enviar avaliação';
});

// ── search results ────────────────────────────────────────────────────────────
let searchedPlace      = null;
let searchAutoEl       = null;

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}

async function showResults(name, address) {
  const area = document.getElementById('resultsArea');
  area.innerHTML = '<div style="color:var(--ink-dim);font-size:14px;padding:32px 0;text-align:center;">Buscando avaliações...</div>';
  try {
    const r    = await sbFetch(`avaliacoes?restaurante=ilike.*${encodeURIComponent(name)}*&order=created_at.desc`);
    const rows = await r.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      area.innerHTML = `<div class="place-result">
        <div class="place-result-header">
          <div class="pr-name">${esc(name)}</div>
          <div class="pr-addr">${esc(address)}</div>
        </div>
        <div class="no-reviews-card">
          <div class="nr-icon">🅿️</div>
          <div class="nr-title">Nenhuma avaliação ainda</div>
          <div class="nr-sub">Seja o primeiro a contar como foi estacionar aqui.</div>
          <button class="nr-cta" id="reviewFromSearchBtn">+ Avaliar este lugar</button>
        </div>
      </div>`;
    } else {
      area.innerHTML = buildResultCard(name, address, rows);
    }
  } catch (e) {
    area.innerHTML = '<div style="color:var(--curb-red);font-size:13px;padding:16px 0;">Erro ao buscar avaliações. Tente novamente.</div>';
  }
  const btn = document.getElementById('reviewFromSearchBtn');
  if (btn) btn.addEventListener('click', () => {
    searchPlaceForReview = { name, address };
    setupReviewPlace({ name, address });
    showView('review');
  });
}

function buildResultCard(name, address, rows) {
  const total    = rows.length;
  const avgScore = rows.reduce((s, r) => s + (r.nota_geral || 0), 0) / total;

  // Pontuação ponderada: nota 5=100%, 4=75%, 3=50%, 2=25%, 1=0%
  const NOTE_WEIGHT = { 5: 1.0, 4: 0.75, 3: 0.5, 2: 0.25, 1: 0 };
  const typeCounts  = { local: 0, proximo: 0, rua: 0 };
  const typeScore   = { local: 0, proximo: 0, rua: 0 };
  rows.forEach(r => {
    const t = r.tipo_estacionamento;
    if (t && typeCounts[t] !== undefined) {
      typeCounts[t]++;
      typeScore[t] += NOTE_WEIGHT[r.nota_geral] ?? 0;
    }
  });

  const attrCount = {};
  rows.forEach(r => {
    if (r.atributos) r.atributos.split(',').forEach(a => {
      const k = a.trim();
      if (k) attrCount[k] = (attrCount[k] || 0) + 1;
    });
  });
  const topAttrs = Object.entries(attrCount).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const starsHtml = n => n > 0
    ? '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n))
    : '☆☆☆☆☆';

  function pctClass(p) { return p >= 70 ? 'good' : p >= 50 ? 'mid' : 'bad'; }

  let typesHtml = '';
  [
    ['local',   '🅿️', 'No local',                'Estacionamento próprio'],
    ['proximo', '🏢', 'Estacionamento próximo',  'A poucos minutos a pé'],
    ['rua',     '🛣️', 'Na rua',                  'Vaga em via pública'],
  ].forEach(([k, icon, label, sub]) => {
    if (typeCounts[k] === 0) return;
    const pct = Math.round((typeScore[k] / typeCounts[k]) * 100);
    typesHtml += `<div class="pr-type-row">
      <span class="pr-type-icon">${icon}</span>
      <div class="pr-type-body">
        <div class="pr-type-name">${label}</div>
        <div class="pr-type-sub">${sub} · ${typeCounts[k]} avaliação(ões)</div>
      </div>
      <span class="pr-type-pct ${pctClass(pct)}">${pct}% recomendam</span>
    </div>`;
  });
  if (!typesHtml) typesHtml = '<div class="pr-type-row" style="color:var(--ink-dim);font-size:13px;">Sem dados de tipo.</div>';

  const attrsHtml = topAttrs
    .map(([k, n]) => `<span class="pr-attr pos">${esc(k)} <span style="opacity:0.6;font-size:11px;">${n}x</span></span>`)
    .join('');

  const reviewsHtml = rows.slice(0, 5).map(r => {
    const initial   = (r.nome || '?')[0].toUpperCase();
    const tone      = r.nota_geral >= 4 ? 'g' : r.nota_geral <= 2 ? 'r' : 'y';
    const chips     = r.atributos
      ? r.atributos.split(',').map(a => `<span class="pr-rev-chip">${esc(a.trim())}</span>`).join('')
      : '';
    const parkLabel = { local: 'No local', proximo: 'Próximo', rua: 'Na rua' }[r.tipo_estacionamento] || '';
    return `<div class="pr-review-item">
      <div class="pr-rev-badge ${tone}">${esc(initial)}</div>
      <div>
        <div class="pr-rev-meta">${starsHtml(r.nota_geral)}${parkLabel ? ' · ' + parkLabel : ''}${r.horario ? ' · ' + r.horario : ''}</div>
        ${chips ? `<div class="pr-rev-chips">${chips}</div>` : ''}
        ${r.comentario ? `<div class="pr-rev-comment">${esc(r.comentario)}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  return `<div class="place-result">
    <div class="place-result-header">
      <div class="pr-name">${esc(name)}</div>
      <div class="pr-addr">${esc(address)}</div>
      <div class="pr-overall">
        <span class="pr-score">${avgScore.toFixed(1)}</span>
        <span class="pr-stars">${starsHtml(avgScore)}</span>
        <span class="pr-count">${total} avaliação(ões)</span>
      </div>
    </div>
    <div class="pr-types">${typesHtml}</div>
    ${attrsHtml ? `<div class="pr-attrs"><div class="pr-attrs-title">Mais mencionado</div><div class="pr-attr-list">${attrsHtml}</div></div>` : ''}
    <div class="pr-reviews"><div class="pr-rev-title">Avaliações recentes</div>${reviewsHtml}</div>
  </div>
  <div style="margin-top:14px;text-align:center;">
    <button class="nr-cta" id="reviewFromSearchBtn">+ Adicionar minha avaliação</button>
  </div>`;
}

// ── Google Places init ────────────────────────────────────────────────────────
async function initAutocomplete() {
  const { PlaceAutocompleteElement } = await google.maps.importLibrary('places');

  // Patch the inner input of a PlaceAutocompleteElement so iOS/Android don't
  // trigger their fullscreen search UI. We wait for the shadow DOM to render,
  // then set enterkeyhint and a fixed position on focus to prevent the page
  // from scrolling the element off-screen when the keyboard opens.
  function patchMobileInput(el) {
    const tryPatch = () => {
      const input = el.shadowRoot && el.shadowRoot.querySelector('input');
      if (!input) return false;
      input.setAttribute('enterkeyhint', 'search');
      // On focus: scroll to top so the sticky header stays visible
      input.addEventListener('focus', () => {
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' }), 100);
      });
      return true;
    };
    if (!tryPatch()) {
      const t = setInterval(() => { if (tryPatch()) clearInterval(t); }, 50);
    }
  }

  // Search view
  searchAutoEl = new PlaceAutocompleteElement();
  searchAutoEl.style.width = '100%';
  searchAutoEl.style.colorScheme = 'dark';
  document.getElementById('searchAutoWrap').appendChild(searchAutoEl);
  patchMobileInput(searchAutoEl);

  searchAutoEl.addEventListener('gmp-select', async event => {
    const place = event.placePrediction.toPlace();
    await place.fetchFields({ fields: ['displayName', 'formattedAddress'] });
    searchedPlace = { name: place.displayName, address: place.formattedAddress || '' };
    showResults(searchedPlace.name, searchedPlace.address);
  });

  // Poll to detect when user clears the input
  setInterval(() => {
    const inner = searchAutoEl.shadowRoot && searchAutoEl.shadowRoot.querySelector('input');
    const val = inner ? inner.value : (searchAutoEl.value || '');
    if (searchedPlace && val.trim() === '') {
      searchedPlace = null;
      document.getElementById('resultsArea').innerHTML = '';
    }
  }, 300);

  // Review view
  reviewAutoEl = new PlaceAutocompleteElement();
  reviewAutoEl.style.width = '100%';
  reviewAutoEl.style.colorScheme = 'light';
  document.getElementById('reviewAutoWrap').appendChild(reviewAutoEl);
  patchMobileInput(reviewAutoEl);

  reviewAutoEl.addEventListener('gmp-select', async event => {
    const place = event.placePrediction.toPlace();
    await place.fetchFields({ fields: ['displayName', 'formattedAddress'] });
    selectPlaceRv(place.displayName, place.formattedAddress || '');
  });
}
