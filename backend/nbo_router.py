from pathlib import Path
from typing import List, Dict, Any, Optional
import pandas as pd
import uuid

from Motor.motor_oficial import recomendar_top3, evaluar_oferta, recomendar_rebate

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_RAW = BASE_DIR / "data" / "raw"

class DataLoader:
    _instance = None
    
    def __init__(self):
        # Usamos el dataset existente en Sistema propuesto/data
        self.clientes_df = pd.read_csv(DATA_RAW / "dataset_clientes.csv")
        self.ofertas_df = pd.read_csv(DATA_RAW / "catalogo_ofertas_entrega.csv")
        self._preparar_catalogos()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _preparar_catalogos(self):
        self.ofertas_list = self.ofertas_df.to_dict(orient="records")

    def get_cliente(self, query: str) -> Optional[Dict[str, Any]]:
        clean_q = str(query).strip().lower()
        
        match = self.clientes_df[self.clientes_df["cliente_id"].str.lower() == clean_q]
        if match.empty:
            match = self.clientes_df[self.clientes_df["cliente_id"].str.lower().str.contains(clean_q)]
            
        if match.empty:
            try:
                idx = int(clean_q)
                if 0 <= idx < len(self.clientes_df):
                    return self.clientes_df.iloc[idx].to_dict()
            except ValueError:
                pass
            return None
        return match.iloc[0].to_dict()

    def get_clientes_sample(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.clientes_df.head(limit).to_dict(orient="records")

class NBORouter:
    def __init__(self):
        self.loader = DataLoader.get_instance()
        self.ruta_modelo = BASE_DIR / "backend" / "Modelo" / "modelo_propension_v2_candidato.joblib"
        self.sessions = {} # Memoria simple para stateful
        self.eventos = []

    def crear_sesion(self, cliente_raw: Dict[str, Any], canal: str = "Tienda", contexto: Dict = None) -> Dict[str, Any]:
        rec_id = str(uuid.uuid4())
        ctx = contexto or {
            "escenario_simulado": True,
            "consentimiento_comercial": True,
            "bloqueo_presion_activo": False,
            "reclamo_activo": False,
            "averia_activa": False,
            "incidencia_en_interaccion": False
        }
        
        recomendacion = recomendar_top3(
            cliente=cliente_raw,
            ofertas=self.loader.ofertas_list,
            canal=canal,
            contexto=ctx,
            ruta_modelo=self.ruta_modelo
        )
        
        self.sessions[rec_id] = {
            "cliente": cliente_raw,
            "canal": canal,
            "contexto": ctx,
            "recomendacion": recomendacion
        }
        
        return {
            "recomendacion_id": rec_id,
            "cliente": cliente_raw,
            "motor_nbo": recomendacion
        }

    def actualizar_preferencia(self, rec_id: str, preferencia: str) -> Dict[str, Any]:
        if rec_id not in self.sessions:
            raise ValueError("Sesión no encontrada")
            
        ses = self.sessions[rec_id]
        ses["contexto"]["preferencia_mt"] = preferencia
        
        recomendacion = recomendar_top3(
            cliente=ses["cliente"],
            ofertas=self.loader.ofertas_list,
            canal=ses["canal"],
            contexto=ses["contexto"],
            ruta_modelo=self.ruta_modelo
        )
        
        ses["recomendacion"] = recomendacion
        
        return {
            "recomendacion_id": rec_id,
            "cliente": ses["cliente"],
            "motor_nbo": recomendacion
        }

    def registrar_evento(self, payload: Dict[str, Any]):
        self.eventos.append(payload)
        return {"status": "ok", "event_count": len(self.eventos)}

    def evaluar_oportunidad(self, cliente_query: str, canal: str = "Tienda", contexto: Dict = None) -> Dict[str, Any]:
        cliente_raw = self.loader.get_cliente(cliente_query)
        if not cliente_raw:
            raise ValueError(f"Cliente '{cliente_query}' no encontrado")
        return self.crear_sesion(cliente_raw, canal=canal, contexto=contexto)

    def enriquecer_cliente(self, cliente_raw: Dict[str, Any], canal: str = "Tienda") -> Dict[str, Any]:
        """
        Estructura el payload usando crear_sesion para inyectar statefulness.
        """
        return self.crear_sesion(cliente_raw, canal)
