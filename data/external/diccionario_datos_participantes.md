**Diccionario de Datos - Desafio 02**

Hackathon AI Telecom Challenge 2026 - Desafio 02

# Desafio: Personalización comercial inteligente (NBO + Movistar Total)

Guía de arranque para equipos participantes

## 1. Qué se te pide (resumen del desafío)

Construir una solución de IA que recomiende, para cada cliente, la **mejor oferta comercial** (Next Best Offer): qué ofrecerle, por qué canal, con qué probabilidad de aceptación, y qué hacer si la rechaza (rebate). Como caso de uso prioritario, la solución debe **impulsar Movistar Total (MT)**.

## 2. Qué se te entrega

3 archivos CSV, 100% sintéticos y anonimizados, con 100,000 clientes y 6 meses de historial (enero-junio 2026):

|  |  |
| --- | --- |
| **Archivo** | **Qué es** |
| dataset\_clientes.csv | Perfil y comportamiento de cada cliente |
| catalogo\_ofertas\_entrega.csv | Portafolio de productos que se pueden ofrecer |
| historial\_campanias.csv | Historial de ofrecimientos ya realizados, con su resultado |

El detalle campo por campo está en diccionario\_datos\_participantes.md

# Diccionario de datos — Desafío 02: Personalización comercial inteligente

Este documento describe los **3 archivos** que se te entregan para el desafío. Todos los datos son 100% sintéticos y anonimizados (sin DNI, teléfono, nombre real ni dirección exacta) — no corresponden a clientes reales.

Cobertura: **100,000 clientes**, con historial de comportamiento de **6 meses** (enero a junio 2026).

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

## 1. `dataset\_clientes.csv` (100,000 filas — 1 fila por cliente)

Perfil de cada cliente: quién es, qué servicios tiene, y un resumen (promedios/conteos) de su comportamiento en los últimos 6 meses.

|  |  |  |
| --- | --- | --- |
| **Columna** | **Tipo** | **Descripción** |
| cliente\_id | string (PK) | Identificador único del cliente |
| tipo\_cliente | categórico | prepago / postpago. Nulo si el cliente no tiene línea móvil (el concepto solo aplica a la línea móvil) |
| antiguedad\_meses | int | Antigüedad del cliente en meses |
| tiene\_movil | bool | Tiene línea móvil |
| tiene\_hogar | bool | Tiene algún servicio hogar (internet, TV y/o telefonía fija — ver oferta\_hogar\_id para el detalle) |
| oferta\_hogar\_id | string (FK → catalogo\_ofertas\_entrega.oferta\_id) | Qué paquete hogar específico tiene el cliente. Nulo si tiene\_hogar = False |
| tiene\_internet\_hogar | bool | Si ese paquete hogar incluye internet. **No es lo mismo que `tiene\_hogar`**: un cliente puede tener hogar (ej. solo TV) sin tener internet |
| es\_movistar\_total | bool | El cliente **ya tiene** el paquete convergente Movistar Total |
| elegible\_mt | bool | El cliente **cumple los requisitos** para Movistar Total (móvil + internet hogar + postpago) pero **todavía no lo tiene** — este es el segmento prioritario del desafío |
| plan\_actual\_id | string (FK → catalogo\_ofertas\_entrega.oferta\_id) | Producto/plan principal actual del cliente |
| monto\_facturado\_prom | float | Monto mensual facturado promedio, en soles |
| edad\_rango | categórico | Rango de edad (18-25, 26-35, 36-45, 46-55, 56-65, 65+) |
| ubicacion\_departamento | categórico | Departamento aproximado |
| es\_usuario\_app | bool | Usó la app Movistar en alguno de los últimos 3 meses |
| consumo\_datos\_gb\_prom | float | Promedio mensual de GB consumidos (6 meses) |
| consumo\_voz\_min\_prom | float | Promedio mensual de minutos de voz consumidos |
| consumo\_sms\_prom | float | Promedio mensual de SMS enviados |
| uso\_app\_movistar\_prom | float | Promedio mensual de sesiones de app |
| monto\_facturado\_prom\_6m | float | Promedio de monto facturado en los 6 meses (histórico de facturación, distinto de monto\_facturado\_prom, que es del plan actual) |
| dias\_mora\_prom | float | Promedio de días de mora por mes |
| meses\_moroso | int | Cantidad de meses (de 6) en que el cliente cayó en mora (>15 días) |
| n\_reclamos | int | Cantidad total de reclamos registrados en los 6 meses |
| n\_actividad\_canal | int | Cantidad total de interacciones (visitas, llamadas, sesiones de app, etc.) en los 6 meses |
| canal\_mas\_usado | categórico | El canal (Tienda / Call In / Call Out / Digital) donde el cliente tuvo más interacciones registradas en los 6 meses. Nulo si el cliente no tuvo ninguna interacción registrada |

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

