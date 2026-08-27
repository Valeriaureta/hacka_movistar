import os
import time
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

# SDK nuevo de Google (google-genai). El paquete "google-generativeai" quedo
# deprecado en mayo 2025; se intenta primero el nuevo y luego el antiguo, pero
# la ruta principal de este servicio es la REST API v1beta (sin dependencias).
try:
    from google import genai as google_genai
    from google.genai import types as google_genai_types
except ImportError:
    google_genai = None
    google_genai_types = None

import requests
import json
from dotenv import load_dotenv

# Cargar variables de entorno desde el .env raíz
BASE_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = BASE_DIR / ".env"
if not ENV_PATH.exists():
    ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=ENV_PATH)

class AIService:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # Cascada verificada contra la API de Google AI Studio (agosto 2026).
    # Orden por disponibilidad + latencia medida con thinkingLevel="low":
    #   gemini-3.7-flash        ~3.0 s  (flagship; puede devolver 503 por demanda)
    #   gemini-3-flash-preview  ~2.9 s
    #   gemini-3.1-flash-lite   ~1.9 s  (mas rapido, red de seguridad)
    #   gemini-flash-latest     alias estable, siempre presente (mas lento)
    # NO incluir gemini-2.5-flash ni gemini-1.5-flash: la API responde 404
    # ("no longer available to new users") y solo consumen el presupuesto de reintentos.
    DEFAULT_GEMINI_MODELS = [
        "gemini-3.7-flash",
        "gemini-3-flash-preview",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
    ]

    # Caidas transitorias del lado de Google: reintentar el MISMO modelo compensa.
    RETRIABLE_STATUS = (500, 502, 503, 504)

    # 429 = cuota agotada para ese modelo (el free tier de gemini-3.7-flash son
    # 20 req/dia). Google pide esperar ~30 s, inaceptable en vivo: cada modelo
    # tiene cuota propia, asi que conviene saltar de inmediato al siguiente.
    CUOTA_AGOTADA_STATUS = 429

    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY", "").strip()

        self.model_name = os.getenv("GEMINI_MODEL", "gemini-3.7-flash").strip()

        # El modelo declarado en .env encabeza la cascada, sin duplicarse.
        self.gemini_models = [self.model_name] + [
            m for m in self.DEFAULT_GEMINI_MODELS if m != self.model_name
        ]
        self.openrouter_models = [
            "meta-llama/llama-3.1-8b-instruct", # Rápido y muy capaz
            "anthropic/claude-3-haiku",         # Excelente para diálogos y empatía
            "google/gemini-flash-1.5"           # Respaldo en OpenRouter
        ]

        # Timeout generoso: los modelos "thinking" de la familia 3.x tardan
        # entre 2 y 15 s. Con los 12 s previos el analisis caia a heuristica.
        self.gemini_timeout = float(os.getenv("GEMINI_TIMEOUT", "45"))
        self.gemini_max_reintentos = int(os.getenv("GEMINI_MAX_REINTENTOS", "2"))
        # "low" mantiene la calidad del razonamiento con una fraccion de la latencia.
        self.gemini_thinking_level = os.getenv("GEMINI_THINKING_LEVEL", "low").strip().lower()

        self.is_gemini_configured = bool(self.gemini_api_key and self.gemini_api_key != "tu_gemini_api_key_aqui")
        self.is_openrouter_configured = bool(self.openrouter_api_key and self.openrouter_api_key != "tu_openrouter_api_key_aqui")
        self.is_configured = self.is_gemini_configured or self.is_openrouter_configured

        # --- LLM local (Ollama) ---------------------------------------------
        # Escalon intermedio entre Gemini y la heuristica: si se agota la cuota
        # gratuita (20 req/dia en gemini-3.7-flash) el analisis sigue siendo un
        # LLM real, ejecutandose en la maquina y sin depender de internet.
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "").strip()
        # Los 7-8B cuantizados en GPU de 6 GB tardan bastante mas que la nube.
        self.ollama_timeout = float(os.getenv("OLLAMA_TIMEOUT", "180"))
        # Cuanto se queda el modelo residente en VRAM tras un analisis. Cargarlo
        # en frio cuesta ~60 s; con esto solo se paga una vez por sesion.
        self.ollama_keep_alive = os.getenv("OLLAMA_KEEP_ALIVE", "30m").strip()
        self.ollama_habilitado = os.getenv("OLLAMA_HABILITADO", "true").strip().lower() not in ("false", "0", "no")

        # Temperatura de los analisis post-hoc. 0 = decodificacion voraz: la misma
        # llamada produce el mismo informe, propiedad deseable en una auditoria.
        # Medido en qwen2.5:7b -> 3/3 corridas identicas a 0.0 frente a 3/3
        # distintas a 0.2, sin coste de latencia.
        self.temperatura_analisis = float(os.getenv("LLM_TEMPERATURE", "0"))
        # Cache del sondeo a /api/tags: evita penalizar cada analisis con un
        # timeout cuando Ollama no esta instalado.
        self._ollama_modelos_cache: Optional[List[str]] = None
        self._ollama_cache_ts: float = 0.0

        # Prioridad de proveedor: gemini | ollama | openrouter.
        # LLM_PRIORITY=ollama permite una demo 100% offline y sin cuota.
        self.prioridad_llm = os.getenv("LLM_PRIORITY", "gemini").strip().lower()

        # Traza del ultimo intento, expuesta por /api/speech/diagnostico-llm.
        self.ultimo_error: Optional[str] = None
        self.ultimo_motor: Optional[Dict[str, Any]] = None

        if self.is_gemini_configured:
            print(f"[AI Service] Google AI Studio configurado. Modelos en cascada: {self.gemini_models}")

        if self.is_openrouter_configured:
            print(f"[AI Service] OpenRouter configurado. Modelos en cascada: {self.openrouter_models}")

        if not self.is_gemini_configured and not self.is_openrouter_configured:
            print("[AI Service] Ninguna API Key detectada. Operando en modo Generativo Heurístico (Offline).")

    def _call_openrouter(self, prompt: str, model: str) -> Optional[str]:
        headers = {
            "Authorization": f"Bearer {self.openrouter_api_key}",
            "HTTP-Referer": "http://localhost:5173", # Recomendado por OpenRouter
            "X-Title": "Movistar NBO Dashboard", # Recomendado por OpenRouter
            "Content-Type": "application/json"
        }
        data = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7
        }
        try:
            response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content']
            else:
                print(f"[OpenRouter] Falló el modelo {model}. Status: {response.status_code}")
                return None
        except Exception as e:
            print(f"[OpenRouter] Error de conexión con modelo {model}: {e}")
            return None

    def _gemini_request(
        self,
        prompt: str,
        model_name: str,
        generation_config: Optional[Dict[str, Any]] = None,
        system_instruction: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Una sola llamada REST a generateContent.

        Devuelve siempre un diccionario de traza para que el llamador pueda
        distinguir "el modelo respondio mal" de "la red fallo" y decidir si
        reintenta o degrada a heuristica.
        """
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model_name}:generateContent?key={self.gemini_api_key}"
        )
        payload: Dict[str, Any] = {"contents": [{"parts": [{"text": prompt}]}]}
        if system_instruction:
            payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}
        if generation_config:
            payload["generationConfig"] = generation_config

        inicio = time.time()
        try:
            res = requests.post(url, json=payload, timeout=self.gemini_timeout)
        except Exception as e:
            msg = f"{type(e).__name__}: {e}"
            print(f"[Gemini REST] Error de conexión con modelo {model_name}: {msg}")
            # Timeouts y cortes de red se consideran transitorios.
            return {
                "ok": False, "texto": None, "status": None, "error": msg,
                "retriable": True, "modelo": model_name,
                "latencia_ms": int((time.time() - inicio) * 1000),
            }

        latencia_ms = int((time.time() - inicio) * 1000)

        if res.status_code != 200:
            try:
                detalle = res.json().get("error", {}).get("message", res.text[:300])
            except Exception:
                detalle = res.text[:300]
            if res.status_code == self.CUOTA_AGOTADA_STATUS:
                print(f"[Gemini REST] Cuota agotada en {model_name}; se pasa al siguiente modelo de la cascada.")
            else:
                print(f"[Gemini REST] Falló el modelo {model_name}. Status: {res.status_code} — {detalle}")
            return {
                "ok": False, "texto": None, "status": res.status_code, "error": detalle,
                "retriable": res.status_code in self.RETRIABLE_STATUS,
                "modelo": model_name, "latencia_ms": latencia_ms,
            }

        try:
            res_data = res.json()
            candidatos = res_data.get("candidates", [])
            if not candidatos:
                # Sin candidatos suele significar bloqueo por filtros de seguridad.
                bloqueo = res_data.get("promptFeedback", {}).get("blockReason", "sin candidatos")
                return {
                    "ok": False, "texto": None, "status": 200,
                    "error": f"Respuesta vacía ({bloqueo})",
                    "retriable": False, "modelo": model_name, "latencia_ms": latencia_ms,
                }
            # Los modelos "thinking" pueden emitir varios parts: se concatenan todos
            # los que traen texto (leer solo parts[0] devolvía None con estos modelos).
            partes = candidatos[0].get("content", {}).get("parts", [])
            texto = "".join(pt.get("text", "") for pt in partes if isinstance(pt, dict))
            if not texto.strip():
                finish = candidatos[0].get("finishReason", "desconocido")
                return {
                    "ok": False, "texto": None, "status": 200,
                    "error": f"Texto vacío (finishReason={finish})",
                    "retriable": finish == "MAX_TOKENS", "modelo": model_name,
                    "latencia_ms": latencia_ms,
                }
            uso = res_data.get("usageMetadata", {})
            return {
                "ok": True, "texto": texto, "status": 200, "error": None,
                "retriable": False, "modelo": model_name, "latencia_ms": latencia_ms,
                "tokens": uso.get("totalTokenCount"),
            }
        except Exception as e:
            return {
                "ok": False, "texto": None, "status": 200,
                "error": f"Parseo de respuesta: {e}",
                "retriable": False, "modelo": model_name, "latencia_ms": latencia_ms,
            }

    def _gemini_con_reintentos(
        self,
        prompt: str,
        generation_config: Optional[Dict[str, Any]] = None,
        system_instruction: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Recorre la cascada de modelos y reintenta los errores transitorios.

        Un 503 "high demand" en el modelo flagship es frecuente y temporal: antes
        tumbaba el análisis a heurística en el primer intento.
        """
        intentos: List[Dict[str, Any]] = []
        for model_name in self.gemini_models:
            for intento in range(self.gemini_max_reintentos + 1):
                traza = self._gemini_request(prompt, model_name, generation_config, system_instruction)
                intentos.append({
                    "modelo": model_name, "intento": intento + 1,
                    "status": traza.get("status"), "error": traza.get("error"),
                    "latencia_ms": traza.get("latencia_ms"),
                })
                if traza["ok"]:
                    traza["intentos"] = intentos
                    return traza
                if not traza["retriable"]:
                    # 404/400/429: insistir no ayuda, pasar al siguiente modelo
                    break
                if intento < self.gemini_max_reintentos:
                    time.sleep(0.8 * (intento + 1))  # backoff corto

        # Último respaldo: SDK oficial google-genai (si está instalado)
        sdk = self._gemini_via_sdk(prompt, system_instruction, generation_config)
        if sdk:
            return {"ok": True, "texto": sdk, "modelo": f"{self.gemini_models[0]} (SDK)",
                    "status": 200, "error": None, "latencia_ms": None, "intentos": intentos}

        return {"ok": False, "texto": None, "modelo": None, "status": None,
                "error": intentos[-1]["error"] if intentos else "Sin intentos ejecutados",
                "latencia_ms": None, "intentos": intentos}

    def _gemini_via_sdk(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        generation_config: Optional[Dict[str, Any]] = None,
    ) -> Optional[str]:
        """Respaldo vía SDK oficial google-genai (opcional, ver requirements-ai.txt).

        Replica el contrato de la ruta REST — incluido el modo JSON con esquema —
        para que este último recurso devuelva algo utilizable y no prosa suelta.
        """
        if google_genai is None:
            return None
        try:
            client = google_genai.Client(api_key=self.gemini_api_key)
            kwargs: Dict[str, Any] = {}
            if google_genai_types is not None:
                cfg: Dict[str, Any] = {}
                if system_instruction:
                    cfg["system_instruction"] = system_instruction
                if generation_config:
                    if generation_config.get("responseMimeType"):
                        cfg["response_mime_type"] = generation_config["responseMimeType"]
                    if generation_config.get("responseSchema"):
                        cfg["response_schema"] = generation_config["responseSchema"]
                    if generation_config.get("temperature") is not None:
                        cfg["temperature"] = generation_config["temperature"]
                if cfg:
                    kwargs["config"] = google_genai_types.GenerateContentConfig(**cfg)
            response = client.models.generate_content(
                model=self.gemini_models[0], contents=prompt, **kwargs
            )
            return getattr(response, "text", None)
        except Exception as e:
            print(f"[Gemini SDK] Respaldo no disponible: {e}")
            return None

    def _call_gemini(self, prompt: str, model_name: str) -> Optional[str]:
        """Compatibilidad: llamada de texto plano contra un modelo puntual."""
        traza = self._gemini_request(prompt, model_name)
        return traza["texto"] if traza["ok"] else None

    # -----------------------------------------------------------------
    # LLM local (Ollama)
    # -----------------------------------------------------------------

    @staticmethod
    def _schema_a_jsonschema(nodo: Any) -> Any:
        """Traduce el responseSchema de Gemini al JSON Schema que espera Ollama.

        Gemini usa tipos en MAYUSCULAS y admite `propertyOrdering`; Ollama espera
        JSON Schema estandar (tipos en minusculas) y desconoce esa clave.
        """
        if isinstance(nodo, list):
            return [AIService._schema_a_jsonschema(x) for x in nodo]
        if not isinstance(nodo, dict):
            return nodo

        salida: Dict[str, Any] = {}
        for clave, valor in nodo.items():
            if clave == "propertyOrdering":
                continue  # especifico de Gemini
            if clave == "type" and isinstance(valor, str):
                salida["type"] = valor.lower()
            elif clave in ("properties", "items"):
                salida[clave] = AIService._schema_a_jsonschema(valor)
            else:
                salida[clave] = AIService._schema_a_jsonschema(valor)
        return salida

    def _ollama_modelos_disponibles(self, forzar: bool = False) -> List[str]:
        """Lista los modelos ya descargados. Cachea 60 s para no penalizar cada analisis."""
        ahora = time.time()
        if not forzar and self._ollama_modelos_cache is not None and (ahora - self._ollama_cache_ts) < 60:
            return self._ollama_modelos_cache
        try:
            # Timeout corto: si Ollama no corre, no debe costar mas que un parpadeo.
            res = requests.get(f"{self.ollama_base_url}/api/tags", timeout=3)
            modelos = [m["name"] for m in res.json().get("models", [])] if res.status_code == 200 else []
        except Exception:
            modelos = []
        self._ollama_modelos_cache = modelos
        self._ollama_cache_ts = ahora
        return modelos

    def _ollama_elegir_modelo(self) -> Optional[str]:
        """Modelo a usar: el de OLLAMA_MODEL si esta descargado, si no el mejor disponible."""
        disponibles = self._ollama_modelos_disponibles()
        if not disponibles:
            return None
        if self.ollama_model:
            # Coincidencia exacta o por nombre sin tag (llama3.1 -> llama3.1:8b)
            for m in disponibles:
                if m == self.ollama_model or m.split(":")[0] == self.ollama_model.split(":")[0]:
                    return m
        # Preferencia por modelos solidos siguiendo instrucciones y JSON estructurado.
        for preferido in ("qwen2.5", "llama3.1", "llama3.2", "mistral", "gemma2", "phi"):
            for m in disponibles:
                if m.startswith(preferido):
                    return m
        return disponibles[0]

    def ollama_disponible(self) -> bool:
        return self.ollama_habilitado and bool(self._ollama_elegir_modelo())

    def precalentar_ollama(self) -> Dict[str, Any]:
        """Carga el modelo local en VRAM sin generar tokens.

        La primera inferencia en frio tarda ~60 s mas que las siguientes porque
        incluye la carga del modelo. Llamar a esto al arrancar el backend deja
        la demo lista y evita esa penalizacion en el peor momento posible.
        """
        modelo = self._ollama_elegir_modelo()
        if not modelo:
            return {"ok": False, "error": "Ollama sin modelos descargados", "modelo": None}
        inicio = time.time()
        try:
            # prompt vacio + keep_alive => solo carga, no genera.
            res = requests.post(
                f"{self.ollama_base_url}/api/generate",
                json={"model": modelo, "keep_alive": self.ollama_keep_alive},
                timeout=self.ollama_timeout,
            )
            ok = res.status_code == 200
            seg = time.time() - inicio
            if ok:
                print(f"[AI Service] Modelo local {modelo} precargado en VRAM ({seg:.1f}s)")
            return {"ok": ok, "modelo": modelo, "segundos": round(seg, 1),
                    "error": None if ok else f"HTTP {res.status_code}"}
        except Exception as e:
            return {"ok": False, "modelo": modelo, "segundos": round(time.time() - inicio, 1),
                    "error": f"{type(e).__name__}: {e}"}

    def _call_ollama_json(
        self,
        prompt: str,
        schema: Dict[str, Any],
        system_instruction: Optional[str] = None,
        temperature: float = 0.0,
    ) -> Dict[str, Any]:
        """Inferencia estructurada contra el modelo local.

        Ollama admite `format` como JSON Schema (v0.5+), asi que impone el mismo
        contrato que `responseSchema` en Gemini: el analisis local sale validado.
        """
        modelo = self._ollama_elegir_modelo()
        if not modelo:
            return {"ok": False, "texto": None, "modelo": None, "latencia_ms": None,
                    "error": "Ollama no responde o no tiene modelos descargados"}

        payload: Dict[str, Any] = {
            "model": modelo,
            "prompt": prompt,
            "stream": False,
            "format": self._schema_a_jsonschema(schema),
            "options": {"temperature": temperature},
            "keep_alive": self.ollama_keep_alive,
        }
        if system_instruction:
            payload["system"] = system_instruction

        inicio = time.time()
        try:
            res = requests.post(f"{self.ollama_base_url}/api/generate",
                                json=payload, timeout=self.ollama_timeout)
        except Exception as e:
            return {"ok": False, "texto": None, "modelo": modelo,
                    "latencia_ms": int((time.time() - inicio) * 1000),
                    "error": f"{type(e).__name__}: {e}"}

        latencia_ms = int((time.time() - inicio) * 1000)
        if res.status_code != 200:
            return {"ok": False, "texto": None, "modelo": modelo, "latencia_ms": latencia_ms,
                    "error": f"HTTP {res.status_code}: {res.text[:250]}"}
        try:
            texto = res.json().get("response", "")
        except Exception as e:
            return {"ok": False, "texto": None, "modelo": modelo, "latencia_ms": latencia_ms,
                    "error": f"Respuesta ilegible: {e}"}
        if not texto.strip():
            return {"ok": False, "texto": None, "modelo": modelo, "latencia_ms": latencia_ms,
                    "error": "El modelo local devolvio texto vacio"}
        return {"ok": True, "texto": texto, "modelo": modelo,
                "latencia_ms": latencia_ms, "error": None}

    def generate_json(
        self,
        prompt: str,
        schema: Dict[str, Any],
        system_instruction: Optional[str] = None,
        temperature: float = 0.0,
    ) -> Tuple[Optional[Dict[str, Any]], Dict[str, Any]]:
        """Inferencia estructurada con cascada de proveedores.

        Orden por defecto: Gemini (nube) -> Ollama (local) -> None.
        Ambos imponen el esquema en el propio motor (`responseSchema` y `format`),
        de modo que el JSON llega validado y no hace falta parsear prosa.

        Si Gemini agota su cuota gratuita, el analisis NO cae a heuristica: lo
        recoge el modelo local y sigue siendo una inferencia real.

        Devuelve (datos, motor), donde `motor` documenta que proveedor y modelo
        respondieron, con que latencia y si fue un LLM real.
        """
        errores: List[str] = []

        def _via_gemini() -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
            if not self.is_gemini_configured:
                errores.append("Gemini: GEMINI_API_KEY no configurada en .env")
                return None, None
            generation_config: Dict[str, Any] = {
                "responseMimeType": "application/json",
                "responseSchema": schema,
                "temperature": temperature,
            }
            if self.gemini_thinking_level in ("low", "high", "minimal"):
                # Solo lo aceptan los modelos 3.x; los demas ignoran el campo.
                generation_config["thinkingConfig"] = {"thinkingLevel": self.gemini_thinking_level}
            traza = self._gemini_con_reintentos(prompt, generation_config, system_instruction)
            if not traza["ok"]:
                errores.append(f"Gemini: {traza.get('error')}")
                return None, None
            try:
                datos = json.loads(self._extraer_json(traza["texto"]))
            except Exception as e:
                errores.append(f"Gemini: JSON invalido de {traza.get('modelo')}: {e}")
                return None, None
            return datos, {
                "proveedor": "GOOGLE_GEMINI", "modelo": traza.get("modelo"),
                "latencia_ms": traza.get("latencia_ms"), "es_llm_real": True,
                "ejecucion": "nube", "tokens": traza.get("tokens"),
                "error": None, "intentos": traza.get("intentos", []),
            }

        def _via_ollama() -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
            if not self.ollama_habilitado:
                errores.append("Ollama: deshabilitado por OLLAMA_HABILITADO=false")
                return None, None
            traza = self._call_ollama_json(prompt, schema, system_instruction, temperature)
            if not traza["ok"]:
                errores.append(f"Ollama: {traza.get('error')}")
                return None, None
            try:
                datos = json.loads(self._extraer_json(traza["texto"]))
            except Exception as e:
                errores.append(f"Ollama: JSON invalido de {traza.get('modelo')}: {e}")
                return None, None
            print(f"[AI Service] Analisis resuelto por LLM local: {traza.get('modelo')} "
                  f"({traza.get('latencia_ms')} ms)")
            return datos, {
                "proveedor": "OLLAMA_LOCAL", "modelo": traza.get("modelo"),
                "latencia_ms": traza.get("latencia_ms"), "es_llm_real": True,
                "ejecucion": "local", "tokens": None,
                "error": None, "intentos": [],
            }

        proveedores = {"gemini": _via_gemini, "ollama": _via_ollama}
        # La prioridad declarada encabeza la cascada; el resto conserva su orden.
        orden = [self.prioridad_llm] if self.prioridad_llm in proveedores else ["gemini"]
        orden += [n for n in ("gemini", "ollama") if n not in orden]

        for nombre in orden:
            datos, motor = proveedores[nombre]()
            if datos:
                self.ultimo_error = None
                self.ultimo_motor = motor
                return datos, motor

        motor_fallido: Dict[str, Any] = {
            "proveedor": None, "modelo": None, "latencia_ms": None,
            "es_llm_real": False, "ejecucion": None, "tokens": None,
            "error": " | ".join(errores) if errores else "Ningun proveedor LLM disponible",
            "intentos": [],
        }
        self.ultimo_error = motor_fallido["error"]
        self.ultimo_motor = motor_fallido
        return None, motor_fallido

    @staticmethod
    def _extraer_json(texto: str) -> str:
        """Aísla el objeto JSON aunque venga envuelto en markdown o con prosa."""
        limpio = texto.strip()
        inicio, fin = limpio.find("{"), limpio.rfind("}")
        if inicio != -1 and fin > inicio:
            return limpio[inicio:fin + 1]
        return limpio

    def diagnostico(self) -> Dict[str, Any]:
        """Ping en vivo a la cascada para evidenciar que el analisis usa un LLM real."""
        modelos_locales = self._ollama_modelos_disponibles(forzar=True)
        info: Dict[str, Any] = {
            "gemini_configurado": self.is_gemini_configured,
            "openrouter_configurado": self.is_openrouter_configured,
            "prioridad_llm": self.prioridad_llm,
            "modelo_preferido": self.model_name,
            "cascada_modelos": self.gemini_models,
            "timeout_seg": self.gemini_timeout,
            "thinking_level": self.gemini_thinking_level,
            "ollama": {
                "habilitado": self.ollama_habilitado,
                "base_url": self.ollama_base_url,
                "servicio_activo": bool(modelos_locales),
                "modelos_descargados": modelos_locales,
                "modelo_elegido": self._ollama_elegir_modelo(),
                "timeout_seg": self.ollama_timeout,
            },
        }

        if not self.is_gemini_configured and not info["ollama"]["servicio_activo"]:
            info["conexion_ok"] = False
            info["error"] = (
                "Sin LLM disponible: falta GEMINI_API_KEY en .env y Ollama no responde "
                f"en {self.ollama_base_url}"
            )
            return info

        datos, motor = self.generate_json(
            'Responde unicamente con el JSON {"ping": "pong"}.',
            {"type": "OBJECT", "properties": {"ping": {"type": "STRING"}}, "required": ["ping"]},
        )
        info["conexion_ok"] = bool(datos)
        info["respuesta"] = datos
        info["proveedor_que_respondio"] = motor.get("proveedor")
        info["modelo_que_respondio"] = motor.get("modelo")
        info["latencia_ms"] = motor.get("latencia_ms")
        info["error"] = motor.get("error")
        info["intentos"] = motor.get("intentos")
        return info

    def _generate_with_fallback(self, prompt: str) -> Optional[str]:
        """Intenta generar contenido iterando por los modelos disponibles hasta que uno funcione."""

        def _intentar_gemini() -> Optional[str]:
            if not self.is_gemini_configured:
                return None
            traza = self._gemini_con_reintentos(prompt)
            return traza["texto"] if traza["ok"] else None

        def _intentar_openrouter() -> Optional[str]:
            if not self.is_openrouter_configured:
                return None
            for model in self.openrouter_models:
                response = self._call_openrouter(prompt, model)
                if response:
                    return response
            return None

        def _intentar_ollama() -> Optional[str]:
            if not self.ollama_habilitado:
                return None
            modelo = self._ollama_elegir_modelo()
            if not modelo:
                return None
            try:
                res = requests.post(
                    f"{self.ollama_base_url}/api/generate",
                    json={"model": modelo, "prompt": prompt, "stream": False},
                    timeout=self.ollama_timeout,
                )
                if res.status_code == 200:
                    return res.json().get("response") or None
            except Exception as e:
                print(f"[Ollama] Generacion de texto fallida: {e}")
            return None

        # Gemini encabeza la cascada salvo que LLM_PRIORITY la invierta; el modelo
        # local queda de ultimo recurso antes de la plantilla heuristica.
        if self.prioridad_llm == "openrouter":
            orden = [_intentar_openrouter, _intentar_gemini, _intentar_ollama]
        elif self.prioridad_llm == "ollama":
            orden = [_intentar_ollama, _intentar_gemini, _intentar_openrouter]
        else:
            orden = [_intentar_gemini, _intentar_openrouter, _intentar_ollama]

        for proveedor in orden:
            response = proveedor()
            if response:
                return response

        return None

    def generate_sales_pitch(self, cliente: Dict[str, Any], oferta: Dict[str, Any], canal: str = "Tienda") -> str:
        """Genera un speech de venta ultra-personalizado usando el sistema de cascada."""
        if not (self.is_gemini_configured or self.is_openrouter_configured):
            return self._fallback_pitch(cliente, oferta, canal)

        canal_guidelines = {
            "Tienda": "Situación: Atención presencial en ventanilla de tienda física. El cliente está frente a ti esperando una atención rápida. Sé directo, cálido y ofrece el beneficio inmediato.",
            "Call Out": "Situación: Llamada telefónica saliente (Telemarketing). Debes captar el interés en los primeros 5 segundos con una oferta irresistible basada en su consumo.",
            "Call In": "Situación: Llamada entrante (Servicio al cliente / Retención). El cliente puede tener dudas o quejas. Muestra empatía, valida su historial y preséntale la oferta como una mejora/solución.",
            "WhatsApp": "Situación: Chat de WhatsApp. Redacta un mensaje directo, claro y persuasivo listo para leerse en mensajería."
        }

        guideline = canal_guidelines.get(canal, "Sé persuasivo, profesional y directo.")
        ahorro = oferta.get('ahorro_pct', 0)

        prompt = f"""
Actúa como un asesor comercial de élite de Movistar Perú.
Canal actual: {canal}.
{guideline}

DATOS DEL CLIENTE:
- Plan actual: {cliente.get('plan_actual_nombre')} pagando S/ {cliente.get('plan_actual_precio')}/mes.
- Consumo promedio de datos: {cliente.get('consumo_datos_gb_prom')} GB/mes.
- Antigüedad: {cliente.get('antiguedad_meses')} meses.

OFERTA A PRESENTAR:
- Producto: {oferta.get('nombre_oferta')}
- Inversión propuesta: S/ {oferta.get('precio_promocional')}/mes (Precio regular: S/ {oferta.get('precio_regular', oferta.get('precio_promocional'))}).
- Beneficio comercial: {f"AHORRO GARANTIZADO del {ahorro}% unificando servicios." if ahorro > 0 else "MEJORA DE CAPACIDAD Y VELOCIDAD por una diferencia mínima."}

REGLAS DE ORO:
1. Redacta el diálogo exacto que dirá el asesor (sin comillas, sin decir 'Asesor:', solo el texto a decir).
2. Extensión: 2 oraciones contundentes.
3. Argumento de valor: Justifica por qué le conviene según sus datos de consumo.
4. Cierre: Termina con una pregunta suave de cierre (ej: "¿Procedemos a activarlo ahora mismo?").
5. Tono: Peruano profesional, seguro, empático y convincente.
"""
        response_text = self._generate_with_fallback(prompt)
        if response_text:
            return response_text.strip().replace('"', '')
        
        return self._fallback_pitch(cliente, oferta, canal)

    def generate_objection_handling(self, cliente: Dict[str, Any], oferta: Dict[str, Any], motivo_rechazo: str, canal: str = "Tienda") -> Dict[str, Any]:
        """Genera un argumento de rebate personalizado para superar una objeción de venta usando cascada."""
        if not (self.is_gemini_configured or self.is_openrouter_configured):
            return self._fallback_rebate(cliente, oferta, motivo_rechazo, canal)

        prompt = f"""
Actúa como un experto en negociación y retención comercial de Movistar Perú para el canal {canal}.
El cliente {cliente.get('cliente_id')} ha puesto la siguiente objeción para rechazar la oferta {oferta.get('nombre_oferta')}:
OBJECIÓN: "{motivo_rechazo}"

CONTEXTO:
- Gasto mensual actual: S/ {cliente.get('plan_actual_precio')}
- Consumo datos: {cliente.get('consumo_datos_gb_prom')} GB
- Nueva tarifa NBO: S/ {oferta.get('precio_promocional')}/mes
- Beneficio de la oferta: {f"Ahorro garantizado del {oferta.get('ahorro_pct')}% respecto a precios regulares." if oferta.get('ahorro_pct', 0) > 0 else "Mejora sustancial en la capacidad y calidad del servicio (upgrade costo-beneficio)."}
- Antigüedad: {cliente.get('antiguedad_meses')} meses

Genera una respuesta en 2 partes:
1. "argumento_rebate": Un speech cálido, empático pero contundente para rebatir la objeción en 2 o 3 oraciones. NO hables de descuentos si el beneficio es una mejora de capacidad. Usa los datos del cliente para justificar que es una excelente decisión.
2. "tip_asesor": Un consejo táctico de 1 línea para el asesor sobre el lenguaje corporal o tono de voz.

Devuelve la respuesta ESTRICTAMENTE en formato JSON válido con las llaves "argumento_rebate" y "tip_asesor". Nada más.
"""
        response_text = self._generate_with_fallback(prompt)
        
        if response_text:
            text = response_text.strip()
            # Extraer json o limpiar texto
            if "{" in text and "}" in text:
                try:
                    json_str = text[text.find("{"):text.rfind("}")+1]
                    data = json.loads(json_str)
                    return {
                        "argumento_rebate": data.get("argumento_rebate", text),
                        "tip_asesor": data.get("tip_asesor", "Mantener tono consultivo y seguro."),
                        "origen": "IA Generativa"
                    }
                except Exception:
                    pass
                    
            return {
                "argumento_rebate": text.replace('"', ''),
                "tip_asesor": "Enfocar el cierre en el beneficio principal.",
                "origen": "IA Generativa"
            }

        return self._fallback_rebate(cliente, oferta, motivo_rechazo, canal)

    def _fallback_pitch(self, cliente: Dict[str, Any], oferta: Dict[str, Any], canal: str) -> str:
        ahorro = oferta.get("ahorro_pct", 0)
        nombre_off = oferta.get("nombre_oferta", "Plan Movistar")
        precio = oferta.get("precio_promocional", oferta.get("precio_mensual", 0))
        datos = cliente.get("consumo_datos_gb_prom", 0)

        if ahorro > 0:
            return f"Estimado cliente, detectamos que su consumo supera los {datos} GB mensuales. Hoy podemos ascenderlo a {nombre_off} con un beneficio exclusivo de {ahorro}% de descuento a solo S/ {precio}/mes."
        return f"Por su fidelidad en Movistar, hoy tiene pre-aprobado el pase a {nombre_off} a una tarifa preferencial de S/ {precio}/mes para asegurar máxima velocidad en todos sus dispositivos."

    def _fallback_rebate(self, cliente: Dict[str, Any], oferta: Dict[str, Any], motivo: str, canal: str) -> Dict[str, Any]:
        nombre_off = oferta.get("nombre_oferta", "el nuevo plan")
        precio = oferta.get("precio_promocional", 0)
        ahorro = oferta.get("ahorro_pct", 0)
        pago_actual = cliente.get("plan_actual_precio", 0)
        
        tips = {
            "Precio muy alto": "Demostrar que el costo unitario por GB y servicio convergente es menor que su facturación dispersa.",
            "Mala experiencia previa": "Enfatizar el compromiso de soporte prioritario y la garantía de satisfacción técnica.",
            "No necesita el servicio": "Recordar que su consumo real de datos y streaming sigue en aumento.",
            "Compromiso con otro operador": "Destacar la facilidad de portabilidad sin corte de servicio y bono de bienvenida.",
            "Sin cobertura fibra": "Verificar la disponibilidad en el mapa de cobertura FTTH en tiempo real."
        }
        
        if ahorro > 0:
            arg = f"Entiendo perfectamente su inquietud por el tema de '{motivo}'. Precisamente por eso el sistema me habilitó {nombre_off} de forma exclusiva. Si hacemos cuentas, hoy invierte S/ {pago_actual}, pero con este cambio logrará un ahorro automático del {ahorro}%. Es la decisión financiera más inteligente."
        else:
            arg = f"Comprendo totalmente su postura respecto a '{motivo}'. Sin embargo, quiero que vea el valor costo-beneficio: hoy invierte S/ {pago_actual}, pero al migrar a {nombre_off} por S/ {precio}, estará potenciando enormemente su servicio de acuerdo a lo que realmente consume."
        
        return {
            "argumento_rebate": arg,
            "tip_asesor": tips.get(motivo, "Escuchar activamente, validar su preocupación y redirigir hacia el valor percibido."),
            "origen": "Motor Heurístico NBO (Offline)"
        }

