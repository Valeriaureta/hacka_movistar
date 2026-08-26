# 🚀 Guía de Trabajo — Desafío: Personalización Comercial Inteligente
### Hackatón "AI Telecom Challenge" · Movistar + Universidad de Lima

> **Uso de esta guía:** Es un documento vivo. Cada vez que iteremos con IA, agregaremos mejoras, decisiones tomadas y aprendizajes en la sección correspondiente al final.

---

## 1. ¿Qué pide el desafío?

Diseñar una solución de IA que recomiende **la mejor oferta comercial para cada cliente** (Next Best Offer — NBO), considerando:

- Su perfil y comportamiento de consumo
- Su historial comercial
- El canal por el que es más propenso a comprar
- El momento y mensaje más adecuado
- La probabilidad de que acepte la oferta
- Los motivos por los que podría rechazarla (y cómo rebatirlos)
- Un seguimiento de punta a punta (E2E) del proceso de venta

### Caso de uso prioritario: **Movistar Total (MT)**
MT es el producto "blindaje" de Movistar. Combina servicios móvil + hogar con hasta 50% de ahorro vs. compra por separado. La meta: que más del **50% de venta hogar** y más del **10% de venta móvil** sean con MT.

---

## 2. El problema central

| Situación actual | Consecuencia |
|---|---|
| Recomendaciones basadas en reglas generales o criterios manuales | Baja personalización y baja conversión |
| Campañas masivas sin segmentación individual | Ofertas que no responden a necesidades reales |
| MT no es la primera opción del asesor | Crecimiento debajo de la meta |
| Planta de +50 años poco digital | Dificulta digitalizar el flujo de oferta |
| Sin reportes unificados del proceso de venta | No se puede trazar el ofrecimiento E2E |
| Asesores con información fragmentada | Experiencia de atención deficiente |

---

## 3. Lo que debe mostrar la solución (mínimo exigido)

```
┌─────────────────────────────────────────────────────┐
│  Para el cliente X:                                  │
│  ① Perfil resumido del cliente                       │
│  ② Oferta recomendada                                │
│  ③ Motivo de la recomendación (explicabilidad)       │
│  ④ Probabilidad estimada de aceptación               │
│  ⑤ Canal y momento sugerido para presentar la oferta │
│  ⑥ Beneficio esperado para cliente y negocio         │
└─────────────────────────────────────────────────────┘
```

**Ideal adicional:** Reporte de funnel E2E que trace:
`Clasificación del cliente → Contacto → Mensaje → Contactabilidad → Medio probatorio → Resultado de venta`

---

## 4. Tipos de propuestas valoradas

### 4.1 Modelos de IA
- [ ] Motor de recomendación / sistema de scoring de ofertas
- [ ] Machine learning supervisado para predicción de aceptación
- [ ] Clustering / segmentación inteligente de clientes
- [ ] Predicción de churn
- [ ] IA generativa para generar argumentos comerciales, mensajes y speech de rebate personalizados
- [ ] Explicabilidad de recomendaciones (XAI)

### 4.2 Interfaces y herramientas
- [ ] Asistente virtual para asesores comerciales
- [ ] Dashboard con reporte de funnel del ofrecimiento
- [ ] Prototipo funcional o mockup del motor NBO
- [ ] Simulador de Next Best Offer

### 4.3 Enfoque de negocio
- [ ] Recomendación de canal y momento óptimo
- [ ] Speech de rebate personalizado cuando el cliente rechaza
- [ ] Aplicación al caso MT: flujo digital mejorado para atraer clientes digitales
- [ ] Solución generalizable a otras ofertas del portafolio (no solo MT)

---

## 5. Datos disponibles

### Datos que proveerá Movistar (simulados/anonimizados)

| Categoría | Variables |
|---|---|
| Perfil y relación comercial | Tipo de cliente, antigüedad, plan actual, monto facturado, equipos, ubicación geográfica aproximada |
| Comportamiento y consumo | Consumo de datos, voz y servicios; plan, producto, oferta sugerida previa |
| Historial | Pagos, reclamos, compras, renovaciones, campañas recibidas, ofertas aceptadas/rechazadas, probabilidad de churn |
| Actividad por canal | Ventas por canal, visitas, llamadas, adquisición de App |

### Catálogo ficticio incluirá
- Portafolio de ofertas (incluyendo Movistar Total)
- Escenarios de atención simulados
- Perfiles de clientes tipo

---

## 6. KPIs que debe impactar la solución

