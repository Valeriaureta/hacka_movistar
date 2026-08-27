from pathlib import Path
from typing import List, Dict, Any, Optional
import os
import pandas as pd
import uuid

try:
    from .Motor.motor_oficial import (
        recomendar_top3,
        evaluar_oferta,
        recomendar_rebate,
        preparar_candidatos,
        puntuar_candidatos,
        finalizar_recomendacion,
    )
except ImportError:  # Permite ejecutar también desde el directorio backend/
    from Motor.motor_oficial import (
        recomendar_top3,
        evaluar_oferta,
        recomendar_rebate,
        preparar_candidatos,
        puntuar_candidatos,
        finalizar_recomendacion,
    )

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_RAW = BASE_DIR / "data" / "raw"
DATA_PROCESSED = BASE_DIR / "data" / "processed"
DEFAULT_CLIENTES_PATH = DATA_RAW / "dataset_clientes.csv"
DEMO_CLIENTES_PATH = DATA_PROCESSED / "demo" / "dataset_clientes_demo.csv"


import math
import numpy as np


def _sanear_json(obj: Any) -> Any:
    """Convierte recursivamente estructuras a tipos 100% compatibles con JSON estándar."""
    if obj is None:
        return None
    if isinstance(obj, (float, np.floating)):
        return None if (math.isnan(obj) or math.isinf(obj)) else float(obj)
    if isinstance(obj, (int, np.integer)):
        return int(obj)
    if isinstance(obj, (bool, np.bool_)):
        return bool(obj)
    if isinstance(obj, (pd.Timestamp,)):
        return obj.isoformat()
    try:
        if pd.isna(obj):
            return None
    except (TypeError, ValueError):
        pass
    if isinstance(obj, dict):
        return {str(k): _sanear_json(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple, set)):
        return [_sanear_json(v) for v in obj]
    return obj


def _valor_nativo(value: Any) -> Any:
    """Convierte valores de pandas/numpy a tipos seguros para JSON."""
    return _sanear_json(value)


def _registro_json(record: Dict[str, Any]) -> Dict[str, Any]:
    return _sanear_json(record)

class DataLoader:
    _instance = None
    
    def __init__(self):
        configured_path = os.getenv("NBO_CLIENTES_PATH")
        candidates = [
            Path(configured_path).expanduser() if configured_path else None,
            DEFAULT_CLIENTES_PATH,
            DEMO_CLIENTES_PATH,
        ]
        self.clientes_path = next(
            (path.resolve() for path in candidates if path and path.is_file()),
            None,
        )
        if self.clientes_path is None:
            raise FileNotFoundError(
                "No se encontró el dataset de clientes. Coloque dataset_clientes.csv "
                f"en '{DEFAULT_CLIENTES_PATH}' o defina NBO_CLIENTES_PATH."
            )

        self.data_mode = "completo" if self.clientes_path == DEFAULT_CLIENTES_PATH.resolve() else "demo_real"
        self.clientes_df = pd.read_csv(self.clientes_path)
        self.ofertas_df = pd.read_csv(DATA_RAW / "catalogo_ofertas_entrega.csv")
        self._preparar_catalogos()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _preparar_catalogos(self):
        self.ofertas_list = [
            _registro_json(record)
            for record in self.ofertas_df.to_dict(orient="records")
        ]

    def runtime_info(self) -> Dict[str, Any]:
        return {
            "data_mode": self.data_mode,
            "clientes_path": str(self.clientes_path),
            "clientes_total": int(len(self.clientes_df)),
            "ofertas_total": int(len(self.ofertas_df)),
        }

    def get_cliente(self, query: str) -> Optional[Dict[str, Any]]:
        clean_q = str(query).strip().lower()
        
        match = self.clientes_df[self.clientes_df["cliente_id"].str.lower() == clean_q]
        if match.empty:
            match = self.clientes_df[self.clientes_df["cliente_id"].str.lower().str.contains(clean_q)]
            
        if match.empty:
            try:
                idx = int(clean_q)
                if 0 <= idx < len(self.clientes_df):
                    return _registro_json(self.clientes_df.iloc[idx].to_dict())
            except ValueError:
                pass
            return None
        return _registro_json(match.iloc[0].to_dict())

    def get_clientes_sample(self, limit: int = 50) -> List[Dict[str, Any]]:
        return [
            _registro_json(record)
            for record in self.clientes_df.head(limit).to_dict(orient="records")
        ]

