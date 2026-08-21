# 🤖 AGENTS.md — Directrices para Agentes de IA en el Repositorio

> **Proyecto:** Personalización Comercial Inteligente (NBO + Movistar Total)  
> **Contexto:** Hackathon AI Telecom Challenge 2026 (Telefónica del Perú / Movistar + Universidad de Lima + Lenovo ISG) — **Desafío 02**  
> **Área de Negocio:** Crecimiento, Ventas y Fidelización B2C  

Este archivo define el marco contextual, las restricciones inviolables y las directrices operativas que **todo agente de IA** (asistente de código, subagente o pipeline automatizado) debe acatar al interactuar con este repositorio.

---

## 🛑 1. Reglas Inviolables (CRITICAL RESTRICTIONS)

1. **MODIFICACIÓN CONTROLADA DE `EDA/`:**
   - Los notebooks dentro del directorio `EDA/` (`EDA_campañas.ipynb`, `EDA_catalogo_ofertas.ipynb`, `EDA_clientes.ipynb`, `EDA_integrado_target.ipynb`) son archivos sensibles de análisis exploratorio.
   - **Antes de cualquier modificación**, el agente debe:
     1. Describir con claridad **qué** se va a modificar y **por qué**.
     2. Indicar las celdas o secciones específicas afectadas.
     3. **Solicitar y obtener autorización expresa del usuario** antes de proceder.
   - Sin autorización explícita, solo se permite la lectura e inspección.
2. **NO TOCAR EL CÓDIGO DE `inferencia_modelo.py`:**
   - Queda estrictamente prohibido modificar o refactorizar el archivo raíz `inferencia_modelo.py` y `Modelo/inferencia_modelo.py`. El esquema de entrada (33 columnas `COLUMNAS_MODELO`) y la función `calcular_score` son contratos de interfaz inmutables.
