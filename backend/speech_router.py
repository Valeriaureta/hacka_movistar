import json
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query
from pydantic import BaseModel, Field
from datetime import datetime

# Intentar reutilizar AIService si está disponible
try:
    from .Legacy_AI.ai_service import AIService
except ImportError:
    try:
        from Legacy_AI.ai_service import AIService
    except ImportError:
        AIService = None

router = APIRouter(prefix="/api/speech", tags=["Speech Analytics & Real-Time STT"])

# -------------------------------------------------------------
# Modelos de Datos (Pydantic)
# -------------------------------------------------------------

class SpeechTranscriptSegment(BaseModel):
    timestamp: str
    speaker: str # "ASESOR" | "CLIENTE"
    text: str

class CallInAnalysisRequest(BaseModel):
    cliente_id: str
    transcripcion: List[SpeechTranscriptSegment]
    duracion_seg: Optional[int] = 0
    contexto: Optional[Dict[str, Any]] = None

class CallInAnalysisResponse(BaseModel):
    cliente_id: str
    score_sentimiento: float = Field(..., description="Escala de 1.0 (Muy negativo / molesto) a 5.0 (Muy satisfecho)")
    nivel_sentimiento: str = Field(..., description="MUY_NEGATIVO | NEGATIVO | NEUTRO | POSITIVO")
    topico_reclamo: str = Field(..., description="Topico categorizado de reclamo o consulta")
    descripcion_problema: str
    cliente_insatisfecho: bool
    accion_recomendada: str
    puntos_criticos: List[str]
    sugerencia_nbo: Dict[str, Any]
    motor_analisis: Dict[str, Any] = Field(
        default_factory=dict,
        description="Trazabilidad del motor que produjo el análisis (Gemini vs heurístico)",
    )

class CallOutAnalysisRequest(BaseModel):
    cliente_id: str
    oferta_inicial: str
    oferta_rebate: Optional[str] = None
    transcripcion: List[SpeechTranscriptSegment]
    duracion_seg: Optional[int] = 0
    contexto: Optional[Dict[str, Any]] = None

class CallOutAnalysisResponse(BaseModel):
    cliente_id: str
    resultado_oferta_inicial: str # "ACEPTADA" | "RECHAZADA" | "INDECISO"
    motivo_rechazo_inicial: Optional[str] = None
    rebate_aplicado: bool
    oferta_rebate_ofrecida: Optional[str] = None
    efectividad_rebate: str # "ALTA_CONVERSION" | "OBJECION_PERSISTENTE" | "RECHAZO_TOTAL" | "NO_APLICA"
    score_efectividad_rebate: float # 0.0 a 1.0
    argumentos_asesor_evaluados: List[str]
    oportunidad_mejora_asesor: Optional[str]
    resumen_interaccion: str
    motor_analisis: Dict[str, Any] = Field(
        default_factory=dict,
        description="Trazabilidad del motor que produjo el análisis (Gemini vs heurístico)",
    )

# -------------------------------------------------------------
# Catálogo de Simulaciones Realistas de Call Center (Dialecto Perú)
# -------------------------------------------------------------

