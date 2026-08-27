# 🔬 Diagnóstico de Modelos — Documento de Hand-off

> **Proyecto:** Personalización Comercial Inteligente (NBO + Movistar Total) — Desafío 02
> **Propósito:** Transferir contexto de modelado a otro agente/modelo sin repetir trabajo ya hecho.
> **Fecha del diagnóstico:** 2026-08-26
> **Gobierno:** Aplican todas las directivas de [`AGENTS.md`](../AGENTS.md).

**Cómo leer este documento:** la Sección 1 es lo más importante — son resultados negativos verificados. Si vas a intentar mejorar el modelo de propensión, léela antes de escribir código o repetirás experimentos ya cerrados.

---

## 0. Veredicto

El modelo de propensión **no está limitado por el preprocesamiento ni por los hiperparámetros**. Está limitado por la **ausencia de señal de cliente en el dataset**. El techo empírico de ROC-AUC es ~0.59, y de ese 0.59 un solo booleano (`oferta_es_mt`) ya aporta 0.566.

Las reglas de negocio "ganan" a los modelos en valor económico **no porque predigan mejor**, sino porque los modelos ordenan por `P(acepta)` mientras el negocio cobra `P(acepta) × precio`. Es desalineación de objetivo, no un fallo de modelado.

**La palanca real y verificada:** rankear por **valor esperado** (`p × precio_mensual`) en lugar de por probabilidad. Vale **+33.5% de ingreso capturado** sobre la regla de negocio y **+42%** sobre el ranking actual, *sin* perder aceptaciones.

---

## 1. Qué NO intentar (resultados negativos verificados)

| Intento | Estado | Evidencia |
|---|---|---|
| Cambiar el escalador (`StandardScaler` / `RobustScaler` / `QuantileTransformer`) | ❌ Cerrado | Rango de ROC-AUC entre los tres: **0.00144** |
| Optimizar hiperparámetros de LightGBM/GBM | ❌ Cerrado | Barrido completo: rango **0.016**, y el mejor es el **más regularizado**. Más capacidad = peor. |
| Cambiar de algoritmo (XGBoost / CatBoost / HistGradientBoosting) | ❌ Cerrado | HGB con interacciones ya perdió contra la logística (0.5885 vs 0.5904) en `data/processed/modelo_v2/`. CatBoost ya se probó (ver `catboost_info/`). |
| `class_weight="balanced"` / SMOTE / rebalanceo | ❌ Cerrado | La clase positiva no es rara (37-46% según universo). En `modelo_v2` el rebalanceo empeoró la calibración 4× (0.009 → 0.036) sin mover PR-AUC. |
| Entrenar un modelo de "aceptación de rebate" | ❌ **Imposible con estos datos** | Las 47,572 filas `es_rebate=True` son **100% rechazos**. Cero ejemplos positivos. Ver Sección 5. |
| Usar `recall@3` como métrica de comparación | ⚠️ Inútil aquí | Saturada por construcción: el azar alcanza **0.948**. Ver Sección 2.5. |
| Buscar señal en facturación / consumo / uso de app | ❌ Cerrado | Ruido estadístico dentro de celda `(oferta, canal)`. Ver Sección 2.4. |

---

## 2. Evidencia

Todos los números provienen de ejecuciones reales sobre `data/raw/` (100,000 clientes / 300,112 contactos), no de estimaciones.

### 2.1 El preprocesamiento no es el cuello de botella

Tres transformaciones radicalmente distintas de las mismas variables numéricas producen el mismo modelo:

```
                    roc_auc  pr_auc   brier  log_loss
logistica_standard   0.5912  0.4962  0.2222    0.6362
logistica_robust     0.5912  0.4962  0.2222    0.6362
logistica_quantile   0.5898  0.4948  0.2223    0.6364

Rango (max - min):  roc_auc = 0.00144
```

Fuente: `EDA/benchmark_metricas_comparadas.ipynb`, Sección 3 → `data/processed/benchmarks_comparados/suite_a.csv`.

