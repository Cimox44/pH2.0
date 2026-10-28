/* EGA Analyzer — interfaccia */
(function () {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const C = window.EGA_CONTENT, E = window.EGA;
const fmt = (x, d = 1) => (x == null || !isFinite(x)) ? '—' : Number(x).toFixed(d).replace('.', ',');
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem('ega.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('ega.' + k, JSON.stringify(v)); } catch (e) { /* storage non disponibile */ } }
};

// ---------- Tema ----------
function applyTheme(t) { if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); }
let theme = store.get('theme', 'auto'); applyTheme(theme);
$('#themeBtn').addEventListener('click', () => {
  theme = theme === 'auto' ? 'dark' : theme === 'dark' ? 'light' : 'auto';
  applyTheme(theme); store.set('theme', theme); toast('Tema: ' + ({ auto: 'automatico', dark: 'scuro', light: 'chiaro' }[theme]));
});

// ---------- Tabs ----------
function showTab(t) {
  $$('.tab').forEach(s => s.classList.toggle('active', s.id === 'tab-' + t));
  $$('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
  window.scrollTo(0, 0);
}
$$('.tabs button').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));

function toast(msg) {
  $$('.toast').forEach(x => x.remove());
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
}

// ---------- Form ----------
const form = $('#f');
const units = () => ({
  p: form.uP.value, a: form.uA.value, g: form.uG.value, u: form.uU.value
});
function updateUnitLabels() {
  const u = units();
  $$('.u.p').forEach(e => e.textContent = u.p);
  $$('.u.a').forEach(e => e.textContent = u.a === 'gl' ? 'g/L' : 'g/dL');
  $$('.u.g').forEach(e => e.textContent = u.g === 'mmol' ? 'mmol/L' : 'mg/dL');
  $('.ulab').textContent = u.u === 'bun' ? 'BUN' : 'Urea (azotemia)';
}
const NUMS = ['pH', 'pco2', 'hco3', 'be', 'po2', 'fio2', 'spo2', 'sao2', 'lac', 'hb', 'na', 'k', 'cl', 'alb', 'ica', 'mg', 'phos', 'agNormal', 'glu', 'urea', 'osmMeas', 'etoh', 'uNa', 'uK', 'uCl', 'age', 'height', 'weight', 'patm', 'peep', 'map', 'etco2', 've', 'pco2Target', 'hco3Target', 'pcvco2', 'scvo2'];
const num = (v) => { if (v === '' || v == null) return null; const x = parseFloat(String(v).replace(',', '.')); return isFinite(x) ? x : null; };

function readInputs() {
  const u = units(), I = {};
  NUMS.forEach(n => { I[n] = num(form[n].value); });
  I.chronicity = form.chronicity.value; I.sex = form.sex.value; I.useK = form.useK.checked;
  I.sample = form.sample.value; I.oxSupport = form.oxSupport.value;
  if (u.p === 'kPa') ['pco2', 'po2', 'etco2', 'pco2Target', 'pcvco2'].forEach(k => { if (I[k] != null) I[k] = I[k] * E.kPa2mmHg; });
  if (u.a === 'gl' && I.alb != null) I.alb = I.alb / 10;
  if (u.g === 'mmol' && I.glu != null) I.glu = I.glu * 18.016;
  if (u.u === 'bun') { I.bun = I.urea; I.urea = null; }
  return I;
}
function saveForm() {
  const s = {};
  NUMS.forEach(n => s[n] = form[n].value);
  s.chronicity = form.chronicity.value; s.sex = form.sex.value; s.useK = form.useK.checked; s.sample = form.sample.value; s.oxSupport = form.oxSupport.value;
  s.uP = form.uP.value; s.uA = form.uA.value; s.uG = form.uG.value; s.uU = form.uU.value;
  store.set('form', s);
}
function loadForm(s) {
  if (!s) return;
  NUMS.forEach(n => { if (s[n] != null) form[n].value = s[n]; });
  if (s.chronicity) form.chronicity.value = s.chronicity;
  if (s.sex != null) form.sex.value = s.sex;
  if (s.sample) form.sample.value = s.sample;
  if (s.oxSupport != null) form.oxSupport.value = s.oxSupport;
  form.useK.checked = !!s.useK;
  ['uP', 'uA', 'uG', 'uU'].forEach(k => { if (s[k]) form[k].value = s[k]; });
  updateUnitLabels();
}
function resetForm() {
  form.reset(); updateUnitLabels(); store.set('form', null); compute();
}

// Esempi
const sel = $('#caseSel');
E.CASES.forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = c.id + ' · ' + c.name; sel.appendChild(o); });
sel.addEventListener('change', () => {
  const c = E.CASES.find(x => x.id === sel.value); if (!c) return;
  form.reset(); form.uP.value = 'mmHg'; form.uA.value = 'gdl'; form.uG.value = 'mg'; form.uU.value = 'urea';
  Object.entries(c.input).forEach(([k, v]) => {
    if (k === 'chronicity') form.chronicity.value = v;
    else if (form[k]) form[k].value = String(v);
  });
  updateUnitLabels(); compute(); sel.value = '';
  toast('Caso caricato: ' + c.name);
  $('#results').scrollIntoView({ behavior: 'smooth' });
});
$('#resetBtn').addEventListener('click', resetForm);

