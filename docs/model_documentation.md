# 🤖 Documentación del Modelo Predictivo y Pipeline de Inferencia

Este documento describe la arquitectura, variables, preprocesamiento y uso del modelo de propensión para la recomendación **Next Best Offer (NBO)** y la priorización de **Movistar Total**.

---

## 1. Arquitectura y Enfoque del Modelo

- **Objetivo:** Predecir la probabilidad condicional de aceptación $P(\text{Aceptación} = 1 \mid \text{Cliente, Oferta, Canal})$ para cualquier par $(\text{Cliente}_i, \text{Oferta}_j)$ disponible en el catálogo.
- **Tipo de Algoritmo:** Modelo de clasificación probabilística (Regresión Logística / Gradient Boosting / XGBoost) calibrado para inferencia rápida a escala sobre el universo de clientes.
- **Artefacto de Serialización:** `modelo_logistico_final.joblib` (compatible con `scikit-learn` y `joblib`).

---

## 2. Variables del Modelo (Feature Store)

El modelo integra variables del perfil del cliente, atributos de la oferta a evaluar y contexto de interacción:

### Variables Numéricas (11 features)
- `antiguedad_meses`: Tiempo de permanencia del cliente.
- `monto_facturado_prom`: Facturación mensual actual.
- `consumo_datos_gb_prom`: Tráfico mensual de datos.
- `consumo_voz_min_prom`: Minutos de voz mensuales.
- `consumo_sms_prom`: Mensajería SMS.
- `uso_app_movistar_prom`: Frecuencia de sesiones en app móvil.
- `monto_facturado_prom_6m`: Histórico semestral de facturación.
- `dias_mora_prom`: Promedio de retraso en pagos.
- `precio_mensual`: Tarifa de la oferta evaluada.
- `ahorro_pct`: Porcentaje de ahorro ofrecido.
- `gb_incluidos_modelo`: Capacidad de datos de la oferta.

### Variables Categóricas y Boleanas (22 features)
- Perfil cliente: `tipo_cliente`, `tiene_movil`, `tiene_hogar`, `oferta_hogar_id`, `tiene_internet_hogar`, `es_movistar_total`, `elegible_mt`, `plan_actual_id`, `edad_rango`, `ubicacion_departamento`, `es_usuario_app`, `meses_moroso`, `n_reclamos`, `n_actividad_canal`, `canal_mas_usado`.
- Atributos oferta / canal: `oferta_id`, `canal`, `tipo_oferta`, `oferta_es_mt`, `segmento_objetivo`, `cluster_hogar`, `oferta_ilimitada`.

---

## 3. Pipeline de Inferencia (`inferencia_modelo.py`)

El módulo `inferencia_modelo.py` encapsula la función de scoring:

```python
from inferencia_modelo import calcular_score
import pandas as pd

# datos_evaluar contiene la combinación de clientes y ofertas
df_scored = calcular_score(datos_evaluar, ruta_modelo="Modelo/modelo_logistico_final.joblib")
# Retorna el DataFrame con la columna agregada 'score_aceptacion'
```

### Validaciones Internas del Pipeline
1. **Comprobación de Schema:** Verifica que existan todas las 33 columnas requeridas (`COLUMNAS_MODELO`).
2. **Casting de Tipos Categóricos:** Asegura que los valores nulos y cadenas se formateen consistentemente según el preprocesamiento de entrenamiento.
3. **Cálculo Vectorizado de Probabilidades:** Invoca `predict_proba` para estimar la probabilidad de la clase positiva (índice 1).

---

## 4. Generación del Ranking Top-3 (`data/processed/scoring_top3_predictivo.csv`)

Para cada cliente:
1. Se evalúa su probabilidad de aceptación frente a todas las ofertas válidas del catálogo.
2. Se aplican reglas de negocio (priorización de Movistar Total para clientes `elegible_mt = True`).
3. Se seleccionan las **3 mejores ofertas** ordenadas por score de propensión y valor esperado.
4. Se asigna el **canal sugerido de contacto** y la estrategia de **rebate** en caso de rechazo.
