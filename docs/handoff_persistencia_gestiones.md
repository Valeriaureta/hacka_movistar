# Handoff — Persistencia del log de gestiones E2E

> Documento de traspaso. Estado al 2026-08-26, rama `bruno`.
> Lee la sección 0 antes de tocar nada.

---

## 0. BLOQUEANTE: el backend no arranca ahora mismo

`backend/dashboard_router.py` quedó a medio refactorizar. Falla al **importar**,
así que no cae solo el dashboard: cae toda la API (`backend/main.py` importa
este router).

```
$ python -c "import backend.dashboard_router"
  File "D:\hacka_movistar\backend\dashboard_router.py", line 31, in _init_interacciones_file
    INTERACCIONES_PATH.parent.mkdir(parents=True, exist_ok=True)
NameError: name 'INTERACCIONES_PATH' is not defined
```

**Causa.** Se reemplazó el bloque de cabecera del router (que definía
`INTERACCIONES_PATH`, `COLUMNAS_INTERACCIONES` y `_init_interacciones_file`)
por imports al nuevo `backend/gestiones_store.py`, pero el resto del archivo
todavía usa los nombres viejos. `_init_interacciones_file()` además se invoca a
nivel de módulo (línea 45), por eso revienta en el import y no en la request.

**Ojo con un uvicorn zombi.** Puede haber un proceso levantado ~22:06 sirviendo
el código *anterior* al corte, que funciona y por lo tanto engaña. En cuanto se
reinicie o recargue, falla. Mátalo antes de validar nada.

Las 8 referencias huérfanas, todas en `backend/dashboard_router.py`:

| Línea | Referencia |
|---|---|
| 30–43 | `_init_interacciones_file()` completa (usa `INTERACCIONES_PATH` ×3) |
| 45 | llamada a `_init_interacciones_file()` a nivel de módulo |
| 50–51 | `registrar_gestion`: `_init_interacciones_file()` + `pd.read_csv(INTERACCIONES_PATH)` |
| 71 | `registrar_gestion`: `df.to_csv(INTERACCIONES_PATH)` |
| 90–91 | `_agregar_sesion`: `_init_interacciones_file()` + `pd.read_csv(INTERACCIONES_PATH)` |
| 128 | `np.nan` — `numpy` ya no está importado |
| 228 | `fuente.en_vivo.archivo`: `str(INTERACCIONES_PATH)` |

---

## 1. Lo que ya está terminado y verificado (no rehacer)

Tarea previa: **conectar el dashboard a los datos reales del backend**. Cerrada.

- `backend/dashboard_baseline.py` *(nuevo)* — precalcula `data/raw/historial_campanias.csv`
  (300 112 ofrecimientos, 95 019 clientes, ene–jun 2026) a
  `data/processed/dashboard/baseline_historico.json` (6,4 KB, versionado).
  Regenerar: `python -m backend.dashboard_baseline`.
- `GET /api/gestion/dashboard?scope=` con `historico` / `sesion` / `consolidado`.
  Los tres verificados por HTTP; la suma consolidada da exacta.
- Se eliminaron las dos etapas inventadas del funnel (`total*3+120`, `total*2+80`).
  Ahora son 4 etapas medidas, misma unidad (ofrecimientos), monotónicamente
  decrecientes. Cada etapa viaja con `detalle` y `unidad`.
- Motivos de rechazo normalizados vía `MOTIVOS_CANONICOS` (el histórico usa
  snake_case, la UI manda prosa).
- Frontend: selector de alcance + línea de procedencia en el header de
  `DashboardE2E.jsx`; `api.getDashboardMetrics(scope)`. Build de Vite pasa.
- `vercel.json`: `data/processed/dashboard/**` añadido a `includeFiles`.
- Documentado en `docs/arquitectura_backend.md` y `docs/arquitectura_frontend.md`.

---

## 2. La tarea en curso

**Objetivo:** que las gestiones registradas en vivo sobrevivan en Vercel.

El problema: en Vercel el log va a `/tmp/interacciones_e2e.csv`, que es efímero
y no se comparte entre instancias. Una gestión registrada durante la demo
desaparece en el siguiente cold start. En local no ocurre.

