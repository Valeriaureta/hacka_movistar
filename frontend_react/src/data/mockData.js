// Base de datos de simulación mock enriquecida para demostración visual de los 5 canales
export const MOCK_CLIENTES = [
  {
    cliente_id: "CLI-100234",
    nombre: "Valeria Mendoza Castro",
    dni: "45892134",
    tipo_cliente: "Residencial",
    antiguedad_meses: 38,
    es_movistar_total: false,
    elegible_mt: true,
    plan_actual_nombre: "Plan Postpago Ilimitado 69.90",
    plan_actual_precio: 69.90,
    consumo_datos_gb_prom: 38.4,
    monto_facturado_prom: 125.50,
    meses_moroso: 0,
    dias_mora_prom: 0,
    n_reclamos: 0,
    score_churn: 0.08,
    nivel_riesgo: "Bajo",
    canal_mas_usado: "App Mi Movistar",
    horario_optimo: "14:00 - 18:00",
    prob_contactabilidad: 0.88,
    ubicacion_departamento: "Lima",
    motor_nbo: {
      contract_version: "motor_frontend_v1",
      status: "ok",
      decision_comercial: {
        accion: "CONTACTAR",
        permite_recomendar: true,
        canal_sugerido: "Tienda",
        mensaje_asesor: "Cliente de alto valor convergente. Presentar unificación Movistar Total.",
        acciones_permitidas: ["PRESENTAR_OFERTA", "REGISTRAR_ACEPTACION", "REGISTRAR_OBJECION", "REGISTRAR_RECHAZO"]
      },
      pregunta_inteligente: {
        aplica: false,
        requiere_pregunta: false,
        pregunta: null,
        opciones: []
      },
      top_3: [
        {
          ranking: 1,
          rol: "oferta_principal",
          oferta_id: "OF021",
          nombre_oferta: "Movistar Total Plus",
          tipo_oferta: "movistar_total",
          oferta_es_mt: true,
          precio_mensual: 189.9,
          precio_promocional: 189.9,
          precio_regular: 189.9,
          ahorro_pct: 35,
          gb_incluidos: 60,
          probabilidad_aceptacion: 0.84,
          score_ranking: 0.84,
          beneficios: [
            "Móvil 5G con 60GB en alta velocidad",
            "Internet Hogar + TV incluidos",
            "Unificación en un solo recibo",
            "Ahorro de hasta 35% frente a servicios por separado"
          ],
          drivers_xai: [
            { driver: "Consumo Intensivo de Datos", peso: 0.38, detalle: "Supera los 35 GB/mes habitualmente", tipo: "positivo" },
            { driver: "Elegibilidad Movistar Total", peso: 0.32, detalle: "Mantiene servicios separados con gasto convergente", tipo: "positivo" },
            { driver: "Historial Crediticio Impecable", peso: 0.22, detalle: "0 meses en mora, puntualidad A+", tipo: "positivo" }
          ],
          vista_asesor: {
            beneficio_principal: "Ahorro estimado de 35% frente a servicios por separado.",
            speech: {
              texto: "Estimada Valeria, verificando su perfil vemos que es elegible para la unificación Movistar Total Plus con 60GB de datos, internet y TV por solo S/ 189.90 al mes.",
              tipo: "PLANTILLA_PARAMETRIZADA"
            }
          },
          quick_replies: [
            "Ofrecer ahorro por unificación de servicios",
            "Destacar los 60GB 5G incluidos",
            "Mencionar comodidad de un solo recibo"
          ]
        },
        {
          ranking: 2,
          rol: "alternativa_1",
          oferta_id: "OF004",
          nombre_oferta: "Plan Movil Ilimitado",
          tipo_oferta: "plan_movil",
          oferta_es_mt: false,
          precio_mensual: 99.9,
          precio_promocional: 99.9,
          precio_regular: 99.9,
          ahorro_pct: 0,
          gb_incluidos: 9999,
          probabilidad_aceptacion: 0.65,
          score_ranking: 0.65,
          beneficios: ["Gigas Ilimitados 5G", "Cobertura nacional", "Llamadas ilimitadas"],
          vista_asesor: {
            beneficio_principal: "Incluye datos ilimitados.",
            speech: {
              texto: "Estimada Valeria, también tenemos como alternativa el Plan Móvil Ilimitado con datos 5G sin límite.",
              tipo: "PLANTILLA_PARAMETRIZADA"
            }
          }
        },
        {
          ranking: 3,
          rol: "alternativa_2",
          oferta_id: "OF017",
          nombre_oferta: "Paquete Streaming Video",
          tipo_oferta: "paquete_adicional",
          oferta_es_mt: false,
          precio_mensual: 19.9,
          precio_promocional: 19.9,
          precio_regular: 19.9,
          ahorro_pct: 0,
          gb_incluidos: 0,
          probabilidad_aceptacion: 0.52,
          score_ranking: 0.52,
          beneficios: ["Acceso a entretenimiento en línea", "Compatible con todos los servicios"],
          vista_asesor: {
            beneficio_principal: "Entretenimiento adicional a bajo costo.",
            speech: {
              texto: "Estimada Valeria, puede complementar sus servicios con nuestro paquete de streaming de video.",
              tipo: "PLANTILLA_PARAMETRIZADA"
            }
          }
        }
      ]
    },
    ofertas_nbo: [
      {
        rank: 1,
        oferta_id: "OF021",
        nombre_oferta: "Movistar Total Plus",
        tipo_oferta: "movistar_total",
        precio_regular: 189.9,
        precio_promocional: 189.9,
        precio_mensual: 189.9,
        ahorro_pct: 35,
        probabilidad_aceptacion: 0.84,
        prob_aceptacion: 0.84,
        beneficios: [
          "Móvil 5G con 60GB en alta velocidad",
          "Internet Hogar + TV incluidos",
          "Unificación en un solo recibo",
          "Ahorro de hasta 35% frente a servicios por separado"
        ],
        drivers_xai: [
          { driver: "Consumo Intensivo de Datos", peso: 0.38, detalle: "Supera los 35 GB/mes habitualmente", tipo: "positivo" },
          { driver: "Elegibilidad Movistar Total", peso: 0.32, detalle: "Mantiene servicios separados con gasto convergente", tipo: "positivo" },
          { driver: "Historial Crediticio Impecable", peso: 0.22, detalle: "0 meses en mora, puntualidad A+", tipo: "positivo" }
        ],
        speech_asesor: "¡Hola Valeria! Al ver que disfrutas mucho de tu navegación móvil (más de 35GB al mes) y tu fidelidad de 3 años, hoy tienes asignado el beneficio exclusivo de Movistar Total Plus: unificas tu móvil con internet y TV ahorrando hasta el 35% de tu factura actual.",
        quick_replies: [
          "Ofrecer unificación con Movistar Total Plus",
          "Destacar los 60GB 5G de alta velocidad incluidos",
          "Mencionar comodidad de un solo recibo y facturación"
        ]
      }
    ]
  },
  {
    cliente_id: "CLI-100889",
    nombre: "Carlos Eduardo Ruiz Prado",
    dni: "10745239",
    tipo_cliente: "Residencial",
    antiguedad_meses: 14,
    es_movistar_total: false,
    elegible_mt: false,
    plan_actual_nombre: "Plan Dúo Internet 100 Mbps",
    plan_actual_precio: 89.90,
    consumo_datos_gb_prom: 12.0,
    monto_facturado_prom: 95.00,
    meses_moroso: 2,
    dias_mora_prom: 18,
    n_reclamos: 4,
    score_churn: 0.82,
    nivel_riesgo: "Crítico",
    canal_mas_usado: "Call Center",
    horario_optimo: "09:00 - 12:00",
    prob_contactabilidad: 0.62,
    ubicacion_departamento: "Arequipa",
    motor_nbo: {
      contract_version: "motor_frontend_v1",
      status: "ok",
      decision_comercial: {
        accion: "CONTACTAR",
        permite_recomendar: true,
        canal_sugerido: "Call In",
        mensaje_asesor: "Riesgo de fuga elevado. Priorizar contención y beneficio económico.",
        acciones_permitidas: ["PRESENTAR_OFERTA", "REGISTRAR_ACEPTACION", "REGISTRAR_OBJECION", "REGISTRAR_RECHAZO"]
      },
      pregunta_inteligente: {
        aplica: false,
        requiere_pregunta: false
      },
      top_3: [
        {
          ranking: 1,
          rol: "oferta_principal",
          oferta_id: "OF006",
          nombre_oferta: "Internet Hogar 200Mb",
          tipo_oferta: "plan_hogar",
          oferta_es_mt: false,
          precio_mensual: 109.9,
          precio_promocional: 109.9,
          precio_regular: 109.9,
          ahorro_pct: 0,
          gb_incluidos: 0,
          probabilidad_aceptacion: 0.76,
          score_ranking: 0.76,
          beneficios: [
            "Duplica velocidad a 200 Mbps",
            "Mejor rendimiento para videoconferencias",
            "Soporte técnico prioritario incluido",
            "Reemplazo de router sin costo"
          ],
          drivers_xai: [
            { driver: "Fricción por 4 Reclamos Previos", peso: -0.45, detalle: "Intermitencias reportadas el último trimestre", tipo: "alerta" },
            { driver: "Necesidad de Mayor Velocidad", peso: 0.35, detalle: "Patrón de uso indica beneficio de upgrade", tipo: "positivo" }
          ],
          vista_asesor: {
            beneficio_principal: "Solución a problemas de velocidad con servicio mejorado.",
            speech: {
              texto: "Estimado Carlos, entendemos sus observaciones previas sobre la calidad de conexión. Queremos ofrecer un upgrade a 200 Mbps, duplicando su velocidad actual, con soporte técnico prioritario incluido.",
              tipo: "PLANTILLA_PARAMETRIZADA"
            }
          },
          quick_replies: [
            "Ofrecer upgrade a 200 Mbps para mejor rendimiento",
            "Destacar soporte técnico prioritario incluido",
            "Agendar revisión técnica preventiva del servicio"
          ]
        }
      ]
    },
    ofertas_nbo: [
      {
        rank: 1,
        oferta_id: "OF006",
        nombre_oferta: "Internet Hogar 200Mb",
        tipo_oferta: "plan_hogar",
        precio_regular: 109.9,
        precio_promocional: 109.9,
        precio_mensual: 109.9,
        ahorro_pct: 0,
        probabilidad_aceptacion: 0.76,
        prob_aceptacion: 0.76,
        beneficios: [
          "Duplica velocidad a 200 Mbps",
          "Mejor rendimiento para videoconferencias",
          "Soporte técnico prioritario incluido",
          "Reemplazo de router sin costo"
        ],
        drivers_xai: [
          { driver: "Fricción por 4 Reclamos Previos", peso: -0.45, detalle: "Intermitencias reportadas el último trimestre", tipo: "alerta" },
          { driver: "Necesidad de Mayor Velocidad", peso: 0.35, detalle: "Patrón de uso indica beneficio de upgrade", tipo: "positivo" }
        ],
        speech_asesor: "Señor Carlos, entiendo perfectamente la molestia por las incidencias pasadas y le pido sinceras disculpas. Como solución inmediata y muestra de compromiso, le ofrezco un upgrade a 200 Mbps, duplicando su velocidad actual, con soporte técnico prioritario para garantizar la calidad de su conexión.",
        quick_replies: [
          "Ofrecer upgrade a 200 Mbps para mejor rendimiento",
          "Destacar soporte técnico prioritario incluido",
          "Agendar revisión técnica preventiva del servicio"
        ]
      }
    ]
  },
  {
    cliente_id: "CLI-101452",
    nombre: "Elena Rocío Thorne Paz",
    dni: "71239845",
    tipo_cliente: "Pyme / Negocio",
    antiguedad_meses: 52,
    es_movistar_total: true,
    elegible_mt: false,
    plan_actual_nombre: "Trío Negocio Total 300 Mbps",
    plan_actual_precio: 219.90,
    consumo_datos_gb_prom: 58.2,
    monto_facturado_prom: 245.00,
    meses_moroso: 0,
    dias_mora_prom: 0,
    n_reclamos: 0,
    score_churn: 0.03,
    nivel_riesgo: "Muy Bajo",
    canal_mas_usado: "Digital / Web",
    horario_optimo: "18:00 - 21:00",
    prob_contactabilidad: 0.95,
    ubicacion_departamento: "Trujillo",
    motor_nbo: {
      contract_version: "motor_frontend_v1",
      status: "ok",
      decision_comercial: {
        accion: "CONTACTAR",
        permite_recomendar: true,
        canal_sugerido: "Digital",
        mensaje_asesor: "Cliente VIP corporativo. Ofrecer salto a 1 Gbps con WiFi 6.",
        acciones_permitidas: ["PRESENTAR_OFERTA", "REGISTRAR_ACEPTACION", "REGISTRAR_OBJECION", "REGISTRAR_RECHAZO"]
      },
      pregunta_inteligente: {
        aplica: false,
        requiere_pregunta: false
      },
      top_3: [
        {
          ranking: 1,
          rol: "oferta_principal",
          oferta_id: "OF022",
          nombre_oferta: "Movistar Total Max",
          tipo_oferta: "movistar_total",
          oferta_es_mt: true,
          precio_mensual: 229.9,
          precio_promocional: 229.9,
          precio_regular: 229.9,
          ahorro_pct: 50,
          gb_incluidos: 9999,
          probabilidad_aceptacion: 0.89,
          score_ranking: 0.89,
          beneficios: [
            "Datos ilimitados 5G para móvil",
            "Internet Hogar de alta velocidad",
            "TV incluida con contenido premium",
            "Convergencia total en un solo recibo"
          ],
          drivers_xai: [
            { driver: "Alto Consumo Corporativo", peso: 0.42, detalle: "Tráfico de subida y videoconferencias continuo", tipo: "positivo" },
            { driver: "Fidelidad Histórica (>4 años)", peso: 0.35, detalle: "Cliente top tier con máxima valoración", tipo: "positivo" }
          ],
          vista_asesor: {
            beneficio_principal: "Máxima convergencia y datos ilimitados con ahorro de 50%.",
            speech: {
              texto: "Estimada Elena, gracias a su excelente trayectoria con nosotros, le recomendamos Movistar Total Max: datos ilimitados, internet y TV en un solo servicio.",
              tipo: "PLANTILLA_PARAMETRIZADA"
            }
          },
          quick_replies: [
            "Ofrecer Total Max con datos ilimitados",
            "Resaltar ahorro de 50% en convergencia completa",
            "Mencionar beneficios exclusivos para clientes VIP"
          ]
        }
      ]
    },
    ofertas_nbo: [
      {
        rank: 1,
        oferta_id: "OF022",
        nombre_oferta: "Movistar Total Max",
        tipo_oferta: "movistar_total",
        precio_regular: 229.9,
        precio_promocional: 229.9,
        precio_mensual: 229.9,
        ahorro_pct: 50,
        probabilidad_aceptacion: 0.89,
        prob_aceptacion: 0.89,
        beneficios: [
          "Datos ilimitados 5G para móvil",
          "Internet Hogar de alta velocidad",
          "TV incluida con contenido premium",
          "Convergencia total en un solo recibo"
        ],
        drivers_xai: [
          { driver: "Alto Consumo Corporativo", peso: 0.42, detalle: "Tráfico de subida y videoconferencias continuo", tipo: "positivo" },
          { driver: "Fidelidad Histórica (>4 años)", peso: 0.35, detalle: "Cliente top tier con máxima valoración", tipo: "positivo" }
        ],
        speech_asesor: "Estimada Sra. Elena, gracias a su excelente trayectoria con nosotros, le recomendamos Movistar Total Max: acceso a datos ilimitados, internet de alta velocidad y TV en un único servicio convergente, con ahorro de hasta el 50%.",
        quick_replies: [
          "Ofrecer Total Max con datos ilimitados",
          "Resaltar ahorro de 50% en convergencia completa",
          "Mencionar beneficios exclusivos para clientes VIP"
        ]
      }
    ]
  }
];

