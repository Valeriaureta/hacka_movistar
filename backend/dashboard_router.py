from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import pandas as pd
from datetime import datetime

try:
    from .dashboard_baseline import calcular_kpis, cargar_baseline, construir_funnel, normalizar_motivo
    from .gestiones_store import agregar_gestion, descripcion, leer_gestiones, siguiente_id
except ImportError:
    from dashboard_baseline import calcular_kpis, cargar_baseline, construir_funnel, normalizar_motivo
    from gestiones_store import agregar_gestion, descripcion, leer_gestiones, siguiente_id

router = APIRouter(prefix="/api/gestion", tags=["Dashboard & E2E"])

# Alcances soportados por GET /dashboard
SCOPES = ("consolidado", "historico", "sesion")

class RegistroGestion(BaseModel):
    cliente_id: str
    canal: str
    oferta_id: str
    oferta_nombre: str
    es_movistar_total: bool = False
    estado: str  # "ACEPTADA", "RECHAZADA", "NO_CONTACTADO"
    motivo_rechazo: Optional[str] = None
    precio_oferta: Optional[float] = 0.0
    ahorro_pct: Optional[float] = 0.0

def _init_interacciones_file():
    INTERACCIONES_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not INTERACCIONES_PATH.exists():
        # Crear archivo vacío con columnas y algunos datos demo realistas iniciales
        demo_data = [
            {"id": "G001", "timestamp": "2026-08-22 10:15:00", "cliente_id": "CLI000010", "canal": "Tienda", "oferta_id": "OF020", "oferta_nombre": "Movistar Total Basico", "es_movistar_total": True, "estado": "ACEPTADA", "motivo_rechazo": None, "precio_oferta": 119.92, "ahorro_pct": 20},
            {"id": "G002", "timestamp": "2026-08-22 10:45:00", "cliente_id": "CLI000012", "canal": "Call Out", "oferta_id": "OF004", "oferta_nombre": "Plan Movil Ilimitado", "es_movistar_total": False, "estado": "RECHAZADA", "motivo_rechazo": "Precio muy alto", "precio_oferta": 99.90, "ahorro_pct": 0},
            {"id": "G003", "timestamp": "2026-08-22 11:20:00", "cliente_id": "CLI000015", "canal": "WhatsApp", "oferta_id": "OF021", "oferta_nombre": "Movistar Total Plus", "es_movistar_total": True, "estado": "ACEPTADA", "motivo_rechazo": None, "precio_oferta": 123.44, "ahorro_pct": 35},
            {"id": "G004", "timestamp": "2026-08-22 11:55:00", "cliente_id": "CLI000020", "canal": "Digital", "oferta_id": "OF002", "oferta_nombre": "Plan Movil Plus 25GB", "es_movistar_total": False, "estado": "RECHAZADA", "motivo_rechazo": "Compromiso con otro operador", "precio_oferta": 59.90, "ahorro_pct": 0},
            {"id": "G005", "timestamp": "2026-08-22 12:10:00", "cliente_id": "CLI000025", "canal": "Call In", "oferta_id": "OF020", "oferta_nombre": "Movistar Total Basico", "es_movistar_total": True, "estado": "ACEPTADA", "motivo_rechazo": None, "precio_oferta": 119.92, "ahorro_pct": 20},
            {"id": "G006", "timestamp": "2026-08-22 12:30:00", "cliente_id": "CLI000030", "canal": "Tienda", "oferta_id": "OF015", "oferta_nombre": "Equipo Smartphone Gama Alta", "es_movistar_total": False, "estado": "RECHAZADA", "motivo_rechazo": "No necesita el servicio", "precio_oferta": 90.00, "ahorro_pct": 0},
        ]
        df = pd.DataFrame(demo_data)
        df.to_csv(INTERACCIONES_PATH, index=False)

_init_interacciones_file()

