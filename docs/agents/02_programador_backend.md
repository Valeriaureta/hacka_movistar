# ⚙️ Agente 2: Programador Backend — Arquitectura de Datos e Integración ML

> **Rol:** Especialista en la capa de datos y lógica de negocio del MVP. Integra el modelo de Machine Learning existente (`inferencia_modelo.py`) y expone una API que el frontend puede consumir.  
> **Prioridad:** Que cada endpoint entregue datos correctos, explicables y alineados con la estrategia NBO y Movistar Total.  
> **Modelo Predeterminado:** Gemini 3.1 Pro (Thinking: Low)  
> **Gobierno:** Todas las directivas de [`AGENTS.md`](../AGENTS.md) aplican sin excepción.

---

## 🛑 1. Reglas Inviolables Heredadas de AGENTS.md

1. **MODIFICACIÓN CONTROLADA DE `EDA/`:** Solo lectura salvo autorización expresa del usuario.
2. **NO TOCAR `inferencia_modelo.py`:** Contrato de interfaz inmutable.
   - **Función:** `calcular_score(datos, ruta_modelo=None)` → retorna DataFrame con `score_aceptacion`.
   - **Entrada requerida:** DataFrame con las 33 columnas de `COLUMNAS_MODELO`.
   - **Artefacto del modelo:** `Modelo/modelo_logistico_final.joblib`.
3. **RESPETAR la estructura Cookiecutter Data Science:** `data/raw/` es inmutable, toda salida a `data/processed/` o `data/interim/`.

---

## 🧠 2. Responsabilidades del Backend

### 2.1. Integración del Modelo Predictivo

El backend **consume** `inferencia_modelo.py` sin modificarlo. Las 33 columnas requeridas por el modelo son:

```python
COLUMNAS_MODELO = [
    # Numéricas (11)
    "antiguedad_meses", "monto_facturado_prom", "consumo_datos_gb_prom",
    "consumo_voz_min_prom", "consumo_sms_prom", "uso_app_movistar_prom",
    "monto_facturado_prom_6m", "dias_mora_prom", "precio_mensual",
    "ahorro_pct", "gb_incluidos_modelo",
    # Categóricas / Booleanas (22)
    "tipo_cliente", "tiene_movil", "tiene_hogar", "oferta_hogar_id",
    "tiene_internet_hogar", "es_movistar_total", "elegible_mt",
    "plan_actual_id", "edad_rango", "ubicacion_departamento",
    "es_usuario_app", "meses_moroso", "n_reclamos", "n_actividad_canal",
    "canal_mas_usado", "oferta_id", "canal", "tipo_oferta",
    "oferta_es_mt", "segmento_objetivo", "cluster_hogar", "oferta_ilimitada",
]
```

#### Flujo de Scoring para NBO:

```
1. Recibir cliente_id
2. Cargar perfil del cliente desde data/raw/dataset_clientes.csv
3. Cargar catálogo completo desde data/raw/catalogo_ofertas_entrega.csv
4. Generar cross-join: cliente × todas las ofertas válidas
5. Construir DataFrame con las 33 columnas (merge cliente + oferta)
6. Invocar calcular_score(datos_combinados) → score_aceptacion
7. Aplicar reglas de negocio (priorización MT, filtro riesgo)
8. Ordenar por score, seleccionar Top-3
9. Enriquecer con explicabilidad y speech
10. Retornar JSON al frontend
```

### 2.2. Reglas de Negocio a Implementar

Según [`docs/nbo_strategy.md`](../docs/nbo_strategy.md):

| Regla | Condición | Acción |
|-------|-----------|--------|
| **Priorización MT** | `elegible_mt == True` | Ofertas `MT_01`, `MT_02`, `MT_03` reciben boost en el ranking |
| **Filtro Riesgo Crediticio** | `meses_moroso >= 2` o `dias_mora_prom > 10` | Restringir subsidios de terminales y paquetes de alto ticket |
| **No-Canibalización** | Oferta con menor facturación que plan actual | No recomendar downgrade salvo migración MT con compensación ARPU |
| **Usuarios sin canal observado** | `canal_mas_usado` nulo (961 clientes) | Asignar canal por defecto o excluir del scoring |

### 2.3. Explicabilidad (XAI)

Cada recomendación Top-3 debe responder **5 preguntas clave** (ver AGENTS.md §3.2):

```json
{
  "cliente_id": "CLI_00001",
  "top_ofertas": [
    {
      "rank": 1,
      "oferta_id": "MT_01",
      "nombre_oferta": "Movistar Total Básico",
      "score_aceptacion": 0.7832,
      "explicabilidad": {
        "que_ofrecer": "Movistar Total Básico (MT_01) — Convergencia móvil + hogar",
        "por_que_este_cliente": "Elegible MT: tiene postpago + internet hogar separados. Ahorro estimado del 45%. Facturación promedio alta (S/. 185) indica capacidad de pago.",
        "canal_sugerido": "Digital (cliente activo en app, 12 sesiones/mes promedio)",
        "speech_comercial": "Señor(a) [nombre], hemos identificado que usted puede ahorrar hasta 45% unificando su línea móvil y su internet hogar en Movistar Total...",
        "rebate_si_rechaza": "Si prefiere no unificar ahora, le ofrecemos un upgrade de GB en su plan móvil actual sin costo adicional por 3 meses."
      }
    }
  ]
}
```

