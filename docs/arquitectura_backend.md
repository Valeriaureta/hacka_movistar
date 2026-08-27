# ⚙️ Arquitectura del Backend — Movi Nexo API

> API FastAPI que expone el motor NBO, la bitácora comercial E2E y el análisis
> post-hoc de llamadas con LLM. Todo el código vive en `backend/`.

---

## 1. Estructura

```text
backend/
├── main.py                     # App FastAPI, CORS, endpoints núcleo
├── nbo_router.py               # DataLoader + NBORouter (orquestación del motor)
├── dashboard_router.py         # /api/gestion — bitácora E2E en CSV
├── speech_router.py            # /api/speech — STT y análisis post-hoc con LLM
├── inferencia_modelo.py        # Contrato inmutable del modelo (calcular_score)
├── inferencia.py               # Utilidades de inferencia
├── Modelo/
│   └── modelo_propension_v2_candidato.joblib
├── Motor/
│   ├── motor_oficial.py        # Orquestación del NBO (862 líneas)
│   └── motor_reglas_negocio.py # Reglas puras y auditables (348 líneas)
└── Legacy_AI/
    ├── ai_service.py           # Cascada de LLM: Gemini → Ollama → None
    └── ai_router.py            # Endpoints generativos (router no montado)
```

El detalle de `Motor/`, `Modelo/` e `inferencia_modelo.py` está en
`arquitectura_motor_modelo.md`. Este documento cubre la capa de servicio.

### Arranque

```bash
backend\run_backend.bat                                   # con --reload, puerto 8000
python -m uvicorn main:app --host 127.0.0.1 --port 8000   # equivalente manual
```

Los imports usan el patrón `try: from .x / except ImportError: from x`, así que
la app funciona tanto ejecutada desde la raíz (`backend.main:app`) como desde
dentro de `backend/` (`main:app`).

---

## 2. Composición de la app

```python
app.include_router(dashboard_router)   # /api/gestion
app.include_router(speech_router)      # /api/speech
app.add_middleware(CORSMiddleware, allow_origins=["*"], ...)
router_nbo = NBORouter()               # instancia única en memoria
loader = DataLoader.get_instance()     # singleton de datos
```

Los endpoints de NBO están declarados **directamente en `main.py`**, no en un
router aparte. `dashboard_router` y `speech_router` sí son `APIRouter`.

> **CORS abierto (`allow_origins=["*"]`).** Es aceptable para una demo local
> tras el proxy de Vite; **no lo es para un despliegue expuesto**. Restringir al
> origen real antes de cualquier publicación.

---

## 3. Mapa de endpoints

### Núcleo NBO (`main.py`)

| Método | Ruta | Devuelve |
|---|---|---|
| `GET` | `/` | Estado, versión y `runtime_info()` de los datos |
| `POST` | `/api/auth/login` | Token fijo (login simulado, sin verificación) |
| `GET` | `/api/clientes?limit&canal` | Muestra de clientes **con Top-3 ya calculado** |
| `GET` | `/api/clientes/{query}?canal` | Cliente por ID, coincidencia parcial o índice |
| `GET` | `/api/ofertas` | Catálogo completo (22 ofertas) |
| `GET` | `/api/model/status` | Si el `.joblib` cargó, algoritmo y nº de features |
| `POST` | `/api/recomendaciones/{rec_id}/preferencia-mt` | Recalcula fijando la preferencia MT |
| `POST` | `/api/recomendaciones/evaluar` | Recalcula inyectando señales de contexto |
| `POST` | `/api/eventos` | Telemetría del funnel (lista en memoria) |

### Bitácora E2E (`dashboard_router.py`, prefijo `/api/gestion`)

| Método | Ruta | Devuelve |
|---|---|---|
| `POST` | `/api/gestion/registro` | Añade una fila al CSV de interacciones |
| `GET` | `/api/gestion/dashboard?scope=` | KPIs, funnel, canales y motivos de rechazo (`consolidado` \| `historico` \| `sesion`) |

### Speech Analytics (`speech_router.py`, prefijo `/api/speech`)

| Método | Ruta | Devuelve |
|---|---|---|
| `GET` | `/api/speech/simulaciones` | 4 llamadas demo diarizadas |
| `GET` | `/api/speech/diagnostico-llm` | Ping en vivo a la cascada de LLM |
| `POST` | `/api/speech/precalentar-llm-local` | Carga el modelo local en VRAM |
| `POST` | `/api/speech/analisis-call-in?forzar_llm` | Sentimiento (1-5) + tópico de reclamo |
| `POST` | `/api/speech/analisis-call-out?forzar_llm` | Motivo de rechazo + efectividad del rebate |
| `WS` | `/api/speech/ws-transcription` | Canal de streaming de transcripción |

---

## 4. `DataLoader` — carga de datos

Singleton que se instancia al arrancar. Resuelve la ruta del dataset con una
**cadena de respaldo** de tres niveles:

