from pathlib import Path
from typing import Dict, Any, List
import joblib
import pandas as pd
import numpy as np

BASE_DIR = Path(__file__).resolve().parents[2]
MODELO_PATH = BASE_DIR / "Modelo" / "modelo_propension_v2_candidato.joblib"

COLUMNAS_MODELO = [
    "antiguedad_meses", "monto_facturado_prom", "consumo_datos_gb_prom",
    "consumo_voz_min_prom", "consumo_sms_prom", "uso_app_movistar_prom",
    "monto_facturado_prom_6m", "dias_mora_prom", "precio_mensual",
    "ahorro_pct", "gb_incluidos_modelo", "tipo_cliente", "tiene_movil",
    "tiene_hogar", "oferta_hogar_id", "tiene_internet_hogar",
    "es_movistar_total", "elegible_mt", "plan_actual_id", "edad_rango",
    "ubicacion_departamento", "es_usuario_app", "meses_moroso",
    "n_reclamos", "n_actividad_canal", "canal_mas_usado", "oferta_id",
    "canal", "tipo_oferta", "oferta_es_mt", "segmento_objetivo",
    "cluster_hogar", "oferta_ilimitada",
]

COLUMNAS_CATEGORICAS = [
    "tipo_cliente", "tiene_movil", "tiene_hogar", "oferta_hogar_id",
    "tiene_internet_hogar", "es_movistar_total", "elegible_mt",
    "plan_actual_id", "edad_rango", "ubicacion_departamento",
    "es_usuario_app", "meses_moroso", "n_reclamos", "n_actividad_canal",
    "canal_mas_usado", "oferta_id", "canal", "tipo_oferta",
    "oferta_es_mt", "segmento_objetivo", "cluster_hogar",
    "oferta_ilimitada",
]

class PredictorNBO:
    _instance = None
    _pipeline = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        if MODELO_PATH.exists():
            self._pipeline = joblib.load(MODELO_PATH)
        else:
            print(f"Advertencia: No se encontró el modelo en {MODELO_PATH}")

    def predecir_scoring(self, datos_df: pd.DataFrame) -> np.ndarray:
        """Calcula probabilidades de aceptación usando el modelo V2 candidato."""
        if self._pipeline is None:
            return np.full(len(datos_df), 0.5)

        entrada = datos_df.copy()
        
        # Asegurar columnas requeridas
        for col in COLUMNAS_MODELO:
            if col not in entrada.columns:
                entrada[col] = np.nan

        # Formato categórico
        for col in COLUMNAS_CATEGORICAS:
            entrada[col] = entrada[col].astype("object")
            mask = entrada[col].notna()
            entrada.loc[mask, col] = entrada.loc[mask, col].astype(str)

        X = entrada[COLUMNAS_MODELO]
        return self._pipeline.predict_proba(X)[:, 1]

    def explicar_prediccion(self, cliente: Dict[str, Any], oferta: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Genera drivers XAI (Explainable AI) basados en el perfil del cliente y la oferta."""
        drivers = []
        
        # 1. Consumo de datos
        datos_gb = round(float(cliente.get("consumo_datos_gb_prom", 0) or 0), 1)
        if datos_gb > 25:
            drivers.append({
                "driver": "Consumo Intensivo de Datos",
                "peso": round(min(0.45, 0.20 + (datos_gb / 100)), 2),
                "detalle": f"Supera los 25 GB/mes habitualmente ({datos_gb} GB)",
                "tipo": "positivo"
            })
        elif datos_gb < 5:
            drivers.append({
                "driver": "Bajo Consumo de Datos",
                "peso": -0.15,
                "detalle": f"Solo consume {datos_gb} GB/mes",
                "tipo": "alerta"
            })

        # 2. Elegibilidad / Movistar Total
        if cliente.get("elegible_mt", False) and oferta.get("es_movistar_total", False):
            drivers.append({
                "driver": "Alta Elegibilidad Convergente (MT)",
                "peso": 0.38,
                "detalle": "Cliente con móvil y hogar apto para unificación con descuento",
                "tipo": "positivo"
            })

        # 3. Mora / Score Churn / Reclamos
        n_reclamos = int(cliente.get("n_reclamos", 0) or 0)
        meses_moroso = int(cliente.get("meses_moroso", 0) or 0)
        dias_mora = float(cliente.get("dias_mora_prom", 0) or 0)

        if n_reclamos > 1:
            drivers.append({
                "driver": "Fricción por Reclamos Previos",
                "peso": -0.30,
                "detalle": f"{n_reclamos} reclamos registrados en los últimos 6 meses",
                "tipo": "alerta"
            })
        elif meses_moroso == 0 and dias_mora == 0:
            drivers.append({
                "driver": "Comportamiento de Pago Impecable",
                "peso": 0.25,
                "detalle": "0 días de mora histórica, perfil de bajo riesgo crediticio",
                "tipo": "positivo"
            })
        elif meses_moroso > 0:
            drivers.append({
                "driver": "Riesgo de Cobranza / Mora",
                "peso": -0.22,
                "detalle": f"{meses_moroso} meses con mora acumulada",
                "tipo": "alerta"
            })

        # 4. Ahorro económico
        ahorro = float(oferta.get("ahorro_pct", 0) or 0)
        if ahorro > 20:
            drivers.append({
                "driver": f"Propuesta de Ahorro Agresiva ({int(ahorro)}%)",
                "peso": 0.30,
                "detalle": f"Ahorro de {int(ahorro)}% comparado con la contratación individual",
                "tipo": "positivo"
            })

        # Fallback si no hay suficientes drivers
        if not drivers:
            drivers.append({
                "driver": "Afinidad de Perfil General",
                "peso": 0.20,
                "detalle": "Parámetros acordes al segmento del cliente",
                "tipo": "positivo"
            })

        return sorted(drivers, key=lambda x: abs(x["peso"]), reverse=True)[:3]
