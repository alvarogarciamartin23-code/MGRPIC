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
 * Uso:
 *   const html = MGRPICReport.generar(datosCaso, resultado, orientaciones);
 *
 * Dependencias:
 *   data.js → MGRPIC_DATA (para nombre de la herramienta y versión)
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

  /** Devuelve la fecha y hora actuales en formato español. */
  function _fmtAhora() {
    const ahora = new Date();
    return ahora.toLocaleString('es-ES', {
      day:    '2-digit', month: '2-digit', year: 'numeric',
      hour:   '2-digit', minute: '2-digit'
    });
  }

  /** Formatea un valor numérico con dos decimales. */
  function _pts(n) {
    return Number(n).toFixed(2);
  }

  /** Devuelve las clases CSS de color correspondientes al nivel de riesgo. */
  function _estiloNivel(nivelTexto) {
    const mapa = {
      'BAJO':     { color: '#27ae60', bg: '#d5f5e3' },
      'MODERADO': { color: '#f39c12', bg: '#fef9e7' },
      'ALTO':     { color: '#e67e22', bg: '#fdebd0' },
      'CRÍTICO':  { color: '#c0392b', bg: '#fadbd8' }
    };
    return mapa[nivelTexto] || { color: '#4a5e72', bg: '#f4f6f9' };
  }

  /* ─────────────────────────────────────────────
   * FUNCIÓN PRINCIPAL
   * ───────────────────────────────────────────── */

  /**
   * Genera el HTML completo del informe MGRPIC.
   *
   * @param {object} datosCaso - Campos del formulario de la pantalla 1.
   * @param {object} resultado - Resultado de MGRPICScoring.calcular().
   * @param {object} orientaciones - Objeto { NIVEL: [array de recomendaciones] }.
   * @returns {string} HTML del informe listo para inyectar en el DOM.
   */
  function generar(datosCaso, resultado, orientaciones) {
    const nivel      = resultado.nivelRiesgo;
    const estilos    = _estiloNivel(nivel.nivel);
    const ahora      = _fmtAhora();
    const oriList    = (orientaciones[nivel.nivel] || [])
                         .map(p => `<li>${p}</li>`).join('');

    // ── 1. Encabezado institucional ──────────────────────────────────────
    const secEncabezado = `
      <div class="report-section">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;
                    border-bottom: 2px solid #1a3a5c; padding-bottom: 0.75rem; margin-bottom: 1rem;">
          <div>
            <div style="font-size:1.5rem; font-weight:800; color:#1a3a5c; letter-spacing:0.06em;">
              MGRPIC
            </div>
            <div style="font-size:0.82rem; color:#4a5e72; max-width:480px; line-height:1.4;">
              ${MGRPIC_DATA.nombre}
            </div>
          </div>
          <div style="text-align:right; font-size:0.78rem; color:#7a90a4; line-height:1.7;">
            <div>Versión ${MGRPIC_DATA.version}</div>
            <div>Generado: ${ahora}</div>
          </div>
        </div>
        <div style="font-size:0.78rem; color:#7a90a4; font-style:italic;">
          Los resultados de este informe tienen carácter orientativo y no sustituyen el criterio
          judicial ni la valoración jurídica de los profesionales responsables del procedimiento.
        </div>
      </div>`;

    // ── 2. Datos del caso ────────────────────────────────────────────────
    const campos = [
      ['Número de diligencias',      datosCaso.numeroDiligencias],
      ['Unidad policial actuante',   datosCaso.unidadPolicial],
      ['Fecha de la incautación',    _fmtFecha(datosCaso.fechaIncautacion)],
      ['Tipo de activo incautado',   datosCaso.tipoActivo],
      ['Órgano judicial competente', datosCaso.organoJudicial],
    ];
    const filasCase = campos.map(([lbl, val]) => `
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
        ${filasCase}
        ${obsHtml}
      </div>`;

    // ── 3. Puntuación global ─────────────────────────────────────────────
    const secGlobal = `
      <div class="report-section">
        <div class="report-section-title">2. Puntuación Global de Riesgo Procesal</div>
        <div class="report-total-box"
             style="background:${estilos.bg}; border: 2px solid ${estilos.color};">
          <div>
            <div class="report-total-score" style="color:${estilos.color}">
              ${_pts(resultado.total)}
            </div>
            <div style="font-size:0.78rem; color:${estilos.color}; font-weight:600;">
              puntos sobre 100
            </div>
          </div>
          <div style="flex:1; padding-left: 1rem; border-left: 2px solid ${estilos.color};">
            <div class="report-total-nivel" style="color:${estilos.color}">
              RIESGO ${nivel.nivel}
            </div>
            <div style="font-size:0.88rem; color:#4a5e72; margin-top:0.3rem; line-height:1.55;">
              ${nivel.descripcion}
            </div>
          </div>
        </div>
      </div>`;

    // ── 4. Desglose por dimensiones ──────────────────────────────────────
    const filasDim = resultado.dimensiones.map(dim => `
      <tr>
        <td style="color:${dim.color}; font-weight:600;">${dim.nombre}</td>
        <td style="text-align:center">${dim.peso}%</td>
        <td style="text-align:center">${dim.sumaBruto !== undefined ? dim.sumaBruto : dim.sumaBruta} / ${dim.maxBruto}</td>
        <td style="text-align:center; font-weight:700; color:${dim.color}">
          ${_pts(dim.puntuacion)}
        </td>
        <td style="text-align:center; color:#4a5e72">${dim.maxPonderado}</td>
        <td style="text-align:center">${dim.porcentaje}%</td>
      </tr>`).join('');

    const secDesglose = `
      <div class="report-section">
        <div class="report-section-title">3. Desglose por Dimensión</div>
        <table style="width:100%; border-collapse:collapse; font-size:0.86rem;">
          <thead>
            <tr style="background:#f0f3f8;">
              <th style="padding:0.45rem 0.6rem; text-align:left; font-size:0.78rem;
                         text-transform:uppercase; letter-spacing:0.05em; color:#4a5e72;
                         border-bottom:2px solid #dde3ec;">Dimensión</th>
              <th style="padding:0.45rem 0.6rem; text-align:center; font-size:0.78rem;
                         text-transform:uppercase; letter-spacing:0.05em; color:#4a5e72;
                         border-bottom:2px solid #dde3ec;">Peso</th>
              <th style="padding:0.45rem 0.6rem; text-align:center; font-size:0.78rem;
                         text-transform:uppercase; letter-spacing:0.05em; color:#4a5e72;
                         border-bottom:2px solid #dde3ec;">Suma bruta</th>
              <th style="padding:0.45rem 0.6rem; text-align:center; font-size:0.78rem;
                         text-transform:uppercase; letter-spacing:0.05em; color:#4a5e72;
                         border-bottom:2px solid #dde3ec;">Puntuación</th>
              <th style="padding:0.45rem 0.6rem; text-align:center; font-size:0.78rem;
                         text-transform:uppercase; letter-spacing:0.05em; color:#4a5e72;
                         border-bottom:2px solid #dde3ec;">Máximo</th>
              <th style="padding:0.45rem 0.6rem; text-align:center; font-size:0.78rem;
                         text-transform:uppercase; letter-spacing:0.05em; color:#4a5e72;
                         border-bottom:2px solid #dde3ec;">% Riesgo dim.</th>
            </tr>
          </thead>
          <tbody>${filasDim}</tbody>
          <tfoot>
            <tr style="background:#f8f9fb; font-weight:700; border-top:2px solid #dde3ec;">
              <td style="padding:0.45rem 0.6rem;" colspan="3">TOTAL</td>
              <td style="padding:0.45rem 0.6rem; text-align:center; color:${estilos.color}; font-size:1rem;">
                ${_pts(resultado.total)}
              </td>
              <td style="padding:0.45rem 0.6rem; text-align:center">100</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>`;

    // ── 5. Valoración indicador a indicador ──────────────────────────────
    const bloquesDim = resultado.dimensiones.map(dim => {
      const coloresNivel = {
        'Bajo':     '#27ae60',
        'Moderado': '#c87f0a',
        'Alto':     '#e67e22'
      };

      const filasInd = dim.indicadores.map(ind => `
        <div class="report-indicator-row">
          <span class="report-ind-codigo" style="color:${dim.color}">${ind.codigo}</span>
          <span>
            <strong>${ind.nombre}</strong><br>
            <span style="font-size:0.82rem; color:#4a5e72; font-style:italic;">${ind.etiquetaElegida || '— No respondido —'}</span>
          </span>
          <span class="report-ind-nivel" style="color:${coloresNivel[ind.nivel] || '#4a5e72'}">
            ${ind.nivel || '—'} (${ind.valor !== null ? ind.valor : '?'})
          </span>
        </div>`).join('');

      return `
        <div style="margin-bottom:1rem;">
          <div style="display:flex; align-items:center; gap:0.5rem;
                      font-size:0.82rem; font-weight:700; color:${dim.color};
                      text-transform:uppercase; letter-spacing:0.06em;
                      border-bottom:1.5px solid ${dim.color}; padding-bottom:0.25rem;
                      margin-bottom:0.5rem;">
            <span>${dim.id}</span>
            <span>${dim.nombre}</span>
            <span style="margin-left:auto; font-weight:400; font-size:0.75rem; color:#7a90a4;">
              ${_pts(dim.puntuacion)} pts / ${dim.maxPonderado}
            </span>
          </div>
          ${filasInd}
        </div>`;
    }).join('');

    const secIndicadores = `
      <div class="report-section">
        <div class="report-section-title">4. Valoración Detallada por Indicador</div>
        ${bloquesDim}
      </div>`;

    // ── 6. Orientación operativa ─────────────────────────────────────────
    const secOrientacion = `
      <div class="report-section">
        <div class="report-section-title">5. Orientación Operativa</div>
        <div style="background:${estilos.bg}; border-left:4px solid ${estilos.color};
                    border-radius:4px; padding:0.75rem 1rem; margin-bottom:0.75rem;">
          <strong style="color:${estilos.color}; font-size:0.95rem;">
            Nivel de Riesgo: ${nivel.nivel} (${_pts(resultado.total)} puntos)
          </strong>
        </div>
        <ul style="list-style:none; display:flex; flex-direction:column; gap:0.5rem;">
          ${oriList}
        </ul>
      </div>`;

    // ── 7. Pie de documento ───────────────────────────────────────────────
    const secPie = `
      <div class="report-section" style="border-top:1px solid #dde3ec; padding-top:0.75rem;
                                          margin-top:1rem;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; font-size:0.8rem; color:#7a90a4;">
          <div>
            <strong style="color:#4a5e72">Herramienta:</strong> ${MGRPIC_DATA.acronimo} v${MGRPIC_DATA.version}<br>
            <strong style="color:#4a5e72">Fecha de generación:</strong> ${ahora}<br>
            <strong style="color:#4a5e72">Completitud:</strong> ${resultado.completo ? 'Evaluación completa (15/15 indicadores)' : `Evaluación parcial (${15 - resultado.pendientes}/15 indicadores)`}
          </div>
          <div style="text-align:right; font-style:italic; line-height:1.6;">
            Los resultados tienen carácter orientativo.<br>
            No sustituyen el criterio judicial.<br>
            Uso exclusivo en procedimientos penales españoles.
          </div>
        </div>
      </div>`;

    // ── Composición final ─────────────────────────────────────────────────
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
