# Guía para integrar el nuevo motor NBO en la plataforma

## 1. Objetivo actualizado de la propuesta

La plataforma ya no debe presentar solamente un Top-3 estático. La propuesta
evolucionó hacia un **motor comercial responsable que reconoce sus límites**:

- recomienda la mejor oferta compatible;
- puede reconocer que no es un buen momento para contactar u ofrecer;
- no fuerza Movistar Total cuando no es competitivo;
- reconoce cuando no puede diferenciar con certeza entre MT Básico, Plus y Max;
- en ese caso solicita una preferencia breve al cliente mediante el asesor;
- registra la interacción para alimentar el funnel y el dashboard.

Las dos innovaciones que deben entenderse claramente en la experiencia son:

1. **La mejor acción puede ser esperar o no contactar**, para reducir
   sobreexposición, molestias y posibles impactos negativos en NPS.
2. **El motor reconoce su incertidumbre** y hace una pregunta cuando los datos
   no permiten elegir responsablemente una variante de Movistar Total.

No se propone un chatbot ni el análisis automático de llamadas. La solución
continúa centrada en asesores.

---

## 2. Qué recibe la plataforma

El modelo calcula, para cada combinación cliente–oferta–canal, una probabilidad
de aceptación. El motor recibe esas probabilidades, elimina ofertas no válidas,
aplica las reglas y devuelve al backend una respuesta con cuatro bloques:

- `decision_comercial`: qué acción corresponde y por qué;
- `pregunta_inteligente`: si necesita conocer una preferencia MT;
- `top_3`: oferta principal y dos alternativas;
- `audit`: detalle técnico para trazabilidad, no para el asesor.

Flujo del MVP:

```text
CSVs simulados
→ modelo de propensión
→ motor de reglas y decisión
→ backend
→ plataforma del asesor
→ registro del resultado en el funnel
```

En producción, los CSV se reemplazarían por integraciones con CRM, DITO,
Visor, el catálogo comercial y otros sistemas internos.

### Archivos del motor que se integrarán

```text
proyecto/
├── inferencia_modelo.py
├── Motor/
│   ├── motor_oficial.py
│   └── motor_reglas_negocio.py
└── Modelo/
    └── modelo_propension_v2_candidato.joblib
```

- `motor_oficial.py` ejecuta el flujo y construye la respuesta para el backend.
- `motor_reglas_negocio.py` contiene los filtros y decisiones comerciales.
- El `inferencia_modelo.py` utilizado es el archivo ubicado en la raíz del
  proyecto y debe conservar ese nombre.
- `modelo_propension_v2_candidato.joblib` es el modelo entrenado.
- `Modelo/modelo_ultima_ver.py` no forma parte de esta integración.

---

## 3. Reglas que ya aplica el motor

El motor ya puede:

- excluir MT para clientes no elegibles;
- excluir MT cuando el cliente ya es convergente;
- evitar una oferta que el cliente ya tiene contratada;
- excluir productos incompatibles con los servicios actuales;
- restringir equipos ante riesgo alto de mora;
- advertir posibles downgrades de precio o capacidad;
- excluir ofertas rechazadas que el backend indique que siguen bloqueadas;
- generar una oferta principal y alternativas compatibles;
- mantener separada la probabilidad del modelo del score usado para decidir.

Antes existía un bono fijo de `+0.04` para MT. Se eliminó porque podía colocar
MT por encima de ofertas claramente mejores. Ahora MT solo puede subir como
**desempate estratégico** cuando la diferencia es menor o igual a un punto
porcentual.

MT tampoco se fuerza dentro del Top-3 si no es competitivo.

---

## 4. Pregunta inteligente para Movistar Total

El análisis demostró que el modelo casi no distingue entre MT Básico, Plus y
Max. En los experimentos, las probabilidades fueron prácticamente iguales y MT
Básico ganaba por diferencias diminutas. Eso no significa que Básico sea la
mejor alternativa para todos, sino que falta una preferencia real del cliente.

Cuando el cliente es elegible, MT es competitivo y las variantes se encuentran
dentro del margen de incertidumbre, el backend devolverá:

```text
¿Qué prefieres priorizar: pagar menos, tener más gigas
o contar con datos ilimitados?
```

Correspondencia:

- `Pagar menos` → MT Básico, S/149.90 y 30 GB.
- `Más gigas` → MT Plus, S/189.90 y 60 GB.
- `Datos ilimitados` → MT Max, S/229.90 y datos ilimitados.

