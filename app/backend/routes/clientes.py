from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.backend.data_loader import get_clientes_paginated, get_cliente_by_id
from app.backend.nbo_service import obtener_nbo_cliente

router = APIRouter(prefix="/api/clientes", tags=["Clientes"])

@router.get("")
def list_clientes(
    page: int = Query(1, ge=1),
    limit: int = Query(15, ge=1, le=100),
    search: Optional[str] = None,
    elegible_mt: Optional[bool] = None,
    departamento: Optional[str] = None,
    riesgo: Optional[str] = None
):
    """Lista clientes con paginación y filtros rápidos."""
    return get_clientes_paginated(
        page=page,
        limit=limit,
        search=search,
        elegible_mt=elegible_mt,
        departamento=departamento,
        riesgo=riesgo
    )

@router.get("/{cliente_id}")
def get_cliente(cliente_id: str):
    """Obtiene el perfil 360 de un cliente específico."""
    cliente = get_cliente_by_id(cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail=f"Cliente {cliente_id} no encontrado")
    return cliente

@router.get("/{cliente_id}/nbo")
def get_cliente_nbo(cliente_id: str):
    """Obtiene el reporte Top-3 NBO con explicabilidad XAI y speech de rebate."""
    nbo = obtener_nbo_cliente(cliente_id)
    if not nbo:
        raise HTTPException(status_code=404, detail=f"No se encontró recomendación para {cliente_id}")
    return nbo
