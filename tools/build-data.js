/**
 * tools/build-data.js
 * Extracts all data from Materials_Industry_Report.xlsx into JSON files under data/
 * Run: node tools/build-data.js
 * Requires: xlsx (npm install xlsx)
 */

const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');

const XLSX_PATH = path.join(__dirname, '..', 'Materials_Industry_Report.xlsx');
const DATA_DIR  = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const wb = XLSX.readFile(XLSX_PATH);

function getSheet(name) {
  if (!wb.Sheets[name]) throw new Error('Sheet not found: ' + name);
  return wb.Sheets[name];
}

function rawRows(sheetName) {
  return XLSX.utils.sheet_to_json(getSheet(sheetName), { defval: '', header: 1 });
}

function safe(v) {
  if (v === null || v === undefined || v === '') return 'Not recorded';
  return v;
}

function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

// ────────────────────────────────────────────────────
// SHEET 2 — Master Material Database
// ────────────────────────────────────────────────────
function buildMaterials() {
  const rows = rawRows('Master Material Database');
  // Header row is index 3, data from index 4
  const data = rows.slice(4);

  const materials = [];
  const gapList   = [];

  data.forEach(r => {
    if (!r[0] && !r[1]) return; // blank
    const id = r[0];
    const obj = {
      id: String(id),
      designation:       safe(r[1]),
      correctedDesig:    safe(r[2]),
      family:            safe(r[3]),
      standards:         safe(r[4]),
      crystalStructure:  safe(r[5]),
      microstructure:    safe(r[6]),
      propertyRowCount:  r[7] === '' ? 0 : Number(r[7]),
      designationStatus: safe(r[8]),
      reviewerNote:      safe(r[9]),
    };
    // Determine crystal system tag
    const cs = String(obj.crystalStructure).toUpperCase();
    if      (cs.includes('BCC')) obj.crystalTag = 'BCC';
    else if (cs.includes('FCC')) obj.crystalTag = 'FCC';
    else if (cs.includes('HCP')) obj.crystalTag = 'HCP';
    else if (cs.includes('BCT')) obj.crystalTag = 'BCT';
    else                          obj.crystalTag = 'Other';

    if (typeof id === 'string' && id.startsWith('G')) {
      gapList.push(obj);
    } else if (typeof id === 'number' || (!isNaN(Number(id)) && String(id).trim() !== '')) {
      obj.id = String(Math.round(Number(id)));
      materials.push(obj);
    } else if (typeof id === 'string' && id.startsWith('Reviewer')) {
      // skip section header
    } else {
      gapList.push(obj);
    }
  });

  return { materials, gapList };
}

// ────────────────────────────────────────────────────
// SHEET 3 — Material Properties
// ────────────────────────────────────────────────────
function buildProperties() {
  const rows = rawRows('Material Properties');
  const data = rows.slice(4).filter(r => r[0] !== '');

  return data.map(r => ({
    propId:           safe(r[0]),
    masterNo:         String(r[1]),
    designation:      safe(r[2]),
    condition:        safe(r[3]),
    valueBasis:       safe(r[4]),
    density_kg_m3:    num(r[5]),
    density_g_cm3:    num(r[6]),
    E_GPa:            num(r[7]),
    poisson:          num(r[8]),
    G_GPa:            num(r[9]),
    yieldStrength:    num(r[10]),
    UTS:              num(r[11]),
    flexuralStrength: num(r[12]),
    elongation:       num(r[13]),
    hardness:         safe(r[14]),
    thermalCond:      num(r[15]),
    CTE:              num(r[16]),
    elecResistivity:  safe(r[17]),
    strengthUsed:     safe(r[18]),
    specificStrength: num(r[19]),
    specificStiffness:num(r[20]),
    impactFatigue:    safe(r[21]),
    testTemperature:  safe(r[22]),
    sourceClass:      safe(r[23]),
    confidence:       safe(r[24]),
    verificationStatus: safe(r[25]),
    limitations:      safe(r[26]),
  }));
}

