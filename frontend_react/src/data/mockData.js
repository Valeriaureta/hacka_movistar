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
          oferta_id: "MT-DUO-PRO-200",
          nombre_oferta: "Movistar Total Dúo Pro 200 Mbps",
          tipo_oferta: "Movistar Total",
          oferta_es_mt: true,
          precio_mensual: 119.90,
          precio_promocional: 119.90,
          precio_regular: 169.90,
          ahorro_pct: 35,
          gb_incluidos: 60,
          probabilidad_aceptacion: 0.84,
          score_ranking: 0.84,
          beneficios: [
            "200 Mbps Fibra Óptica Simétrica",
            "Móvil Ilimitado 5G con 60GB en alta velocidad",
            "Pase exclusivo Movistar TV App",
            "Descuento de S/ 50 por 6 meses"
          ],
          drivers_xai: [
            { driver: "Consumo Intensivo de Datos", peso: 0.38, detalle: "Supera los 35 GB/mes habitualmente", tipo: "positivo" },
            { driver: "Elegibilidad Movistar Total", peso: 0.32, detalle: "Mantiene servicios separados con gasto convergente", tipo: "positivo" },
            { driver: "Historial Crediticio Impecable", peso: 0.22, detalle: "0 meses en mora, puntualidad A+", tipo: "positivo" }
          ],
          vista_asesor: {
            beneficio_principal: "Ahorro estimado de 35% frente a servicios por separado.",
            speech: {
              texto: "Estimada Valeria, verificando su perfil vemos que tiene asignada la unificación Movistar Total con 200 Mbps de fibra simétrica y 60GB por solo S/ 119.90 al mes.",
              tipo: "PLANTILLA_PARAMETRIZADA"
            }
          },
          quick_replies: [
            "Ofrecer ahorro de S/ 50 unificando con Fibra Óptica 200MB",
            "Destacar los 60GB 5G de alta velocidad incluidos",
            "Mencionar pase gratis a Movistar TV App por ser cliente fiel"
          ]
        },
        {
          ranking: 2,
          rol: "alternativa_1",
          oferta_id: "UPG-PLAN-69",
          nombre_oferta: "Plan Ilimitado Plus 69.90",
          tipo_oferta: "Upgrade Móvil",
          oferta_es_mt: false,
          precio_mensual: 49.90,
          precio_promocional: 49.90,
          precio_regular: 69.90,
          ahorro_pct: 28,
          gb_incluidos: 9999,
          probabilidad_aceptacion: 0.65,
          score_ranking: 0.65,
          beneficios: ["Gigas Ilimitados 5G", "Descuento en cargo fijo", "Cobertura nacional"],
          vista_asesor: {
            beneficio_principal: "Incluye datos ilimitados.",
            speech: {
              texto: "Estimada Valeria, también tenemos como alternativa el Plan Ilimitado Plus a precio promocional.",
              tipo: "PLANTILLA_PARAMETRIZADA"
            }
          }
        },
        {
          ranking: 3,
          rol: "alternativa_2",
          oferta_id: "STREAM-MAX",
          nombre_oferta: "Paquete Streaming Max + Disney+",
          tipo_oferta: "Cross-sell",
          oferta_es_mt: false,
          precio_mensual: 29.90,
          precio_promocional: 29.90,
          precio_regular: 45.00,
          ahorro_pct: 33,
          gb_incluidos: 0,
          probabilidad_aceptacion: 0.52,
          score_ranking: 0.52,
          beneficios: ["Acceso a Max y Disney+ con descuento en recibo único"],
          vista_asesor: {
            beneficio_principal: "Ahorro de 33% en plataformas streaming.",
            speech: {
              texto: "Estimada Valeria, puede complementar sus servicios con nuestro paquete de entretenimiento familiar.",
              tipo: "PLANTILLA_PARAMETRIZADA"
            }
          }
        }
      ]
    },
    ofertas_nbo: [
      {
        rank: 1,
        oferta_id: "MT-DUO-PRO-200",
        nombre_oferta: "Movistar Total Dúo Pro 200 Mbps",
        tipo_oferta: "Movistar Total",
        precio_regular: 169.90,
        precio_promocional: 119.90,
        precio_mensual: 119.90,
        ahorro_pct: 35,
        probabilidad_aceptacion: 0.84,
        prob_aceptacion: 0.84,
        beneficios: [
          "200 Mbps Fibra Óptica Simétrica",
          "Móvil Ilimitado 5G con 60GB en alta velocidad",
          "Pase exclusivo Movistar TV App",
          "Descuento de S/ 50 por 6 meses"
        ],
        drivers_xai: [
          { driver: "Consumo Intensivo de Datos", peso: 0.38, detalle: "Supera los 35 GB/mes habitualmente", tipo: "positivo" },
          { driver: "Elegibilidad Movistar Total", peso: 0.32, detalle: "Mantiene servicios separados con gasto convergente", tipo: "positivo" },
          { driver: "Historial Crediticio Impecable", peso: 0.22, detalle: "0 meses en mora, puntualidad A+", tipo: "positivo" }
        ],
        speech_asesor: "¡Hola Valeria! Al ver que disfrutas mucho de tu navegación móvil (más de 35GB al mes) y tu fidelidad de 3 años, hoy tienes asignado el beneficio exclusivo de Movistar Total: unificas tu móvil con Fibra Simétrica de 200MB ahorrando S/ 50 mensuales.",
        quick_replies: [
          "Ofrecer ahorro de S/ 50 unificando con Fibra Óptica 200MB",
          "Destacar los 60GB 5G de alta velocidad incluidos",
          "Mencionar pase gratis a Movistar TV App por ser cliente fiel"
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
          oferta_id: "RET-RETENCION-30PCT",
          nombre_oferta: "Bono Fidelidad: 30% Descuento + Duplica Velocidad",
          tipo_oferta: "Retención / Blindaje",
          oferta_es_mt: false,
          precio_mensual: 62.90,
          precio_promocional: 62.90,
          precio_regular: 89.90,
          ahorro_pct: 30,
          gb_incluidos: 0,
          probabilidad_aceptacion: 0.76,
          score_ranking: 0.76,
          beneficios: [
            "Descuento del 30% en factura mensual durante 6 meses",
            "Upgrade a 200 Mbps sin costo de instalación",
            "Prioridad técnica VIP y revisión preventiva de router"
          ],
          drivers_xai: [
            { driver: "Fricción por 4 Reclamos Previos", peso: -0.45, detalle: "Intermitencias reportadas el último trimestre", tipo: "alerta" },
            { driver: "Días de Mora Acumulada", peso: -0.28, detalle: "Sensibilidad al precio y ciclo de cobro", tipo: "alerta" }
          ],
          vista_asesor: {
            beneficio_principal: "Ahorro estimado de 30% por fidelización.",
            speech: {
              texto: "Estimado Carlos, entendemos sus observaciones previas. Como muestra de compromiso, podemos aplicarle un descuento del 30% y duplicar su velocidad.",
              tipo: "PLANTILLA_PARAMETRIZADA"
            }
          },
          quick_replies: [
            "Aplicar 30% de descuento directo por 6 meses para blindaje",
            "Ofrecer duplicar velocidad a 200 Mbps sin costo",
            "Agendar visita técnica de mantenimiento preventivo VIP"
          ]
        }
      ]
    },
    ofertas_nbo: [
      {
        rank: 1,
        oferta_id: "RET-RETENCION-30PCT",
        nombre_oferta: "Bono Fidelidad: 30% Descuento + Duplica Velocidad",
        tipo_oferta: "Retención / Blindaje",
        precio_regular: 89.90,
        precio_promocional: 62.90,
        precio_mensual: 62.90,
        ahorro_pct: 30,
        probabilidad_aceptacion: 0.76,
        prob_aceptacion: 0.76,
        beneficios: [
          "Descuento del 30% en factura mensual durante 6 meses",
          "Upgrade a 200 Mbps sin costo de instalación",
          "Prioridad técnica VIP y revisión preventiva de router"
        ],
        drivers_xai: [
          { driver: "Fricción por 4 Reclamos Previos", peso: -0.45, detalle: "Intermitencias reportadas el último trimestre", tipo: "alerta" },
          { driver: "Días de Mora Acumulada", peso: -0.28, detalle: "Sensibilidad al precio y ciclo de cobro", tipo: "alerta" }
        ],
        speech_asesor: "Señor Carlos, entiendo perfectamente la molestia por las incidencias pasadas y le pido sinceras disculpas. Como solución inmediata y muestra de compromiso, el sistema me autoriza aplicar un descuento del 30% en sus recibos y duplicar su velocidad hoy mismo.",
        quick_replies: [
          "Aplicar 30% de descuento directo por 6 meses para blindaje",
          "Ofrecer duplicar velocidad a 200 Mbps sin costo",
          "Agendar visita técnica de mantenimiento preventivo VIP"
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
          oferta_id: "UPG-FIBRA-1GBPS",
          nombre_oferta: "Upgrade Negocios: Fibra 1 Gbps + Seguridad Cloud",
          tipo_oferta: "Upsell / Premium",
          oferta_es_mt: true,
          precio_mensual: 249.90,
          precio_promocional: 249.90,
          precio_regular: 289.90,
          ahorro_pct: 15,
          gb_incluidos: 9999,
          probabilidad_aceptacion: 0.89,
          score_ranking: 0.89,
          beneficios: [
            "Salto de 300 Mbps a 1000 Mbps Simétricos",
            "Router WiFi 6 de última generación gratis",
            "Suite de Seguridad Cloud Negocios 3 licencias"
          ],
          drivers_xai: [
            { driver: "Alto Consumo Corporativo", peso: 0.42, detalle: "Tráfico de subida y videoconferencias continuo", tipo: "positivo" },
            { driver: "Fidelidad Histórica (>4 años)", peso: 0.35, detalle: "Cliente top tier con máxima valoración", tipo: "positivo" }
          ],
          vista_asesor: {
            beneficio_principal: "Velocidad simétrica de 1000 Mbps para empresas.",
            speech: {
              texto: "Estimada Elena, gracias a su excelente trayectoria con nosotros, queremos potenciar su negocio con 1 Gbps simétrico.",
              tipo: "PLANTILLA_PARAMETRIZADA"
            }
          },
          quick_replies: [
            "Ofrecer salto a 1 Gbps con Router WiFi 6 incluido",
            "Resaltar soporte técnico prioritario para empresas",
            "Enviar propuesta formal a su correo con 1 solo clic"
          ]
        }
      ]
    },
    ofertas_nbo: [
      {
        rank: 1,
        oferta_id: "UPG-FIBRA-1GBPS",
        nombre_oferta: "Upgrade Negocios: Fibra 1 Gbps + Seguridad Cloud",
        tipo_oferta: "Upsell / Premium",
        precio_regular: 289.90,
        precio_promocional: 249.90,
        precio_mensual: 249.90,
        ahorro_pct: 15,
        probabilidad_aceptacion: 0.89,
        prob_aceptacion: 0.89,
        beneficios: [
          "Salto de 300 Mbps a 1000 Mbps Simétricos",
          "Router WiFi 6 de última generación gratis",
          "Suite de Seguridad Cloud Negocios 3 licencias"
        ],
        drivers_xai: [
          { driver: "Alto Consumo Corporativo", peso: 0.42, detalle: "Tráfico de subida y videoconferencias continuo", tipo: "positivo" },
          { driver: "Fidelidad Histórica (>4 años)", peso: 0.35, detalle: "Cliente top tier con máxima valoración", tipo: "positivo" }
        ],
        speech_asesor: "Estimada Sra. Elena, gracias a su excelente trayectoria con nosotros, queremos potenciar su negocio: habilitamos la nueva velocidad de 1 Giga Simétrico con WiFi 6 por una diferencia mínima de S/ 30 al mes.",
        quick_replies: [
          "Ofrecer salto a 1 Gbps con Router WiFi 6 incluido",
          "Resaltar soporte técnico prioritario para empresas",
          "Enviar propuesta formal a su correo con 1 solo clic"
        ]
      }
    ]
  }
];

