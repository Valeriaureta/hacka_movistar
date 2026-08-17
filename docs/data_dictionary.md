# 📖 Diccionario de Datos — Desafío 02: Personalización Comercial Inteligente (NBO + Movistar Total)

Este documento detalla el esquema, tipos de datos, relaciones y descripciones de todos los conjuntos de datos del proyecto, estructurados bajo el estándar **Cookiecutter Data Science**.

---

## 🗂️ Estructura de Datos (`data/`)

```
data/
├── external/          # Datos de fuentes externas o de terceros.
├── interim/           # Datos intermedios transformados durante limpieza/feature engineering.
├── processed/         # Datasets finales canónicos listos para modelado e inferencia.
│   └── scoring_top3_predictivo.csv
└── raw/               # Datos crudos e inmutables entregados para el desafío.
    ├── catalogo_ofertas_entrega.csv
    ├── dataset_clientes.csv
    └── historial_campanias.csv
```

---

## 1. `data/raw/dataset_clientes.csv`
- **Volumen:** 100,000 registros (1 fila por cliente).
- **Descripción:** Perfil demográfico, contractual y resumen de comportamiento de los clientes en los últimos 6 meses (Enero - Junio 2026).

| Campo | Tipo | Clave | Descripción |
| :--- | :--- | :--- | :--- |
| `cliente_id` | String | **PK** | Identificador único del cliente. |
| `tipo_cliente` | String (Cat) | | Tipo de suscripción móvil (`prepago` / `postpago`). Nulo si no tiene móvil. |
| `antiguedad_meses` | Integer | | Antigüedad del cliente con la operadora en meses. |
| `tiene_movil` | Boolean | | `True` si el cliente tiene al menos una línea móvil activa. |
| `tiene_hogar` | Boolean | | `True` si cuenta con algún servicio hogar (Internet, TV o Telefonía fija). |
| `oferta_hogar_id` | String | **FK** | ID del paquete hogar actual (apunta a `catalogo_ofertas_entrega.oferta_id`). Nulo si `tiene_hogar = False`. |
| `tiene_internet_hogar` | Boolean | | `True` si el paquete hogar contratado incluye banda ancha fija. |
| `es_movistar_total` | Boolean | | `True` si el cliente ya tiene contratado el paquete convergente Movistar Total (MT). |
| `elegible_mt` | Boolean | | `True` si cumple los requisitos para MT (móvil + internet hogar + postpago) pero aún no lo contrata (Target prioritario). |
| `plan_actual_id` | String | **FK** | ID del plan/producto principal del cliente. |
| `monto_facturado_prom` | Float | | Monto mensual facturado promedio actual (en PEN / Soles). |
| `monto_facturado_prom_6m` | Float | | Promedio de facturación mensual histórica en los últimos 6 meses. |
| `edad_rango` | String (Cat) | | Rango de edad (`18-25`, `26-35`, `36-45`, `46-55`, `56-65`, `65+`). |
| `ubicacion_departamento` | String (Cat) | | Departamento del Perú de residencia del cliente. |
| `es_usuario_app` | Boolean | | `True` si ha iniciado sesión en la app Movistar en los últimos 3 meses. |
| `consumo_datos_gb_prom` | Float | | Promedio mensual de datos consumidos en Gigabytes (GB). |
| `consumo_voz_min_prom` | Float | | Promedio mensual de minutos de voz consumidos. |
| `consumo_sms_prom` | Float | | Promedio mensual de mensajes SMS enviados. |
| `uso_app_movistar_prom` | Float | | Promedio mensual de sesiones activas en la app Movistar. |
| `dias_mora_prom` | Float | | Promedio mensual de días de retraso en el pago de facturas. |
| `meses_moroso` | Integer | | Cantidad de meses (de 6) con mora > 15 días. |
| `n_reclamos` | Integer | | Total de reclamos registrados en el periodo de 6 meses. |
| `n_actividad_canal` | Integer | | Total de interacciones (visitas a tienda, llamadas, app, etc.). |
| `canal_mas_usado` | String (Cat) | | Canal predominante de interacción (`Tienda`, `Call In`, `Call Out`, `Digital`). |

---

## 2. `data/raw/catalogo_ofertas_entrega.csv`
- **Volumen:** 22 registros (1 fila por oferta).
- **Descripción:** Catálogo de productos y paquetes disponibles para recomendación comercial.

| Campo | Tipo | Clave | Descripción |
| :--- | :--- | :--- | :--- |
| `oferta_id` | String | **PK** | Identificador único de la oferta (ej. `MOV_POS_01`, `MT_01`, `HOG_DUO_02`). |
| `nombre_oferta` | String | | Nombre comercial del producto o plan. |
| `tipo_oferta` | String (Cat) | | Categoría: `plan_movil`, `plan_hogar`, `upgrade`, `equipo`, `paquete_adicional`, `movistar_total`. |
| `segmento_objetivo` | String (Cat) | | Segmento al que se dirige: `movil`, `hogar`, `ambos`. |
| `es_movistar_total` | Boolean | | `True` si corresponde a una de las variantes convergentes de Movistar Total. |
| `precio_mensual` | Float | | Tarifa mensual regular en PEN (Soles). |
| `ahorro_pct` | Integer | | Porcentaje de ahorro estimado vs. compra desacoplada (destacado en Movistar Total). |
| `gb_incluidos` | Integer | | Cuota mensual de datos en GB (`9999` representa navegación ilimitada). |
| `cluster_hogar` | String (Cat) | | Tipo de paquete para hogar: `mono` (1 servicio), `duo` (2 servicios), `trio` (3 servicios). |
| `descripcion_bundle` | String | | Servicios incluidos en el bundle (ej. "Internet + TV"). |
| `descripcion_corta` | String | | Resumen textual generado para comunicación al cliente. |

---

## 3. `data/raw/historial_campanias.csv`
- **Volumen:** 300,112 registros (1 fila por ofrecimiento realizado).
- **Descripción:** Registro histórico de ofrecimientos comerciales realizados a clientes y sus resultados. Tabla base para entrenamiento supervisado de propensión/conversión.

| Campo | Tipo | Clave | Descripción |
| :--- | :--- | :--- | :--- |
| `ofrecimiento_id` | String | **PK** | Identificador único del evento de campaña. |
| `cliente_id` | String | **FK** | Cliente receptor del ofrecimiento (apunta a `dataset_clientes.cliente_id`). |
| `oferta_id` | String | **FK** | Oferta presentada (apunta a `catalogo_ofertas_entrega.oferta_id`). |
| `fecha` | Date | | Fecha en la que se realizó la comunicación comercial. |
| `canal` | String (Cat) | | Canal utilizado (`Tienda`, `Call In`, `Call Out`, `Digital`). |
| `acepto` | Boolean / Int | **Target** | Resultado del ofrecimiento: `1` (Aceptó la oferta) / `0` (Rechazó la oferta). |

---

## 4. `data/processed/scoring_top3_predictivo.csv`
- **Volumen:** 100,000 registros (1 fila por cliente evaluado).
- **Descripción:** Salida final de la solución predictiva que contiene el ranking **Top-3 de ofertas recomendadas** (Next Best Offer) para cada cliente, con sus respectivas probabilidades estimadas de aceptación (`score`), canal óptimo y estrategia de rebate.