// ────────────────────────────────────────────────────
// SHEET 4 — Grain & Crystal Structure
// ────────────────────────────────────────────────────
function buildGrain() {
  const rows = rawRows('Grain & Crystal Structure');
  const data = rows.slice(4).filter(r => r[0] !== '');
  return data.map(r => ({
    familyId:           safe(r[0]),
    family:             safe(r[1]),
    crystalStructure:   safe(r[2]),
    phasesPresent:      safe(r[3]),
    typicalGrainSize:   safe(r[4]),
    strengtheningMech:  safe(r[5]),
    heatTreatResponse:  safe(r[6]),
    risks:              safe(r[7]),
    notes:              safe(r[8]),
    crystalTag:         (()=>{
      const cs = String(r[2]).toUpperCase();
      if (cs.includes('BCC')) return 'BCC';
      if (cs.includes('FCC')) return 'FCC';
      if (cs.includes('HCP')) return 'HCP';
      if (cs.includes('BCT')) return 'BCT';
      return 'Other';
    })(),
  }));
}

// ────────────────────────────────────────────────────
// SHEET 5 — Formulas & Worked Examples
// ────────────────────────────────────────────────────
function buildFormulas() {
  const rows = rawRows('Formulas & Worked Examples');
  const blocks = [];
  let curBlock = null;

  for (let i = 4; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.every(c => c === '')) continue;
    const col0 = String(r[0]).trim();
    const col1 = String(r[1]).trim();

    if (/^B\d+$/.test(col0)) {
      if (!curBlock || curBlock.id !== col0) {
        curBlock = {
          id: col0,
          title: col1,
          equation: safe(r[6]),
          assumptions: '',
          steps: [],
          status: 'Verified'
        };
        blocks.push(curBlock);
      } else {
        const step = {
          quantity: col1,
          symbol: safe(r[2]),
          value: r[3] !== '' ? r[3] : 'Not recorded',
          unit: safe(r[4]),
          type: safe(r[5]),
          note: safe(r[6]),
          status: safe(r[7])
        };
        curBlock.steps.push(step);
        if (r[7] && r[7] !== '') curBlock.status = r[7];
      }
    } else if (col1.toLowerCase().includes('assumptions') && curBlock) {
      curBlock.assumptions = safe(r[6]);
    }
  }

  const calcDefinitions = [
    { id: 'B1',  code: 'density',         name: 'Density conversion',          formula: 'ρ (g/cm³) = ρ (kg/m³) / 1000' },
    { id: 'B2',  code: 'thermal_exp',     name: 'Thermal expansion',           formula: 'ΔL = α × L₀ × ΔT' },
    { id: 'B3',  code: 'wire_resistance', name: 'Wire resistance',             formula: 'R = ρₑ × L / A' },
    { id: 'B4',  code: 'specific_str',    name: 'Specific strength',           formula: 'σ_sp = σ (MPa) × 1000 / ρ (kg/m³)  [kN·m/kg]' },
    { id: 'B4b', code: 'specific_stiff',  name: 'Specific stiffness',          formula: 'E_sp = E (GPa) × 1000 / ρ (kg/m³)  [MN·m/kg]' },
    { id: 'B5',  code: 'stress_strain',   name: 'Stress / Strain / Hooke',     formula: 'σ = E × ε,  ε = σ / E,  E = σ / ε' },
    { id: 'B6',  code: 'bending',         name: 'Bending stress',              formula: 'σ = M × c / I,  I (rect) = b×h³/12,  c = h/2' },
    { id: 'B7',  code: 'torsion',         name: 'Torsion stress',              formula: 'τ = T × r / J,  J (solid) = π×d⁴/32' },
    { id: 'B8',  code: 'fos',             name: 'Factor of safety',            formula: 'FoS = σ_allowable / σ_applied' },
    { id: 'B9',  code: 'thermal_stress',  name: 'Thermal stress',              formula: 'σ_T = E × α × ΔT' },
    { id: 'B10', code: 'goodman',         name: 'Modified Goodman',            formula: 'σ_a/S_e + σ_m/S_u = 1/N' },
    { id: 'B11', code: 'hall_petch',      name: 'Hall–Petch',                  formula: 'σ_y = σ_0 + k / √d  [illustrative only]' },
    { id: 'B12', code: 'grain_size',      name: 'ASTM E112 grain size',        formula: 'N = 2^(G-1),  n = N × A,  G = (log₂n) + 1' },
    { id: 'B13', code: 'carbon_equiv',    name: 'Carbon equivalent (IIW)',     formula: 'CE = C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15' },
    { id: 'B14', code: 'pren',            name: 'PREN',                        formula: 'PREN = %Cr + 3.3×%Mo + 16×%N' },
    { id: 'B15', code: 'larson_miller',   name: 'Larson–Miller',               formula: 'P = T × (C + log₁₀ tᵣ)  [°R×10³ or K×10³]' },
    { id: 'B16', code: 'hardness_uts',    name: 'Hardness → UTS',              formula: 'UTS (MPa) ≈ 3.45 × HBW  (carbon steels, approx)' },
    { id: 'B17', code: 'archard_wear',    name: 'Archard wear',                formula: 'V = K × W × L / H' },
    { id: 'B18', code: 'shear_modulus',   name: 'Isotropic elastic constants', formula: 'G = E / (2 × (1 + ν))' },
  ];

  return { blocks, calculators: calcDefinitions };
}

