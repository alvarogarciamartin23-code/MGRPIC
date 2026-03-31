/**
 * Test PASO 7 — Verificación y validación del sistema MGRPIC
 *
 * Casos tipo del TFM:
 *   Caso B: Altcoin baja cap, clave desconocida, fugado sin cooperación,
 *           sin criterio judicial, variación extrema, custodia comprometida
 *           → ~88 puntos, CRÍTICO
 *
 *   Caso D: Stablecoin USDT, investigado cooperante, clave entregada,
 *           custodio institucional, proceso 4 meses
 *           → ~15 puntos, BAJO
 *
 *   Caso MAX: todos los indicadores en Alto (2)
 *             → exactamente 100 puntos
 */

const fs = require('fs');

// ── Carga de módulos ──────────────────────────────────────────
const dataCode    = fs.readFileSync('mgrpic/js/data.js',    'utf8');
const scoringCode = fs.readFileSync('mgrpic/js/scoring.js', 'utf8');

const MGRPIC_DATA  = (new Function(dataCode    + '; return MGRPIC_DATA;'))();
const MGRPICScoring = (new Function('MGRPIC_DATA', scoringCode + '; return MGRPICScoring;'))(MGRPIC_DATA);

let ok = 0, fail = 0;
const errors = [];

function assert(desc, condition, detail) {
  if (condition) {
    ok++;
  } else {
    fail++;
    errors.push('  ✗ ' + desc + (detail ? '\n    → ' + detail : ''));
  }
}

function nearly(actual, expected, tol) {
  return Math.abs(actual - expected) <= tol;
}

// ══════════════════════════════════════════════════════════════
// 1. CASO MÁXIMO — todos en Alto (2) → 100 puntos exactos
// ══════════════════════════════════════════════════════════════
const respMax = {};
MGRPIC_DATA.dimensiones.forEach(d => d.indicadores.forEach(i => { respMax[i.id] = 2; }));
const rMax = MGRPICScoring.calculateScore(respMax);

assert('Caso MAX — puntuación exactamente 100',
  rMax.total === 100,
  `obtenido: ${rMax.total}`);
assert('Caso MAX — nivel CRÍTICO',
  rMax.nivelRiesgo.nivel === 'CRÍTICO',
  `obtenido: ${rMax.nivelRiesgo.nivel}`);
assert('Caso MAX — D1 = 35 exactos',
  rMax.dimensiones[0].puntuacion === 35,
  `obtenido: ${rMax.dimensiones[0].puntuacion}`);
assert('Caso MAX — D2 = 25 exactos',
  rMax.dimensiones[1].puntuacion === 25,
  `obtenido: ${rMax.dimensiones[1].puntuacion}`);
assert('Caso MAX — D3 = 25 exactos',
  rMax.dimensiones[2].puntuacion === 25,
  `obtenido: ${rMax.dimensiones[2].puntuacion}`);
assert('Caso MAX — D4 = 15 exactos',
  rMax.dimensiones[3].puntuacion === 15,
  `obtenido: ${rMax.dimensiones[3].puntuacion}`);

// ══════════════════════════════════════════════════════════════
// 2. CASO B — Altcoin baja cap, clave desconocida, fugado,
//             sin criterio judicial, variación extrema, custodia comprometida
//
// Mapping razonado:
//   V1=2 (Altcoin baja cap)  V2=2 (variación extrema)
//   V3=2 (fugado→proceso>2a) V4=0 (altcoin baja cap→valor<10k)
//   C1=2 (custodia informal) C2=2 (acceso sin doc)
//   C3=2 (seed no localizada) C4=2 (sin verificación)
//   I1=1 (trazabilidad parcial, heurísticas) I2=2 (clave desconocida)
//   I3=2 (fugado a país sin cooperación)    I4=2 (jurisdicción no cooperante)
//   J1=2 (sin criterio judicial ni AP)      J2=2 (variación >25%)
//   J3=2 (custodia informal sin atribución)
//
// D1 = (2+2+2+0) × 4.375 = 6 × 4.375 = 26.25
// D2 = (2+2+2+2) × 3.125 = 8 × 3.125 = 25.00
// D3 = (1+2+2+2) × 3.125 = 7 × 3.125 = 21.875
// D4 = (2+2+2) × 2.5    = 6 × 2.5   = 15.00
// TOTAL = 88.125 ≈ 88
// ══════════════════════════════════════════════════════════════
const respB = {
  V1:2, V2:2, V3:2, V4:0,   // Volatilidad
  C1:2, C2:2, C3:2, C4:2,   // Custodia
  I1:1, I2:2, I3:2, I4:2,   // Inejecutabilidad
  J1:2, J2:2, J3:2           // Jurídico-procesal
};
const rB = MGRPICScoring.calculateScore(respB);

