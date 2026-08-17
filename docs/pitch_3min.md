# 🎤 Guión Oficial del Pitch (3 Minutos) — Desafío 02: Personalización Comercial Inteligente

> **Proyecto:** NBO Intelligence & Movistar Total Accelerator  
> **Evento:** Hackathon AI Telecom Challenge 2026 (Telefónica del Perú / Movistar + U. de Lima + Lenovo ISG)  
> **Tiempo Estimado:** 3:00 minutos  
> **Rol de Presentación:** Analista de Negocio / Presentador Líder  

---

## ⏱️ Estructura Cronometrada del Pitch

```
[0:00 - 0:35]  🚨 1. El Gancho y el Dolor Operativo (35 seg)
[0:35 - 1:10]  💡 2. La Solución: Personalización Comercial E2E (35 seg)
[1:10 - 2:10]  📱 3. Demo en Vivo: El Asesor en Acción (60 seg)
[2:10 - 2:35]  ⚙️ 4. Innovación Técnica y Factibilidad (25 seg)
[2:35 - 3:00]  📈 5. Impacto en Negocio, ROI y Cierre (25 seg)
```

---

## 📜 Guión Palabra por Palabra

### 🚨 1. El Gancho y el Dolor Operativo (0:00 - 0:35)

> *"Buenas tardes, miembros del jurado.*
> 
> *Cada día, más de **5,000 asesores comerciales** de Movistar Perú atienden a clientes bajo una presión enorme de tiempo. Tienen menos de **30 segundos** para decidir qué ofrecer mientras navegan entre plataformas fragmentadas como **DITO** y **Visor**.*
> 
> *El resultado actual: campañas masivas, ofertas genéricas y una tasa de aceptación histórica de apenas el **15%**. Peor aún, estamos perdiendo la oportunidad de posicionar nuestro producto más estratégico: **Movistar Total**, la oferta convergente que reduce el churn y ofrece hasta un 50% de ahorro al cliente.*
> 
> *¿El problema? El asesor no sabe a quién ofrecérselo, cómo argumentarlo ni qué responder si el cliente dice que no."*

---

### 💡 2. La Solución: Personalización Comercial E2E (0:35 - 1:10)

> *"Para resolver esto, creamos **NBO Intelligence**, un copiloto comercial omnicanal que acompaña el funnel comercial de punta a punta:*
> 
> 1. * **Clasifica al instante:** Identifica en milisegundos la elegibilidad a Movistar Total y el perfil de riesgo.*
> 2. * **Recomienda con precisión:** Genera un ranking Top-3 de ofertas personalizadas optimizadas por probabilidad de aceptación y ARPU.*
> 3. * **Genera el Speech Persuasivo:** Con IA Generativa, redacta el speech exacto destacando el ahorro y beneficios reales.*
> 4. * **Entrega Rebate Inmediato:** Si el cliente duda, el asesor tiene a un clic la contraoferta ideal.*
> 5. * **Omnicanalidad:** Sugiere el canal y momento con mayor propensión de contacto (App, WhatsApp, Call o Tienda)."*

---

### 📱 3. Demo en Vivo: El Asesor en Acción (1:10 - 2:10)

*(Proyectar pantalla de la aplicación frontend en `http://localhost:3000` o URL Vercel)*

> *(Acción 1: Buscar cliente)*  
> *"Veámoslo en acción. Un cliente se contacta. El asesor ingresa su ID. En menos de un segundo, la pantalla muestra su Perfil 360 simplificado: su consumo de datos, antigüedad y su condición de **Elegible Movistar Total** sin saturar la vista.*
> 
> *(Acción 2: Mostrar Hero Card NBO)*  
> *Inmediatamente, el motor resalta la recomendación #1: **Movistar Total Plus**. No es una caja negra: le explica al asesor por qué se recomienda (el cliente gasta en móvil y hogar por separado) y le muestra un **ahorro del 35%**.*
> 
> *(Acción 3: Copiar Speech y Rebate)*  
> *El asesor no improvisa: lee el **Speech Comercial** generado específicamente para este cliente: `Ahorra unificando tus servicios con el doble de gigas`. Y si el cliente objeta por precio, simplemente abre el cajón de **Rebates de Contingencia** para ofrecerle el plan alternativo inmediato sin perder la llamada ni la venta."*

