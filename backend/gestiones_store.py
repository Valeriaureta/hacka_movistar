"""Persistencia del log de gestiones E2E.

En local el log vive en `data/interacciones_e2e.csv` y todo funciona. En Vercel
el filesystem es de solo lectura salvo `/tmp`, que ademas es efimero y no se
comparte entre instancias: una gestion registrada durante la demo desaparece en
el siguiente cold start y no la ve otra lambda.

Si el entorno expone un Redis REST (Upstash o Vercel KV, que es Upstash por
debajo) el log se guarda ahi como una lista JSON y sobrevive. Si no hay ninguna
credencial, o si Redis falla, se degrada al CSV sin romper nada y lo reporta en
`descripcion()` para que el dashboard pueda decir la verdad sobre su origen.

Provisionar en Vercel (opcional):

    Storage -> Upstash Redis -> Connect Project

Vercel inyecta `KV_REST_API_URL` y `KV_REST_API_TOKEN` (o los equivalentes
`UPSTASH_REDIS_REST_*`); este modulo los detecta solo, sin tocar codigo.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"

# En Vercel solo /tmp es escribible; fuera de Vercel se usa el CSV versionado.
CSV_PATH = (
    Path("/tmp") / "interacciones_e2e.csv"
    if os.getenv("VERCEL")
    else DATA_DIR / "interacciones_e2e.csv"
)

COLUMNAS = [
    "id", "timestamp", "cliente_id", "canal", "oferta_id",
    "oferta_nombre", "es_movistar_total", "estado",
    "motivo_rechazo", "precio_oferta", "ahorro_pct",
]

REDIS_KEY = "movinexo:gestiones_e2e"
REDIS_TIMEOUT = 3  # El dashboard hace polling cada 15 s: no puede colgarse aqui.

# Gestiones de arranque para que el tablero nunca aparezca vacio en una demo.
SEMILLA_DEMO: List[Dict[str, Any]] = [
    {"id": "G001", "timestamp": "2026-08-22 10:15:00", "cliente_id": "CLI000010", "canal": "Tienda", "oferta_id": "OF020", "oferta_nombre": "Movistar Total Basico", "es_movistar_total": True, "estado": "ACEPTADA", "motivo_rechazo": None, "precio_oferta": 119.92, "ahorro_pct": 20},
    {"id": "G002", "timestamp": "2026-08-22 10:45:00", "cliente_id": "CLI000012", "canal": "Call Out", "oferta_id": "OF004", "oferta_nombre": "Plan Movil Ilimitado", "es_movistar_total": False, "estado": "RECHAZADA", "motivo_rechazo": "Precio muy alto", "precio_oferta": 99.90, "ahorro_pct": 0},
    {"id": "G003", "timestamp": "2026-08-22 11:20:00", "cliente_id": "CLI000015", "canal": "WhatsApp", "oferta_id": "OF021", "oferta_nombre": "Movistar Total Plus", "es_movistar_total": True, "estado": "ACEPTADA", "motivo_rechazo": None, "precio_oferta": 123.44, "ahorro_pct": 35},
    {"id": "G004", "timestamp": "2026-08-22 11:55:00", "cliente_id": "CLI000020", "canal": "Digital", "oferta_id": "OF002", "oferta_nombre": "Plan Movil Plus 25GB", "es_movistar_total": False, "estado": "RECHAZADA", "motivo_rechazo": "Compromiso con otro operador", "precio_oferta": 59.90, "ahorro_pct": 0},
    {"id": "G005", "timestamp": "2026-08-22 12:10:00", "cliente_id": "CLI000025", "canal": "Call In", "oferta_id": "OF020", "oferta_nombre": "Movistar Total Basico", "es_movistar_total": True, "estado": "ACEPTADA", "motivo_rechazo": None, "precio_oferta": 119.92, "ahorro_pct": 20},
    {"id": "G006", "timestamp": "2026-08-22 12:30:00", "cliente_id": "CLI000030", "canal": "Tienda", "oferta_id": "OF015", "oferta_nombre": "Equipo Smartphone Gama Alta", "es_movistar_total": False, "estado": "RECHAZADA", "motivo_rechazo": "No necesita el servicio", "precio_oferta": 90.00, "ahorro_pct": 0},
]


# --------------------------------------------------------------------------
# Backend remoto: Redis REST (Upstash / Vercel KV)
# --------------------------------------------------------------------------

def _credenciales_redis() -> Optional[tuple]:
    """Devuelve (url, token) si el entorno expone un Redis REST."""
    pares = (
        ("KV_REST_API_URL", "KV_REST_API_TOKEN"),
        ("UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"),
    )
    for clave_url, clave_token in pares:
        url = os.getenv(clave_url, "").strip().rstrip("/")
        token = os.getenv(clave_token, "").strip()
        if url and token:
            return url, token
    return None


# None = todavia no se probo; True/False = resultado del ultimo intento.
_REDIS_OK: Optional[bool] = None
_ULTIMO_ERROR: Optional[str] = None


def _comando_redis(*args: Any) -> Any:
    """Ejecuta un comando contra el Redis REST. Lanza si falla."""
    credenciales = _credenciales_redis()
    if not credenciales:
        raise RuntimeError("Sin credenciales de Redis REST en el entorno")

    url, token = credenciales
    cuerpo = json.dumps([str(a) for a in args]).encode("utf-8")
    peticion = urllib.request.Request(
        url,
        data=cuerpo,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(peticion, timeout=REDIS_TIMEOUT) as respuesta:
        payload = json.loads(respuesta.read().decode("utf-8"))
    if isinstance(payload, dict) and payload.get("error"):
        raise RuntimeError(str(payload["error"]))
    return payload.get("result") if isinstance(payload, dict) else payload


def _leer_redis() -> List[Dict[str, Any]]:
    filas = _comando_redis("LRANGE", REDIS_KEY, 0, -1) or []
    gestiones: List[Dict[str, Any]] = []
    for fila in filas:
        try:
            gestiones.append(json.loads(fila))
        except (TypeError, json.JSONDecodeError):
            continue  # Una fila corrupta no debe tumbar el tablero entero.
    if not gestiones:
        for gestion in SEMILLA_DEMO:
            _comando_redis("RPUSH", REDIS_KEY, json.dumps(gestion, ensure_ascii=False))
        gestiones = list(SEMILLA_DEMO)
    return gestiones


# --------------------------------------------------------------------------
# Backend local: CSV
# --------------------------------------------------------------------------

def _init_csv() -> None:
    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not CSV_PATH.exists():
        import pandas as pd
        pd.DataFrame(SEMILLA_DEMO).to_csv(CSV_PATH, index=False)


def _leer_csv() -> List[Dict[str, Any]]:
    import numpy as np
    import pandas as pd

    _init_csv()
    df = pd.read_csv(CSV_PATH)
    if df.empty:
        return []
    return df.replace({np.nan: None}).to_dict(orient="records")


def _agregar_csv(gestion: Dict[str, Any]) -> None:
    import pandas as pd

    _init_csv()
    df = pd.read_csv(CSV_PATH)
    df = pd.concat([df, pd.DataFrame([gestion])], ignore_index=True)
    df.to_csv(CSV_PATH, index=False)


# --------------------------------------------------------------------------
# API publica del store
# --------------------------------------------------------------------------

def leer_gestiones() -> List[Dict[str, Any]]:
    """Lee el log completo, prefiriendo Redis y degradando al CSV."""
    global _REDIS_OK, _ULTIMO_ERROR

    if _credenciales_redis():
        try:
            gestiones = _leer_redis()
            _REDIS_OK, _ULTIMO_ERROR = True, None
            return gestiones
        except (urllib.error.URLError, OSError, RuntimeError, ValueError) as error:
            _REDIS_OK, _ULTIMO_ERROR = False, str(error)

    return _leer_csv()


def agregar_gestion(gestion: Dict[str, Any]) -> str:
    """Persiste una gestion y devuelve el backend efectivamente usado."""
    global _REDIS_OK, _ULTIMO_ERROR

    if _credenciales_redis():
        try:
            _comando_redis("RPUSH", REDIS_KEY, json.dumps(gestion, ensure_ascii=False))
            _REDIS_OK, _ULTIMO_ERROR = True, None
            return "redis"
        except (urllib.error.URLError, OSError, RuntimeError, ValueError) as error:
            _REDIS_OK, _ULTIMO_ERROR = False, str(error)

    _agregar_csv(gestion)
    return "csv"


def siguiente_id(total_actual: int) -> str:
    return f"G{str(total_actual + 1).zfill(4)}"


def descripcion() -> Dict[str, Any]:
    """Procedencia y durabilidad reales del log, para exponerlas en el tablero."""
    tiene_credenciales = _credenciales_redis() is not None
    usando_redis = tiene_credenciales and _REDIS_OK is not False
    efimero = not usando_redis and bool(os.getenv("VERCEL"))

    if usando_redis:
        detalle = "Redis REST (Upstash / Vercel KV)"
    elif efimero:
        detalle = "/tmp de la funcion serverless — se pierde en el proximo cold start"
    else:
        detalle = str(CSV_PATH).replace("\\", "/")

    return {
        "backend": "redis" if usando_redis else "csv",
        "archivo": detalle,
        "persistente": bool(usando_redis or not efimero),
        "efimero": efimero,
        "error": _ULTIMO_ERROR if tiene_credenciales and _REDIS_OK is False else None,
    }
