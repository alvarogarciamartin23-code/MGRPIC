/**
 * scoring.js — Lógica de cálculo de puntuaciones de la MGRPIC.
 *
 * Completamente independiente de la interfaz de usuario.
 * Recibe el objeto de respuestas del usuario y devuelve puntuaciones
 * detalladas por dimensión y la puntuación total ponderada (escala 0-100).
 *
 * Fórmulas aplicadas (conforme a data.js):
 *   Dim I  (Volatilidad)              = (V1+V2+V3+V4) × 4.375   → máx. 35 pts
 *   Dim II (Custodia)                 = (C1+C2+C3+C4) × 3.125   → máx. 25 pts
 *   Dim III (Inejecutabilidad)        = (I1+I2+I3+I4) × 3.125   → máx. 25 pts
 *   Dim IV (Riesgo Jurídico-Procesal) = (J1+J2+J3)    × 2.5     → máx. 15 pts
 *   TOTAL = Dim I + Dim II + Dim III + Dim IV          → escala 0-100
 *
 * Uso:
 *   const resultado = MGRPICScoring.calcular(respuestas);
 *
 * Formato de entrada `respuestas`:
 *   Objeto plano con claves = id del indicador y valores = número (0, 1 o 2).
 *   Ejemplo: { V1: 1, V2: 0, V3: 2, V4: 1, C1: 0, ... }
 *
 * Formato de salida:
 *   {
 *     dimensiones: [ { id, nombre, sumaBruta, maxBruto, puntuacion, maxPonderado, porcentaje, indicadores: [...] } ],
 *     total:       número (0-100, dos decimales),
 *     nivelRiesgo: { nivel, min, max, color, colorClaro, descripcion },
 *     completo:    boolean (true si todos los indicadores tienen respuesta)
 *   }
 */

const MGRPICScoring = (() => {

  /**
   * Determina el nivel de riesgo global según la puntuación total.
   * @param {number} total - Puntuación total (0-100).
   * @returns {object} Objeto del nivel de riesgo de MGRPIC_DATA.escalaRiesgo.
   */
  function _nivelRiesgo(total) {
    for (const nivel of MGRPIC_DATA.escalaRiesgo) {
      if (total >= nivel.min && total <= nivel.max) return nivel;
    }
    // Fallback al último nivel si total == 100 exacto
    return MGRPIC_DATA.escalaRiesgo[MGRPIC_DATA.escalaRiesgo.length - 1];
  }

  /**
   * Calcula las puntuaciones completas a partir de las respuestas del usuario.
   * @param {object} respuestas - { indicadorId: valor (0|1|2), ... }
   * @returns {object} Resultado detallado (ver cabecera del archivo).
   */
  function calcular(respuestas) {
    respuestas = respuestas || {};

    let totalPuntuacion = 0;
    let indicadoresPendientes = 0;

    const resultadoDimensiones = MGRPIC_DATA.dimensiones.map(dim => {

      let sumaBruta = 0;
      const resultadoIndicadores = dim.indicadores.map(ind => {
        const valor = respuestas[ind.id];
        const respondido = (valor !== undefined && valor !== null && valor !== '');

        if (!respondido) {
          indicadoresPendientes++;
        } else {
          sumaBruta += Number(valor);
        }

        // Recuperar la opción seleccionada para mostrar su etiqueta en el informe
        const opcionSeleccionada = respondido
          ? ind.opciones.find(o => o.valor === Number(valor)) || null
          : null;

        return {
          id:               ind.id,
          codigo:           ind.codigo,
          nombre:           ind.nombre,
          valor:            respondido ? Number(valor) : null,
          respondido:       respondido,
          nivel:            opcionSeleccionada ? opcionSeleccionada.nivel    : null,
          etiquetaElegida:  opcionSeleccionada ? opcionSeleccionada.etiqueta : null
        };
      });

      // Puntuación ponderada de la dimensión
      const puntuacion = parseFloat((sumaBruta * dim.factor).toFixed(4));

      // Porcentaje de riesgo dentro de la dimensión (0-100%)
      const porcentaje = parseFloat(((sumaBruta / dim.maxBruto) * 100).toFixed(2));

      totalPuntuacion += puntuacion;

      return {
        id:           dim.id,
        codigo:       dim.codigo,
        nombre:       dim.nombre,
        peso:         dim.peso,
        factor:       dim.factor,
        color:        dim.color,
        sumaBruta:    sumaBruta,
        maxBruto:     dim.maxBruto,
        puntuacion:   puntuacion,
        maxPonderado: dim.maxPonderado,
        porcentaje:   porcentaje,      // % de riesgo en la dimensión
        indicadores:  resultadoIndicadores
      };
    });

    // Redondear el total a dos decimales
    totalPuntuacion = parseFloat(totalPuntuacion.toFixed(2));

    return {
      dimensiones:  resultadoDimensiones,
      total:        totalPuntuacion,
      nivelRiesgo:  _nivelRiesgo(totalPuntuacion),
      completo:     indicadoresPendientes === 0,
      pendientes:   indicadoresPendientes
    };
  }

  /**
   * Devuelve cuántos indicadores en total tiene la matriz.
   * @returns {number}
   */
  function totalIndicadores() {
    return MGRPIC_DATA.dimensiones.reduce((acc, dim) => acc + dim.indicadores.length, 0);
  }

  /**
   * Devuelve cuántos indicadores han sido respondidos en un objeto de respuestas.
   * @param {object} respuestas
   * @returns {number}
   */
  function indicadoresRespondidos(respuestas) {
    respuestas = respuestas || {};
    let count = 0;
    MGRPIC_DATA.dimensiones.forEach(dim => {
      dim.indicadores.forEach(ind => {
        if (respuestas[ind.id] !== undefined && respuestas[ind.id] !== null && respuestas[ind.id] !== '') {
          count++;
        }
      });
    });
    return count;
  }

  /**
   * Devuelve el porcentaje de completitud del formulario (0-100).
   * @param {object} respuestas
   * @returns {number}
   */
  function porcentajeCompletitud(respuestas) {
    const total = totalIndicadores();
    if (total === 0) return 0;
    return Math.round((indicadoresRespondidos(respuestas) / total) * 100);
  }

  // API pública del módulo
  return {
    calcular,
    totalIndicadores,
    indicadoresRespondidos,
    porcentajeCompletitud
  };

})();

// Compatibilidad con entornos Node.js (pruebas unitarias)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MGRPICScoring;
}