SIMULACIONES_CALL_CENTER = {
    "call_in_averia_fibra": {
        "tipo": "call_in",
        "titulo": "Avería de Fibra / Intermitencia Severa",
        "descripcion": "Cliente enojado por caída de internet hogar durante teletrabajo.",
        "cliente_id": "CLI000012",
        "audio_simulado_url": None,
        "dialogos": [
            {"speaker": "ASESOR", "text": "Gracias por comunicarse con Movistar, le atiende Carlos. ¿Con quién tengo el gusto?", "timestamp": "00:03"},
            {"speaker": "CLIENTE", "text": "Mire joven, habla Fernando Quispe. Estoy harto, desde ayer a las 3 de la tarde no tengo internet de fibra óptica en San Miguel y trabajo desde casa.", "timestamp": "00:12"},
            {"speaker": "ASESOR", "text": "Comprendo perfectamente su molestia, señor Fernando. Permítame validar el estado de su nodo en nuestro sistema técnico.", "timestamp": "00:20"},
            {"speaker": "CLIENTE", "text": "Siempre dicen lo mismo. Si no me solucionan hoy mismo la avería, voy a pedir la portabilidad de mis líneas móviles y cancelar el servicio.", "timestamp": "00:31"},
            {"speaker": "ASESOR", "text": "Verifico que hubo una incidencia masiva en su zona y la cuadrilla técnica ya está cerrando la reposición. Le genero el código de reclamo REC-84920 con descuento en su siguiente ciclo.", "timestamp": "00:45"},
            {"speaker": "CLIENTE", "text": "Espero que cumplan con el descuento porque ya son dos veces este mes. Quedo a la espera del mensaje de confirmación.", "timestamp": "00:58"}
        ]
    },
    "call_in_reclamo_facturacion": {
        "tipo": "call_in",
        "titulo": "Reclamo por Cobro Indebido en Facturación",
        "descripcion": "Cliente reclama un cobro adicional por servicios no contratados.",
        "cliente_id": "CLI000025",
        "audio_simulado_url": None,
        "dialogos": [
            {"speaker": "ASESOR", "text": "Bienvenido a Atención al Cliente Movistar, le atiende Patricia. ¿En qué le puedo asistir?", "timestamp": "00:02"},
            {"speaker": "CLIENTE", "text": "Buenas tardes, me ha llegado el recibo de este mes con 45 soles de más. Yo tengo un plan de 69.90 y me están cobrando 114.90.", "timestamp": "00:14"},
            {"speaker": "ASESOR", "text": "Lamento el inconveniente, déjeme revisar el desglose de su última factura emitida.", "timestamp": "00:22"},
            {"speaker": "CLIENTE", "text": "Revisen bien porque yo nunca he solicitado paquetes adicionales de canales premium.", "timestamp": "00:30"},
            {"speaker": "ASESOR", "text": "Tiene toda la razón, se activó una suscripción automática por error de plataforma. En este momento genero la anulación y una nota de crédito a su favor.", "timestamp": "00:44"},
            {"speaker": "CLIENTE", "text": "Muchas gracias señorita, qué bueno que me lo haya resuelto de inmediato.", "timestamp": "00:54"}
        ]
    },
    "call_out_rechazo_precio_rebate_exitoso": {
        "tipo": "call_out",
        "titulo": "Rechazo por Precio Inicial -> Rebate a Movistar Total Exitoso",
        "descripcion": "Oferta inicial de plan ilimitado rechazada por costo, pero acepta migrar a Movistar Total con 35% de ahorro.",
        "cliente_id": "CLI000015",
        "oferta_inicial": "Plan Movil Ilimitado 5G (S/ 99.90)",
        "oferta_rebate": "Movistar Total Plus (Fibra 300Mbps + 2 Líneas Móviles con 35% Ahorro)",
        "dialogos": [
            {"speaker": "ASESOR", "text": "Buenas tardes, señorita Rosa. Le saluda Diego de promociones especiales Movistar. La llamamos porque por su puntualidad tiene preaprobado nuestro Plan Móvil Ilimitado 5G por S/ 99.90 al mes.", "timestamp": "00:06"},
            {"speaker": "CLIENTE", "text": "Hola joven, gracias pero la verdad 99 soles me parece muy caro. Ahorita estoy ajustada con los gastos y no puedo pagar tanto por un plan móvil.", "timestamp": "00:18"},
            {"speaker": "ASESOR", "text": "La entiendo totalmente. Pero veo en su perfil que usted ya cuenta con internet fibra en casa por separado y paga dos recibos distintos. Si unificamos sus servicios en Movistar Total Plus, en lugar de pagar más, ¡va a ahorrar 35% mensual y le duplicamos los gigas!", "timestamp": "00:35"},
            {"speaker": "CLIENTE", "text": "¿Cómo es eso? ¿O sea que pagaría menos de lo que gasto sumando mis dos recibos actuales?", "timestamp": "00:44"},
            {"speaker": "ASESOR", "text": "Exactamente, pasaría de pagar S/ 175 en total a solo S/ 123.44 con una sola boleta y velocidad simétrica en su hogar.", "timestamp": "00:54"},
            {"speaker": "CLIENTE", "text": "Ah, perfecto. Si es con ahorro sí me interesa. Procedamos con el cambio.", "timestamp": "01:03"}
        ]
    },
    "call_out_rechazo_competencia_definitivo": {
        "tipo": "call_out",
        "titulo": "Rechazo por Compromiso de Permanencia con Claro/Entel",
        "descripcion": "El cliente tiene contrato vigente con otro operador y no aplica para rebate inmediato.",
        "cliente_id": "CLI000020",
        "oferta_inicial": "Plan Movil Plus 25GB (S/ 59.90)",
        "oferta_rebate": "Bono Especial 50GB + 3 meses al 50%",
        "dialogos": [
            {"speaker": "ASESOR", "text": "Hola, buenos días Sr. Manuel. Le llamamos de Movistar para ofrecerle una línea móvil con 25GB y redes ilimitadas a solo S/ 59.90.", "timestamp": "00:06"},
            {"speaker": "CLIENTE", "text": "Mire amigo, no estoy interesado. Acabo de renovar contrato por 18 meses con mi operador actual y tengo penalidad si me cambio.", "timestamp": "00:16"},
            {"speaker": "ASESOR", "text": "Comprendo. Le podemos ofrecer una segunda línea con 3 meses al 50% de descuento para algún familiar en su hogar.", "timestamp": "00:26"},
            {"speaker": "CLIENTE", "text": "No gracias, toda mi familia está con el mismo operador. No me interesa ningún plan por ahora.", "timestamp": "00:34"},
            {"speaker": "ASESOR", "text": "Entendido señor Manuel, agradezco su tiempo y que tenga buen día.", "timestamp": "00:40"}
        ]
    }
}

