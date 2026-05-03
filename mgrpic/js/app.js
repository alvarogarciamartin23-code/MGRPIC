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
     * Respuestas del usuario a los 11 indicadores.
     * Objeto plano: { V1: 0, V2: 1, C1: 2, ... }
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
   * pantallas 2,3,4 corresponden a dimensiones 0,1,2
   * ───────────────────────────────────────────── */
  const PANTALLA_A_DIM = { 2: 0, 3: 1, 4: 2 };
  const TOTAL_PASOS = 6; // pasos numerados 1-6 (pantallas 1-6)

  /* ─────────────────────────────────────────────
   * LOGO SVG — hexágono institucional con red blockchain
   * Se reutiliza en cabecera, pantalla de inicio e informe.
   * ───────────────────────────────────────────── */
  const LOGO_SVG = `<svg viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <polygon points="28,3 51,15.5 51,40.5 28,53 5,40.5 5,15.5" fill="#1F3864"/>
    <line x1="28" y1="18" x2="18" y2="35" stroke="rgba(255,255,255,0.5)" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="28" y1="18" x2="38" y2="35" stroke="rgba(255,255,255,0.5)" stroke-width="1.8" stroke-linecap="round"/>
    <line x1="18" y1="35" x2="38" y2="35" stroke="rgba(255,255,255,0.5)" stroke-width="1.8" stroke-linecap="round"/>
    <circle cx="28" cy="18" r="4.5" fill="white"/>
    <circle cx="18" cy="35" r="4.5" fill="white"/>
    <circle cx="38" cy="35" r="4.5" fill="white"/>
  </svg>`;

  /* ─────────────────────────────────────────────
   * ORIENTACIONES: referencia al objeto definido en scoring.js.
   * scoring.js es la fuente única de verdad; aquí solo se reutiliza.
   * ───────────────────────────────────────────── */
  const ORIENTACIONES = MGRPICScoring.ORIENTACIONES;

  /* ═══════════════════════════════════════════════
   * I. INICIALIZACIÓN
   * ═══════════════════════════════════════════════ */
  function init() {
    // Renderizar las pantallas de dimensiones en el DOM (pantallas 2-4)
    _renderizarPantallasDimensiones();

    // Mostrar pantalla inicial
    irA(0);
  }

  /* ─────────────────────────────────────────────
   * Restaura el estado visual de una pantalla de dimensión
   * (radio buttons + clases selected-*) al navegar hacia ella.
   * @param {number} numPantalla - 2, 3 o 4.
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
    if (numeroPantalla >= 2 && numeroPantalla <= 4) {
      _restaurarEstadoVisualDimension(numeroPantalla);
    }
    if (numeroPantalla === 5) {
      _renderizarResultados();
    }
    if (numeroPantalla === 6) {
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

    // Validar solo los indicadores de esta dimensión contra estado.respuestas
    const dimension = MGRPIC_DATA.dimensiones[dimIndex];
    const faltantes = dimension.indicadores.filter(ind => {
      const v = estado.respuestas[ind.id];
      return v === undefined || v === null || v === '';
    });
    const valido = faltantes.length === 0;

    // Actualizar clases visuales de cada tarjeta según el resultado
    dimension.indicadores.forEach(ind => {
      const card = document.getElementById('card-' + ind.id);
      if (!card) return;
      card.classList.toggle('sin-respuesta', faltantes.some(f => f.id === ind.id));
    });

    if (!valido) {
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
      const esUltima = numPantalla === 4;

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
    const seccion = document.getElementById('screen5');
    if (!seccion) return;

    const orientacion = ORIENTACIONES[nivel.nivel] || [];
    const orientacionHtml = orientacion.map(p => `<li>${p}</li>`).join('');

    // Top 3 indicadores con mayor puntuación
    const todosInd = [];
    resultado.dimensiones.forEach(dim => {
      dim.indicadores.forEach(ind => todosInd.push({ ...ind, dimColor: dim.color }));
    });
    const top3 = todosInd.filter(i => i.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, 3);
    const coloresNivelTop3 = { 'Alto': '#a04800', 'Moderado': '#7d5c00', 'Bajo': '#3d7020' };
    const top3Html = top3.length === 0
      ? '<p style="font-size:0.85rem;color:#7a90a4;padding:0.5rem 0;">Todos los indicadores están en nivel Bajo.</p>'
      : top3.map((ind, i) => `
        <div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0;
                    border-bottom:1px solid #ecf0f4;">
          <span style="font-size:1.1rem;font-weight:800;color:#bfc9d8;min-width:1.4rem;">${i+1}</span>
          <div style="flex:1;">
            <div style="font-size:0.86rem;font-weight:600;color:#2c3e50;">${ind.nombre}</div>
            <div style="font-size:0.76rem;color:${ind.dimColor};margin-top:0.1rem;">${ind.codigo}</div>
          </div>
          <span style="font-size:0.76rem;font-weight:700;padding:2px 8px;border-radius:3px;
                       background:${ind.nivel==='Alto'?'#fff0d9':'#fff8cc'};
                       color:${coloresNivelTop3[ind.nivel]||'#4a5e72'}">
            ${ind.nivel} (${ind.valor})
          </span>
        </div>`).join('');

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
          <div class="screen-step-badge">Paso 5 de ${TOTAL_PASOS}</div>
          <h2 class="screen-title">Resultados de la evaluación</h2>
          <p class="screen-desc">
            Puntuación global y desglose por dimensiones del caso
            <strong>${estado.datosCaso.numeroDiligencias || '—'}</strong>.
          </p>
        </div>

        <!-- Puntuación global -->
        <div class="results-hero" style="border-left: 5px solid ${nivel.color}; background: ${nivel.colorClaro}">
          <div class="results-score-circle"
               style="border-color:${nivel.color}; color:${nivel.colorTexto || nivel.color}; background:#fff">
            <span class="results-score-number">${resultado.total.toFixed(1)}</span>
            <span class="results-score-label">/ 100</span>
          </div>
          <div class="results-level-block">
            <div class="results-level-text" style="color:${nivel.colorTexto || nivel.color}">
              ${nivel.nivel}
            </div>
            <div class="results-level-desc">${nivel.descripcion}</div>
          </div>
        </div>

        <!-- Gráfico SVG de barras (sin dependencias externas) -->
        <div class="chart-container">
          <div class="dim-breakdown-title">Desglose por dimensión</div>
          <div id="chartWrap">${_graficoSVG(resultado)}</div>
        </div>

        <!-- Top 3 indicadores críticos -->
        <div class="dim-breakdown">
          <div class="dim-breakdown-title">Factores de mayor riesgo</div>
          <div style="padding:0 var(--gap-md) var(--gap-sm);">${top3Html}</div>
        </div>

        <!-- Tabla de desglose detallado -->
        <div class="dim-breakdown">
          <div class="dim-breakdown-title">Puntuación ponderada por dimensión</div>
          ${desgloseRows}
        </div>

        <!-- Orientación operativa -->
        <div class="orientacion-box">
          <div class="orientacion-header" style="background:${nivel.colorTexto || nivel.color}">
            Protocolo policial de actuación — Nivel ${nivel.nivel}
          </div>
          <div class="orientacion-body">
            <ul>${orientacionHtml}</ul>
          </div>
        </div>

        <div class="screen-nav">
          <button class="btn btn-secondary" onclick="App.irA(4)">← Revisar indicadores</button>
          <button class="btn btn-primary" onclick="App.irA(6)">Ver informe completo →</button>
        </div>
      </div>`;

    // Animar la puntuación (contador de 0 al valor final)
    const scoreEl = seccion.querySelector('.results-score-number');
    if (scoreEl) _animarPuntuacion(scoreEl, resultado.total);
  }

  /**
   * Genera un gráfico de barras SVG sin dependencias externas.
   * Muestra las puntuaciones obtenidas vs máximas de cada dimensión.
   * @param {object} resultado - Resultado de MGRPICScoring.calculateScore().
   * @returns {string} HTML con el elemento <svg>.
   */
  function _graficoSVG(resultado) {
    const dims   = resultado.dimensiones;
    const W      = 480;
    const H      = 190;
    const padT   = 28;
    const padB   = 52;
    const padL   = 36;
    const padR   = 16;
    const chartH = H - padT - padB;
    const chartW = W - padL - padR;
    const maxVal = Math.max(...dims.map(d => d.maxPonderado));
    const slotW  = chartW / dims.length;
    const barW   = Math.min(52, slotW * 0.55);

    const elems = dims.map((dim, i) => {
      const cx   = padL + slotW * i + slotW / 2;
      const x    = cx - barW / 2;
      const hMax = chartH;
      const hVal = Math.max(2, (dim.puntuacion / maxVal) * chartH);
      const yMax = padT;
      const yVal = padT + (hMax - hVal);
      const pct  = dim.porcentaje;
      return `
        <rect x="${x.toFixed(1)}" y="${yMax}" width="${barW}" height="${hMax}" fill="#ebebeb" rx="3"/>
        <rect x="${x.toFixed(1)}" y="${yVal.toFixed(1)}" width="${barW}" height="${hVal.toFixed(1)}" fill="${dim.color}" rx="3"/>
        <text x="${cx.toFixed(1)}" y="${(yVal - 5).toFixed(1)}" text-anchor="middle"
              font-size="11" font-weight="700" fill="${dim.color}">${dim.puntuacion.toFixed(1)}</text>
        <text x="${cx.toFixed(1)}" y="${(H - padB + 16).toFixed(1)}" text-anchor="middle"
              font-size="10" font-weight="600" fill="#4a5e72">${dim.id}</text>
        <text x="${cx.toFixed(1)}" y="${(H - padB + 28).toFixed(1)}" text-anchor="middle"
              font-size="8.5" fill="#7a90a4">${pct}%</text>
        <text x="${cx.toFixed(1)}" y="${(H - padB + 39).toFixed(1)}" text-anchor="middle"
              font-size="8" fill="#bfc9d8">/${dim.maxPonderado}</text>`;
    }).join('');

    // Línea de eje Y y etiquetas
    const axis = `
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}"
            stroke="#dde3ec" stroke-width="1"/>
      <text x="${padL - 4}" y="${padT + 4}" text-anchor="end" font-size="8" fill="#bfc9d8">${maxVal}</text>
      <text x="${padL - 4}" y="${padT + chartH}" text-anchor="end" font-size="8" fill="#bfc9d8">0</text>`;

    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
                 style="width:100%;max-height:${H}px;font-family:var(--font-main)"
                 role="img" aria-label="Gráfico de barras por dimensión">
      ${axis}${elems}
    </svg>`;
  }

  /**
   * Anima el número de puntuación desde 0 hasta el valor final con ease-out cúbico.
   * @param {HTMLElement} el - Elemento que muestra la puntuación.
   * @param {number} valorFinal - Puntuación final.
   */
  function _animarPuntuacion(el, valorFinal) {
    const duracion = 900;
    const inicio   = performance.now();
    const tick = (ahora) => {
      const t    = Math.min((ahora - inicio) / duracion, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = (valorFinal * ease).toFixed(1);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = valorFinal.toFixed(1);
    };
    requestAnimationFrame(tick);
  }

  /* ═══════════════════════════════════════════════
   * VI. PANTALLA 7 — INFORME
   * ═══════════════════════════════════════════════ */

  function _renderizarInforme() {
    const seccion = document.getElementById('screen6');
    if (!seccion) return;

    const resultado = estado.ultimoResultado || MGRPICScoring.calcular(estado.respuestas);
    const htmlInforme = MGRPICReport.generar(estado.datosCaso, resultado, ORIENTACIONES);

    seccion.innerHTML = `
      <div class="screen-container">
        <div class="screen-header">
          <div class="screen-step-badge">Paso 6 de ${TOTAL_PASOS} — Informe final</div>
          <h2 class="screen-title">Informe MGRPIC</h2>
          <p class="screen-desc">
            Informe completo listo para incorporar al atestado o trasladar al Ministerio Fiscal.
            Guárdelo en PDF o Word, imprímalo o copie el texto.
          </p>
        </div>

        <div class="report-actions">
          <button class="btn btn-pdf" onclick="App.exportarPDF()">
            📄 Guardar PDF
          </button>
          <button class="btn btn-word" id="btnExportarWord" onclick="App.exportarWord()">
            📝 Guardar Word (.doc)
          </button>
          <button class="btn btn-print" onclick="App.imprimirInforme()">
            🖨 Imprimir
          </button>
          <button class="btn btn-secondary" id="btnCopiar" onclick="App.copiarInforme()">
            📋 Copiar texto
          </button>
          <button class="btn btn-secondary" onclick="App.irA(5)">← Resultados</button>
          <button class="btn btn-secondary" onclick="App.nuevaEvaluacion()">↺ Nueva evaluación</button>
        </div>

        <div class="report-body" id="reportBody">
          ${htmlInforme}
        </div>

        <div class="report-actions" style="padding-top: var(--gap-sm); border-top: 1px solid var(--color-border)">
          <button class="btn btn-pdf" onclick="App.exportarPDF()">
            📄 Guardar PDF
          </button>
          <button class="btn btn-word" onclick="App.exportarWord()">
            📝 Guardar Word (.doc)
          </button>
          <button class="btn btn-secondary" onclick="App.nuevaEvaluacion()">↺ Nueva evaluación</button>
        </div>
      </div>`;
  }

  /* ═══════════════════════════════════════════════
   * VII. IMPRESIÓN Y EXPORTACIÓN
   * ═══════════════════════════════════════════════ */

  /**
   * Devuelve el CSS mínimo necesario para los exportes PDF y Word,
   * con todas las variables CSS resueltas a valores literales.
   */
  function _estiloExportacion() {
    return `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: Calibri, 'Segoe UI', Arial, sans-serif;
        font-size: 11pt; color: #1c2535; line-height: 1.65;
        padding: 1.5cm;
      }
      .report-section { margin-bottom: 1.5rem; page-break-inside: avoid; }
      .report-section:last-child { margin-bottom: 0; }
      .report-section-title {
        font-size: 0.8rem; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.08em; color: #1F3864;
        border-bottom: 2px solid #1F3864; padding-bottom: 0.3rem;
        margin-bottom: 0.75rem;
      }
      .report-field {
        display: grid; grid-template-columns: 200px 1fr;
        gap: 0.35rem 0.75rem; padding: 0.3rem 0;
        border-bottom: 1px dashed #dde3ec; font-size: 0.88rem;
      }
      .report-field:last-child { border-bottom: none; }
      .report-field-label { font-weight: 600; color: #4a5e72; }
      .report-total-box {
        display: flex; align-items: center; gap: 1.25rem;
        padding: 1.25rem; border-radius: 8px; margin-bottom: 1.25rem;
      }
      .report-total-score { font-size: 2.5rem; font-weight: 800; line-height: 1; }
      .report-total-nivel { font-size: 1.2rem; font-weight: 700; }
      table { width: 100%; border-collapse: collapse; }
      td, th { padding: 0.45rem 0.6rem; }
      @page { size: A4; margin: 2.5cm 2cm 2.5cm 3cm; }
      @media print { body { padding: 0; } }
    `;
  }

  /**
   * Abre el informe en una nueva pestaña con CSS limpio y activa el
   * diálogo de impresión/guardar PDF automáticamente.
   */
  function exportarPDF() {
    const resultado   = estado.ultimoResultado || MGRPICScoring.calcular(estado.respuestas);
    const htmlInforme = MGRPICReport.generar(estado.datosCaso, resultado, ORIENTACIONES);

    const htmlCompleto = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>MGRPIC — Informe de Evaluación</title>
  <style>${_estiloExportacion()}</style>
</head>
<body>
  ${htmlInforme}
  <script>window.addEventListener('load', function(){ setTimeout(window.print, 400); });<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) {
      alert('El navegador bloqueó la ventana emergente.\nPermita las ventanas emergentes para esta página e inténtelo de nuevo.');
      return;
    }
    win.document.write(htmlCompleto);
    win.document.close();
  }

  /**
   * Genera el informe como documento Word (.doc) compatible y lo descarga.
   * Usa HTML con las directivas de espacio de nombres de Office para que
   * Word lo reconozca y aplique márgenes A4.
   */
  function exportarWord() {
    const resultado   = estado.ultimoResultado || MGRPICScoring.calcular(estado.respuestas);
    const htmlInforme = MGRPICReport.generar(estado.datosCaso, resultado, ORIENTACIONES);

    const slug = (estado.datosCaso.numeroDiligencias || 'informe')
      .replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_').substring(0, 40);
    const fecha = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `MGRPIC_${slug}_${fecha}.doc`;

    const htmlWord = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
     xmlns:w="urn:schemas-microsoft-com:office:word"
     xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>MGRPIC — Informe de Evaluación</title>
  <!--[if gte mso 9]><xml>
    <w:WordDocument>
      <w:View>Print</w:View><w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml><![endif]-->
  <style>
    ${_estiloExportacion()}
    body { mso-page-orientation: portrait; }
    @page Section1 {
      size: 21cm 29.7cm;
      margin: 2.5cm 2cm 2.5cm 3cm;
      mso-header-margin: 1cm; mso-footer-margin: 1cm;
      mso-paper-source: 0;
    }
    div.Section1 { page: Section1; }
  </style>
</head>
<body><div class="Section1">
  ${htmlInforme}
</div></body>
</html>`;

    const blob = new Blob(['﻿', htmlWord], { type: 'application/msword' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    const btn = document.getElementById('btnExportarWord');
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = '✓ Descargando…';
      setTimeout(() => { btn.innerHTML = orig; }, 2500);
    }
  }

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

  /**
   * Copia el texto plano del informe al portapapeles del sistema.
   * Actualiza el botón temporalmente como confirmación visual.
   */
  function copiarInforme() {
    const reportBody = document.getElementById('reportBody');
    if (!reportBody) return;
    const texto = reportBody.innerText;
    const btn = document.getElementById('btnCopiar');

    const confirmar = () => {
      if (btn) { btn.textContent = '✓ Copiado'; setTimeout(() => { btn.textContent = '📋 Copiar texto'; }, 2200); }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(confirmar).catch(() => _copiarFallback(texto, confirmar));
    } else {
      _copiarFallback(texto, confirmar);
    }
  }

  function _copiarFallback(texto, cb) {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); cb(); } catch(e) {}
    document.body.removeChild(ta);
  }

  /* ═══════════════════════════════════════════════
   * VIII. NUEVA EVALUACIÓN
   * ═══════════════════════════════════════════════ */

  /**
   * Reinicia completamente el estado de la aplicación y vuelve a la pantalla de inicio.
   * Las pantallas de dimensiones se vuelven a generar para limpiar los radio buttons.
   */
  function nuevaEvaluacion() {

    // Ocultar la pantalla actual antes de limpiar el estado para evitar parpadeo
    const pantallaActiva = document.getElementById('screen' + estado.pantallaActual);
    if (pantallaActiva) pantallaActiva.classList.add('hidden');

    // Limpiar estado
    estado.datosCaso       = {};
    estado.respuestas      = {};
    estado.ultimoResultado = null;
    estado.pantallaActual  = 0;

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
    exportarPDF,
    exportarWord,
    copiarInforme,
    nuevaEvaluacion
  };

})();
