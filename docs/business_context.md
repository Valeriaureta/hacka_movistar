# 🏢 Marco Contextual del Negocio — Hackathon AI Telecom Challenge 2026

Este documento sintetiza el contexto estratégico, operativo y de innovación del **Hackathon AI Telecom Challenge 2026**, organizado por **Telefónica del Perú (Movistar)** en alianza con la **Universidad de Lima** y **Lenovo ISG**.

---

## 1. Visión General del Hackathon y los 3 Desafíos

El evento reúne a la academia y la industria de telecomunicaciones para resolver dolores de negocio prioritarios mediante Inteligencia Artificial:

| # | Desafío | Palanca de Negocio | Objetivo Principal |
| :---: | :--- | :--- | :--- |
| **01** | **Atención Inteligente y Explicación de Recibos** | Experiencia de Cliente (NPS) | Asistente omnicanal que explica variaciones en recibos (>5MM emitidos/mes, ~40% con variaciones, +200k llamadas al 104) reduciendo fricción y costos operativos. |
| **02** | **Personalización Comercial Inteligente (NBO + Movistar Total)** ⭐ | Crecimiento, Ventas y Retención | Motor de recomendación Next Best Offer que predice la mejor oferta, canal y speech personalizado, priorizando la convergencia con **Movistar Total**. |
| **03** | **SON-IA: Agentes para Ciclo de Ingresos** | Eficiencia Operativa | Equipo multiagente para automatizar y optimizar el ciclo integral de facturación, cobranzas y recaudo. |

---

## 2. Contexto Específico del Desafío 02 (Personalización Comercial)

### 2.1. El Ecosistema de Canales y Plataformas
Movistar gestiona millones de interacciones a través de una red omnicanal:
- **Canales Presenciales:** Red de Tiendas a nivel nacional.
- **Canales Telefónicos:** Call Center (Call In de atención y Call Out de televentas).
- **Canales Digitales:** App Mi Movistar, Web oficial y WhatsApp asistido.
- **Plataformas Internas de Operación:**
  - **DITO:** Plataforma core empleada por la fuerza de ventas para emitir y cerrar ofertas.
  - **Visor:** Plataforma de postventa y soporte al cliente donde se identifican oportunidades de cross-selling y fidelización.

### 2.2. Oportunidad Estratégica: Movistar Total (MT)
- **Definición:** Producto convergente bandera de Movistar que unifica línea móvil postpago y servicio de banda ancha hogar (fibra/HFC) bajo un único recibo y cuenta.
- **Propuesta de Valor para el Cliente:**
  - Descuento de hasta **50% de ahorro** frente a contratar los servicios por separado.
  - Bono duplicador de GB en líneas móviles y beneficios exclusivos de entretenimiento.
- **Impacto para el Negocio:**
  - **Blindaje y Retención:** Clientes convergentes presentan la menor tasa de churn y menor morosidad de la cartera.
  - **Metas de Penetración:** Superar el **> 50% de la venta hogar** y **> 10% de la venta móvil** canalizadas a través de Movistar Total.

---

## 3. Principios de Diseño e Implementación (Marco Estratégico)

Basado en las directrices estratégicas de **Lenovo ISG** y las mejores prácticas de la industria:

```
[ Empatizar ] ──> [ Definir ] ──> [ Idear ] ──> [ Prototipar ] ──> [ Evaluar ]
```

1. **Enfoque en el Problema, no en la Herramienta:**
   - La tecnología es un habilitador. El valor radica en resolver la fricción del asesor bajo presión de tiempo y del cliente saturado de ofertas genéricas.
2. **Matriz de Priorización (Impacto vs. Esfuerzo):**
   - **Quick Wins:** Motor de scoring predictivo y ranking Top-3 con canal sugerido.
   - **Strategic Bets:** Asistente conversacional con IA Generativa para generar speech comercial y rebate personalizado en tiempo real.
3. **Criterios de Evaluación del Jurado:**
   - **Comprensión del problema** y empatía con el usuario final (asesor / cliente).
   - **Innovación técnica** y creación de variables ingeniosas.
   - **Viabilidad e integración** con plataformas como DITO/Visor.
   - **Impacto cuantificable** en métricas clave (Conversión, ARPU, Churn, NPS).
   - **Claridad del pitch** y experiencia de usuario limpia.

---

## 4. Trazabilidad E2E del Funnel de Ofrecimiento

Para asegurar una solución completa y auditable, el flujo comercial debe cubrir:

```
┌─────────────────────────┐
│ Clasificación del       │ -> Identificación de necesidades y elegibilidad (Elegible MT, Mono/Duo/Trio)
│ Cliente                 │
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Canal y Momento Idóneo  │ -> Sugerencia de contacto óptimo (Digital, Tienda, Call Out) según hábitos
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Argumento y Speech NBO  │ -> Explicación de la recomendación y mensaje comercial persuasivo
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Speech de Rebate        │ -> Alternativa inmediata (Top 2 / Top 3) si el cliente rechaza la oferta principal
└───────────┬─────────────┘
            ▼
┌─────────────────────────┐
│ Contactabilidad y Venta │ -> Registro del resultado comercial y trazabilidad de conversión
└─────────────────────────┘
```