class NBORouter:
    def __init__(self):
        self.loader = DataLoader.get_instance()
        self.ruta_modelo = BASE_DIR / "backend" / "Modelo" / "modelo_propension_v2_candidato.joblib"
        self.sessions = {} # Memoria simple para stateful
        self.eventos = []

    @staticmethod
    def contexto_demo(canal: str) -> Dict[str, Any]:
        return {
            "escenario_simulado": True,
            "consentimiento_comercial": True if canal.lower().replace("_", " ") == "call out" else None,
            "bloqueo_presion_activo": False,
            "reclamo_activo": False,
            "averia_activa": False,
            "incidencia_en_interaccion": False,
        }

    def _respuesta_sesion(
        self,
        cliente_raw: Dict[str, Any],
        canal: str,
        contexto: Dict[str, Any],
        recomendacion: Dict[str, Any],
    ) -> Dict[str, Any]:
        rec_id = str(uuid.uuid4())
        self.sessions[rec_id] = {
            "cliente": cliente_raw,
            "canal": canal,
            "contexto": contexto,
            "recomendacion": recomendacion,
        }
        return _sanear_json({
            "recomendacion_id": rec_id,
            "cliente": cliente_raw,
            "motor_nbo": recomendacion,
            "fuente_datos": self.loader.runtime_info(),
        })

    def crear_sesion(self, cliente_raw: Dict[str, Any], canal: str = "Tienda", contexto: Dict = None) -> Dict[str, Any]:
        ctx = contexto or self.contexto_demo(canal)
        
        recomendacion = recomendar_top3(
            cliente=cliente_raw,
            ofertas=self.loader.ofertas_list,
            canal=canal,
            contexto=ctx,
            ruta_modelo=self.ruta_modelo
        )
        
        return self._respuesta_sesion(cliente_raw, canal, ctx, recomendacion)

    def enriquecer_clientes(
        self,
        clientes_raw: List[Dict[str, Any]],
        canal: str = "Tienda",
    ) -> List[Dict[str, Any]]:
        """Calcula varios clientes en una sola inferencia vectorizada."""
        if not clientes_raw:
            return []

        contexto_por_id: Dict[str, Dict[str, Any]] = {}
        exclusiones_por_id: Dict[str, List[Dict[str, Any]]] = {}
        cliente_por_id = {str(cliente["cliente_id"]): cliente for cliente in clientes_raw}
        candidatos = []

        for cliente in clientes_raw:
            cliente_id = str(cliente["cliente_id"])
            contexto = self.contexto_demo(canal)
            preparados, exclusiones, _ = preparar_candidatos(
                cliente,
                self.loader.ofertas_list,
                canal=canal,
                contexto=contexto,
            )
            candidatos.extend(preparados)
            contexto_por_id[cliente_id] = contexto
            exclusiones_por_id[cliente_id] = exclusiones

        puntuados = puntuar_candidatos(candidatos, cliente_por_id, self.ruta_modelo)
        puntuados_por_id: Dict[str, List[Dict[str, Any]]] = {
            cliente_id: [] for cliente_id in cliente_por_id
        }
        for candidato in puntuados:
            puntuados_por_id[str(candidato["cliente_id"])].append(candidato)

        respuestas = []
        for cliente in clientes_raw:
            cliente_id = str(cliente["cliente_id"])
            recomendacion = finalizar_recomendacion(
                cliente,
                puntuados_por_id[cliente_id],
                exclusiones_por_id[cliente_id],
                canal,
                contexto_por_id[cliente_id],
            )
            respuestas.append(
                self._respuesta_sesion(
                    cliente,
                    canal,
                    contexto_por_id[cliente_id],
                    recomendacion,
                )
            )
        return respuestas

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
            "motor_nbo": recomendacion,
            "fuente_datos": self.loader.runtime_info(),
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
