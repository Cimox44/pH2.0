# EGA Acido-Base — PWA

Calcolatore emogasanalitico per Terapia Intensiva: disturbo primario, compenso (non/parziale/completo + appropriatezza con formule), gap anionico corretto per albumina, delta gap e Δ/Δ, gap osmolare, gap anionico urinario, Cl⁻ urinario, Stewart/Fencl-Figge e partizione del BE (Story), ossigenazione (PAO₂, A-a, a/A, P/F, S/F secondo la Global Definition ARDS 2024 con distinzione intubato / non intubato, OI, CaO₂), perfusione (ΔPCO₂ veno-arterioso, ScvO₂), modalità campione venoso, ventilazione (PaCO₂–EtCO₂, frazione di spazio morto alveolare, PBW, ventilatory ratio, VE per PaCO₂ target), deficit di bicarbonato, mappa acido-base e disamina completa dei disturbi.

Funziona offline (service worker) ed è installabile su Android come app.

## Pubblicazione / aggiornamento (GitHub Pages, account Cimox44)
- Repository: https://github.com/Cimox44/pH2.0 → app: https://cimox44.github.io/pH2.0/
- Aggiornare: https://github.com/Cimox44/pH2.0/upload/main → trascinare i file modificati (sovrascrivono gli omonimi, nessuna sottocartella) → *Commit changes*.
- Ogni rilascio: incrementare `VERSION` in `ega-engine.js`, `CACHE` in `ega-sw.js` **e** il suffisso `?v=` dei 4 file richiamati in `index.html` (stesso numero, es. `1.2.0` / `ega-v1.2.0` / `?v=1.2.0`): il service worker scarica i nuovi file e cancella la cache precedente. Sul telefono chiudere e riaprire l'app (eventualmente due volte).
- Android (Chrome): menu ⋮ → **Installa app / Aggiungi a schermata Home**.
- La versione installata è visibile nell'intestazione, in fondo a ogni pagina e nella scheda **Test**.

## Validazione
- Tab **Test** nell'app: 27 casi di riferimento eseguiti dal vivo sul motore.
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
