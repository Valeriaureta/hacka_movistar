# 🎯 Estrategia de Personalización Comercial Inteligente (NBO + Movistar Total)

> **Desafío 02:** Hackathon AI Telecom Challenge 2026  
> **Objetivo:** Transformar el modelo comercial de reactivo a proactivo y personalizado mediante IA explicable.

---

## 1. Objetivos Estratégicos y Metas Cuantitativas

1. **Recomendación Personalizada (Next Best Offer 1):** Qué producto ofrecer con la máxima probabilidad de aceptación y rentabilidad.
2. **Impulso Convergente a Movistar Total (MT):**
   - Meta 1: Lograr que **> 50% de la venta hogar** se realice bajo Movistar Total.
   - Meta 2: Lograr que **> 10% de la venta móvil** se realice bajo Movistar Total.
   - Beneficio clave: Hasta **50% de ahorro** para el cliente, más GB y blindaje contra churn.
3. **Orquestación y Canal Óptimo:** Asignar el canal idóneo (`Digital`, `Tienda`, `Call In`, `Call Out`) y momento oportuno.
4. **Estrategia de Rebate y Resiliencia Comercial:** Definir ofertas contingentes (Top 2 y Top 3) y speech alternativo inmediato ante un rechazo inicial.
5. **Integración Operativa en Plataformas:** Adaptabilidad para su despliegue en **DITO** (ventas) y **Visor** (postventa/cross-selling).

---

## 2. Motor de Recomendación y Reglas de Negocio

```
                                  [ Cliente i ]
                                        │
                         ¿Es elegible para Movistar Total?
                                (`elegible_mt == True`)
                                  /            \
                             SÍ  /              \  NO
                                /                \
             [ Priorizar Ofertas MT ]        [ Evaluar NBO General ]
             (MT_01, MT_02, MT_03)           (Móvil, Hogar, Upgrade, Equipos)
                                \                /
                                 \              /
                          [ Modelo de Scoring Predictivo ]
                           (Probabilidad de Aceptación)
                                        │
                        [ Generación de Ranking Top-3 ]
                         ├── Top 1: Oferta Principal + Explicabilidad (XAI)
                         ├── Top 2: Rebate Nivel 1 (Mayor Ahorro / Entrada)
                         └── Top 3: Rebate Nivel 2 (Servicios Adicionales)
                                        │
                        [ Asignación de Canal y Speech GenAI ]
```

### Reglas de Priorización y Filtrado:
- **Priorización de Convergencia (`elegible_mt`):** Si un cliente cuenta con móvil postpago y servicio fijo sin convergencia, las ofertas `MT_01`, `MT_02` o `MT_03` reciben prioridad en el ranking.
- **Filtro de Riesgo Crediticio:** Clientes con `meses_moroso >= 2` o `dias_mora_prom > 10` son restringidos para subsidios de terminales o paquetes de alto ticket.
- **Regla de No-Canibalización:** No recomendar planes con menor facturación o menor cuota de GB respecto al plan actual, salvo en migraciones a paquetes convergentes con compensación en ARPU total.

---

## 3. Trazabilidad E2E del Funnel de Ofrecimiento

```
[ Clasificación ] ──> [ Canal / Momento ] ──> [ Speech NBO ] ──> [ Speech Rebate ] ──> [ Contactabilidad ] ──> [ Venta ]
```

1. **Clasificación del Cliente:** Segmentación basada en consumo, antigüedad y tenencia de servicios.
2. **Canal y Momento Idóneo:** Identificación de hábitos digitales y presenciales (`canal_mas_usado`, `es_usuario_app`).
3. **Speech NBO Personalizado:** Argumento comercial centrado en los beneficios directos (ahorro de hasta 50%, más gigas, factura única).
4. **Speech de Rebate Inmediato:** Guion alternativo generado por IA si el cliente presenta objeciones iniciales (precio, permanencia, desconocimiento).
5. **Contactabilidad y Cierre:** Registro del medio probatorio y resultado de la interacción para retroalimentar el modelo.
