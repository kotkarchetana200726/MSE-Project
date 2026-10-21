# ANALYSIS.md — Materials Explorer Data Extraction Report

Generated: 2026-10-21T18:20:23.233Z
Primary Data Source: Materials_Industry_Report.xlsx
Secondary Cross-Check: Materials_Industry_Report.pdf

## 1. Sheets and Sections Found
1. **Executive Summary**
2. **Master Material Database**
3. **Material Properties**
4. **Grain & Crystal Structure**
5. **Formulas & Worked Examples**
6. **Testing Methods**
7. **Standards Verification**
8. **Errors & Corrections**
9. **Industry Considerations**
10. **Material Selection Report**
11. **Sources & Assumptions**

## 2. Counts Summary
- **Master materials reviewed (supplied list):** 132
- **Reviewer gap-list grades (suggested, not counted in upload coverage):** 16
- **Property rows (Sheet 3):** 80
- **Grain / crystal-structure family records (Sheet 4):** 49
- **Formula blocks / independent checks (Sheet 5):** 18
- **Testing methods (Sheet 6):** 44
- **Standards verified (Sheet 7):** 27
- **Errors & corrections logged (Sheet 8):** 22
- **Industry considerations (Sheet 9):** 35
- **Material selection report entries (Sheet 10):** 38
- **Sources listed (Sheet 11):** 9
- **Core assumptions (Sheet 11):** 8
- **Unresolved items (Sheet 11):** 6

## 3. Columns Per Sheet
### Sheet 2 — Master Material Database
`No.` | `Designation (as supplied)` | `Corrected / preferred designation` | `Material family (supplied)` | `Candidate governing standards (recalled; verify)` | `Crystal structure at RT (qualified)` | `Phases & typical grain / microstructure` | `Property rows in Sheet 3 [calc]` | `Designation verification status` | `Reviewer note`

### Sheet 3 — Material Properties
`Prop ID` | `Master No.` | `Designation` | `Condition / product form` | `Value basis` | `Density ρ (kg/m³)` | `Density (g/cm³) [calc]` | `Young's modulus E (GPa)` | `Poisson ν` | `Shear modulus G (GPa) [derived, isotropic]` | `Yield / proof strength (MPa)` | `Ultimate tensile strength (MPa)` | `Flexural strength (MPa)` | `Elongation at fracture (%)` | `Hardness (as stated)` | `Thermal conductivity k (W/(m·K))` | `CTE (µm/(m·K))` | `Electrical resistivity (Ω·m)` | `Strength used [calc]` | `Specific strength (kN·m/kg) [calc]` | `Specific stiffness (MN·m/kg) [calc]` | `Impact / fatigue / KIC / other` | `Test temperature` | `Source class` | `Confidence` | `Verification status` | `Limitations / notes`

### Sheet 4 — Grain & Crystal Structure
`Family ID` | `Family` | `Crystal structure` | `Phases present` | `Typical grain size` | `Strengthening mechanism` | `Heat treatment response` | `Risks / cautions` | `Notes`

### Sheet 5 — Formulas & Worked Examples
`Block` | `Quantity / step` | `Symbol` | `Value` | `Unit` | `Type` | `Equation / assumptions / note` | `Status`

### Sheet 6 — Testing Methods
`ID` | `Method` | `Full title` | `Type` | `Measured property` | `Applicable materials` | `Method vs specification` | `Key limitations` | `Related standards` | `Status` | `Notes`

### Sheet 7 — Standards Verification
`ID` | `Designation` | `Corrected designation` | `Title` | `Body` | `Type` | `Status` | `Edition` | `Scope` | `Notes` | `URL` | `Verification status` | `Limitations`

### Sheet 8 — Errors & Corrections
`ID` | `Source` | `Original claim` | `Detected issue / correction` | `Technical reasoning` | `Downstream effects` | `Evidence` | `Status`

### Sheet 9 — Industry Considerations
`ID` | `Topic` | `Category` | `Materials affected` | `What happens / why it matters` | `Typical numbers / limits (approx.)` | `Control / mitigation` | `Relevant standard / test (verify)` | `Status`

### Sheet 10 — Material Selection Report
`Application` | `Governing criteria` | `Candidate (condition)` | `Advantages` | `Trade-offs / risks` | `Required verification tests` | `Cost note (qualitative, unverified)`

### Sheet 11 — Sources, Assumptions, Unresolved Items
`Source` | `Used for` | `Official URL` | `Access note` (and sections for Assumptions A1–A8 and Unresolved Items U1–U6)

## 4. Verification Coverage (from Executive Summary)
| Domain | Items reviewed | Verified | Conditionally verified | Incorrect | Unverified | Strict Cv | Conditional Cv | Reconciles? |
|---|---|---|---|---|---|---|---|---|
| Master-list designations | 132 | 0 | 103 | 3 | 26 | 0.0% | 78.0% | OK |
| Property records (Sheet 3) | 80 | 0 | 54 | 0 | 26 | 0.0% | 67.5% | OK |
| Grain / crystal-structure records | 33 | 0 | 33 | 0 | 0 | 0.0% | 100.0% | OK |
| Formula checks (Sheet 5) | 19 | 19 | 0 | 0 | 0 | 100.0% | 100.0% | OK |
| Testing-method references | 44 | 0 | 35 | 0 | 9 | 0.0% | 79.5% | OK |
| Standards (supplied + supporting) | 27 | 0 | 25 | 0 | 2 | 0.0% | 92.6% | OK |
| TOTAL | 335 | 19 | 250 | 3 | 63 | 5.7% | 80.3% | OK |

## 5. Data Quality, Anomalies and Unresolved Items
1. **Legacy & Withdrawn Designations:** EN8, EN19, EN24 are obsolete British Standards (BS 970, replaced by BS EN 10083). In the database, they have designation status "Incorrect" with warnings to use modern equivalents (e.g. C45, 42CrMo4, 36CrNiMo4).
2. **Chinese GB/T designations:** 40Cr, 20CrMo, 65Mn lack published Western cross-reference guarantees in this workbook and carry no numeric properties ("Not recorded").
3. **Under-specified materials:** Generic entries such as "Graphite", "Cobalt-chrome", "Silicon carbide", "CFRP", and "Alumina" have sparse numeric properties because exact manufacturer/processing routes define their physical figures.
4. **Calculated and Derived Fields:** Density conversion, Shear Modulus G, Specific Strength, and Specific Stiffness are strictly derived using the workbook formulas without invention.
5. **Unresolved Items from Sheet 11:**
   - **U1:** Confirm current/withdrawn status of ASTM E164.
   - **U2:** Confirm current edition/revision status of IS 1865 and all IS edition years in Standards sheet.
   - **U3:** Check exact current titles (E165/E165M, E1444/E1444M, E1742/E1742M) in the ASTM catalogue.
   - **U4:** Re-fetch grade-specific property values from ASM/manufacturer datasheets and record publication dates.
   - **U5:** Resolve under-specified materials (ceramics, composites, CoCr, graphite, CuBe) by choosing exact grades.
   - **U6:** Add fatigue, impact and fracture-toughness values with test conditions for critical grades.

## 6. Parsing Fidelity and Disclaimers
- No external network calls or web APIs were used. All data was strictly converted from `Materials_Industry_Report.xlsx` into static JSON and bundled into `data/data.js`.
- Every value preserves original units, test temperatures, material conditions, value basis, confidence labels, and verification badges.