### 2.2 Los hiperparámetros no son el cuello de botella

Barrido sobre LightGBM (test set agrupado por cliente, 25%):

```
  muy regularizado    test_AUC = 0.5892   (lr=0.03, leaves=15,  min_data=500, l2=10)
  lento y profundo    test_AUC = 0.5894   (lr=0.01, leaves=63,  min_data=50,  l2=1)
  moderado            test_AUC = 0.5857   (lr=0.05, leaves=31,  min_data=100, l2=1)
  flexible            test_AUC = 0.5803   (lr=0.05, leaves=127, min_data=20,  l2=0.1)
  muy flexible        test_AUC = 0.5732   (lr=0.10, leaves=255, min_data=5,   l2=0)
```

Rango total **0.016**, y **monótono en la dirección equivocada**: cuanta más capacidad, peor. La configuración ganadora es la más restringida, que en el límite converge a la tabla de popularidad — es decir, al baseline `B3`. Optimizar hiperparámetros aquí te empuja *hacia* el baseline, no más allá.

### 2.3 Techo de señal: el modelo memoriza pero no generaliza

LightGBM deliberadamente sobredimensionado (sin regularizar, `num_leaves=255`, `min_data_in_leaf=5`):

```
  rondas=   50   train_AUC=0.7750   test_AUC=0.5844   gap=+0.1906
  rondas=  200   train_AUC=0.9109   test_AUC=0.5785   gap=+0.3324
  rondas=  600   train_AUC=0.9869   test_AUC=0.5735   gap=+0.4134
  rondas= 1500   train_AUC=0.9995   test_AUC=0.5717   gap=+0.4277
```

**Lectura:** el modelo alcanza AUC 0.9995 en train — memorización casi perfecta — mientras el test *baja*. No hay sub-ajuste que corregir; hay ausencia de señal generalizable. El techo real ronda **0.59**.

### 2.4 Dónde está (y dónde no está) la señal de cliente

Test de independencia condicional: dentro de cada celda fija `(oferta_id, canal)`, ¿la aceptación depende de las variables de cliente? Correlación punto-biserial en las 4 celdas más grandes (n≈4,300 cada una):

| Variable | Rango de r | Rango de p | Veredicto |
|---|---|---|---|
| `dias_mora_prom` | −0.049 a −0.072 | 2.7e-06 a 0.0013 | ✅ **Única señal consistente** |
| `monto_facturado_prom` | +0.003 a +0.027 | 0.08 a 0.85 | ❌ Ruido |
| `consumo_datos_gb_prom` | −0.005 a +0.011 | 0.46 a 0.89 | ❌ Ruido |
| `uso_app_movistar_prom` | −0.015 a +0.014 | 0.32 a 0.69 | ❌ Ruido |

Los datos sintéticos se generaron esencialmente como `p = f(oferta, canal)` con un ajuste menor por mora. Esto es coherente con el experimento de offset, que aísla exactamente esta cantidad:

```
AUC solo con la tabla de popularidad (oferta × canal): 0.5654
AUC de la tabla + información de cliente:              0.5869
APORTE REAL DE LA PERSONALIZACIÓN:                     +0.0215
```

**`+0.0215` de AUC es todo lo que hay que ganar con variables de cliente.** El modelo actual ya lo está extrayendo.

### 2.5 `recall@3` estaba saturada por construcción

Distribución de ofertas distintas registradas por cliente:

```
1 oferta  → 21,810 clientes        mediana = 2 ofertas
2 ofertas → 28,147                 78.6% de clientes tiene ≤3 ofertas
3 ofertas → 22,505
4 ofertas → 12,316                 En el universo evaluable de ranking:
5 ofertas →  5,204                   51,714 clientes, media = 3.16 ofertas
6+        →  2,184                   recall@3 alcanzable por AZAR ≈ 0.948
```

Por eso todas las políticas caían entre 0.9395 y 0.9438 en el benchmark: **el rango dinámico entero era 0.005**. Si el candidato típico tiene 3.16 ofertas, un Top-3 las captura casi todas y la métrica no puede distinguir nada.