assert('Caso B — puntuación ≈ 88 (±2)',
  nearly(rB.total, 88, 2),
  `obtenido: ${rB.total}`);
assert('Caso B — nivel CRÍTICO',
  rB.nivelRiesgo.nivel === 'CRÍTICO',
  `obtenido: ${rB.nivelRiesgo.nivel}`);
assert('Caso B — D1 = 26.25',
  rB.dimensiones[0].puntuacion === 26.25,
  `obtenido: ${rB.dimensiones[0].puntuacion}`);
assert('Caso B — D2 = 25.00',
  rB.dimensiones[1].puntuacion === 25,
  `obtenido: ${rB.dimensiones[1].puntuacion}`);
assert('Caso B — D3 = 21.875',
  rB.dimensiones[2].puntuacion === 21.875,
  `obtenido: ${rB.dimensiones[2].puntuacion}`);
assert('Caso B — D4 = 15.00',
  rB.dimensiones[3].puntuacion === 15,
  `obtenido: ${rB.dimensiones[3].puntuacion}`);
assert('Caso B — total = 88.13 (redondeado 2 dec)',
  rB.total === 88.13,
  `obtenido: ${rB.total}`);
assert('Caso B — evaluación completa (15/15)',
  rB.completo === true && rB.pendientes === 0,
  `completo=${rB.completo} pendientes=${rB.pendientes}`);

// ══════════════════════════════════════════════════════════════
// 3. CASO D — Stablecoin USDT, investigado cooperante,
//             clave entregada, custodio institucional, proceso 4 meses
//
// Mapping razonado:
//   V1=0 (USDT stablecoin)       V2=0 (variación <10%)
//   V3=0 (4 meses < 6 meses)     V4=1 (valor 10k-500k)
//   C1=0 (custodio institucional) C2=0 (clave entregada, acta formal)
//   C3=0 (seed phrase custodiada) C4=1 (verificación manual trimestral)
//   I1=0 (clave vinculada directamente al investigado)
//   I2=0 (clave obtenida y bajo custodia formalizada)
//   I3=1 (en libertad provisional con medidas — cooperante pero no preso)
//   I4=0 (USDT en exchange cooperante)
//   J1=1 (sin criterio propio juzgado, pero AP tiene doctrina)
//   J2=1 (stablecoin, variación documentada < umbral)
//   J3=0 (custodio institucional, responsabilidad clara)
//
// D1 = (0+0+0+1) × 4.375 = 1 × 4.375 = 4.375
// D2 = (0+0+0+1) × 3.125 = 1 × 3.125 = 3.125
// D3 = (0+0+1+0) × 3.125 = 1 × 3.125 = 3.125
// D4 = (1+1+0) × 2.5    = 2 × 2.5   = 5.000
// TOTAL = 15.625 ≈ 15
// ══════════════════════════════════════════════════════════════
const respD = {
  V1:0, V2:0, V3:0, V4:1,   // Volatilidad
  C1:0, C2:0, C3:0, C4:1,   // Custodia
  I1:0, I2:0, I3:1, I4:0,   // Inejecutabilidad
  J1:1, J2:1, J3:0           // Jurídico-procesal
};
const rD = MGRPICScoring.calculateScore(respD);

assert('Caso D — puntuación ≈ 15 (±2)',
  nearly(rD.total, 15, 2),
  `obtenido: ${rD.total}`);
assert('Caso D — nivel BAJO',
  rD.nivelRiesgo.nivel === 'BAJO',
  `obtenido: ${rD.nivelRiesgo.nivel}`);
assert('Caso D — D1 = 4.375',
  rD.dimensiones[0].puntuacion === 4.375,
  `obtenido: ${rD.dimensiones[0].puntuacion}`);
assert('Caso D — D2 = 3.125',
  rD.dimensiones[1].puntuacion === 3.125,
  `obtenido: ${rD.dimensiones[1].puntuacion}`);
assert('Caso D — D3 = 3.125',
  rD.dimensiones[2].puntuacion === 3.125,
  `obtenido: ${rD.dimensiones[2].puntuacion}`);
assert('Caso D — D4 = 5.000',
  rD.dimensiones[3].puntuacion === 5,
  `obtenido: ${rD.dimensiones[3].puntuacion}`);