### Ubicación recomendada

La pregunta debe aparecer **dentro de la tarjeta principal de recomendación**,
antes de confirmar una variante MT. No conviene esconderla en el historial ni
mostrarla como un formulario técnico.

Diseño sugerido:

```text
Necesitamos una preferencia

¿Qué prefieres priorizar?

[Pagar menos] [Más gigas] [Datos ilimitados]
```

Al seleccionar una opción, la tarjeta se actualiza inmediatamente con la
variante elegida. La pregunta solo aparece cuando el motor detecta ambigüedad;
no debe mostrarse a todos los clientes.

---

## 5. Estados comerciales y cómo mostrarlos

El motor contempla:

- `CONTACTAR`
- `ESPERAR`
- `NO_CONTACTAR`
- `NO_OFRECER`
- `RECOMENDACION_DISPONIBLE`

Estos estados deben ubicarse como una **franja breve en la parte superior de la
ficha del cliente**, antes del Top-3. El asesor debe entender primero si puede
actuar y luego qué oferta presentar.

Ejemplos:

```text
CONTACTAR
No se informaron bloqueos comerciales.
```

```text
ESPERAR
Cliente dentro de un periodo de descanso comercial.
```

```text
NO OFRECER
Priorizar la atención del cliente en esta interacción.
```

### Importante para el prototipo

Los CSV no contienen consentimiento, reclamos o averías activas, horarios
exactos ni una política oficial de presión comercial. Tampoco tenemos conexión
real con CRM, DITO o Visor.

Por eso, `ESPERAR`, `NO_CONTACTAR` y algunos casos de `NO_OFRECER` solo pueden
mostrarse actualmente mediante **escenarios simulados enviados por el backend**
o a partir de nuevas interacciones registradas en la propia plataforma.

Para no sobrecargar la interfaz, puede mostrarse una etiqueta pequeña como:

```text
Regla piloto · pendiente de validación
```

No deben presentarse los límites de llamadas o tiempos de espera como políticas
oficiales hasta recibir la respuesta de Movistar.

---

## 6. Diseño por canal

### Call Out

En Call Out se conoce al cliente antes de marcar porque forma parte de una lista
comercial. Esta es la vista donde la decisión `CONTACTAR`, `ESPERAR` o
`NO_CONTACTAR` debe tener mayor protagonismo.

Orden recomendado de la pantalla:

1. Identificación y resumen del cliente.
2. Estado comercial antes de llamar.
3. Oferta principal y explicación sencilla.
4. Pregunta MT si existe incertidumbre.
5. Speech de apertura ya disponible.
6. Alternativas compatibles.
7. Botones para registrar contacto, respuesta, rebate y cierre.

El speech puede construirse con plantillas o con un LLM opcional. Debe estar
cargado antes de iniciar la llamada; el asesor no debe esperar a una API.

### Call In

En Call In el cliente se identifica después de llamar. En ese momento se cargan
sus recomendaciones en segundo plano, pero **no se debe iniciar un speech
comercial automáticamente**.

Una llamada puede contener varios temas, por lo que no conviene obligar al
asesor a seleccionar un único motivo de llamada. El flujo correcto es:

1. Identificar al cliente y cargar su historial y recomendaciones.
2. Atender normalmente todos los temas de la llamada.
3. Mantener la recomendación comercial disponible, pero sin interrumpir la atención.
4. Mostrar el botón `Abrir recomendación comercial`.
5. Activarlo solo si el cliente consulta por una oferta o surge una oportunidad
   comercial natural sin incidencias.

Si la llamada incluye reclamo o avería, no se debe vender durante esa misma
interacción, aunque el problema termine resuelto. El objetivo es cerrar bien la
atención y proteger la experiencia del cliente.

No debe confundirse el **motivo de la llamada** con el **motivo de rechazo de
una oferta**. El motivo de rechazo solo se registra si realmente se presentó
una oferta.

### Tienda

La recomendación se carga cuando el cliente es identificado. El asesor puede
abrirla si existe una consulta o una oportunidad comercial. Si la visita está
centrada en una incidencia, se prioriza la atención y no se fuerza la venta.

### WhatsApp asistido

La solución no plantea un chatbot autónomo. El motor recomienda y puede preparar
un texto corto, pero el asesor lo revisa antes de enviarlo.

La recomendación debe activarse cuando la conversación tenga intención comercial,
no apenas se identifica al cliente ni mediante mensajes automáticos posteriores
a un reclamo.

### Web o canal digital autónomo