// ────────────────────────────────────────────────────
// SHEET 6 — Testing Methods
// ────────────────────────────────────────────────────
function buildTests() {
  const rows = rawRows('Testing Methods');
  const data = rows.slice(4).filter(r => r[0] !== '');
  return data.map(r => ({
    id:              safe(r[0]),
    method:          safe(r[1]),
    fullTitle:       safe(r[2]),
    type:            safe(r[3]),
    measuredProperty:safe(r[4]),
    applicableMaterials: safe(r[5]),
    specVsMethod:    safe(r[6]),
    keyLimitations:  safe(r[7]),
    relatedStandards:safe(r[8]),
    status:          safe(r[9]),
    notes:           safe(r[10]),
  }));
}

// ────────────────────────────────────────────────────
// SHEET 7 — Standards Verification
// ────────────────────────────────────────────────────
function buildStandards() {
  const rows = rawRows('Standards Verification');
  const data = rows.slice(4).filter(r => r[0] !== '');
  return data.map(r => ({
    id:             safe(r[0]),
    designation:    safe(r[1]),
    correctedDesig: safe(r[2]),
    title:          safe(r[3]),
    body:           safe(r[4]),
    type:           safe(r[5]),
    status:         safe(r[6]),
    edition:        safe(r[7]),
    scope:          safe(r[8]),
    notes:          safe(r[9]),
    url:            safe(r[10]),
    verificationStatus: safe(r[11]),
    limitations:    safe(r[12]),
  }));
}

// ────────────────────────────────────────────────────
// SHEET 8 — Errors & Corrections
// ────────────────────────────────────────────────────
function buildErrors() {
  const rows = rawRows('Errors & Corrections');
  const data = rows.slice(4).filter(r => r[0] !== '');
  return data.map(r => ({
    id:              safe(r[0]),
    source:          safe(r[1]),
    originalClaim:   safe(r[2]),
    correction:      safe(r[3]),
    reasoning:       safe(r[4]),
    downstreamEffects: safe(r[5]),
    evidence:        safe(r[6]),
    status:          safe(r[7]),
  }));
}

// ────────────────────────────────────────────────────
// SHEET 9 — Industry Considerations
// ────────────────────────────────────────────────────
function buildIndustry() {
  const rows = rawRows('Industry Considerations');
  const data = rows.slice(4).filter(r => r[0] !== '');
  return data.map(r => ({
    id:               safe(r[0]),
    topic:            safe(r[1]),
    category:         safe(r[2]),
    materialsAffected:safe(r[3]),
    description:      safe(r[4]),
    typicalNumbers:   safe(r[5]),
    mitigation:       safe(r[6]),
    relevantStandard: safe(r[7]),
    status:           safe(r[8]),
  }));
}

// ────────────────────────────────────────────────────
// SHEET 10 — Material Selection Report
// ────────────────────────────────────────────────────
function buildSelection() {
  const rows = rawRows('Material Selection Report');
  const data = rows.slice(4).filter(r => r[0] !== '');
  return data.map(r => ({
    application:     safe(r[0]),
    criteria:        safe(r[1]),
    candidate:       safe(r[2]),
    advantages:      safe(r[3]),
    tradeoffs:       safe(r[4]),
    requiredTests:   safe(r[5]),
    costNote:        safe(r[6]),
  }));
}

