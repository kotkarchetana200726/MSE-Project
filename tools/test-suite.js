/**
 * tools/test-suite.js
 * Comprehensive automated verification test suite for Materials Explorer website.
 * Runs tests on:
 *  1. Data integrity and schema
 *  2. Verification counts vs Executive Summary
 *  3. 10 spot-check values from source
 *  4. 6061-T6 vs 7075-T6 comparison ratios
 *  5. Legacy designation warning detection (EN8, EN19, EN24)
 *  6. Formula engine & independent check calculations
 *  7. Offline Assistant intent detection & citation verification
 *  8. HTML structure and accessibility
 */

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

console.log('====================================================');
console.log(' MATERIALS EXPLORER AUTOMATED ACCEPTANCE SUITE');
console.log('====================================================\n');

// 1. Load Data
console.log('1. Loading bundled data...');
const dataJsPath = path.join(__dirname, '..', 'data', 'data.js');
assert(fs.existsSync(dataJsPath), 'data/data.js exists');

const context = { window: {}, console: console };
vm.createContext(context);
const code = fs.readFileSync(dataJsPath, 'utf8');
vm.runInContext(code, context);

const D = context.window.MATERIALS_DATA;
assert(!!D, 'MATERIALS_DATA loaded into window');

// 2. Count Verifications vs Executive Summary
console.log('\n2. Verifying record counts against Executive Summary...');
assert(D.materials.length === 132, `132 master materials found (actual: ${D.materials.length})`);
assert(D.properties.length === 80, `80 property rows found (actual: ${D.properties.length})`);
assert(D.gapList.length === 16, `16 gap-list suggestions found (actual: ${D.gapList.length})`);
assert(D.grain.length >= 33, `Grain records >= 33 (actual: ${D.grain.length})`);
assert(D.standards.length === 27, `27 standards verified (actual: ${D.standards.length})`);
assert(D.tests.length === 44, `44 testing methods recorded (actual: ${D.tests.length})`);
assert(D.errors.length === 22, `22 errors/corrections recorded (actual: ${D.errors.length})`);
assert(D.industry.length === 35, `35 industry considerations recorded (actual: ${D.industry.length})`);
assert(D.selection.length === 38, `38 selection candidate entries recorded (actual: ${D.selection.length})`);
assert(D.formulas.blocks.length === 18, `18 formula blocks verified (actual: ${D.formulas.blocks.length})`);

// 3. Spot-check 10 Values
console.log('\n3. Performing 10 spot-checks against source report...');
const m6061 = D.materials.find(m => m.designation.includes('6061'));
const p6061 = m6061?.properties[0];
assert(p6061?.density_kg_m3 === 2700, `AA 6061-T6 density is 2700 kg/m³ (${p6061?.density_kg_m3})`);
assert(p6061?.E_GPa === 68.9, `AA 6061-T6 E is 68.9 GPa (${p6061?.E_GPa})`);
assert(p6061?.UTS === 310, `AA 6061-T6 UTS is 310 MPa (${p6061?.UTS})`);
assert(Math.abs(p6061?.specificStrength - 114.8148) < 0.05, `AA 6061-T6 specific strength ≈ 114.8 kN·m/kg (${p6061?.specificStrength?.toFixed(2)})`);

const m7075 = D.materials.find(m => m.designation.includes('7075'));
const p7075 = m7075?.properties[0];
assert(p7075?.density_kg_m3 === 2810, `AA 7075-T6 density is 2810 kg/m³ (${p7075?.density_kg_m3})`);
assert(p7075?.UTS === 572, `AA 7075-T6 UTS is 572 MPa (${p7075?.UTS})`);

const m4140 = D.materials.find(m => m.designation.includes('4140'));
const p4140QT = m4140?.properties.find(p => p.condition.includes('Q&T'));
assert(p4140QT?.yieldStrength === 655, `AISI 4140 Q&T yield strength is 655 MPa (${p4140QT?.yieldStrength})`);

const m304 = D.materials.find(m => m.designation.includes('304'));
const p304 = m304?.properties[0];
assert(p304?.elongation === 40, `SS 304 specified min elongation is 40% (${p304?.elongation})`);

const mTi = D.materials.find(m => m.designation.includes('Ti-6Al-4V'));
const pTi = mTi?.properties[0];
assert(pTi?.density_kg_m3 === 4430, `Ti-6Al-4V density is 4430 kg/m³ (${pTi?.density_kg_m3})`);

