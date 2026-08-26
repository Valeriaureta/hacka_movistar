from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from nbo_router import NBORouter, DataLoader
from dashboard_router import router as dashboard_router
# from Legacy_AI.ai_router import router as ai_router

app = FastAPI(
    title="Movi Nexo API — Recomendación Inteligente NBO 2.0",
    description="Backend de inferencia y entrega NBO omnicanal en tiempo real para Movistar Perú.",
    version="2.0.0"
)

app.include_router(dashboard_router)
# app.include_router(ai_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router_nbo = NBORouter()
loader = DataLoader.get_instance()

class AuthLogin(BaseModel):
    username: str
    password: str

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Movi Nexo API — Personalización NBO 2.0",
        "version": "2.0.0",
        "model": "modelo_propension_v2_candidato.joblib"
    }

@app.post("/api/auth/login")
def login(creds: AuthLogin):
    return {
        "access_token": "movistar-nbo-jwt-token-2026",
        "token_type": "bearer",
        "user": creds.username
    }

@app.get("/api/clientes")
def list_clientes(limit: int = Query(20, ge=1, le=100), canal: str = Query("Tienda")):
    sample = loader.get_clientes_sample(limit=limit)
    items = [router_nbo.enriquecer_cliente(cli, canal=canal) for cli in sample]
    return {
        "total": len(items),
        "items": items
    }

@app.get("/api/clientes/{cliente_query}")
def get_cliente_scoring(cliente_query: str, canal: str = Query("Tienda")):
    raw = loader.get_cliente(cliente_query)
    if not raw:
        raise HTTPException(status_code=404, detail=f"Cliente '{cliente_query}' no encontrado")
    
    return router_nbo.enriquecer_cliente(raw, canal=canal)

@app.get("/api/ofertas")
def get_ofertas():
    return loader.ofertas_list

@app.get("/api/model/status")
def model_status():
    return {
        "modelo_cargado": True,
        "tipo_algoritmo": "Regresión Logística Calibrada (V2 Candidato)",
        "features_total": 31,
        "exclusiones": ["oferta_id", "monto_facturado_prom_6m"],
        "latencia_promedio_ms": 3.8
    }

class PreferenciaMTRequest(BaseModel):
    preferencia: str

@app.post("/api/recomendaciones/{rec_id}/preferencia-mt")
def submit_preferencia_mt(rec_id: str, req: PreferenciaMTRequest):
    try:
        return router_nbo.actualizar_preferencia(rec_id, req.preferencia)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/eventos")
def registrar_evento(payload: Dict[str, Any]):
    return router_nbo.registrar_evento(payload)

class EvaluarOportunidadRequest(BaseModel):
    cliente_id: str
    canal: str = "Tienda"
    motivos: List[str] = []
    contexto: Optional[Dict[str, Any]] = None

@app.post("/api/recomendaciones/evaluar")
def evaluar_oportunidad(req: EvaluarOportunidadRequest):
    ctx = req.contexto or {}
    motivos_lower = [m.lower() for m in req.motivos]
    tiene_reclamo = any("reclam" in m for m in motivos_lower)
    tiene_averia = any("aver" in m or "t\u00e9cnic" in m or "tecnic" in m or "falla" in m for m in motivos_lower)
    
    ctx.setdefault("escenario_simulado", True)
    ctx.setdefault("consentimiento_comercial", True)
    ctx.setdefault("bloqueo_presion_activo", False)
    ctx["reclamo_activo"] = tiene_reclamo or ctx.get("reclamo_activo", False)
    ctx["averia_activa"] = tiene_averia or ctx.get("averia_activa", False)
    ctx["incidencia_en_interaccion"] = tiene_reclamo or tiene_averia or ctx.get("incidencia_en_interaccion", False)
    
    try:
        return router_nbo.evaluar_oportunidad(req.cliente_id, canal=req.canal, contexto=ctx)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

