# EGA Acido-Base — PWA

Calcolatore emogasanalitico per Terapia Intensiva: disturbo primario, compenso (non/parziale/completo + appropriatezza con formule), gap anionico corretto per albumina, delta gap e Δ/Δ, gap osmolare, gap anionico urinario, Cl⁻ urinario, Stewart/Fencl-Figge e partizione del BE (Story), ossigenazione (PAO₂, A-a, a/A, P/F, S/F secondo la Global Definition ARDS 2024 con distinzione intubato / non intubato, OI, CaO₂), perfusione (ΔPCO₂ veno-arterioso, ScvO₂), modalità campione venoso, ventilazione (PaCO₂–EtCO₂, frazione di spazio morto alveolare, PBW, ventilatory ratio, VE per PaCO₂ target), elettroliti e glicemia con gravità, Cl⁻ corretto per Na⁺, deficit di acqua libera, diagnosi differenziale acuta/cronica/acuta su cronica (EGA precedente, concordanza HCO₃⁻/pH/SBE, anamnesi), verifica multi-metodo del disturbo misto (Boston, Copenhagen, gap anionico, Stewart), deficit di bicarbonato, mappa acido-base e disamina completa dei disturbi.

Funziona offline (service worker) ed è installabile su Android come app.

## Pubblicazione / aggiornamento (GitHub Pages, account Cimox44)
- Repository: https://github.com/Cimox44/pH2.0 → app: https://cimox44.github.io/pH2.0/
- Aggiornare: https://github.com/Cimox44/pH2.0/upload/main → trascinare i file modificati (sovrascrivono gli omonimi, nessuna sottocartella) → *Commit changes*.
- Ogni rilascio: incrementare `VERSION` in `ega-engine.js`, `CACHE` in `ega-sw.js` **e** il suffisso `?v=` dei 4 file richiamati in `index.html` (stesso numero, es. `1.4.0` / `ega-v1.4.0` / `?v=1.4.0`): il service worker scarica i nuovi file e cancella la cache precedente. Sul telefono chiudere e riaprire l'app (eventualmente due volte).
- Android (Chrome): menu ⋮ → **Installa app / Aggiungi a schermata Home**.
- La versione installata è visibile nell'intestazione, in fondo a ogni pagina e nella scheda **Test**.

## Validazione
- Tab **Test** nell'app: 35 casi di riferimento eseguiti dal vivo sul motore.
- (Test da terminale opzionale: `node -e "console.log(require('./ega-engine.js').runValidation().every(r=>r.pass))"`)

## File (11, tutti nella radice, nessuna sottocartella)
| File | Contenuto |
|---|---|
| `index.html` | Pagina principale (deve chiamarsi esattamente così) |
| `ega-engine.js` | Motore di calcolo (UMD, testabile in Node) |
| `ega-content.js` | Disamina disturbi, formule, algoritmo, riferimenti |
| `ega-app.js` | Interfaccia, conversioni di unità, mappa acido-base |
| `ega-styles.css` | Stile (tema chiaro/scuro) |
| `ega-manifest.json`, `ega-sw.js` | PWA (installazione e offline) |
| `ega-icon-192.png`, `ega-icon-512.png`, `ega-maskable-512.png` | Icone |
| `README.md` | Questo file (facoltativo) |

Il prefisso `ega-` evita che Android rinomini i file (es. `app-1.js`) quando nella cartella Download esistono file omonimi di altre app.

## Changelog
- **v1.4.0 (18/11/2026)**: diagnosi differenziale e disturbo misto
  - *Nuova sezione "EGA precedente e anamnesi"*: PaCO₂ e HCO₃⁻ precedenti (anche in kPa), ore trascorse, BPCO / OHS-OSAS / neuromuscolare / NIV-O₂ domiciliari.
  - *Scheda 3b "Acuta o cronica?"*: (1) con EGA precedente → acuta, cronica, **acuta su cronica**, subacuta, riduzione acuta in ipercapnico cronico, **alcalosi metabolica post-ipercapnica**, nuova componente metabolica (HCO₃⁻ atteso = basale + 0,1/0,35 × ΔPaCO₂; 0,2/0,4 per le riduzioni); (2) senza EGA precedente → concordanza di HCO₃⁻, pH e SBE (0 = acuta, 1 = cronica) con **affidabilità** calcolata dalla separazione tra gli attesi (bassa < 2 mmol/L, cioè ΔPaCO₂ < 8 mmHg) e dai fattori confondenti (Cl⁻ corretto alterato, albumina < 3, disturbo metabolico, campione venoso); (3) l'anamnesi orienta solo quando gli indici non bastano ("probabilmente cronica"). L'app dichiara "non distinguibile" invece di forzare la diagnosi.
  - *Scheda 3c "Disturbo misto: verifica con 4 metodi"*: Boston, Copenhagen (SBE, Schlichtig 1998), gap anionico/Δ-Δ, Stewart semplificato (Story, anche senza albumina con residuo SBE − effetto Na–Cl). Esito: **confermato** (≥ 2 metodi concordi), **possibile** (1 metodo), **nascosto** (componenti metaboliche opposte rilevate solo con Stewart), semplice; con affidabilità e dati mancanti.
  - Δ/Δ: con EGA precedente l'HCO₃⁻ di base è quello atteso dal basale.
  - Acuta con HCO₃⁻ nel range: "disturbo lieve con pH nel range" invece di "completamente compensato".
  - 5 nuovi casi di regressione (C31–C35) → 35 casi, 161 verifiche; nuovo riferimento Adrogué-Madias JASN 2010.
