# 🖥️ Arquitectura del Frontend — Movi Nexo NBO 2.0

> Aplicación React que simula las 5 estaciones de trabajo omnicanal de un asesor
> Movistar y el tablero de gerencia. Todo el código vive en `frontend_react/src/`.

---

## 1. Stack y arranque

| Pieza | Versión | Rol |
|---|---|---|
| React | 19.2 | UI |
| Vite | 8.2 | Dev server y bundler |
| Tailwind CSS | 4.3 (plugin `@tailwindcss/vite`) | Estilos, sin archivo de config |
| lucide-react | 1.33 | Iconografía |
| recharts | 3.10 | Gráficos (**solo** en `DashboardE2E`) |

```bash
cd frontend_react
npm run dev      # http://localhost:5173
npm run build    # bundle de producción en dist/
npm run lint     # oxlint
```

> `react-router-dom` figura en `package.json` pero **no se importa en ningún
> archivo de `src/`**. La navegación es manual por estado (ver §3), así que esa
> dependencia se puede retirar sin efecto alguno.

### Proxy hacia el backend

`vite.config.js` redirige todo `/api` al backend:

```js
server: {
  port: 5173,
  proxy: { '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true } }
}
```

Por eso **todas las llamadas del frontend usan rutas relativas** (`/api/clientes`,
`/api/speech/analisis-call-in`). No hay ninguna URL absoluta ni variable de
entorno de API: en desarrollo lo resuelve el proxy y en producción se sirve tras
el mismo origen.

---

## 2. Árbol de archivos

```text
frontend_react/src/
├── main.jsx                    # createRoot → <App/>
├── App.jsx                     # ThemeProvider + MainApp (auth, RBAC, navegación)
├── context/ThemeContext.jsx    # modo claro/oscuro
├── services/api.js             # ÚNICA capa de acceso HTTP (381 líneas)
├── data/mockData.js            # MOCK_CLIENTES + CATALOGO_OFERTAS (respaldo offline)
└── components/
    ├── auth/LoginSSO.jsx       # login simulado con 7 roles
    ├── portal/RolePortal.jsx   # hub de acceso rápido
    ├── CanalTienda.jsx         # canal presencial
    ├── CanalCallOut.jsx        # televentas saliente + auditoría de rebate
    ├── CanalCallIn.jsx         # atención entrante + auditoría de sentimiento
    ├── CanalWhatsApp.jsx       # conversacional (1243 líneas, el más extenso)
    ├── CanalDigital.jsx        # autoservicio en la app
    ├── DashboardE2E.jsx        # tablero de gerencia (recharts)
    ├── SpeechTranscriber.jsx   # transcripción diarizada
    ├── MotorAnalisisBadge.jsx  # qué LLM produjo el análisis
    ├── RebateModal.jsx         # flujo de objeción y contraoferta
    └── ThemeToggle.jsx
```

---

## 3. Autenticación y enrutado por rol (RBAC)

No hay router de librería. `MainApp` mantiene `currentView` en estado y hace
*switch* del componente a renderizar.

```text
LoginSSO ──(rol elegido)──► handleLogin() ──► setCurrentView(...) ──► vista
```

`LoginSSO` ofrece 7 accesos rápidos; cada uno fija el rol y la vista inicial:

| Rol | Usuario simulado | Vista inicial |
|---|---|---|
| `asesor_tienda` | asesor_tienda@movistar.com.pe | Tienda |
| `asesor_callout` | agente_callout@movistar.com.pe | Call Out |
| `asesor_callin` | agente_callin@movistar.com.pe | Call In |
| `asesor_digital` | whatsapp_lead@movistar.com.pe | WhatsApp |
| `asesor_app` | app_digital@movistar.com.pe | App Digital |
| `gerente` | gerencia_cvm@movistar.com.pe | Dashboard E2E |
| `admin_demo` | admin_demo@movistar.com.pe | Portal (**con barra de navegación completa**) |

Solo `admin_demo` ve el menú con los 7 destinos; los demás roles quedan
confinados a su estación. Es el rol que conviene usar en la demo para poder
saltar entre canales sin cerrar sesión.

> El login **no es un control de seguridad**: no hay verificación de credenciales
> ni sesión de servidor. `POST /api/auth/login` devuelve un token fijo. Es un
> selector de escenario para la demostración.

---

## 4. `services/api.js` — la capa que sostiene la demo

Todos los componentes hablan con el backend **solo** a través del objeto `api`.
Ningún componente hace `fetch` por su cuenta. Esto concentra en un archivo la
decisión más importante del frontend: **qué hacer cuando el backend no responde**.

### Degradación en dos modos

```js
api.mode  // 'motor' → datos reales del backend
          // 'mock'  → respaldo local, backend caído
```

Cada método sigue el mismo patrón: intenta el backend y, ante error o respuesta
no-OK, devuelve datos de `mockData.js` marcando `mode = 'mock'`.

```js
async getClientes(canal, limit) {
  try {
    const res = await fetch(`/api/clientes?...`);
    if (res.ok) { this.mode = 'motor'; return data.items.map(...); }
  } catch (e) { this.mode = 'mock'; }
  return MOCK_CLIENTES;          // ← la demo nunca se queda en blanco
}
```

Esto garantiza que la aplicación siga siendo demostrable con el backend apagado,
a costa de que **el usuario podría no notar que está viendo datos simulados**. El
badge de motor (§6) existe precisamente para cerrar ese hueco en el análisis LLM.

### Métodos disponibles