```python
candidates = [
    os.getenv("NBO_CLIENTES_PATH"),              # 1. ruta explícita
    data/raw/dataset_clientes.csv,               # 2. dataset completo (100.000 filas)
    data/processed/demo/dataset_clientes_demo.csv # 3. muestra versionada
]
```

El primero que exista gana, y `data_mode` queda en `"completo"` o `"demo_real"`.
Si no hay ninguno, **la app no arranca** (`FileNotFoundError` explícito). El
catálogo de ofertas (`catalogo_ofertas_entrega.csv`, 22 filas, 3 de ellas
Movistar Total) se carga siempre desde `data/raw/`.

`runtime_info()` acompaña cada respuesta de recomendación, de modo que en la UI
siempre se puede saber **con qué dataset se calculó** lo que se está viendo.

### `get_cliente()` — búsqueda tolerante

Busca en tres pasos: ID exacto → coincidencia parcial (`contains`) → índice
numérico de fila. Por eso en la demo funciona tanto `CLI000012` como `12`.

### Saneamiento JSON

`_sanear_json()` recorre recursivamente cada estructura convirtiendo tipos de
numpy/pandas a tipos nativos y `NaN`/`Inf` a `null`. Sin esto, `float('nan')`
producido por pandas rompe la serialización de FastAPI. **Todo lo que sale del
loader pasa por aquí.**

---

## 5. `NBORouter` — orquestación

```python
class NBORouter:
    self.sessions = {}   # rec_id → {cliente, canal, contexto, recomendacion}
    self.eventos  = []   # telemetría del funnel
```

### Estado en memoria

Cada recomendación genera un `recomendacion_id` (UUID) y se guarda en
`self.sessions`. Esto permite que `POST /api/recomendaciones/{id}/preferencia-mt`
recalcule el Top-3 **sin que el frontend reenvíe al cliente completo**.

> **Es estado en proceso, no persistente.** Al reiniciar el backend se pierden
> las sesiones y los eventos. Para más de una instancia haría falta Redis o
> equivalente; para la demo es deliberadamente simple.

### `contexto_demo(canal)` — las señales que el motor no infiere

El motor de reglas **no deduce** reclamos, averías ni consentimiento desde los
CSV: exige que el backend se los entregue. Este método construye el contexto
por defecto de la demo:

```python
{
  "escenario_simulado": True,     # marca las reglas como SIMULADA_MVP
  "consentimiento_comercial": True if canal == "call out" else None,
  "bloqueo_presion_activo": False,
  "reclamo_activo": False,
  "averia_activa": False,
  "incidencia_en_interaccion": False,
}
```

`escenario_simulado=True` hace que cada decisión del motor se etiquete como
`SIMULADA_MVP` en lugar de `APLICADA_CON_DATO_EXTERNO`, dejando explícito en la
respuesta que esas señales no vienen de sistemas reales de Movistar.

### `enriquecer_clientes()` — inferencia vectorizada

Es la optimización central del backend. En vez de un `predict_proba` por cliente:

```text
para cada cliente → preparar_candidatos()   (reglas, sin modelo)
                  ↓
        candidatos de TODOS los clientes juntos
                  ↓
        puntuar_candidatos()  → UNA sola llamada al modelo
                  ↓
para cada cliente → finalizar_recomendacion()  (Top-3, MT, speech)
```

`GET /api/clientes?limit=20` con 22 ofertas implica ~440 filas cliente-oferta
resueltas en una única inferencia, en lugar de 20 llamadas al `.joblib`.

### `evaluar_oportunidad()` — señales desde la conversación

`POST /api/recomendaciones/evaluar` traduce motivos en texto libre a las señales
booleanas que consume el motor:

```python
tiene_reclamo = any("reclam" in m for m in motivos_lower)
tiene_averia  = any("aver" in m or "técnic" in m or "falla" in m for m in motivos_lower)
ctx["incidencia_en_interaccion"] = tiene_reclamo or tiene_averia
```

Este es el puente entre lo que el asesor marca en pantalla (o lo que detecta el
análisis de la llamada) y el bloqueo anti-presión del motor.

---

## 6. `dashboard_router` — bitácora E2E

Persiste en **CSV plano**, no en base de datos:

```python
INTERACCIONES_PATH = /tmp/interacciones_e2e.csv  if os.getenv("VERCEL")
                     else data/interacciones_e2e.csv
```

`_init_interacciones_file()` se ejecuta **al importar el módulo** y crea el
archivo con 6 gestiones demo si no existe, para que el dashboard nunca aparezca
vacío en una presentación.

Columnas: `id, timestamp, cliente_id, canal, oferta_id, oferta_nombre,
es_movistar_total, estado, motivo_rechazo, precio_oferta, ahorro_pct`.

### Línea base histórica (`dashboard_baseline.py`)

El tablero no vive solo de las gestiones de la sesión: su línea base es el
histórico real de campañas, `data/raw/historial_campanias.csv` (300 112
ofrecimientos, 95 019 clientes, ene–jun 2026).