3. **RESPETAR LA ESTRUCTURA DE DATOS ([Cookiecutter Data Science](https://cookiecutter-data-science.drivendata.org/)):**
   - Todos los datos deben residir en `data/` (`raw/`, `interim/`, `processed/`, `external/`). Los archivos dentro de `data/raw/` son inmutables y de solo lectura. Ningún script debe sobreescribir los CSVs crudos.

---

## 🎯 2. Contexto del Negocio y Desafío 02

### 2.1. El Problema Operativo y Comercial
- Movistar Perú ofrece planes móviles, fibra/hogar, upgrades, terminales y paquetes adicionales a través de múltiples canales (**Tiendas, Call Center Call In / Call Out, Canales Digitales, WhatsApp, App Mi Movistar**).
- **Dolores actuales:**
  - Recomendaciones basadas en campañas masivas o reglas estáticas poco personalizadas.
  - Asesores comerciales bajo presión de tiempo con información fragmentada entre plataformas como **DITO** (plataforma de ventas) y **Visor** (plataforma de postventa y cross-selling).
  - Ofrecimiento reactivo de productos de alto valor.
  - Planta de clientes de mayor edad (+50 años) con baja adopción digital, lo que exige omnicanalidad asistida.
  - Ausencia de trazabilidad E2E del funnel (desde la clasificación hasta el speech de rebate y la venta final).

### 2.2. Caso de Uso Prioritario: Movistar Total (MT)
- **Movistar Total (MT)** es la oferta convergente estratégica que unifica servicios móviles y de internet hogar bajo una sola factura, ofreciendo:
  - Hasta **50% de ahorro** vs. contratar servicios por separado.
  - Bono duplicador de GB y beneficios exclusivos.
  - Blindaje del cliente: reduce el **churn**, disminuye la morosidad y aumenta el tiempo de permanencia.
- **Metas cuantitativas del negocio:**
  - Lograr que **> 50% de la venta hogar** sea con Movistar Total.
  - Lograr que **> 10% de la venta móvil** sea con Movistar Total.

---

## 🧠 3. Principios de Solución de IA (Filosofía de Diseño)

Siguiendo el marco estratégico de innovación (*Design Thinking + IA Estratégica*):
1. **El problema antes que el algoritmo:** La prioridad no es maximizar marginalmente el accuracy, sino entregar recomendaciones explicables, accionables y con impacto económico directo (ARPU, Churn, Conversión, NPS).
2. **Explicabilidad (XAI):** Toda recomendación generada para un asesor o canal digital debe responder:
   - *¿Qué ofrecer?* (Oferta Top-1 / NBO)
   - *¿Por qué a este cliente?* (Variables clave: ahorro, consumo vs. cuota, antigüedad, riesgo)
   - *¿Por qué canal y en qué momento?* (Canal de mayor propensión)
   - *¿Qué speech comercial usar?* (Argumentos persuasivos generados con IA)
   - *¿Cuál es el rebate si rechaza?* (Oferta Top-2 / Top-3 de contingencia)
3. **Trazabilidad E2E del Funnel Comercial:**
   $$\text{Clasificación} \longrightarrow \text{Canal/Momento} \longrightarrow \text{Speech NBO} \longrightarrow \text{Speech Rebate} \longrightarrow \text{Contactabilidad} \longrightarrow \text{Venta}$$

---

## 🗂️ 4. Mapa de Navegación del Repositorio

```
d:\hacka_movistar\
├── data/
│   ├── external/               # Fuentes externas
│   ├── interim/                # Datos intermedios de pipelines
│   ├── processed/              # Datasets finales (scoring_top3_predictivo.csv)
│   └── raw/                    # Datasets crudos inmutables (clientes, ofertas, historial)
│
├── docs/                       # Documentación técnica, metodológica y de negocio
│   ├── agents/                 # Marcos de acción para agentes especializados del MVP
│   │   ├── 01_director_fullstack.md    # Director: coordinación, arquitectura, deploy Vercel
│   │   ├── 02_programador_backend.md   # Backend: datos, ML, API, reglas de negocio
│   │   ├── 03_programador_frontend.md  # Frontend: UX/UI, responsiveness, visualización
│   │   ├── 04_analista_negocio.md      # Analista: pitch, validación, alertas de desalineamiento
│   │   ├── 05_analista_ciberseguridad.md # Ciberseguridad: fuga de secretos, cookies, blindaje
│   │   └── 06_data_scientist.md        # Data Scientist: evaluación EDA, modelos predictivos y XAI
│   ├── data_dictionary.md      # Diccionario detallado de variables y tipos
│   ├── eda_findings.md         # Resumen de hallazgos del análisis exploratorio
│   ├── model_documentation.md  # Arquitectura del modelo y especificación del pipeline
│   ├── nbo_strategy.md         # Estrategia comercial NBO, Movistar Total y Rebate
│   ├── business_context.md     # Marco contextual, métricas operativas y visión estratégica
│   └── output_modelo.pdf       # Reporte ejecutivo del desafío
│
├── EDA/                        # [MODIFICACIÓN CONTROLADA] Notebooks de exploración y análisis
├── Modelo/                     # [INMUTABLE] Scripts y artefactos de inferencia
├── inferencia_modelo.py        # [INMUTABLE] Función principal calcular_score()
├── requirements.txt            # Dependencias del proyecto
├── AGENTS.md                   # Este archivo (Guía operativa de agentes)
└── README.md                   # Presentación ejecutiva y técnica del repositorio
```

---

## 📖 5. Glosario de Términos del Dominio

- **NBO (Next Best Offer):** Motor predictivo que selecciona la mejor oferta personalizada para un cliente específico.
- **MT (Movistar Total):** Oferta convergente (Móvil Postpago + Internet Hogar) con factura unificada y beneficios de ahorro.
- **Elegible MT (`elegible_mt`):** Cliente que posee móvil postpago e internet hogar por separado, siendo el target principal para migrar a MT.
- **Rebate:** Oferta secundaria o plan de contingencia inmediata que se presenta cuando el cliente rechaza la oferta principal.
- **DITO:** Plataforma interna de Movistar para emisión y cierre de ventas.
- **Visor:** Plataforma interna de atención postventa y detección de oportunidades de cross-selling.
- **ARPU:** Ingreso promedio por usuario (*Average Revenue Per User*).
- **Churn:** Tasa de cancelación o baja de servicios.
- **NPS:** Índice de satisfacción y lealtad del cliente (*Net Promoter Score*).

---

## 🚀 6. Guía de Ejecución para Nuevas Tareas

Cuando un agente reciba solicitudes de mejora o extensiones (por ejemplo, construir interfaces para asesores, agentes generativos de speech comercial o dashboards de monitoreo):
1. **Consultar primero `docs/` y `data/raw/`** para respetar el schema y contexto.
2. **Utilizar el entorno virtual** configurado (`venv`) con dependencias de `requirements.txt`.
3. **Asegurar compatibilidad con el pipeline de inferencia** (`inferencia_modelo.py`).
4. **Documentar siempre los entregables** en `docs/` y mantener actualizados los enlaces relativos en formato markdown.

---

## 🤖 7. Asignación de Modelos Predeterminados para los Agentes

Para optimizar el balance entre capacidad de razonamiento, precisión técnica, latencia y costo, cada agente especializado tiene asignado un modelo y nivel de thinking predeterminado:

| Agente | Rol Principal | Modelo Predeterminado | Thinking Budget | Marco de Acción |
| :--- | :--- | :--- | :---: | :--- |
| **Director Full-Stack** | Coordinación, arquitectura, Vercel MCP, auditoría Ponytail | **Gemini 3.1 Pro** | `High` | [`docs/agents/01_director_fullstack.md`](docs/agents/01_director_fullstack.md) |
| **Programador Backend** | Arquitectura de datos, integración ML (`inferencia_modelo.py`), API REST | **Gemini 3.1 Pro** | `Low` | [`docs/agents/02_programador_backend.md`](docs/agents/02_programador_backend.md) |
| **Programador Frontend** | Diseño UX/UI, visualización de datos, responsiveness | **Gemini 3.1 Pro** | `Low` | [`docs/agents/03_programador_frontend.md`](docs/agents/03_programador_frontend.md) |
| **Analista de Negocio** | Pitch de 3 min, validación de negocio, alertas de desalineamiento | **Gemini 3.7 Flash** | `High` | [`docs/agents/04_analista_negocio.md`](docs/agents/04_analista_negocio.md) |
| **Analista de Ciberseguridad** | Vigilancia de secretos, cookies, protección de código y SAST | **Gemini 3.1 Pro** | `High` | [`docs/agents/05_analista_ciberseguridad.md`](docs/agents/05_analista_ciberseguridad.md) |
| **Data Scientist** | Evaluación de EDA, modelamiento predictivo, validación estadística y XAI | **Gemini 3.1 Pro** | `High` | [`docs/agents/06_data_scientist.md`](docs/agents/06_data_scientist.md) |