# -------------------------------------------------------------
# Motores de Análisis Heurístico / LLM
# -------------------------------------------------------------

# -------------------------------------------------------------
# Contrato de salida del LLM (responseSchema de Gemini)
# -------------------------------------------------------------
# Gemini valida la respuesta contra estos esquemas antes de devolverla, así que
# el JSON llega siempre bien formado y con los enums que consume el frontend.
# Sin esto el modelo devolvía prosa o markdown y el parseo caía a heurística.

TOPICOS_RECLAMO = [
    "Facturacion_Cobro_Indebido",
    "Averia_Tecnica_Fibra_Red",
    "Calidad_Red_Movil",
    "Mala_Atencion",
    "Portabilidad_Baja",
    "Consulta_Comercial_General",
]

MOTIVOS_RECHAZO = [
    "Precio muy alto",
    "Compromiso con otro operador",
    "No necesita el servicio",
    "Falta de tiempo / Contacto inoportuno",
    "Mala experiencia previa",
    "Sin cobertura fibra",
    "No aplica",
]

SCHEMA_CALL_IN = {
    "type": "OBJECT",
    "properties": {
        "score_sentimiento": {
            "type": "NUMBER",
            "description": (
                "Sentimiento del CLIENTE en escala obligatoria de 1.0 a 5.0, con un decimal. "
                "1.0 = furioso/amenaza con irse; 2.5 = molesto; 3.5 = neutro; 5.0 = muy satisfecho. "
                "Nunca uses una escala de 0 a 1 ni de 0 a 100."
            ),
        },
        "nivel_sentimiento": {"type": "STRING", "enum": ["MUY_NEGATIVO", "NEGATIVO", "NEUTRO", "POSITIVO"]},
        "topico_reclamo": {"type": "STRING", "enum": TOPICOS_RECLAMO},
        "descripcion_problema": {"type": "STRING", "description": "Resumen del problema en una sola oración."},
        "cliente_insatisfecho": {
            "type": "BOOLEAN",
            "description": "true si hay reclamo o avería activa que impida ofrecer productos comerciales.",
        },
        "accion_recomendada": {"type": "STRING", "description": "Siguiente paso concreto para el asesor o el sistema."},
        "puntos_criticos": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": (
                "Entre 2 y 4 hallazgos de riesgo detectados en la llamada, redactados como "
                "frases completas en español (no etiquetas ni palabras sueltas en mayúsculas)."
            ),
        },
    },
    "required": [
        "score_sentimiento", "nivel_sentimiento", "topico_reclamo", "descripcion_problema",
        "cliente_insatisfecho", "accion_recomendada", "puntos_criticos",
    ],
    "propertyOrdering": [
        "score_sentimiento", "nivel_sentimiento", "topico_reclamo", "descripcion_problema",
        "cliente_insatisfecho", "accion_recomendada", "puntos_criticos",
    ],
}

SCHEMA_CALL_OUT = {
    "type": "OBJECT",
    "properties": {
        "resultado_oferta_inicial": {"type": "STRING", "enum": ["ACEPTADA", "RECHAZADA", "INDECISO"]},
        "motivo_rechazo_inicial": {
            "type": "STRING",
            "enum": MOTIVOS_RECHAZO,
            "description": "Usa 'No aplica' únicamente si la oferta inicial fue aceptada sin objeción.",
        },
        "rebate_aplicado": {
            "type": "BOOLEAN",
            "description": "true si el asesor contraofertó una alternativa tras la objeción del cliente.",
        },
        "efectividad_rebate": {
            "type": "STRING",
            "enum": ["ALTA_CONVERSION", "OBJECION_PERSISTENTE", "RECHAZO_TOTAL", "NO_APLICA"],
        },
        "score_efectividad_rebate": {
            "type": "NUMBER",
            "description": "Efectividad del rebate de 0.0 (rechazo total) a 1.0 (cierre inmediato).",
        },
        "argumentos_asesor_evaluados": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": (
                "Entre 2 y 4 aciertos concretos del speech del asesor, redactados como "
                "frases completas en español (no etiquetas ni palabras sueltas en mayúsculas)."
            ),
        },
        "oportunidad_mejora_asesor": {"type": "STRING", "description": "Feedback de coaching en una oración."},
        "resumen_interaccion": {"type": "STRING", "description": "Resumen ejecutivo de la llamada en un párrafo."},
    },
    "required": [
        "resultado_oferta_inicial", "motivo_rechazo_inicial", "rebate_aplicado", "efectividad_rebate",
        "score_efectividad_rebate", "argumentos_asesor_evaluados", "oportunidad_mejora_asesor",
        "resumen_interaccion",
    ],
    "propertyOrdering": [
        "resultado_oferta_inicial", "motivo_rechazo_inicial", "rebate_aplicado", "efectividad_rebate",
        "score_efectividad_rebate", "argumentos_asesor_evaluados", "oportunidad_mejora_asesor",
        "resumen_interaccion",
    ],
}