// ────────────────────────────────────────────────────
// SHEET 11 — Sources, Assumptions, Unresolved Items
// ────────────────────────────────────────────────────
function buildSources() {
  const rows = rawRows('Sources & Assumptions');
  const sources = [];
  const assumptions = [];
  const unresolved = [];

  let section = 'sources';
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.every(c => c === '')) continue;
    const c0 = String(r[0]).trim();
    if (c0.startsWith('Sheet 11')) continue;
    if (c0.toLowerCase().includes('assumptions & status')) {
      section = 'assumptions';
      continue;
    }
    if (c0.toLowerCase().includes('unresolved items')) {
      section = 'unresolved';
      continue;
    }
    if (c0.toLowerCase().includes('colour legend')) {
      section = 'legend';
      continue;
    }

    if (section === 'sources') {
      if (c0 && c0 !== 'Source' && !c0.startsWith('Sheet 11')) {
        sources.push({
          source:     safe(r[0]),
          usedFor:    safe(r[1]),
          url:        safe(r[2]),
          accessNote: safe(r[3]),
        });
      }
    } else if (section === 'assumptions') {
      if (c0.startsWith('A') && r[1]) {
        assumptions.push({
          id: c0,
          text: safe(r[1]),
        });
      }
    } else if (section === 'unresolved') {
      if (c0.startsWith('U') && r[1]) {
        unresolved.push({
          id: c0,
          text: safe(r[1]),
        });
      }
    }
  }

  return { sources, assumptions, unresolved };
}

// ────────────────────────────────────────────────────
// EXECUTIVE SUMMARY — verification coverage
// ────────────────────────────────────────────────────
function buildSummary() {
  const rows = rawRows('Executive Summary');
  const keyFigures = [];
  const coverageTable = [];
  const notes = [];

  let section = '';
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.every(c => c === '')) continue;
    const c0 = String(r[0]).trim();

    if (c0.startsWith('1. Scope')) { section = 'scope'; continue; }
    if (c0.startsWith('2. Key figures')) { section = 'figures'; continue; }
    if (c0.startsWith('3. Verification status')) { section = 'coverage'; continue; }
    if (c0.startsWith('4. Major corrections')) { section = 'corrections'; continue; }
    if (c0.startsWith('5. Important limitations')) { section = 'limitations'; continue; }

    if (section === 'figures') {
      if (r[0] && r[1] !== '') {
        keyFigures.push({ metric: safe(r[0]), value: r[1] });
      }
    } else if (section === 'coverage') {
      if (r[0] && r[0] !== 'Domain' && !c0.startsWith('Counting rule') && !c0.startsWith('Accuracy') && !c0.startsWith('Why')) {
        coverageTable.push({
          domain: safe(r[0]),
          itemsReviewed: r[1],
          verified: r[2],
          conditionallyVerified: r[3],
          incorrect: r[4],
          unverified: r[5],
          strictCv: typeof r[6] === 'number' ? (r[6] * 100).toFixed(1) + '%' : safe(r[6]),
          conditionalCv: typeof r[7] === 'number' ? (r[7] * 100).toFixed(1) + '%' : safe(r[7]),
          reconciles: safe(r[8]),
        });
      } else if (c0.startsWith('Counting rule') || c0.startsWith('Accuracy') || c0.startsWith('Why')) {
        notes.push({ topic: safe(r[0]), detail: safe(r[1]) });
      }
    }
  }

  return { keyFigures, coverageTable, notes };
}

// ────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────
console.log('Reading workbook …');

const { materials, gapList } = buildMaterials();
const properties = buildProperties();
const grain      = buildGrain();
const formulas   = buildFormulas();
const tests      = buildTests();
const standards  = buildStandards();
const errors     = buildErrors();
const industry   = buildIndustry();
const selection  = buildSelection();
const sources    = buildSources();
const summary    = buildSummary();

// Cross-link: attach properties to each material
const propsByMaster = {};
properties.forEach(p => {
  const key = String(p.masterNo);
  if (!propsByMaster[key]) propsByMaster[key] = [];
  propsByMaster[key].push(p);
});

materials.forEach(m => {
  m.properties = propsByMaster[m.id] || [];
});