let tmr = null;
form.addEventListener('input', () => { updateUnitLabels(); clearTimeout(tmr); tmr = setTimeout(compute, 220); });
form.addEventListener('change', () => { updateUnitLabels(); compute(); });

// ---------- Mappa acido-base ----------
function acidBaseMap(pt) {
  const W = 360, H = 300, x0 = 42, x1 = 350, y0 = 12, y1 = 266;
  const X = p => x0 + (p - 10) / 90 * (x1 - x0), Y = h => y1 - h / 50 * (y1 - y0);
  const poly = (pts) => pts.map(([p, h]) => `${X(p).toFixed(1)},${Y(h).toFixed(1)}`).join(' ');
  const bandH = (from, to, f, tol) => { const up = [], dn = []; for (let p = from; p <= to + 1e-9; p += 1) { up.push([p, Math.min(50, f(p) + tol)]); dn.unshift([p, Math.max(0, f(p) - tol)]); } return poly(up.concat(dn)); };
  const bandP = (from, to, g, tol) => { const a = [], b = []; for (let h = from; h <= to + 1e-9; h += 0.5) { a.push([Math.min(100, g(h) + tol), h]); b.unshift([Math.max(10, g(h) - tol), h]); } return poly(a.concat(b)); };
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Mappa acido-base PaCO2 versus HCO3">`;
  s += `<style>.ax{stroke:var(--mut);stroke-width:1}.gr{stroke:var(--line);stroke-width:.6}.tx{fill:var(--mut);font:9px system-ui}.iso{stroke:var(--mut);stroke-width:.6;stroke-dasharray:3 3;fill:none}.ba{fill:var(--acid);opacity:.18}.bk{fill:var(--alk);opacity:.18}.bl{fill:var(--ink);font:600 8.5px system-ui}</style>`;
  for (let p = 10; p <= 100; p += 10) s += `<line class="gr" x1="${X(p)}" y1="${y0}" x2="${X(p)}" y2="${y1}"/><text class="tx" x="${X(p)}" y="${y1 + 12}" text-anchor="middle">${p}</text>`;
  for (let h = 0; h <= 50; h += 10) s += `<line class="gr" x1="${x0}" y1="${Y(h)}" x2="${x1}" y2="${Y(h)}"/><text class="tx" x="${x0 - 5}" y="${Y(h) + 3}" text-anchor="end">${h}</text>`;
  s += `<line class="ax" x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}"/><line class="ax" x1="${x0}" y1="${y0}" x2="${x0}" y2="${y1}"/>`;
  s += `<text class="tx" x="${(x0 + x1) / 2}" y="${H - 4}" text-anchor="middle">PaCO₂ (mmHg)</text><text class="tx" transform="translate(10 ${(y0 + y1) / 2}) rotate(-90)" text-anchor="middle">HCO₃⁻ (mmol/L)</text>`;
  // isopleths pH
  [7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7].forEach(ph => {
    const pts = []; let last = null;
    for (let p = 10; p <= 100; p += 1) { const h = 0.0307 * p * Math.pow(10, ph - 6.1); if (h > 50) break; pts.push([p, h]); last = [p, h]; }
    if (pts.length > 1) { s += `<polyline class="iso" points="${poly(pts)}"/>`; const atTop = last[1] > 47 && X(last[0]) < x1 - 38; s += `<text class="tx" x="${atTop ? X(last[0]) + 2 : x1 - 2}" y="${atTop ? Y(last[1]) - 2 : Y(last[1]) - 3}" text-anchor="${atTop ? 'start' : 'end'}">pH ${ph.toFixed(1)}</text>`; }
  });
  // bande
  s += `<polygon class="ba" points="${bandP(4, 24, h => 1.5 * h + 8, 2)}"/>`;
  s += `<polygon class="bk" points="${bandP(24, 45, h => 0.7 * h + 20, 5)}"/>`;
  s += `<polygon class="ba" points="${bandH(40, 90, p => 24 + 0.1 * (p - 40), 2)}"/>`;
  s += `<polygon class="ba" points="${bandH(40, 90, p => Math.min(45, 24 + 0.35 * (p - 40)), 2)}"/>`;
  s += `<polygon class="bk" points="${bandH(15, 40, p => 24 - 0.2 * (40 - p), 2)}"/>`;
  s += `<polygon class="bk" points="${bandH(15, 40, p => 24 - 0.4 * (40 - p), 2)}"/>`;
  s += `<rect x="${X(35)}" y="${Y(26)}" width="${X(45) - X(35)}" height="${Y(22) - Y(26)}" fill="var(--ok)" opacity=".35"/>`;
  const mk = (n, p, hh) => `<circle cx="${X(p)}" cy="${Y(hh)}" r="7" fill="var(--card)" stroke="var(--mut)"/><text class="bl" x="${X(p)}" y="${Y(hh) + 3}" text-anchor="middle">${n}</text>`;
  s += mk(1, 13, 3) + mk(2, 53, 47.5) + mk(3, 93, 29) + mk(4, 93, 45.5) + mk(5, 12.5, 19) + mk(6, 12.5, 13);
  if (pt && pt.p >= 10 && pt.p <= 100 && pt.h >= 0 && pt.h <= 50) {
    s += `<circle cx="${X(pt.p)}" cy="${Y(pt.h)}" r="6.5" fill="var(--ink)" stroke="var(--card)" stroke-width="2"/>`;
    s += `<text class="bl" x="${X(pt.p) + 9}" y="${Y(pt.h) - 7}">Paziente</text>`;
  }
  return s + '</svg>';
}

