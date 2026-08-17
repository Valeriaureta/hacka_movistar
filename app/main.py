from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.backend.config import STATIC_DIR
from app.backend.routes import clientes, ofertas, scoring, analytics

app = FastAPI(
    title="Movistar Smart Personalization (NBO + Movistar Total)",
    description="API y Plataforma de Personalización Comercial Inteligente — Hackathon AI Telecom Challenge 2026",
    version="1.0.0"
)

# Habilitar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rutas de API
app.include_router(clientes.router)
app.include_router(ofertas.router)
app.include_router(scoring.router)
app.include_router(analytics.router)

# Montar directorio estático de frontend
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/")
def read_root():
    """Sirve la Single Page Application."""
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return {"message": "API de Personalización Comercial Movistar activa. Visita /docs para Swagger."}

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Movistar NBO Engine", "version": "1.0.0"}