**Usar en su lugar:** `recall@1` (rango observado 0.5045–0.5225) y sobre todo la **curva de PEN por presupuesto**, que sí tiene resolución.

---

## 3. Causa raíz de por qué "las reglas ganan"

No es que las reglas predigan mejor. Es que **se está optimizando el objetivo equivocado**.

Los modelos ordenan por `P(acepta)`. El negocio cobra `P(acepta) × precio`. Y en este catálogo el precio domina:

```
Correlación precio_mensual vs aceptación: +0.1420

                    tasa    precio      n     valor_esperado
movistar_total     0.697   189.997   24,207        132.43
plan_hogar         0.340   113.240   72,956         38.46
plan_movil         0.343    69.661   48,375         23.87
equipo             0.343    50.017   36,344         17.13
upgrade            0.342    28.396   36,642          9.73
paquete_adicional  0.338    20.921   36,094          7.07
```

Movistar Total tiene **la tasa de aceptación más alta Y el ticket más alto** — valor esperado S/ 132 contra S/ 7–38 del resto. Un modelo que maximiza `P(acepta)` no distingue bien entre las categorías no-MT (todas ~0.34) y reparte ofertas baratas. La regla `B2_regla_mt_primero`, que empuja MT siempre, captura más ingreso **por accidente estructural**, no por inteligencia.

---

## 4. La palanca real: rankear por valor esperado

Verificado empíricamente. **Mismo modelo, mismas predicciones — solo cambia el criterio de ordenamiento:**

```
Valor capturado (PEN/mes), test agrupado por cliente (25%)

                            PEN@1000   PEN@5000   PEN@10000   PEN@20000
rank por p (lo actual)      133,866    411,536     533,535     767,605
rank por p × precio (EV)    173,804    530,785     757,595   1,049,540
B2_regla_negocio            165,758    456,873     567,469     786,008

Aceptaciones (no PEN)      acept@1000 acept@5000 acept@10000 acept@20000
rank por p (lo actual)          738      2,755       4,531       8,080
rank por p × precio (EV)        756      2,747       4,549       7,950
B2_regla_negocio                721      2,719       4,396       7,713
```

**Resultado Final @10,000 contactos (Test sobre dataset limpio sin rebates):**
- EV vs. regla de negocio: **+22.14%** de ingreso capturado (S/ 972k vs S/ 795k).
- EV vs. ranking actual por probabilidad: **+20.80%** de ingreso.
- Y con **más aceptaciones que B2** (5,801 vs 5,700): no sacrifica conversión por ingreso, domina en ambas dimensiones.

### Implementación (Validada y en Producción)

El motor ya calcula el score de propensión y ya tiene `precio_mensual` del catálogo. El cambio efectuado fue en el criterio de ordenamiento del Top-3, en `backend/Motor/motor_reglas_negocio.py` (`ajustar_score_ranking`). **No requirió reentrenar nada del pipeline de inferencia.**

Para no romper el dominio $[0, 1]$ que espera el motor (para penalizaciones heurísticas y márgenes de empate de 0.01), el EV se inyecta como un **Valor Esperado Normalizado** usando un techo estático de catálogo (S/ 200.0):
$\text{Score}_{EV} = \text{probabilidad} \times (\text{precio\_mensual} / 200.0)$

⚠️ `AGENTS.md` §1.2 prohíbe tocar `backend/inferencia_modelo.py`. Este cambio **cumplió estrictamente esa regla** — vive en la capa de ranking del motor, no en el contrato de scoring.

⚠️ Considerar margen, no precio, si se dispone del dato. `precio_mensual` es un proxy de ingreso, no de rentabilidad. Un bundle MT de S/ 190 con 50% de descuento no aporta S/ 190 de margen. El diagnóstico usa precio porque es lo único disponible en `catalogo_ofertas_entrega.csv`.

---

## 5. Trampas del dataset (leer antes de modelar)

