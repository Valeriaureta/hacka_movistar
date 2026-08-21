import os
import sys
import subprocess
import uvicorn
from app.backend.config import HOST, PORT

def run_all():
    print("=" * 60)
    print("[SERVER] PLATAFORMA MOVISTAR PERSONALIZACIÓN COMERCIAL INTELIGENTE")
    print(f"[BACKEND] FastAPI / DuckDB activo en: http://{HOST}:{PORT}")
    print("[FRONTEND] Next.js disponible en:     http://localhost:3000 (cd frontend && npm run dev)")
    print("=" * 60)

    # Iniciar servidor backend FastAPI
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)

if __name__ == "__main__":
    run_all()
