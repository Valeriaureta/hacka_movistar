from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.backend.nbo_service import simular_scoring_adhoc

router = APIRouter(prefix="/api/scoring", tags=["Scoring"])

class ScoringRequest(BaseModel):
    cliente_id: str
    oferta_id: str
    canal: Optional[str] = None

@router.post("")
def calcular_scoring_adhoc(req: ScoringRequest):
    """Calcula el score de aceptación y explicabilidad ad-hoc para cliente-oferta."""
    try:
        res = simular_scoring_adhoc(
            cliente_id=req.cliente_id,
            oferta_id=req.oferta_id,
            canal=req.canal
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Registramos el error de manera segura en el servidor (en un entorno real usaríamos logging)
        print(f"Error interno en scoring: {repr(e)}")
        # Nunca exponemos el detalle de la excepción (str(e)) al cliente para evitar fugas de información interna
        raise HTTPException(status_code=500, detail="Error interno del servidor al procesar el scoring.")