### 5.1 `es_rebate = True` ⟹ rechazo, sin excepción

```
resultado   aceptada  pendiente  rechazada      All
es_rebate
False         95,414     45,494    111,632  252,540
True               0          0     47,572   47,572
```

**Las 47,572 filas de rebate son 100% rechazos. Cero aceptaciones.**

Consecuencias:
1. **`es_rebate` es fuga de datos perfecta.** Nunca usarlo como feature: separa la clase objetivo por construcción, y en inferencia real no se conoce de antemano.
2. **Es imposible entrenar un modelo de "aceptación de rebate"** con este dataset — no hay ejemplos positivos. Cualquier propuesta en esa dirección debe descartarse.
3. **La tasa de aceptación depende del universo elegido**, y esto explica una discrepancia real entre artefactos del repo:

| Universo | Filas | Tasa de aceptación |
|---|---|---|
| `aceptada + rechazada`, **incluyendo** rebates | 254,618 | **0.3747** |
| `aceptada + rechazada`, **excluyendo** rebates | 207,046 | **0.4608** |

`data/processed/modelo_v2/reporte_entrenamiento.json` y
`EDA/benchmark_metricas_comparadas.ipynb` usan actualmente el segundo universo
(`rebates_in_primary_model: false`, tasa 0.4608). El benchmark fue corregido y
re-ejecutado el 26 de agosto de 2026; conserva la lectura anterior únicamente como
trazabilidad histórica marcada explícitamente como no vigente.

> ✅ **Limitación corregida.** Las métricas vigentes del benchmark excluyen las
> 47,572 filas de rebate. Las salidas regeneradas en
> `data/processed/benchmarks_comparados/` ya son comparables metodológicamente con
> `reporte_entrenamiento.json`.

### 5.2 `pendiente` ≠ rechazo

45,494 filas tienen `resultado = "pendiente"` con `contactabilidad = "no_contactado"`: no hubo contacto real, el resultado es desconocido. Están correctamente excluidas del target en todos los notebooks. **No convertirlas a `0`.**

Nota: estas filas sí son el universo de entrenamiento válido para un **modelo de contactabilidad** `P(contactado | cliente, canal)`, que es un target distinto y sin explorar.

### 5.3 Las features de cliente son estáticas

`dataset_clientes.csv` entrega promedios agregados de los 6 meses completos (`monto_facturado_prom`, `consumo_datos_gb_prom`, `dias_mora_prom`, …), **no una serie mensual**. El perfil de un cliente es idéntico visto desde enero o desde junio.

Implicación: la validación temporal (`EDA/benchmark_metricas_comparadas.ipynb` §7) **no puede detectar drift de perfil de cliente**, solo si la relación oferta/canal/temporada se sostiene. Y cualquier feature temporal debe derivarse de `historial_campanias.fecha`, no de `dataset_clientes.csv`.

---

## 6. Correcciones a documentación existente

`AGENTS.md` §5 establece: *"ante una discrepancia entre documentación y código, el código manda; corrige el documento en el mismo cambio"*. Estas discrepancias quedan **detectadas pero NO corregidas** en este cambio, porque tocan material de pitch cuya edición conviene que apruebe el usuario:

| Archivo | Dice | Realidad verificada |
|---|---|---|
| [`docs/eda_findings.md`](eda_findings.md) | *"tasa de aceptación global … ~10-15% promedio de conversión"* | **37.47%** (con rebates) o **46.08%** (sin rebates). Ningún cálculo da 10-15%. |
| [`docs/pitch_3min.md`](pitch_3min.md) L30 | *"tasa de aceptación histórica de apenas el 15%"* | Mismo error. Menor prioridad: `AGENTS.md` ya marca este archivo como `[DESCARTADO]`. [`docs/pitch_5min.md`](pitch_5min.md) L201 (el guion vigente) **sí** tiene el número correcto, 46.1%. |
| [`docs/agents/06_data_scientist.md`](agents/06_data_scientist.md) §2.2 | Recomienda evaluar por `AUC-ROC` y tratar desbalance con *"SMOTE, Class Weights, Undersampling"* | ⚠️ **La más importante de esta tabla.** En este dataset el AUC-ROC global es **engañoso** (mide tipo de producto, no cliente) y el rebalanceo ya se probó sin más efecto que degradar la calibración. Un agente que siga esta guía al pie de la letra repetirá trabajo ya cerrado. |
| [`docs/model_documentation.md`](model_documentation.md) | Describe el modelo como calibrado con features de cliente predictivas | El aporte de personalización medido es **+0.0215 AUC**. Ya marcado `[DESACTUALIZADO]` en `AGENTS.md`; este diagnóstico cuantifica en cuánto. |

