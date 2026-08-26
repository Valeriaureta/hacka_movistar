@echo off
echo Iniciando backend NBO v2 con Python 3.11...
call venv\Scripts\activate.bat
uvicorn main:app --reload --host 127.0.0.1 --port 8000
