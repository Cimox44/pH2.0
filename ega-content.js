/* EGA Analyzer — contenuti clinici (disamina disturbi, formule, riferimenti) */
(function (root) {
'use strict';

const T = (head, rows) => `<div class="tw"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;

const DISORDERS = [
{
  key: 'HAGMA', title: 'Acidosi metabolica a gap anionico elevato (HAGMA)', tag: 'MA',
  html: `
<h4>Fisiopatologia</h4>
<p>Accumulo di un acido forte (H⁺ + anione non misurato). L'H⁺ è tamponato dal HCO₃⁻, l'anione resta in circolo e aumenta il gap anionico. In un'acidosi "pura" la caduta di HCO₃⁻ è circa uguale all'aumento di AG (Δ/Δ ≈ 1–2).</p>
<h4>Criteri EGA</h4>
${T(['Parametro', 'Valore'], [['pH', '< 7.35 (può essere normale se disturbo misto)'], ['HCO₃⁻', '< 22 mmol/L'], ['SBE', '< −2 mmol/L'], ['AG (corretto per albumina)', '> 12 ± 2 mmol/L (> 16 se incluso K⁺)'], ['Compenso atteso', 'PaCO₂ = 1.5·HCO₃⁻ + 8 ± 2 (Winter)'], ['Insorgenza compenso', 'minuti–ore, massimo a 12–24 h']])}
<h4>Eziologia — acronimo GOLDMARK</h4>
${T(['Lettera', 'Causa', 'Indizi diagnostici'], [
 ['G', 'Glicoli (etilenico, propilenico — infusioni di lorazepam/fenobarbital)', 'Gap osmolare ↑, cristalli di ossalato (etilenglicole), IRA'],
 ['O', '5-Oxoprolina (piroglutammico)', 'Paracetamolo cronico + malnutrizione, sepsi, sesso F'],
 ['L', 'L-lattato (tipo A ipoperfusione; tipo B farmaci/tossine)', 'Lattati > 2–4 mmol/L, ScvO₂, ΔPCO₂ v-a, refill capillare'],
 ['D', 'D-lattato', 'Sindrome dell\'intestino corto, by-pass digiuno-ileale; lattato standard normale'],
 ['M', 'Metanolo', 'Gap osmolare ↑, disturbi visivi'],
 ['A', 'Aspirina (salicilati)', 'Alcalosi respiratoria associata, acufeni'],
 ['R', 'Renal failure (uremia)', 'Urea/creatinina ↑, AG raramente > 20'],
 ['K', 'Ketoacidosi (diabetica, alcolica, da digiuno; SGLT2-i euglicemica)', 'β-idrossibutirrato > 3 mmol/L, glicemia (normale nella DKA euglicemica)']])}
<p class="mut">Alternativa classica MUDPILES: Metanolo, Uremia, DKA, Paraldeide/Propofol, Isoniazide/Ferro, Lattati, Etilenglicole, Salicilati.</p>
<h4>Approccio diagnostico</h4>
<ol><li>Correggere AG per albumina (+2.5 per ogni g/dL &lt; 4).</li><li>Lattati, chetoni (β-OHB), urea/creatinina, glicemia.</li><li>Se causa non evidente: gap osmolare (> 10 → alcoli tossici), salicilemia, paracetamolo.</li><li>Δ/Δ: &lt; 0.8 → NAGMA associata; &gt; 2 → alcalosi metabolica associata.</li><li>Verificare Winter: PaCO₂ fuori range → disturbo respiratorio associato.</li></ol>
<h4>Risoluzione / gestione</h4>
${T(['Causa', 'Trattamento'], [
 ['Acidosi lattica tipo A', 'Ripristino della perfusione: fluidi guidati da indici dinamici, vasopressori/inotropi (MAP ≥ 65), Hb adeguata, controllo della fonte settica; clearance del lattato a 2–6 h come target'],
 ['Acidosi lattica tipo B', 'Sospendere il farmaco (adrenalina → effetto β2 glicolitico, metformina, linezolid, propofol), tiamina 200–500 mg e.v. se deficit, trattare insufficienza epatica'],
 ['DKA (consenso ADA/EASD 2024)', 'Diagnosi D-K-A: glicemia ≥ 200 mg/dL <i>o</i> diabete noto (include la DKA euglicemica) + β-OHB ≥ 3,0 mmol/L (o chetonuria ≥ 2+) + pH < 7,30 e/o HCO₃⁻ < 18. Gravità: lieve pH > 7,25 e HCO₃⁻ ≥ 15 · moderata pH 7,00–7,25, HCO₃⁻ 10–15 · grave pH < 7,00, HCO₃⁻ < 10 o β-OHB > 6. Terapia: cristalloidi (bilanciati preferibili) 500–1000 mL/h nelle prime 2–4 h (boli più piccoli in cardiopatici/nefropatici), insulina e.v. 0,1 UI/kg/h solo con K⁺ ≥ 3,5, K⁺ se < 5,0 (target 4–5), destrosio 5–10% quando glicemia < 250 mg/dL; monitoraggio con β-OHB (o chiusura del gap) e pH venoso ogni 4 h'],
 ['DKA euglicemica (SGLT2-i)', 'Sospettarla in ogni paziente in gliflozina con HAGMA anche se glicemia < 250 mg/dL (digiuno, chirurgia, infezione, riduzione dell\'insulina): dosare β-OHB. Terapia come DKA, con destrosio fin dall\'inizio insieme all\'insulina. Perioperatorio (SPAQI, BJA 2026): sospendere 3 giorni prima (4 per ertugliflozin) nei diabetici candidati a chirurgia maggiore, bariatrica o <b>cardiochirurgia</b> senza scompenso/IRC; se proseguita (scompenso, IRC) monitoraggio intensivo di gap anionico e chetoni; riprendere con alimentazione regolare. Un AG normale rende improbabile una eDKA clinicamente rilevante'],
 ['Alcoli tossici', 'Fomepizolo (o etanolo), emodialisi, folati (metanolo), tiamina/piridossina (glicole)'],
 ['Uremia', 'Terapia sostitutiva renale se pH < 7.15, iperK⁺, sovraccarico'],
 ['NaHCO₃', 'Acidemia metabolica grave (pH ≤ 7.20) + AKI KDIGO 2–3: BICAR-ICU (2018) beneficio nel sottogruppo AKI; BICARICU-2 (JAMA 2025): nessuna riduzione della mortalità a 90 gg, meno KRT (35% vs 50%), bilancio idrico più positivo → opzione per ritardare/evitare la KRT, non terapia salvavita. SSC 2026: suggerito nello shock settico con pH ≤ 7.20 e AKI stadio 2–3 (certezza molto bassa); sconsigliato per migliorare l\'emodinamica/ridurre i vasopressori nell\'acidemia lattica da ipoperfusione. SODa-BIC (NEJM 2026; shock con vasopressori, pH < 7.30, BE ≤ −4): nessuna riduzione di MAKE30 né della mortalità, più ipokaliemia → non di routine nell\'acidosi moderata. Prerequisito: capacità di eliminare la CO₂ prodotta. DKA: solo se pH < 7.0 (ADA/EASD 2024)']])}
<div class="pearl"><b>Cardiochirurgia:</b> l'iperlattatemia post-CEC è frequentemente di tipo B (adrenalina, iperglicemia, stress) e si risolve in 12–24 h; un lattato in aumento con ScvO₂ bassa, oliguria e ΔPCO₂ v-a > 6 mmHg suggerisce bassa portata (tipo A) → valutazione emodinamica/eco urgente.</div>`
},
{
  key: 'NAGMA', title: 'Acidosi metabolica a gap normale / ipercloremica (NAGMA)', tag: 'MA',
  html: `
<h4>Fisiopatologia</h4>
<p>Perdita di HCO₃⁻ (GI o renale), ridotta escrezione renale di H⁺/NH₄⁺, oppure aggiunta di Cl⁻ (riduzione del SID secondo Stewart). Il Cl⁻ sostituisce l'HCO₃⁻ perso: AG invariato.</p>
<h4>Criteri EGA</h4>
${T(['Parametro', 'Valore'], [['pH', '< 7.35'], ['HCO₃⁻', '< 22 mmol/L'], ['Cl⁻', '↑ (> 106–110 mmol/L)'], ['AG corretto', 'normale'], ['Δ/Δ', '< 0.4 (pura) · 0.4–0.8 se HAGMA associata'], ['Stewart', 'Na⁺ − Cl⁻ < 32 · effetto Na–Cl sul BE negativo']])}
<h4>Eziologia — acronimo ACCRUED / HARDASS</h4>
${T(['Gruppo', 'Cause', 'UAG'], [
 ['Gastrointestinali', 'Diarrea, fistole pancreatiche/biliari/enteriche, ileostomia ad alta portata, ureterosigmoidostomia, colestiramina', 'NEGATIVO'],
 ['Iatrogene', 'NaCl 0.9% in grandi volumi, priming CEC, nutrizione parenterale (aminoacidi cloridrati), HCl/NH₄Cl', 'negativo'],
 ['Renali tubulari', 'RTA distale (tipo 1), RTA prossimale (tipo 2, Fanconi), tipo 4 (ipoaldosteronismo, ACE-i/ARB, spironolattone, trimetoprim, eparina, FANS, ciclosporina/tacrolimus)', 'POSITIVO (tipo 2 variabile)'],
 ['Farmaci', 'Acetazolamide, topiramato', 'positivo'],
 ['Altre', 'IRC iniziale, fase di recupero della DKA (chetoni persi come sali), espansione volemica (diluizione)', 'variabile']])}
<h4>Strumenti diagnostici</h4>
${T(['Test', 'Formula', 'Interpretazione'], [
 ['Gap anionico urinario (UAG)', 'Na⁺u + K⁺u − Cl⁻u', 'Negativo (−20/−50) → NH₄⁺ adeguato, causa GI · Positivo → RTA/IRC'],
 ['Gap osmolare urinario (UOG)', 'Osm u − [2·(Na⁺u + K⁺u) + urea u + glucosio u] (tutti in mmol/L; da mg/dL: BUN/2.8, glucosio/18)', 'NH₄⁺u ≈ UOG/2. In acidosi con NH₄⁺ adeguato UOG elevato (> 150); UOG basso (< 150, spesso < 40 nella RTA) → escrezione di NH₄⁺ ridotta (RTA, IRC). Più affidabile dell\'UAG in presenza di chetoni o altri anioni urinari'],
 ['pH urinario', '—', '> 5.5 con acidemia → RTA distale'],
 ['K⁺ sierico', '—', 'Basso: GI, RTA 1–2 · Alto: RTA 4, IRC']])}
<h4>Risoluzione / gestione</h4>
<ul><li><b>Iatrogena ipercloremica:</b> sostituire NaCl 0.9% con cristalloidi bilanciati (Ringer lattato/acetato, Plasma-Lyte). Evidenze: SMART (2018) riduzione modesta degli eventi renali maggiori (MAKE30); BaSICS e PLUS (2021–2022) nessuna differenza di mortalità né di KRT. SSC 2026: cristalloidi bilanciati suggeriti rispetto a NaCl 0,9% nella rianimazione iniziale della sepsi (certezza moderata); nel trauma cranico preferire NaCl 0,9%.</li>
<li><b>Perdite GI:</b> reintegro volemico e di K⁺; NaHCO₃ o citrato di K per HCO₃⁻ &lt; 15–18 o pH &lt; 7.20, perché qui l'HCO₃⁻ è perso e non rigenerabile da anioni metabolizzabili.</li>
<li><b>RTA:</b> alcali orali (citrato/bicarbonato), correzione di K⁺; tipo 4 → sospendere farmaci causali, fludrocortisone, diuretici dell'ansa, patiromer.</li>
<li><b>Acetazolamide:</b> rivalutare l'indicazione; attenzione all'acidosi nei BPCO ipercapnici.</li></ul>
<div class="pearl"><b>Cardiochirurgia:</b> la NAGMA dopo CEC (priming e cardioplegia ricchi in Cl⁻, emodiluizione) è frequente, generalmente autolimitante e ben tollerata; distinguerla dalla componente lattica con AG corretto e Δ/Δ evita trattamenti inappropriati.</div>`
},
{
  key: 'MAlk', title: 'Alcalosi metabolica', tag: 'MAlk',
  html: `
<h4>Fisiopatologia</h4>
<p>Due fasi: <b>generazione</b> (perdita di H⁺ gastrica/renale, carico di alcali, contrazione volemica) e <b>mantenimento</b> (deplezione di Cl⁻ e volume, ipokaliemia, iperaldosteronismo che impediscono l'escrezione renale di HCO₃⁻).</p>
<h4>Criteri EGA</h4>
${T(['Parametro', 'Valore'], [['pH', '> 7.45'], ['HCO₃⁻', '> 26 mmol/L'], ['SBE', '> +2 mmol/L'], ['Compenso atteso', 'PaCO₂ = 0.7·HCO₃⁻ + 20 ± 5 (≈ +0.7 mmHg per mmol/L)'], ['Limite del compenso', 'PaCO₂ raramente > 55–60 mmHg (l\'ipossiemia limita l\'ipoventilazione)']])}
<h4>Classificazione per cloruro urinario</h4>
${T(['Cl⁻ urinario', 'Tipo', 'Cause'], [
 ['< 20 mmol/L', 'CLORO-RESPONSIVA (ipovolemica)', 'Vomito, aspirazione SNG, diuretici (dopo sospensione), alcalosi post-ipercapnica, adenoma villoso, cloridorrea congenita, fibrosi cistica'],
 ['> 20 mmol/L + ipertensione', 'CLORO-RESISTENTE con ↑ volume', 'Iperaldosteronismo primario, Cushing, stenosi arteria renale, liquirizia, eccesso di mineralcorticoidi esogeni'],
 ['> 20 mmol/L, normotensione', 'CLORO-RESISTENTE', 'Diuretici in atto, Bartter, Gitelman, ipokaliemia/ipomagnesiemia gravi'],
 ['Variabile', 'Carico di alcali', 'NaHCO₃, citrato (trasfusioni massive, CRRT con citrato), lattato/acetato, sindrome latte-alcali']])}
<h4>Risoluzione / gestione</h4>
<ul><li><b>Cloro-responsiva:</b> NaCl 0.9% + KCl; sospendere/ridurre diuretici; IPP se aspirazione SNG prolungata.</li>
<li><b>Ipokaliemia:</b> correggere sempre (KCl); il K⁺ basso mantiene l'alcalosi e aumenta l'aritmogenicità.</li>
<li><b>Sovraccarico volemico (non tollera NaCl):</b> acetazolamide 250–500 mg e.v./os (attenzione a K⁺ e PaCO₂), oppure spironolattone.</li>
<li><b>Alcalosi grave (pH &gt; 7.55–7.60) refrattaria:</b> HCl 0.1–0.2 N in vena centrale, oppure dialisi/CRRT con bagno a basso HCO₃⁻.</li>
<li><b>Post-ipercapnica:</b> ridurre la ventilazione gradualmente nei BPCO cronici; Cl⁻ e K⁺ per permettere l'escrezione di HCO₃⁻.</li></ul>
<div class="pearl"><b>Cardiochirurgia:</b> classica alcalosi da contrazione dopo furosemide in infusione + perdite di K⁺/Cl⁻, aggravata da citrato trasfusionale. L'alcalemia riduce il Ca²⁺ ionizzato, sposta a sinistra la curva di dissociazione dell'Hb e può ridurre il drive ventilatorio, ritardando lo svezzamento.</div>`
},
{
  key: 'RA', title: 'Acidosi respiratoria (acuta e cronica)', tag: 'RA',
  html: `
<h4>Fisiopatologia</h4>
<p>Ipoventilazione alveolare: produzione di CO₂ &gt; eliminazione (PaCO₂ ∝ VCO₂ / VA). Nella forma acuta il compenso è solo da tamponi non bicarbonato (Hb, proteine); nella cronica il rene aumenta il riassorbimento di HCO₃⁻ ed escrezione di NH₄⁺ (3–5 giorni).</p>
<h4>Criteri e compenso</h4>
${T(['Forma', 'ΔHCO₃⁻ per +10 mmHg PaCO₂', 'pH atteso', 'Limite HCO₃⁻'], [
 ['Acuta (< 24–48 h)', '+1 (0.1·ΔPaCO₂)', '7.40 − 0.008·ΔPaCO₂', '~ 30–32'],
 ['Cronica (> 3–5 gg)', '+3.5 (0.35·ΔPaCO₂; Boston: +4)', '7.40 − 0.003·ΔPaCO₂', '~ 45']])}
<h4>Eziologia</h4>
${T(['Livello', 'Cause'], [
 ['SNC (drive)', 'Oppioidi, benzodiazepine, propofol, anestetici residui, ictus troncale, ipotermia, ipotiroidismo, alcalosi metabolica grave, ossigenoterapia eccessiva nel BPCO'],
 ['Midollo / nervi', 'Lesione midollare alta, Guillain-Barré, SLA, lesione del frenico (post-cardiochirurgia, raffreddamento topico)'],
 ['Giunzione / muscoli', 'Curarizzazione residua, miastenia, ipoK⁺/ipoP/ipoMg, miopatia del critico, fatica muscolare'],
 ['Parete toracica / pleura', 'Volet costale, cifoscoliosi, obesità-ipoventilazione, versamento/PNX esteso, distensione addominale'],
 ['Vie aeree', 'Ostruzione alta, broncospasmo grave, BPCO riacutizzata, tappo di muco, malposizione del tubo'],
 ['Parenchima / spazio morto', 'ARDS, EPA, embolia polmonare massiva, iperinflazione dinamica (auto-PEEP)'],
 ['Iatrogena (ventilatore)', 'VE insufficiente, ipercapnia permissiva, ↑ spazio morto strumentale (HME, prolunghe), ↑ VCO₂ (febbre, brivido, nutrizione ipercalorica, NaHCO₃)']])}
<h4>Risoluzione / gestione</h4>
<ul><li>Trattare la causa: antagonisti (naloxone, flumazenil, sugammadex), broncodilatatori, drenaggio PNX/versamento, broncoaspirazione.</li>
<li><b>NIV</b> (BPCO con pH 7.25–7.35): IPAP/EPAP titolati; rivalutare EGA a 1–2 h.</li>
<li><b>Ventilazione invasiva:</b> ↑ VE preferibilmente con FR (VT 6–8 mL/kg PBW, Pplat &lt; 30, driving pressure &lt; 15), monitorare auto-PEEP nei pazienti ostruttivi (allungare Te).</li>
<li><b>Ipercapnia permissiva</b> (ARDS): accettabile pH ≥ 7.20–7.25; controindicata in ipertensione endocranica, ipertensione polmonare/disfunzione VD, aritmie gravi.</li>
<li>Ridurre spazio morto strumentale, controllare febbre e carico glucidico.</li>
<li><b>ECCO₂R / ECMO</b> nei casi refrattari.</li>
<li>NaHCO₃ non indicato (aumenta CO₂).</li></ul>
<div class="pearl"><b>Cardiochirurgia:</b> l'ipercapnia aumenta le resistenze vascolari polmonari e può precipitare la disfunzione ventricolare destra (post-MVR, post-trapianto, LVAD): in questi pazienti target di PaCO₂ 35–40 mmHg e pH &gt; 7.35.</div>`
},
{
  key: 'RAlk', title: 'Alcalosi respiratoria (acuta e cronica)', tag: 'RAlk',
  html: `
<h4>Fisiopatologia</h4>
<p>Iperventilazione alveolare con ipocapnia. Compenso acuto tramite tamponi intracellulari (lattato); compenso cronico renale con riduzione del riassorbimento di HCO₃⁻ (2–3 giorni). L'alcalosi respiratoria cronica è l'unico disturbo in cui il compenso può normalizzare il pH.</p>
<h4>Criteri e compenso</h4>
${T(['Forma', 'ΔHCO₃⁻ per −10 mmHg PaCO₂', 'pH atteso', 'Limite HCO₃⁻'], [
 ['Acuta', '−2 (0.2·ΔPaCO₂)', '7.40 + 0.008·ΔPaCO₂', '~ 18'],
 ['Cronica', '−4/−5 (0.4–0.5·ΔPaCO₂)', '7.40 + 0.003·ΔPaCO₂', '~ 12–15']])}
<h4>Eziologia</h4>
${T(['Gruppo', 'Cause'], [
 ['Ipossiemia', 'Polmonite, EPA, embolia polmonare, alta quota, anemia grave, shunt'],
 ['Stimolo centrale', 'Dolore, ansia, febbre, sepsi (precoce), lesioni del SNC, gravidanza (progesterone), insufficienza epatica, salicilati, teofillina, catecolamine'],
 ['Polmonare (recettori J)', 'Interstiziopatie, edema, embolia'],
 ['Iatrogena', 'Iperventilazione meccanica (VE eccessiva, autotrigger, ventilazione in modalità assistita con drive elevato)']])}
<h4>Risoluzione / gestione</h4>
<ul><li>Trattare la causa: analgesia, antipiretici, ossigenoterapia, trattamento della sepsi/embolia.</li>
<li><b>Ventilatore:</b> ↓ FR o VT; verificare autotrigger (perdite, trigger troppo sensibile, oscillazioni cardiache); sedazione adeguata se drive eccessivo e asincronie.</li>
<li>Correggere ipofosfatemia, ipokaliemia e Ca²⁺ ionizzato (spostamenti indotti dall'alcalemia).</li>
<li>Iperventilazione terapeutica nell'ipertensione endocranica: solo come ponte (PaCO₂ 30–35 mmHg), rischio di ischemia cerebrale.</li></ul>
<div class="pearl"><b>Segnale d'allarme:</b> in un paziente settico l'alcalosi respiratoria è spesso il primo segno; associata a HAGMA (sepsi + lattati, salicilati) produce pH quasi normali che ingannano.</div>`
},
{
  key: 'MIX', title: 'Disturbi misti e tripli', tag: 'MIX',
  html: `
<h4>Quando sospettarli</h4>
<ul><li>Compenso fuori dal range atteso (Winter, regole di Boston).</li><li>pH normale con PaCO₂ e HCO₃⁻ entrambi alterati (eccetto alcalosi respiratoria cronica).</li><li>PaCO₂ e HCO₃⁻ alterati in senso opposto (uno acido, uno alcalino nello stesso verso del pH): misto additivo.</li><li>AG ≥ 20 → acidosi metabolica presente qualunque sia il pH.</li><li>Δ/Δ &lt; 0.8 o &gt; 2.</li></ul>
<h4>Combinazioni frequenti in Terapia Intensiva</h4>
${T(['Combinazione', 'Pattern EGA', 'Scenario tipico'], [
 ['Acidosi metabolica + respiratoria', 'pH molto basso, HCO₃⁻ ↓, PaCO₂ ↑', 'Arresto cardiaco, shock con fatica respiratoria, EPA grave'],
 ['Alcalosi metabolica + respiratoria', 'pH molto alto, HCO₃⁻ ↑, PaCO₂ ↓', 'Cirrotico con vomito, iperventilazione meccanica + diuretici'],
 ['Acidosi metabolica + alcalosi respiratoria', 'pH ~normale, HCO₃⁻ ↓↓, PaCO₂ ↓↓', 'Sepsi, salicilati, epatopatia'],
 ['Acidosi respiratoria + alcalosi metabolica', 'pH ~normale, HCO₃⁻ ↑↑, PaCO₂ ↑↑', 'BPCO in diuretici/steroidi, post-ipercapnica'],
 ['HAGMA + alcalosi metabolica', 'AG ↑ con HCO₃⁻ quasi normale, Δ/Δ > 2', 'DKA con vomito, IRC con aspirazione SNG'],
 ['HAGMA + NAGMA', 'Δ/Δ 0.4–0.8', 'DKA in trattamento con NaCl, diarrea + shock, IRC'],
 ['Triplo disturbo', 'HAGMA + MAlk + RAlk/RA', 'DKA + vomito + sepsi/polmonite']])}`
},
{
  key: 'LACT', title: 'Iperlattatemia / acidosi lattica', tag: 'MA',
  html: `
${T(['Tipo', 'Meccanismo', 'Cause'], [
 ['A', 'Ipossia tissutale', 'Shock (settico, cardiogeno, ipovolemico), arresto cardiaco, ipossiemia grave, anemia grave, ischemia mesenterica/arti, CO'],
 ['B1', 'Malattie di base', 'Insufficienza epatica, neoplasie (effetto Warburg), DKA, sepsi (glicolisi aerobia adrenergica), feocromocitoma'],
 ['B2', 'Farmaci/tossine', 'Adrenalina, salbutamolo, metformina, propofol (PRIS), linezolid, NRTI, cianuro (nitroprussiato), alcoli, paracetamolo'],
 ['B3', 'Errori congeniti', 'Deficit di piruvato deidrogenasi, malattie mitocondriali, deficit di tiamina']])}
<p><b>Monitoraggio (SSC 2026):</b> misurare il lattato in ogni sospetta sepsi e ripeterlo per guidare la rianimazione (certezza bassa); dopo il bolo iniziale individualizzare i fluidi in base alla <i>riduzione</i> del lattato, senza proseguire fino alla sua normalizzazione (rischio di sovraccarico). Tempo di riempimento capillare suggerito come integrazione agli altri indici di perfusione (ANDROMEDA-SHOCK). Target pratico: riduzione ≥ 10–20% ogni 2 h nelle prime 6–8 h. MAP iniziale 65 mmHg (60–65 se ≥ 65 anni). NaHCO₃ non indicato per migliorare l'emodinamica.</p>
<p><b>Quadri ICU rilevanti:</b> la sepsi può dare iperlattatemia "aerobia" (adrenergica, tipo B) con perfusione adeguata; ΔPCO₂ cv-a &gt; 6 mmHg e ScvO₂ &lt; 70% orientano verso ipoperfusione (tipo A).</p>`
}
];

