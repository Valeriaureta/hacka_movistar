import sys
from pathlib import Path

# Asegurar que el directorio raíz está en sys.path para importaciones
sys.path.append(str(Path(__file__).parent.parent))

from app.main import app

# Este archivo es el punto de entrada para Vercel Serverless Functions
