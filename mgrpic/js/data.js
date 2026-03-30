/**
 * data.js — Definición canónica de dimensiones, indicadores y escalas de la MGRPIC.
 *
 * Contiene ÚNICAMENTE datos estáticos. No incluye lógica de cálculo ni de interfaz.
 * Para ajustar ponderaciones, añadir o eliminar indicadores, editar solo este archivo.
 *
 * Estructura de puntuación:
 *   Cada indicador puntúa 0 (Bajo), 1 (Moderado) o 2 (Alto).
 *   La suma bruta de cada dimensión se multiplica por su factor de ponderación.
 *   La puntuación total es la suma de las cuatro dimensiones (escala 0-100).
 *
 * Fórmulas:
 *   Dim I  (Volatilidad)              = (V1+V2+V3+V4) × 4.375
 *   Dim II (Custodia)                 = (C1+C2+C3+C4) × 3.125
 *   Dim III (Inejecutabilidad)        = (I1+I2+I3+I4) × 3.125
 *   Dim IV (Riesgo Jurídico-Procesal) = (J1+J2+J3)    × 2.5
 *   TOTAL = Dim I + Dim II + Dim III + Dim IV  (0-100 puntos)
 */

const MGRPIC_DATA = {

  version: "1.0",
  nombre: "Matriz de Gestión de Riesgo Procesal en la Incautación de Criptoactivos",
  acronimo: "MGRPIC",
  descripcion: "Herramienta de apoyo a la decisión policial y judicial española para evaluar " +
               "el riesgo procesal de criptoactivos incautados en procedimientos penales.",

  /* ─────────────────────────────────────────────
   * ESCALA GLOBAL DE RIESGO (sobre puntuación 0-100)
   * ───────────────────────────────────────────── */
  escalaRiesgo: [
    {
      nivel:      "BAJO",
      min:        0,
      max:        25,
      color:      "#27ae60",   // verde
      colorClaro: "#d5f5e3",
      descripcion: "Riesgo procesal controlado. Las condiciones actuales permiten mantener " +
                   "la custodia ordinaria sin actuaciones urgentes adicionales."
    },
    {
      nivel:      "MODERADO",
      min:        26,
      max:        50,
      color:      "#f39c12",   // ámbar
      colorClaro: "#fef9e7",
      descripcion: "Riesgo procesal significativo. Se recomienda revisar los indicadores " +
                   "con puntuación alta y adoptar medidas preventivas en el corto plazo."
    },
    {
      nivel:      "ALTO",
      min:        51,
      max:        75,
      color:      "#e67e22",   // naranja
      colorClaro: "#fdebd0",
      descripcion: "Riesgo procesal elevado. Se aconseja elevar propuesta motivada al " +
                   "Juez de Instrucción para adopción de medidas cautelares urgentes " +
                   "(enajenación anticipada, custodio institucional u otras)."
    },
    {
      nivel:      "CRÍTICO",
      min:        76,
      max:        100,
      color:      "#c0392b",   // rojo
      colorClaro: "#fadbd8",
      descripcion: "Riesgo procesal máximo. Actuación inmediata imprescindible. " +
                   "Se recomienda solicitar con carácter urgente autorización judicial " +
                   "para enajenación anticipada o custodia institucional especializada."
    }
  ],

  /* ─────────────────────────────────────────────
   * DIMENSIONES E INDICADORES
   * ───────────────────────────────────────────── */
  dimensiones: [

    /* ══════════════════════════════════════════
     * DIMENSIÓN I — VOLATILIDAD
     * Peso: 35 % | Factor: 4.375 | Indicadores: 4 | Máx. bruto: 8 | Máx. ponderado: 35
     * ══════════════════════════════════════════ */
    {
      id:          "D1",
      codigo:      "V",
      nombre:      "Volatilidad",
      peso:        35,           // porcentaje
      factor:      4.375,        // multiplicador sobre suma bruta
      maxBruto:    8,            // 4 indicadores × máx. 2 puntos
      maxPonderado:35,
      color:       "#6c3483",
      descripcion: "Evalúa el riesgo de pérdida de valor económico de los criptoactivos " +
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
            {
              valor:    0,
              nivel:    "Bajo",
              etiqueta: "Stablecoin referenciada a moneda fiduciaria (USDT, USDC)"
            },
            {
              valor:    1,
              nivel:    "Moderado",
              etiqueta: "Criptoactivo de alta capitalización con mercado líquido (BTC, ETH)"
            },
            {
              valor:    2,
              nivel:    "Alto",
              etiqueta: "Altcoin de baja capitalización, activo desconocido o token sin mercado secundario activo"
            }
          ]
        },
        {
          id:          "V2",
          codigo:      "V.2",
          nombre:      "Variación de precio en los 30 días previos",
          descripcion: "Oscilación porcentual del precio de mercado en el último mes natural.",
          ayuda:       "Consulte fuentes como CoinMarketCap o CoinGecko para obtener la variación " +
                       "en los 30 días anteriores a la fecha de evaluación.",
          opciones: [
            {
              valor:    0,
              nivel:    "Bajo",
              etiqueta: "Inferior al 10% sin tendencia marcada"
            },
            {
              valor:    1,
              nivel:    "Moderado",
              etiqueta: "Entre el 10% y el 30%"
            },
            {
              valor:    2,
              nivel:    "Alto",
              etiqueta: "Superior al 30% o variación brusca superior al 15% en las últimas 48 horas"
            }
          ]
        },
        {
          id:          "V3",
          codigo:      "V.3",
          nombre:      "Duración estimada del proceso",
          descripcion: "Plazo previsible hasta resolución judicial firme que ponga fin al procedimiento.",
          ayuda:       "Tenga en cuenta la complejidad del asunto, el número de investigados, " +
                       "la existencia de elementos internacionales y la carga del juzgado.",
          opciones: [
            {
              valor:    0,
              nivel:    "Bajo",
              etiqueta: "Menos de 6 meses"
            },
            {
              valor:    1,
              nivel:    "Moderado",
              etiqueta: "Entre 6 meses y 2 años"
            },
            {
              valor:    2,
              nivel:    "Alto",
              etiqueta: "Más de 2 años o causa con complejidad internacional"
            }
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
            {
              valor:    0,
              nivel:    "Bajo",
              etiqueta: "Inferior a 10.000 €"
            },
            {
              valor:    1,
              nivel:    "Moderado",
              etiqueta: "Entre 10.000 € y 500.000 €"
            },
            {
              valor:    2,
              nivel:    "Alto",
              etiqueta: "Superior a 500.000 €"
            }
          ]
        }
      ]
    },

    /* ══════════════════════════════════════════
     * DIMENSIÓN II — CUSTODIA
     * Peso: 25 % | Factor: 3.125 | Indicadores: 4 | Máx. bruto: 8 | Máx. ponderado: 25
     * ══════════════════════════════════════════ */
    {
      id:          "D2",
      codigo:      "C",
      nombre:      "Custodia",
      peso:        25,
      factor:      3.125,
      maxBruto:    8,
      maxPonderado:25,
      color:       "#1a5276",
      descripcion: "Evalúa la seguridad física y documental del sistema de custodia " +
                   "de las claves privadas de los criptoactivos incautados.",

      indicadores: [
        {
          id:          "C1",
          codigo:      "C.1",
          nombre:      "Tipo de soporte de custodia de la clave privada",
          descripcion: "Medio físico o institucional en que se custodian las claves privadas o la frase semilla.",
          ayuda:       "Valore el soporte de custodia principal. Si hay múltiples carteras con distintos " +
                       "soportes, puntúe según el activo de mayor valor.",
          opciones: [
            {
              valor:    0,
              nivel:    "Bajo",
              etiqueta: "Custodio institucional especializado (Prosegur Crypto u ORGA) con contrato formalizado"
            },
            {
              valor:    1,
              nivel:    "Moderado",
              etiqueta: "Monedero frío policial bajo acta formal de entrega al LAJ"
            },
            {
              valor:    2,
              nivel:    "Alto",
              etiqueta: "Soporte en papel, dispositivo sin cifrar, soporte no verificado o custodia informal sin acta"
            }
          ]
        },
        {
          id:          "C2",
          codigo:      "C.2",
          nombre:      "Número de personas con conocimiento de la clave",
          descripcion: "Cantidad de personas que conocen la clave privada o la frase semilla completa.",
          ayuda:       "Incluya a todos los agentes, funcionarios y terceros que hayan tenido acceso " +
                       "a la información de acceso a la cartera.",
          opciones: [
            {
              valor:    0,
              nivel:    "Bajo",
              etiqueta: "Una sola persona con acta de entrega y registro nominativo"
            },
            {
              valor:    1,
              nivel:    "Moderado",
              etiqueta: "Dos o tres personas con registro documentado de acceso"
            },
            {
              valor:    2,
              nivel:    "Alto",
              etiqueta: "Más de tres personas o acceso sin documentación formal"
            }
          ]
        },
        {
          id:          "C3",
          codigo:      "C.3",
          nombre:      "Copia de seguridad de la frase semilla (seed phrase)",
          descripcion: "Existencia y situación de la copia de respaldo de la frase de recuperación.",
          ayuda:       "Verifique si existe copia de la seed phrase, dónde se encuentra y si está " +
                       "bajo custodia judicial formalizada.",
          opciones: [
            {
              valor:    0,
              nivel:    "Bajo",
              etiqueta: "Copia verificada en custodia independiente bajo acta judicial"
            },
            {
              valor:    1,
              nivel:    "Moderado",
              etiqueta: "Copia existente pero sin custodia formal documentada"
            },
            {
              valor:    2,
              nivel:    "Alto",
              etiqueta: "Copia no localizada, destruida o en paradero desconocido"
            }
          ]
        },
        {
          id:          "C4",
          codigo:      "C.4",
          nombre:      "Verificación periódica del saldo en cadena de bloques",
          descripcion: "Frecuencia y método de comprobación de que los activos permanecen en la dirección custodiada.",
          ayuda:       "Compruebe si existe protocolo de verificación del saldo y si está documentado. " +
                       "La verificación puede hacerse con un explorador de bloques (blockexplorer) sin necesidad de acceder a la clave.",
          opciones: [
            {
              valor:    0,
              nivel:    "Bajo",
              etiqueta: "Verificación automatizada y documentada con registro de fechas"
            },
            {
              valor:    1,
              nivel:    "Moderado",
              etiqueta: "Verificación manual realizada al inicio y cada tres meses"
            },
            {
              valor:    2,
              nivel:    "Alto",
              etiqueta: "Sin verificación realizada o incapacidad técnica para efectuarla"
            }
          ]
        }
      ]
    },

    /* ══════════════════════════════════════════
     * DIMENSIÓN III — INEJECUTABILIDAD DEL DECOMISO
     * Peso: 25 % | Factor: 3.125 | Indicadores: 4 | Máx. bruto: 8 | Máx. ponderado: 25
     * ══════════════════════════════════════════ */
    {
      id:          "D3",
      codigo:      "I",
      nombre:      "Inejecutabilidad del Decomiso",
      peso:        25,
      factor:      3.125,
      maxBruto:    8,
      maxPonderado:25,
      color:       "#1e8449",
      descripcion: "Evalúa los factores que pueden impedir la ejecución efectiva del decomiso " +
                   "de los criptoactivos una vez dictada la resolución judicial.",

      indicadores: [
        {
          id:          "I1",
          codigo:      "I.1",
          nombre:      "Calidad de la trazabilidad del activo en la cadena de bloques",
          descripcion: "Grado de vinculación acreditada entre las direcciones de cartera y el investigado.",
          ayuda:       "Valore si existe informe forense de blockchain, si la vinculación es directa " +
                       "(datos KYC del exchange) o inferida mediante heurísticas de agrupamiento.",
          opciones: [
            {
              valor:    0,
              nivel:    "Bajo",
              etiqueta: "Dirección pública verificada y vinculada directamente al investigado mediante datos del exchange"
            },
            {
              valor:    1,
              nivel:    "Moderado",
              etiqueta: "Dirección identificada mediante heurísticas de clustering, sin vinculación directa al investigado"
            },
            {
              valor:    2,
              nivel:    "Alto",
              etiqueta: "Activo trazado parcialmente o flujo interrumpido por mixer, tumbler o moneda de privacidad"
            }
          ]
        },
        {
          id:          "I2",
          codigo:      "I.2",
          nombre:      "Disponibilidad de la clave privada",
          descripcion: "Situación de la clave privada necesaria para ejecutar el decomiso o la transferencia judicial.",
          ayuda:       "Indique si las claves han sido obtenidas lícitamente, si están pendientes de " +
                       "transferencia formal o si son desconocidas/destruidas.",
          opciones: [
            {
              valor:    0,
              nivel:    "Bajo",
              etiqueta: "Clave obtenida y bajo custodia formalizada"
            },
            {
              valor:    1,
              nivel:    "Moderado",
              etiqueta: "Clave conocida pero pendiente de transferencia formal"
            },
            {
              valor:    2,
              nivel:    "Alto",
              etiqueta: "Clave desconocida, destruida o en poder exclusivo de un investigado no cooperante"
            }
          ]
        },
        {
          id:          "I3",
          codigo:      "I.3",
          nombre:      "Situación procesal del investigado",
          descripcion: "Estado de libertad o detención del investigado y su disposición a cooperar.",
          ayuda:       "La situación de libertad del investigado con acceso potencial a dispositivos " +
                       "o conocimiento de las claves aumenta significativamente el riesgo de frustración del decomiso.",
          opciones: [
            {
              valor:    0,
              nivel:    "Bajo",
              etiqueta: "Investigado en prisión provisional o en situación de detención"
            },
            {
              valor:    1,
              nivel:    "Moderado",
              etiqueta: "Investigado en libertad provisional con medidas cautelares personales"
            },
            {
              valor:    2,
              nivel:    "Alto",
              etiqueta: "Investigado no localizado, en paradero desconocido o en país sin cooperación judicial"
            }
          ]
        },
        {
          id:          "I4",
          codigo:      "I.4",
          nombre:      "Localización de los activos respecto a exchanges cooperantes",
          descripcion: "Situación de los activos en relación con plataformas sometidas a obligaciones de cooperación judicial.",
          ayuda:       "Valore si los activos están en exchanges regulados en España/UE con protocolo de " +
                       "cooperación establecido, o en plataformas descentralizadas/no cooperantes.",
          opciones: [
            {
              valor:    0,
              nivel:    "Bajo",
              etiqueta: "Todos los activos identificados en exchanges sujetos a obligaciones de cooperación"
            },
            {
              valor:    1,
              nivel:    "Moderado",
              etiqueta: "Activos parcialmente en exchanges de cooperación limitada o en proceso de identificación"
            },
            {
              valor:    2,
              nivel:    "Alto",
              etiqueta: "Activos en exchanges no identificados, descentralizados o en jurisdicciones no cooperantes"
            }
          ]
        }
      ]
    },

    /* ══════════════════════════════════════════
     * DIMENSIÓN IV — RIESGO JURÍDICO-PROCESAL
     * Peso: 15 % | Factor: 2.5 | Indicadores: 3 | Máx. bruto: 6 | Máx. ponderado: 15
     * ══════════════════════════════════════════ */
    {
      id:          "D4",
      codigo:      "J",
      nombre:      "Riesgo Jurídico-Procesal",
      peso:        15,
      factor:      2.5,
      maxBruto:    6,
      maxPonderado:15,
      color:       "#922b21",
      descripcion: "Evalúa los riesgos legales y procesales derivados de la falta de " +
                   "criterio judicial consolidado y de la posible responsabilidad patrimonial del Estado.",

      indicadores: [
        {
          id:          "J1",
          codigo:      "J.1",
          nombre:      "Existencia de criterio judicial previo del órgano sobre criptoactivos",
          descripcion: "Grado de consolidación de doctrina judicial en el juzgado y audiencia de referencia.",
          ayuda:       "Consulte las resoluciones del juzgado y de la Audiencia Provincial sobre custodia " +
                       "y enajenación de criptoactivos. La ausencia de criterio propio eleva la incertidumbre procesal.",
          opciones: [
            {
              valor:    0,
              nivel:    "Bajo",
              etiqueta: "El juzgado ha dictado resoluciones previas sobre custodia o enajenación de criptoactivos con criterio consolidado"
            },
            {
              valor:    1,
              nivel:    "Moderado",
              etiqueta: "El juzgado carece de criterio propio pero existe doctrina de la Audiencia Provincial de referencia"
            },
            {
              valor:    2,
              nivel:    "Alto",
              etiqueta: "Sin precedente en el juzgado ni en la Audiencia; criterio completamente incierto"
            }
          ]
        },
        {
          id:          "J2",
          codigo:      "J.2",
          nombre:      "Probabilidad de reclamación patrimonial por variación de valor",
          descripcion: "Riesgo de que el investigado o tercero reclame daños por la pérdida o ganancia de valor durante la custodia.",
          ayuda:       "Si el activo ha variado más de un 25% desde la incautación sin que se haya adoptado " +
                       "ninguna decisión de gestión, el riesgo de reclamación patrimonial contra la Administración es elevado.",
          opciones: [
            {
              valor:    0,
              nivel:    "Bajo",
              etiqueta: "Activo ya enajenado o convertido; valor congelado documentalmente en el acta"
            },
            {
              valor:    1,
              nivel:    "Moderado",
              etiqueta: "Activo en custodia con variación de valor documentada pero inferior al umbral de activación"
            },
            {
              valor:    2,
              nivel:    "Alto",
              etiqueta: "Activo en custodia con variación superior al 25% desde la incautación y sin decisión de gestión adoptada"
            }
          ]
        },
        {
          id:          "J3",
          codigo:      "J.3",
          nombre:      "Claridad de la cadena de responsabilidad institucional",
          descripcion: "Grado de definición formal de quién responde de los activos en cada fase del procedimiento.",
          ayuda:       "Verifique si existe contrato con custodio, acta de entrega entre LAJ y Policía Judicial, " +
                       "o si la custodia se desarrolla de forma informal sin documentación de responsabilidad.",
          opciones: [
            {
              valor:    0,
              nivel:    "Bajo",
              etiqueta: "Responsabilidad claramente atribuida al custodio institucional mediante contrato o convenio formal"
            },
            {
              valor:    1,
              nivel:    "Moderado",
              etiqueta: "Responsabilidad compartida entre LAJ y Policía Judicial con acta de entrega documentada"
            },
            {
              valor:    2,
              nivel:    "Alto",
              etiqueta: "Custodia informal sin atribución clara de responsabilidad ni documentación de entrega"
            }
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
