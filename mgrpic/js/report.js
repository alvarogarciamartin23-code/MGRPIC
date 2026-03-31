/**
 * report.js — Generación del informe estructurado de la MGRPIC.
 *
 * Responsabilidades:
 *   · Generar el HTML del informe completo a partir de los datos del caso
 *     y el resultado del cálculo (devuelto por scoring.js).
 *   · El HTML generado se inyecta en la pantalla 7 y se copia a la zona
 *     de impresión cuando el usuario pulsa "Imprimir".
 *   · Esta función es pura: no lee ni escribe el DOM directamente.
 *     Solo recibe datos y devuelve HTML.
 *
 * Estructura del informe (PASO 5):
 *   Encabezado   — "INFORME DE EVALUACIÓN MGRPIC", fecha/hora, subtítulo institucional
 *   Sección 1    — Datos del procedimiento
 *   Sección 2    — Resultado global: puntuación, nivel de riesgo y orientación inmediata
 *   Sección 3    — Desglose por dimensiones (tabla)
 *   Sección 4    — Valoración indicador por indicador (nombre, nivel, puntuación, criterio)
 *   Sección 5    — Orientaciones operativas detalladas con aviso expreso sobre naturaleza de apoyo
 *   Pie          — Cláusula de no sustitución del criterio judicial
 *
 * Uso:
 *   const html = MGRPICReport.generar(datosCaso, resultado, orientaciones);
 *
 * Dependencias:
 *   data.js    → MGRPIC_DATA (nombre, versión, acrónimo)
 *   scoring.js → MGRPICScoring.totalIndicadores()
 */