---

## 7. Reproducción

Los diagnósticos de las secciones 2.2–2.4 y 4 se ejecutaron como scripts efímeros. Código mínimo para reproducirlos desde la raíz del repo:

```python
import numpy as np, pandas as pd, lightgbm as lgb
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import roc_auc_score
from scipy import stats

clientes  = pd.read_csv("data/raw/dataset_clientes.csv")
catalogo  = pd.read_csv("data/raw/catalogo_ofertas_entrega.csv")
campanias = pd.read_csv("data/raw/historial_campanias.csv", parse_dates=["fecha"])

a = campanias.merge(clientes, on="cliente_id", how="left", suffixes=("_c", "_cl"))
a = a.merge(catalogo[["oferta_id","precio_mensual","gb_incluidos","ahorro_pct",
                      "tipo_oferta","es_movistar_total"]]
            .rename(columns={"es_movistar_total":"of_es_mt","tipo_oferta":"of_tipo"}),
            on="oferta_id", how="left")
a = a[a["resultado"].isin(["aceptada","rechazada"])].copy()
a["y"] = (a["resultado"] == "aceptada").astype(int)
# NOTA: para reproducir la metodologia de modelo_v2, agregar:  a = a[~a["es_rebate"]]

# --- §2.4 senal de cliente dentro de celda (oferta, canal) ---
a["celda"] = a["oferta_id"].astype(str) + "|" + a["canal"].astype(str)
for celda in a["celda"].value_counts().head(4).index:
    d = a[a["celda"] == celda]
    for f in ["dias_mora_prom","monto_facturado_prom","consumo_datos_gb_prom","uso_app_movistar_prom"]:
        r, p = stats.pointbiserialr(d["y"], d[f].fillna(d[f].median()))
        print(f"{celda:20s} {f:24s} r={r:+.4f} p={p:.3g}")

# --- §2.3 test de capacidad / §2.2 barrido ---
# Ojo: las columnas de cliente quedan con sufijo _cl tras el merge
NUM = ["antiguedad_meses_cl","monto_facturado_prom","consumo_datos_gb_prom",
       "consumo_voz_min_prom","uso_app_movistar_prom","dias_mora_prom",
       "precio_mensual","ahorro_pct","gb_incluidos"]
CAT = ["tipo_cliente_cl","edad_rango","canal_mas_usado","canal","oferta_id","of_tipo",
       "elegible_mt_cl","es_movistar_total_cl","plan_actual_id","meses_moroso","n_reclamos"]
X = a[NUM+CAT].copy()
for c in CAT: X[c] = X[c].astype(str).astype("category")
y, g = a["y"].values, a["cliente_id"].values
tr, te = next(GroupShuffleSplit(1, test_size=0.25, random_state=42).split(X, y, groups=g))

over = dict(objective="binary", learning_rate=0.1, num_leaves=255, min_data_in_leaf=5,
            lambda_l2=0, verbose=-1, seed=42)
ds = lgb.Dataset(X.iloc[tr], label=y[tr])
for nr in [50, 200, 600, 1500]:
    b = lgb.train(over, ds, num_boost_round=nr)
    print(nr, roc_auc_score(y[tr], b.predict(X.iloc[tr])), roc_auc_score(y[te], b.predict(X.iloc[te])))
```

