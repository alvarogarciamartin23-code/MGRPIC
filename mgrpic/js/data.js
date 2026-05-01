/**
 * data.js — Definición canónica de dimensiones, indicadores y escalas de la MGRPIC.
 *
 * Contiene ÚNICAMENTE datos estáticos. No incluye lógica de cálculo ni de interfaz.
 * Para ajustar ponderaciones, añadir o eliminar indicadores, editar solo este archivo.
 *
 * Estructura de puntuación:
 *   Cada indicador puntúa 0 (Bajo), 1 (Moderado) o 2 (Alto).
 *   La suma bruta de cada dimensión se multiplica por su factor de ponderación.
 *   La puntuación total es la suma de las tres dimensiones (escala 0-100).
 *
 * Fórmulas:
 *   Dim I  (Volatilidad)                  = (V1+V2+V3+V4) × 4,375
 *   Dim II (Custodia y trazabilidad)      = (C1+C2+C3)    × 5,0
 *   Dim III (Contexto operativo policial) = (J1+J2+J3)    × (35/6)
 *   TOTAL = Dim I + Dim II + Dim III  (0-100 puntos)
 *
 * Verificación de máximos:
 *   Dim I  : 8 × 4,375   = 35
 *   Dim II : 6 × 5,0     = 30
 *   Dim III: 6 × (35/6)  = 35
 *   TOTAL máximo          = 100 ✓
 *
 * Uso:
 *   La herramienta se aplica cuando el criptoactivo ya ha sido incautado y transferido
 *   al monedero bajo control policial. Apoya dos decisiones:
 *     1. Qué modelo de custodia adoptar.
 *     2. Si procede elevar propuesta de enajenación anticipada al Ministerio Fiscal
 *        al amparo del artículo 367 ter de la LECrim.
 *   NO es una herramienta judicial.
 */