**Enfoque elegido:** capa de storage con degradación automática. Si el entorno
expone un Redis REST (Upstash / Vercel KV) el log se persiste ahí; si no hay
credenciales o Redis falla, cae al CSV de siempre. Sin credenciales el
comportamiento es idéntico al actual, así que no rompe a nadie.

Se eligió Redis REST vía `urllib` de stdlib para **no agregar dependencias**:
el bundle de Vercel está deliberadamente magro (hasta los SDK de IA quedaron
fuera, ver `requirements.txt`).

### Ya escrito: `backend/gestiones_store.py` *(nuevo, completo)*

API pública:

| Función | Qué hace |
|---|---|
| `leer_gestiones() -> list[dict]` | Log completo. Prefiere Redis, degrada a CSV. |
| `agregar_gestion(dict) -> str` | Persiste una fila. Devuelve `"redis"` o `"csv"`. |
| `siguiente_id(total) -> str` | `G0039`, etc. |
| `descripcion() -> dict` | `{backend, archivo, persistente, efimero, error}` para exponer la procedencia real en el tablero. |

Detalles ya resueltos: timeout de 3 s (el dashboard hace polling cada 15 s, no
puede colgarse), semilla demo compartida por ambos backends, tolerancia a filas
corruptas, y detección de `KV_REST_API_*` y `UPSTASH_REDIS_REST_*`.

**Verificado:** la rama CSV funciona standalone.

```
leer_gestiones -> 38 filas; ultima: G0038
siguiente_id   -> G0039
descripcion    -> {'backend': 'csv', 'persistente': True, 'efimero': False, ...}
```

**NO verificado:** la rama Redis nunca corrió contra un servidor real — no hay
credenciales en este entorno. Es código escrito a ciegas contra la API REST de
Upstash. Trátalo como no probado.

---

## 3. Pasos que faltan

### Paso 1 — Desbloquear el router *(obligatorio, primero)*

En `backend/dashboard_router.py`:

**1a.** Borrar líneas 30–45 completas: `_init_interacciones_file()` y su llamada
a nivel de módulo. El seeding ahora lo hace el store.

**1b.** En `registrar_gestion` (línea ~48), reemplazar la lectura del CSV:

```python
gestiones = leer_gestiones()
nuevo_id = siguiente_id(len(gestiones))
ahora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
nueva_fila = { ... }                      # sin cambios
backend_usado = agregar_gestion(nueva_fila)
return {"status": "success", "id": nuevo_id, "backend": backend_usado,
        "message": "Gestión registrada exitosamente"}
```

Quita el `pd.concat` / `to_csv` de las líneas 70–71: eso ahora vive en el store.

**1c.** En `_agregar_sesion` (línea ~88):

```python
gestiones = leer_gestiones()
if not gestiones:
    return _bloque_vacio()
df = pd.DataFrame(gestiones)
```

**1d.** Línea 128 — matar la dependencia de `numpy` tomando las últimas
gestiones de la lista en vez del DataFrame:

```python
ultimas = [dict(g) for g in reversed(gestiones[-10:])]
for fila in ultimas:
    fila["motivo_rechazo"] = normalizar_motivo(fila.get("motivo_rechazo"))
```

Alternativa si prefieres mantener el DataFrame: reimporta `numpy as np`. La
opción de la lista es más limpia y evita que pandas reintroduzca `NaN`.

**1e.** Línea 228 — el bloque `en_vivo` pasa a reportar durabilidad real:

```python
"en_vivo": {**descripcion(), "gestiones": sesion["kpis"]["total"]},
```

### Paso 2 — Que el tablero avise cuando el log es efímero

En `frontend_react/src/components/DashboardE2E.jsx`, `descripcionFuente()` ya
lee `fuente.en_vivo`. Añadir un aviso cuando `fuente.en_vivo.efimero === true`:
algo como *"log en memoria efímera — se pierde en el próximo cold start"*, en
ámbar, junto a la línea de procedencia. Es el caso de Vercel sin Redis
provisionado, que es el estado por defecto hoy.

### Paso 3 — Documentar las variables de entorno

Añadir a `.env.example`, siguiendo el estilo comentado del archivo (explica el
*porqué*, no solo el nombre):