export const CATALOGO_OFERTAS = [
  {
    id: "MT-DUO-PRO-200",
    categoria: "Movistar Total",
    nombre: "Movistar Total Dúo Pro 200 Mbps",
    velocidad: "200 Mbps",
    gigas: "Ilimitado 5G",
    precio_regular: 169.90,
    precio_promo: 119.90,
    destacado: true,
    etiqueta: "Top Conversión"
  },
  {
    id: "MT-TRIO-FIBRA-500",
    categoria: "Movistar Total",
    nombre: "Movistar Total Trío Fibra 500 Mbps + TV",
    velocidad: "500 Mbps",
    gigas: "Ilimitado 5G + 2 Líneas",
    precio_regular: 239.90,
    precio_promo: 189.90,
    destacado: false,
    etiqueta: "Alta Gama"
  },
  {
    id: "UPG-PLAN-69",
    categoria: "Móvil Postpago",
    nombre: "Plan Ilimitado Plus 69.90",
    velocidad: "N/A",
    gigas: "Ilimitado 5G",
    precio_regular: 69.90,
    precio_promo: 49.90,
    destacado: false,
    etiqueta: "Upgrade Directo"
  },
  {
    id: "RET-RETENCION-30PCT",
    categoria: "Blindaje / Retención",
    nombre: "Bono Fidelidad 30% OFF + 200 Mbps",
    velocidad: "200 Mbps",
    gigas: "N/A",
    precio_regular: 89.90,
    precio_promo: 62.90,
    destacado: true,
    etiqueta: "Escudo Anti-Churn"
  }
];