SYSTEM_CALL_IN = (
    "Eres auditor senior de calidad y Customer Experience de Movistar Perú. "
    "Analizas transcripciones diarizadas de llamadas INBOUND del call center peruano. "
    "Evalúas el sentimiento del CLIENTE (nunca el del asesor), clasificas el motivo del contacto "
    "y determinas si corresponde bloquear el ofrecimiento comercial por presión indebida. "
    "Respondes siempre en español peruano neutro y solo con el JSON del esquema."
)

SYSTEM_CALL_OUT = (
    "Eres auditor senior de efectividad comercial y televentas de Movistar Perú. "
    "Analizas transcripciones diarizadas de llamadas OUTBOUND, determinas el resultado de la oferta "
    "inicial, el motivo real del rechazo y qué tan efectivo fue el rebate de contingencia. "
    "Evalúas el speech del asesor con criterio de coaching. "
    "Respondes siempre en español peruano neutro y solo con el JSON del esquema."
)

# Bandas definicionales: mantienen coherentes el gauge numérico y el badge de la UI.
BANDAS_SENTIMIENTO = {
    "MUY_NEGATIVO": (1.0, 2.0),
    "NEGATIVO": (2.0, 3.0),
    "NEUTRO": (3.0, 4.0),
    "POSITIVO": (4.0, 5.0),
}


# Nombre corto por proveedor para el badge de la UI.
ETIQUETA_PROVEEDOR = {
    "GOOGLE_GEMINI": "Gemini",
    "OLLAMA_LOCAL": "Ollama (local)",
}


def _motor_llm(motor: Dict[str, Any]) -> Dict[str, Any]:
    """Normaliza la traza del proveedor para exponerla al frontend."""
    proveedor = motor.get("proveedor") or "GOOGLE_GEMINI"
    modelo = motor.get("modelo") or "desconocido"
    latencia = motor.get("latencia_ms")
    nombre = ETIQUETA_PROVEEDOR.get(proveedor, proveedor)
    return {
        "proveedor": proveedor,
        "modelo": modelo,
        "latencia_ms": latencia,
        "es_llm_real": True,
        "ejecucion": motor.get("ejecucion", "nube"),
        "etiqueta": f"{nombre} · {modelo}" + (f" · {latencia / 1000:.1f}s" if latencia else ""),
        "tokens": motor.get("tokens"),
        "error": None,
    }


def _motor_heuristico(error: Optional[str] = None) -> Dict[str, Any]:
    return {
        "proveedor": "HEURISTICO_LOCAL",
        "modelo": "Motor NLP Heurístico Calibrado",
        "latencia_ms": None,
        "es_llm_real": False,
        "ejecucion": "local",
        "etiqueta": "Heurístico offline (sin LLM)",
        "tokens": None,
        "error": error,
    }


def _ai_disponible():
    """Devuelve la instancia de AIService lista para inferir, o None.

    Basta con que exista UN proveedor: la clave de Gemini o un modelo local
    servido por Ollama. Así, agotada la cuota gratuita, el análisis sigue
    resolviéndose con un LLM real en lugar de caer al motor heurístico.
    """
    if AIService is None:
        return None
    try:
        inst = AIService.get_instance()
        if inst.is_gemini_configured or inst.ollama_disponible():
            return inst
        return None
    except Exception as e:
        print(f"[Speech Router] AIService no inicializable: {e}")
        return None


def _normalizar_score_sentimiento(score: Any, nivel: str) -> float:
    """Encaja el score dentro de la banda de su nivel.

    Los modelos a veces responden en escala 0-1; el ajuste a la banda garantiza
    que el gauge (x/5.0) y el badge de sentimiento nunca se contradigan.
    """
    try:
        valor = float(score)
    except (TypeError, ValueError):
        valor = 3.0
    piso, techo = BANDAS_SENTIMIENTO.get(nivel, (1.0, 5.0))
    return round(min(max(valor, piso), techo), 1)