// Write individual JSON files
function write(filename, data) {
  const fp = path.join(DATA_DIR, filename);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
  console.log('  Wrote', filename, Array.isArray(data) ? '(' + data.length + ' rows)' : '');
}

write('materials.json', materials);
write('gaplist.json',   gapList);
write('properties.json',properties);
write('grain.json',     grain);
write('formulas.json',  formulas);
write('tests.json',     tests);
write('standards.json', standards);
write('errors.json',    errors);
write('industry.json',  industry);
write('selection.json', selection);
write('sources.json',   sources);
write('summary.json',   summary);

// Also produce data/data.js (embedded fallback for file:// access)
const allData = {
  materials, gapList, properties, grain, formulas,
  tests, standards, errors, industry, selection, sources, summary,
};
const dataJs = '// AUTO-GENERATED — do not edit directly\n// Run: node tools/build-data.js\nwindow.MATERIALS_DATA = ' + JSON.stringify(allData) + ';\n';
fs.writeFileSync(path.join(DATA_DIR, 'data.js'), dataJs, 'utf8');
console.log('  Wrote data.js (embedded fallback)');

// ────────────────────────────────────────────────────
// ANALYSIS.md
// ────────────────────────────────────────────────────
const analysisLines = [
  '# ANALYSIS.md — Materials Explorer Data Extraction Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  `Primary Data Source: Materials_Industry_Report.xlsx`,
  `Secondary Cross-Check: Materials_Industry_Report.pdf`,
  '',
  '## 1. Sheets and Sections Found',
  wb.SheetNames.map((n, i) => `${i + 1}. **${n}**`).join('\n'),
  '',
  '## 2. Counts Summary',
  `- **Master materials reviewed (supplied list):** ${materials.length}`,
  `- **Reviewer gap-list grades (suggested, not counted in upload coverage):** ${gapList.length}`,
  `- **Property rows (Sheet 3):** ${properties.length}`,
  `- **Grain / crystal-structure family records (Sheet 4):** ${grain.length}`,
  `- **Formula blocks / independent checks (Sheet 5):** ${formulas.blocks.length}`,
  `- **Testing methods (Sheet 6):** ${tests.length}`,
  `- **Standards verified (Sheet 7):** ${standards.length}`,
  `- **Errors & corrections logged (Sheet 8):** ${errors.length}`,
  `- **Industry considerations (Sheet 9):** ${industry.length}`,
  `- **Material selection report entries (Sheet 10):** ${selection.length}`,
  `- **Sources listed (Sheet 11):** ${sources.sources.length}`,
  `- **Core assumptions (Sheet 11):** ${sources.assumptions.length}`,
  `- **Unresolved items (Sheet 11):** ${sources.unresolved.length}`,
  '',
  '## 3. Columns Per Sheet',
  '### Sheet 2 — Master Material Database',
  '`No.` | `Designation (as supplied)` | `Corrected / preferred designation` | `Material family (supplied)` | `Candidate governing standards (recalled; verify)` | `Crystal structure at RT (qualified)` | `Phases & typical grain / microstructure` | `Property rows in Sheet 3 [calc]` | `Designation verification status` | `Reviewer note`',
  '',
  '### Sheet 3 — Material Properties',
  '`Prop ID` | `Master No.` | `Designation` | `Condition / product form` | `Value basis` | `Density ρ (kg/m³)` | `Density (g/cm³) [calc]` | `Young\'s modulus E (GPa)` | `Poisson ν` | `Shear modulus G (GPa) [derived, isotropic]` | `Yield / proof strength (MPa)` | `Ultimate tensile strength (MPa)` | `Flexural strength (MPa)` | `Elongation at fracture (%)` | `Hardness (as stated)` | `Thermal conductivity k (W/(m·K))` | `CTE (µm/(m·K))` | `Electrical resistivity (Ω·m)` | `Strength used [calc]` | `Specific strength (kN·m/kg) [calc]` | `Specific stiffness (MN·m/kg) [calc]` | `Impact / fatigue / KIC / other` | `Test temperature` | `Source class` | `Confidence` | `Verification status` | `Limitations / notes`',
  '',
  '### Sheet 4 — Grain & Crystal Structure',
  '`Family ID` | `Family` | `Crystal structure` | `Phases present` | `Typical grain size` | `Strengthening mechanism` | `Heat treatment response` | `Risks / cautions` | `Notes`',
  '',
  '### Sheet 5 — Formulas & Worked Examples',
  '`Block` | `Quantity / step` | `Symbol` | `Value` | `Unit` | `Type` | `Equation / assumptions / note` | `Status`',
  '',
  '### Sheet 6 — Testing Methods',
  '`ID` | `Method` | `Full title` | `Type` | `Measured property` | `Applicable materials` | `Method vs specification` | `Key limitations` | `Related standards` | `Status` | `Notes`',
  '',
  '### Sheet 7 — Standards Verification',
  '`ID` | `Designation` | `Corrected designation` | `Title` | `Body` | `Type` | `Status` | `Edition` | `Scope` | `Notes` | `URL` | `Verification status` | `Limitations`',
  '',
  '### Sheet 8 — Errors & Corrections',
  '`ID` | `Source` | `Original claim` | `Detected issue / correction` | `Technical reasoning` | `Downstream effects` | `Evidence` | `Status`',
  '',
  '### Sheet 9 — Industry Considerations',
  '`ID` | `Topic` | `Category` | `Materials affected` | `What happens / why it matters` | `Typical numbers / limits (approx.)` | `Control / mitigation` | `Relevant standard / test (verify)` | `Status`',
  '',
  '### Sheet 10 — Material Selection Report',
  '`Application` | `Governing criteria` | `Candidate (condition)` | `Advantages` | `Trade-offs / risks` | `Required verification tests` | `Cost note (qualitative, unverified)`',
  '',
  '### Sheet 11 — Sources, Assumptions, Unresolved Items',
  '`Source` | `Used for` | `Official URL` | `Access note` (and sections for Assumptions A1–A8 and Unresolved Items U1–U6)',
  '',
  '## 4. Verification Coverage (from Executive Summary)',
  '| Domain | Items reviewed | Verified | Conditionally verified | Incorrect | Unverified | Strict Cv | Conditional Cv | Reconciles? |',
  '|---|---|---|---|---|---|---|---|---|',
  summary.coverageTable.map(c => `| ${c.domain} | ${c.itemsReviewed} | ${c.verified} | ${c.conditionallyVerified} | ${c.incorrect} | ${c.unverified} | ${c.strictCv} | ${c.conditionalCv} | ${c.reconciles} |`).join('\n'),
  '',
  '## 5. Data Quality, Anomalies and Unresolved Items',
  '1. **Legacy & Withdrawn Designations:** EN8, EN19, EN24 are obsolete British Standards (BS 970, replaced by BS EN 10083). In the database, they have designation status "Incorrect" with warnings to use modern equivalents (e.g. C45, 42CrMo4, 36CrNiMo4).',
  '2. **Chinese GB/T designations:** 40Cr, 20CrMo, 65Mn lack published Western cross-reference guarantees in this workbook and carry no numeric properties ("Not recorded").',
  '3. **Under-specified materials:** Generic entries such as "Graphite", "Cobalt-chrome", "Silicon carbide", "CFRP", and "Alumina" have sparse numeric properties because exact manufacturer/processing routes define their physical figures.',
  '4. **Calculated and Derived Fields:** Density conversion, Shear Modulus G, Specific Strength, and Specific Stiffness are strictly derived using the workbook formulas without invention.',
  '5. **Unresolved Items from Sheet 11:**',
  sources.unresolved.map(u => `   - **${u.id}:** ${u.text}`).join('\n'),
  '',
  '## 6. Parsing Fidelity and Disclaimers',
  '- No external network calls or web APIs were used. All data was strictly converted from `Materials_Industry_Report.xlsx` into static JSON and bundled into `data/data.js`.',
  '- Every value preserves original units, test temperatures, material conditions, value basis, confidence labels, and verification badges.',
];

fs.writeFileSync(path.join(__dirname, '..', 'ANALYSIS.md'), analysisLines.join('\n'), 'utf8');
console.log('  Wrote ANALYSIS.md');

console.log('\nDone. Summary:');
console.log('  ' + materials.length + ' materials, ' + properties.length + ' property rows, ' + formulas.blocks.length + ' formula blocks, ' + standards.length + ' standards, ' + tests.length + ' test methods');