const FORMULAS = [
 ['Henderson-Hasselbalch', 'pH = 6.1 + log [HCO₃⁻ / (0.0307·PaCO₂)]', 'Coerenza interna del campione'],
 ['Henderson', '[H⁺] (nmol/L) = 24·PaCO₂ / HCO₃⁻', 'Verifica rapida; [H⁺] = 10^(9−pH)'],
 ['Standard Base Excess (Van Slyke)', 'SBE = 0.93·(HCO₃⁻ − 24.4 + 14.83·(pH − 7.4))', 'Componente metabolica indipendente dalla PaCO₂'],
 ['Winter (acidosi metabolica)', 'PaCO₂ atteso = 1.5·HCO₃⁻ + 8 ± 2', 'Alternativa: ultime 2 cifre del pH; ΔPaCO₂ ≈ SBE'],
 ['Alcalosi metabolica', 'PaCO₂ atteso = 0.7·HCO₃⁻ + 20 ± 5', 'Alternativa: ΔPaCO₂ = 0.6·SBE'],
 ['Acidosi respiratoria acuta', 'ΔHCO₃⁻ = 0.1·ΔPaCO₂ · pH = 7.40 − 0.008·ΔPaCO₂', 'Copenhagen: SBE invariato'],
 ['Acidosi respiratoria cronica', 'ΔHCO₃⁻ = 0.35·ΔPaCO₂ (Boston 0.4) · pH = 7.40 − 0.003·ΔPaCO₂', 'Copenhagen: ΔSBE = 0.4·ΔPaCO₂'],
 ['Alcalosi respiratoria acuta', 'ΔHCO₃⁻ = 0.2·ΔPaCO₂', '—'],
 ['Alcalosi respiratoria cronica', 'ΔHCO₃⁻ = 0.4–0.5·ΔPaCO₂', 'Unico disturbo con pH normalizzabile'],
 ['Gap anionico', 'AG = Na⁺ − (Cl⁻ + HCO₃⁻) [+ K⁺]', 'Valore classico 12 ± 2 (16 ± 2 con K⁺). Con gli analizzatori moderni a elettrodi ionoselettivi il range può essere più basso (es. 3–11): inserire nel calcolatore il valore del proprio laboratorio/emogasanalizzatore'],
 ['AG corretto per albumina (Figge)', 'AGc = AG + 2.5·(4.0 − Alb g/dL)', '= AG + 0.25·(40 − Alb g/L)'],
 ['Delta gap', 'ΔAG = AGc − 12 · ΔHCO₃⁻ = 24 − HCO₃⁻', '—'],
 ['Delta ratio', 'Δ/Δ = ΔAG / ΔHCO₃⁻', '< 0.4 NAGMA · 0.4–0.8 misto · 0.8–2 HAGMA · > 2 + MAlk. Si interpreta solo in presenza di acidosi metabolica. Nei disturbi respiratori primari ΔHCO₃⁻ va calcolato dall\'HCO₃⁻ atteso per il compenso (es. BPCO cronica), non da 24'],
 ['HCO₃⁻ corretto', 'HCO₃⁻ + ΔAG', '> 26 MAlk associata · < 22 NAGMA associata (riferimento: HCO₃⁻ di base ± 2)'],
 ['Osmolalità calcolata', '2·Na⁺ + Glu/18 + BUN/2.8 (+ EtOH/3.7)', 'mg/dL; BUN = Urea/2.14'],
 ['Gap osmolare', 'Osm misurata − Osm calcolata', '> 10 anomalo · > 20 alcoli tossici'],
 ['Na⁺ corretto per glicemia', 'Na + 1.6 (Katz) o 2.4 (Hillier) × (Glu − 100)/100', 'Iperglicemia, DKA/HHS'],
 ['Gap anionico urinario', 'UAG = Na⁺u + K⁺u − Cl⁻u', 'Negativo GI · positivo RTA'],
 ['Stewart: SID apparente', 'SIDa = Na + K + 2Ca²⁺ + 2Mg²⁺ − Cl − Lattato', 'Normale ~ 40–42 mEq/L'],
 ['Stewart: SID effettivo', 'SIDe = HCO₃⁻ + Alb·(0.123·pH − 0.631) + P·(0.309·pH − 0.469)', 'Alb g/L, P mmol/L'],
 ['Strong Ion Gap', 'SIG = SIDa − SIDe', '> 2 anioni non misurati'],
 ['Partizione BE (Story)', 'Na–Cl: (Na−Cl) − 38 · Alb: 0.25·(42 − Alb g/L) · UA: SBE − somma', 'Metodo semplificato al letto'],
 ['Gas alveolari', 'PAO₂ = FiO₂·(Patm − 47) − PaCO₂·[FiO₂ + (1 − FiO₂)/R]', 'Semplificata: − PaCO₂/0.8; R = 0.8'],
 ['Gradiente A-a', 'PAO₂ − PaO₂', 'Normale (aria) ≈ età/4 + 4'],
 ['Rapporto a/A', 'PaO₂ / PAO₂', 'Normale > 0.75; poco dipendente dalla FiO₂'],
 ['P/F', 'PaO₂ / FiO₂', '≤ 300 / 200 / 100 (ARDS lieve/moderata/grave; intubato con PEEP ≥ 5)'],
 ['S/F (Global ARDS 2024)', 'SpO₂ / FiO₂ (solo se SpO₂ ≤ 97%)', '≤ 315 / 235 / 148 (intubato). Non intubato (HFNO ≥ 30 L/min o NIV/CPAP ≥ 5): P/F ≤ 300 o S/F ≤ 315 senza gradi'],
 ['ΔPCO₂ veno-arterioso', 'PcvCO₂ − PaCO₂ (prelievi simultanei)', 'Normale 2–6 mmHg; > 6 → portata/flusso inadeguati anche con ScvO₂ ≥ 70%'],
 ['Indice di ossigenazione', 'OI = Paw·FiO₂·100 / PaO₂', '> 16 grave, > 25–40 valutare ECMO'],
 ['PaO₂ attesa per età (Sorbini)', '109 − 0.43·età', 'Supino, aria ambiente'],
 ['Contenuto arterioso O₂', 'CaO₂ = 1.34·Hb·SaO₂ + 0.003·PaO₂', 'mL/dL; normale 17–20'],
 ['Peso predetto (ARDSnet)', 'M: 50 + 0.91·(h − 152.4) · F: 45.5 + 0.91·(h − 152.4)', 'VT 6 mL/kg PBW'],
 ['Ventilatory ratio', 'VR = (VE mL/min·PaCO₂) / (PBW·100·37.5)', 'Surrogato dello spazio morto; > 2 prognosi peggiore'],
 ['VE per target PaCO₂', 'VE₂ = VE₁·PaCO₂₁ / PaCO₂₂', 'Assume VCO₂ e VD costanti'],
 ['Frazione di spazio morto alveolare', 'AVDSf = (PaCO₂ − EtCO₂)/PaCO₂', 'Normale < 0,15; gradiente PaCO₂–EtCO₂ 2–5 mmHg. Non equivale al VD/VT totale di Bohr-Enghoff (che richiede la PCO₂ espirata mista e include lo spazio morto anatomico)'],
 ['Deficit di bicarbonato', '0.5·peso·(HCO₃⁻ target − HCO₃⁻) · 0.3·peso·|BE|', 'Somministrare ½ e rivalutare']
];