def _construir_prompt_call_in(payload: "CallInAnalysisRequest", texto_dialogo: str) -> str:
    contexto = payload.contexto or {}
    bloque_contexto = (
        f"\nContexto del cliente en el CRM: {json.dumps(contexto, ensure_ascii=False)}"
        if contexto else ""
    )
    return f"""Audita esta llamada INBOUND del call center de Movistar Perú.

Cliente: {payload.cliente_id}
Duración: {payload.duracion_seg or 'no informada'} segundos{bloque_contexto}

Transcripción diarizada:
{texto_dialogo}

Instrucciones de análisis:
1. `score_sentimiento` mide al CLIENTE en escala 1.0 a 5.0 y debe ser coherente con `nivel_sentimiento`.
2. Marca `cliente_insatisfecho` en true ante reclamo vigente, avería activa o amenaza de portabilidad,
   aunque el asesor haya cerrado bien la llamada.
3. `puntos_criticos` cita hechos concretos de la transcripción, no generalidades.
4. `accion_recomendada` debe ser accionable para el asesor o el motor NBO.
5. Redacta `puntos_criticos` y `descripcion_problema` como frases completas en
   español, con sujeto y verbo. No uses etiquetas, palabras sueltas ni
   MAYUSCULAS_CON_GUIONES."""


def _construir_prompt_call_out(payload: "CallOutAnalysisRequest", texto_dialogo: str) -> str:
    contexto = payload.contexto or {}
    bloque_contexto = (
        f"\nContexto del cliente en el CRM: {json.dumps(contexto, ensure_ascii=False)}"
        if contexto else ""
    )
    return f"""Audita esta llamada OUTBOUND de televentas de Movistar Perú.

Cliente: {payload.cliente_id}
Oferta inicial presentada: {payload.oferta_inicial}
Oferta rebate de contingencia disponible: {payload.oferta_rebate or 'ninguna'}
Duración: {payload.duracion_seg or 'no informada'} segundos{bloque_contexto}

Transcripción diarizada:
{texto_dialogo}

Instrucciones de análisis:
1. `resultado_oferta_inicial` se refiere solo a la PRIMERA oferta, antes de cualquier rebate.
2. `rebate_aplicado` es true únicamente si el asesor contraofertó tras la objeción.
3. `score_efectividad_rebate` va de 0.0 a 1.0 y debe ser coherente con `efectividad_rebate`
   (ALTA_CONVERSION ≥ 0.8, OBJECION_PERSISTENTE entre 0.4 y 0.7, RECHAZO_TOTAL ≤ 0.2,
   NO_APLICA = 0.0).
4. `argumentos_asesor_evaluados` cita técnicas comerciales realmente usadas en la transcripción.
5. Redacta `argumentos_asesor_evaluados`, `oportunidad_mejora_asesor` y
   `resumen_interaccion` como frases completas en español, con sujeto y verbo.
   No uses etiquetas, palabras sueltas ni MAYUSCULAS_CON_GUIONES."""


def _analizar_call_in_offline(texto_completo: str, cliente_id: str) -> CallInAnalysisResponse:
    """Motor de análisis NLP heurístico robusto para Call-In si LLM no responde."""
    texto_lower = texto_completo.lower()

    # Detección de tópicos
    topico = "Consulta_Comercial_General"
    desc_problema = "Consulta de saldo o servicios contratados."
    es_insatisfecho = False
    score = 3.8
    nivel = "NEUTRO"
    puntos_criticos = []
    
    # Averías
    if any(k in texto_lower for k in ["avería", "averia", "falla", "caída", "caida", "lento", "sin internet", "fibra", "sin señal", "no tengo internet", "corte"]):
        topico = "Averia_Tecnica_Fibra_Red"
        desc_problema = "Interrupción o degradación del servicio de internet/fibra en el domicilio."
        score = 1.6
        nivel = "MUY_NEGATIVO"
        es_insatisfecho = True
        puntos_criticos.append("Reporta falla técnica activa e intermitencia en el servicio.")
        if "teletrabajo" in texto_lower or "trabajo" in texto_lower:
            puntos_criticos.append("Afectación de actividad laboral crítica (teletrabajo).")

    # Facturación / Cobro
    elif any(k in texto_lower for k in ["cobro", "factura", "recibo", "demás", "de mas", "caro", "descuento", "plata", "45 soles", "indebido"]):
        topico = "Facturacion_Cobro_Indebido"
        desc_problema = "Discrepancia en el monto facturado respecto al plan contratado."
        score = 2.1
        nivel = "NEGATIVO"
        es_insatisfecho = True
        puntos_criticos.append("Reclama cargos adicionales o montos no reconocidos en la factura.")

    # Portabilidad / Churn
    if any(k in texto_lower for k in ["portabilidad", "cancelar", "baja", "competencia", "otro operador", "claro", "entel"]):
        score = max(1.0, score - 0.5)
        nivel = "MUY_NEGATIVO"
        es_insatisfecho = True
        puntos_criticos.append("Amenaza explícita de portabilidad o baja del servicio.")

    if any(k in texto_lower for k in ["muchas gracias", "excelente", "resuelto", "agradezco", "buena atencion", "perfecto"]):
        if score > 2.5:
            score = 4.5
            nivel = "POSITIVO"

    accion = "NO_OFRECER_BLOQUEO_PRESION" if es_insatisfecho else "EVALUAR_OPORTUNIDAD_NBO"
    recomendacion_msg = (
        "Reclamo crítico en curso. Bloquear cualquier intento de venta y priorizar resolución técnica/nota de crédito."
        if es_insatisfecho else
        "Cliente satisfecho o consulta resuelta. Apto para explorar beneficios de Movistar Total."
    )

    return CallInAnalysisResponse(
        cliente_id=cliente_id,
        score_sentimiento=round(score, 1),
        nivel_sentimiento=nivel,
        topico_reclamo=topico,
        descripcion_problema=desc_problema,
        cliente_insatisfecho=es_insatisfecho,
        accion_recomendada=recomendacion_msg,
        puntos_criticos=puntos_criticos if puntos_criticos else ["Interacción de trámite regular"],
        sugerencia_nbo={
            "accion_nbo": accion,
            "bloqueo_presion_activo": es_insatisfecho,
            "sugerencia_fidelizacion": "Movistar Total con descuento de rescate" if es_insatisfecho else "Movistar Total Convergente"
        }
    )

