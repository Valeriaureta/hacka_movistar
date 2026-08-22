# Experimento de mejora del modelo de propensión V2

## Objetivo

Mejorar la estimación:

```text
cliente + oferta + canal → probabilidad de aceptación
```

sin cambiar el contrato de 33 columnas de `inferencia_modelo.py` y sin modificar los notebooks de `EDA/`.

## Diagnóstico del supuesto desbalance

El historial contiene:

| Segmento | Aceptadas | Rechazadas | Tasa de aceptación |
| :--- | ---: | ---: | ---: |
| Total contactado y cerrado | 95,414 | 159,204 | 37.47% |
| Oferta principal, sin rebates | 95,414 | 111,632 | 46.08% |
| Ofertas MT | 16,872 | 7,335 | 69.70% |
| Ofertas no-MT | 78,542 | 151,869 | 34.09% |

La clase positiva no es extremadamente minoritaria. MT tampoco tiene más aceptaciones en cantidad absoluta; tiene una tasa de aceptación mucho mayor porque fue ofrecido bajo una selección histórica distinta.

Por ello, **SMOTE no es la solución principal**. El sobremuestreo sintético puede duplicar patrones existentes, pero no crea el contrafactual de qué habría ocurrido si al mismo cliente se le hubiera presentado otra oferta.

## Cambios del experimento

1. Se usan únicamente clientes contactados con resultado cerrado.
2. Se excluyen rebates del modelo de oferta principal.
3. El Test se reserva por cliente y permanece cerrado por defecto.
4. La selección se realiza con `GroupKFold` de cinco folds dentro de Train.
5. Se comparan cinco candidatos:
   - Baseline con las 33 entradas.
   - Sin `monto_facturado_prom_6m`, redundante con la facturación actual.
   - Sin `oferta_id`, para medir generalización mediante atributos de la oferta.
   - Con pesos balanceados, únicamente como diagnóstico.
   - HistGradientBoosting, para probar interacciones no lineales entre cliente, oferta y canal.
6. Se evalúan PR-AUC, ROC-AUC, Brier, log loss, calibración y lift Top-10%.
7. Se reportan métricas separadas por canal, tipo de oferta y MT/no-MT.

## Por qué no se generan datos sintéticos

- Una aceptación sintética no demuestra que el cliente habría aceptado una oferta no presentada.
- El principal problema es el sesgo de exposición, no la escasez de positivos.
- SMOTE sobre variables one-hot puede crear combinaciones difíciles de interpretar.
- Alterar la prevalencia empeora la interpretación probabilística si no se recalibra.

La solución real al sesgo de exposición requiere campañas históricas más comparables, exploración controlada o datos reales del nuevo funnel.

## Ejecución

```bash
python Modelo/entrenamiento_modelo_v2.py
```

El comando selecciona un candidato usando solamente Train y genera:

```text
Modelo/modelo_propension_v2_candidato.joblib
data/processed/modelo_v2/comparacion_candidatos.csv
data/processed/modelo_v2/metricas_segmentos.csv
data/processed/modelo_v2/reporte_entrenamiento.json
```

El Test reservado solo debe abrirse después de congelar la decisión:

```bash
python Modelo/entrenamiento_modelo_v2.py --open-test
```

## Resultado obtenido

El candidato seleccionado fue la regresión logística generalizable. Conserva
el contrato de 33 entradas, pero el pipeline utiliza internamente 31: retira
`oferta_id` y `monto_facturado_prom_6m`.

| Evaluación | PR-AUC | ROC-AUC | Brier | Lift Top-10% |
| :--- | ---: | ---: | ---: | ---: |
| Validación cruzada de Train | 0.5796 | 0.5912 | 0.2365 | 1.6811 |
| Test reservado por cliente | 0.5736 | 0.5908 | 0.2359 | 1.6953 |

El Test se abrió una sola vez después de congelar el candidato. La cercanía
entre validación y Test indica estabilidad, pero la discriminación continúa
siendo moderada. No se debe presentar este resultado como un gran aumento de
performance frente al modelo anterior porque cambió correctamente el universo:
el V2 excluye los rebates del target de oferta principal.

El modelo con pesos balanceados no mejoró PR-AUC y empeoró la calibración. El
modelo no lineal tampoco mejoró el ranking. Por tanto, aumentar complejidad o
crear positivos sintéticos no resuelve la limitación observada.

El artefacto generado es deliberadamente un candidato y no reemplaza el modelo
desplegado:

```text
Modelo/modelo_propension_v2_candidato.joblib
```

La siguiente mejora con mayor potencial requiere datos reales del funnel:
oferta efectivamente presentada, canal, momento, respuesta y snapshot de las
variables disponible antes del contacto.

El seguimiento de ingeniería de variables se encuentra en
[`modelo_v2_variables_derivadas.md`](modelo_v2_variables_derivadas.md).

## Limitación pendiente

El dataset de clientes contiene agregados de varios meses y no snapshots fechados antes de cada ofrecimiento. El experimento puede diagnosticar el problema, pero no eliminar completamente el posible leakage temporal sin una nueva fuente de datos.