| Método | Endpoint | Uso |
|---|---|---|
| `autoLogin()` | `POST /api/auth/login` | Token implícito antes de cada llamada |
| `getModelStatus()` | `GET /api/model/status` | Comprueba que el `.joblib` cargó |
| `getClientes(canal, limit)` | `GET /api/clientes` | Listado con NBO ya calculado |
| `getClienteByDniOrId(q, canal)` | `GET /api/clientes/{q}` | Búsqueda puntual |
| `getOfertas()` | `GET /api/ofertas` | Catálogo (22 ofertas) |
| `evaluarNBO(id, canal, motivos, ctx)` | `POST /api/recomendaciones/evaluar` | Recalcula con señales de contexto |
| `enviarPreferenciaMT(recId, pref)` | `POST /api/recomendaciones/{id}/preferencia-mt` | Resuelve la ambigüedad MT |
| `registrarGestion(datos)` | `POST /api/gestion/registro` | Persiste la venta en el CSV E2E |
| `getDashboardMetrics(scope)` | `GET /api/gestion/dashboard?scope=` | KPIs del tablero (`consolidado` \| `historico` \| `sesion`) |
| `registrarEvento(data)` | `POST /api/eventos` | Telemetría del funnel |
| `generarPitchIA(...)` / `generarRebateIA(...)` | Legacy AI | Speech generativo |
| `getSpeechSimulaciones()` | `GET /api/speech/simulaciones` | Catálogo de llamadas demo |
| `analizarCallIn(payload)` | `POST /api/speech/analisis-call-in` | Sentimiento + tópico |
| `analizarCallOut(payload)` | `POST /api/speech/analisis-call-out` | Rechazo + efectividad de rebate |
| `getDiagnosticoLLM()` | `GET /api/speech/diagnostico-llm` | Estado de la cascada de LLM |

### `normalizeCliente()`

El backend responde `{recomendacion_id, cliente, motor_nbo, fuente_datos}`. Este
helper **aplana** esa estructura para que los componentes consuman un solo objeto
cliente con `motor_nbo` colgando de él:

```js
{ ...payload.cliente, recomendacion_id, motor_nbo, fuente_datos }
```

Si el backend cambia la forma del payload, este es el único punto a tocar.

---

## 5. Componentes de canal

Los cinco canales comparten estructura: buscar cliente → mostrar Top-3 del motor
→ registrar aceptación o rechazo → si hay rechazo, ofrecer rebate.

| Componente | Particularidad |
|---|---|
| `CanalTienda` | Flujo presencial, el más directo |
| `CanalCallOut` | Añade auditoría post-hoc de venta y efectividad del rebate |
| `CanalCallIn` | Añade auditoría de sentimiento; **puede bloquear la venta** |
| `CanalWhatsApp` | Simula la conversación completa; el más extenso |
| `CanalDigital` | Autoservicio, sin asesor |

### El bloqueo anti-presión en Call In

`CanalCallIn` es el único canal donde el análisis de la llamada **revierte** la
recomendación comercial. Tras analizar la transcripción:

```js
if (analisis.cliente_insatisfecho || analisis.score_sentimiento < 2.5) {
  // activa NO_OFRECER: se prioriza resolver el reclamo sobre vender
}
```

Es la traducción a UI de la regla de negocio `INCIDENCIA_EN_INTERACCION` que vive
en el motor (ver `arquitectura_motor_modelo.md` §3).

---

## 6. `MotorAnalisisBadge` — trazabilidad del LLM

El backend puede resolver un análisis con tres motores distintos. El badge lee
`motor_analisis.proveedor` y `motor_analisis.es_llm_real` para que en pantalla
nunca se atribuya a Gemini un resultado que no salió de Gemini:

| Estado | Badge | Significado |
|---|---|---|
| 🟢 verde | `✨ Gemini · <modelo>` | Inferencia en la nube |
| 🔵 azul | `💾 Ollama (local) · qwen2.5:7b` | Inferencia en este equipo, sin cuota |
| 🟠 ámbar | `⚙ Motor heurístico (sin LLM)` | Ningún LLM disponible; motivo en el `title` |

La latencia se muestra junto al nombre. Detalle de la cascada en
`chat_speech_to_text_llm_export.md` §8.

---

## 7. `SpeechTranscriber`

Renderiza la transcripción diarizada con burbujas separadas para `[🎧 Asesor]` y
`[👤 Cliente]`. Dos modos:

- **`▶ Reproducir Llamada Demo`** — anima los diálogos paso a paso con ecualizador
  y contador de duración.
- **`⚡ Carga Inmediata`** — vuelca la transcripción completa de golpe. Es el modo
  recomendado para un pitch cronometrado.

Carga el catálogo desde `GET /api/speech/simulaciones` y, si el backend no
responde, cae a `SIMULACIONES_LOCAL` embebido en el propio componente.

---

## 8. Tema claro/oscuro

`ThemeContext` expone `isDark` y persiste la elección. Los componentes eligen
clases Tailwind condicionalmente (`isDark ? 'text-[#00C6D7]' : 'text-[#005C84]'`)
en lugar de usar la variante `dark:`. La paleta sigue el manual de marca:
`#005C84` (azul), `#00C6D7` (cian), `#7AB800` (verde).

---

## 9. Puntos a tener en cuenta

1. **El bundle supera 500 kB** (766 kB, 213 kB gzip). Vite lo advierte en cada
   build. Si importa, `CanalWhatsApp` y `DashboardE2E` son los mejores candidatos
   a `import()` dinámico.
2. **No hay tests.** La verificación es manual sobre la UI.
3. **`mockData.js` debe seguir alineado con el catálogo real** (22 ofertas). Un
   desajuste solo se nota cuando el backend cae y el modo mock toma el control.
4. **El modo mock es silencioso** salvo en el análisis LLM. Si en una demo los
   datos parecen extraños, comprobar `api.mode` en la consola antes que nada.
