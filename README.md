# 🚀 Personalización Comercial Inteligente (NBO + Movistar Total)

[![Python 3.10+](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![Project Structure: Cookiecutter Data Science](https://img.shields.io/badge/CCDS-Project%20Structure-orange.svg)](https://cookiecutter-data-science.drivendata.org/)
[![Hackathon AI Telecom 2026](https://img.shields.io/badge/Movistar-Hackathon%202026-003245.svg)](docs/business_context.md)
[![Status: Active](https://img.shields.io/badge/status-active-success.svg)](#)

Solución integral de Inteligencia Artificial y Analítica Predictiva desarrollada para el **Hackathon AI Telecom Challenge 2026 (Desafío 02: Personalización Comercial Inteligente)**, impulsado por **Telefónica del Perú (Movistar)**, la **Universidad de Lima** y **Lenovo ISG**.

El propósito de la solución es transformar el modelo comercial de reactivo a proactivo y personalizado: recomendando la **Mejor Oferta Comercial (Next Best Offer - NBO)** para cada cliente, determinando el **canal óptimo de contacto**, estimando la **probabilidad de aceptación**, y diseñando estrategias de **rebate** y **explicabilidad comercial**, con foco prioritario en la convergencia de **Movistar Total (MT)**.

---

## 📁 Estructura del Repositorio ([Cookiecutter Data Science](https://cookiecutter-data-science.drivendata.org/))

```
├── data/
│   ├── external/               <- Datos de fuentes externas o de terceros (.gitkeep).
│   ├── interim/                <- Datos intermedios transformados durante preprocesamiento (.gitkeep).
│   ├── processed/              <- Datasets finales listos para modelado e inferencia.
│   │   └── scoring_top3_predictivo.csv  <- Salida con el ranking Top-3 por cliente.
│   └── raw/                    <- Datos crudos e inmutables del desafío.
│       ├── catalogo_ofertas_entrega.csv <- Catálogo de 22 ofertas comerciales.
│       ├── dataset_clientes.csv         <- 100,000 clientes con historial de 6 meses.
│       └── historial_campanias.csv      <- 300,112 interacciones de campañas pasadas.
│
├── docs/                       <- Documentación técnica, metodológica y de negocio.
│   ├── business_context.md     <- Marco contextual del hackathon, plataformas y visión estratégica.
│   ├── data_dictionary.md      <- Diccionario de datos exhaustivo (esquemas, claves y tipos).
│   ├── eda_findings.md         <- Hallazgos clave del Análisis Exploratorio de Datos.
│   ├── model_documentation.md  <- Arquitectura del modelo predictivo y pipeline de scoring.
│   ├── nbo_strategy.md         <- Estrategia NBO, reglas de negocio y lógica de rebate.
│   └── output_modelo.pdf       <- Reporte ejecutivo y visualizaciones de resultados.
│
├── EDA/                        <- [INMUTABLE] Notebooks con el flujo de análisis exploratorio.
│   ├── EDA_clientes.ipynb      <- Análisis demográfico y de comportamiento de clientes.
│   ├── EDA_catalogo_ofertas.ipynb <- Análisis del portafolio y precios de ofertas.
│   ├── EDA_campañas.ipynb      <- Análisis de conversión por canal y campaña histórica.
│   └── EDA_integrado_target.ipynb <- Análisis integrado y elegibilidad a Movistar Total.
│
├── Modelo/                     <- Artefactos del modelo entrenado y serializado.
│   └── inferencia_modelo.py    <- Script auxiliar de inferencia y evaluación.
│
├── inferencia_modelo.py        <- [INMUTABLE] Módulo principal para cálculo de scoring de aceptación.
├── requirements.txt            <- Dependencias de Python requeridas para ejecutar el proyecto.
├── AGENTS.md                   <- Guía operativa y reglas inmutables para agentes autónomos.
└── README.md                   <- Documento principal de bienvenida y guía del repositorio.
```

---

## 📚 Índice de Documentación

| Documento | Descripción |
| :--- | :--- |
| [🏢 Marco Contextual del Negocio](docs/business_context.md) | Dolores operativos, plataformas (DITO/Visor), metas comerciales de MT (>50% hogar, >10% móvil) y criterios del jurado. |
| [📖 Diccionario de Datos](docs/data_dictionary.md) | Detalle columna por columna de los datasets en `data/raw/` y `data/processed/`. |
| [📊 Hallazgos EDA](docs/eda_findings.md) | Insights extraídos de los 100k clientes, 300k campañas y catálogo de ofertas. |
| [🤖 Documentación del Modelo](docs/model_documentation.md) | Detalle de variables (33 features), pipeline probabilístico y métricas de desempeño. |
| [🎯 Estrategia NBO y Rebate](docs/nbo_strategy.md) | Priorización de Movistar Total, orquestación de canales, reglas de no-canibalización y contingencia. |
| [🤖 Directrices para Agentes (AGENTS.md)](AGENTS.md) | Restricciones inmutables (no tocar EDA ni inferencia), roadmap y mejores prácticas para asistentes AI. |

---

## ⚙️ Instalación y Configuración

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd hacka_movistar

# 2. Crear y activar el entorno virtual
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows PowerShell
# source venv/bin/activate    # Linux / macOS

# 3. Instalar dependencias
pip install -r requirements.txt
```

---

## ⚡ Uso del Pipeline de Inferencia

```python
import pandas as pd
from inferencia_modelo import calcular_score

# 1. Cargar datos de clientes con las 33 columnas requeridas
datos_evaluacion = pd.read_csv("data/raw/dataset_clientes.csv")

# 2. Ejecutar scoring probabilístico
resultado = calcular_score(datos_evaluacion, ruta_modelo="Modelo/modelo_logistico_final.joblib")

# 3. Obtener probabilidades estimadas
print(resultado[["cliente_id", "score_aceptacion"]].head())
```

---

## 🎯 Impacto en el Negocio

- **Incremento en Ventas y Conversión:** Reducción de fatiga de contacto y aumento de la tasa de aceptación.
- **Penetración Convergente (MT):** Impulso hacia la meta de >50% en ventas hogar y >10% en ventas móviles con Movistar Total.
- **Reducción de Churn y Aumento de ARPU:** Mayor retención y fidelización de clientes de alto valor.
- **Empoderamiento del Asesor:** Herramienta ágil y explicable lista para integrarse con **DITO** y **Visor**.