@router.post("/registro")
def registrar_gestion(gestion: RegistroGestion):
    try:
        _init_interacciones_file()
        df = pd.read_csv(INTERACCIONES_PATH)

        nuevo_id = f"G{str(len(df) + 1).zfill(4)}"
        ahora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        nueva_fila = {
            "id": nuevo_id,
            "timestamp": ahora,
            "cliente_id": gestion.cliente_id,
            "canal": gestion.canal,
            "oferta_id": gestion.oferta_id,
            "oferta_nombre": gestion.oferta_nombre,
            "es_movistar_total": gestion.es_movistar_total,
            "estado": gestion.estado.upper(),
            "motivo_rechazo": gestion.motivo_rechazo if gestion.estado.upper() == "RECHAZADA" else None,
            "precio_oferta": gestion.precio_oferta,
            "ahorro_pct": gestion.ahorro_pct
        }

        df = pd.concat([df, pd.DataFrame([nueva_fila])], ignore_index=True)
        df.to_csv(INTERACCIONES_PATH, index=False)

        return {"status": "success", "id": nuevo_id, "message": "Gestión registrada exitosamente"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al registrar gestión: {str(e)}")


def _bloque_vacio() -> Dict[str, Any]:
    return {
        "kpis": calcular_kpis(0, 0, 0, 0, 0),
        "funnel": construir_funnel(0, 0, 0, 0),
        "canales": [],
        "motivos_rechazo": [],
        "ultimas_gestiones": [],
    }


def _agregar_sesion() -> Dict[str, Any]:
    """Agrega las gestiones registradas en vivo desde la plataforma."""
    _init_interacciones_file()
    df = pd.read_csv(INTERACCIONES_PATH)
    if df.empty:
        return _bloque_vacio()

    df["estado"] = df["estado"].astype(str).str.strip().str.upper()
    df["es_movistar_total"] = df["es_movistar_total"].astype(str).str.strip().str.lower().isin(["true", "1"])

    es_aceptada = df["estado"] == "ACEPTADA"
    es_rechazada = df["estado"] == "RECHAZADA"

    total = len(df)
    aceptadas = int(es_aceptada.sum())
    rechazadas = int(es_rechazada.sum())
    contactados = aceptadas + rechazadas
    mt_aceptadas = int((es_aceptada & df["es_movistar_total"]).sum())

    canales = []
    for canal, grupo in df.groupby("canal"):
        g_aceptadas = int((grupo["estado"] == "ACEPTADA").sum())
        g_rechazadas = int((grupo["estado"] == "RECHAZADA").sum())
        g_total = len(grupo)
        canales.append({
            "canal": str(canal),
            "total": g_total,
            "contactados": g_aceptadas + g_rechazadas,
            "aceptadas": g_aceptadas,
            "conversion": round((g_aceptadas / g_total) * 100, 1) if g_total else 0,
        })

    motivos_series = (
        df.loc[es_rechazada, "motivo_rechazo"].map(normalizar_motivo).dropna().value_counts()
    )
    motivos = [
        {"motivo": str(motivo), "cantidad": int(cantidad)}
        for motivo, cantidad in motivos_series.items()
    ]

    ultimas = df.tail(10).iloc[::-1].replace({np.nan: None}).to_dict(orient="records")
    for fila in ultimas:
        fila["motivo_rechazo"] = normalizar_motivo(fila.get("motivo_rechazo"))

    return {
        "kpis": calcular_kpis(total, contactados, aceptadas, rechazadas, mt_aceptadas),
        "funnel": construir_funnel(total, contactados, aceptadas, mt_aceptadas),
        "canales": canales,
        "motivos_rechazo": motivos,
        "ultimas_gestiones": ultimas,
    }


def _sumar_por_clave(bloques: List[List[Dict[str, Any]]], clave: str, campos: List[str]) -> List[Dict[str, Any]]:
    """Fusiona listas de agregados sumando `campos` sobre la misma `clave`."""
    acumulado: Dict[str, Dict[str, Any]] = {}
    for bloque in bloques:
        for item in bloque:
            destino = acumulado.setdefault(item[clave], {clave: item[clave], **{c: 0 for c in campos}})
            for campo in campos:
                destino[campo] += int(item.get(campo, 0) or 0)
    return list(acumulado.values())


def _combinar(historico: Dict[str, Any], sesion: Dict[str, Any]) -> Dict[str, Any]:
    """Suma la linea base historica y las gestiones en vivo en un solo tablero."""
    k_hist, k_ses = historico["kpis"], sesion["kpis"]
    total = k_hist["total"] + k_ses["total"]
    contactados = k_hist["contactados"] + k_ses["contactados"]
    aceptadas = k_hist["aceptadas"] + k_ses["aceptadas"]
    rechazadas = k_hist["rechazadas"] + k_ses["rechazadas"]
    mt_aceptadas = k_hist["mt_aceptadas"] + k_ses["mt_aceptadas"]

    canales = _sumar_por_clave(
        [historico["canales"], sesion["canales"]], "canal", ["total", "contactados", "aceptadas"]
    )
    for canal in canales:
        canal["conversion"] = round((canal["aceptadas"] / canal["total"]) * 100, 1) if canal["total"] else 0
    canales.sort(key=lambda c: c["total"], reverse=True)

    motivos = _sumar_por_clave(
        [historico["motivos_rechazo"], sesion["motivos_rechazo"]], "motivo", ["cantidad"]
    )
    motivos.sort(key=lambda m: m["cantidad"], reverse=True)

    # Las gestiones en vivo llevan timestamp de hoy, asi que encabezan la tabla
    # aunque el historico aporte cientos de miles de filas.
    ultimas = sorted(
        historico["ultimas_gestiones"] + sesion["ultimas_gestiones"],
        key=lambda g: str(g.get("timestamp") or ""),
        reverse=True,
    )[:10]

    return {
        "kpis": calcular_kpis(total, contactados, aceptadas, rechazadas, mt_aceptadas),
        "funnel": construir_funnel(total, contactados, aceptadas, mt_aceptadas),
        "canales": canales,
        "motivos_rechazo": motivos,
        "ultimas_gestiones": ultimas,
    }


@router.get("/dashboard")
def get_dashboard_metrics(scope: str = Query("consolidado", pattern="^(consolidado|historico|sesion)$")):
    """Metricas del funnel E2E.

    - `historico`: linea base real precalculada desde `data/raw/historial_campanias.csv`.
    - `sesion`: solo las gestiones registradas en vivo desde la plataforma.
    - `consolidado`: ambas sumadas (por defecto).
    """
    try:
        sesion = _agregar_sesion()
        baseline = cargar_baseline()
        historico = baseline if baseline else None

        if scope == "sesion" or historico is None:
            payload = sesion
            scope_efectivo = "sesion"
        elif scope == "historico":
            payload = historico
            scope_efectivo = "historico"
        else:
            payload = _combinar(historico, sesion)
            scope_efectivo = "consolidado"

        payload = dict(payload)
        payload["scope"] = scope_efectivo
        payload["fuente"] = {
            "scope_solicitado": scope,
            "historico_disponible": historico is not None,
            "gestiones_en_vivo": sesion["kpis"]["total"],
            "historico": {
                "archivo": historico["origen"]["archivo"],
                "ofrecimientos": historico["origen"]["filas"],
                "clientes_unicos": historico["origen"]["clientes_unicos"],
                "periodo_desde": historico["origen"]["periodo_desde"],
                "periodo_hasta": historico["origen"]["periodo_hasta"],
                "generado_en": historico["generado_en"],
            } if historico else None,
            "en_vivo": {
                "archivo": str(INTERACCIONES_PATH).replace("\\", "/"),
                "gestiones": sesion["kpis"]["total"],
            },
        }
        return payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calcular métricas: {str(e)}")
