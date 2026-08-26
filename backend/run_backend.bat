@echo off
cd /d "%~dp0"
echo Iniciando backend NBO v2...
if exist "venv\Scripts\activate.bat" call "venv\Scripts\activate.bat"
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
