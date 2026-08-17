# 🎯 Walkthrough: MVP Personalización Comercial Inteligente (NBO + Movistar Total)

Se ha completado con éxito la primera fase de desarrollo del **MVP** mediante la coordinación técnica entre el **Director Full-Stack**, el **Programador Backend** y el **Programador Frontend**, respetando todas las directivas de [`AGENTS.md`](file:///d:/hacka_movistar/AGENTS.md).

---

## 🏛️ 1. Arquitectura Implementada

El proyecto cuenta con una estructura limpia y optimizada en [`app/`](file:///d:/hacka_movistar/app):

```
d:\hacka_movistar\
├── app/
│   ├── main.py                         # Aplicación principal FastAPI con CORS y Static SPA
│   ├── backend/
│   │   ├── config.py                   # Configuración centralizada de rutas de datos
│   │   ├── data_loader.py              # Motor de consulta in-memory DuckDB (<5ms sobre 100k clientes)
│   │   ├── speech_generator.py         # Generador dinámico de speech comercial y rebates
│   │   ├── nbo_service.py              # Servicio XAI en 5 dimensiones y lógica NBO
│   │   └── routes/
│   │       ├── clientes.py             # GET /api/clientes, GET /api/clientes/{id}, GET /api/clientes/{id}/nbo
│   │       ├── ofertas.py              # GET /api/ofertas, GET /api/ofertas/{id}
│   │       ├── scoring.py              # POST /api/scoring (simulación ad-hoc)
│   │       └── analytics.py            # GET /api/analytics (KPIs del negocio)
│   └── frontend/
│       ├── index.html                  # Single Page Application moderna
│       ├── css/
│       │   ├── variables.css           # Tokens de diseño Movistar (Azul #019DF4, Dark Slate, Glassmorphism)
│       │   ├── layout.css              # Grid responsive, barra superior y vistas
│       │   └── components.css          # Cards NBO, semáforos, badges, speech blocks y gráficos
│       └── js/
│           ├── api.js                  # Cliente HTTP REST
│           ├── state.js                # Gestor de estado reactivo y toasts
│           ├── app.js                  # Orquestador y enrutador por pestañas
│           └── components/
│               ├── search.js           # Buscador en tiempo real con filtros (Elegible MT, Mora)
│               ├── clientProfile.js    # Ficha 360° del cliente (ARPU, Consumo, Antigüedad, Riesgo)
│               ├── nboCard.js          # Hero Card Top-1 con XAI + Rebates Top-2/Top-3 con 1-click copy
│               ├── simulatorView.js    # Simulador interactivo de scoring ad-hoc
│               ├── catalogView.js      # Catálogo interactivo de 22 ofertas filtrable por categoría
│               └── dashboardView.js    # Panel directivo con distribución de canales y KPIs
├── run.py                              # Script de lanzamiento instantáneo
```

---

## 🚀 2. Vistas del MVP

1. **👤 Visor Asesor (DITO / Visor 2.0):**
   - Búsqueda instantánea en vivo entre los **100,000 clientes**.
   - Filtros rápidos: *✨ Elegibles MT*, *⚠️ Riesgo Mora*.
   - Ficha 360° con semáforo de riesgo crediticio, ARPU, consumo y canal preferente.
   - **Hero Card NBO Top 1:**
     - Barra de probabilidad de aceptación animada y semaforizada.
     - **5 Dimensiones XAI:** ¿Qué ofrecer?, ¿Por qué a este cliente?, Canal y momento sugerido, Speech persuasivo, Rebate de contingencia.
     - Botón *1-click copy* para copiar el speech al portapapeles.
   - **Rebates Top-2 y Top-3:** Bloques colapsables con argumentos de contraoferta inmediata.

2. **⚡ Simulador de Scoring en Tiempo Real:**
   - Permite combinar cualquier cliente con cualquier oferta del portafolio y canal de contacto, calculando al instante la propensión y el speech adaptado.

3. **📦 Catálogo Comercial (22 Planes):**
   - Visualización categorizada de planes Movistar Total convergentes, paquetes móviles y fibra hogar.

4. **📊 Dashboard Directivo & Funnel E2E:**
   - Universo total (100,000 clientes), tasa de elegibles MT (24.7%), ARPU promedio, penetración de la app y distribución de contactabilidad por canal.

---

## 🧪 3. Resultados de Pruebas Automatizadas

Se ejecutó la suite de verificación con `TestClient`:
- `GET /health` → **200 OK**
- `GET /api/clientes?limit=5` → **200 OK** (latencia < 5ms)
- `GET /api/clientes/CLI000001/nbo` → **200 OK** (Top-3 con explicabilidad XAI y rebates)
- `GET /api/ofertas` → **200 OK** (22 ofertas catalogadas)
- `POST /api/scoring` → **200 OK** (Simulación ad-hoc validada)
- `GET /api/analytics` → **200 OK** (Métricas de 100k clientes agregadas)
- `GET /` → **200 OK** (Servicio de SPA estática)

---

## 🏁 4. Cómo Iniciar la Aplicación

Para correr el MVP localmente, ejecuta en la terminal:
```bash
python run.py
```
Y abre tu navegador en: **`http://localhost:8000`**
