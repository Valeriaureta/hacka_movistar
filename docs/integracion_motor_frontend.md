# Integración del motor NBO con la plataforma

## Flujo conectado

```text
Frontend React
→ API FastAPI
→ NBORouter
→ motor_oficial.py
→ inferencia_modelo.py
→ modelo_propension_v2_candidato.joblib
→ Top-3, decisión comercial, pregunta MT y speech
```

El frontend adapta la respuesta anidada del backend a una estructura común para
Tienda, Call In, Call Out, WhatsApp y App Digital. La cabecera indica si está
usando el motor o el fallback visual local.

## Datos

El backend busca los clientes en este orden:

1. Ruta definida en `NBO_CLIENTES_PATH`.
2. `data/raw/dataset_clientes.csv`, base completa del reto.
3. `data/processed/demo/dataset_clientes_demo.csv`, muestra de 2,000 registros
   reales preparada para que el repositorio pueda ejecutar una demo sin el CSV
   completo, que está excluido de Git por tamaño.

El catálogo siempre se carga desde `data/raw/catalogo_ofertas_entrega.csv`.

## Pregunta inteligente MT

Cuando el motor encuentra ambigüedad entre las variantes MT, el frontend muestra
la pregunta de preferencia. La respuesta se envía a
`POST /api/recomendaciones/{id}/preferencia-mt` y el Top-3 se recalcula.

## Ejecución

Backend, desde la raíz:

```bash
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend_react
npm install
npm run dev
```

Vite redirige `/api` hacia `http://127.0.0.1:8000`.

## Despliegue en Vercel

Producción: <https://movinexo.vercel.app>

`api/index.py` expone la aplicación FastAPI y `vercel.json` construye el
frontend Vite. En Vercel se utiliza la muestra real versionada de 2,000 clientes,
porque la base completa está excluida de Git por tamaño.

El registro del dashboard se guarda en `/tmp` durante la demo serverless. Es
temporal y puede reiniciarse entre invocaciones; en una integración corporativa
debe reemplazarse por la base de eventos o CRM de Movistar.

## Compatibilidad del modelo

El artefacto fue validado con `scikit-learn 1.9.0`; por eso la versión está
fijada en `requirements.txt`. No debe cargarse con scikit-learn 1.7.2.