assert('Caso D — total = 15.63 (redondeado 2 dec)',
  rD.total === 15.63,
  `obtenido: ${rD.total}`);
assert('Caso D — evaluación completa (15/15)',
  rD.completo === true && rD.pendientes === 0,
  `completo=${rD.completo} pendientes=${rD.pendientes}`);

// ══════════════════════════════════════════════════════════════
// 4. VERIFICACIONES ADICIONALES DE ROBUSTEZ
// ══════════════════════════════════════════════════════════════

// 4a. Caso mínimo — todos en Bajo (0) → 0 puntos, nivel BAJO
const respMin = {};
MGRPIC_DATA.dimensiones.forEach(d => d.indicadores.forEach(i => { respMin[i.id] = 0; }));
const rMin = MGRPICScoring.calculateScore(respMin);
assert('Caso MIN — puntuación exactamente 0', rMin.total === 0, `obtenido: ${rMin.total}`);
assert('Caso MIN — nivel BAJO', rMin.nivelRiesgo.nivel === 'BAJO', `obtenido: ${rMin.nivelRiesgo.nivel}`);

// 4b. Fronteras de nivel
const frontier = [
  [25, 'BAJO'],   [26, 'MODERADO'],
  [50, 'MODERADO'], [51, 'ALTO'],
  [75, 'ALTO'],   [76, 'CRÍTICO'],
];
frontier.forEach(([score, expectedNivel]) => {
  const entry = MGRPIC_DATA.escalaRiesgo.find(e => score >= e.min && score <= e.max);
  assert(`Frontera: ${score} pts → ${expectedNivel}`,
    entry && entry.nivel === expectedNivel,
    entry ? `obtenido: ${entry.nivel}` : 'no encontrado');
});

// 4c. validateAnswers — parcial
const respParcial = { V1: 2, V2: 1 };
const v = MGRPICScoring.validateAnswers(respParcial);
assert('validateAnswers — parcial: 2/15 respondidos',
  v.respondidos === 2 && v.total === 15 && !v.valido,
  `respondidos=${v.respondidos} valido=${v.valido}`);
assert('validateAnswers — parcial: 13 faltantes',
  v.faltantes.length === 13,
  `faltantes=${v.faltantes.length}`);

// 4d. validateAnswers — completo
const vCompleto = MGRPICScoring.validateAnswers(respMax);
assert('validateAnswers — completo: 15/15',
  vCompleto.respondidos === 15 && vCompleto.valido === true,
  `respondidos=${vCompleto.respondidos} valido=${vCompleto.valido}`);

// 4e. totalIndicadores = 15
assert('totalIndicadores() = 15',
  MGRPICScoring.totalIndicadores() === 15, '');

// 4f. Los resultados de dimensiones tienen porcentaje correcto
assert('Caso B — D2 porcentaje = 100%',
  rB.dimensiones[1].porcentaje === 100, `obtenido: ${rB.dimensiones[1].porcentaje}`);
assert('Caso B — D3 porcentaje = 87.5%',
  rB.dimensiones[2].porcentaje === 87.5, `obtenido: ${rB.dimensiones[2].porcentaje}`);
assert('Caso D — D1 porcentaje = 12.5%',
  rD.dimensiones[0].porcentaje === 12.5, `obtenido: ${rD.dimensiones[0].porcentaje}`);

// 4g. Estructura del resultado: indicadores tienen etiquetaElegida
const ind = rB.dimensiones[0].indicadores[0]; // V1 = 2
assert('Indicador tiene etiquetaElegida',
  typeof ind.etiquetaElegida === 'string' && ind.etiquetaElegida.length > 0,
  `etiquetaElegida="${ind.etiquetaElegida}"`);
assert('Indicador V1=2 tiene nivel "Alto"',
  ind.nivel === 'Alto', `obtenido: "${ind.nivel}"`);
assert('Indicador V4=0 en caso B tiene nivel "Bajo"',
  rB.dimensiones[0].indicadores[3].nivel === 'Bajo',
  `obtenido: "${rB.dimensiones[0].indicadores[3].nivel}"`);

// 4h. data.js — todos los niveles de riesgo tienen colorTexto
assert('Todos los niveles tienen colorTexto',
  MGRPIC_DATA.escalaRiesgo.every(n => n.colorTexto),
  MGRPIC_DATA.escalaRiesgo.map(n => `${n.nivel}:${n.colorTexto}`).join(' '));