def _analizar_call_out_offline(texto_completo: str, cliente_id: str, oferta_inicial: str, oferta_rebate: Optional[str]) -> CallOutAnalysisResponse:
    """Motor de análisis NLP heurístico robusto para Call-Out si LLM no responde."""
    texto_lower = texto_completo.lower()

    # Detección de resultado de oferta inicial
    resultado_inicial = "RECHAZADA"
    motivo_rechazo = "No especificado"
    if any(k in texto_lower for k in ["caro", "muy alto", "99 soles", "no puedo pagar", "presupuesto", "ajustada", "costoso", "mucho dinero"]):
        motivo_rechazo = "Precio muy alto"
    elif any(k in texto_lower for k in ["renové", "renove", "contrato", "permanencia", "penalidad", "competencia", "claro", "entel", "otro operador"]):
        motivo_rechazo = "Compromiso con otro operador"
    elif any(k in texto_lower for k in ["no necesito", "no uso", "tengo suficiente", "no me interesa", "no gracias"]):
        motivo_rechazo = "No necesita el servicio"
    elif any(k in texto_lower for k in ["no tengo tiempo", "ocupado", "llame luego", "manejando"]):
        motivo_rechazo = "Falta de tiempo / Contacto inoportuno"

    # Detección de Rebate
    rebate_aplicado = False
    efectividad = "NO_APLICA"
    score_efectividad = 0.0
    argumentos = []
    oportunidad_mejora = None

    if any(k in texto_lower for k in ["movistar total", "ahorrar", "ahorro", "duplicamos", "descuento", "unificamos", "dos recibos", "segunda línea", "50%"]):
        rebate_aplicado = True
        argumentos.append("Asesor presentó oferta de contingencia/rebate enfocada en ahorro o valor convergente.")

    if rebate_aplicado:
        if any(k in texto_lower for k in ["si me interesa", "sí me interesa", "procedamos", "me convence", "hagamos el cambio", "de acuerdo", "perfecto si es con ahorro"]):
            efectividad = "ALTA_CONVERSION"
            score_efectividad = 0.92
            argumentos.append("Excelente pivote del asesor ante la objeción de precio hacia Movistar Total.")
            resumen = "El cliente rechazó la oferta móvil inicial por costo, pero aceptó el rebate convergente Movistar Total logrando cierre positivo."
        elif any(k in texto_lower for k in ["no gracias", "toda mi familia está", "no me interesa ningún plan", "deje de llamar"]):
            efectividad = "RECHAZO_TOTAL"
            score_efectividad = 0.10
            oportunidad_mejora = "El cliente posee contrato vigente con penalidad; convendría agendar recordatorio de vencimiento de permanencia en 6 meses."
            resumen = "Rechazo de oferta inicial y rebate por compromiso de permanencia inamovible con competidor."
        else:
            efectividad = "OBJECION_PERSISTENTE"
            score_efectividad = 0.45
            resumen = "El cliente mostró interés parcial en el rebate pero requirió tiempo para consultar con familiares."
    else:
        resumen = "Llamada finalizada sin aplicación de estrategia de rebate secundaria."

    return CallOutAnalysisResponse(
        cliente_id=cliente_id,
        resultado_oferta_inicial=resultado_inicial,
        motivo_rechazo_inicial=motivo_rechazo,
        rebate_aplicado=rebate_aplicado,
        oferta_rebate_ofrecida=oferta_rebate if rebate_aplicado else None,
        efectividad_rebate=efectividad,
        score_efectividad_rebate=score_efectividad,
        argumentos_asesor_evaluados=argumentos if argumentos else ["Speech estándar ejecutado"],
        oportunidad_mejora_asesor=oportunidad_mejora,
        resumen_interaccion=resumen
    )