const ALGO = `
<ol class="algo">
<li><b>Coerenza del campione</b> — arterioso? bolla? tempo all'analisi? Henderson: HCO₃⁻ calcolato vs refertato (± 10%).</li>
<li><b>pH</b> — acidemia (&lt; 7.35), alcalemia (&gt; 7.45) o normale.</li>
<li><b>Disturbo primario</b> — quale variabile (PaCO₂ o HCO₃⁻) spiega la direzione del pH?</li>
<li><b>Compenso</b> — classificazione: non compensato (variabile di compenso normale), parzialmente compensato (si muove ma pH alterato), completamente compensato (pH nel range). Poi <i>appropriatezza</i> con le formule: fuori range = secondo disturbo.</li>
<li><b>Gap anionico</b> sempre, anche con pH normale; correggerlo per albumina.</li>
<li><b>Delta gap / Δ-Δ</b> — se AG elevato: cercare NAGMA o alcalosi metabolica associate.</li>
<li><b>Approfondimenti</b> — gap osmolare (HAGMA non spiegata), UAG (NAGMA), Cl⁻ urinario (alcalosi metabolica), lattati, chetoni, Stewart.</li>
<li><b>Ossigenazione e ventilazione</b> — P/F, A-a, a/A, S/F, PaCO₂–EtCO₂, VR.</li>
<li><b>Sintesi clinica</b> — diagnosi integrata, causa probabile, piano terapeutico, controllo EGA.</li>
</ol>
<div class="pearl"><b>Regola d'oro:</b> il compenso non porta mai il pH oltre 7.40 e solo raramente lo normalizza (eccezione: alcalosi respiratoria cronica). Un pH normale con PaCO₂ e HCO₃⁻ alterati è un disturbo misto finché non si dimostra il contrario.</div>`;