Ese CSV pesa 47 MB y está en `.gitignore`, así que **no** puede leerse por
request (el dashboard hace polling cada 15 s) ni viajar al bundle de Vercel.
`dashboard_baseline.py` lo precalcula una vez a
`data/processed/dashboard/baseline_historico.json` (~6 KB, versionado e
incluido en `includeFiles`). Regenerar con:

```bash
python -m backend.dashboard_baseline
```

Si el JSON falta pero el CSV crudo está presente, `cargar_baseline()` lo
reconstruye y cachea en memoria. Si no hay ninguno de los dos, el endpoint
degrada a `scope=sesion` y lo reporta en `fuente.historico_disponible`.

### Alcances de `GET /api/gestion/dashboard`

| `scope` | Fuente |
|---|---|
| `historico` | Solo la línea base precalculada del histórico real |
| `sesion` | Solo `interacciones_e2e.csv` (gestiones registradas en vivo) |
| `consolidado` *(default)* | Ambas sumadas por etapa, canal y motivo |

El funnel se sirve en **una sola unidad (ofrecimientos)** y es monotónicamente
decreciente, con las cuatro etapas medidas contra datos reales: evaluados →
contactados (`contactabilidad == contactado`) → aceptadas → MT ganados. Cada
etapa viaja con su `detalle` y `unidad`, así que el frontend ya no rotula las
etapas por índice.

Los motivos de rechazo se normalizan a una etiqueta canónica
(`MOTIVOS_CANONICOS`) porque el histórico usa códigos snake_case (`precio`,
`no_confia`) y la UI manda prosa (`"Precio muy alto"`): sin eso el donut
partiría la misma causa en dos porciones.

> **Advertencia vigente.** El CSV de interacciones se lee y reescribe entero en
> cada registro, sin bloqueo: con escrituras concurrentes puede perderse una
> fila.

---

## 7. `speech_router` — análisis post-hoc

Expone dos endpoints de análisis que delegan en la cascada de LLM. Piezas clave:

- **Esquemas estrictos** (`SCHEMA_CALL_IN`, `SCHEMA_CALL_OUT`) que el propio
  proveedor valida antes de responder — Gemini vía `responseSchema`, Ollama vía
  `format`. No se parsea prosa en ninguna rama.
- **`motor_analisis`** en cada respuesta: proveedor, modelo, latencia, `ejecucion`
  (`nube`/`local`) y `es_llm_real`.
- **`?forzar_llm=true`**: devuelve `503` con el error real del proveedor en lugar
  de degradar en silencio al motor heurístico. Es el modo de verificación.
- **Motor heurístico de respaldo** (`_analizar_call_in_offline`, etc.): NLP por
  palabras clave, se usa solo si no hay ningún LLM disponible y queda siempre
  etiquetado como tal.

El funcionamiento completo de la cascada (modelos, reintentos, cuotas, Ollama)
está documentado en `chat_speech_to_text_llm_export.md` §7 y §8.

---

## 8. `Legacy_AI/ai_service.py`

Servicio singleton que centraliza el acceso a LLM. Dos interfaces:

| Método | Uso |
|---|---|
| `generate_json(prompt, schema, ...)` | Inferencia **estructurada**; devuelve `(datos, motor)` |
| `_generate_with_fallback(prompt)` | Generación de **texto libre** (pitch y rebate comercial) |
| `diagnostico()` | Ping en vivo a toda la cascada |
| `precalentar_ollama()` | Carga el modelo local en VRAM |

Orden de proveedores configurable con `LLM_PRIORITY` (`gemini` | `ollama` |
`openrouter`). Las claves se leen de `.env` mediante `python-dotenv`; el archivo
está en `.gitignore` y **la clave nunca se escribe en los logs** (solo se registra
el nombre del modelo y el código de estado).

> `ai_router.py` existe pero **no está montado** en `main.py`. Sus endpoints
> generativos no son alcanzables hoy.

---

## 9. Dependencias

```bash
pip install -r requirements.txt                        # núcleo
pip install -r requirements.txt -r requirements-ai.txt # + IA generativa y SHAP
```

`requirements-ai.txt` es opcional: contiene `google-genai`, `requests`, `httpx`,
`python-dotenv` y `shap`. La ruta principal a Gemini es **REST directa con
`requests`**, así que el SDK solo actúa como último respaldo.

---

## 10. Comprobación rápida del estado

```bash
curl http://127.0.0.1:8000/                              # ¿app viva y qué dataset?
curl http://127.0.0.1:8000/api/model/status              # ¿cargó el .joblib?
curl http://127.0.0.1:8000/api/speech/diagnostico-llm    # ¿qué LLM responde?
curl -X POST http://127.0.0.1:8000/api/speech/precalentar-llm-local
```

Documentación interactiva de la API en `http://127.0.0.1:8000/docs`.
