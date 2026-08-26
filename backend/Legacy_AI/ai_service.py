import os
from pathlib import Path
from typing import Dict, Any, List, Optional
import google.generativeai as genai
import requests
import json
from dotenv import load_dotenv

# Cargar variables de entorno desde el .env raíz
BASE_DIR = Path(__file__).resolve().parents[1]
ENV_PATH = BASE_DIR / ".env"
load_dotenv(dotenv_path=ENV_PATH)

class AIService:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
        
        # Modelos óptimos por plataforma (en orden de prioridad y fallback)
        self.gemini_models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"]
        self.openrouter_models = [
            "meta-llama/llama-3.1-8b-instruct", # Rápido y muy capaz
            "anthropic/claude-3-haiku",         # Excelente para diálogos y empatía
            "google/gemini-flash-1.5"           # Respaldo en OpenRouter
        ]

        self.is_gemini_configured = bool(self.gemini_api_key and self.gemini_api_key != "tu_gemini_api_key_aqui")
        self.is_openrouter_configured = bool(self.openrouter_api_key and self.openrouter_api_key != "tu_openrouter_api_key_aqui")
        self.is_configured = self.is_gemini_configured or self.is_openrouter_configured
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

        if self.is_gemini_configured:
            try:
                genai.configure(api_key=self.gemini_api_key)
                print(f"[AI Service] Google AI Studio configurado. Modelos en cascada: {self.gemini_models}")
            except Exception as e:
                print(f"[AI Service] Error al configurar Gemini: {e}")
                self.is_gemini_configured = False
        
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

    def _call_gemini(self, prompt: str, model_name: str) -> Optional[str]:
        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text
            return None
        except Exception as e:
            print(f"[Gemini] Falló el modelo {model_name}: {e}")
            return None

    def _generate_with_fallback(self, prompt: str) -> Optional[str]:
        """Intenta generar contenido iterando por los modelos disponibles hasta que uno funcione."""
        
        # 1. Intentar con OpenRouter (si está configurado)
        if self.is_openrouter_configured:
            for model in self.openrouter_models:
                #print(f"[AI Service] Intentando con OpenRouter -> {model}...")
                response = self._call_openrouter(prompt, model)
                if response:
                    return response
        
        # 2. Intentar con Google AI Studio (si está configurado y falló OpenRouter)
        if self.is_gemini_configured:
            for model in self.gemini_models:
                #print(f"[AI Service] Intentando con Google AI Studio -> {model}...")
                response = self._call_gemini(prompt, model)
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

