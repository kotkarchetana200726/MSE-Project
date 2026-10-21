# Materials Explorer

A fully **offline, static** web application for browsing 132 engineering materials from the *Materials Industry Report* (21 Oct 2026).

## Quick Start

```bash
# 1. Serve locally (any of these work)
npx serve .                        # Node.js serve package
python -m http.server 8080         # Python 3
npx http-server . -p 8080          # http-server

# Then open: http://localhost:3000 (or 8080 etc.)
```

You can also **double-click `index.html`** — it works from `file://` because all data is embedded in `data/data.js`.

## Rebuild the Data

If the source Excel file changes:

```bash
npm install xlsx           # only first time
node tools/build-data.js   # re-generates data/ and ANALYSIS.md
```

## Features

| Page | What it does |
|---|---|
| **Selector** | Three-step Family → Grade → Condition picker + fuzzy search + filters |
| **Detail** | 7-tab material page: Identification, Crystal & Grain, Properties, Industry, Applications, Tests & Standards, Corrections |
| **Compare** | Side-by-side table of any two materials with highlighted rankings, SVG bar charts, automated verdict, and shareable URL hash |
| **Calculators** | 18 formula calculators: bending, torsion, thermal stress, Goodman, Hall-Petch, PREN, carbon equivalent, Larson-Miller, Archard wear, etc. |
| **Standards** | Searchable register of 27 standards with verification badges |
| **Testing** | Searchable register of 44 ASTM/ISO test methods |
| **Industry** | 35 practical industry considerations (corrosion, embrittlement, welding, etc.) |
| **Assistant** | Offline rule-based + TF-IDF assistant — no API, no LLM |
| **About** | Data quality, verification coverage, errors register |

## Host on GitHub Pages / Netlify

1. Push the project folder to a GitHub repository.
2. In GitHub → Settings → Pages → Source: main branch, root folder.
3. Or drag the folder into Netlify for instant deploy.
4. Service worker activates on https — full offline/PWA support.

## Data Sources

- **Primary:** `Materials_Industry_Report.xlsx` (132 grades, 80 property rows)
- **Cross-check:** `Materials_Industry_Report.pdf`
- See `ANALYSIS.md` for a full sheet inventory and data quality notes.

## Disclaimer

Values are recalled typical or specified figures, mostly not re-checked against official documents. **Not guaranteed design properties.** Confirm with the standard, datasheet or supplier before any design use.
