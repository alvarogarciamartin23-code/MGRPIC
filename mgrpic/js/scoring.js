/**
 * scoring.js — Lógica de cálculo de puntuaciones de la MGRPIC.
 *
 * Completamente independiente de la interfaz de usuario.
 * Recibe el objeto de respuestas del usuario y devuelve puntuaciones
 * detalladas por dimensión, la puntuación total ponderada (escala 0-100),
 * el nivel de riesgo y la orientación operativa correspondiente.
 *
 * FÓRMULAS DE CÁLCULO:
 *   Dim I  — Volatilidad                  = (V1+V2+V3+V4) × 4,375    → máx. 35 pts
 *   Dim II — Custodia y trazabilidad      = (C1+C2+C3)    × 5,0      → máx. 30 pts
 *   Dim III — Contexto operativo policial = (J1+J2+J3)    × (35/6)   → máx. 35 pts
 *   TOTAL = Dim I + Dim II + Dim III                        → escala 0-100
 *
 * VERIFICACIÓN: suma de máximos ponderados = 35 + 25 + 25 + 15 = 100 puntos ✓
 *
 * API pública:
 *   MGRPICScoring.calculateScore(respuestas)      → resultado completo con orientación
 *   MGRPICScoring.validateAnswers(respuestas)      → validación con detalle de pendientes
 *   MGRPICScoring.calcular(respuestas)             → alias de calculateScore (sin orientación)
 *   MGRPICScoring.totalIndicadores()               → número total de indicadores (10)
 *   MGRPICScoring.indicadoresRespondidos(resp)     → cuántos han sido respondidos
 *   MGRPICScoring.porcentajeCompletitud(resp)      → % de completitud (0-100)
 *   MGRPICScoring.ORIENTACIONES                    → textos de orientación por nivel
 *
 * Formato de entrada `respuestas`:
 *   Objeto plano: { V1: 0, V2: 1, V3: 2, V4: 1, C1: 0, ... }
 *   Valores permitidos por indicador: 0 (Bajo), 1 (Moderado), 2 (Alto).
 *
 * Formato de salida de calculateScore():
 *   {
 *     dimensiones:  [ { id, codigo, nombre, peso, factor, color, sumaBruta, maxBruto,
 *                       puntuacion, maxPonderado, porcentaje, indicadores: [...] } ],
 *     total:        number   (0-100, dos decimales),
 *     nivelRiesgo:  { nivel, min, max, color, colorClaro, descripcion },
 *     orientacion:  string[] (lista de recomendaciones operativas),
 *     completo:     boolean  (true si los 11 indicadores tienen respuesta),
 *     pendientes:   number   (indicadores sin responder)
 *   }
 *
 * Formato de salida de validateAnswers():
 *   {
 *     valido:       boolean,
 *     respondidos:  number,
 *     total:        number,
 *     porcentaje:   number,
 *     faltantes:    [ { id, codigo, nombre, dimension } ]  (vacío si valido === true)
 *   }
 */