const VENOUS = T(['Parametro', 'Venoso vs arterioso', 'Uso clinico'], [
 ['pH', 'Più basso di ≈ 0,03 (buona concordanza)', 'Utilizzabile per screening e monitoraggio (DKA, acidosi metabolica)'],
 ['HCO₃⁻ / BE', 'Concordanza accettabile (PS, DKA, IRC in dialisi)', 'Utilizzabile; gap anionico e Δ/Δ calcolabili'],
 ['PCO₂', 'Mediamente +4–5 mmHg ma limiti di concordanza molto ampi', 'NON intercambiabile con la PaCO₂: in insufficienza respiratoria, shock o VAM confermare con EGA arteriosa'],
 ['PO₂ / SO₂', 'Non correlata all\'ossigenazione arteriosa', 'Non usare per P/F, gradiente A-a, ARDS (usare SpO₂ → S/F)'],
 ['Lattato', 'Buona concordanza riportata anche nel paziente ipoteso', 'Utilizzabile per screening e trend; prelievo senza laccio prolungato'],
 ['Venoso centrale + arterioso', 'ΔPCO₂ cv-a 2–6 mmHg; ScvO₂ ≥ 70%', 'Indici di adeguatezza della perfusione (vedi calcolatore)']]) +
 `<p class="mut">Fonti: Byrne AL et al., Respirology 2014 (metanalisi, 18 studi, 1768 coppie): sangue venoso accettabile se interessa solo il pH, non adatto per PCO₂ e ancor meno per PO₂; Folsom AM, Clin Lab Sci 2026 (revisione): VBG utile per screening acido-base, non per l'ossigenazione; evitare provette sottovuoto e siringhe con aria. Nel calcolatore selezionare "Venoso": l'app esclude gli indici di ossigenazione da PO₂ e segnala i limiti.</p>`;

