from typing import Any, Dict, List, Optional
from app.backend.data_loader import (
    get_cliente_by_id,
    get_oferta_by_id,
    get_top3_scoring,
    get_ofertas_catalog
)
from app.backend.speech_generator import generar_speech_comercial, generar_speech_rebate

def enriquecer_explicabilidad(cliente: Dict[str, Any], oferta: Dict[str, Any], rank: int, canal: str) -> Dict[str, Any]:
    """Construye las 5 dimensiones XAI requeridas por el marco del Desafío 02."""
    es_mt = oferta.get("oferta_es_mt", False) or oferta.get("es_movistar_total", False)
    elegible_mt = cliente.get("elegible_mt", False)
    antiguedad = cliente.get("antiguedad_meses", 0)
    consumo_datos = cliente.get("consumo_datos_gb_prom", 0)
    monto_facturado = cliente.get("monto_facturado_prom", 0)
    meses_moroso = cliente.get("meses_moroso", 0)
    nombre_oferta = oferta.get("nombre_oferta", "Oferta")
    ahorro_pct = oferta.get("ahorro_pct", 0)

    # 1. ¿Qué ofrecer?
    que_ofrecer = f"{nombre_oferta} — {oferta.get('descripcion_corta') or 'Optimización de servicios'}"

    # 2. ¿Por qué a este cliente?
    motivos = []
    if es_mt and elegible_mt:
        motivos.append("Cliente convergente elegible: cuenta con móvil e internet por separado")
        if ahorro_pct > 0:
            motivos.append(f"Ahorro directo de {ahorro_pct}% unificando su factura")
    elif es_mt:
        motivos.append("Propensión alta a convergencia para blindaje y reducción de churn")
    
    if consumo_datos > 20:
        motivos.append(f"Alto consumo de datos ({consumo_datos:.1f} GB/mes) requiere mayor bolsa")
    
    if antiguedad >= 24:
        motivos.append(f"Antigüedad destacada ({antiguedad} meses)")
        
    if meses_moroso == 0:
        motivos.append("Excelente comportamiento de pago sin morosidad")
    elif meses_moroso >= 2:
        motivos.append("Historial de mora reciente: se recomienda oferta controlada sin sobrefacturación")

    por_que_este_cliente = ". ".join(motivos) + "." if motivos else "Perfil compatible con el segmento objetivo de la oferta."

    # 3. ¿Por qué canal y en qué momento?
    canal_usado = cliente.get("canal_mas_usado") or canal or "Digital"
    if str(canal_usado).lower() in ["digital", "app"]:
        canal_sugerido = f"Canal Digital / App Mi Movistar (Cliente digitalizado con uso activo de app)"
    elif str(canal_usado).lower() in ["call in", "call out", "call"]:
        canal_sugerido = f"Atención Telefónica / Call Center (Mayor contactabilidad observada en llamadas)"
    else:
        canal_sugerido = f"Tienda / Punto Presencial (Preferencia por canal asistido presencial)"

    # 4. ¿Qué speech comercial usar?
    speech_comercial = generar_speech_comercial(cliente, oferta, str(canal_usado))

    # 5. ¿Cuál es el rebate si rechaza?
    rebate_si_rechaza = generar_speech_rebate(cliente, oferta)

    return {
        "que_ofrecer": que_ofrecer,
        "por_que_este_cliente": por_que_este_cliente,
        "canal_sugerido": canal_sugerido,
        "speech_comercial": speech_comercial,
        "rebate_si_rechaza": rebate_si_rechaza,
        "rank": rank
    }