# -------------------------------------------------------------
# Endpoints de la API
# -------------------------------------------------------------

@router.get("/simulaciones")
def listar_simulaciones():
    """Devuelve las simulaciones de audio y transcripciones listas para testing de Call In y Call Out."""
    return SIMULACIONES_CALL_CENTER

@router.get("/diagnostico-llm")
def diagnostico_llm():
    """Ping en vivo a la cascada de LLM (Gemini en la nube y Ollama local).

    Permite verificar antes de una demo que el análisis post-hoc corre sobre un
    LLM real y no sobre el motor heurístico de respaldo.
    """
    if AIService is None:
        return {
            "conexion_ok": False,
            "error": "AIService no importable. Instala: pip install -r requirements-ai.txt",
            "motor_activo": "HEURISTICO_LOCAL",
        }
    try:
        info = AIService.get_instance().diagnostico()
    except Exception as e:
        return {"conexion_ok": False, "error": f"{type(e).__name__}: {e}",
                "motor_activo": "HEURISTICO_LOCAL"}
    # Refleja el proveedor que realmente respondió, no solo si hubo conexión.
    info["motor_activo"] = (
        info.get("proveedor_que_respondio") or "GOOGLE_GEMINI"
        if info.get("conexion_ok") else "HEURISTICO_LOCAL"
    )
    info["respaldo_local_listo"] = bool(info.get("ollama", {}).get("servicio_activo"))
    return info


@router.post("/precalentar-llm-local")
def precalentar_llm_local():
    """Carga el modelo local en VRAM antes de la demo.

    La primera inferencia en frío tarda ~60 s más que las siguientes. Conviene
    llamar a este endpoint una vez al montar la sala, no durante el pitch.
    """
    if AIService is None:
        return {"ok": False, "error": "AIService no importable"}
    try:
        return AIService.get_instance().precalentar_ollama()
    except Exception as e:
        return {"ok": False, "error": f"{type(e).__name__}: {e}"}


@router.post("/analisis-call-in", response_model=CallInAnalysisResponse)
def analizar_call_in(
    payload: CallInAnalysisRequest,
    forzar_llm: bool = Query(
        False,
        description="Si es true devuelve 503 en lugar de degradar al motor heurístico.",
    ),
):
    """
    Análisis post-hoc para Call In (Inbound) ejecutado por Google Gemini.
    Clasifica:
    - Score_sentimiento (1.0 a 5.0)
    - Topico de reclamo (Facturación, Avería Técnica, etc.)
    - Bloqueo o activación de ofertas NBO
    """
    texto_dialogo = "\n".join([f"[{s.speaker}]: {s.text}" for s in payload.transcripcion])
    motivo_fallback = "AIService no disponible (falta google-genai/requests o el import falló)"

    ai_inst = _ai_disponible()
    if ai_inst is not None:
        datos, motor = ai_inst.generate_json(
            prompt=_construir_prompt_call_in(payload, texto_dialogo),
            schema=SCHEMA_CALL_IN,
            system_instruction=SYSTEM_CALL_IN,
            temperature=0.2,
        )
        if datos:
            nivel = datos.get("nivel_sentimiento", "NEUTRO")
            score = _normalizar_score_sentimiento(datos.get("score_sentimiento"), nivel)
            es_insatisfecho = bool(datos.get("cliente_insatisfecho", False))
            return CallInAnalysisResponse(
                cliente_id=payload.cliente_id,
                score_sentimiento=score,
                nivel_sentimiento=nivel,
                topico_reclamo=datos.get("topico_reclamo", "Consulta_Comercial_General"),
                descripcion_problema=datos.get("descripcion_problema", ""),
                cliente_insatisfecho=es_insatisfecho,
                accion_recomendada=datos.get("accion_recomendada", ""),
                puntos_criticos=datos.get("puntos_criticos") or ["Sin hallazgos críticos"],
                sugerencia_nbo={
                    "accion_nbo": "NO_OFRECER_BLOQUEO_PRESION" if es_insatisfecho else "EVALUAR_OPORTUNIDAD_NBO",
                    "bloqueo_presion_activo": es_insatisfecho,
                    "sugerencia_fidelizacion": "Movistar Total con descuento de rescate" if es_insatisfecho else "Movistar Total Convergente",
                },
                motor_analisis=_motor_llm(motor),
            )
        motivo_fallback = motor.get("error") or "Gemini no devolvió un análisis válido"
        print(f"[Speech Router] Call In degradado a heurística: {motivo_fallback}")

    if forzar_llm:
        # Modo verificación: se prefiere fallar visiblemente antes que servir heurística.
        raise HTTPException(
            status_code=503,
            detail=f"El análisis con Gemini no pudo ejecutarse: {motivo_fallback}",
        )

    # Fallback heurístico calibrado
    resultado = _analizar_call_in_offline(texto_dialogo, payload.cliente_id)
    resultado.motor_analisis = _motor_heuristico(motivo_fallback)
    return resultado


