from typing import Optional
from fastapi import APIRouter, HTTPException
from app.backend.data_loader import get_ofertas_catalog, get_oferta_by_id

router = APIRouter(prefix="/api/ofertas", tags=["Ofertas"])

@router.get("")
def list_ofertas(tipo_oferta: Optional[str] = None):
    """Retorna el catálogo completo de ofertas."""
    return get_ofertas_catalog(tipo_oferta=tipo_oferta)

@router.get("/{oferta_id}")
def get_oferta(oferta_id: str):
    """Retorna los datos de una oferta específica."""
    oferta = get_oferta_by_id(oferta_id)
    if not oferta:
        raise HTTPException(status_code=404, detail=f"Oferta {oferta_id} no encontrada")
    return oferta
