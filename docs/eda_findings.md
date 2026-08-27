# 📊 Hallazgos del Análisis Exploratorio de Datos (EDA)

Este documento resume los principales descubrimientos derivados de los análisis exploratorios realizados en la suite de notebooks (`EDA/`):
- `EDA_clientes.ipynb`
- `EDA_catalogo_ofertas.ipynb`
- `EDA_campañas.ipynb`
- `EDA_integrado_target.ipynb`

---

## 1. Perfil y Distribución de Clientes (`EDA_clientes.ipynb`)

- **Universo de Clientes:** 100,000 clientes analizados en el periodo Enero - Junio 2026.
- **Segmentación por Servicio:**
  - Gran penetración de líneas móviles con división marcada entre clientes **Prepago** y **Postpago**.
  - Clientes con servicios de Hogar presentan mayor ticket promedio y menor tasa de rotación (churn / mora).
- **Consumo Digital y App Movistar:**
  - Existe una correlación positiva entre el uso frecuente de la app (`es_usuario_app = True` y alto `uso_app_movistar_prom`) y una mayor receptividad a canales digitales.
- **Riesgo y Comportamiento Financiero:**
  - Las variables `dias_mora_prom` y `meses_moroso` son predictores críticos. Clientes con alta morosidad presentan tasas de rechazo sustancialmente mayores o restricciones de política crediticia para planes premium o financiamiento de equipos.

---

## 2. Portafolio de Ofertas (`EDA_catalogo_ofertas.ipynb`)

- **Estructura del Catálogo (22 ofertas):**
  - **Planes Móviles y Upgrades:** Opciones escalonadas en cuotas de GB y minutos con beneficios diferenciados.
  - **Servicios Hogar:** Ofertas clasificadas en clusters (`mono`, `duo`, `trio`).
  - **Movistar Total (MT):** Ofertas convergentes de alto valor que unifican móvil y fibra/hogar con ahorros publicitados de hasta 50% vs. servicios individuales.
- **Elasticidad y Rango de Precios:**
  - El precio mensual varía entre ofertas de entrada y paquetes convergentes completos (`MT_01`, `MT_02`, `MT_03`).

---

## 3. Dinámica de Campañas y Canales (`EDA_campañas.ipynb`)

- **Historial de Conversión (300,112 contactos):**
  - La tasa de aceptación global es desbalanceada (~10-15% promedio de conversión), lo que requiere calibración probabilística en el modelo.
- **Efectividad por Canal:**
  - **Digital:** Mayor volumen y menor costo por contacto, con excelente conversión en clientes jóvenes y usuarios activos de la app.
  - **Tienda / Call In:** Mayor tasa de conversión en clientes que buscan upgrades o resolución de necesidades específicas.
  - **Call Out:** Efectivo pero con fatiga de contacto si la oferta no es afín a las necesidades del cliente.

---

## 4. Análisis Integrado y Elegibilidad Movistar Total (`EDA_integrado_target.ipynb`)

- **Segmento Elegible a Movistar Total (`elegible_mt`):**
  - Clientes que cuentan con línea móvil postpago y servicio de internet hogar por separado.
  - Este segmento representa la mayor oportunidad comercial (upselling y fidelización), mostrando una propensión significativamente más alta a aceptar bundles convergentes cuando se presenta el ahorro económico explícito.
- **Interacciones Clave:**
  - La combinación de `monto_facturado_prom`, `ahorro_pct`, `antiguedad_meses` y canal de interacción son los factores con mayor poder discriminante en el modelado predictivo.