const MGRPIC_DATA = {

  version: "3.0",
  nombre: "Matriz de Gestión de Riesgo Procesal en la Incautación de Criptoactivos",
  acronimo: "MGRPIC",
  descripcion: "Herramienta de apoyo a la decisión para unidades de Policía Judicial " +
               "en la gestión de criptoactivos incautados en procedimientos penales.",

  /* ─────────────────────────────────────────────
   * ESCALA GLOBAL DE RIESGO (sobre puntuación 0-100)
   * ───────────────────────────────────────────── */
  escalaRiesgo: [
    {
      nivel:      "BAJO",
      min:        0,
      max:        25,
      color:      "#70AD47",
      colorClaro: "#e8f5dd",
      colorTexto: "#3d7020",
      descripcion: "Riesgo procesal controlado. Custodia ordinaria bajo supervisión del LAJ. " +
                   "Incorporar resultado al atestado. Reevaluar si algún indicador cambia " +
                   "significativamente, en particular ante variaciones relevantes del precio del activo."
    },
    {
      nivel:      "MODERADO",
      min:        26,
      max:        50,
      color:      "#FFD966",
      colorClaro: "#fff8cc",
      colorTexto: "#7d5c00",
      descripcion: "Riesgo procesal significativo. Valorar encomienda a la ORGA o custodio " +
                   "institucional especializado. Documentar variaciones de precio mensualmente. " +
                   "Si V.2 asciende a Alto, elevar propuesta motivada al Ministerio Fiscal para " +
                   "que inste la enajenación anticipada conforme al art. 367 ter LECrim."
    },
    {
      nivel:      "ALTO",
      min:        51,
      max:        75,
      color:      "#FF9933",
      colorClaro: "#fff0d9",
      colorTexto: "#a04800",
      descripcion: "Riesgo procesal elevado. Elevar propuesta motivada al Ministerio Fiscal " +
                   "en el plazo más breve posible, con fundamento en la evaluación MGRPIC. " +
                   "Solicitar perito especializado en activos digitales. Valorar la enajenación " +
                   "anticipada o conversión a moneda fiduciaria estable."
    },
    {
      nivel:      "CRÍTICO",
      min:        76,
      max:        100,
      color:      "#FF0000",
      colorClaro: "#ffe5e5",
      colorTexto: "#cc0000",
      descripcion: "Riesgo procesal máximo. Actuación inmediata en las primeras 24-48 horas. " +
                   "Comunicación urgente al Ministerio Fiscal. Elevación inmediata de propuesta " +
                   "de enajenación anticipada al amparo del art. 367 ter LECrim. Apertura de pieza " +
                   "separada de responsabilidad civil. Valorar bloqueo cautelar de activos en " +
                   "exchanges identificados."
    }
  ],

  /* ─────────────────────────────────────────────
   * DIMENSIONES E INDICADORES
   * ───────────────────────────────────────────── */
  dimensiones: [

    /* ══════════════════════════════════════════
     * DIMENSIÓN I — VOLATILIDAD
     * Peso: 35 % | Factor: 4,375 | Indicadores: 4 | Máx. bruto: 8 | Máx. ponderado: 35
     * ══════════════════════════════════════════ */
    {
      id:           "D1",
      codigo:       "V",
      nombre:       "Volatilidad",
      peso:         35,
      factor:       4.375,
      maxBruto:     8,
      maxPonderado: 35,
      color:        "#6c3483",
      descripcion:  "Evalúa el riesgo de pérdida de valor económico de los criptoactivos " +
                    "durante la tramitación del procedimiento penal.",

      indicadores: [
        {
          id:          "V1",
          codigo:      "V.1",
          nombre:      "Naturaleza del activo",
          descripcion: "Tipo de criptoactivo según su estabilidad y liquidez de mercado.",
          ayuda:       "Clasifique el activo principal incautado según su categoría de mercado. " +
                       "Si hay varios activos, valore el de mayor cuantía.",
          opciones: [
            { valor: 0, nivel: "Bajo",     etiqueta: "Stablecoin referenciada a moneda fiduciaria (USDT, USDC)" },
            { valor: 1, nivel: "Moderado", etiqueta: "Criptoactivo de alta capitalización con mercado líquido (BTC, ETH)" },
            { valor: 2, nivel: "Alto",     etiqueta: "Altcoin de baja capitalización, activo desconocido o token sin mercado secundario activo" }
          ]
        },
        {
          id:          "V2",
          codigo:      "V.2",
          nombre:      "Variación de precio en los 30 días previos a la incautación",
          descripcion: "Oscilación porcentual del precio de mercado en el mes anterior a la intervención.",
          ayuda:       "Consulte fuentes como CoinMarketCap o CoinGecko para obtener la variación " +
                       "en los 30 días anteriores a la fecha de incautación.",
          opciones: [
            { valor: 0, nivel: "Bajo",     etiqueta: "Inferior al 10% sin tendencia marcada" },
            { valor: 1, nivel: "Moderado", etiqueta: "Entre el 10% y el 30%" },
            { valor: 2, nivel: "Alto",     etiqueta: "Superior al 30% o variación brusca superior al 15% en las últimas 48 horas" }
          ]
        },
        {
          id:          "V3",
          codigo:      "V.3",
          nombre:      "Complejidad de la causa como indicador de duración estimada",
          descripcion: "Grado de complejidad del procedimiento en función de sus elementos objetivos.",
          ayuda:       "Tenga en cuenta el número de investigados, la existencia de diligencias " +
                       "internacionales y la complejidad económica de la causa.",
          opciones: [
            { valor: 0, nivel: "Bajo",     etiqueta: "Causa sencilla, investigado único, sin cooperación internacional y sin complejidad económica relevante" },
            { valor: 1, nivel: "Moderado", etiqueta: "Causa con varios investigados o con alguna diligencia internacional pendiente o complejidad económica media" },
            { valor: 2, nivel: "Alto",     etiqueta: "Causa compleja con múltiples investigados, cooperación internacional activa o estructura criminal organizada" }
          ]
        },
        {
          id:          "V4",
          codigo:      "V.4",
          nombre:      "Valor total del activo incautado",
          descripcion: "Contravalor en euros del conjunto de criptoactivos intervenidos a la fecha de evaluación.",
          ayuda:       "Utilice el tipo de cambio del día de la evaluación. Si hay múltiples activos, " +
                       "sume todos los contravalores en euros.",
          opciones: [
            { valor: 0, nivel: "Bajo",     etiqueta: "Inferior a 10.000 €" },
            { valor: 1, nivel: "Moderado", etiqueta: "Entre 10.000 € y 500.000 €" },
            { valor: 2, nivel: "Alto",     etiqueta: "Superior a 500.000 €" }
          ]
        }
      ]
    },

    /* ══════════════════════════════════════════
     * DIMENSIÓN II — CUSTODIA Y TRAZABILIDAD
     * Peso: 30 % | Factor: 5,0 | Indicadores: 3 | Máx. bruto: 6 | Máx. ponderado: 30
     * ══════════════════════════════════════════ */
    {
      id:           "D2",
      codigo:       "C",
      nombre:       "Custodia y Trazabilidad",
      peso:         30,
      factor:       5.0,
      maxBruto:     6,
      maxPonderado: 30,
      color:        "#1a5276",
      descripcion:  "Evalúa la seguridad de la custodia de las claves privadas y la " +
                    "calidad de la trazabilidad del activo en la cadena de bloques.",

      indicadores: [
        {
          id:          "C1",
          codigo:      "C.1",
          nombre:      "Tipo de soporte de custodia de la clave privada",
          descripcion: "Medio físico o institucional en que se custodian las claves privadas o la frase semilla.",
          ayuda:       "Valore el soporte de custodia principal. Si hay múltiples carteras con distintos " +
                       "soportes, puntúe según el activo de mayor valor.",
          opciones: [
            { valor: 0, nivel: "Bajo",     etiqueta: "Custodio institucional especializado (Prosegur Crypto o ORGA) con contrato formalizado" },
            { valor: 1, nivel: "Moderado", etiqueta: "Monedero frío policial bajo acta formal de entrega al LAJ" },
            { valor: 2, nivel: "Alto",     etiqueta: "Soporte en papel, dispositivo sin cifrar, soporte no verificado o custodia informal sin acta" }
          ]
        },
        {
          id:          "C2",
          codigo:      "C.2",
          nombre:      "Número de personas con conocimiento de la clave privada",
          descripcion: "Cantidad de personas que conocen la clave privada o la frase semilla completa.",
          ayuda:       "Incluya a todos los agentes, funcionarios y terceros que hayan tenido acceso " +
                       "a la información de acceso a la cartera.",
          opciones: [
            { valor: 0, nivel: "Bajo",     etiqueta: "Una sola persona con acta de entrega y registro nominativo" },
            { valor: 1, nivel: "Moderado", etiqueta: "Dos o tres personas con registro documentado de acceso" },
            { valor: 2, nivel: "Alto",     etiqueta: "Más de tres personas o acceso sin documentación formal" }
          ]
        },
        {
          id:          "C3",
          codigo:      "C.3",
          nombre:      "Calidad de la trazabilidad del activo en la cadena de bloques",
          descripcion: "Grado de vinculación acreditada entre las direcciones de cartera y el investigado.",
          ayuda:       "Valore si existe informe forense de blockchain, si la vinculación es directa " +
                       "(datos KYC del exchange) o inferida mediante heurísticas de agrupamiento.",
          opciones: [
            { valor: 0, nivel: "Bajo",     etiqueta: "Dirección pública verificada y vinculada directamente al investigado mediante datos del exchange con KYC" },
            { valor: 1, nivel: "Moderado", etiqueta: "Dirección identificada mediante heurísticas de clustering, sin vinculación directa al investigado" },
            { valor: 2, nivel: "Alto",     etiqueta: "Activo trazado parcialmente o flujo interrumpido por mixer, tumbler o moneda de privacidad" }
          ]
        }
      ]
    },

    /* ══════════════════════════════════════════
     * DIMENSIÓN III — CONTEXTO OPERATIVO POLICIAL
     * Peso: 35 % | Factor: 35/6 ≈ 5,8333 | Indicadores: 3 | Máx. bruto: 6 | Máx. ponderado: 35
     * ══════════════════════════════════════════ */
    {
      id:           "D3",
      codigo:       "J",
      nombre:       "Contexto Operativo Policial",
      peso:         35,
      factor:       35 / 6,
      maxBruto:     6,
      maxPonderado: 35,
      color:        "#922b21",
      descripcion:  "Evalúa las condiciones operativas de la unidad policial actuante y la " +
                    "urgencia de la decisión sobre custodia y enajenación anticipada.",

      indicadores: [
        {
          id:          "J1",
          codigo:      "J.1",
          nombre:      "Existencia de protocolo previo en la unidad para intervención de criptoactivos",
          descripcion: "Grado de preparación operativa de la unidad policial para gestionar activos digitales.",
          ayuda:       "Compruebe si la unidad dispone de protocolo escrito, de personal con formación " +
                       "acreditada o de acceso a una unidad especializada de apoyo.",
          opciones: [
            { valor: 0, nivel: "Bajo",     etiqueta: "Unidad con protocolo específico documentado y personal con formación acreditada en activos digitales" },
            { valor: 1, nivel: "Moderado", etiqueta: "Sin protocolo propio pero con acceso a unidad especializada de apoyo disponible" },
            { valor: 2, nivel: "Alto",     etiqueta: "Sin protocolo, sin personal formado y sin unidad especializada de apoyo disponible" }
          ]
        },
        {
          id:          "J2",
          codigo:      "J.2",
          nombre:      "Urgencia de la decisión de enajenación anticipada",
          descripcion: "Valoración de si la custodia ordinaria puede mantener el valor patrimonial del activo.",
          ayuda:       "Combine la volatilidad del activo con la duración estimada de la causa para " +
                       "determinar si la custodia ordinaria genera riesgo patrimonial relevante.",
          opciones: [
            { valor: 0, nivel: "Bajo",     etiqueta: "Activo estable en valor y causa de corta duración estimada; la custodia ordinaria no genera riesgo patrimonial relevante" },
            { valor: 1, nivel: "Moderado", etiqueta: "Activo con volatilidad moderada o causa larga; conveniente elevar propuesta de enajenación al Fiscal en plazo breve" },
            { valor: 2, nivel: "Alto",     etiqueta: "Activo con alta volatilidad o valor elevado con causa larga; la custodia ordinaria genera riesgo patrimonial inmediato que justifica propuesta urgente" }
          ]
        },
        {
          id:          "J3",
          codigo:      "J.3",
          nombre:      "Claridad de la cadena de responsabilidad sobre el activo incautado",
          descripcion: "Grado de definición formal de quién responde del activo en cada fase del procedimiento.",
          ayuda:       "Verifique si existe contrato con custodio, acta de entrega entre LAJ y Policía Judicial, " +
                       "o si la custodia se desarrolla sin documentación formal de responsabilidad.",
          opciones: [
            { valor: 0, nivel: "Bajo",     etiqueta: "Responsabilidad sobre la clave claramente atribuida al custodio institucional mediante contrato o convenio formal" },
            { valor: 1, nivel: "Moderado", etiqueta: "Responsabilidad compartida entre LAJ y Policía Judicial con acta de entrega formalmente documentada" },
            { valor: 2, nivel: "Alto",     etiqueta: "Custodia sin atribución clara de responsabilidad o sin documentación formal de la entrega de la clave" }
          ]
        }
      ]
    }

  ] // fin dimensiones

}; // fin MGRPIC_DATA

// Compatibilidad con entornos Node.js (pruebas unitarias)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MGRPIC_DATA;
}