const MGRPICReport = (() => {

  /* ─────────────────────────────────────────────
   * UTILIDADES DE FORMATO
   * ───────────────────────────────────────────── */

  /** Formatea una fecha ISO (YYYY-MM-DD) en formato español (DD/MM/YYYY). */
  function _fmtFecha(iso) {
    if (!iso) return '—';
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
  }

  /** Devuelve la fecha y hora actuales en formato español completo. */
  function _fmtAhora() {
    return new Date().toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  /** Formatea un número con dos decimales. */
  function _pts(n) {
    return Number(n).toFixed(2);
  }

  /**
   * Devuelve los colores asociados a un nivel de riesgo.
   * color      → color vivo de la paleta (para fondos, bordes, badges)
   * bg         → fondo claro para cajas
   * borde      → color de borde (igual que color)
   * texto      → versión oscura legible sobre blanco para texto y títulos
   */
  function _estiloNivel(nivelTexto) {
    const mapa = {
      'BAJO':     { color: '#70AD47', bg: '#e8f5dd', borde: '#70AD47', texto: '#3d7020' },
      'MODERADO': { color: '#FFD966', bg: '#fff8cc', borde: '#B8860B', texto: '#7d5c00' },
      'ALTO':     { color: '#FF9933', bg: '#fff0d9', borde: '#FF9933', texto: '#a04800' },
      'CRÍTICO':  { color: '#FF0000', bg: '#ffe5e5', borde: '#FF0000', texto: '#cc0000' }
    };
    return mapa[nivelTexto] || { color: '#4a5e72', bg: '#F2F2F2', borde: '#7a90a4', texto: '#4a5e72' };
  }

  /* ─────────────────────────────────────────────
   * FUNCIÓN PRINCIPAL
   * ───────────────────────────────────────────── */

  /**
   * Genera el HTML completo del informe MGRPIC.
   *
   * @param {object} datosCaso    - Campos del formulario de la pantalla 1.
   * @param {object} resultado    - Resultado de MGRPICScoring.calculateScore().
   * @param {object} orientaciones - { NIVEL: [array de recomendaciones] }.
   * @returns {string} HTML del informe listo para inyectar en el DOM.
   */
  function generar(datosCaso, resultado, orientaciones) {
    const nivel   = resultado.nivelRiesgo;
    const est     = _estiloNivel(nivel.nivel);
    const ahora   = _fmtAhora();
    const totalInd = MGRPICScoring.totalIndicadores();

    // ── ENCABEZADO ────────────────────────────────────────────────────────
    const secEncabezado = `
      <div class="report-section report-header-section"
           style="border-bottom:3px solid #1a3a5c; padding-bottom:1rem; margin-bottom:0;">
        <div style="text-align:center; padding:0.5rem 0 0.75rem;">
          <div style="font-size:0.75rem; font-weight:600; letter-spacing:0.15em;
                      text-transform:uppercase; color:#7a90a4; margin-bottom:0.3rem;">
            ${MGRPIC_DATA.acronimo} · Versión ${MGRPIC_DATA.version}
          </div>
          <div style="display:flex;align-items:center;justify-content:center;gap:0.75rem;margin-bottom:0.2rem;">
            <svg viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" width="40" height="40" aria-hidden="true">
              <polygon points="28,3 51,15.5 51,40.5 28,53 5,40.5 5,15.5" fill="#1F3864"/>
              <line x1="28" y1="18" x2="18" y2="35" stroke="rgba(255,255,255,0.5)" stroke-width="1.8" stroke-linecap="round"/>
              <line x1="28" y1="18" x2="38" y2="35" stroke="rgba(255,255,255,0.5)" stroke-width="1.8" stroke-linecap="round"/>
              <line x1="18" y1="35" x2="38" y2="35" stroke="rgba(255,255,255,0.5)" stroke-width="1.8" stroke-linecap="round"/>
              <circle cx="28" cy="18" r="4.5" fill="white"/>
              <circle cx="18" cy="35" r="4.5" fill="white"/>
              <circle cx="38" cy="35" r="4.5" fill="white"/>
            </svg>
            <div style="font-size:1.6rem; font-weight:800; color:#1F3864;
                        letter-spacing:0.04em; text-transform:uppercase; line-height:1.2;">
              Informe de Evaluación MGRPIC
            </div>
          </div>
          <div style="font-size:0.78rem; font-weight:600; color:#4a5e72;
                      text-transform:uppercase; letter-spacing:0.08em;
                      margin-top:0.4rem; line-height:1.5;">
            Herramienta de Apoyo a la Decisión Policial y Judicial<br>
            en Materia de Criptoactivos Incautados
          </div>
          <div style="margin-top:0.6rem; font-size:0.78rem; color:#7a90a4;">
            Fecha y hora de generación: <strong>${ahora}</strong>
          </div>
        </div>
        <div style="font-size:0.74rem; color:#7a90a4; font-style:italic;
                    text-align:center; border-top:1px solid #dde3ec; padding-top:0.5rem;">
          Los resultados de este informe tienen carácter orientativo. No sustituyen el criterio
          judicial ni la valoración jurídica de los profesionales responsables del procedimiento.
        </div>
      </div>`;

    // ── SECCIÓN 1 — DATOS DEL PROCEDIMIENTO ───────────────────────────────
    const camposCaso = [
      ['Número de diligencias',      datosCaso.numeroDiligencias],
      ['Unidad policial actuante',   datosCaso.unidadPolicial],
      ['Fecha de la incautación',    _fmtFecha(datosCaso.fechaIncautacion)],
      ['Tipo de activo incautado',   datosCaso.tipoActivo],
      ['Órgano judicial competente', datosCaso.organoJudicial],
    ];

    const filasCaso = camposCaso.map(([lbl, val]) => `
      <div class="report-field">
        <span class="report-field-label">${lbl}</span>
        <span>${val || '—'}</span>
      </div>`).join('');

    const obsHtml = datosCaso.observaciones
      ? `<div class="report-field">
           <span class="report-field-label">Observaciones</span>
           <span>${datosCaso.observaciones}</span>
         </div>`
      : '';

    const secDatosCaso = `
      <div class="report-section">
        <div class="report-section-title">1. Datos del Procedimiento</div>
        ${filasCaso}
        ${obsHtml}
      </div>`;

    // ── SECCIÓN 2 — RESULTADO GLOBAL ──────────────────────────────────────
    // Incluye puntuación, nivel de riesgo y orientación operativa inmediata en texto completo
    const oriItems = (orientaciones[nivel.nivel] || []);
    const primeraOri = oriItems.length > 0
      ? `<div style="margin-top:0.75rem; padding:0.6rem 0.85rem;
                     background:#fff; border-left:3px solid ${est.borde};
                     border-radius:0 4px 4px 0; font-size:0.86rem; color:#2c3e50; line-height:1.6;">
           <strong style="color:${est.texto}; display:block; margin-bottom:0.25rem;">
             Orientación operativa inmediata:
           </strong>
           ${oriItems[0]}
         </div>`
      : '';

    const secGlobal = `
      <div class="report-section">
        <div class="report-section-title">2. Resultado Global de Riesgo Procesal</div>
        <div class="report-total-box"
             style="background:${est.bg}; border:2px solid ${est.borde};">
          <div>
            <div class="report-total-score" style="color:${est.texto}">
              ${_pts(resultado.total)}
            </div>
            <div style="font-size:0.78rem; color:${est.texto}; font-weight:600;">
              puntos sobre 100
            </div>
          </div>
          <div style="flex:1; padding-left:1rem; border-left:2px solid ${est.borde};">
            <div class="report-total-nivel" style="color:${est.texto}">
              RIESGO ${nivel.nivel}
            </div>
            <div style="font-size:0.86rem; color:#4a5e72; margin-top:0.3rem; line-height:1.55;">
              ${nivel.descripcion}
            </div>
          </div>
        </div>
        ${primeraOri}
      </div>`;

    // ── SECCIÓN 3 — DESGLOSE POR DIMENSIONES ─────────────────────────────
    const filasDim = resultado.dimensiones.map(dim => `
      <tr>
        <td style="padding:0.45rem 0.6rem; font-weight:600; color:${dim.color};">
          ${dim.nombre}
        </td>
        <td style="padding:0.45rem 0.6rem; text-align:center; color:#4a5e72;">
          ${dim.peso}%
        </td>
        <td style="padding:0.45rem 0.6rem; text-align:center; font-weight:700; color:${dim.color};">
          ${_pts(dim.puntuacion)}
        </td>
        <td style="padding:0.45rem 0.6rem; text-align:center; color:#4a5e72;">
          ${dim.maxPonderado}
        </td>
        <td style="padding:0.45rem 0.6rem; text-align:center;">
          ${dim.porcentaje}%
        </td>
      </tr>`).join('');

    const thStyle = `padding:0.45rem 0.6rem; font-size:0.76rem; text-transform:uppercase;
                     letter-spacing:0.05em; color:#4a5e72; border-bottom:2px solid #dde3ec;
                     font-weight:700;`;

    const secDesglose = `
      <div class="report-section">
        <div class="report-section-title">3. Desglose por Dimensión</div>
        <table style="width:100%; border-collapse:collapse; font-size:0.86rem;">
          <thead>
            <tr style="background:#f0f3f8;">
              <th style="${thStyle} text-align:left;">Dimensión</th>
              <th style="${thStyle} text-align:center;">Peso</th>
              <th style="${thStyle} text-align:center;">Puntuación obtenida</th>
              <th style="${thStyle} text-align:center;">Puntuación máxima</th>
              <th style="${thStyle} text-align:center;">% Riesgo dim.</th>
            </tr>
          </thead>
          <tbody>${filasDim}</tbody>
          <tfoot>
            <tr style="background:#f8f9fb; font-weight:700; border-top:2px solid #dde3ec;">
              <td style="padding:0.45rem 0.6rem;" colspan="2">TOTAL</td>
              <td style="padding:0.45rem 0.6rem; text-align:center;
                         color:${est.color}; font-size:1rem;">
                ${_pts(resultado.total)}
              </td>
              <td style="padding:0.45rem 0.6rem; text-align:center;">100</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>`;

    // ── SECCIÓN 4 — VALORACIÓN INDICADOR POR INDICADOR ───────────────────
    const coloresNivel = {
      'Bajo':     '#27ae60',
      'Moderado': '#ca6f1e',
      'Alto':     '#c0392b'
    };
    const bgNivel = {
      'Bajo':     '#eafaf1',
      'Moderado': '#fef5e7',
      'Alto':     '#fdedec'
    };

    const bloquesDim = resultado.dimensiones.map((dim, idx) => {
      const filasInd = dim.indicadores.map(ind => {
        const colorN = coloresNivel[ind.nivel] || '#7a90a4';
        const bgN    = bgNivel[ind.nivel]    || '#f4f6f9';
        const nivelTxt = ind.nivel    || '—';
        const valorTxt = ind.valor !== null ? ind.valor : '?';
        const criterio = ind.etiquetaElegida || '— No respondido —';

        return `
          <div style="display:grid; grid-template-columns:4rem 1fr auto;
                      gap:0.5rem 0.75rem; align-items:start;
                      padding:0.5rem 0.6rem; border-bottom:1px solid #ecf0f4;
                      font-size:0.84rem;">
            <div style="font-weight:700; color:${dim.color}; font-size:0.78rem;
                        letter-spacing:0.05em; padding-top:0.1rem;">
              ${ind.codigo}
            </div>
            <div>
              <div style="font-weight:600; color:#2c3e50; margin-bottom:0.15rem;">
                ${ind.nombre}
              </div>
              <div style="font-size:0.79rem; color:#4a5e72; font-style:italic; line-height:1.45;">
                Criterio: ${criterio}
              </div>
            </div>
            <div style="text-align:center; min-width:6rem;">
              <span style="display:inline-block; padding:0.15rem 0.5rem;
                           background:${bgN}; color:${colorN};
                           border:1px solid ${colorN}; border-radius:3px;
                           font-size:0.76rem; font-weight:700; white-space:nowrap;">
                ${nivelTxt} (${valorTxt})
              </span>
            </div>
          </div>`;
      }).join('');

      return `
        <div style="margin-bottom:0.75rem; border:1px solid #dde3ec; border-radius:4px; overflow:hidden;">
          <div style="display:flex; align-items:center; gap:0.5rem;
                      background:#f0f3f8; padding:0.4rem 0.6rem;
                      border-bottom:2px solid ${dim.color};">
            <span style="font-size:0.76rem; font-weight:800; color:${dim.color};
                         text-transform:uppercase; letter-spacing:0.07em;">
              ${dim.id} — ${dim.nombre}
            </span>
            <span style="margin-left:auto; font-size:0.74rem; color:#7a90a4; font-weight:400;">
              ${_pts(dim.puntuacion)} / ${dim.maxPonderado} puntos
            </span>
          </div>
          ${filasInd}
        </div>`;
    }).join('');

    const secIndicadores = `
      <div class="report-section">
        <div class="report-section-title">4. Valoración Detallada por Indicador</div>
        <p style="font-size:0.80rem; color:#7a90a4; margin-bottom:0.75rem; font-style:italic;">
          Para cada indicador se muestra el nombre, el nivel seleccionado (Bajo / Moderado / Alto),
          la puntuación asignada (0, 1 o 2) y el criterio correspondiente al nivel elegido.
        </p>
        ${bloquesDim}
      </div>`;

    // ── SECCIÓN 5 — ORIENTACIONES OPERATIVAS DETALLADAS ──────────────────
    const oriListItems = oriItems.map(p => `<li style="line-height:1.65;">${p}</li>`).join('');

    const secOrientacion = `
      <div class="report-section">
        <div class="report-section-title">5. Orientaciones Operativas Detalladas</div>

        <div style="background:${est.bg}; border-left:4px solid ${est.borde};
                    border-radius:0 4px 4px 0; padding:0.65rem 1rem; margin-bottom:0.75rem;">
          <div style="font-weight:700; color:${est.texto}; font-size:0.95rem; margin-bottom:0.2rem;">
            Nivel de Riesgo: ${nivel.nivel} &mdash; ${_pts(resultado.total)} puntos sobre 100
          </div>
          <div style="font-size:0.84rem; color:#4a5e72; line-height:1.55;">
            ${nivel.descripcion}
          </div>
        </div>

        <ol style="padding-left:1.5rem; margin:0 0 0.75rem; display:flex;
                   flex-direction:column; gap:0.5rem; font-size:0.88rem; color:#2c3e50;">
          ${oriListItems}
        </ol>

        <div style="background:#f8f9fb; border:1px solid #dde3ec; border-radius:4px;
                    padding:0.65rem 0.9rem; font-size:0.78rem; color:#4a5e72;
                    line-height:1.65; margin-top:0.5rem;">
          <strong style="color:#1a3a5c;">Nota sobre la naturaleza de esta herramienta:</strong>
          La MGRPIC es una herramienta de <em>apoyo a la decisión</em> diseñada para agentes de Policía Judicial y Letrados de la Administración de Justicia. Las orientaciones operativas recogidas en este informe tienen carácter orientativo y metodológico. <strong>La decisión final sobre las medidas a adoptar corresponde en todo caso al Juez de Instrucción competente</strong>, quien resolverá conforme al ordenamiento jurídico español y a las circunstancias concretas del procedimiento. Este informe podrá adjuntarse al acta de intervención o elevarse al órgano judicial como soporte documental de la solicitud de medidas cautelares.
        </div>
      </div>`;

    // ── PIE DE DOCUMENTO ──────────────────────────────────────────────────
    const completitudTxt = resultado.completo
      ? `Evaluación completa (${totalInd}/${totalInd} indicadores respondidos)`
      : `Evaluación parcial (${totalInd - resultado.pendientes}/${totalInd} indicadores respondidos)`;

    const secPie = `
      <div class="report-section"
           style="border-top:2px solid #dde3ec; padding-top:0.75rem; margin-top:0.5rem;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;
                    font-size:0.78rem; color:#7a90a4; line-height:1.7;">
          <div>
            <strong style="color:#4a5e72;">Herramienta:</strong>
            ${MGRPIC_DATA.acronimo} v${MGRPIC_DATA.version}<br>
            <strong style="color:#4a5e72;">Fecha de generación:</strong> ${ahora}<br>
            <strong style="color:#4a5e72;">Completitud:</strong> ${completitudTxt}
          </div>
          <div style="text-align:right; font-style:italic; line-height:1.7;">
            Documento generado automáticamente por la aplicación MGRPIC.<br>
            No sustituye al criterio judicial ni a la resolución<br>
            del órgano competente.
          </div>
        </div>
      </div>`;

    // ── COMPOSICIÓN FINAL ─────────────────────────────────────────────────
    return [
      secEncabezado,
      secDatosCaso,
      secGlobal,
      secDesglose,
      secIndicadores,
      secOrientacion,
      secPie
    ].join('\n');
  }

  // API pública
  return { generar };

})();

// Compatibilidad Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MGRPICReport;
}
