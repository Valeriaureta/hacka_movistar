import uvicorn
from app.backend.config import HOST, PORT

if __name__ == "__main__":
    print(f"🚀 Iniciando Servidor Movistar NBO en http://{HOST}:{PORT}")
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
