# 🤖 Documentación del Modelo Predictivo y Pipeline de Inferencia

Este documento describe la arquitectura, variables, preprocesamiento y uso del modelo de propensión para la recomendación **Next Best Offer (NBO)** y la priorización de **Movistar Total**.

---

## 1. Arquitectura y Enfoque del Modelo

- **Objetivo Predictivo:** Predecir la probabilidad de aceptación $\hat{P}(\text{Aceptación} = 1 \mid \text{Cliente, Oferta, Canal})$ sobre el universo de ofertas primarias (sin rebates).
- **Objetivo de Optimización (Ranking):** Ordenar por **Valor Esperado Económico**, maximizando el ingreso capturado: $\text{EV} = \hat{P}(\text{Aceptación}) \times \text{precio\_mensual}$.
- **Tipo de Algoritmo:** Modelo de clasificación probabilística (Regresión Logística Calibrada / LightGBM) optimizado para inferencia rápida.
- **Artefacto de Serialización:** `modelo_propension_v2_candidato.joblib` (versión `v2_generalizable_31`).

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
df_scored = calcular_score(datos_evaluar, ruta_modelo="Modelo/modelo_propension_v2_candidato.joblib")
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
2. Se transforma la probabilidad pura a **Valor Esperado (EV)** usando la tarifa (`precio_mensual`). El score base para ranking en el motor adopta una escala $0-1$ mediante la constante de normalización: $\text{Score}_{EV} = \hat{P} \times (\text{precio\_mensual} / 200.0)$.
3. Se aplican reglas de negocio (priorización de Movistar Total para clientes `elegible_mt = True`, y penalizaciones operativas).
4. Se seleccionan las **3 mejores ofertas** ordenadas por el Score EV ajustado.
5. Se asigna el **canal sugerido de contacto** y la estrategia de **rebate** en caso de rechazo.

---

## 5. Próximos Pasos: Inferencia de Contactabilidad Multicanal (Fase 2)

Actualmente la orquestación asume canales fijos por reglas históricas (`canal_mas_usado`). En la siguiente iteración se incorporará:
- **Modelo Predictivo de Canal:** $P(\text{contactado} \mid \text{cliente}, \text{canal})$.
- **Artefacto Independiente:** Un joblib propio de contactabilidad que permitirá pre-seleccionar $\arg\max_{\text{canal}} P$ antes de ejecutar el scoring de propensión.