---

### ⚙️ 4. Innovación Técnica y Factibilidad (2:10 - 2:35)

> *"Detrás de esta interfaz amigable hay una arquitectura robusta y lista para producción:*
> - *Un **modelo de propensión ML** entrenado sobre más de **300,000 ofrecimientos históricos**, evaluando 33 variables de comportamiento, mora y consumo.*
> - * **Reglas de negocio inteligentes:** Filtros de no-canibalización y exclusión automática para clientes con riesgo crediticio.*
> - * **Arquitectura desacoplada y Serverless:** Frontend moderno en Next.js con API REST en FastAPI, listo para integrarse mediante micro-frontends en DITO y Visor sin tocar sistemas legacy complejos."*

---

### 📈 5. Impacto en Negocio, ROI y Cierre (2:35 - 3:00)

> *"¿Cuál es el impacto directo para Movistar Perú?*
> 
> 1. * **+25% de incremento en conversión** frente a campañas masivas tradicionales.*
> 2. * **Cumplimiento estratégico:** Aceleración directa para superar la meta de **>50% de venta hogar convergente**.*
> 3. * **Blindaje de cartera:** Reducción sustancial del churn al unificar servicios en una sola factura.*
> 4. * **Eficiencia operativa:** Reducción del tiempo de consulta del asesor de 2 minutos a solo **15 segundos**.*
> 
> *Transformamos la venta reactiva en una experiencia personalizada, inteligente y rentable.*
> 
> *Muchas gracias. Quedamos atentos a sus preguntas."*

---

## 🎯 Matriz de Preguntas Frecuentes del Jurado (Q&A de Contingencia)

| Pregunta Probable del Jurado | Respuesta Sugerida del Analista |
| :--- | :--- |
| **¿Cómo garantizan que el asesor realmente use la herramienta?** | *"Rediseñamos la interfaz bajo principios de mínima carga cognitiva. No agregamos una pantalla más: entregamos un widget integrable directamente en DITO/Visor con un botón de un clic para copiar el speech comercial."* |
| **¿El modelo prioriza siempre el producto más caro (canibalización)?** | *"No. El motor balancea la probabilidad de aceptación ($P(\text{éxito})$) con el valor económico y la regla de no-canibalización, asegurando que solo se ofrezcan upgrades sostenibles que reduzcan el riesgo de morosidad."* |
| **¿Por qué enfocarse tanto en Movistar Total?** | *"Porque los datos demuestran que el cliente convergente tiene el menor churn y la mayor lealtad. Es la palanca de mayor LTV (Lifetime Value) para Telefónica del Perú."* |
| **¿Qué pasa con clientes que no usan canales digitales?** | *"El motor sugiere omnicanalidad asistida. Para clientes mayores o con baja adopción digital, prioriza el canal Tienda o Call In, entregándole al asesor presencial el speech adaptado a ese perfil."* |
| **¿Cómo escalan la solución a nivel técnico?** | *"La inferencia está desacoplada mediante APIs REST optimizadas y datasets preprocesados, permitiendo responder en menos de 50 milisegundos por consulta."* |

---

## 📋 Checklist de Presentación para el Equipo

- [ ] **Proyector / Pantalla:** Navegador abierto en pantalla completa (F11) en la vista Asesor.
- [ ] **Cliente Demo Listo:** ID de cliente de prueba con perfil convergente perfecto (ej. `CLI_000001` o similar elegible MT).
- [ ] **Plan B sin Internet:** Video corto o capturas locales en alta resolución listas.
- [ ] **Cronómetro:** Ensayar con reloj en mano para clavar los 2:50 - 3:00 min exactos.