def obtener_nbo_cliente(cliente_id: str) -> Optional[Dict[str, Any]]:
    """Obtiene y ensambla el reporte Top-3 NBO completo para el asesor."""
    cliente = get_cliente_by_id(cliente_id)
    if not cliente:
        return None

    # Obtener ofertas Top-3 del dataset procesado
    top3_data = get_top3_scoring(cliente_id)
    canal_contexto = cliente.get("canal_mas_usado") or "Digital"

    top_ofertas = []
    for idx, row in enumerate(top3_data, start=1):
        xai = enriquecer_explicabilidad(cliente, row, rank=idx, canal=canal_contexto)
        
        # Nivel de semáforo del score
        score = float(row.get("score_aceptacion", 0.5))
        if score >= 0.70:
            semaforo = "alto"
            color = "#00C853"
        elif score >= 0.50:
            semaforo = "medio"
            color = "#FFB300"
        else:
            semaforo = "moderado"
            color = "#019DF4"

        top_ofertas.append({
            "ranking": row.get("ranking_predictivo", idx),
            "oferta_id": row.get("oferta_id"),
            "nombre_oferta": row.get("nombre_oferta"),
            "tipo_oferta": row.get("tipo_oferta"),
            "precio_mensual": row.get("precio_mensual"),
            "ahorro_pct": row.get("ahorro_pct", 0),
            "gb_incluidos": row.get("gb_incluidos", 0),
            "oferta_es_mt": bool(row.get("oferta_es_mt")),
            "score_aceptacion": score,
            "score_porcentaje": round(score * 100, 1),
            "semaforo": semaforo,
            "color": color,
            "explicabilidad": xai
        })

    # Si no había top 3 precalculado para ese id, generar fallback con catálogo
    if not top_ofertas:
        catalogo = get_ofertas_catalog()[:3]
        for idx, of in enumerate(catalogo, start=1):
            xai = enriquecer_explicabilidad(cliente, of, rank=idx, canal=canal_contexto)
            score = 0.65 - (idx * 0.05)
            top_ofertas.append({
                "ranking": idx,
                "oferta_id": of.get("oferta_id"),
                "nombre_oferta": of.get("nombre_oferta"),
                "tipo_oferta": of.get("tipo_oferta"),
                "precio_mensual": of.get("precio_mensual"),
                "ahorro_pct": of.get("ahorro_pct", 0),
                "gb_incluidos": of.get("gb_incluidos", 0),
                "oferta_es_mt": bool(of.get("es_movistar_total")),
                "score_aceptacion": score,
                "score_porcentaje": round(score * 100, 1),
                "semaforo": "medio",
                "color": "#FFB300",
                "explicabilidad": xai
            })

    # Clasificación de riesgo de pago del cliente
    meses_moroso = cliente.get("meses_moroso") or 0
    dias_mora = cliente.get("dias_mora_prom") or 0
    if meses_moroso >= 2 or dias_mora > 15:
        nivel_riesgo = "Alto"
        riesgo_badge = "alerta"
    elif meses_moroso == 1 or dias_mora > 5:
        nivel_riesgo = "Medio"
        riesgo_badge = "advertencia"
    else:
        nivel_riesgo = "Bajo"
        riesgo_badge = "optimo"

    return {
        "cliente_id": cliente.get("cliente_id"),
        "perfil": {
            "tipo_cliente": cliente.get("tipo_cliente") or "No registrado",
            "departamento": cliente.get("ubicacion_departamento") or "Lima",
            "edad_rango": cliente.get("edad_rango") or "Adulto",
            "antiguedad_meses": cliente.get("antiguedad_meses") or 0,
            "arpu_actual": cliente.get("monto_facturado_prom") or 0.0,
            "consumo_datos_gb": cliente.get("consumo_datos_gb_prom") or 0.0,
            "es_usuario_app": bool(cliente.get("es_usuario_app")),
            "elegible_mt": bool(cliente.get("elegible_mt")),
            "es_movistar_total": bool(cliente.get("es_movistar_total")),
            "canal_preferente": canal_contexto,
            "nivel_riesgo": nivel_riesgo,
            "riesgo_badge": riesgo_badge,
            "dias_mora": dias_mora,
            "meses_moroso": meses_moroso,
            "reclamos": cliente.get("n_reclamos") or 0
        },
        "top_ofertas": top_ofertas
    }

def simular_scoring_adhoc(cliente_id: str, oferta_id: str, canal: Optional[str] = None) -> Dict[str, Any]:
    """Calcula el score y evaluación de una combinación específica cliente-oferta."""
    cliente = get_cliente_by_id(cliente_id)
    if not cliente:
        raise ValueError(f"Cliente {cliente_id} no encontrado")
    
    oferta = get_oferta_by_id(oferta_id)
    if not oferta:
        raise ValueError(f"Oferta {oferta_id} no encontrada")

    canal_efectivo = canal or cliente.get("canal_mas_usado") or "Digital"

    # Lógica de scoring heurística / predictiva alineada
    score_base = 0.50
    if cliente.get("elegible_mt") and oferta.get("es_movistar_total"):
        score_base += 0.22
    if oferta.get("ahorro_pct", 0) > 20:
        score_base += 0.08
    if (cliente.get("consumo_datos_gb_prom", 0) or 0) > (oferta.get("gb_incluidos", 0) or 0) * 0.8:
        score_base += 0.06
    if (cliente.get("meses_moroso", 0) or 0) >= 2:
        score_base -= 0.15
    if (cliente.get("antiguedad_meses", 0) or 0) > 36:
        score_base += 0.05

    score_final = max(0.05, min(0.95, score_base))
    xai = enriquecer_explicabilidad(cliente, oferta, rank=1, canal=canal_efectivo)

    return {
        "cliente_id": cliente_id,
        "oferta_id": oferta_id,
        "canal": canal_efectivo,
        "score_aceptacion": round(score_final, 4),
        "score_porcentaje": round(score_final * 100, 1),
        "oferta": oferta,
        "explicabilidad": xai
    }