- **v1.3.0 (revisione trimestrale, 18/11/2026)**
  - *Compenso nei disturbi respiratori*: il compenso renale è riconosciuto anche dall'SBE (> +2 nell'acidosi, < −2 nell'alcalosi respiratoria) e non solo da HCO₃⁻ fuori 22–26. Con pH nel range e nessun compenso la classificazione è "disturbo lieve con pH nel range" invece di "non compensato" (prima: pH NORMALE + "non compensato", etichette contraddittorie). Etichetta "acuta/cronica non distinguibile" al posto di "indeterminabile (ΔPaCO₂ piccola)".
  - *Nuova scheda Elettroliti e glicemia*: Na⁺, K⁺, Cl⁻, Ca²⁺ ionizzato, Mg²⁺, fosfato, glucosio confrontati con i range dell'adulto e graduati (lieve/moderata/grave), con chip nella diagnosi integrata e nel referto copiato. Prima ipernatriemia e ipercloremia non venivano segnalate.
  - *Cl⁻ corretto per Na⁺* (Cl × 140/Na, Fencl 2000) ed effetto Na–Cl di Story calcolati anche senza albumina: distinguono l'ipercloremia reale (acidificante) da quella concentrazionale.
  - *Deficit di acqua libera* (Adrogué-Madias) se Na⁺ > 145 e peso inserito, con velocità di correzione e nota sulle evidenze discordanti (Kidney360 2025, Cureus 2025); azione prioritaria per Na⁺ ≥ 150 o < 125.
  - *Gap anionico "ai limiti inferiori"* (senza albumina) con avviso: sospetta ipoalbuminemia.
  - *Campione venoso*: gradiente PaCO₂–EtCO₂, frazione di spazio morto, ventilatory ratio e VE target non più calcolati dalla PvCO₂ (prima indicavano un falso aumento dello spazio morto); KPI etichettato "PvCO₂".
  - *Interfaccia*: il caricamento dei casi esempio spunta "Includi K⁺" quando previsto (C18).
  - *Contenuti*: nuova riga in "Disturbi misti" (acidosi ipercloremica mascherata da alcalosi ipoalbuminemica), perla su ipernatriemia/ipercloremia, formule Cl⁻ corretto e deficit di acqua libera, 5 nuovi riferimenti con DOI.
  - *Validazione*: 3 nuovi casi di regressione (C28 EGA reale ventilato con ipernatriemia, C29 venoso con EtCO₂, C30 ipercapnia lieve a pH normale) → 30 casi, 141 verifiche.
- **v1.2.0 (revisione annuale, 28/10/2026)**
  - *Validazione input*: PaCO₂ < 10 mmHg bloccata con suggerimento "valore in kPa?" (prima 5,3 inserito come mmHg produceva un falso disturbo misto); avviso per PaCO₂ 10–15; valori negativi o non plausibili dei campi facoltativi (PaO₂, SpO₂, Na⁺, Cl⁻, albumina, lattati, peso, ecc.) esclusi dal calcolo con avviso; albumina > 7 g/dL riconosciuta come probabile valore in g/L.
  - *Ossigenazione*: Global Definition ARDS (Matthay, AJRCCM 2024) — nuovo campo "Supporto respiratorio": gradazione lieve/moderata/grave solo per l'intubato (avviso se PEEP < 5); per HFNO ≥ 30 L/min / NIV-CPAP solo criterio P/F ≤ 300 o S/F ≤ 315 senza gradi. Etichette 2023 → 2024.
  - *Campione venoso*: nuovo campo "Tipo di campione"; con campione venoso non vengono calcolati P/F, A-a, a/A, OI, CaO₂ dalla PvO₂ e compare un avviso sui limiti della PvCO₂; nuova sezione "EGA venosa" nella scheda Metodo (Byrne 2014, Folsom 2026).
  - *Nuovi parametri*: PcvCO₂ e ScvO₂ → ΔPCO₂ veno-arterioso (normale 2–6 mmHg) e interpretazione della ScvO₂ (Mallat 2016).
  - *Stewart*: avviso di sovrastima del SIG (~1,8 mEq/L) quando il fosfato non è inserito.
  - *Contenuti*: Surviving Sepsis Campaign 2026 (lattato seriato, CRT, cristalloidi bilanciati, MAP 60–65 se ≥ 65 anni, bicarbonato); SODa-BIC (NEJM 2026); criteri DKA del consenso 2024 e DKA euglicemica da SGLT2-i con gestione perioperatoria SPAQI (BJA 2026); riferimenti con DOI.
  - *PWA/UI*: service worker con `cache: 'reload'` all'installazione (evita di salvare file vecchi dalla cache HTTP) e cache dell'HTML solo se la risposta è valida; versione visibile in intestazione e piè di pagina; toast non sovrapposti; campi a 16 px (niente zoom automatico su iPhone); 6 nuovi casi di regressione (27 totali).
- **v1.1.0 (audit)**: Δ/Δ interpretato solo in presenza di acidosi metabolica; base HCO₃⁻ = atteso del compenso nei disturbi respiratori (eliminata falsa alcalosi metabolica in BPCO + HAGMA); AG con K⁺ solo se K⁺ inserito; AG elevato con Δ/Δ < 0,4 classificato HAGMA + NAGMA; classificazione del compenso coerente con le formule; AVDSf al posto di "VD/VT"; aggiornamento bicarbonato (BICARICU-2 2025, SSC 2021, ADA/EASD 2024) e fluidi (BaSICS/PLUS); soglie UOG; nota su AG con analizzatori ISE; 5 casi di regressione (21 totali).
- **v1.0.0**: prima versione.

Strumento di supporto decisionale: non sostituisce il giudizio clinico. Verificare i range del proprio laboratorio.