Si ya existe una pestaña Web, puede mantenerse como demostración de una futura
extensión. No es el centro del MVP actual, que está diseñado para asesores. No
se debe afirmar que existe un chatbot o contratación automática si esos flujos
todavía no están implementados.

---

## 7. Speech comercial y posible LLM

El motor devuelve razones estructuradas como elegibilidad, ahorro, consumo,
productos actuales y alertas. La plataforma las traduce a lenguaje sencillo.

Ejemplo:

```text
Dato interno:
Cliente elegible para MT con móvil e internet contratados por separado.

Texto para el asesor:
Este cliente puede unificar sus servicios y acceder a beneficios de
Movistar Total.
```

Un LLM puede utilizarse de manera opcional para adaptar el speech a Call Out,
Call In, Tienda o WhatsApp. No selecciona la oferta, no detecta reclamos y no
decide cuándo vender.

Para mantener viabilidad y velocidad, se recomiendan speeches previamente
generados o plantillas parametrizadas, con el LLM en tiempo real reservado para
casos especiales. Siempre debe existir una plantilla de respaldo.

---

## 8. Qué información no debe mostrarse al asesor

No mostrar ajustes como:

- `Mora: -6 puntos`
- `Prioridad MT: +4 puntos`
- coeficientes del modelo;
- valores SHAP sin traducción;
- `score_ranking` interno;
- códigos técnicos de exclusión.

Estos elementos confunden al asesor y no indican qué debe hacer.

Sí se puede mostrar:

- `Probabilidad estimada de aceptación: 67%`;
- `Ahorro de la oferta: 35%`;
- `Cliente elegible para Movistar Total`;
- `Evitar equipo financiado por riesgo de mora`;
- `La oferta reduce la capacidad respecto de su plan actual`.

El porcentaje de descuento o ahorro sirve como beneficio comercial. Los puntos
positivos o negativos del ranking pertenecen al motor y, como máximo, pueden
aparecer en una vista técnica de auditoría.

---

## 9. Registro del funnel en cada pantalla

La vista del asesor debe permitir registrar eventos, no solo visualizar una
oferta:

```text
Recomendación visualizada
→ cliente contactado / no contestó
→ oferta presentada
→ aceptó / rechazó / presentó objeción
→ rebate presentado
→ pedido registrado
→ venta o activación
```

Botones sugeridos:

```text
[Contactado] [No contestó]
[Oferta presentada]
[Aceptó] [Objeción] [Rechazó]
[Rebate presentado]
[Registrar pedido] [Cerrar sin venta]
```

Los motivos de rechazo deben aparecer solo después de marcar que la oferta fue
presentada.

---

## 10. Dashboard

El dashboard debe alimentarse con los eventos anteriores y mostrar:

- funnel desde recomendación hasta venta;
- conversión por canal y oferta;
- participación de Movistar Total;
- aceptación de la oferta principal;
- uso y resultado de los rebates;
- frecuencia de la pregunta inteligente y variante finalmente elegida;
- cambios realizados por los asesores;
- contactos evitados o periodos de espera activados;
- motivos de rechazo.

Los indicadores de contactos evitados, NPS, churn o ARPU deben identificarse
como simulados o no disponibles mientras no exista integración con resultados
reales de Movistar.

---

## 11. Resumen visual recomendado

La jerarquía de la pantalla del asesor debería ser:

```text
[Identidad y contexto del cliente]

[Acción comercial: CONTACTAR / ESPERAR / NO OFRECER]

[Oferta principal + beneficio + explicación]

[Pregunta inteligente, solo si aplica]

[Speech, solo cuando se activa una oportunidad comercial]

[Alternativas compatibles / rebate]

[Registro de la interacción y cierre]
```

La interfaz debe priorizar decisiones y acciones. La información técnica queda
en el backend o en auditoría.

---

## 12. Elementos pendientes de confirmación

Movistar todavía debe confirmar:

- máximo de intentos no contestados;
- periodo de descanso entre contactos;
- coordinación de presión entre canales;
- duración y alcance del bloqueo tras un rechazo;
- reglas oficiales de rebate;
- estados operativos disponibles en CRM, DITO o Visor;
- definición oficial de una venta concretada.

Estas respuestas cambiarán reglas, textos y parámetros, pero no deberían
obligar a rediseñar el flujo principal de la plataforma.

La especificación técnica complementaria del motor se encuentra en
[`motor_recomendacion_v2.md`](motor_recomendacion_v2.md).