const MGRPICScoring = (() => {

  /* ═══════════════════════════════════════════════════════════
   * ORIENTACIONES OPERATIVAS POR NIVEL DE RIESGO
   * Textos de recomendación que se incluyen en el informe final.
   * ═══════════════════════════════════════════════════════════ */
  const ORIENTACIONES = {

    "BAJO": [
      "Mantener la custodia ordinaria de los criptoactivos con las medidas actualmente adoptadas.",
      "Documentar el estado de la custodia en el acta de intervención y verificar el saldo en blockchain.",
      "No se aprecia necesidad de actuación urgente. Continuar el procedimiento con la tramitación habitual.",
      "Incorporar el presente resultado al atestado o informe de intervención. Reevaluar si algún indicador cambia significativamente."
    ],

    "MODERADO": [
      "Valorar la encomienda de la custodia a la ORGA o a un custodio institucional especializado.",
      "Documentar las variaciones de precio del activo con periodicidad mensual y dejar constancia en el atestado.",
      "Si el indicador V.2 asciende a Alto, elevar propuesta motivada al Ministerio Fiscal para que inste la enajenación anticipada conforme al art. 367 ter LECrim.",
      "Reforzar la cadena de custodia documentando formalmente todos los accesos y verificaciones periódicas.",
      "Notificar al LAJ el nivel de riesgo para decisión coordinada sobre el modelo de custodia más adecuado."
    ],

    "ALTO": [
      "Elevar propuesta motivada al Ministerio Fiscal en el plazo más breve posible para que inste la enajenación anticipada.",
      "Solicitar perito especializado en activos digitales para reforzar la trazabilidad y el soporte técnico de la propuesta.",
      "Valorar la enajenación anticipada del activo o su conversión a moneda fiduciaria estable conforme al art. 367 ter LECrim.",
      "Realizar verificación inmediata del saldo en blockchain y documentar el estado actual de la custodia en acta formal.",
      "Iniciar diligencias para obtener o asegurar las claves privadas si no están bajo control policial formalizado.",
      "Notificar la situación al LAJ y al Ministerio Fiscal con el presente informe como soporte documental."
    ],

    "CRÍTICO": [
      "ACTUACIÓN INMEDIATA en las primeras 24 a 48 horas. El riesgo de pérdida patrimonial o frustración del decomiso es máximo.",
      "Comunicación urgente al Ministerio Fiscal con elevación inmediata de propuesta de enajenación anticipada al amparo del art. 367 ter LECrim.",
      "Apertura de pieza separada de responsabilidad civil para documentar la cadena de valor desde la incautación.",
      "Valorar el bloqueo cautelar de activos en los exchanges identificados mediante solicitud urgente a través de la Fiscalía.",
      "Contactar con la Unidad de Decomiso y Gestión de Activos para activar el protocolo de actuación en activos digitales.",
      "Registrar con carácter inmediato toda incidencia en el acta de incautación para preservar la responsabilidad institucional.",
      "Valorar la solicitud de perito forense especializado en blockchain si la trazabilidad de los activos está comprometida."
    ]

  };

  /* ═══════════════════════════════════════════════════════════
   * FUNCIONES INTERNAS
   * ═══════════════════════════════════════════════════════════ */

  /**
   * Determina el nivel de riesgo global según la puntuación total.
   * @param {number} total - Puntuación total (0-100).
   * @returns {object} Objeto del nivel de riesgo de MGRPIC_DATA.escalaRiesgo.
   */
  function _nivelRiesgo(total) {
    for (const nivel of MGRPIC_DATA.escalaRiesgo) {
      if (total >= nivel.min && total <= nivel.max) return nivel;
    }
    // Fallback: devolver el último nivel (CRÍTICO) si total === 100 exacto
    return MGRPIC_DATA.escalaRiesgo[MGRPIC_DATA.escalaRiesgo.length - 1];
  }

  /* ═══════════════════════════════════════════════════════════
   * API PÚBLICA
   * ═══════════════════════════════════════════════════════════ */

  /**
   * Calcula la puntuación completa de la evaluación MGRPIC.
   *
   * Aplica las cuatro fórmulas ponderadas y devuelve el resultado
   * detallado incluyendo la orientación operativa para el nivel obtenido.
   *
   * @param {object} respuestas - { indicadorId: valor (0|1|2), ... }
   * @returns {object} Resultado completo (ver cabecera del archivo).
   */
  function calculateScore(respuestas) {
    respuestas = respuestas || {};

    let totalPuntuacion      = 0;
    let indicadoresPendientes = 0;

    const resultadoDimensiones = MGRPIC_DATA.dimensiones.map(dim => {

      let sumaBruta = 0;

      const resultadoIndicadores = dim.indicadores.map(ind => {
        const valor     = respuestas[ind.id];
        const respondido = (valor !== undefined && valor !== null && valor !== '');

        if (!respondido) {
          indicadoresPendientes++;
        } else {
          sumaBruta += Number(valor);
        }

        // Localizar la opción elegida para incluir su etiqueta en el informe
        const opcion = respondido
          ? (ind.opciones.find(o => o.valor === Number(valor)) || null)
          : null;

        return {
          id:              ind.id,
          codigo:          ind.codigo,
          nombre:          ind.nombre,
          valor:           respondido ? Number(valor) : null,
          respondido:      respondido,
          nivel:           opcion ? opcion.nivel    : null,
          etiquetaElegida: opcion ? opcion.etiqueta : null
        };
      });

      // ── Aplicar fórmula ponderada de la dimensión ──────────────────────
      //   Dim I   = sumaBruta × 4,375  (máx.  8 × 4,375  = 35)
      //   Dim II  = sumaBruta × 5,0    (máx.  6 × 5,0    = 30)
      //   Dim III = sumaBruta × (35/6) (máx.  6 × (35/6) = 35)
      const puntuacion  = parseFloat((sumaBruta * dim.factor).toFixed(4));

      // Porcentaje de riesgo dentro de la propia dimensión (0-100 %)
      const porcentaje  = dim.maxBruto > 0
        ? parseFloat(((sumaBruta / dim.maxBruto) * 100).toFixed(2))
        : 0;

      totalPuntuacion += puntuacion;

      return {
        id:           dim.id,
        codigo:       dim.codigo,
        nombre:       dim.nombre,
        peso:         dim.peso,
        factor:       dim.factor,
        color:        dim.color,
        sumaBruta,
        maxBruto:     dim.maxBruto,
        puntuacion,
        maxPonderado: dim.maxPonderado,
        porcentaje,
        indicadores:  resultadoIndicadores
      };
    });

    // Redondear el total a dos decimales para evitar aritmética flotante
    totalPuntuacion = parseFloat(totalPuntuacion.toFixed(2));

    const nivelRiesgo = _nivelRiesgo(totalPuntuacion);

    return {
      dimensiones:  resultadoDimensiones,
      total:        totalPuntuacion,
      nivelRiesgo,
      orientacion:  ORIENTACIONES[nivelRiesgo.nivel] || [],
      completo:     indicadoresPendientes === 0,
      pendientes:   indicadoresPendientes
    };
  }

  /**
   * Valida que todos los indicadores hayan sido respondidos.
   *
   * Debe llamarse antes de permitir navegar a la pantalla de resultados.
   * Devuelve el detalle completo de los indicadores pendientes para poder
   * mostrarlos al usuario o bloquear el avance.
   *
   * @param {object} respuestas - { indicadorId: valor (0|1|2), ... }
   * @returns {{
   *   valido:      boolean,   — true si los 10 indicadores tienen respuesta
   *   respondidos: number,    — indicadores con respuesta
   *   total:       number,    — total de indicadores en la matriz (15)
   *   porcentaje:  number,    — % de completitud (0-100)
   *   faltantes:   Array<{id, codigo, nombre, dimension}>  — vacío si valido
   * }}
   */
  function validateAnswers(respuestas) {
    respuestas = respuestas || {};
    const faltantes = [];

    MGRPIC_DATA.dimensiones.forEach(dim => {
      dim.indicadores.forEach(ind => {
        const valor = respuestas[ind.id];
        const respondido = (valor !== undefined && valor !== null && valor !== '');
        if (!respondido) {
          faltantes.push({
            id:        ind.id,
            codigo:    ind.codigo,
            nombre:    ind.nombre,
            dimension: dim.nombre
          });
        }
      });
    });

    const total       = totalIndicadores();
    const respondidos = total - faltantes.length;

    return {
      valido:      faltantes.length === 0,
      respondidos,
      total,
      porcentaje:  total > 0 ? Math.round((respondidos / total) * 100) : 0,
      faltantes
    };
  }

  /**
   * Alias de calculateScore() para compatibilidad con el código existente.
   * @param {object} respuestas
   * @returns {object}
   */
  function calcular(respuestas) {
    return calculateScore(respuestas);
  }

  /**
   * Devuelve cuántos indicadores en total tiene la matriz (debe ser 15).
   * @returns {number}
   */
  function totalIndicadores() {
    return MGRPIC_DATA.dimensiones.reduce((acc, dim) => acc + dim.indicadores.length, 0);
  }

  /**
   * Devuelve cuántos indicadores han sido respondidos.
   * @param {object} respuestas
   * @returns {number}
   */
  function indicadoresRespondidos(respuestas) {
    return validateAnswers(respuestas).respondidos;
  }

  /**
   * Devuelve el porcentaje de completitud del formulario (0-100).
   * @param {object} respuestas
   * @returns {number}
   */
  function porcentajeCompletitud(respuestas) {
    return validateAnswers(respuestas).porcentaje;
  }

  /* ─────────────────────────────────────────────
   * API pública del módulo MGRPICScoring
   * ───────────────────────────────────────────── */
  return {
    calculateScore,
    validateAnswers,
    calcular,               // alias de calculateScore
    totalIndicadores,
    indicadoresRespondidos,
    porcentajeCompletitud,
    ORIENTACIONES           // expuesto para uso externo (app.js, report.js)
  };

})();

// Compatibilidad con entornos Node.js (pruebas unitarias)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MGRPICScoring;
}