export const CATALOGO_OFERTAS = [
  // Planes Móvil (OF001-OF004)
  {
    id: "OF001",
    categoria: "Móvil Postpago",
    nombre: "Plan Movil Basico 10GB",
    velocidad: "N/A",
    gigas: "10 GB",
    precio_regular: 39.9,
    precio_promo: 39.9,
    destacado: false,
    etiqueta: "Básico"
  },
  {
    id: "OF002",
    categoria: "Móvil Postpago",
    nombre: "Plan Movil Plus 25GB",
    velocidad: "N/A",
    gigas: "25 GB",
    precio_regular: 59.9,
    precio_promo: 59.9,
    destacado: false,
    etiqueta: "Popular"
  },
  {
    id: "OF003",
    categoria: "Móvil Postpago",
    nombre: "Plan Movil Max 50GB",
    velocidad: "N/A",
    gigas: "50 GB",
    precio_regular: 79.9,
    precio_promo: 79.9,
    destacado: false,
    etiqueta: "Premium"
  },
  {
    id: "OF004",
    categoria: "Móvil Postpago",
    nombre: "Plan Movil Ilimitado",
    velocidad: "N/A",
    gigas: "Ilimitado 5G",
    precio_regular: 99.9,
    precio_promo: 99.9,
    destacado: true,
    etiqueta: "Máximo"
  },
  // Planes Hogar (OF005-OF010)
  {
    id: "OF005",
    categoria: "Internet Hogar",
    nombre: "Internet Hogar 100Mb",
    velocidad: "100 Mbps",
    gigas: "N/A",
    precio_regular: 89.9,
    precio_promo: 89.9,
    destacado: false,
    etiqueta: "Estándar"
  },
  {
    id: "OF006",
    categoria: "Internet Hogar",
    nombre: "Internet Hogar 200Mb",
    velocidad: "200 Mbps",
    gigas: "N/A",
    precio_regular: 109.9,
    precio_promo: 109.9,
    destacado: false,
    etiqueta: "Rápido"
  },
  {
    id: "OF007",
    categoria: "TV Hogar",
    nombre: "TV Hogar Sola",
    velocidad: "N/A",
    gigas: "N/A",
    precio_regular: 69.9,
    precio_promo: 69.9,
    destacado: false,
    etiqueta: "Entretenimiento"
  },
  {
    id: "OF008",
    categoria: "Paquete Hogar",
    nombre: "Internet + TV Hogar",
    velocidad: "N/A",
    gigas: "N/A",
    precio_regular: 129.9,
    precio_promo: 129.9,
    destacado: false,
    etiqueta: "Dúo"
  },
  {
    id: "OF009",
    categoria: "Paquete Hogar",
    nombre: "Internet + Fijo Hogar",
    velocidad: "N/A",
    gigas: "N/A",
    precio_regular: 119.9,
    precio_promo: 119.9,
    destacado: false,
    etiqueta: "Conectado"
  },
  {
    id: "OF010",
    categoria: "Paquete Hogar",
    nombre: "Internet + TV + Fijo Hogar",
    velocidad: "N/A",
    gigas: "N/A",
    precio_regular: 159.9,
    precio_promo: 159.9,
    destacado: false,
    etiqueta: "Trío Completo"
  },
  // Upgrades (OF011-OF013)
  {
    id: "OF011",
    categoria: "Upgrade",
    nombre: "Upgrade a Plan Plus",
    velocidad: "N/A",
    gigas: "+15 GB",
    precio_regular: 20.0,
    precio_promo: 20.0,
    destacado: false,
    etiqueta: "Más Datos"
  },
  {
    id: "OF012",
    categoria: "Upgrade",
    nombre: "Upgrade a Plan Max",
    velocidad: "N/A",
    gigas: "+40 GB",
    precio_regular: 40.0,
    precio_promo: 40.0,
    destacado: false,
    etiqueta: "Máximos Datos"
  },
  {
    id: "OF013",
    categoria: "Upgrade",
    nombre: "Upgrade Velocidad Hogar",
    velocidad: "Velocidad Mejorada",
    gigas: "N/A",
    precio_regular: 25.0,
    precio_promo: 25.0,
    destacado: false,
    etiqueta: "Más Velocidad"
  },
  // Equipos (OF014-OF016)
  {
    id: "OF014",
    categoria: "Equipo",
    nombre: "Equipo Smartphone Gama Media",
    velocidad: "N/A",
    gigas: "N/A",
    precio_regular: 45.0,
    precio_promo: 45.0,
    destacado: false,
    etiqueta: "Smartphone"
  },
  {
    id: "OF015",
    categoria: "Equipo",
    nombre: "Equipo Smartphone Gama Alta",
    velocidad: "N/A",
    gigas: "N/A",
    precio_regular: 90.0,
    precio_promo: 90.0,
    destacado: false,
    etiqueta: "Premium"
  },
  {
    id: "OF016",
    categoria: "Equipo",
    nombre: "Router WiFi 6",
    velocidad: "N/A",
    gigas: "N/A",
    precio_regular: 15.0,
    precio_promo: 15.0,
    destacado: false,
    etiqueta: "Conectividad"
  },
  // Paquetes Adicionales (OF017-OF019)
  {
    id: "OF017",
    categoria: "Paquete Adicional",
    nombre: "Paquete Streaming Video",
    velocidad: "N/A",
    gigas: "N/A",
    precio_regular: 19.9,
    precio_promo: 19.9,
    destacado: false,
    etiqueta: "Entretenimiento"
  },
  {
    id: "OF018",
    categoria: "Paquete Adicional",
    nombre: "Paquete Seguridad Digital",
    velocidad: "N/A",
    gigas: "N/A",
    precio_regular: 12.9,
    precio_promo: 12.9,
    destacado: false,
    etiqueta: "Protección"
  },
  {
    id: "OF019",
    categoria: "Paquete Adicional",
    nombre: "Paquete Roaming Internacional",
    velocidad: "N/A",
    gigas: "+5 GB",
    precio_regular: 29.9,
    precio_promo: 29.9,
    destacado: false,
    etiqueta: "Global"
  },
  // Movistar Total (OF020-OF022)
  {
    id: "OF020",
    categoria: "Movistar Total",
    nombre: "Movistar Total Basico",
    velocidad: "N/A",
    gigas: "30 GB",
    precio_regular: 149.9,
    precio_promo: 149.9,
    destacado: true,
    etiqueta: "Convergente"
  },
  {
    id: "OF021",
    categoria: "Movistar Total",
    nombre: "Movistar Total Plus",
    velocidad: "N/A",
    gigas: "60 GB",
    precio_regular: 189.9,
    precio_promo: 189.9,
    destacado: true,
    etiqueta: "Premium Total"
  },
  {
    id: "OF022",
    categoria: "Movistar Total",
    nombre: "Movistar Total Max",
    velocidad: "N/A",
    gigas: "Ilimitado 5G",
    precio_regular: 229.9,
    precio_promo: 229.9,
    destacado: true,
    etiqueta: "Máximo Total"
  }
];