| Indicador | Descripción |
|---|---|
| **Tasa de conversión** | % de ofertas aceptadas sobre ofertas presentadas |
| **Participación MT** | % de venta hogar y móvil con MT |
| **ARPU** | Ingreso promedio por usuario |
| **Churn** | Reducción de bajas y mejora de permanencia |
| **NPS** | Satisfacción del cliente |
| **Efectividad de campaña** | Mejora en tasas de respuesta |

---

## 7. Usuarios del sistema

```
┌──────────────────┐    ┌──────────────────────────────────────────┐
│     CLIENTE      │    │           USUARIOS INTERNOS              │
│                  │    │                                          │
│ Recibe ofertas   │    │  • Asesores de tienda, call center       │
│ personalizadas   │    │  • Agentes Call Out y Call In            │
│ vía App o Web    │    │  • Canales digitales (App, Web, WhatsApp)│
│                  │    │  • Equipos de Producto y Marketing       │
└──────────────────┘    └──────────────────────────────────────────┘
```

---

## 8. Criterios de evaluación implícitos

> Extraídos de la ficha. Úsalos como checklist antes de presentar.

- **No es solo accuracy:** El algoritmo debe resolver el problema real, no solo tener métricas altas en el dataset.
- **Variables ingeniosas:** Se valora combinar datos de forma creativa para generar features útiles.
- **Interfaz simple e intuitiva:** El asesor está bajo presión de tiempo; la UI debe ser clara y rápida.
- **Generalizable:** El motor NBO debe poder usarse más allá de MT, para todo el portafolio.
- **Explicable:** La solución debe justificar por qué sugiere cada oferta.
- **Ético y responsable:** Uso adecuado de datos, sin vulnerar privacidad.
- **Escalable:** Aplicable al contexto real de una telco con miles de clientes diarios.

---

## 9. Arquitectura sugerida de la solución

```
┌─────────────────────────────────────────────────────────────┐
│                    MOTOR NBO (Next Best Offer)               │
│                                                             │
│  ┌──────────────┐    ┌───────────────┐    ┌─────────────┐  │
│  │  Ingesta de  │───▶│  Scoring &    │───▶│ Recomendaci │  │
│  │  datos       │    │  Segmentación │    │ ón + Rebate │  │
│  │  (perfil,    │    │  (ML, reglas) │    │ (Gen AI)    │  │
│  │  historial,  │    │               │    │             │  │
│  │  consumo)    │    └───────────────┘    └─────────────┘  │
│  └──────────────┘                                │          │
│                                                  ▼          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              INTERFAZ / SALIDAS                      │   │
│  │  • Asistente para asesor    • Dashboard funnel E2E  │   │
│  │  • Canal y momento óptimo   • Reportes de impacto   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Stack tecnológico recomendado (punto de partida)

| Capa | Opciones |
|---|---|
| Procesamiento de datos | Python (pandas, numpy) |
| Modelos ML | scikit-learn, XGBoost, LightGBM |
| Explicabilidad | SHAP, LIME |
| IA Generativa (speech/rebate) | OpenAI API, Gemini, Claude API |
| Frontend / Dashboard | Streamlit, React, Gradio |
| Visualización | Plotly, Seaborn |

---

## 11. Flujo del funnel E2E (a implementar)

```
1. CLASIFICACIÓN    → Segmentar y priorizar clientes candidatos a MT u oferta X
        ↓
2. CONTACTO         → Canal recomendado + momento óptimo
        ↓
3. MENSAJE          → Speech personalizado generado por IA
        ↓
4. CONTACTABILIDAD  → ¿Se logró contactar al cliente?
        ↓
5. REBATE           → Si rechaza: motivo detectado + contraargumento generado
        ↓
6. RESULTADO        → Venta / No venta + registro probatorio
```

---

## 12. 🔄 Log de iteraciones con IA

> Esta sección se actualiza en cada sesión de trabajo. Documenta decisiones, mejoras y aprendizajes.

---

### Iteración 1 — [Fecha: pendiente]
**Foco:** Lectura del desafío y estructuración de la guía base  
**Decisiones tomadas:** Ninguna todavía  
**Próximos pasos:**
- [ ] Explorar el dataset simulado cuando esté disponible
- [ ] Definir arquitectura del modelo de scoring
- [ ] Decidir stack tecnológico final del equipo
- [ ] Diseñar wireframe del asistente para asesor
- [ ] Definir cómo mostrar explicabilidad de forma visual

---

> 💡 **Tip de trabajo:** En cada sesión de IA, describe qué intentaste, qué funcionó y qué cambió. Esto permite que la IA retome el contexto exacto en la próxima iteración sin partir de cero.