// ---------- Rendering risultati ----------
function kpi(k, v, s, cls) { return `<div class="kpi"><div class="k">${k}</div><div class="v ${cls || ''}">${v}</div><div class="s">${s || ''}</div></div>`; }
function rng(x, lo, hi) { if (x == null) return ''; return x < lo ? 'lo' : x > hi ? 'hi' : ''; }
function table(head, rows) { return C.T(head, rows); }
const vcls = v => /appropriato/.test(v) ? 'v-ok' : /intermedio/.test(v) ? 'v-mid' : 'v-bad';

let lastRes = null, lastIn = null;
function compute() {
  saveForm();
  const I = readInputs(); lastIn = I;
  const box = $('#results');
  if (I.pH == null && I.pco2 == null) { box.innerHTML = `<div class="card empty">Inserisci almeno <b>pH</b> e <b>PaCO₂</b> (HCO₃⁻ viene calcolato se assente), oppure carica un caso esempio.</div>`; lastRes = null; return; }
  const R = E.analyze(I); lastRes = R;
  if (!R.ok) { box.innerHTML = R.errors.map(e => `<div class="alert err">${esc(e)}</div>`).join(''); return; }
  let h = '';
  const cls = R.phStatus === 'acidemia' ? 'acid' : R.phStatus === 'alcalemia' ? 'alk' : (R.disorders.length ? '' : 'norm');
  h += `<div class="card dx ${cls}"><div class="lbl">Diagnosi integrata</div><div class="main">${esc(R.diagnosis)}</div>`;
  h += `<div class="chips"><span class="chip ${cls}">${R.phStatus.toUpperCase()}${R.phSeverity !== 'normale' ? ' · ' + R.phSeverity : ''}</span>`;
  R.disorders.forEach(d => h += `<span class="chip ${/^(MA|RA)$/.test(d.code) ? 'acid' : 'alk'}">${esc(d.label)} — ${esc(d.detail)}</span>`);
  if (R.compStatus) h += `<span class="chip">Compenso: ${esc(R.compStatus)}</span>`;
  h += `</div></div>`;
  R.errors.forEach(e => h += `<div class="alert err">${esc(e)}</div>`);
  R.actions.forEach(e => h += `<div class="alert act">⚠ ${esc(e)}</div>`);
  R.warnings.forEach(e => h += `<div class="alert warn">${esc(e)}</div>`);

  // KPI
  const v = R.v;
  h += `<div class="kpis">`;
  h += kpi('pH', fmt(I.pH, 2), '[H⁺] ' + fmt(v.H, 1) + ' nmol/L', I.pH < 7.35 ? 'hi' : I.pH > 7.45 ? 'lo' : '');
  h += kpi('PaCO₂', fmt(I.pco2, 1), 'mmHg' + (form.uP.value === 'kPa' ? ' (da kPa)' : ''), rng(I.pco2, 35, 45) === 'hi' ? 'hi' : rng(I.pco2, 35, 45) === 'lo' ? 'lo' : '');
  h += kpi('HCO₃⁻', fmt(v.hco3, 1), v.hco3Source === 'misurato/refertato' ? 'calc. H-H ' + fmt(v.hco3Calc, 1) : 'calcolato H-H', v.hco3 < 22 ? 'hi' : v.hco3 > 26 ? 'lo' : '');
  h += kpi('SBE', (v.sbe > 0 ? '+' : '') + fmt(v.sbe, 1), v.sbeSource, v.sbe < -2 ? 'hi' : v.sbe > 2 ? 'lo' : '');
  if (R.ag) h += kpi(R.ag.agc != null ? 'AG corretto' : 'Gap anionico', fmt(R.ag.use, 1), (R.ag.agc != null ? 'AG grezzo ' + fmt(R.ag.ag, 1) + ' · ' : '') + R.ag.status, R.ag.status === 'elevato' ? 'hi' : '');
  if (R.delta && R.delta.ratio != null) h += kpi('Δ/Δ', fmt(R.delta.ratio, 2), 'ΔAG ' + fmt(R.delta.dAG, 1) + ' / ΔHCO₃⁻ ' + fmt(R.delta.dHCO3, 1));
  if (R.oxy && R.oxy.pf != null) h += kpi('P/F', fmt(R.oxy.pf, 0), (/NON intubato/.test(R.oxy.pfClass) ? 'criterio ARDS non intubato' : R.oxy.pfClass.split(/ \(| —/)[0]), R.oxy.pf <= 300 ? 'hi' : '');
  if (R.oxy && R.oxy.aa != null) h += kpi('Gradiente A-a', fmt(R.oxy.aa, 1), 'PAO₂ ' + fmt(R.oxy.PAO2, 1) + ' mmHg');
  if (R.lac) h += kpi('Lattati', fmt(R.lac.value, 1), 'mmol/L', R.lac.value > 2 ? 'hi' : '');
  h += `</div>`;

  // Step 1-3
  h += `<div class="card"><h3><span class="n">1</span>pH e coerenza del campione</h3>`;
  h += table(['Verifica', 'Risultato'], [
    ['pH', `${fmt(I.pH, 2)} → <b>${R.phStatus}</b>${R.phSeverity !== 'normale' ? ' (' + R.phSeverity + ')' : ''}`],
    ['[H⁺] da pH / da Henderson', `${fmt(v.H, 1)} / ${fmt(v.HHenderson, 1)} nmol/L`],
    ['HCO₃⁻ calcolato (H-H)', `${fmt(v.hco3Calc, 1)} mmol/L` + (v.consistency ? ` — <b class="${v.consistency === 'coerente' ? 'v-ok' : 'v-bad'}">${v.consistency}</b> (Δ ${fmt(v.hco3Diff, 1)})` : ' (usato per i calcoli)')]
  ]);
  h += `</div>`;

  h += `<div class="card"><h3><span class="n">2</span>Disturbo primario</h3><p><b>${R.primary.length ? R.primary.map(c => ({ MA: 'Acidosi metabolica', MAlk: 'Alcalosi metabolica', RA: 'Acidosi respiratoria', RAlk: 'Alcalosi respiratoria' })[c]).join(' + ') : 'Nessuno'}</b></p>${R.primaryNote ? `<p class="mut">${esc(R.primaryNote)}</p>` : ''}</div>`;

  h += `<div class="card"><h3><span class="n">3</span>Compenso</h3>`;
  if (R.compStatus) h += `<p>Classificazione: <b>${esc(R.compStatus)}</b>${R.respAcuity ? ' · forma respiratoria: <b>' + esc(R.respAcuity) + '</b>' : ''}</p>`;
  if (R.compChecks.length) {
    R.compChecks.forEach(c => {
      const rows = [['Regola', c.rule],
        ['Atteso', `<span class="num">${typeof c.expected === 'number' ? fmt(c.expected, 1) : esc(c.expected)} ${c.unit}</span>` + (c.acute != null ? `<br><span class="mut">acuta ${fmt(c.acute, 1)} · cronica ${fmt(c.chronic, 1)}</span>` : '')],
        ['Range accettabile', `<span class="num">${fmt(c.lo, 1)} – ${fmt(c.hi, 1)} ${c.unit}</span>`],
        [c.variable + ' misurato', `<span class="num"><b>${fmt(c.actual, 1)}</b> ${c.unit}</span>`],
        ['Esito', `<span class="${vcls(c.verdict)}">${esc(c.verdict)}</span>`]];
      h += table(['Verifica del compenso', ''], rows);
    });
    R.compChecks.forEach(c => { h += `<p>${esc(c.text)}</p>`; if (c.alt) h += `<p class="mut">${esc(c.alt)}</p>`; });
  } else if (!R.primary.length) h += `<p class="mut">Nessun disturbo primario: compenso non applicabile.</p>`;
  h += `</div>`;

  // Step 4 AG
  h += `<div class="card"><h3><span class="n">4</span>Gap anionico e delta gap</h3>`;
  if (R.ag) {
    const rows = [
      ['AG = Na⁺ ' + (R.ag.withK ? '+ K⁺ ' : '') + '− (Cl⁻ + HCO₃⁻)', `<span class="num">${fmt(R.ag.ag, 1)}</span>`, `normale ${R.ag.normal} ± 2`],
      ['AG corretto per albumina', `<span class="num">${fmt(R.ag.agc, 1)}</span>`, R.ag.agc == null ? 'inserire albumina' : '+2,5 per g/dL < 4,0'],
      ['Stato AG', `<b>${R.ag.status}</b>`, R.ag.masked ? '<b class="v-bad">HAGMA mascherata</b>' : '']
    ];
    if (R.delta) {
      rows.push(['ΔAG (AG − ' + R.ag.normal + ')', `<span class="num">${fmt(R.delta.dAG, 1)}</span>`, '']);
      rows.push([`ΔHCO₃⁻ (${fmt(R.delta.base, 1)} − HCO₃⁻)`, `<span class="num">${fmt(R.delta.dHCO3, 1)}</span>`, R.delta.baseNote ? esc(R.delta.baseNote) : 'base 24']);
      if (R.delta.ratio != null) rows.push(['Delta ratio Δ/Δ', `<span class="num"><b>${fmt(R.delta.ratio, 2)}</b></span>`, '&lt;0,4 · 0,4–0,8 · 0,8–2 · &gt;2']);
      rows.push(['HCO₃⁻ corretto (HCO₃⁻ + ΔAG)', `<span class="num">${fmt(R.delta.corrHCO3, 1)}</span>`, `${fmt(R.delta.base - 2, 0)}–${fmt(R.delta.base + 2, 0)}`]);
    }
    h += table(['Parametro', 'Valore', 'Riferimento'], rows);
    if (R.delta && R.delta.interp) h += `<p><b>Interpretazione:</b> ${esc(R.delta.interp)}</p>`;
    if (R.delta && R.delta.corrInterp) h += `<p class="mut">${esc(R.delta.corrInterp)}</p>`;
    if (R.delta && R.delta.naNote) h += `<p class="mut">${esc(R.delta.naNote)}</p>`;
  } else h += `<p class="mut">Inserire Na⁺ e Cl⁻ (e albumina) per gap anionico, delta gap e classificazione dell'acidosi metabolica.</p>`;
  R.notes.forEach(n => h += `<div class="alert note">${esc(n)}</div>`);
  h += `</div>`;

  // Step 5 approfondimenti
  const extra = [];
  if (R.osm) extra.push(['Osmolalità calcolata', `${fmt(R.osm.calc, 1)} mOsm/kg (BUN ${fmt(R.osm.bun, 1)})`]);
  if (R.osm && R.osm.gap != null) extra.push(['Gap osmolare', `<b>${fmt(R.osm.gap, 1)}</b> — ${esc(R.osm.interp)}`]);
  if (R.naCorr) extra.push(['Na⁺ corretto per glicemia', `Katz ${fmt(R.naCorr.katz, 1)} · Hillier ${fmt(R.naCorr.hillier, 1)} mmol/L`]);
  if (R.uag) extra.push(['Gap anionico urinario', `<b>${fmt(R.uag.value, 1)}</b> — ${esc(R.uag.interp)}<br><span class="mut">${esc(R.uag.caveat)}</span>`]);
  if (R.uCl) extra.push(['Cl⁻ urinario', `${fmt(R.uCl.value, 0)} mmol/L — ${esc(R.uCl.interp)}`]);
  if (R.lac) extra.push(['Lattati', `${fmt(R.lac.value, 1)} mmol/L — ${esc(R.lac.interp)}`]);
  if (extra.length) h += `<div class="card"><h3><span class="n">5</span>Approfondimenti metabolici</h3>${table(['Indice', 'Risultato'], extra)}</div>`;

  // Stewart
  if (R.stewart) {
    const st = R.stewart, rows = [
      ['Na⁺ − Cl⁻', fmt(st.naCl, 1), '32–40'],
      ['Effetto Na–Cl sul BE (Story)', fmt(st.beNaCl, 1), '≈ 0'],
      ['Effetto albumina sul BE', (st.beAlb > 0 ? '+' : '') + fmt(st.beAlb, 1), '≈ 0'],
      ['Anioni non misurati (incl. lattato)', fmt(st.beUA, 1), '≈ 0'],
      ['Carica albumina (A⁻)', fmt(st.albCharge, 1), '~ 12']
    ];
    if (st.sida != null) { rows.push(['SID apparente', fmt(st.sida, 1), '40–42']); rows.push(['SID effettivo' + (st.phosAssumed ? ' (fosfato non inserito)' : ''), fmt(st.side, 1), '38–40']); rows.push(['Strong Ion Gap (SIG)', `<b>${fmt(st.sig, 1)}</b>`, '0 ± 2']); }
    h += `<div class="card"><h3><span class="n">6</span>Approccio fisico-chimico (Stewart / Fencl–Figge)</h3>${table(['Parametro', 'Valore', 'Riferimento'], rows.map(r => [r[0], `<span class="num">${r[1]}</span>`, r[2]]))}`;
    st.interp.forEach(t => h += `<p>• ${esc(t)}</p>`);
    if (st.sigInterp) h += `<p class="mut">${esc(st.sigInterp)}</p>`;
    h += `</div>`;
  }

  // Ossigenazione
  if (R.oxy) {
    const o = R.oxy, rows = [];
    if (o.pf != null) {
      rows.push(['PAO₂ (eq. gas alveolari completa)', `${fmt(o.PAO2, 1)} mmHg <span class="mut">(semplificata ${fmt(o.PAO2simple, 1)})</span>`]);
      rows.push(['Gradiente A-a', `<b>${fmt(o.aa, 1)}</b> mmHg` + (o.aaNormal != null ? ` <span class="mut">(normale per età ≤ ${fmt(o.aaNormal, 1)})</span>` : '')]);
      rows.push(['Rapporto a/A', `${fmt(o.aA, 2)} <span class="mut">(normale &gt; 0,75)</span>`]);
      rows.push(['P/F', `<b>${fmt(o.pf, 0)}</b> — ${esc(o.pfClass)}${o.peep != null ? ` · PEEP ${o.peep}` : ''}`]);
      if (o.pao2Age != null) rows.push(['PaO₂ attesa per età (aria)', `${fmt(o.pao2Age, 0)} mmHg`]);
    }
    if (o.sf != null) rows.push(['S/F (Global ARDS 2024)', `<b>${fmt(o.sf, 0)}</b> — ${esc(o.sfClass)}`]);
    if (o.sfNote) rows.push(['S/F', esc(o.sfNote)]);
    if (o.oi != null) rows.push(['Indice di ossigenazione', `<b>${fmt(o.oi, 1)}</b> <span class="mut">(&gt; 16 grave; &gt; 25–40 valutare ECMO)</span>`]);
    if (o.cao2 != null) rows.push(['CaO₂', `${fmt(o.cao2, 1)} mL/dL <span class="mut">(17–20)</span>`]);
    h += `<div class="card"><h3><span class="n">7</span>Ossigenazione</h3>${table(['Indice', 'Risultato'], rows)}${o.aaInterp ? `<p class="mut">${esc(o.aaInterp)}</p>` : ''}<p class="mut">Global Definition ARDS (Matthay, AJRCCM 2024): fattore di rischio acuto, insorgenza/peggioramento entro 1 settimana, opacità bilaterali (Rx, TC o ecografia) non spiegate da versamenti/atelettasie/noduli, edema non primariamente cardiogeno. Intubato (PEEP ≥ 5): lieve P/F 200–300 o S/F 235–315 · moderata P/F 100–200 o S/F 148–235 · grave P/F ≤ 100 o S/F ≤ 148. Non intubato (HFNO ≥ 30 L/min o NIV/CPAP ≥ 5 cmH₂O): P/F ≤ 300 o S/F ≤ 315, senza gradi. S/F valido solo con SpO₂ ≤ 97%.</p></div>`;
  }

  // Perfusione
  if (R.perf) {
    const pf = R.perf, rows = [];
    if (pf.gap != null) rows.push(['ΔPCO₂ veno-arterioso (PcvCO₂ − PaCO₂)', `<b>${fmt(pf.gap, 1)}</b> mmHg — ${esc(pf.gapInterp)}`]);
    if (pf.scvo2 != null) rows.push(['ScvO₂', `<b>${fmt(pf.scvo2, 0)}</b>% — ${esc(pf.scvInterp)}`]);
    h += `<div class="card"><h3><span class="n">8</span>Perfusione (EGA venosa centrale)</h3>${table(['Indice', 'Risultato'], rows)}<p class="mut">Prelievi arterioso e venoso centrale simultanei. Integrare con lattati seriati e tempo di riempimento capillare (SSC 2026).</p></div>`;
  }

  // Ventilazione
  if (R.vent) {
    const t = R.vent, rows = [];
    if (t.gradient != null) rows.push(['Gradiente PaCO₂ − EtCO₂', `<b>${fmt(t.gradient, 1)}</b> mmHg — ${esc(t.interp)}`], ['Frazione di spazio morto alveolare (AVDSf)', `${fmt(t.avdsf, 2)} <span class="mut">(normale &lt; 0,15; non è il VD/VT totale)</span>`]);
    if (t.pbw != null) rows.push(['Peso predetto (PBW)', `${fmt(t.pbw, 1)} kg → VT 6 mL/kg = ${fmt(t.vt6, 0)} mL · 8 mL/kg = ${fmt(t.vt8, 0)} mL`]);
    if (t.vr != null) rows.push(['Ventilatory ratio', `<b>${fmt(t.vr, 2)}</b> — ${esc(t.vrInterp)}`]);
    if (t.veTarget != null) rows.push(['VE per PaCO₂ target', `<b>${fmt(t.veTarget, 1)}</b> L/min<br><span class="mut">${esc(t.veNote)}</span>`]);
    h += `<div class="card"><h3><span class="n">9</span>Ventilazione</h3>${table(['Indice', 'Risultato'], rows)}</div>`;
  }

  // Terapia
  if (R.therapy) {
    const t = R.therapy;
    h += `<div class="card"><h3><span class="n">10</span>Deficit di bicarbonato (orientativo)</h3>${table(['Calcolo', 'Valore'], [
      ['0,5 × peso × (' + t.target + ' − HCO₃⁻)', `<b>${fmt(t.deficit, 0)}</b> mEq`],
      ['0,3 × peso × |BE|', `${fmt(t.deficitBE, 0)} mEq`],
      ['Metà del deficit (prima dose)', `${fmt(t.half, 0)} mEq = <b>${fmt(t.half, 0)} mL NaHCO₃ 8,4%</b> · ${fmt(t.half * 2, 0)} mL al 4,2% · ${fmt(t.half / 0.1667, 0)} mL all'1,4%`]
    ])}<p class="mut">${esc(t.note)}</p></div>`;
  }

  // Mappa
  h += `<div class="card map"><h3>Mappa acido-base</h3>${acidBaseMap({ p: I.pco2, h: v.hco3 })}<p class="mut">① Acidosi metabolica · ② Alcalosi metabolica · ③ Acidosi resp. acuta · ④ Acidosi resp. cronica · ⑤ Alcalosi resp. acuta · ⑥ Alcalosi resp. cronica. Bande rosse acidificanti, blu alcalinizzanti, verde normalità: un punto fuori dalle bande suggerisce un disturbo misto.</p></div>`;

  // Eziologie e risoluzione
  const keyMap = { HAGMA: 'HAGMA', NAGMA: 'NAGMA', MAlk: 'MAlk', MAlk_CR: 'MAlk', MAlk_CRes: 'MAlk', RA_acute: 'RA', RA_chronic: 'RA', RAlk: 'RAlk', LACT: 'LACT' };
  const keys = [...new Set(R.etiologyKeys.map(k => keyMap[k]))];
  if (R.disorders.length >= 2) keys.push('MIX');
  if (keys.length) {
    h += `<div class="card"><h3>Eziologia e risoluzione</h3>`;
    if (R.etiologyKeys.includes('MAlk_CR')) h += `<div class="alert note">Cl⁻ urinario &lt; 20: forma cloro-responsiva → NaCl + KCl.</div>`;
    if (R.etiologyKeys.includes('MAlk_CRes')) h += `<div class="alert note">Cl⁻ urinario &gt; 20: forma cloro-resistente → valutare PA, diuretici, mineralcorticoidi, K⁺/Mg²⁺.</div>`;
    keys.forEach(k => { const d = C.DISORDERS.find(x => x.key === k); if (d) h += `<details class="dis"><summary><span class="tag ${d.tag}">${d.tag}</span>${d.title}</summary>${d.html}</details>`; });
    h += `</div>`;
  }

  h += `<div class="actions"><button class="btn" id="copyBtn">Copia referto</button><button class="btn ghost" id="printBtn">Stampa / PDF</button></div>`;
  box.innerHTML = h;
  $('#copyBtn').addEventListener('click', copyReport);
  $('#printBtn').addEventListener('click', () => window.print());
}

function copyReport() {
  const R = lastRes, I = lastIn; if (!R || !R.ok) return;
  const L = [];
  const d = new Date();
  L.push(`EGA — ${d.toLocaleDateString('it-IT')} ${d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`);
  L.push(`pH ${fmt(I.pH, 2)} | PaCO2 ${fmt(I.pco2, 1)} mmHg | HCO3 ${fmt(R.v.hco3, 1)} | SBE ${fmt(R.v.sbe, 1)}` + (I.po2 != null ? ` | PaO2 ${fmt(I.po2, 0)}` : '') + (R.oxy && R.oxy.pf != null ? ` | P/F ${fmt(R.oxy.pf, 0)}` : ''));
  if (R.ag) L.push(`AG ${fmt(R.ag.ag, 1)}${R.ag.agc != null ? ' (corr. alb. ' + fmt(R.ag.agc, 1) + ')' : ''}${R.delta && R.delta.ratio != null ? ' | Δ/Δ ' + fmt(R.delta.ratio, 2) : ''}`);
  if (R.lac) L.push(`Lattati ${fmt(R.lac.value, 1)} mmol/L`);
  L.push('Diagnosi: ' + R.diagnosis);
  R.compChecks.forEach(c => L.push('Compenso: ' + c.text));
  if (R.delta && R.delta.interp) L.push('Δ/Δ: ' + R.delta.interp);
  if (R.perf && R.perf.gap != null) L.push(`ΔPCO2 cv-a ${fmt(R.perf.gap, 1)} mmHg` + (R.perf.scvo2 != null ? ` | ScvO2 ${fmt(R.perf.scvo2, 0)}%` : ''));
  if (I.sample === 'ven') L.push('Campione: VENOSO');
  if (R.oxy && R.oxy.aa != null) L.push(`Ossigenazione: A-a ${fmt(R.oxy.aa, 1)} mmHg, a/A ${fmt(R.oxy.aA, 2)}, ${R.oxy.pfClass}`);
  R.warnings.forEach(w => L.push('Nota: ' + w));
  const txt = L.join('\n');
  (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Referto copiato'), () => {
    const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast('Referto copiato'); } catch (e) { toast('Copia non riuscita'); } ta.remove();
  });
}

// ---------- Contenuti statici ----------
$('#disList').innerHTML = C.DISORDERS.map(d => `<details class="dis" id="d-${d.key}"><summary><span class="tag ${d.tag}">${d.tag}</span>${d.title}</summary>${d.html}</details>`).join('');
$('#formTable').innerHTML = C.T(['Formula', 'Equazione', 'Note / interpretazione'], C.FORMULAS.map(r => [`<b>${r[0]}</b>`, `<span class="num">${r[1]}</span>`, r[2]]));
$('#compTable').innerHTML = C.T(['Disturbo primario', 'Variazione primaria', 'Compenso atteso', 'Tempo', 'Limite'], [
  ['Acidosi metabolica', '↓ HCO₃⁻', 'PaCO₂ = 1,5·HCO₃⁻ + 8 ± 2 (≈ −1,2 mmHg per mmol/L)', 'min–12/24 h', 'PaCO₂ ~10–15'],
  ['Alcalosi metabolica', '↑ HCO₃⁻', 'PaCO₂ = 0,7·HCO₃⁻ + 20 ± 5 (≈ +0,7 mmHg per mmol/L)', '24–36 h', 'PaCO₂ ~55–60'],
  ['Acidosi respiratoria acuta', '↑ PaCO₂', '+1 HCO₃⁻ per +10 mmHg', 'minuti', 'HCO₃⁻ ~30–32'],
  ['Acidosi respiratoria cronica', '↑ PaCO₂', '+3,5 (−4) HCO₃⁻ per +10 mmHg', '3–5 giorni', 'HCO₃⁻ ~45'],
  ['Alcalosi respiratoria acuta', '↓ PaCO₂', '−2 HCO₃⁻ per −10 mmHg', 'minuti', 'HCO₃⁻ ~18'],
  ['Alcalosi respiratoria cronica', '↓ PaCO₂', '−4/−5 HCO₃⁻ per −10 mmHg', '2–3 giorni', 'HCO₃⁻ ~12–15']
]) + C.T(['Classificazione del compenso', 'pH', 'Variabile di compenso'], [
  ['Non compensato', 'alterato', 'nel range normale'],
  ['Parzialmente compensato', 'alterato', 'alterata nel verso del compenso'],
  ['Completamente compensato', '7,35–7,45', 'alterata nel verso del compenso (verificare se misto!)'],
  ['Compenso atteso minimo', 'lievemente alterato', 'disturbo metabolico lieve: la formula prevede una PaCO₂ quasi normale'],
  ['Non appropriato → disturbo misto', 'variabile', 'fuori dal range atteso dalle formule o alterata nel verso opposto']
]) + `<p class="mut">Criteri usati dall'app: nei disturbi respiratori il compenso renale è considerato presente se HCO₃⁻ esce dal range 22–26; nei disturbi metabolici il compenso respiratorio (che inizia in minuti) è considerato avviato se la PaCO₂ si sposta di ≥ 3 mmHg da 40 nel verso atteso. L'appropriatezza è sempre giudicata con le formule.</p>`;
$('#algo').innerHTML = C.ALGO;
$('#mapStatic').innerHTML = `<div class="card map">${acidBaseMap(null)}<p class="mut">① Acidosi metabolica · ② Alcalosi metabolica · ③ Acidosi resp. acuta · ④ Acidosi resp. cronica · ⑤ Alcalosi resp. acuta · ⑥ Alcalosi resp. cronica · riquadro verde: normalità.</p></div>`;
$('#preanal').innerHTML = C.PREANALYTIC;
$('#refs').innerHTML = C.REFS.map(r => `<li>${esc(r)}</li>`).join('');
$$('.appver').forEach(e => e.textContent = 'EGA Acido-Base v' + E.VERSION + ' · contenuti aggiornati a ' + E.CONTENT_DATE);
$$('.appv').forEach(e => e.textContent = 'v' + E.VERSION);
if ($('#venous')) $('#venous').innerHTML = C.VENOUS;

// ---------- Validazione ----------
function renderValidation() {
  const res = E.runValidation();
  const pass = res.filter(r => r.pass).length, nChecks = res.reduce((a, r) => a + r.checks.length, 0), okChecks = res.reduce((a, r) => a + r.checks.filter(c => c.pass).length, 0);
  $('#valSummary').innerHTML = `<div class="card dx ${pass === res.length ? 'norm' : 'acid'}"><div class="lbl">Motore v${E.VERSION}</div><div class="main">${pass}/${res.length} casi superati · ${okChecks}/${nChecks} verifiche</div></div>`;
  $('#valList').innerHTML = res.map(r => `<div class="val"><div class="h"><span>${r.id} · ${esc(r.name)}</span><span class="badge ${r.pass ? 'p' : 'x'}">${r.pass ? 'PASS' : 'FAIL'}</span></div><div class="mut">${esc(r.diagnosis)}</div><ul>${r.checks.map(c => `<li class="${c.pass ? 'v-ok' : 'v-bad'}">${c.pass ? '✓' : '✗'} ${esc(c.label)}${c.pass ? '' : ' (ottenuto: ' + esc(c.got) + ')'}</li>`).join('')}</ul></div>`).join('');
}
renderValidation();
// Coerenza versione app ↔ cache offline del service worker
if (window.caches) caches.keys().then(ks => {
  const ega = ks.filter(k => /^ega-v/.test(k)); if (!ega.length) return;
  const ok = ega.includes('ega-v' + E.VERSION);
  const el = document.createElement('p'); el.className = 'mut';
  el.innerHTML = `Cache offline: ${ega.map(esc).join(', ')} — <b class="${ok ? 'v-ok' : 'v-bad'}">${ok ? 'coerente con la versione v' + E.VERSION : 'non coerente con v' + E.VERSION + ': chiudere e riaprire l\'app'}</b>`;
  $('#valSummary').appendChild(el);
}).catch(() => {});

// ---------- Avvio ----------
loadForm(store.get('form', null));
updateUnitLabels();
compute();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('ega-sw.js').catch(() => {}));
}
})();
