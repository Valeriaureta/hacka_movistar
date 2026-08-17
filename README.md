# 🚀 MoviNEXO: Asistente Comercial Inteligente (NBO + Movistar Total)

[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black.svg?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Hackathon AI Telecom 2026](https://img.shields.io/badge/Movistar-Hackathon%202026-003245.svg)](docs/business_context.md)
[![Status: MVP Activo](https://img.shields.io/badge/status-MVP_Activo-success.svg)](#)

**MoviNEXO** es una solución integral Full-Stack impulsada por Inteligencia Artificial y Analítica Predictiva, desarrollada para el **Hackathon AI Telecom Challenge 2026 (Desafío 02: Personalización Comercial Inteligente)**, impulsado por **Telefónica del Perú (Movistar)**, la **Universidad de Lima** y **Lenovo ISG**.

El propósito de la plataforma es transformar el modelo de ventas de los asesores (DITO / Call Center / Tiendas) de reactivo a proactivo. **MoviNEXO** recomienda en milisegundos la **Mejor Oferta Comercial (Next Best Offer - NBO)** para cada cliente, traduce la predicción en un **speech comercial persuasivo y explicable**, sugiere el **canal óptimo de contacto**, y provee estrategias de **contingencia (rebate)**. Todo ello con un foco estratégico en la migración hacia la convergencia de **Movistar Total (MT)**.

---

## 🌟 Características Principales (Avances del MVP)

- **Visor Asesor Optimizado (Frontend Next.js):** Interfaz ultrarrápida, sin tecnicismos ("cero fricción"), diseñada para asesores bajo presión de tiempo.
- **Motor de Reglas y Scoring Ad-Hoc (Backend FastAPI):** API RESTful potenciada por DuckDB para consultas analíticas sobre 100k clientes en milisegundos.
- **XAI y Generación de Speech Comercial:** El algoritmo de NBO no solo predice (Propensión de Aceptación), sino que explica *por qué* recomienda el plan y *qué* debe decirle el asesor al cliente.
- **Filtros Avanzados y Omnicanalidad:** Filtros instantáneos por *Canal de Contacto Sugerido* (Call, Digital, Tienda), *Elegibilidad Movistar Total* y *Nivel de Riesgo (Mora)*.
- **Soporte Light / Dark Mode:** Interfaz adaptativa con persistencia para cuidar la vista del asesor en diferentes entornos de iluminación.

---

## 📁 Arquitectura del Repositorio

El proyecto evolucionó de un flujo de ciencia de datos (Cookiecutter) a un ecosistema Full-Stack:

```
d:\hacka_movistar\
├── app/                        <- Backend de la aplicación.
│   └── backend/                <- API REST en FastAPI, servicios NBO, XAI y Data Loader (DuckDB).
│
├── frontend/                   <- Frontend moderno en Next.js (React 19).
│   ├── src/app/                <- Rutas de la interfaz (Visor Asesor, Simulador, Catálogo, Dashboard).
│   └── src/components/         <- Componentes UI interactivos (ClientSearch, NBOHeroCard, etc.).
│
├── data/                       <- Repositorio de datos estructurado.
│   ├── processed/              <- Datasets finales listos para modelado y consumo del API.
│   └── raw/                    <- Datos crudos e inmutables (100k clientes, 300k campañas).
│
├── docs/                       <- Documentación técnica, metodológica y de negocio.
│   ├── business_context.md     <- Marco contextual del hackathon, plataformas y visión.
│   ├── model_documentation.md  <- Arquitectura del modelo predictivo.
│   └── nbo_strategy.md         <- Estrategia NBO y lógica comercial.
│
├── EDA/                        <- [INMUTABLE] Notebooks con el análisis exploratorio de datos.
├── Modelo/                     <- Artefactos del modelo entrenado (joblib).
├── inferencia_modelo.py        <- [INMUTABLE] Módulo principal para cálculo de scoring logístico.
├── AGENTS.md                   <- Guía operativa y reglas inmutables para agentes autónomos.
└── README.md                   <- Este documento.
```

---

## 📚 Índice de Documentación

| Documento | Descripción |
| :--- | :--- |
| [🏢 Marco Contextual del Negocio](docs/business_context.md) | Dolores operativos, plataformas (DITO/Visor), metas comerciales de MT (>50% hogar, >10% móvil). |
| [📖 Diccionario de Datos](docs/data_dictionary.md) | Detalle columna por columna de los datasets. |
| [📊 Hallazgos EDA](docs/eda_findings.md) | Insights extraídos del análisis de campañas y catálogo de ofertas. |
| [🤖 Documentación del Modelo](docs/model_documentation.md) | Pipeline probabilístico y métricas de desempeño del modelo NBO. |
| [🎯 Estrategia NBO y Rebate](docs/nbo_strategy.md) | Priorización de Movistar Total, orquestación de canales y no-canibalización. |

---

## ⚙️ Instalación y Ejecución Local

### 1. Iniciar el Backend (FastAPI)
```bash
# Crear y activar entorno virtual
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate    # Linux / macOS

# Instalar dependencias
pip install -r requirements.txt

# Levantar el servidor de desarrollo
uvicorn app.main:app --reload --port 8000
```
El API estará disponible en `http://localhost:8000/docs` (Swagger UI).

### 2. Iniciar el Frontend (Next.js)
```bash
cd frontend

# Instalar dependencias NPM
npm install

# Levantar servidor de desarrollo Next.js
npm run dev
```
La interfaz del Asesor MoviNEXO estará disponible en `http://localhost:3000`.

---

## 🎯 Impacto en el Negocio

- **Incremento en Conversión (Win-Rate):** Ofertas altamente personalizadas apoyadas en un speech que resalta el ahorro directo (hasta 50%).
- **Penetración Convergente (Movistar Total):** Foco implícito en la migración de clientes *mono-producto* hacia la rentabilidad y el blindaje convergente.
- **Reducción del TMO (Tiempo Medio de Operación):** El asesor no tiene que navegar por múltiples pantallas ni interpretar scores crudos; MoviNEXO entrega el *"Qué ofrecer y qué decir"* en 1 segundo.
- **Empoderamiento del Asesor:** Transición de un visor técnico a un verdadero asistente comercial que proporciona planes alternativos inmediatos (Plan B y C) para abatir objeciones.