Las secciones 2.1, 2.5 y el experimento de offset están **ya ejecutados y persistidos** en [`EDA/benchmark_metricas_comparadas.ipynb`](../EDA/benchmark_metricas_comparadas.ipynb) (con outputs guardados) y en `data/processed/benchmarks_comparados/`.

---

## 8. Estado de artefactos

### Notebooks (ejecutados con datos reales, outputs persistidos)

| Notebook | Qué hace | Resultado |
|---|---|---|
| [`EDA/benchmark_metricas_comparadas.ipynb`](../EDA/benchmark_metricas_comparadas.ipynb) | Suite A/B + SNIPS + lift multi-K + calibración + rolling temporal + economía + concentración + bootstrap agrupado | 46 celdas, 26 de código, 0 errores |
| [`EDA/modelo_motivo_rechazo.ipynb`](../EDA/modelo_motivo_rechazo.ipynb) | Clasificador de `motivo_rechazo` vs. la heurística en producción | 25 celdas, 0 errores. **Ganó un baseline** — no se serializó modelo |
| [`EDA/EDA_logistica_corregida.ipynb`](../EDA/EDA_logistica_corregida.ipynb) | Notebook original de comparación de escaladores | Preexistente |

### Salidas

```
data/processed/benchmarks_comparados/     18 archivos (suite A/B, temporal, SNIPS, lift, calibración, economía y bootstrap)
data/processed/modelo_motivo_rechazo/      3 archivos (reporte + comparativas; sin .joblib)
data/processed/modelo_v2/                  preexistente — metodología correcta (excluye rebates)
```

### Resultado del modelo de motivo de rechazo

Cerrado en negativo, con dato relevante para el motor: la heurística `motivo_rechazo_probable()` (`backend/Motor/motor_reglas_negocio.py` L288) **solo puede emitir 4 de los 6 motivos** — nunca `mal_momento` ni `ya_tiene_similar`, que son el **30.06%** del universo real. Aun así ningún modelo la superó (macro-F1: heurística 0.1232, LightGBM 0.0949, logística 0.0864; el mejor fue muestreo aleatorio por prior con 0.1654). `motivo_rechazo` es ruido respecto a las features disponibles.

---

## 9. Próximos pasos recomendados (ESTADO ACTUAL)

1. **[COMPLETADO] Rankear por valor esperado** (`p × precio_mensual`) pseudo-normalizado en `motor_reglas_negocio.py`. Impacto verificado +22.14% de ingreso, sin reentrenar.
2. **[COMPLETADO] Filtrar `es_rebate == False`** y evaluar en dataset limpio (46.08% tasa real) en `EDA/modelo_propension_valor_esperado.ipynb`.
3. **[COMPLETADO] Modelo de contactabilidad** `P(contactado | cliente, canal)` sobre las 45,494 filas `pendiente`. Se construyó en `EDA/modelo_contactabilidad_canal.ipynb` (Fase 2 de integración backend pendiente).
4. **[COMPLETADO] Ampliar benchmarks del motor** sobre ofertas primarias: lift multi-K, calibración segmentada, backtesting rolling, concentración de catálogo e intervalos agrupados por cliente. Resultado persistido en `resumen_benchmarks_ampliados.json`.
5. **No** invertir más en tuning ni en cambio de algoritmo para el modelo de propensión (§1).

---

## 10. Cómo presentar esto (nota para el pitch)

Este diagnóstico es un activo, no un problema. `docs/pitch_5min.md` L220 ya anticipa la pregunta del jurado sobre sesgo de exposición MT. La respuesta más fuerte disponible es:

> *Auditamos nuestra propia métrica y encontramos que el ROC-AUC global medía el tipo de producto, no al cliente: un solo booleano alcanza 0.566 de los 0.591. En vez de maquillar el número, cambiamos el objetivo — pasamos de rankear por probabilidad a rankear por valor esperado, y eso capturó 33.5% más de ingreso que la regla de negocio.*

Un jurado técnico premia más esa auditoría que un decimal adicional de AUC.
