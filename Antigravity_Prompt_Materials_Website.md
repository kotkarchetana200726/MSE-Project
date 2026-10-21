# PROMPT FOR ANTIGRAVITY — Offline Materials Explorer Website

## 0. Attached files
- `Materials_Industry_Report.pdf` (main source)
- `Materials_Industry_Report.xlsx` (same data in clean cells; use it as the primary data source if the PDF tables are hard to parse. Use the PDF to cross-check.)

## 1. Goal
Build a **static website with NO backend, NO server-side code and NO external APIs**. It must work by opening `index.html` or from any static host, and it must keep working offline.

Allowed: HTML, CSS, vanilla JavaScript, and Node.js **only as a one-time build/dev tool** (to parse the PDF/XLSX into JSON, and optionally to serve files locally). Node.js must NOT be needed at runtime.

Not allowed: any API call, `fetch` to external sites, CDN scripts, databases, login, or LLM API. Vendor any library locally, or write the code yourself. Charts must be drawn with plain SVG or canvas.

## 2. Step 1 — Analyse the files first
Before writing the UI, read both files completely and write `ANALYSIS.md` listing:
- every sheet/section found and its columns;
- how many materials, grades, conditions and property rows were found;
- any data you could not parse or that looks inconsistent.

Then produce `data/materials.json`, `data/formulas.json`, `data/tests.json`, `data/standards.json`, `data/industry.json`, `data/grain.json`, `data/selection.json` using a Node script `tools/build-data.js`. Keep every value exactly as in the source.

### Data integrity rules (very important)
1. **Never invent or "fill in" values.** If a cell is blank, show "Not recorded".
2. Keep the original **units, test temperature, material condition, value basis** (Typical / Specified minimum / Manufacturer typical) and the **confidence** and **verification status** labels (Verified / Conditionally verified / Incorrect / Unverified) next to every value. Show them as small colored badges.
3. Show this notice on every material page and in the footer: *"Values are recalled typical or specified figures, mostly not re-checked against official documents. They are not guaranteed design properties. Confirm with the standard, datasheet or supplier before design."*
4. Keep the "Incorrect / legacy designation" warnings (for example EN8, EN19, EN24) visible.
5. Calculated fields (g/cm³, shear modulus, specific strength, specific stiffness) must use the same formulas as the workbook:
   - ρ(g/cm³) = ρ/1000
   - G = E / (2(1+ν)) (only if E and ν exist)
   - Specific strength (kN·m/kg) = strength(MPa) × 1000 / ρ(kg/m³), using UTS, else YS, else flexural strength, and say which was used
   - Specific stiffness (MN·m/kg) = E(GPa) × 1000 / ρ

## 3. Step 2 — Material selector
- Three-step selector: **Family → Grade → Condition/product form** (for example AISI 4140 → Annealed or Q&T).
- Also a search box with fuzzy matching on designation, UNS number, old names and aliases (for example "EN8" must find the legacy warning and its modern replacement).
- Filters: family, crystal structure (BCC/FCC/HCP/BCT/other), value basis, confidence, "has numeric properties".
- Mobile first. Large touch targets. Works at 360 px width.

## 4. Step 3 — Material detail page (show everything known)
Tabs or accordion sections:
1. **Identification:** designation, corrected/preferred designation, family, governing standards, designation check status, reviewer note.
2. **Crystal & grain structure:** crystal structure at room temperature, phases, typical grain/microstructure, strengthening mechanism, heat-treatment response, risks. Use the family record from the Grain sheet. Add a small SVG diagram of the unit cell type (BCC, FCC, HCP) when the structure is one of these.
3. **Properties:** table with value, unit, test temperature, condition, basis, source class, confidence, limitations. Include calculated rows.
4. **Industry considerations:** pull related entries by family or alloy keywords (corrosion, welding, embrittlement, heat treatment, regulatory).
5. **Applications and selection:** which of the 8 applications it appears in (robot chassis, robotic arm, shaft, gear, bearing, welded structure, corrosion-exposed, high-temperature), with pros, trade-offs, required tests and the qualitative cost note.
6. **Tests and standards:** relevant test methods (ASTM/ISO/IS) and standards from the registers, with verification status.
7. **Related errors/corrections** for that material.