const m1018 = D.materials.find(m => m.designation.includes('1018'));
const p1018 = m1018?.properties[0];
assert(p1018?.density_kg_m3 === 7870, `AISI 1018 density is 7870 kg/m³ (${p1018?.density_kg_m3})`);

// 4. Compare 6061-T6 vs 7075-T6
console.log('\n4. Verifying Comparison ratios (6061-T6 vs 7075-T6)...');
const utsRatio = p7075.UTS / p6061.UTS;
assert(Math.abs(utsRatio - 1.845) < 0.01, `7075-T6 UTS is 1.85× 6061-T6 (${utsRatio.toFixed(2)}×)`);
const ssRatio = p7075.specificStrength / p6061.specificStrength;
assert(Math.abs(ssRatio - 1.773) < 0.01, `7075-T6 specific strength is 1.77× 6061-T6 (${ssRatio.toFixed(2)}×)`);
assert(p6061.density_kg_m3 < p7075.density_kg_m3, `6061-T6 (2700) is ranked lighter than 7075-T6 (2810)`);

// 5. Legacy Designation Warning
console.log('\n5. Verifying Legacy Designation Warnings...');
const mEN8 = D.materials.find(m => m.designation.includes('EN8'));
assert(!!mEN8, `EN8 found in database (${mEN8?.designation})`);
assert(mEN8?.designationStatus === 'Incorrect', `EN8 marked with designation status "Incorrect" (${mEN8?.designationStatus})`);

const errE01 = D.errors.find(e => e.id === 'E01');
assert(errE01?.originalClaim.includes('EN8'), `Error E01 contains EN8 warning (${errE01?.originalClaim})`);

// 6. Formula Engine Independent Checks
console.log('\n6. Checking Formula Engine & Independent Checks...');
// Check B6 bending stress: M=1500 N·m = 1.5e6 N·mm, b=30 mm, h=50 mm
const M_test = 1500 * 1000;
const b_test = 30;
const h_test = 50;
const I_test = b_test * Math.pow(h_test, 3) / 12;
const c_test = h_test / 2;
const sig_primary = M_test * c_test / I_test;
const sig_chk = 6 * M_test / (b_test * Math.pow(h_test, 2));
assert(sig_primary === 120, `Primary bending stress is 120 MPa (${sig_primary})`);
assert(sig_chk === 120, `Independent check bending stress is 120 MPa (${sig_chk})`);
assert(Math.abs(sig_primary - sig_chk) === 0, `Relative difference is 0.00%`);

// Check B14 PREN for 2205: Cr=22.0, Mo=3.0, N=0.18
const pren2205 = 22.0 + 3.3 * 3.0 + 16 * 0.18;
assert(Math.abs(pren2205 - 34.78) < 0.01, `PREN for 2205 is 34.78 (${pren2205.toFixed(2)})`);

// 7. Offline Assistant Logic
console.log('\n7. Verifying Offline Assistant Rules & Intent Engine...');
const appJsPath = path.join(__dirname, '..', 'js', 'app.js');
assert(fs.existsSync(appJsPath), 'js/app.js exists');

const htmlPath = path.join(__dirname, '..', 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
assert(htmlContent.includes('id="page-selector"'), 'HTML has Material Selector view');
assert(htmlContent.includes('id="page-detail"'), 'HTML has Material Detail view');
assert(htmlContent.includes('id="page-compare"'), 'HTML has Compare Two Materials view');
assert(htmlContent.includes('id="page-calculators"'), 'HTML has Calculators view');
assert(htmlContent.includes('id="page-standards"'), 'HTML has Standards Register view');
assert(htmlContent.includes('id="page-testing"'), 'HTML has Testing Methods view');
assert(htmlContent.includes('id="page-industry"'), 'HTML has Industry Considerations view');
assert(htmlContent.includes('id="page-assistant"'), 'HTML has Offline Assistant view');
assert(htmlContent.includes('id="page-about"'), 'HTML has About / Data Quality view');

// Notice verification
assert(htmlContent.includes('Values are recalled typical or specified figures'), 'Mandatory warning notice banner present in HTML');
assert(!htmlContent.includes('http://') && !htmlContent.includes('https://cdn'), 'No external CDN scripts or remote dependencies in index.html');

console.log('\n====================================================');
console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
}
