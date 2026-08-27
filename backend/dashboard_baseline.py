"""Linea base del Dashboard E2E a partir del historico real de campanias.

`data/raw/historial_campanias.csv` (300k filas / 47 MB) es la fuente de prueba
del backend, pero no puede leerse en cada request: el dashboard hace polling
cada 15 s y ademas ese CSV esta en .gitignore por tamano, asi que nunca llega
al bundle serverless de Vercel. Por eso se precalcula una sola vez a un JSON
compacto que si viaja versionado y que el router sirve como linea base.

Regenerar tras cambiar el historico:

    python -m backend.dashboard_baseline
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
HISTORIAL_PATH = DATA_DIR / "raw" / "historial_campanias.csv"
CATALOGO_PATH = DATA_DIR / "raw" / "catalogo_ofertas_entrega.csv"
BASELINE_PATH = DATA_DIR / "processed" / "dashboard" / "baseline_historico.json"

# El historico guarda el motivo como codigo snake_case y la UI (RebateModal)
# lo manda en prosa. Ambos aterrizan en la misma etiqueta para que el donut de
# rechazos no parta la misma causa en dos porciones.
MOTIVOS_CANONICOS = {
    "precio": "Precio muy alto",
    "precio muy alto": "Precio muy alto",
    "no_necesita": "No necesita el servicio",
    "no necesita el servicio": "No necesita el servicio",
    "ya_tiene_similar": "Ya tiene un servicio similar",
    "compromiso con otro operador": "Ya tiene un servicio similar",
    "mal_momento": "No es buen momento",
    "no_confia": "Desconfianza / mala experiencia",
    "mala experiencia previa": "Desconfianza / mala experiencia",
    "otro": "Otros motivos",
}

# `pendiente` en el historico equivale exactamente a `no_contactado`: son los
# ofrecimientos que nunca llegaron al cliente.
ESTADOS_HISTORICO = {
    "aceptada": "ACEPTADA",
    "rechazada": "RECHAZADA",
    "pendiente": "NO_CONTACTADO",
}

ETAPAS_FUNNEL = [
    ("1. Ofrecimientos Evaluados por el Motor", "#005C84",
     "Registros priorizados por el modelo de propension NBO"),
    ("2. Contactos Efectivos", "#0078A8",
     "Ofrecimientos que si llegaron al cliente en alguno de los canales"),
    ("3. Ofertas Aceptadas", "#00C6D7",
     "Cierre comercial confirmado por el asesor"),
    ("4. Movistar Total Ganados", "#7AB800",
     "Cierres convergentes fijo + movil (subconjunto de aceptadas)"),
]


def normalizar_motivo(motivo: Any) -> Optional[str]:
    """Lleva un motivo de rechazo a su etiqueta canonica de presentacion."""
    if motivo is None:
        return None
    texto = str(motivo).strip()
    if not texto or texto.lower() in {"nan", "none", "null"}:
        return None
    return MOTIVOS_CANONICOS.get(texto.lower(), texto)


def _a_bool(valor: Any) -> bool:
    if isinstance(valor, bool):
        return valor
    return str(valor).strip().lower() in {"true", "1", "si", "sí"}


def construir_funnel(total: int, contactados: int, aceptadas: int, mt: int) -> List[Dict[str, Any]]:
    """Arma el embudo en una unica unidad (ofrecimientos) y monotonicamente decreciente."""
    cantidades = [total, contactados, aceptadas, mt]
    return [
        {
            "etapa": etapa,
            "cantidad": int(cantidad),
            "fill": color,
            "detalle": detalle,
            "unidad": "ofrecimientos",
        }
        for (etapa, color, detalle), cantidad in zip(ETAPAS_FUNNEL, cantidades)
    ]


def calcular_kpis(total: int, contactados: int, aceptadas: int, rechazadas: int, mt: int) -> Dict[str, Any]:
    return {
        "total": int(total),
        "contactados": int(contactados),
        "aceptadas": int(aceptadas),
        "rechazadas": int(rechazadas),
        "mt_aceptadas": int(mt),
        "tasa_conversion": round((aceptadas / total) * 100, 1) if total else 0,
        "tasa_contactabilidad": round((contactados / total) * 100, 1) if total else 0,
        "share_mt": round((mt / aceptadas) * 100, 1) if aceptadas else 0,
    }


def construir_baseline() -> Dict[str, Any]:
    """Recorre el historico crudo y devuelve los agregados listos para servir."""
    import pandas as pd

    if not HISTORIAL_PATH.exists():
        raise FileNotFoundError(
            f"No se encontro {HISTORIAL_PATH}. Es un dataset ignorado por git: "
            "restauralo desde la fuente original antes de regenerar la linea base."
        )

    df = pd.read_csv(
        HISTORIAL_PATH,
        usecols=[
            "ofrecimiento_id", "cliente_id", "oferta_id", "fecha", "canal",
            "resultado", "motivo_rechazo", "nombre_oferta", "oferta_es_mt",
        ],
    )
    df["resultado"] = df["resultado"].astype(str).str.strip().str.lower()
    df["es_mt"] = df["oferta_es_mt"].map(_a_bool)

    es_aceptada = df["resultado"] == "aceptada"
    es_rechazada = df["resultado"] == "rechazada"

    total = len(df)
    aceptadas = int(es_aceptada.sum())
    rechazadas = int(es_rechazada.sum())
    contactados = aceptadas + rechazadas
    mt_aceptadas = int((es_aceptada & df["es_mt"]).sum())

    canales: List[Dict[str, Any]] = []
    for canal, grupo in df.groupby("canal"):
        g_aceptadas = int((grupo["resultado"] == "aceptada").sum())
        g_rechazadas = int((grupo["resultado"] == "rechazada").sum())
        g_total = len(grupo)
        canales.append({
            "canal": str(canal),
            "total": g_total,
            "contactados": g_aceptadas + g_rechazadas,
            "aceptadas": g_aceptadas,
            "conversion": round((g_aceptadas / g_total) * 100, 1) if g_total else 0,
        })
    canales.sort(key=lambda c: c["total"], reverse=True)

    motivos_series = (
        df.loc[es_rechazada, "motivo_rechazo"].map(normalizar_motivo).dropna().value_counts()
    )
    motivos = [
        {"motivo": str(motivo), "cantidad": int(cantidad)}
        for motivo, cantidad in motivos_series.items()
    ]

    # Precio y ahorro no viven en el historico: se recuperan del catalogo oficial.
    precios: Dict[str, Dict[str, float]] = {}
    if CATALOGO_PATH.exists():
        cat = pd.read_csv(CATALOGO_PATH, usecols=["oferta_id", "precio_mensual", "ahorro_pct"])
        precios = {
            str(row.oferta_id): {
                "precio": float(row.precio_mensual),
                "ahorro": float(row.ahorro_pct),
            }
            for row in cat.itertuples()
        }

    ultimas: List[Dict[str, Any]] = []
    for row in df.sort_values("fecha").tail(10).iloc[::-1].itertuples():
        tarifa = precios.get(str(row.oferta_id), {"precio": 0.0, "ahorro": 0.0})
        ultimas.append({
            "id": str(row.ofrecimiento_id),
            "timestamp": f"{row.fecha} 00:00:00",
            "cliente_id": str(row.cliente_id),
            "canal": str(row.canal),
            "oferta_id": str(row.oferta_id),
            "oferta_nombre": str(row.nombre_oferta),
            "es_movistar_total": bool(row.es_mt),
            "estado": ESTADOS_HISTORICO.get(row.resultado, row.resultado.upper()),
            "motivo_rechazo": normalizar_motivo(row.motivo_rechazo),
            "precio_oferta": tarifa["precio"],
            "ahorro_pct": tarifa["ahorro"],
        })

    return {
        "generado_en": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "origen": {
            "archivo": str(HISTORIAL_PATH.relative_to(BASE_DIR)).replace("\\", "/"),
            "filas": total,
            "clientes_unicos": int(df["cliente_id"].nunique()),
            "periodo_desde": str(df["fecha"].min()),
            "periodo_hasta": str(df["fecha"].max()),
        },
        "kpis": calcular_kpis(total, contactados, aceptadas, rechazadas, mt_aceptadas),
        "funnel": construir_funnel(total, contactados, aceptadas, mt_aceptadas),
        "canales": canales,
        "motivos_rechazo": motivos,
        "ultimas_gestiones": ultimas,
    }


_CACHE: Optional[Dict[str, Any]] = None


def cargar_baseline() -> Optional[Dict[str, Any]]:
    """Devuelve la linea base cacheada; la reconstruye si falta y hay historico local."""
    global _CACHE
    if _CACHE is not None:
        return _CACHE

    if BASELINE_PATH.exists():
        try:
            with BASELINE_PATH.open(encoding="utf-8") as archivo:
                _CACHE = json.load(archivo)
            return _CACHE
        except (json.JSONDecodeError, OSError):
            pass

    if HISTORIAL_PATH.exists():
        try:
            _CACHE = guardar_baseline()
            return _CACHE
        except Exception:
            return None

    return None


def guardar_baseline() -> Dict[str, Any]:
    baseline = construir_baseline()
    BASELINE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with BASELINE_PATH.open("w", encoding="utf-8") as archivo:
        json.dump(baseline, archivo, ensure_ascii=False, indent=2)
    return baseline


if __name__ == "__main__":
    resultado = guardar_baseline()
    kpis = resultado["kpis"]
    print(f"Linea base escrita en {BASELINE_PATH}")
    print(f"  Ofrecimientos historicos : {kpis['total']:,}")
    print(f"  Contactos efectivos      : {kpis['contactados']:,}")
    print(f"  Aceptadas                : {kpis['aceptadas']:,} ({kpis['tasa_conversion']}%)")
    print(f"  Movistar Total ganados   : {kpis['mt_aceptadas']:,} (share {kpis['share_mt']}%)")