```bash
# Persistencia del log de gestiones E2E (opcional).
# Sin esto, en Vercel el log vive en /tmp y se pierde en cada cold start.
# Provisionar: Vercel -> Storage -> Upstash Redis -> Connect Project.
# Vercel inyecta estas dos solo; el backend las detecta sin tocar código.
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

### Paso 4 — Probar la rama Redis

Sigue sin verificarse. Dos caminos:

- **Real:** provisionar Upstash en Vercel (tiene free tier) y exportar las dos
  variables en local para probar contra el mismo endpoint.
- **Sin provisionar:** levantar un stub HTTP que hable el protocolo REST de
  Upstash (`POST` con body `["RPUSH", key, value]` → `{"result": ...}`) y
  apuntar `KV_REST_API_URL` ahí. Suficiente para validar serialización,
  round-trip de `es_movistar_total` como bool, y la degradación a CSV cuando el
  endpoint devuelve error o timeout.

**Esta decisión es del usuario**, no la tomes por tu cuenta: provisionar Upstash
implica crear una cuenta y ligarla al proyecto de Vercel. Si no hay luz verde,
deja el código como está (degrada a CSV, no rompe nada) y repórtalo.

### Paso 5 — Documentación

Actualizar la sección *Bitácora E2E* de `docs/arquitectura_backend.md`: hoy
describe el CSV como único almacén. Debe explicar el store, los dos backends y
la degradación. La advertencia de concurrencia sigue vigente para la rama CSV.

---

## 4. Cómo verificar que quedó bien

```bash
# 1. El import ya no revienta
python -c "import backend.dashboard_router; print('OK')"

# 2. Los tres alcances responden
python -c "
from backend.dashboard_router import get_dashboard_metrics
for s in ('historico','sesion','consolidado'):
    d = get_dashboard_metrics(s)
    print(s, d['kpis']['total'], d['fuente']['en_vivo'])
"

# 3. Ciclo E2E completo por HTTP
python -m uvicorn backend.main:app --port 8011
curl -X POST localhost:8011/api/gestion/registro -H "Content-Type: application/json" \
  -d '{"cliente_id":"CLI000777","canal":"WhatsApp","oferta_id":"OF021",
       "oferta_nombre":"Movistar Total Plus","es_movistar_total":true,
       "estado":"RECHAZADA","motivo_rechazo":"Mala experiencia previa",
       "precio_oferta":123.44,"ahorro_pct":35}'
curl "localhost:8011/api/gestion/dashboard?scope=sesion"

# 4. Frontend compila
cd frontend_react && npm run build
```

Valores esperados en `scope=historico` (si no cuadran, algo se rompió):
`total 300112`, `contactados 254618`, `aceptadas 95414`, `mt_aceptadas 16872`,
`tasa_conversion 31.8`, `share_mt 17.7`.

**Restaura `data/interacciones_e2e.csv` después de probar.** Es el log real de
la demo del usuario, no un fixture. Haz `cp` antes y después.

---

## 5. Contexto que no se deduce del código

- **`data/interacciones_e2e.csv` está vivo.** El usuario registra gestiones
  desde la app mientras se trabaja en el repo; el conteo se mueve solo. Al
  escribir esto tenía 38 filas (`G0038`, 22:12). No asumas que es estático ni lo
  sobrescribas con un fixture.
- **`data/raw/historial_campanias.csv` y `dataset_clientes.csv` están en
  `.gitignore`** por tamaño (47 MB y 18 MB). Por eso el histórico se precalcula
  a JSON: el CSV crudo nunca llega al bundle de Vercel. Si el JSON falta pero el
  CSV está, `cargar_baseline()` lo reconstruye solo.
- **Archivos modificados bajo `data/processed/benchmarks_comparados/`** en
  `git status` no son de esta tarea: vienen de un job de benchmarks del usuario.
  No los toques ni los incluyas en un commit de esta línea de trabajo.
- **Un mapeo de motivos es criterio discutible:** la UI ofrece *"Compromiso con
  otro operador"* y se aterriza en `ya_tiene_similar`. Son cercanos pero no
  idénticos. *"Sin cobertura fibra"* se dejó sin mapear, como categoría propia.
  Si el usuario lo cuestiona, está en `MOTIVOS_CANONICOS`
  (`backend/dashboard_baseline.py`).
- **Concurrencia:** la rama CSV lee y reescribe el archivo entero en cada
  registro, sin bloqueo. Con escrituras concurrentes puede perderse una fila. La
  rama Redis (`RPUSH`) no tiene ese problema — es una de las razones del diseño.