## 2. `catalogo\_ofertas\_entrega.csv` (22 filas — 1 fila por oferta)

El portafolio completo de productos que se le puede ofrecer a un cliente: planes móviles, planes hogar, upgrades, equipos, paquetes adicionales y Movistar Total.

|  |  |  |
| --- | --- | --- |
| **Columna** | **Tipo** | **Descripción** |
| oferta\_id | string (PK) | Identificador de la oferta |
| nombre\_oferta | string | Nombre comercial |
| tipo\_oferta | categórico | plan\_movil / plan\_hogar / upgrade / equipo / paquete\_adicional / movistar\_total |
| segmento\_objetivo | categórico | movil / hogar / ambos |
| es\_movistar\_total | bool | Si esta oferta es una de las 3 variantes de Movistar Total |
| precio\_mensual | float | Precio mensual en soles |
| ahorro\_pct | int | % de ahorro estimado vs. comprar los productos por separado (solo aplica a las 3 ofertas Movistar Total). **Valor ilustrativo**, no representa una tarifa oficial confirmada — Movistar Total ofrece "hasta 50% de ahorro" según el material del desafío, pero no hay un desglose oficial por tier |
| gb\_incluidos | int | GB incluidos en el plan (9999 = ilimitado) |
| cluster\_hogar | categórico | Solo para ofertas hogar: mono (1 servicio), duo (2), trio (3: internet + TV + fijo). Nulo para el resto |
| descripcion\_bundle | string | Solo para ofertas hogar: qué incluye el bundle (ej. "Internet + TV"). Nulo para el resto. Nota: la telefonía fija nunca se vende sola — solo aparece combinada en un duo o trio |
| descripcion\_corta | string | Texto descriptivo generado (nombre + GB + precio) |

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

## 3. `historial\_campanias.csv` (300,112 filas — 1 fila por ofrecimiento realizado)

El historial de campañas: cada fila es una oferta que se le presentó a un cliente en una fecha y canal específicos, y el resultado de ese ofrecimiento. **Esta es la tabla pensada para entrenar/evaluar tu modelo de Next Best Offer.**

|  |  |  |
| --- | --- | --- |
| **Columna** | **Tipo** | **Descripción** |
| ofrecimiento\_id | string (PK) | Identificador del evento de ofrecimiento |
| cliente\_id | string (FK → dataset\_clientes.cliente\_id) | A qué cliente se le ofreció |
| oferta\_id | string (FK → catalogo\_ofertas\_entrega.oferta\_id) | Qué oferta se le presentó |
| fecha | fecha | Fecha del ofrecimiento |
| canal | categórico | Canal por el que se hizo el ofrecimiento (Tienda / Call In / Call Out / Digital) |
| resultado | categórico | **`aceptada`** / **`rechazada`** / **`pendiente`** (pendiente = no hubo contactabilidad real, no se pudo saber el resultado). **Este es el target sugerido para el modelo de probabilidad de aceptación** |
| motivo\_rechazo | categórico | Solo si resultado = rechazada: precio / no\_necesita / ya\_tiene\_similar / mal\_momento / no\_confia / otro. Nulo en cualquier otro caso |
| es\_rebate | bool | Si hubo una contraoferta tras un rechazo |
| contactabilidad | categórico | contactado / no\_contactado |
| medio\_probatorio | categórico | registro\_plataforma / audio\_llamada / chat\_log — evidencia de que el ofrecimiento ocurrió (trazabilidad end-to-end) |
| tipo\_cliente | categórico | Copiado de dataset\_clientes, para comodidad (evita tener que cruzar si solo necesitas esta columna) |
| antiguedad\_meses | int | Copiado de dataset\_clientes |
| elegible\_mt | bool | Copiado de dataset\_clientes |
| es\_movistar\_total | bool | Copiado de dataset\_clientes — **ojo**: esto indica si el **cliente** ya tenía Movistar Total \*antes\* de este ofrecimiento, no si la oferta presentada era Movistar Total (para eso ver oferta\_es\_mt) |
| nombre\_oferta | string | Copiado de catalogo\_ofertas\_entrega |
| tipo\_oferta | categórico | Copiado de catalogo\_ofertas\_entrega |
| oferta\_es\_mt | bool | Si la oferta presentada en este evento **es** una de las 3 variantes de Movistar Total |

***No confundir `es\_movistar\_total` (atributo del cliente) con `oferta\_es\_mt` (atributo de la oferta presentada)*** *— es el error de lectura más fácil de cometer en esta tabla.*

\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

## Relaciones entre los 3 archivos

catalogo\_ofertas\_entrega (oferta\_id)
 │
 ├── dataset\_clientes.plan\_actual\_id
 ├── dataset\_clientes.oferta\_hogar\_id
 └── historial\_campanias.oferta\_id

dataset\_clientes (cliente\_id)
 └── historial\_campanias.cliente\_id (1 cliente : N ofrecimientos)