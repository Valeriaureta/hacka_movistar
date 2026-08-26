from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from .ai_service import AIService

router = APIRouter(prefix="/api/ai", tags=["Generative AI (Gemini)"])
ai_service = AIService.get_instance()

class PitchRequest(BaseModel):
    cliente: Dict[str, Any]
    oferta: Dict[str, Any]
    canal: Optional[str] = "Tienda"

class RebateRequest(BaseModel):
    cliente: Dict[str, Any]
    oferta: Dict[str, Any]
    motivo_rechazo: str
    canal: Optional[str] = "Tienda"

@router.post("/pitch")
def generate_pitch(req: PitchRequest):
    try:
        pitch = ai_service.generate_sales_pitch(req.cliente, req.oferta, canal=req.canal)
        return {
            "pitch": pitch,
            "origen": "Gemini AI" if ai_service.is_configured else "Heurístico NBO",
            "is_live_ai": ai_service.is_configured
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar pitch con IA: {str(e)}")

@router.post("/rebate")
def generate_rebate(req: RebateRequest):
    try:
        res = ai_service.generate_objection_handling(
            req.cliente, 
            req.oferta, 
            req.motivo_rechazo, 
            canal=req.canal
        )
        return {
            "argumento_rebate": res.get("argumento_rebate"),
            "tip_asesor": res.get("tip_asesor"),
            "origen": res.get("origen"),
            "is_live_ai": ai_service.is_configured
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al generar rebate con IA: {str(e)}")

@router.get("/status")
def get_ai_status():
    return {
        "is_configured": ai_service.is_configured,
        "model": ai_service.model_name,
        "provider": "Google Gemini" if ai_service.is_configured else "Local Fallback"
    }
