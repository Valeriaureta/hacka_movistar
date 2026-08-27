# A/B testing de rebates

El notebook ejecutable [`EDA/ab_testing_rebates.ipynb`](../EDA/ab_testing_rebates.ipynb)
diseña un experimento aleatorizado para medir el efecto causal de ofrecer un rebate
NBO después del rechazo de una oferta primaria.

## Alcance

- Unidad experimental: cliente que rechazó una oferta primaria y fue contactado.
- Asignación: 50/50, determinística por hash de `cliente_id` y semilla.
- Control: gestión habitual sin el rebate NBO experimental.
- Tratamiento: rebate recomendado por el motor NBO.
- Estimando principal: intención de tratar (ITT).
- Resultado primario propuesto: ingreso neto incremental acumulado a 90 días por
  cliente asignado.
- Resultado secundario: conversión posterior al rechazo.
- Guardrails: churn, morosidad, reclamos y NPS.

## Limitación del histórico

La auditoría reproducida en el notebook encuentra 47,572 registros históricos con
`es_rebate=True`; todos tienen `resultado=rechazada`. Por ello esos registros no
permiten estimar aceptación de rebate ni comparar causalmente rebate contra no
rebate. Esta limitación también está documentada en
[`diagnostico_modelos.md`](diagnostico_modelos.md#51-es_rebate--true--rechazo-sin-excepción).

El notebook construye una cohorte propuesta a partir del rechazo primario más
reciente de cada cliente. Los resultados posteriores se simulan únicamente para
validar el pipeline estadístico y aparecen identificados como `dry_run=True`.

## Resultado de validación del pipeline

En la ejecución guardada del 26 de agosto de 2026:

- Cohorte propuesta: 66,695 clientes.
- Control: 33,437; tratamiento: 33,258.
- Prueba de Sample Ratio Mismatch: `p=0.4907`, sin evidencia de SRM.
- Diferencia estandarizada de antigüedad: `0.0031`.
- Escenario de potencia central: conversión base 10%, uplift mínimo de 2 puntos
  porcentuales, 3,841 clientes por brazo y 7,682 en total.
- Dry run configurado: conversión `10.75% → 12.60%`, efecto `+1.85 pp`.
- Dry run de ingreso neto a 90 días: efecto `-S/0.95` por cliente asignado.

Los dos últimos resultados no son evidencia del desempeño real. Demuestran que un
rebate puede mejorar conversión y, al mismo tiempo, destruir valor si el descuento
y el costo de contacto superan el ingreso incremental.

## Uso con un experimento real

Antes del despliegue se deben reemplazar los supuestos del bloque
`PARAMETROS_SIMULACION` por el contrato de datos operativo descrito en el notebook.
La asignación debe persistirse antes de mostrar la oferta. El análisis final debe
incluir a todos los clientes según el grupo asignado, incluso cuando el asesor no
muestre el rebate, para preservar el estimando ITT.

No se debe aprobar el despliegue únicamente porque aumente la conversión. La regla
de decisión exige un intervalo de confianza positivo para ingreso neto o margen,
un efecto económicamente relevante y ausencia de deterioro material en los
guardrails.