## 5. Step 4 — Compare two materials
A **Compare** page and a "Compare" button on each material card.
- Pick Material A and Material B (each with grade + condition). Allow swapping them.
- Side-by-side table of every property, crystal structure, standards and applications.
- Highlight the better value per property (higher is better for strength, stiffness and specific values; lower is better for density, CTE and cost class) and show the ratio or % difference. If a value is missing for either one, show "Not recorded" and do not rank it.
- Warn when the two rows use different bases (Typical vs Specified minimum) or different conditions, because the comparison may not be fair.
- Charts (SVG bars): density, E, yield, UTS, specific strength, specific stiffness, and the indices E^½/ρ and σ^⅔/ρ from the Selection sheet.
- A short plain-language "verdict" paragraph generated from rules (for example "A is stiffer per unit weight, B has higher yield but is harder to weld"). Always add: "This is an aid, not a design decision."
- Shareable state in the URL hash (for example `#compare=A_id,B_id`) and "Copy summary" and "Print/Save as PDF" buttons.

## 6. Step 5 — Built-in offline "AI assistant" (no API)
Build a **local, rule-based assistant** that runs fully in the browser. It is NOT a large language model, and the UI must say so ("Offline assistant — answers only from the report data").

How it works:
- Load the JSON, build a small search index in JS (TF-IDF or BM25 plus synonym map).
- Intent detection with keyword and regex rules, for example:
  - "properties of 6061-T6" → show the property card
  - "compare 4140 and 4340" → open compare
  - "best for shaft" / "material for corrosion" → read the Selection data and rank candidates
  - "what is BCC / FCC / HCP" → grain sheet and crystal fundamentals
  - "which test for hardness" → Testing register
  - "is EN8 valid" → errors/corrections
  - "calculate bending stress M=1500 b=30mm h=50mm" → run the formula engine
- Every answer must cite which sheet/row it came from and show the verification badge.
- If nothing matches, say "I don't have this in the report" and suggest the closest topics. Never guess.
- Chat-style UI plus quick suggestion chips.

## 7. Calculators (client-side)
Implement the formulas from the Formulas sheet with unit-checked inputs, step-by-step working and the independent check: density, thermal expansion, wire resistance, specific strength/stiffness, stress/strain/Hooke, bending stress, torsion stress, factor of safety, thermal stress, modified Goodman, Hall–Petch (show "illustrative parameters" warning), ASTM E112 grain size, carbon equivalent, PREN, Larson–Miller, hardness→UTS, Archard wear. Show the assumptions text with each one. Allow "use value from selected material" for E, ρ, CTE, yield.

## 8. Extra pages
- **Standards:** searchable table with status badges and the note that editions were recalled and must be confirmed.
- **Testing methods:** searchable, with the "method vs specification" distinction.
- **Industry considerations:** filter by category.
- **About / Data quality:** show the verification coverage table (strict vs conditional) from the Executive Summary and the unresolved items list.

## 9. Technical requirements
- Folder structure: `index.html`, `css/`, `js/` (modules: data, selector, detail, compare, assistant, calculators, charts, ui), `data/`, `tools/build-data.js`, `README.md`, `ANALYSIS.md`.
- Vanilla JS (ES modules), no framework needed. If ES modules fail on `file://`, bundle into one `app.js` so that double-clicking `index.html` works.
- Embed the JSON into a JS file (`data/data.js`) as a fallback so it works from `file://`.
- Service worker + manifest for offline/PWA use (only when served over http/https).
- Responsive, accessible (labels, contrast, keyboard use), light/dark mode, print stylesheet.
- Fast: lazy-render large tables; no layout shift.
- Use safe DOM methods (`textContent`), not unescaped `innerHTML`, for data.

## 10. Acceptance tests (run them and report the results)
1. Number of materials/properties shown equals the numbers in `ANALYSIS.md` and in the workbook Executive Summary.
2. Spot-check 10 values against the source (for example AA 6061-T6: ρ 2700, E 68.9 GPa, UTS 310 MPa; specific strength ≈ 114.8 kN·m/kg).
3. Compare 6061-T6 vs 7075-T6 and check the ranking and ratios by hand.
4. Searching "EN8" shows the legacy-designation warning.
5. The site works with the network disabled and with no console errors.
6. No outgoing network request appears in the browser DevTools.
7. Layout is fine at 360 px, 768 px and 1280 px.

## 11. Final delivery
Give me the full project folder, a short `README.md` (how to open it, how to rebuild the data with `node tools/build-data.js`, how to host on GitHub Pages/Netlify) and a list of anything in the PDF/XLSX you could not parse. Do not present fabricated data as real.
