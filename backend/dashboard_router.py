from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from pathlib import Path
import pandas as pd
import numpy as np
from datetime import datetime
import os

router = APIRouter(prefix="/api/gestion", tags=["Dashboard & E2E"])

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
INTERACCIONES_PATH = (
    Path("/tmp") / "interacciones_e2e.csv"
    if os.getenv("VERCEL")
    else DATA_DIR / "interacciones_e2e.csv"
)

# Columnas del archivo de registro
COLUMNAS_INTERACCIONES = [
    "id", "timestamp", "cliente_id", "canal", "oferta_id", 
    "oferta_nombre", "es_movistar_total", "estado", 
    "motivo_rechazo", "precio_oferta", "ahorro_pct"
]

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

@router.get("/dashboard")
def get_dashboard_metrics():
    try:
        _init_interacciones_file()
        df = pd.read_csv(INTERACCIONES_PATH)
        
        total_gestiones = len(df)
        if total_gestiones == 0:
            return {
                "kpis": {"total": 0, "aceptadas": 0, "rechazadas": 0, "tasa_conversion": 0, "share_mt": 0},
                "funnel": [],
                "canales": [],
                "motivos_rechazo": [],
                "ultimas_gestiones": []
            }
        
        aceptadas = len(df[df["estado"] == "ACEPTADA"])
        rechazadas = len(df[df["estado"] == "RECHAZADA"])
        tasa_conversion = round((aceptadas / total_gestiones) * 100, 1) if total_gestiones > 0 else 0
        
        # Share Movistar Total sobre aceptadas
        mt_aceptadas = len(df[(df["estado"] == "ACEPTADA") & (df["es_movistar_total"] == True)])
        share_mt = round((mt_aceptadas / aceptadas) * 100, 1) if aceptadas > 0 else 0
        
        # 1. Funnel E2E
        # Base total simulada + interacciones reales
        clientes_evaluados = total_gestiones * 3 + 120 # Escala del funnel
        contactados = total_gestiones * 2 + 80
        funnel_data = [
            {"etapa": "1. Clientes Evaluados (IA)", "cantidad": clientes_evaluados, "fill": "#6366f1"},
            {"etapa": "2. Contactados Efectivos", "cantidad": contactados, "fill": "#3b82f6"},
            {"etapa": "3. Ofertas NBO Presentadas", "cantidad": total_gestiones, "fill": "#06b6d4"},
            {"etapa": "4. Ventas Aceptadas", "cantidad": aceptadas, "fill": "#10b981"},
            {"etapa": "5. Movistar Total Ganados", "cantidad": mt_aceptadas, "fill": "#059669"}
        ]
        
        # 2. Desglose por Canal
        canales_list = []
        for canal, g in df.groupby("canal"):
            tot = len(g)
            acep = len(g[g["estado"] == "ACEPTADA"])
            conv = round((acep / tot) * 100, 1) if tot > 0 else 0
            canales_list.append({
                "canal": canal,
                "total": tot,
                "aceptadas": acep,
                "conversion": conv
            })
            
        # 3. Motivos de Rechazo
        df_rechazos = df[df["estado"] == "RECHAZADA"]
        motivos_list = []
        if not df_rechazos.empty:
            for motivo, count in df_rechazos["motivo_rechazo"].value_counts().items():
                if pd.notna(motivo) and str(motivo).strip():
                    motivos_list.append({"motivo": str(motivo), "cantidad": int(count)})
        if not motivos_list:
            motivos_list = [{"motivo": "Precio muy alto", "cantidad": 1}]

        # 4. Últimas 10 gestiones para la tabla
        df_clean = df.tail(10).iloc[::-1].replace({np.nan: None})
        ultimas = df_clean.to_dict(orient="records")

        return {
            "kpis": {
                "total": total_gestiones,
                "aceptadas": aceptadas,
                "rechazadas": rechazadas,
                "tasa_conversion": tasa_conversion,
                "share_mt": share_mt,
                "mt_aceptadas": mt_aceptadas
            },
            "funnel": funnel_data,
            "canales": canales_list,
            "motivos_rechazo": motivos_list,
            "ultimas_gestiones": ultimas
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calcular métricas: {str(e)}")