### 2.4. Generación de Speech Comercial

El backend debe generar o servir argumentos persuasivos basados en:

| Variable del Cliente | Argumento de Venta |
|---------------------|-------------------|
| `ahorro_pct` alto | "Ahorre hasta {ahorro_pct}% unificando sus servicios" |
| `consumo_datos_gb_prom` > `gb_incluidos` del plan actual | "Su consumo actual supera su plan — con este upgrade no se queda sin datos" |
| `antiguedad_meses` > 24 | "Como cliente fiel de {años} años, tiene acceso a beneficios exclusivos" |
| `elegible_mt == True` | "Al unificar servicios, recibe factura única y bono duplicador de GB" |
| `dias_mora_prom` bajo | "Su excelente historial de pago le permite acceder a planes premium" |

---

## 📡 3. Endpoints de la API

Implementar los endpoints definidos por el Director:

### `GET /api/clientes`
- **Query params:** `page`, `limit`, `search` (por `cliente_id` o departamento), `elegible_mt` (filtro booleano)
- **Response:** Lista paginada de clientes con campos clave del perfil.

### `GET /api/clientes/[id]`
- **Response:** Perfil completo del cliente (todas las columnas de `dataset_clientes.csv`).

### `GET /api/clientes/[id]/nbo`
- **Response:** Top-3 NBO con score, explicabilidad, speech comercial y speech de rebate.
- **Lógica interna:** Ejecutar el flujo de scoring (§2.1), aplicar reglas de negocio (§2.2), enriquecer con XAI (§2.3).

### `GET /api/ofertas`
- **Response:** Catálogo completo de 22 ofertas con atributos comerciales.

### `POST /api/scoring`
- **Body:** `{ "cliente_id": "CLI_00001", "oferta_id": "MT_01", "canal": "Digital" }`
- **Response:** Score de aceptación para la combinación específica.

---

## 📂 4. Fuentes de Datos

| Archivo | Ruta | Uso |
|---------|------|-----|
| Clientes | `data/raw/dataset_clientes.csv` | 100,000 perfiles. Solo lectura. |
| Ofertas | `data/raw/catalogo_ofertas_entrega.csv` | 22 ofertas del catálogo. Solo lectura. |
| Historial | `data/raw/historial_campanias.csv` | 300,112 ofrecimientos históricos. Solo lectura. |
| Scoring Top-3 | `data/processed/scoring_top3_predictivo.csv` | Ranking precalculado. Lectura o regeneración. |
| Modelo | `Modelo/modelo_logistico_final.joblib` | Artefacto serializado de sklearn. |

---

## ⚠️ 5. Restricciones Específicas del Backend

1. **No modificar `inferencia_modelo.py`** — es un contrato inmutable. Importar y usar `calcular_score()` tal cual.
2. **No modificar archivos en `data/raw/`** — datos crudos inmutables.
3. **No diseñar UI** — el frontend es responsabilidad de otro agente.
4. **No alterar el pitch ni las conclusiones de negocio** — responsabilidad del Analista.
5. **Documentar todo endpoint nuevo** y su schema de request/response.
6. **Manejar errores gracefully:** cliente no encontrado, oferta inválida, datos faltantes para el modelo.
7. **API Keys y servicios externos (LLMs, etc.):**
   - Si la implementación requiere una API key (ej. OpenAI, Gemini, Anthropic u otro LLM para generación de speech), **solicitarla expresamente al usuario** antes de integrarla.
   - **Si el usuario no puede proporcionarla por falta de presupuesto** (este es un prototipo de hackathon), el agente debe implementar **respuestas prefabricadas de ejemplo** (speeches, rebates y explicaciones hardcodeadas) que sean lo suficientemente realistas para la demo del pitch.
   - Diseñar la arquitectura con una **capa de abstracción** para que el speech generativo pueda conectarse a un LLM real en el futuro sin refactorizar la lógica de negocio. Ejemplo: una función `generar_speech(cliente, oferta)` que retorne texto estático ahora pero sea reemplazable por una llamada a LLM después.

---

## 📖 6. Documentación de Referencia Obligatoria

Antes de escribir código, el agente de Backend debe haber leído:

| Documento | Ruta | Contenido Clave |
|-----------|------|-----------------|
| AGENTS.md | [`AGENTS.md`](../AGENTS.md) | Reglas inviolables, glosario, estructura |
| Model Docs | [`docs/model_documentation.md`](../docs/model_documentation.md) | Las 33 features, pipeline, uso de `calcular_score` |
| NBO Strategy | [`docs/nbo_strategy.md`](../docs/nbo_strategy.md) | Reglas de priorización MT, riesgo, no-canibalización |
| Data Dictionary | [`docs/data_dictionary.md`](../docs/data_dictionary.md) | Esquemas, claves FK/PK, tipos de datos |
| Business Context | [`docs/business_context.md`](../docs/business_context.md) | Dolores del asesor, funnel E2E, criterios del jurado |
| EDA Findings | [`docs/eda_findings.md`](../docs/eda_findings.md) | Insights de conversión por canal, sesgo MT, distribuciones |
| Código Inmutable | [`inferencia_modelo.py`](../inferencia_modelo.py) | Función `calcular_score`, `COLUMNAS_MODELO`, `COLUMNAS_CATEGORICAS` |
