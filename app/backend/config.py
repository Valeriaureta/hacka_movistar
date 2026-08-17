import os
from pathlib import Path

# Directorio raíz del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Rutas de datos (Solo lectura para raw)
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

CLIENTES_CSV = RAW_DATA_DIR / "dataset_clientes.csv"
OFERTAS_CSV = RAW_DATA_DIR / "catalogo_ofertas_entrega.csv"
HISTORIAL_CSV = RAW_DATA_DIR / "historial_campanias.csv"
SCORING_TOP3_CSV = PROCESSED_DATA_DIR / "scoring_top3_predictivo.csv"

# Frontend y estáticos
STATIC_DIR = BASE_DIR / "app" / "frontend"

# Configuración del servidor
PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "127.0.0.1")