const PREANALYTIC = T(['Errore', 'Effetto su EGA'], [
 ['Bolla d\'aria', '↑ PaO₂ (verso 150), ↓ PaCO₂, ↑ pH'],
 ['Ritardo all\'analisi (> 30 min a T ambiente)', '↓ PaO₂, ↑ PaCO₂, ↓ pH, ↑ lattati (metabolismo cellulare; leucocitosi/trombocitosi estreme)'],
 ['Eccesso di eparina liquida', 'Diluizione: ↓ PaCO₂ e HCO₃⁻; possibile ↓ Ca²⁺ ionizzato'],
 ['Campione venoso/misto non riconosciuto', 'PaO₂ bassa, PCO₂ più alta (+4–5 mmHg, molto variabile), pH ≈ −0.03: selezionare "Venoso" nel calcolatore'],
 ['Emolisi', '↑ K⁺ spurio'],
 ['Prelievo vicino all\'infusione', 'Diluizione/contaminazione (Na, Cl, glucosio)'],
 ['Temperatura', 'Riportare la T del paziente (α-stat vs pH-stat, rilevante in ipotermia/CEC)']]);

const REFS = [
 'Berend K, de Vries APJ, Gans ROB. Physiological approach to assessment of acid–base disturbances. N Engl J Med 2014;371:1434-45.',
 'Seifter JL. Integration of acid–base and electrolyte disorders. N Engl J Med 2014;371:1821-31.',
 'Kidney360 2022;3(8):1458-66 (doi:10.34067/KID.0008102021) — Tab. 3: linear compensation formulas for the four primary acid-base disorders.',
 'Albert MS, Dell RB, Winters RW. Quantitative displacement of acid-base equilibrium in metabolic acidosis. Ann Intern Med 1967;66:312-22.',
 'Schlichtig R, Grogono AW, Severinghaus JW. Human PaCO₂ and standard base excess compensation for acid-base imbalance. Crit Care Med 1998;26:1173-9.',
 'Figge J et al. Anion gap and hypoalbuminemia. Crit Care Med 1998;26:1807-10.',
 'Story DA et al. Bedside approach to acid–base: Stewart simplified. Br J Anaesth 2004;92:54-60.',
 'Kraut JA, Madias NE. Metabolic acidosis: pathophysiology, diagnosis and management. Nat Rev Nephrol 2010;6:274-85.',
 'Mehta AN, Emmett JB, Emmett M. GOLD MARK: an anion gap mnemonic for the 21st century. Lancet 2008;372:892.',
 'Jaber S et al. BICAR-ICU: Sodium bicarbonate therapy for severe metabolic acidaemia. Lancet 2018;392:31-40.',
 'Jung B et al. (BICARICU-2). Sodium bicarbonate for severe metabolic acidemia and acute kidney injury. JAMA 2025;334(22):2000-10 (doi:10.1001/jama.2025.20231).',
 'Prescott HC, Antonelli M, Alhazzani W et al. Surviving Sepsis Campaign: international guidelines for management of sepsis and septic shock 2026. Intensive Care Med 2026;52(5):863-936 (doi:10.1007/s00134-026-08361-1); Crit Care Med 2026 (doi:10.1097/CCM.0000000000007075).',
 'SODa-BIC Investigators, ANZICS CTG. Sodium bicarbonate for critically ill adults with metabolic acidosis and shock. N Engl J Med 2026 (online 12/06/2026; doi:10.1056/NEJMoa2600526).',
 'von Groote T, Langer T, Brunoni B. Sodium bicarbonate application for the treatment of acute metabolic acidosis: what we know and what we still don\'t know. Intensive Care Med 2026 (doi:10.1007/s00134-026-08314-8).',
 'Oprea AD et al. Perioperative management of patients taking SGLT2 inhibitors: SPAQI multidisciplinary consensus statement. Br J Anaesth 2026;136(6):1776-99 (doi:10.1016/j.bja.2026.02.031).',
 'Byrne AL et al. Peripheral venous and arterial blood gas analysis in adults: are they comparable? A systematic review and meta-analysis. Respirology 2014;19:168-75 (doi:10.1111/resp.12225).',
 'Folsom AM. An overview of venous blood gas analysis. Clin Lab Sci 2026 (online 08/2026; doi:10.29074/ascls.2026003341).',
 'Mallat J et al. Use of venous-to-arterial carbon dioxide tension difference to guide resuscitation therapy in septic shock. World J Crit Care Med 2016;5:47-56 (doi:10.5492/wjccm.v5.i1.47).',
 'Umpierrez GE et al. Hyperglycemic crises in adults with diabetes: a consensus report (ADA/EASD/JBDS/AACE/DTS). Diabetes Care 2024;47:1257-75.',
 'Zampieri FG et al. (BaSICS). Effect of intravenous fluid treatment with a balanced solution vs 0.9% saline. JAMA 2021;326:818-29.',
 'Finfer S et al. (PLUS). Balanced multielectrolyte solution versus saline in critically ill adults. N Engl J Med 2022;386:815-26.',
 'Kraut JA, Madias NE. Serum anion gap: its uses and limitations in clinical medicine. Clin J Am Soc Nephrol 2007;2:162-74.',
 'Matthay MA et al. A New Global Definition of Acute Respiratory Distress Syndrome. Am J Respir Crit Care Med 2024;209(1):37-47 (doi:10.1164/rccm.202303-0558WS).',
 'ARDS Definition Task Force. Berlin Definition. JAMA 2012;307:2526-33.',
 'Sinha P et al. Physiologic analysis and clinical performance of the ventilatory ratio in ARDS. AJRCCM 2019;199:333-41.',
 'Semler MW et al. SMART: Balanced crystalloids vs saline in critically ill adults. N Engl J Med 2018;378:829-39.',
 'Hernández G et al. ANDROMEDA-SHOCK. JAMA 2019;321:654-64.',
 'CLSI C46-A2. Blood gas and pH analysis and related measurements, 2009.',
 'Deranged Physiology (CICM) e LITFL Critical Care Compendium — regole di Boston/Copenhagen.'
];

root.EGA_CONTENT = { DISORDERS, FORMULAS, ALGO, PREANALYTIC, VENOUS, REFS, T };
})(typeof self !== 'undefined' ? self : this);
