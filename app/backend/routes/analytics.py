from fastapi import APIRouter
from app.backend.data_loader import get_analytics_kpis

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("")
def get_analytics():
    """Retorna métricas agregadas de negocio, elegibilidad MT, canales y departamentos."""
    return get_analytics_kpis()
