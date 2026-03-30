/**
 * app.js — Lógica principal de navegación y coordinación de la aplicación MGRPIC.
 *
 * Responsabilidades:
 *   · Mantener el estado global de la sesión (datos del caso + respuestas).
 *   · Gestionar la navegación entre las 8 pantallas (0-7).
 *   · Renderizar las pantallas de dimensiones (2-5) dinámicamente desde data.js.
 *   · Actualizar la barra de progreso global.
 *   · Coordinar scoring.js y report.js para el cálculo y la generación del informe.
 *   · Gestionar la impresión del informe.
 *
 * El estado NO se persiste en localStorage; se mantiene únicamente en memoria.
 * Si el usuario recarga la página, la evaluación se reinicia.
 *
 * Dependencias (deben cargarse antes en index.html):
 *   data.js → MGRPIC_DATA
 *   scoring.js → MGRPICScoring
 *   report.js → MGRPICReport
 */

const App = (() => {

  /* ─────────────────────────────────────────────
   * ESTADO GLOBAL DE LA SESIÓN
   * ───────────────────────────────────────────── */
  const estado = {
    /**
     * Datos del caso introducidos en la pantalla 1.
     * { numeroDiligencias, unidadPolicial, fechaIncautacion, tipoActivo, organoJudicial, observaciones }
     */
    datosCaso: {},

    /**
     * Respuestas del usuario a los 15 indicadores.
     * Objeto plano: { V1: 0, V2: 1, C3: 2, ... }
     */
    respuestas: {},

    /**
     * Pantalla actualmente visible (0-7).
     */
    pantallaActual: 0,

    /**
     * Resultado del último cálculo (devuelto por MGRPICScoring.calcular).
     * Se actualiza cada vez que se navega hacia delante.
     */
    ultimoResultado: null
  };

  /* ─────────────────────────────────────────────
   * MAPA: número de pantalla → índice de dimensión
   * pantallas 2,3,4,5 corresponden a dimensiones 0,1,2,3
   * ───────────────────────────────────────────── */
  const PANTALLA_A_DIM = { 2: 0, 3: 1, 4: 2, 5: 3 };
  const TOTAL_PASOS = 7; // pasos numerados 1-7 (pantallas 1-7)

  /* ─────────────────────────────────────────────
   * ORIENTACIONES OPERATIVAS POR NIVEL DE RIESGO
   * ───────────────────────────────────────────── */
  const ORIENTACIONES = {
    "BAJO": [
      "Mantener la custodia ordinaria de los criptoactivos con las medidas actualmente adoptadas.",
      "Documentar el estado de la custodia en el acta de intervención y verificar periódicamente el saldo en blockchain.",
      "No se aprecia necesidad de actuación urgente. Continuar el procedimiento con la tramitación habitual.",
      "Informar al Juez de Instrucción del estado de la incautación con periodicidad trimestral o ante cualquier variación significativa."
    ],
    "MODERADO": [
      "Revisar los indicadores con puntuación Moderado o Alto e identificar las deficiencias subsanables a corto plazo.",
      "Valorar la conveniencia de elevar propuesta al Juez de Instrucción para la adopción de medidas cautelares preventivas.",
      "Reforzar la cadena de custodia documentando formalmente todos los accesos y verificaciones periódicas.",
      "Considerar la contratación de custodio institucional especializado si la duración estimada del proceso supera los 12 meses.",
      "Documentar el contravalor en euros de los activos con periodicidad mensual para acreditar la variación de valor."
    ],
    "ALTO": [
      "Elevar propuesta motivada al Juez de Instrucción para la adopción urgente de medidas sobre los criptoactivos.",
      "Solicitar autorización judicial para la contratación de custodio institucional especializado (Prosegur Crypto u ORGA).",
      "Considerar la enajenación anticipada de los activos si la volatilidad o el riesgo de pérdida son determinantes.",
      "Realizar verificación inmediata del saldo en blockchain y documentar el estado actual de la custodia.",
      "Iniciar diligencias para obtener o asegurar las claves privadas si no están bajo control policial.",
      "Informar al Ministerio Fiscal de la situación para que valore el ejercicio de acciones cautelares adicionales."
    ],
    "CRÍTICO": [
      "ACTUACIÓN INMEDIATA IMPRESCINDIBLE. El riesgo de pérdida o frustración del decomiso es máximo.",
      "Solicitar con carácter urgente (art. 367 ter LECrim) autorización judicial para enajenación anticipada o conversión a moneda fiat.",
      "Si los activos están en exchanges, requerir con carácter urgente el bloqueo de las cuentas del investigado.",
      "Contactar con la Unidad de Decomiso y Gestión de Activos del Ministerio de Justicia para activar el protocolo de actuación.",
      "Elevar informe al Juez de Instrucción con la presente valoración de riesgo como soporte documental de la urgencia.",
      "Registrar con carácter inmediato toda incidencia en el acta de incautación para preservar la responsabilidad institucional.",
      "Valorar la solicitud de perito forense especializado en blockchain si la trazabilidad de los activos está comprometida."
    ]
  };

  /* ═══════════════════════════════════════════════
   * I. INICIALIZACIÓN
   * ═══════════════════════════════════════════════ */
  function init() {
    // Renderizar las pantallas de dimensiones en el DOM (pantallas 2-5)
    _renderizarPantallasDimensiones();

    // Mostrar pantalla inicial
    irA(0);
  }

  /* ─────────────────────────────────────────────
   * Restaura el estado visual de una pantalla de dimensión
   * (radio buttons + clases selected-*) al navegar hacia ella.
   * @param {number} numPantalla - 2, 3, 4 o 5.
   * ───────────────────────────────────────────── */
  function _restaurarEstadoVisualDimension(numPantalla) {
    const dimIndex = PANTALLA_A_DIM[numPantalla];
    if (dimIndex === undefined) return;
    const dimension = MGRPIC_DATA.dimensiones[dimIndex];
    const clasesNivel = ['selected-bajo', 'selected-moderado', 'selected-alto'];

    dimension.indicadores.forEach(ind => {
      const valor = estado.respuestas[ind.id];
      if (valor === undefined || valor === null || valor === '') return;

      // Marcar el radio button correspondiente
      const radio = document.querySelector(
        `input[name="${ind.id}"][value="${valor}"]`
      );
      if (radio) radio.checked = true;

      // Quitar clases previas y añadir la correcta al label
      const contenedor = document.getElementById('opciones-' + ind.id);
      if (contenedor) {
        contenedor.querySelectorAll('.opcion-label').forEach(lbl =>
          lbl.classList.remove('selected-bajo', 'selected-moderado', 'selected-alto')
        );
        const lbl = document.getElementById('label-' + ind.id + '-' + valor);
        if (lbl) lbl.classList.add(clasesNivel[valor]);
      }

      // Quitar aviso "sin respuesta" si estaba marcado
      const card = document.getElementById('card-' + ind.id);
      if (card) card.classList.remove('sin-respuesta');
    });

    // Actualizar el contador "X / N respondidos" de la dimensión
    _actualizarContadorDimension(numPantalla);
  }

  /* ─────────────────────────────────────────────
   * Restaura los valores del formulario de datos del caso (pantalla 1)
   * al navegar hacia ella después de haber avanzado.
   * ───────────────────────────────────────────── */
  function _restaurarFormularioCaso() {
    const ids = ['numeroDiligencias', 'unidadPolicial', 'fechaIncautacion',
                 'tipoActivo', 'organoJudicial', 'observaciones'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el && estado.datosCaso[id] !== undefined) {
        el.value = estado.datosCaso[id];
      }
    });
  }

  /* ─────────────────────────────────────────────
   * Actualiza el contador "X / N respondidos" en la cabecera
   * de una pantalla de dimensión ya renderizada.
   * @param {number} numPantalla - 2 a 5.
   * ───────────────────────────────────────────── */
  function _actualizarContadorDimension(numPantalla) {
    const dimIndex = PANTALLA_A_DIM[numPantalla];
    if (dimIndex === undefined) return;
    const dimension = MGRPIC_DATA.dimensiones[dimIndex];
    const el = document.getElementById('contadorDim' + numPantalla);
    if (!el) return;
    const respondidos = dimension.indicadores.filter(
      ind => estado.respuestas[ind.id] !== undefined && estado.respuestas[ind.id] !== null
    ).length;
    const total = dimension.indicadores.length;
    el.textContent = `${respondidos} / ${total} respondidos`;
    el.className = 'dim-contador ' + (respondidos === total ? 'dim-contador--completo' : '');
  }

  /* ═══════════════════════════════════════════════
   * II. NAVEGACIÓN
   * ═══════════════════════════════════════════════ */

  /**
   * Navega a la pantalla indicada.
   * @param {number} numeroPantalla - 0 a 7.
   */
  function irA(numeroPantalla) {
    // Ocultar pantalla actual
    const pantallaAnterior = document.getElementById('screen' + estado.pantallaActual);
    if (pantallaAnterior) pantallaAnterior.classList.add('hidden');

    // Actualizar estado
    estado.pantallaActual = numeroPantalla;

    // Mostrar nueva pantalla
    const pantallaNueva = document.getElementById('screen' + numeroPantalla);
    if (pantallaNueva) {
      pantallaNueva.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Actualizar cabecera y barra de progreso
    _actualizarCabecera(numeroPantalla);

    // Restaurar estado visual según la pantalla destino
    if (numeroPantalla === 1) {
      _restaurarFormularioCaso();
    }
    if (numeroPantalla >= 2 && numeroPantalla <= 5) {
      _restaurarEstadoVisualDimension(numeroPantalla);
    }
    if (numeroPantalla === 6) {
      _renderizarResultados();
    }
    if (numeroPantalla === 7) {
      _renderizarInforme();
    }
  }

  /**
   * Valida el formulario de datos del caso, lo guarda y navega a la siguiente pantalla.
   * Llamado desde el botón "Iniciar evaluación" de la pantalla 1.
   * @param {number} destino - Número de pantalla destino.
   */
  function guardarCasoEIrA(destino) {
    if (!_validarFormularioCaso()) return;
    _guardarDatosCaso();
    irA(destino);
  }

  /**
   * Valida que todos los indicadores de una dimensión tengan respuesta
   * y, si es así, navega a la pantalla siguiente.
   * @param {number} pantallaOrigen - Número de la pantalla de dimensión actual.
   * @param {number} destino - Número de pantalla destino.
   */
  function validarDimensionEIrA(pantallaOrigen, destino) {
    const dimIndex = PANTALLA_A_DIM[pantallaOrigen];
    if (dimIndex === undefined) { irA(destino); return; }

    const dimension = MGRPIC_DATA.dimensiones[dimIndex];
    let hayPendientes = false;

    dimension.indicadores.forEach(ind => {
      const card = document.getElementById('card-' + ind.id);
      const valor = estado.respuestas[ind.id];
      const pendiente = (valor === undefined || valor === null || valor === '');
      if (card) {
        if (pendiente) {
          card.classList.add('sin-respuesta');
          hayPendientes = true;
        } else {
          card.classList.remove('sin-respuesta');
        }
      }
    });

    if (hayPendientes) {
      // Hacer scroll al primer indicador sin respuesta
      const primera = document.querySelector('.sin-respuesta');
      if (primera) primera.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    irA(destino);
  }

  /* ═══════════════════════════════════════════════
   * III. FORMULARIO — PANTALLA 1
   * ═══════════════════════════════════════════════ */

  function _validarFormularioCaso() {
    const campos = ['numeroDiligencias', 'unidadPolicial', 'fechaIncautacion', 'tipoActivo', 'organoJudicial'];
    let valido = true;

    campos.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const vacio = !el.value.trim();
      el.classList.toggle('invalid', vacio);
      if (vacio) valido = false;
    });

    const errorMsg = document.getElementById('formErrorMsg');
    if (errorMsg) errorMsg.classList.toggle('hidden', valido);

    return valido;
  }

  function _guardarDatosCaso() {
    const ids = ['numeroDiligencias', 'unidadPolicial', 'fechaIncautacion', 'tipoActivo', 'organoJudicial', 'observaciones'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      estado.datosCaso[id] = el ? el.value.trim() : '';
    });
  }

  /* ═══════════════════════════════════════════════
   * IV. RENDERIZADO DINÁMICO — PANTALLAS 2-5
   * ═══════════════════════════════════════════════ */

  /**
   * Genera el HTML de las cuatro pantallas de dimensiones e inyecta en el DOM.
   * Se llama una sola vez durante init().
   */
  function _renderizarPantallasDimensiones() {
    MGRPIC_DATA.dimensiones.forEach((dim, idx) => {
      const numPantalla = idx + 2;   // dimensiones en pantallas 2, 3, 4, 5
      const paso = numPantalla;      // paso 2, 3, 4, 5 de 7
      const anterior = numPantalla - 1;
      const siguiente = numPantalla + 1;
      const esUltima = numPantalla === 5;

      // Colores de la dimensión con opacidad para badges
      const colorHex = dim.color;
      const colorClaro = _colorClaro(colorHex);

      let html = `
        <div class="screen-container">
          <div class="screen-header">
            <div class="screen-step-badge-row">
              <div class="screen-step-badge">Paso ${paso} de ${TOTAL_PASOS}</div>
              <span class="dim-contador" id="contadorDim${numPantalla}">0 / ${dim.indicadores.length} respondidos</span>
            </div>
            <div class="dim-header" style="border-radius: var(--radius-lg); --dim-color: ${colorHex};">
              <div class="dim-header-meta">
                <span class="dim-badge">${dim.id} — ${dim.codigo}</span>
                <span class="dim-peso">Peso: ${dim.peso}%</span>
              </div>
              <div class="dim-title">${dim.nombre}</div>
              <div class="dim-desc">${dim.descripcion}</div>
            </div>
          </div>

          <div class="indicators-list" style="--dim-color: ${colorHex}; --dim-color-claro: ${colorClaro};">
            ${dim.indicadores.map(ind => _htmlIndicador(ind, colorHex)).join('')}
          </div>

          <div class="screen-nav">
            <button class="btn btn-secondary" onclick="App.irA(${anterior})">← Anterior</button>
            <button class="btn btn-primary" onclick="App.validarDimensionEIrA(${numPantalla}, ${siguiente})">
              ${esUltima ? 'Ver resultados →' : 'Siguiente →'}
            </button>
          </div>
        </div>`;

      const seccion = document.getElementById('screen' + numPantalla);
      if (seccion) seccion.innerHTML = html;
    });
  }

  /**
   * Genera el HTML de un indicador con sus opciones de radio.
   * @param {object} ind - Objeto indicador de data.js.
   * @param {string} colorHex - Color de la dimensión padre.
   * @returns {string} HTML del indicador.
   */
  function _htmlIndicador(ind, colorHex) {
    const nivelesClass = ['bajo', 'moderado', 'alto'];
    const puntosLabel  = ['0 puntos — Riesgo bajo', '1 punto — Riesgo moderado', '2 puntos — Riesgo alto'];

    const opcionesHtml = ind.opciones.map(op => {
      const nivelClass = nivelesClass[op.valor];
      const puntosText = puntosLabel[op.valor];
      return `
        <label class="opcion-label" id="label-${ind.id}-${op.valor}">
          <input
            type="radio"
            class="opcion-radio radio-${nivelClass}"
            name="${ind.id}"
            value="${op.valor}"
            onchange="App.registrarRespuesta('${ind.id}', ${op.valor})"
          />
          <span class="opcion-content">
            <span class="opcion-nivel nivel-${nivelClass}">${op.nivel}</span>
            <span class="opcion-puntos">${puntosText}</span>
            <span class="opcion-etiqueta">${op.etiqueta}</span>
          </span>
        </label>`;
    }).join('');

    return `
      <div class="indicator-card" id="card-${ind.id}">
        <div class="indicator-header">
          <span class="indicator-codigo">${ind.codigo}</span>
          <span class="indicator-nombre">${ind.nombre}</span>
        </div>
        <p class="indicator-desc">${ind.descripcion}</p>
        <div class="opciones-list" id="opciones-${ind.id}">
          ${opcionesHtml}
        </div>
        <div class="indicator-ayuda">${ind.ayuda}</div>
      </div>`;
  }

  /**
   * Registra la respuesta de un indicador en el estado y actualiza el estilo visual.
   * @param {string} indicadorId - Id del indicador (ej. "V1").
   * @param {number} valor - 0, 1 o 2.
   */
  function registrarRespuesta(indicadorId, valor) {
    estado.respuestas[indicadorId] = valor;

    // Quitar clases de selección de todas las opciones del indicador
    const contenedor = document.getElementById('opciones-' + indicadorId);
    if (!contenedor) return;
    contenedor.querySelectorAll('.opcion-label').forEach(lbl => {
      lbl.classList.remove('selected-bajo', 'selected-moderado', 'selected-alto');
    });

    // Añadir clase de selección a la opción elegida
    const clasesNivel = ['selected-bajo', 'selected-moderado', 'selected-alto'];
    const labelSeleccionado = document.getElementById('label-' + indicadorId + '-' + valor);
    if (labelSeleccionado) labelSeleccionado.classList.add(clasesNivel[valor]);

    // Limpiar aviso "sin respuesta"
    const card = document.getElementById('card-' + indicadorId);
    if (card) card.classList.remove('sin-respuesta');

    // Actualizar contador de la dimensión actual y barra de progreso global
    _actualizarContadorDimension(estado.pantallaActual);
    _actualizarCabecera(estado.pantallaActual);
  }

  /* ═══════════════════════════════════════════════
   * V. PANTALLA 6 — RESULTADOS
   * ═══════════════════════════════════════════════ */

  function _renderizarResultados() {
    const resultado = MGRPICScoring.calcular(estado.respuestas);
    estado.ultimoResultado = resultado;
    const nivel = resultado.nivelRiesgo;
    const seccion = document.getElementById('screen6');
    if (!seccion) return;

    const orientacion = ORIENTACIONES[nivel.nivel] || [];
    const orientacionHtml = orientacion.map(p => `<li>${p}</li>`).join('');

    // Desglose por dimensiones
    const desgloseRows = resultado.dimensiones.map(dim => {
      const pct = Math.round((dim.puntuacion / dim.maxPonderado) * 100);
      return `
        <div class="dim-breakdown-row">
          <div>
            <div class="dim-breakdown-name" style="color:${dim.color}">${dim.nombre}</div>
            <div class="dim-breakdown-peso">Peso ${dim.peso}% · Máx. ${dim.maxPonderado} pts</div>
          </div>
          <div class="dim-bar-wrap">
            <div class="dim-bar-fill" style="width:${pct}%; background:${dim.color}"></div>
          </div>
          <div class="dim-breakdown-pts" style="color:${dim.color}">
            ${dim.puntuacion.toFixed(2)} <span style="font-size:.75rem;font-weight:400;color:#7a90a4">/ ${dim.maxPonderado}</span>
          </div>
        </div>`;
    }).join('');

    seccion.innerHTML = `
      <div class="screen-container">
        <div class="screen-header">
          <div class="screen-step-badge">Paso 6 de ${TOTAL_PASOS}</div>
          <h2 class="screen-title">Resultados de la evaluación</h2>
          <p class="screen-desc">
            Puntuación global y desglose por dimensiones del caso
            <strong>${estado.datosCaso.numeroDiligencias || '—'}</strong>.
          </p>
        </div>

        <!-- Puntuación global -->
        <div class="results-hero" style="border-left: 5px solid ${nivel.color}; background: ${nivel.colorClaro}">
          <div class="results-score-circle"
               style="border-color:${nivel.color}; color:${nivel.color}; background:#fff">
            <span class="results-score-number">${resultado.total.toFixed(1)}</span>
            <span class="results-score-label">/ 100</span>
          </div>
          <div class="results-level-block">
            <div class="results-level-text" style="color:${nivel.color}">
              ${nivel.nivel}
            </div>
            <div class="results-level-desc">${nivel.descripcion}</div>
          </div>
        </div>

        <!-- Gráfico / desglose -->
        <div class="chart-container">
          <div class="dim-breakdown-title">Desglose por dimensión</div>
          <div id="chartWrap">
            <!-- Chart.js se inyecta aquí si está disponible; si no, tabla de fallback -->
          </div>
        </div>

        <!-- Tabla de desglose detallado -->
        <div class="dim-breakdown">
          <div class="dim-breakdown-title">Puntuación ponderada por dimensión</div>
          ${desgloseRows}
        </div>

        <!-- Orientación operativa -->
        <div class="orientacion-box">
          <div class="orientacion-header" style="background:${nivel.color}">
            Orientación operativa — Nivel ${nivel.nivel}
          </div>
          <div class="orientacion-body">
            <ul>${orientacionHtml}</ul>
          </div>
        </div>

        <div class="screen-nav">
          <button class="btn btn-secondary" onclick="App.irA(5)">← Revisar indicadores</button>
          <button class="btn btn-primary" onclick="App.irA(7)">Ver informe completo →</button>
        </div>
      </div>`;

    // Intentar renderizar gráfico con Chart.js
    _intentarGraficoBarras(resultado);
  }

  /**
   * Renderiza el gráfico de barras con Chart.js si está disponible,
   * o una tabla de fallback si no hay conexión.
   */
  function _intentarGraficoBarras(resultado) {
    const wrap = document.getElementById('chartWrap');
    if (!wrap) return;

    const intentar = () => {
      if (window.CHARTJS_LOADED && typeof Chart !== 'undefined') {
        // Chart.js disponible
        const canvas = document.createElement('canvas');
        canvas.id = 'dimChart';
        wrap.appendChild(canvas);

        new Chart(canvas, {
          type: 'bar',
          data: {
            labels: resultado.dimensiones.map(d => d.nombre),
            datasets: [
              {
                label: 'Puntuación obtenida',
                data: resultado.dimensiones.map(d => d.puntuacion),
                backgroundColor: resultado.dimensiones.map(d => d.color + 'cc'),
                borderColor:     resultado.dimensiones.map(d => d.color),
                borderWidth: 2,
                borderRadius: 4
              },
              {
                label: 'Puntuación máxima',
                data: resultado.dimensiones.map(d => d.maxPonderado),
                backgroundColor: resultado.dimensiones.map(() => '#e9eef4'),
                borderColor:     resultado.dimensiones.map(() => '#c8d2e0'),
                borderWidth: 1,
                borderRadius: 4
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' },
              tooltip: {
                callbacks: {
                  label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} pts`
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                suggestedMax: Math.max(...resultado.dimensiones.map(d => d.maxPonderado)) + 2,
                title: { display: true, text: 'Puntos' }
              }
            }
          }
        });
      } else if (window.CHARTJS_LOADED === false) {
        // Chart.js no disponible — tabla de fallback
        _tablaFallback(wrap, resultado);
      } else {
        // Todavía cargando — reintentar en 400 ms
        setTimeout(intentar, 400);
      }
    };

    intentar();
  }

  function _tablaFallback(contenedor, resultado) {
    let html = `
      <table class="chart-fallback-table">
        <thead>
          <tr>
            <th>Dimensión</th>
            <th>Puntuación</th>
            <th>Máximo</th>
            <th>% Riesgo</th>
          </tr>
        </thead>
        <tbody>`;
    resultado.dimensiones.forEach(d => {
      html += `
          <tr>
            <td style="color:${d.color};font-weight:600">${d.nombre}</td>
            <td>${d.puntuacion.toFixed(2)}</td>
            <td>${d.maxPonderado}</td>
            <td>${d.porcentaje}%</td>
          </tr>`;
    });
    html += `</tbody></table>`;
    contenedor.innerHTML = html;
  }

  /* ═══════════════════════════════════════════════
   * VI. PANTALLA 7 — INFORME
   * ═══════════════════════════════════════════════ */

  function _renderizarInforme() {
    const seccion = document.getElementById('screen7');
    if (!seccion) return;

    const resultado = estado.ultimoResultado || MGRPICScoring.calcular(estado.respuestas);
    const htmlInforme = MGRPICReport.generar(estado.datosCaso, resultado, ORIENTACIONES);

    seccion.innerHTML = `
      <div class="screen-container">
        <div class="screen-header">
          <div class="screen-step-badge">Paso 7 de ${TOTAL_PASOS} — Informe final</div>
          <h2 class="screen-title">Informe MGRPIC</h2>
          <p class="screen-desc">
            Informe completo listo para incorporar al acta de intervención o trasladar al Juez de Instrucción.
          </p>
        </div>

        <div class="report-actions">
          <button class="btn btn-print" onclick="App.imprimirInforme()">
            🖨 Imprimir / Guardar PDF
          </button>
          <button class="btn btn-secondary" onclick="App.irA(6)">← Volver a resultados</button>
          <button class="btn btn-secondary" onclick="App.nuevaEvaluacion()">↺ Nueva evaluación</button>
        </div>

        <div class="report-body" id="reportBody">
          ${htmlInforme}
        </div>

        <div class="report-actions" style="padding-top: var(--gap-sm); border-top: 1px solid var(--color-border)">
          <button class="btn btn-print" onclick="App.imprimirInforme()">
            🖨 Imprimir / Guardar PDF
          </button>
          <button class="btn btn-secondary" onclick="App.nuevaEvaluacion()">↺ Nueva evaluación</button>
        </div>
      </div>`;
  }

  /* ═══════════════════════════════════════════════
   * VII. IMPRESIÓN
   * ═══════════════════════════════════════════════ */

  /**
   * Copia el contenido del informe a la zona de impresión (oculta en pantalla,
   * visible solo al imprimir) y abre el diálogo del navegador.
   */
  function imprimirInforme() {
    const reportBody = document.getElementById('reportBody');
    const printZone  = document.getElementById('printZone');
    if (!reportBody || !printZone) return;
    printZone.innerHTML = reportBody.innerHTML;
    window.print();
  }

  /* ═══════════════════════════════════════════════
   * VIII. NUEVA EVALUACIÓN
   * ═══════════════════════════════════════════════ */

  /**
   * Reinicia completamente el estado de la aplicación y vuelve a la pantalla de inicio.
   * Las pantallas de dimensiones se vuelven a generar para limpiar los radio buttons.
   */
  function nuevaEvaluacion() {
    // Limpiar estado
    estado.datosCaso      = {};
    estado.respuestas     = {};
    estado.ultimoResultado = null;

    // Limpiar formulario de datos del caso
    const form = document.getElementById('caseForm');
    if (form) form.reset();

    // Volver a renderizar las pantallas de dimensiones para limpiar radios y estilos
    _renderizarPantallasDimensiones();

    // Navegar a la pantalla de inicio
    irA(0);
  }

  /* ═══════════════════════════════════════════════
   * IX. CABECERA Y BARRA DE PROGRESO
   * ═══════════════════════════════════════════════ */

  function _actualizarCabecera(numeroPantalla) {
    const progressWrap = document.getElementById('headerProgress');
    const progressFill = document.getElementById('progressFill');
    const progressLabel = document.getElementById('progressLabel');

    if (!progressWrap || !progressFill || !progressLabel) return;

    if (numeroPantalla === 0) {
      // Pantalla de inicio: ocultar barra
      progressWrap.style.display = 'none';
    } else {
      progressWrap.style.display = 'flex';

      // Progreso: pantalla 1 = paso 1/7, ..., pantalla 7 = paso 7/7
      const paso = numeroPantalla;
      const pct  = Math.round((paso / TOTAL_PASOS) * 100);
      progressFill.style.width = pct + '%';
      progressLabel.textContent = `Paso ${paso} de ${TOTAL_PASOS}`;
    }
  }

  /* ═══════════════════════════════════════════════
   * X. UTILIDADES INTERNAS
   * ═══════════════════════════════════════════════ */

  /**
   * Genera un color de fondo claro a partir de un color hex (añade opacidad 15%).
   * Se usa para los badges de los indicadores.
   * @param {string} hex - Color en formato #rrggbb.
   * @returns {string} Color rgba.
   */
  function _colorClaro(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},0.12)`;
  }

  /* ─────────────────────────────────────────────
   * ARRANQUE DE LA APLICACIÓN
   * ───────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', init);

  // API pública
  return {
    irA,
    guardarCasoEIrA,
    validarDimensionEIrA,
    registrarRespuesta,
    imprimirInforme,
    nuevaEvaluacion
  };

})();
