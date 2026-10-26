/*!
 * EGA Analyzer — motore di calcolo acido-base / ventilatorio / ossigenazione
 * Versione 1.1.0 (2026-10, audit) — Cimox44
 * Modulo UMD: usabile nel browser (window.EGA) e in Node (require).
 * Unità interne: mmHg, mmol/L (= mEq/L per ioni monovalenti), albumina g/dL,
 * glucosio mg/dL, BUN mg/dL, Hb g/dL, FiO2 frazione (0.21–1.0).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.EGA = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const VERSION = '1.1.0';

  // ---- Valori di riferimento (adulto, sangue arterioso, 37 °C) ----
  const REF = {
    pH: [7.35, 7.45], pHmid: 7.40,
    PaCO2: [35, 45], PaCO2n: 40,
    HCO3: [22, 26], HCO3n: 24,
    SBE: [-2, 2],
    AGn: 12, AGsd: 2,            // AG senza K: 12 ± 2 mmol/L
    AGnK: 16,                    // AG con K: 16 ± 2 mmol/L
    AlbN: 4.0,                   // g/dL
    Lact: 2.0,
    OsmGap: 10,
    PH2O: 47, RQ: 0.8
  };

  const kPa2mmHg = 7.50062;

  const r = (x, d = 1) => (x == null || !isFinite(x)) ? null : Math.round(x * Math.pow(10, d)) / Math.pow(10, d);
  const has = (x) => x !== null && x !== undefined && x !== '' && isFinite(x);
  const num = (v) => {
    if (v === '' || v == null) return null;
    const x = parseFloat(String(v).replace(',', '.'));
    return isFinite(x) ? x : null;
  };

  // ------------------------------------------------------------------
  // Formule di base (esportate anche singolarmente per trasparenza)
  // ------------------------------------------------------------------
  const F = {
    hFromPH: (pH) => Math.pow(10, 9 - pH),                              // nmol/L
    hco3HH: (pH, pco2) => 0.0307 * pco2 * Math.pow(10, pH - 6.1),        // Henderson-Hasselbalch
    pHfromHH: (hco3, pco2) => 6.1 + Math.log10(hco3 / (0.0307 * pco2)),
    hHenderson: (pco2, hco3) => 24 * pco2 / hco3,                        // [H+] = 24·PaCO2/HCO3
    sbeVanSlyke: (pH, hco3) => 0.93 * (hco3 - 24.4 + 14.83 * (pH - 7.4)), // CLSI C46-A2
    winter: (hco3) => 1.5 * hco3 + 8,                                    // ±2
    malkPCO2: (hco3) => 0.7 * hco3 + 20,                                 // ±5
    raAcuteHCO3: (pco2) => 24 + 0.1 * (pco2 - 40),
    raChronicHCO3: (pco2) => 24 + 0.35 * (pco2 - 40),
    ralkAcuteHCO3: (pco2) => 24 - 0.2 * (40 - pco2),
    ralkChronicHCO3: (pco2) => 24 - 0.4 * (40 - pco2),
    pHacuteResp: (pco2) => 7.40 - 0.008 * (pco2 - 40),
    pHchronicResp: (pco2) => 7.40 - 0.003 * (pco2 - 40),
    ag: (na, cl, hco3, k) => na + (has(k) ? k : 0) - cl - hco3,
    agAlb: (ag, albGdl) => ag + 2.5 * (REF.AlbN - albGdl),
    osmCalc: (na, gluMg, bunMg, etohMg) => 2 * na + (gluMg || 0) / 18 + (bunMg || 0) / 2.8 + (has(etohMg) ? etohMg / 3.7 : 0),
    naCorrKatz: (na, glu) => na + 1.6 * Math.max(0, glu - 100) / 100,
    naCorrHillier: (na, glu) => na + 2.4 * Math.max(0, glu - 100) / 100,
    uag: (una, uk, ucl) => una + uk - ucl,
    // Equazione dei gas alveolari completa
    PAO2: (fio2, patm, pco2, rq = REF.RQ) => fio2 * (patm - REF.PH2O) - pco2 * (fio2 + (1 - fio2) / rq),
    PAO2simple: (fio2, patm, pco2, rq = REF.RQ) => fio2 * (patm - REF.PH2O) - pco2 / rq,
    aaNormal: (age) => age / 4 + 4,
    pao2Age: (age) => 109 - 0.43 * age,   // Sorbini 1968 (supino, aria ambiente)
    cao2: (hb, sao2, po2) => 1.34 * hb * sao2 / 100 + 0.003 * po2,
    pbw: (sex, hcm) => (sex === 'F' ? 45.5 : 50) + 0.91 * (hcm - 152.4),
    ventRatio: (veL, pco2, pbw) => (veL * 1000 * pco2) / (pbw * 100 * 37.5),
    veTarget: (ve, pco2, target) => ve * pco2 / target,
    oi: (map, fio2, po2) => map * fio2 * 100 / po2,
    // Stewart / Fencl-Figge
    albCharge: (albGl, pH) => albGl * (0.123 * pH - 0.631),
    phosCharge: (phos, pH) => phos * (0.309 * pH - 0.469),
    hco3Deficit: (wt, target, hco3) => 0.5 * wt * (target - hco3),
    beDeficit: (wt, sbe) => 0.3 * wt * Math.abs(sbe)
  };

  const LABEL = {
    MA: 'Acidosi metabolica', MAlk: 'Alcalosi metabolica',
    RA: 'Acidosi respiratoria', RAlk: 'Alcalosi respiratoria'
  };
  const isAcid = (c) => c === 'MA' || c === 'RA';
  const isResp = (c) => c === 'RA' || c === 'RAlk';

  // ------------------------------------------------------------------
  // Analisi principale
  // ------------------------------------------------------------------
  function analyze(raw, opts) {
    opts = opts || {};
    const I = {};
    for (const k in raw) I[k] = (typeof raw[k] === 'string' && !['chronicity', 'sex'].includes(k)) ? num(raw[k]) : raw[k];
    if (typeof I.useK === 'string') I.useK = I.useK === 'true';
    const out = {
      version: VERSION, ok: false, errors: [], warnings: [], notes: [],
      v: {}, disorders: [], compChecks: [], steps: [], etiologyKeys: [], actions: []
    };
    const W = (t) => out.warnings.push(t);

    const pH = I.pH, pco2 = I.pco2;
    let hco3 = I.hco3;

    // --- Validazione ---
    if (!has(pH)) out.errors.push('Inserire il pH.');
    if (!has(pco2)) out.errors.push('Inserire la PaCO₂.');
    if (has(pH) && (pH < 6.5 || pH > 8.0)) out.errors.push('pH fuori dal range fisiologicamente compatibile (6.50–8.00): verificare il dato.');
    if (has(pco2) && (pco2 < 5 || pco2 > 200)) out.errors.push('PaCO₂ fuori range (5–200 mmHg): verificare unità di misura (kPa/mmHg).');
    if (has(hco3) && (hco3 < 2 || hco3 > 70)) out.errors.push('HCO₃⁻ fuori range (2–70 mmol/L).');
    if (out.errors.length) return out;

    // --- Step 0: coerenza interna (Henderson) ---
    const H = F.hFromPH(pH);
    const hco3Calc = F.hco3HH(pH, pco2);
    out.v.H = r(H, 1);
    out.v.hco3Calc = r(hco3Calc, 1);
    if (!has(hco3)) {
      hco3 = hco3Calc; out.v.hco3Source = 'calcolato (Henderson-Hasselbalch)';
    } else {
      out.v.hco3Source = 'misurato/refertato';
      const diff = hco3 - hco3Calc;
      out.v.hco3Diff = r(diff, 1);
      out.v.consistency = Math.abs(diff) <= Math.max(2, 0.1 * hco3Calc) ? 'coerente' : 'incoerente';
      if (out.v.consistency === 'incoerente') {
        W(`Incoerenza interna: HCO₃⁻ inserito ${r(hco3, 1)} vs calcolato ${r(hco3Calc, 1)} mmol/L (Δ ${r(diff, 1)}). Possibile errore di trascrizione, campione venoso/misto, bolla d'aria o HCO₃⁻ standard al posto dell'attuale. L'interpretazione prosegue con il valore inserito.`);
      }
    }
    out.v.hco3 = r(hco3, 1);
    out.v.HHenderson = r(F.hHenderson(pco2, hco3), 1);

    let sbe = I.be;
    if (!has(sbe)) { sbe = F.sbeVanSlyke(pH, hco3); out.v.sbeSource = 'calcolato (Van Slyke, CLSI)'; }
    else out.v.sbeSource = 'inserito';
    out.v.sbe = r(sbe, 1);

    // --- Step 1: pH ---
    let phStatus = 'normale';
    if (pH < REF.pH[0]) phStatus = 'acidemia';
    else if (pH > REF.pH[1]) phStatus = 'alcalemia';
    out.phStatus = phStatus;
    let phSev = 'normale';
    if (pH < 7.10) phSev = 'acidemia critica (pericolo di vita)';
    else if (pH < 7.20) phSev = 'acidemia grave';
    else if (pH < 7.30) phSev = 'acidemia moderata';
    else if (pH < 7.35) phSev = 'acidemia lieve';
    else if (pH > 7.60) phSev = 'alcalemia critica (pericolo di vita)';
    else if (pH > 7.55) phSev = 'alcalemia grave';
    else if (pH > 7.50) phSev = 'alcalemia moderata';
    else if (pH > 7.45) phSev = 'alcalemia lieve';
    out.phSeverity = phSev;
    out.steps.push({ n: 1, t: 'pH', txt: `pH ${pH.toFixed(2)} → ${phStatus === 'normale' ? 'nel range (7.35–7.45)' : phStatus} — [H⁺] ${r(H, 1)} nmol/L. ${phSev !== 'normale' ? 'Gravità: ' + phSev + '.' : ''}` });

    // --- Step 2: disturbo primario ---
    const pco2Hi = pco2 > REF.PaCO2[1], pco2Lo = pco2 < REF.PaCO2[0];
    const hco3Lo = hco3 < REF.HCO3[0], hco3Hi = hco3 > REF.HCO3[1];
    let primary = [], primaryNote = '';
    const devM_acid = (24 - hco3) / 24, devR_acid = (pco2 - 40) / 40;

    if (phStatus === 'acidemia') {
      if (pco2Hi && hco3Lo) { primary = ['RA', 'MA']; primaryNote = 'Acidosi mista (respiratoria + metabolica): entrambe le componenti spingono verso l\'acidemia.'; }
      else if (hco3Lo) primary = ['MA'];
      else if (pco2Hi) primary = ['RA'];
      else { primary = devM_acid >= devR_acid ? ['MA'] : ['RA']; primaryNote = 'Variazioni minime di PaCO₂/HCO₃⁻: disturbo lieve o iniziale, attribuito alla componente con deviazione relativa maggiore.'; }
    } else if (phStatus === 'alcalemia') {
      if (pco2Lo && hco3Hi) { primary = ['RAlk', 'MAlk']; primaryNote = 'Alcalosi mista (respiratoria + metabolica): entrambe le componenti spingono verso l\'alcalemia.'; }
      else if (hco3Hi) primary = ['MAlk'];
      else if (pco2Lo) primary = ['RAlk'];
      else { primary = (-devM_acid) >= (-devR_acid) ? ['MAlk'] : ['RAlk']; primaryNote = 'Variazioni minime di PaCO₂/HCO₃⁻: disturbo lieve o iniziale.'; }
    } else {
      const abn = [];
      if (pco2Hi) abn.push('RA'); if (pco2Lo) abn.push('RAlk');
      if (hco3Lo) abn.push('MA'); if (hco3Hi) abn.push('MAlk');
      if (abn.length === 0) primary = [];
      else {
        const acidSide = pH < REF.pHmid, alkSide = pH > REF.pHmid;
        const consistent = abn.filter(c => (acidSide && isAcid(c)) || (alkSide && !isAcid(c)));
        if (abn.length === 2 && abn.every(isAcid)) { primary = abn; primaryNote = 'Pattern incoerente con pH normale (due componenti acidificanti): verificare il campione.'; }
        else if (abn.length === 2 && abn.every(c => !isAcid(c))) { primary = abn; primaryNote = 'Pattern incoerente con pH normale (due componenti alcalinizzanti): verificare il campione.'; }
        else if (consistent.length === 1) { primary = consistent; }
        else if (consistent.length === 0 && abn.length === 1) { primary = abn; primaryNote = 'Il pH è sul versante opposto rispetto all\'unica alterazione: considerare disturbo misto lieve.'; }
        else { primary = abn; primaryNote = 'pH = 7.40 con PaCO₂ e HCO₃⁻ alterati in senso opposto: impossibile stabilire quale sia primario → disturbo misto.'; }
      }
    }
    out.primary = primary;
    out.mixedPrimary = primary.length > 1;

    // --- Step 3: compenso (classificazione tradizionale + appropriatezza) ---
    let compStatus = null;
    const extra = []; // disturbi concomitanti dedotti
    const chron = I.chronicity || 'auto';
    let respAcuity = null;

    if (primary.length === 1) {
      const p = primary[0];
      let moved = false, opposite = false;
      // Metabolici: il compenso respiratorio inizia in minuti → si considera avviato se la PaCO₂
      // si è spostata di ≥ 3 mmHg da 40 nel verso del compenso (anche se ancora nel range 35–45).
      if (p === 'MA') { moved = pco2 <= REF.PaCO2n - 3; opposite = pco2Hi; }
      if (p === 'MAlk') { moved = pco2 >= REF.PaCO2n + 3; opposite = pco2Lo; }
      if (p === 'RA') { moved = hco3Hi; opposite = hco3Lo; }
      if (p === 'RAlk') { moved = hco3Lo; opposite = hco3Hi; }
      if (opposite) compStatus = 'assente (variabile di compenso alterata in senso opposto → disturbo misto)';
      else if (!moved) compStatus = 'non compensato';
      else if (phStatus === 'normale') compStatus = 'completamente compensato';
      else compStatus = 'parzialmente compensato';

      // appropriatezza
      if (p === 'MA') {
        const e = F.winter(hco3), lo = e - 2, hi = e + 2;
        const c = { forCode: 'MA', rule: 'Winter: PaCO₂ = 1.5·HCO₃⁻ + 8 ± 2', variable: 'PaCO₂', unit: 'mmHg', expected: r(e, 1), lo: r(lo, 1), hi: r(hi, 1), actual: r(pco2, 1) };
        if (pco2 > hi) { c.verdict = 'insufficiente'; c.extra = 'RA'; c.text = 'PaCO₂ superiore all\'atteso → acidosi respiratoria concomitante (ipoventilazione relativa, fatica muscolare, sedazione, impostazioni ventilatorie).'; }
        else if (pco2 < lo) { c.verdict = 'eccessivo'; c.extra = 'RAlk'; c.text = 'PaCO₂ inferiore all\'atteso → alcalosi respiratoria concomitante (sepsi, salicilati, ipossiemia, dolore, iperventilazione meccanica).'; }
        else { c.verdict = 'appropriato'; c.text = 'Compenso respiratorio appropriato.'; }
        c.alt = `Regole alternative: PaCO₂ ≈ ultime due cifre del pH (${Math.round((pH - 7) * 100)} mmHg, valida per pH 7.10–7.60); ΔPaCO₂ ≈ SBE (Copenhagen) → ${r(40 + sbe, 1)} mmHg.`;
        if (hco3 < 6) c.alt += ' Limite fisiologico del compenso: PaCO₂ minima ~10–15 mmHg.';
        out.compChecks.push(c); if (c.extra) extra.push(c.extra);
        if (c.verdict === 'appropriato' && !opposite) compStatus = (40 - pco2) >= 1 ? (phStatus === 'normale' ? 'completamente compensato' : 'parzialmente compensato') : 'compenso atteso minimo (disturbo lieve)';
      }
      if (p === 'MAlk') {
        const e = F.malkPCO2(hco3), lo = e - 5, hi = e + 5;
        const c = { forCode: 'MAlk', rule: 'PaCO₂ = 0.7·HCO₃⁻ + 20 ± 5', variable: 'PaCO₂', unit: 'mmHg', expected: r(e, 1), lo: r(lo, 1), hi: r(hi, 1), actual: r(pco2, 1) };
        if (pco2 > hi) { c.verdict = 'eccessivo'; c.extra = 'RA'; c.text = 'PaCO₂ superiore all\'atteso → acidosi respiratoria concomitante.'; }
        else if (pco2 < lo) { c.verdict = 'insufficiente'; c.extra = 'RAlk'; c.text = 'PaCO₂ inferiore all\'atteso → alcalosi respiratoria concomitante.'; }
        else { c.verdict = 'appropriato'; c.text = 'Compenso respiratorio appropriato (ipoventilazione compensatoria).'; }
        c.alt = `Alternative: PaCO₂ ≈ 40 + 0.6·SBE (Copenhagen) → ${r(40 + 0.6 * sbe, 1)} mmHg; PaCO₂ ≈ ultime due cifre del pH. Il compenso raramente supera PaCO₂ 55–60 mmHg (ipossiemia limita l'ipoventilazione).`;
        out.compChecks.push(c); if (c.extra) extra.push(c.extra);
        if (c.verdict === 'appropriato' && !opposite) compStatus = (pco2 - 40) >= 1 ? (phStatus === 'normale' ? 'completamente compensato' : 'parzialmente compensato') : 'compenso atteso minimo (disturbo lieve)';
      }
      if (p === 'RA' || p === 'RAlk') {
        const acute = p === 'RA' ? F.raAcuteHCO3(pco2) : F.ralkAcuteHCO3(pco2);
        const chronic = p === 'RA' ? F.raChronicHCO3(pco2) : F.ralkChronicHCO3(pco2);
        const tol = 2;
        const aLo = acute - tol, aHi = acute + tol, cLo = chronic - tol, cHi = chronic + tol;
        const c = {
          forCode: p, variable: 'HCO₃⁻', unit: 'mmol/L', actual: r(hco3, 1),
          rule: p === 'RA' ? 'Acuta: ΔHCO₃⁻ = 0.1·ΔPaCO₂ · Cronica: ΔHCO₃⁻ = 0.35·ΔPaCO₂ (± 2)' : 'Acuta: ΔHCO₃⁻ = 0.2·ΔPaCO₂ · Cronica: ΔHCO₃⁻ = 0.4·ΔPaCO₂ (± 2)',
          acute: r(acute, 1), chronic: r(chronic, 1),
          pHacute: r(F.pHacuteResp(pco2), 2), pHchronic: r(F.pHchronicResp(pco2), 2)
        };
        // Per RA: acuto (basso) < cronico (alto); per RAlk: acuto (alto) > cronico (basso)
        const minE = Math.min(aLo, cLo), maxE = Math.max(aHi, cHi);
        const metHigh = 'MAlk', metLow = 'MA';
        let mode = chron;
        if (mode === 'acute') { c.expected = r(acute, 1); c.lo = r(aLo, 1); c.hi = r(aHi, 1); respAcuity = 'acuta'; }
        else if (mode === 'chronic') { c.expected = r(chronic, 1); c.lo = r(cLo, 1); c.hi = r(cHi, 1); respAcuity = 'cronica'; }
        if (mode === 'acute' || mode === 'chronic') {
          if (hco3 > c.hi) { c.verdict = 'fuori range (alto)'; c.extra = metHigh; c.text = 'HCO₃⁻ superiore all\'atteso → alcalosi metabolica concomitante.'; }
          else if (hco3 < c.lo) { c.verdict = 'fuori range (basso)'; c.extra = metLow; c.text = 'HCO₃⁻ inferiore all\'atteso → acidosi metabolica concomitante.'; }
          else { c.verdict = 'appropriato'; c.text = `Compenso metabolico appropriato per forma ${respAcuity}.`; }
        } else {
          // auto: deduzione della cronicità dal bicarbonato
          c.lo = r(minE, 1); c.hi = r(maxE, 1); c.expected = `${r(acute, 1)} (acuta) – ${r(chronic, 1)} (cronica)`;
          const inA = hco3 >= aLo && hco3 <= aHi, inC = hco3 >= cLo && hco3 <= cHi;
          if (inA && inC) {
            const dA = Math.abs(hco3 - acute), dC = Math.abs(hco3 - chronic);
            c.verdict = 'appropriato';
            if (Math.abs(dA - dC) < 1) { respAcuity = 'indeterminabile (ΔPaCO₂ piccola)'; c.text = 'HCO₃⁻ compatibile sia con forma acuta sia cronica (ΔPaCO₂ modesta): decide la clinica.'; }
            else if (dC < dA) { respAcuity = 'cronica'; c.text = 'HCO₃⁻ più vicino all\'atteso CRONICO (range sovrapposti: confermare con anamnesi).'; }
            else { respAcuity = 'acuta'; c.text = 'HCO₃⁻ più vicino all\'atteso ACUTO (range sovrapposti: confermare con anamnesi).'; }
          }
          else if (inA) { respAcuity = 'acuta'; c.verdict = 'appropriato'; c.text = 'HCO₃⁻ compatibile con forma ACUTA (tamponamento non bicarbonato, < 24–48 h).'; }
          else if (inC) { respAcuity = 'cronica'; c.verdict = 'appropriato'; c.text = 'HCO₃⁻ compatibile con forma CRONICA (compenso renale completato, > 3–5 giorni).'; }
          else if (hco3 > Math.min(aHi, cHi) && hco3 < Math.max(aLo, cLo)) { respAcuity = 'acuta su cronica / in evoluzione'; c.verdict = 'intermedio'; c.text = 'HCO₃⁻ intermedio tra atteso acuto e cronico: forma in evoluzione (24–72 h), acuta su cronica, oppure disturbo metabolico associato.'; }
          else if (hco3 > maxE) { respAcuity = p === 'RA' ? 'cronica' : 'acuta'; c.verdict = 'fuori range (alto)'; c.extra = metHigh; c.text = 'HCO₃⁻ superiore anche al massimo atteso → alcalosi metabolica concomitante.'; }
          else { respAcuity = p === 'RA' ? 'acuta' : 'cronica'; c.verdict = 'fuori range (basso)'; c.extra = metLow; c.text = 'HCO₃⁻ inferiore anche al minimo atteso → acidosi metabolica concomitante.'; }
        }
        if (p === 'RA' && hco3 > 45) c.text += ' Nota: compenso renale massimo ~45 mmol/L; valori superiori indicano alcalosi metabolica associata.';
        if (p === 'RAlk' && hco3 < 12) c.text += ' Nota: compenso renale minimo ~12–15 mmol/L.';
        c.alt = `pH atteso: acuta ${c.pHacute}, cronica ${c.pHchronic} (regole 0.008 / 0.003). Copenhagen: acuta → SBE invariato (≈0); cronica → SBE ≈ 0.4·ΔPaCO₂ = ${r(0.4 * (pco2 - 40), 1)} mmol/L (attuale ${r(sbe, 1)}).`;
        out.compChecks.push(c); if (c.extra) extra.push(c.extra);
      }
    } else if (primary.length === 2) {
      compStatus = 'non applicabile (disturbo misto)';
      if (primary.includes('MA') && primary.includes('RA')) {
        const e = F.winter(hco3);
        out.compChecks.push({ forCode: 'MA', rule: 'Winter: PaCO₂ = 1.5·HCO₃⁻ + 8 ± 2', variable: 'PaCO₂', unit: 'mmHg', expected: r(e, 1), lo: r(e - 2, 1), hi: r(e + 2, 1), actual: r(pco2, 1), verdict: 'insufficiente', text: `PaCO₂ ${r(pco2, 1)} vs attesa ${r(e - 2, 1)}–${r(e + 2, 1)} mmHg: componente respiratoria primaria che impedisce il compenso.` });
      }
      if (primary.includes('MAlk') && primary.includes('RAlk')) {
        const e = F.malkPCO2(hco3);
        out.compChecks.push({ forCode: 'MAlk', rule: 'PaCO₂ = 0.7·HCO₃⁻ + 20 ± 5', variable: 'PaCO₂', unit: 'mmHg', expected: r(e, 1), lo: r(e - 5, 1), hi: r(e + 5, 1), actual: r(pco2, 1), verdict: 'insufficiente', text: 'PaCO₂ inferiore all\'atteso: componente respiratoria primaria alcalinizzante.' });
      }
    }
    // Se l'analisi del compenso rivela un secondo disturbo, la classificazione tradizionale non è applicabile
    if (primary.length === 1 && extra.length && !/^assente/.test(compStatus || '')) compStatus = 'non appropriato → disturbo misto';
    out.compStatus = compStatus;
    out.respAcuity = respAcuity;

    // --- Step 4: gap anionico ---
    const kUsed = !!(I.useK && has(I.k));
    const agN = has(I.agNormal) ? I.agNormal : (kUsed ? REF.AGnK : REF.AGn);
    const agHi = agN + REF.AGsd; // soglia "elevato"
    let agInfo = null;
    if (has(I.na) && has(I.cl)) {
      const ag = F.ag(I.na, I.cl, hco3, kUsed ? I.k : null);
      if (I.useK && !has(I.k)) W('"Includi K⁺" selezionato ma K⁺ non inserito: AG calcolato senza K⁺ (normale 12 ± 2).');
      const agc = has(I.alb) ? F.agAlb(ag, I.alb) : null;
      const agUse = has(agc) ? agc : ag;
      agInfo = { ag: r(ag, 1), agc: r(agc, 1), use: r(agUse, 1), normal: agN, upper: agHi, withK: kUsed };
      agInfo.status = agUse > agHi ? 'elevato' : (agUse < agN - 6 ? 'basso' : 'normale');
      if (agUse > agN && agUse <= agHi) agInfo.status = 'ai limiti superiori';
      if (has(agc) && ag <= agHi && agc > agHi) { agInfo.masked = true; W(`Gap anionico apparentemente normale (${r(ag, 1)}) ma corretto per albumina = ${r(agc, 1)} mmol/L: HAGMA mascherata dall'ipoalbuminemia.`); }
      if (agInfo.status === 'basso') W((has(agc) ? 'Gap anionico basso anche dopo correzione per albumina' : 'Gap anionico basso') + ': considerare ' + (has(agc) ? '' : 'ipoalbuminemia, ') + 'paraproteinemia (mieloma IgG), ipercalcemia/ipermagnesiemia, intossicazione da litio o bromuri, errore di laboratorio (ipercloremia spuria).');
      if (!has(I.alb)) out.notes.push('Albumina non inserita: AG non corretto. Nel paziente critico l\'ipoalbuminemia è la regola e può mascherare una HAGMA (−2.5 mmol/L di AG per ogni g/dL di albumina persa).');
      out.ag = agInfo;
    }

    // Classificazione del MA e delta-delta
    // Il Δ/Δ si interpreta SOLO se è presente un'acidosi metabolica (da compenso o da AG elevato).
    // Bicarbonato di base: 24, oppure l'HCO₃⁻ atteso dal compenso se il primario è respiratorio.
    const maPresent = primary.includes('MA') || extra.includes('MA') || (agInfo && agInfo.status === 'elevato');
    let delta = null;
    if (agInfo) {
      let baseHCO3 = REF.HCO3n, baseNote = '';
      if (primary.length === 1 && isResp(primary[0]) && out.compChecks[0]) {
        const cc = out.compChecks[0];
        if (respAcuity === 'cronica') { baseHCO3 = cc.chronic; baseNote = 'HCO₃⁻ di base = atteso per compenso cronico'; }
        else if (respAcuity === 'acuta') { baseHCO3 = cc.acute; baseNote = 'HCO₃⁻ di base = atteso per compenso acuto'; }
      }
      const dAG = agInfo.use - agN;
      const dHCO3 = baseHCO3 - hco3;
      const corrHCO3 = hco3 + dAG;
      delta = { dAG: r(dAG, 1), dHCO3: r(dHCO3, 1), corrHCO3: r(corrHCO3, 1), base: r(baseHCO3, 1), baseNote, applicable: !!maPresent };
      if (maPresent && dHCO3 > 1) {
        const ratio = dAG / dHCO3;
        delta.ratio = r(ratio, 2);
        const agHigh = agInfo.status === 'elevato';
        if (ratio < 0.4) delta.interp = agHigh ? 'NAGMA prevalente con componente HAGMA associata (AG elevato ma ΔAG molto inferiore a ΔHCO₃⁻).' : 'Acidosi metabolica ipercloremica a gap normale (NAGMA) pura.';
        else if (ratio < 0.8) delta.interp = 'HAGMA + NAGMA associate (oppure acidosi dell\'insufficienza renale, in cui coesistono le due componenti).';
        else if (ratio <= 2.0) delta.interp = 'HAGMA pura (≈1 nella chetoacidosi per perdita urinaria di chetoni; ≈1.6 nell\'acidosi lattica).';
        else delta.interp = 'HAGMA + alcalosi metabolica concomitante (oppure HCO₃⁻ basale elevato da acidosi respiratoria cronica non riconosciuta).';
      } else if (maPresent && agInfo.status === 'elevato') {
        delta.interp = 'Gap elevato con HCO₃⁻ normale/alto: HAGMA mascherata da alcalosi metabolica (o respiratoria cronica compensata) — tipico triplo disturbo.';
      } else if (!maPresent && dHCO3 > 1) {
        delta.naNote = 'Δ/Δ non applicabile: nessuna acidosi metabolica; la riduzione di HCO₃⁻ è spiegata dal compenso respiratorio.';
      }
      if (maPresent) {
        const lo = baseHCO3 - 2, hi = baseHCO3 + 2;
        delta.corrInterp = corrHCO3 > hi ? `HCO₃⁻ corretto ${r(corrHCO3, 1)} > ${r(hi, 1)} → alcalosi metabolica associata.` : (corrHCO3 < lo ? `HCO₃⁻ corretto ${r(corrHCO3, 1)} < ${r(lo, 1)} → acidosi metabolica a gap normale associata.` : `HCO₃⁻ corretto ${r(corrHCO3, 1)} (${r(lo, 1)}–${r(hi, 1)}): nessun disturbo metabolico aggiuntivo.`);
        delta.corrHigh = corrHCO3 > hi;
      }
      out.delta = delta;
    }

    // --- Step 5: gap osmolare, sodio corretto, urine, lattati ---
    if (has(I.na) && has(I.glu)) {
      out.naCorr = { katz: r(F.naCorrKatz(I.na, I.glu), 1), hillier: r(F.naCorrHillier(I.na, I.glu), 1) };
    }
    let bun = null;
    if (has(I.bun)) bun = I.bun; else if (has(I.urea)) bun = I.urea / 2.14;
    if (has(I.na) && has(I.glu) && has(bun)) {
      const oc = F.osmCalc(I.na, I.glu, bun, I.etoh);
      out.osm = { calc: r(oc, 1), bun: r(bun, 1) };
      if (has(I.osmMeas)) {
        const og = I.osmMeas - oc;
        out.osm.meas = I.osmMeas; out.osm.gap = r(og, 1);
        out.osm.interp = og > 20 ? 'Gap osmolare marcatamente elevato (>20): fortemente sospetto per alcoli tossici (metanolo, glicole etilenico, glicole propilenico, isopropanolo).'
          : og > 10 ? 'Gap osmolare elevato (>10): alcoli tossici, etanolo non dosato, mannitolo, glicerolo, chetoacidosi/acidosi lattica gravi, IRC.' : 'Gap osmolare normale (≤10).';
      }
    }
    if (has(I.uNa) && has(I.uK) && has(I.uCl)) {
      const u = F.uag(I.uNa, I.uK, I.uCl);
      out.uag = { value: r(u, 1) };
      out.uag.interp = u < 0 ? 'UAG negativo: escrezione di NH₄⁺ conservata → causa extrarenale (diarrea, fistole, derivazioni urinarie, carico di NaCl/HCl).'
        : 'UAG positivo: ridotta escrezione di NH₄⁺ → acidosi tubulare renale (distale tipo 1, tipo 4 iporeninemico/ipoaldosteronismo), IRC.';
      out.uag.caveat = 'Inaffidabile se Na urinario < 20 mmol/L (ipovolemia), chetonuria, ippurato (toluene), penicilline ad alte dosi.';
    }
    if (has(I.uCl)) {
      out.uCl = { value: I.uCl, interp: I.uCl < 20 ? 'Cl urinario < 20 mmol/L: alcalosi metabolica CLORO-RESPONSIVA (vomito, aspirazione SNG, diuretici pregressi, post-ipercapnica).' : 'Cl urinario > 20 mmol/L: alcalosi CLORO-RESISTENTE (eccesso di mineralcorticoidi, diuretici in atto, Bartter/Gitelman, ipoK/ipoMg grave).' };
    }
    if (has(I.lac)) {
      out.lac = { value: I.lac, interp: I.lac >= 4 ? 'Iperlattatemia grave (≥4 mmol/L): ipoperfusione/shock (tipo A) o cause tipo B; prognosticamente sfavorevole.' : I.lac > 2 ? 'Iperlattatemia (>2 mmol/L).' : 'Lattati nella norma.' };
    }

    // --- Stewart / Fencl-Figge e partizione del BE (Story) ---
    if (has(I.alb) && has(I.na) && has(I.cl)) {
      const albGl = I.alb * 10;
      const st = {};
      st.naCl = r(I.na - I.cl, 1);
      st.beNaCl = r(I.na - I.cl - 38, 1);
      st.beAlb = r(0.25 * (42 - albGl), 1);
      st.beUA = r(sbe - (I.na - I.cl - 38) - 0.25 * (42 - albGl), 1);
      st.albCharge = r(F.albCharge(albGl, pH), 1);
      if (has(I.k) && has(I.ica) && has(I.mg)) {
        const sida = I.na + I.k + 2 * I.ica + 2 * I.mg - I.cl - (has(I.lac) ? I.lac : 0);
        const phos = has(I.phos) ? I.phos : null;
        const side = hco3 + F.albCharge(albGl, pH) + (has(phos) ? F.phosCharge(phos, pH) : 0);
        st.sida = r(sida, 1); st.side = r(side, 1); st.sig = r(sida - side, 1);
        st.phosAssumed = !has(phos);
        st.sigInterp = (sida - side) > 2 ? 'SIG > 2 mEq/L: anioni non misurati (chetoni, solfati, salicilati, metaboliti di alcoli tossici, anioni dell\'IRC).' : 'SIG nella norma (0 ± 2 mEq/L).';
      }
      st.interp = [];
      if (st.beNaCl < -2) st.interp.push(`Effetto Na–Cl ${st.beNaCl} mmol/L: acidosi ipercloremica / da diluizione (SID ridotto) — tipica dopo NaCl 0.9% o priming CEC.`);
      if (st.beNaCl > 2) st.interp.push(`Effetto Na–Cl +${st.beNaCl} mmol/L: alcalosi ipocloremica / da contrazione.`);
      if (st.beAlb > 2) st.interp.push(`Effetto albumina +${st.beAlb} mmol/L: alcalosi ipoalbuminemica (riduzione di Atot) che maschera acidosi.`);
      if (st.beUA < -2) st.interp.push(`Anioni non misurati (incl. lattato) ${st.beUA} mmol/L: acidosi da anioni forti non misurati.`);
      out.stewart = st;
    }

    // --- Ossigenazione ---
    let fio2 = I.fio2;
    if (has(fio2) && fio2 > 1) fio2 = fio2 / 100;
    if (has(fio2) && (fio2 < 0.21 || fio2 > 1)) { W('FiO₂ fuori range (0.21–1.0): ossigenazione non calcolata.'); fio2 = null; }
    const patm = has(I.patm) ? I.patm : 760;
    if (has(I.po2) && has(fio2)) {
      const ox = {};
      ox.fio2 = fio2;
      ox.pf = r(I.po2 / fio2, 0);
      const PA = F.PAO2(fio2, patm, pco2);
      ox.PAO2 = r(PA, 1);
      ox.PAO2simple = r(F.PAO2simple(fio2, patm, pco2), 1);
      ox.aa = r(PA - I.po2, 1);
      ox.aA = r(I.po2 / PA, 2);
      if (has(I.age)) {
        ox.aaNormal = r(F.aaNormal(I.age), 1);
        ox.pao2Age = r(F.pao2Age(I.age), 0);
      }
      const pf = I.po2 / fio2;
      ox.pfClass = pf > 300 ? 'Nessun criterio ARDS (P/F > 300)' : pf > 200 ? 'Lieve (200 < P/F ≤ 300)' : pf > 100 ? 'Moderata (100 < P/F ≤ 200)' : 'Grave (P/F ≤ 100)';
      ox.aaInterp = (fio2 <= 0.22 && has(ox.aaNormal))
        ? (ox.aa > ox.aaNormal ? `Gradiente A-a aumentato (normale per età ≤ ${ox.aaNormal} mmHg): ipossiemia da V/Q mismatch, shunt o difetto di diffusione.` : 'Gradiente A-a normale: eventuale ipossiemia da ipoventilazione (↑PaCO₂) o bassa PiO₂.')
        : 'Con FiO₂ > 0.21 il gradiente A-a aumenta fisiologicamente (fino a ~60–70 mmHg con FiO₂ 1.0): interpretare il trend; preferire P/F e a/A (normale > 0.75).';
      if (I.po2 < 60) W(`Ipossiemia (PaO₂ ${I.po2} mmHg < 60): insufficienza respiratoria ${pco2 > 45 ? 'di tipo 2 (ipossiemico-ipercapnica)' : 'di tipo 1 (ipossiemica)'}.`);
      if (has(I.map)) ox.oi = r(F.oi(I.map, fio2, I.po2), 1);
      if (has(I.hb) && has(I.sao2)) ox.cao2 = r(F.cao2(I.hb, I.sao2, I.po2), 1);
      if (has(I.peep)) ox.peep = I.peep;
      out.oxy = ox;
    }
    if (has(I.spo2) && has(fio2)) {
      out.oxy = out.oxy || {};
      if (I.spo2 <= 97) {
        const sf = I.spo2 / fio2;
        out.oxy.sf = r(sf, 0);
        out.oxy.sfClass = sf > 315 ? 'Nessun criterio ARDS (S/F > 315)' : sf > 235 ? 'Lieve (235 < S/F ≤ 315)' : sf > 148 ? 'Moderata (148 < S/F ≤ 235)' : 'Grave (S/F ≤ 148)';
      } else out.oxy.sfNote = 'S/F non valido con SpO₂ > 97% (curva di dissociazione piatta) — Global Definition ARDS 2023.';
    }

    // --- Ventilazione ---
    const vent = {};
    if (has(I.etco2)) {
      vent.gradient = r(pco2 - I.etco2, 1);
      vent.avdsf = r((pco2 - I.etco2) / pco2, 2);   // frazione di spazio morto alveolare (non VD/VT totale)
      vent.interp = (pco2 - I.etco2) > 5 ? 'Gradiente PaCO₂–EtCO₂ aumentato (> 5 mmHg): ↑ spazio morto alveolare (bassa portata, embolia polmonare, iperdistensione/PEEP eccessiva, ARDS, ipovolemia).' : 'Gradiente PaCO₂–EtCO₂ nella norma (2–5 mmHg).';
    }
    if (has(I.ve) && has(I.pco2Target) && I.pco2Target > 0) {
      vent.veTarget = r(F.veTarget(I.ve, pco2, I.pco2Target), 1);
      vent.veNote = 'Assume VCO₂ e spazio morto costanti; con VD/VT elevato servono aumenti maggiori: modificare preferibilmente la FR (mantenendo VT 6 mL/kg PBW) e ricontrollare EGA dopo 20–30 min.';
    }
    if (has(I.height) && (I.sex === 'M' || I.sex === 'F')) {
      vent.pbw = r(F.pbw(I.sex, I.height), 1);
      vent.vt6 = r(vent.pbw * 6, 0); vent.vt8 = r(vent.pbw * 8, 0);
      if (has(I.ve)) {
        vent.vr = r(F.ventRatio(I.ve, pco2, F.pbw(I.sex, I.height)), 2);
        vent.vrInterp = vent.vr > 2 ? 'Ventilatory ratio > 2: elevato spazio morto, associato a mortalità aumentata nell\'ARDS.' : vent.vr > 1.3 ? 'Ventilatory ratio moderatamente aumentato.' : 'Ventilatory ratio vicino a 1 (normale).';
      }
    }
    if (Object.keys(vent).length) out.vent = vent;

    // --- Terapia: deficit di bicarbonato (solo informativo) ---
    const hco3TargetV = has(I.hco3Target) ? I.hco3Target : 22;
    if (has(I.weight) && I.weight > 0 && hco3 < hco3TargetV) {
      const target = hco3TargetV;
      const def = Math.max(0, F.hco3Deficit(I.weight, target, hco3));
      const defBE = F.beDeficit(I.weight, Math.min(0, sbe));
      out.therapy = {
        target, deficit: r(def, 0), deficitBE: r(defBE, 0),
        ml84: r(def, 0), ml14: r(def / 0.1667, 0), half: r(def / 2, 0),
        note: 'NaHCO₃ 8.4% = 1 mEq/mL; 4.2% = 0.5 mEq/mL; 1.4% = 0.167 mEq/mL. Somministrare metà del deficit e rivalutare con EGA. Evidenze: acidemia metabolica grave (pH ≤ 7.20) con AKI KDIGO 2–3 → BICAR-ICU (2018) beneficio nel sottogruppo AKI, ma BICARICU-2 (JAMA 2025) nessuna riduzione della mortalità a 90 giorni, con meno ricorso alla dialisi (35% vs 50%) e bilancio idrico più positivo; SSC 2021: suggerito se pH ≤ 7.20 con AKI, non per l\'iperlattatemia da ipoperfusione con pH > 7.20; DKA: solo se pH < 7.0 (consenso ADA/EASD 2024). Indicazioni consolidate: NAGMA con perdita di HCO₃⁻, iperkaliemia, intossicazioni (TCA, salicilati). Richiede capacità di eliminare la CO₂ prodotta (↑VE): rischio di acidosi intracellulare paradossa, ipernatriemia, sovraccarico, ↓Ca²⁺ ionizzato, ipokaliemia.'
      };
    }

    // --- Sintesi disturbi ---
    const add = (code, label, detail) => { if (!out.disorders.find(d => d.code === code)) out.disorders.push({ code, label, detail: detail || '' }); };
    // Tipo di acidosi metabolica: 'HAGMA' | 'NAGMA' | 'MIXED' | 'UNK'
    let maType = 'UNK';
    if (agInfo) {
      if (agInfo.status === 'elevato') maType = (delta && delta.ratio != null && delta.ratio < 0.8) ? 'MIXED' : 'HAGMA';
      else maType = 'NAGMA';
    }
    out.maType = maType;
    const maLabel = () => ({
      UNK: LABEL.MA + ' (gap anionico non calcolabile: inserire Na⁺ e Cl⁻)',
      HAGMA: LABEL.MA + ' a gap anionico elevato (HAGMA)',
      NAGMA: LABEL.MA + ' a gap anionico normale, ipercloremica (NAGMA)',
      MIXED: LABEL.MA + ' mista: gap anionico elevato + gap normale (HAGMA + NAGMA)'
    })[maType];
    const respLabel = (c) => LABEL[c] + (respAcuity && primary.length === 1 && primary[0] === c ? ' ' + respAcuity : '');

    const order = primary.concat(extra);
    for (const c of order) {
      const isPrim = primary.includes(c);
      const lbl = c === 'MA' ? maLabel() : isResp(c) ? respLabel(c) : LABEL[c];
      add(c, lbl, isPrim ? (primary.length > 1 ? 'primario (misto)' : 'primario') : 'concomitante (da analisi del compenso)');
    }
    if (agInfo) {
      const hasMAnow = out.disorders.some(d => d.code === 'MA');
      const mk = hco3 >= REF.HCO3[0] ? ' mascherata' : '';
      if (!hasMAnow && agInfo.use >= 20) add('MA', LABEL.MA + ' a gap anionico elevato (HAGMA)' + mk, 'rilevata dal gap anionico: AG ≥ 20 indica acidosi metabolica indipendentemente da pH e HCO₃⁻');
      else if (!hasMAnow && agInfo.status === 'elevato') add('MA', LABEL.MA + ' a gap anionico elevato (HAGMA) probabile' + mk, `rilevata dal gap anionico (AG ${agInfo.use} > ${agHi}): verificare lattati/chetoni`);
      if (delta && delta.ratio != null && agInfo.status === 'elevato' && delta.ratio > 2) add('MAlk', LABEL.MAlk, 'concomitante (Δ/Δ > 2)');
      if (delta && delta.ratio == null && agInfo.status === 'elevato' && delta.corrHigh) add('MAlk', LABEL.MAlk, `concomitante (HCO₃⁻ corretto > ${r(delta.base + 2, 1)})`);
    }

    // Eziologie / gestione
    for (const d of out.disorders) {
      if (d.code === 'MA') {
        if (maType === 'HAGMA' || maType === 'MIXED' || maType === 'UNK') out.etiologyKeys.push('HAGMA');
        if (maType === 'NAGMA' || maType === 'MIXED' || maType === 'UNK') out.etiologyKeys.push('NAGMA');
      }
      if (d.code === 'MAlk') out.etiologyKeys.push(has(I.uCl) ? (I.uCl < 20 ? 'MAlk_CR' : 'MAlk_CRes') : 'MAlk');
      if (d.code === 'RA') out.etiologyKeys.push(respAcuity === 'cronica' ? 'RA_chronic' : 'RA_acute');
      if (d.code === 'RAlk') out.etiologyKeys.push('RAlk');
    }
    if (has(I.lac) && I.lac > 2) out.etiologyKeys.push('LACT');
    out.etiologyKeys = [...new Set(out.etiologyKeys)];

    // Diagnosi integrata
    if (out.disorders.length === 0) {
      out.diagnosis = 'Equilibrio acido-base nella norma.';
      if (agInfo && agInfo.status !== 'normale' && agInfo.status !== 'ai limiti superiori') out.diagnosis += ' (Verificare gap anionico.)';
    } else {
      const parts = out.disorders.map((d, i) => d.label + (i === 0 && primary.length === 1 && compStatus && !/disturbo misto/.test(compStatus) ? ` — ${compStatus}` : ''));
      out.diagnosis = parts.join(' + ');
      if (out.disorders.length >= 3) out.diagnosis = 'TRIPLO DISTURBO: ' + out.diagnosis;
      else if (out.disorders.length === 2) out.diagnosis = 'DISTURBO MISTO: ' + out.diagnosis;
    }
    out.primaryNote = primaryNote;

    // Steps descrittivi
    out.steps.push({ n: 2, t: 'Disturbo primario', txt: primary.length ? primary.map(c => LABEL[c]).join(' + ') + (primaryNote ? ' — ' + primaryNote : '') : 'Nessuna alterazione primaria di PaCO₂/HCO₃⁻.' });
    out.steps.push({ n: 3, t: 'Compenso', txt: (compStatus ? 'Stato: ' + compStatus + '. ' : '') + out.compChecks.map(c => c.text).join(' ') });
    if (agInfo) out.steps.push({ n: 4, t: 'Gap anionico / Δ-Δ', txt: `AG ${agInfo.ag}${has(agInfo.agc) ? ' (corretto ' + agInfo.agc + ')' : ''} → ${agInfo.status}. ${delta && delta.ratio != null ? 'Δ/Δ ' + delta.ratio + ': ' + delta.interp : (delta && (delta.interp || delta.naNote)) || ''}` });

    // Azioni sintetiche prioritarie
    if (pH < 7.20) out.actions.push('Acidemia grave: ricerca e trattamento immediato della causa; valutare supporto ventilatorio/emodinamico; considerare NaHCO₃ se pH ≤ 7.20 con AKI KDIGO 2–3 (riduce il ricorso alla dialisi, non la mortalità — BICARICU-2) o perdita di bicarbonato.');
    if (pH > 7.55) out.actions.push('Alcalemia grave: rischio di aritmie, convulsioni, ↓Ca²⁺ ionizzato, ↓K⁺; correggere causa ed elettroliti, ridurre ventilazione minuto se iatrogena.');
    if (pco2 > 60 && pH < 7.25) out.actions.push('Ipercapnia con acidemia: valutare NIV/ventilazione invasiva o ottimizzazione dei parametri (↑FR/VT entro i limiti protettivi).');
    if (has(I.k) && I.k < 3.0) out.actions.push('Ipokaliemia significativa: correggere prima/durante la correzione dell\'acidosi (l\'alcalinizzazione abbassa ulteriormente il K⁺).');
    if (has(I.k) && I.k > 6.0) out.actions.push('Iperkaliemia: protocollo di trattamento urgente (calcio, insulina-glucosio, β2-agonisti, NaHCO₃ se acidosi, dialisi).');

    out.ok = true;
    return out;
  }

  // ------------------------------------------------------------------
  // Casi di validazione (valori coerenti con Henderson-Hasselbalch)
  // ------------------------------------------------------------------
  const CASES = [
    { id: 'C01', name: 'Normale', input: { pH: 7.39, pco2: 40, hco3: 24, na: 140, cl: 104, alb: 4.0 },
      expect: { primary: [], disorders: [], agStatus: 'normale' } },
    { id: 'C02', name: 'Chetoacidosi diabetica (HAGMA pura, compenso appropriato)', input: { pH: 7.27, pco2: 22, hco3: 10, na: 135, cl: 100, k: 5.5, alb: 4.0, glu: 520, urea: 60 },
      expect: { primary: ['MA'], compVerdict: 'appropriato', comp: 'parzialmente compensato', agStatus: 'elevato', ag: 25, ratioRange: [0.8, 2.0], disorders: ['MA'] } },
    { id: 'C03', name: 'Acidosi respiratoria acuta (sedazione/oppioidi)', input: { pH: 7.25, pco2: 60, hco3: 26 },
      expect: { primary: ['RA'], acuity: 'acuta', compVerdict: 'appropriato', disorders: ['RA'] } },
    { id: 'C04', name: 'Acidosi respiratoria cronica (BPCO)', input: { pH: 7.33, pco2: 60, hco3: 31 },
      expect: { primary: ['RA'], acuity: 'cronica', compVerdict: 'appropriato', comp: 'parzialmente compensato', disorders: ['RA'] } },
    { id: 'C05', name: 'Alcalosi metabolica da vomito/SNG', input: { pH: 7.51, pco2: 46, hco3: 36, na: 138, cl: 88, uCl: 8 },
      expect: { primary: ['MAlk'], compVerdict: 'appropriato', disorders: ['MAlk'], etiology: 'MAlk_CR' } },
    { id: 'C06', name: 'Arresto cardiaco: acidosi mista', input: { pH: 7.09, pco2: 50, hco3: 15, na: 140, cl: 100, lac: 9 },
      expect: { primary: ['RA', 'MA'], disorders: ['RA', 'MA'] } },
    { id: 'C07', name: 'Salicilati: alcalosi respiratoria + acidosi metabolica', input: { pH: 7.46, pco2: 20, hco3: 14, na: 140, cl: 103, chronicity: 'acute' },
      expect: { primary: ['RAlk'], acuity: 'acuta', compVerdict: 'fuori range (basso)', extra: 'MA', disorders: ['RAlk', 'MA'] } },
    { id: 'C08', name: 'HAGMA + alcalosi metabolica (Δ/Δ > 2)', input: { pH: 7.32, pco2: 35, hco3: 18, na: 140, cl: 92, alb: 4.0 },
      expect: { primary: ['MA'], compVerdict: 'appropriato', comp: 'parzialmente compensato', agStatus: 'elevato', ratioRange: [2.01, 10], disorders: ['MA', 'MAlk'] } },
    { id: 'C09', name: 'Diarrea: NAGMA ipercloremica', input: { pH: 7.30, pco2: 29, hco3: 14, na: 138, cl: 115, alb: 4.0, uNa: 30, uK: 20, uCl: 80 },
      expect: { primary: ['MA'], compVerdict: 'appropriato', agStatus: 'normale', disorders: ['MA'], etiology: 'NAGMA', uagNeg: true } },
    { id: 'C10', name: 'HAGMA mascherata da ipoalbuminemia', input: { pH: 7.31, pco2: 40, hco3: 20, na: 140, cl: 108, alb: 2.0 },
      expect: { agStatus: 'elevato', agc: 17, masked: true } },
    { id: 'C11', name: 'Alcalosi respiratoria cronica completamente compensata', input: { pH: 7.44, pco2: 30, hco3: 20 },
      expect: { primary: ['RAlk'], acuity: 'cronica', comp: 'completamente compensato', disorders: ['RAlk'] } },
    { id: 'C12', name: 'Gradiente A-a in aria ambiente (60 anni)', input: { pH: 7.40, pco2: 40, hco3: 24.4, po2: 90, fio2: 0.21, age: 60, patm: 760 },
      expect: { PAO2: 101.8, aa: 11.8, pf: 429 } },
    { id: 'C13', name: 'Acidosi resp. con alcalosi metabolica (diuretici + ipercapnia)', input: { pH: 7.40, pco2: 60, hco3: 36.6 },
      expect: { primaryAny: ['RA', 'MAlk'] } },
    { id: 'C14', name: 'Incoerenza interna (HCO₃⁻ errato)', input: { pH: 7.40, pco2: 40, hco3: 30 },
      expect: { consistency: 'incoerente' } },
    { id: 'C15', name: 'Post-CEC: acidosi ipercloremica + lattica', input: { pH: 7.32, pco2: 33, hco3: 17, na: 141, cl: 114, alb: 2.8, lac: 3.5, k: 4.2, ica: 1.1, mg: 0.9, phos: 1.2 },
      expect: { primary: ['MA'], compVerdict: 'appropriato', agStatus: 'ai limiti superiori', ratioRange: [0, 0.4], disorders: ['MA'], etiology: 'NAGMA', stewartNaClNeg: true } },
    { id: 'C16', name: 'Post-CEC con ipoventilazione (Winter superato)', input: { pH: 7.29, pco2: 36, hco3: 17, na: 141, cl: 114, alb: 2.8 },
      expect: { primary: ['MA'], compVerdict: 'insufficiente', disorders: ['MA', 'RA'] } },
    // --- Regressione audit v1.1.0 ---
    { id: 'C17', name: 'Alcalosi resp. cronica con elettroliti: Δ/Δ non applicabile', input: { pH: 7.44, pco2: 30, hco3: 20, na: 140, cl: 108, alb: 4.0 },
      expect: { primary: ['RAlk'], disorders: ['RAlk'], agStatus: 'normale', deltaNA: true } },
    { id: 'C18', name: '"Includi K⁺" senza K⁺: AG confrontato con 12', input: { pH: 7.27, pco2: 22, hco3: 10, na: 135, cl: 100, alb: 4.0, useK: true },
      expect: { ag: 25, agNormal: 12, agStatus: 'elevato', disorders: ['MA'] } },
    { id: 'C19', name: 'AG elevato con Δ/Δ < 0.4: HAGMA + NAGMA', input: { pH: 7.20, pco2: 22, hco3: 8.5, na: 140, cl: 115.5, alb: 4.0 },
      expect: { primary: ['MA'], compVerdict: 'appropriato', agStatus: 'elevato', ratioRange: [0, 0.4], maType: 'MIXED', etiology: 'NAGMA', disorders: ['MA'] } },
    { id: 'C20', name: 'BPCO cronica + acidosi lattica: base HCO₃⁻ = atteso cronico', input: { pH: 7.20, pco2: 60, hco3: 23, na: 140, cl: 97, alb: 4.0, chronicity: 'chronic' },
      expect: { primary: ['RA'], comp: 'non appropriato → disturbo misto', disorders: ['RA', 'MA'], absent: 'MAlk', ratioRange: [0.8, 2.0] } },
    { id: 'C21', name: 'Acidosi metabolica lieve: compenso atteso minimo', input: { pH: 7.34, pco2: 40, hco3: 21.2 },
      expect: { primary: ['MA'], compVerdict: 'appropriato', comp: 'compenso atteso minimo (disturbo lieve)', disorders: ['MA'] } }
  ];

  function close(a, b, tol) { return a != null && Math.abs(a - b) <= tol; }

  function runValidation() {
    const results = [];
    for (const c of CASES) {
      const res = analyze(c.input);
      const checks = [];
      const e = c.expect;
      const codes = res.disorders.map(d => d.code);
      const push = (label, pass, got) => checks.push({ label, pass: !!pass, got });
      // coerenza H-H del caso stesso
      if (c.input.hco3 != null && c.id !== 'C14') {
        const hh = F.hco3HH(c.input.pH, c.input.pco2);
        push('Caso coerente (H-H ± 10%)', Math.abs(hh - c.input.hco3) <= Math.max(1, 0.1 * hh), r(hh, 1));
      }
      if (e.primary) push('Disturbo primario = ' + (e.primary.join('+') || 'nessuno'), JSON.stringify(res.primary) === JSON.stringify(e.primary), res.primary.join('+') || 'nessuno');
      if (e.primaryAny) push('Primario tra ' + e.primaryAny.join('/'), res.primary.some(p => e.primaryAny.includes(p)), res.primary.join('+'));
      if (e.comp) push('Compenso = ' + e.comp, res.compStatus === e.comp, res.compStatus);
      if (e.compVerdict) push('Appropriatezza = ' + e.compVerdict, res.compChecks[0] && res.compChecks[0].verdict === e.compVerdict, res.compChecks[0] && res.compChecks[0].verdict);
      if (e.acuity) push('Cronicità = ' + e.acuity, res.respAcuity === e.acuity, res.respAcuity);
      if (e.extra) push('Disturbo concomitante ' + e.extra, codes.includes(e.extra), codes.join('+'));
      if (e.disorders) push('Disturbi = ' + (e.disorders.join('+') || 'nessuno'), JSON.stringify(codes) === JSON.stringify(e.disorders), codes.join('+') || 'nessuno');
      if (e.agStatus) push('AG ' + e.agStatus, res.ag && res.ag.status === e.agStatus, res.ag && res.ag.status);
      if (e.ag != null) push('AG = ' + e.ag, res.ag && close(res.ag.ag, e.ag, 0.2), res.ag && res.ag.ag);
      if (e.agc != null) push('AG corretto = ' + e.agc, res.ag && close(res.ag.agc, e.agc, 0.2), res.ag && res.ag.agc);
      if (e.masked) push('HAGMA mascherata segnalata', res.ag && res.ag.masked, res.ag && res.ag.masked);
      if (e.ratioRange) push(`Δ/Δ in [${e.ratioRange.join('–')}]`, res.delta && res.delta.ratio >= e.ratioRange[0] && res.delta.ratio <= e.ratioRange[1], res.delta && res.delta.ratio);
      if (e.etiology) push('Eziologia ' + e.etiology, res.etiologyKeys.includes(e.etiology), res.etiologyKeys.join(','));
      if (e.uagNeg) push('UAG negativo', res.uag && res.uag.value < 0, res.uag && res.uag.value);
      if (e.PAO2 != null) push('PAO₂ = ' + e.PAO2, res.oxy && close(res.oxy.PAO2, e.PAO2, 0.3), res.oxy && res.oxy.PAO2);
      if (e.aa != null) push('Gradiente A-a = ' + e.aa, res.oxy && close(res.oxy.aa, e.aa, 0.3), res.oxy && res.oxy.aa);
      if (e.pf != null) push('P/F = ' + e.pf, res.oxy && close(res.oxy.pf, e.pf, 1), res.oxy && res.oxy.pf);
      if (e.consistency) push('Coerenza = ' + e.consistency, res.v.consistency === e.consistency, res.v.consistency);
      if (e.deltaNA) push('Δ/Δ non interpretato (nessuna acidosi metabolica)', res.delta && res.delta.ratio == null && !res.delta.interp, res.delta && (res.delta.ratio != null ? res.delta.ratio : res.delta.interp));
      if (e.agNormal != null) push('AG di riferimento = ' + e.agNormal, res.ag && res.ag.normal === e.agNormal, res.ag && res.ag.normal);
      if (e.maType) push('Tipo di acidosi metabolica = ' + e.maType, res.maType === e.maType, res.maType);
      if (e.absent) push('Assente: ' + e.absent, !codes.includes(e.absent), codes.join('+'));
      if (e.stewartNaClNeg) push('Effetto Na–Cl negativo (Stewart)', res.stewart && res.stewart.beNaCl < 0, res.stewart && res.stewart.beNaCl);
      results.push({ id: c.id, name: c.name, pass: checks.every(x => x.pass), checks, diagnosis: res.diagnosis });
    }
    return results;
  }

  return { VERSION, REF, F, analyze, CASES, runValidation, kPa2mmHg, round: r };
});