@router.post("/analisis-call-out", response_model=CallOutAnalysisResponse)
def analizar_call_out(
    payload: CallOutAnalysisRequest,
    forzar_llm: bool = Query(
        False,
        description="Si es true devuelve 503 en lugar de degradar al motor heurístico.",
    ),
):
    """
    Análisis post-hoc para Call Out (Outbound / Ventas) ejecutado por Google Gemini.
    Clasifica:
    - Motivo de rechazo de oferta inicial
    - Efectividad del rebate (Top-2 / Top-3)
    - Evaluación de speech del asesor
    """
    texto_dialogo = "\n".join([f"[{s.speaker}]: {s.text}" for s in payload.transcripcion])
    motivo_fallback = "AIService no disponible (falta google-genai/requests o el import falló)"

    ai_inst = _ai_disponible()
    if ai_inst is not None:
        datos, motor = ai_inst.generate_json(
            prompt=_construir_prompt_call_out(payload, texto_dialogo),
            schema=SCHEMA_CALL_OUT,
            system_instruction=SYSTEM_CALL_OUT,
            temperature=0.2,
        )
        if datos:
            rebate_aplicado = bool(datos.get("rebate_aplicado", False))
            # El esquema no admite null: "No aplica" es el centinela para ausencia de rechazo.
            motivo = datos.get("motivo_rechazo_inicial")
            if motivo == "No aplica":
                motivo = None
            try:
                score_rebate = round(min(max(float(datos.get("score_efectividad_rebate", 0.0)), 0.0), 1.0), 2)
            except (TypeError, ValueError):
                score_rebate = 0.0
            return CallOutAnalysisResponse(
                cliente_id=payload.cliente_id,
                resultado_oferta_inicial=datos.get("resultado_oferta_inicial", "RECHAZADA"),
                motivo_rechazo_inicial=motivo,
                rebate_aplicado=rebate_aplicado,
                oferta_rebate_ofrecida=payload.oferta_rebate if rebate_aplicado else None,
                efectividad_rebate=datos.get("efectividad_rebate", "NO_APLICA"),
                score_efectividad_rebate=score_rebate,
                argumentos_asesor_evaluados=datos.get("argumentos_asesor_evaluados") or ["Speech estándar ejecutado"],
                oportunidad_mejora_asesor=datos.get("oportunidad_mejora_asesor"),
                resumen_interaccion=datos.get("resumen_interaccion", ""),
                motor_analisis=_motor_llm(motor),
            )
        motivo_fallback = motor.get("error") or "Gemini no devolvió un análisis válido"
        print(f"[Speech Router] Call Out degradado a heurística: {motivo_fallback}")

    if forzar_llm:
        raise HTTPException(
            status_code=503,
            detail=f"El análisis con Gemini no pudo ejecutarse: {motivo_fallback}",
        )

    # Fallback heurístico calibrado
    resultado = _analizar_call_out_offline(
        texto_dialogo, payload.cliente_id, payload.oferta_inicial, payload.oferta_rebate
    )
    resultado.motor_analisis = _motor_heuristico(motivo_fallback)
    return resultado


# -------------------------------------------------------------
# WebSocket para Streaming de Transcripción en Tiempo Real
# -------------------------------------------------------------

@router.websocket("/ws-transcription")
async def websocket_speech_endpoint(websocket: WebSocket):
    """
    WebSocket bidireccional para transcripción de audio en tiempo real.
    Acepta paquetes de audio PCM / mensajes de simulación y emite segmentos transcritos.
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            action = payload.get("action")

            if action == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.now().isoformat()})
            elif action == "stream_text_chunk":
                # Re-emite fragmento enriquecido con speaker y timestamp
                await websocket.send_json({
                    "type": "transcript_chunk",
                    "speaker": payload.get("speaker", "CLIENTE"),
                    "text": payload.get("text", ""),
                    "timestamp": payload.get("timestamp", "00:00"),
                    "is_final": payload.get("is_final", True)
                })
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[Speech WS] Desconexión o error: {e}")