// 4i. Comprobación de que calcular() es alias de calculateScore()
const rCalc = MGRPICScoring.calcular(respB);
assert('calcular() es alias de calculateScore() — total coincide',
  rCalc.total === rB.total, `calcular=${rCalc.total} calculateScore=${rB.total}`);

// ══════════════════════════════════════════════════════════════
// 5. VERIFICACIÓN DE CABECERAS DE ARCHIVOS JS
// ══════════════════════════════════════════════════════════════
['data.js', 'scoring.js', 'report.js', 'app.js'].forEach(file => {
  const content = fs.readFileSync(`mgrpic/js/${file}`, 'utf8');
  assert(`${file} — tiene comentario de cabecera (/** o /*)`,
    content.startsWith('/**') || content.startsWith('/*'),
    'El archivo no empieza con un comentario de bloque');
  assert(`${file} — menciona su función/responsabilidad`,
    content.slice(0, 600).includes('responsab') ||
    content.slice(0, 600).includes('Responsab') ||
    content.slice(0, 600).includes('función') ||
    content.slice(0, 600).includes('Contiene') ||
    content.slice(0, 600).includes('módulo') ||
    content.slice(0, 600).includes('función') ||
    content.slice(0, 600).includes('Gestiona') ||
    content.slice(0, 600).includes('Define') ||
    content.slice(0, 600).includes('Hoja') ||
    content.slice(0, 600).includes('Generación') ||
    content.slice(0, 600).includes('interfaz'),
    `primeros 600 chars: "${content.slice(0, 200)}..."`);
});

// ══════════════════════════════════════════════════════════════
// 6. VERIFICACIÓN DE LÓGICA OFFLINE (sin dependencias críticas en scoring/report)
// ══════════════════════════════════════════════════════════════
// scoring.js y data.js no deben referenciar CDN ni API externas
['data.js', 'scoring.js', 'report.js'].forEach(file => {
  const content = fs.readFileSync(`mgrpic/js/${file}`, 'utf8');
  assert(`${file} — sin referencias a CDN/fetch/XMLHttpRequest`,
    !content.includes('fetch(') &&
    !content.includes('XMLHttpRequest') &&
    !content.includes('cdn.') &&
    !content.includes('https://'),
    'Encontrada dependencia de red en lógica de cálculo');
});

// ══════════════════════════════════════════════════════════════
// 7. VERIFICACIÓN DE styles.css — print oculta UI
// ══════════════════════════════════════════════════════════════
const css = fs.readFileSync('mgrpic/css/styles.css', 'utf8');
assert('CSS — @media print existe',
  css.includes('@media print'), '');
assert('CSS — print oculta .btn',
  css.includes('.btn') && css.includes('display: none'),
  '');
assert('CSS — @page A4',
  css.includes('size: A4'), '');
assert('CSS — print-color-adjust',
  css.includes('print-color-adjust'), '');
assert('CSS — @import Inter',
  css.includes("Inter"), '');
assert('CSS — --color-primario es #1F3864',
  css.includes('#1F3864'), '');
assert('CSS — --color-bajo es #70AD47',
  css.includes('#70AD47'), '');
assert('CSS — --color-moderado es #FFD966',
  css.includes('#FFD966'), '');
assert('CSS — --color-alto es #FF9933',
  css.includes('#FF9933'), '');
assert('CSS — --color-critico es #FF0000',
  css.includes('#FF0000'), '');

// ══════════════════════════════════════════════════════════════
// RESULTADO FINAL
// ══════════════════════════════════════════════════════════════
process.stdout.write('\n══════════════════════════════════════════\n');
process.stdout.write('RESULTADO PASO 7: ' + ok + ' pasados, ' + fail + ' fallidos de ' + (ok+fail) + ' tests\n');

if (errors.length) {
  process.stdout.write('\nFALLOS DETECTADOS:\n');
  errors.forEach(e => process.stdout.write(e + '\n'));
}

if (fail === 0) {
  process.stdout.write('\n✓ TODOS LOS TESTS PASAN — App lista para entrega\n');
  process.stdout.write('\n  Caso B: ' + rB.total.toFixed(3) + ' pts → ' + rB.nivelRiesgo.nivel + '\n');
  process.stdout.write('  Caso D: ' + rD.total.toFixed(3) + ' pts → ' + rD.nivelRiesgo.nivel + '\n');
  process.stdout.write('  Caso MAX: ' + rMax.total + ' pts → ' + rMax.nivelRiesgo.nivel + '\n');
}

process.exit(fail > 0 ? 1 : 0);
