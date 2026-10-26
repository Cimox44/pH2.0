# EGA Acido-Base — PWA

Calcolatore emogasanalitico per Terapia Intensiva: disturbo primario, compenso (non/parziale/completo + appropriatezza con formule), gap anionico corretto per albumina, delta gap e Δ/Δ, gap osmolare, gap anionico urinario, Cl⁻ urinario, Stewart/Fencl-Figge e partizione del BE (Story), ossigenazione (PAO₂, A-a, a/A, P/F, S/F Global ARDS 2023, OI, CaO₂), ventilazione (PaCO₂–EtCO₂, VD/VT, PBW, ventilatory ratio, VE per PaCO₂ target), deficit di bicarbonato, mappa acido-base e disamina completa dei disturbi.

Funziona offline (service worker) ed è installabile su Android come app.

## Pubblicazione su GitHub Pages (account Cimox44)
1. github.com → **New repository** → nome `ega` (pubblico) → Create.
2. **Add file → Upload files** → caricare gli 11 file (nessuna sottocartella) → Commit.
3. **Settings → Pages** → Source: *Deploy from a branch* → Branch `main` / `(root)` → Save.
4. Dopo 1–2 minuti: `https://cimox44.github.io/ega/`
5. Su Android (Chrome): menu ⋮ → **Installa app / Aggiungi a schermata Home**.

## Aggiornamenti
Modificare i file e incrementare `CACHE` in `ega-sw.js` (es. `ega-v1.1.1`) per forzare l'aggiornamento sui telefoni.

## Validazione
- Tab **Test** nell'app: 21 casi di riferimento eseguiti dal vivo sul motore.
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
- **v1.1.0 (audit)**: Δ/Δ interpretato solo in presenza di acidosi metabolica; base HCO₃⁻ = atteso del compenso nei disturbi respiratori (eliminata falsa alcalosi metabolica in BPCO + HAGMA); AG con K⁺ solo se K⁺ inserito; AG elevato con Δ/Δ < 0,4 classificato HAGMA + NAGMA; classificazione del compenso coerente con le formule; AVDSf al posto di "VD/VT"; aggiornamento bicarbonato (BICARICU-2 2025, SSC 2021, ADA/EASD 2024) e fluidi (BaSICS/PLUS); soglie UOG; nota su AG con analizzatori ISE; 5 casi di regressione (21 totali).
- **v1.0.0**: prima versione.

Strumento di supporto decisionale: non sostituisce il giudizio clinico. Verificare i range del proprio laboratorio.
