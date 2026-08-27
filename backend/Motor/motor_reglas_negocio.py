"""Reglas de negocio auditables para el motor Next Best Offer.

Este módulo no carga datos, no llama al modelo y no conoce el backend. Solo
evalúa elegibilidad y calcula ajustes comerciales separados de la probabilidad
predictiva.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


RULES_VERSION = "2.1.0"
MT_SCORE_TIE_TOLERANCE = 0.01
MT_AMBIGUITY_TOLERANCE = 0.01
PENALTY_DOWNGRADE = -0.02
PENALTY_DATA_DEFICIT = -0.03
PENALTY_HIGH_RISK_PRICE = -0.04


def as_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).strip().lower() in {"true", "1", "si", "sí", "yes"}


def as_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def normalized(value: Any) -> str:
    return "" if value is None else str(value).strip().lower()


def optional_bool(value: Any) -> bool | None:
    """Convierte una señal opcional sin confundir ``False`` con dato ausente."""
    if value is None or normalized(value) in {"", "desconocido", "unknown", "null", "none"}:
        return None
    if isinstance(value, bool):
        return value
    text = normalized(value)
    if text in {"true", "1", "si", "sí", "yes", "autorizado", "otorgado"}:
        return True
    if text in {"false", "0", "no", "revocado", "denegado", "rechazado"}:
        return False
    return None


def _decision(
    accion: str,
    permite_recomendar: bool,
    motivos: list[str],
    mensaje_asesor: str,
    acciones_permitidas: list[str],
    contexto: dict[str, Any],
    *,
    dato_pendiente: str | None = None,
) -> dict[str, Any]:
    if as_bool(contexto.get("escenario_simulado")):
        estado_regla = "SIMULADA_MVP"
    elif dato_pendiente:
        estado_regla = "PENDIENTE_DATO"
    else:
        estado_regla = "APLICADA_CON_DATO_EXTERNO"
    return {
        "accion": accion,
        "permite_recomendar": permite_recomendar,
        "motivos": motivos,
        "mensaje_asesor": mensaje_asesor,
        "acciones_permitidas": acciones_permitidas,
        "estado_regla": estado_regla,
        "dato_pendiente": dato_pendiente,
    }


def decidir_accion_comercial(
    canal: str,
    contexto: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Decide si corresponde contactar u ofrecer usando señales explícitas.

    El motor no infiere reclamos, averías, consentimiento ni presión desde
    los CSV. Estas señales deben ser entregadas por el backend cuando existan.
    Los umbrales de presión quedan fuera de este módulo hasta que Movistar los
    valide; el backend comunica el resultado mediante ``bloqueo_presion_activo``.
    """
    contexto = contexto or {}
    reasons: list[str] = []

    if as_bool(contexto.get("oposicion_comercial")):
        return _decision(
            "NO_CONTACTAR",
            False,
            ["OPOSICION_COMERCIAL_REGISTRADA"],
            "El cliente registró oposición comercial. No iniciar contacto de venta.",
            ["CERRAR_SIN_CONTACTO"],
            contexto,
        )

    if as_bool(contexto.get("bloqueo_presion_activo")):
        return _decision(
            "ESPERAR",
            False,
            ["PERIODO_DESCANSO_COMERCIAL_ACTIVO"],
            "El cliente se encuentra dentro de un periodo de descanso comercial.",
            ["PROGRAMAR_SEGUIMIENTO"],
            contexto,
        )

    if any(
        as_bool(contexto.get(key))
        for key in ("reclamo_activo", "averia_activa", "incidencia_en_interaccion")
    ):
        if as_bool(contexto.get("reclamo_activo")):
            reasons.append("RECLAMO_ACTIVO")
        if as_bool(contexto.get("averia_activa")):
            reasons.append("AVERIA_ACTIVA")
        if as_bool(contexto.get("incidencia_en_interaccion")):
            reasons.append("INCIDENCIA_EN_INTERACCION")
        return _decision(
            "NO_OFRECER",
            False,
            reasons,
            "Priorizar la atención del cliente y cerrar sin ofrecimiento comercial.",
            ["CERRAR_ATENCION"],
            contexto,
        )

    if normalized(canal).replace("_", " ") == "call out":
        consentimiento = optional_bool(contexto.get("consentimiento_comercial"))
        if consentimiento is False:
            return _decision(
                "NO_CONTACTAR",
                False,
                ["CONSENTIMIENTO_COMERCIAL_NO_VIGENTE"],
                "El cliente no cuenta con consentimiento comercial vigente.",
                ["CERRAR_SIN_CONTACTO"],
                contexto,
            )
        if consentimiento is None:
            return _decision(
                "VALIDAR_CONSENTIMIENTO",
                True,
                ["CONSENTIMIENTO_COMERCIAL_NO_DISPONIBLE"],
                "La recomendación puede prepararse, pero no se debe llamar hasta validar el consentimiento.",
                ["VALIDAR_CONSENTIMIENTO"],
                contexto,
                dato_pendiente="consentimiento_comercial",
            )
        return _decision(
            "CONTACTAR",
            True,
            ["CONSENTIMIENTO_VIGENTE", "SIN_BLOQUEOS_INFORMADOS"],
            "Cliente habilitado para contacto comercial saliente.",
            ["INICIAR_CONTACTO", "REGISTRAR_NO_CONTESTO"],
            contexto,
        )

    return _decision(
        "RECOMENDACION_DISPONIBLE",
        True,
        ["ACTIVAR_SOLO_SI_SURGE_OPORTUNIDAD_COMERCIAL"],
        "Abrir la recomendación solo si surge una oportunidad comercial.",
        ["ABRIR_RECOMENDACION_COMERCIAL", "CERRAR_ATENCION"],
        contexto,
    )


def es_oferta_mt(oferta: dict[str, Any]) -> bool:
    return as_bool(oferta.get("es_movistar_total", oferta.get("oferta_es_mt")))


def nivel_riesgo(cliente: dict[str, Any]) -> str:
    meses = as_float(cliente.get("meses_moroso"))
    dias = as_float(cliente.get("dias_mora_prom"))
    if meses >= 2 or dias > 10:
        return "alto"
    if meses >= 1 or dias > 5:
        return "medio"
    return "bajo"


@dataclass
class RuleEvaluation:
    allowed: bool = True
    exclusions: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def exclude(self, code: str) -> None:
        self.allowed = False
        if code not in self.exclusions:
            self.exclusions.append(code)

    def warn(self, code: str) -> None:
        if code not in self.warnings:
            self.warnings.append(code)


def evaluar_reglas(
    cliente: dict[str, Any],
    oferta: dict[str, Any],
    contexto: dict[str, Any] | None = None,
    oferta_actual: dict[str, Any] | None = None,
) -> RuleEvaluation:
    """Aplica reglas obligatorias y advertencias de no canibalización."""
    contexto = contexto or {}
    evaluation = RuleEvaluation()
    oferta_id = normalized(oferta.get("oferta_id"))
    plan_actual_id = normalized(cliente.get("plan_actual_id"))
    oferta_hogar_id = normalized(cliente.get("oferta_hogar_id"))

    if es_oferta_mt(oferta):
        if not as_bool(cliente.get("elegible_mt")):
            evaluation.exclude("MT_CLIENTE_NO_ELEGIBLE")
        if as_bool(cliente.get("es_movistar_total")):
            evaluation.exclude("MT_CLIENTE_YA_CONVERGENTE")

    if oferta_id and oferta_id in {plan_actual_id, oferta_hogar_id}:
        evaluation.exclude("OFERTA_YA_CONTRATADA")

    if nivel_riesgo(cliente) == "alto" and normalized(oferta.get("tipo_oferta")) == "equipo":
        evaluation.exclude("RIESGO_ALTO_RESTRINGE_EQUIPO")

    tipo_oferta = normalized(oferta.get("tipo_oferta"))
    segmento = normalized(oferta.get("segmento_objetivo"))
    if tipo_oferta == "upgrade":
        if segmento == "movil" and not as_bool(cliente.get("tiene_movil")):
            evaluation.exclude("UPGRADE_MOVIL_REQUIERE_SERVICIO_MOVIL")
        if segmento == "hogar" and not as_bool(cliente.get("tiene_hogar")):
            evaluation.exclude("UPGRADE_HOGAR_REQUIERE_SERVICIO_HOGAR")
    if tipo_oferta == "equipo" and segmento == "hogar" and not as_bool(cliente.get("tiene_hogar")):
        evaluation.exclude("EQUIPO_HOGAR_REQUIERE_SERVICIO_HOGAR")
    if tipo_oferta == "paquete_adicional" and segmento == "movil" and not as_bool(cliente.get("tiene_movil")):
        evaluation.exclude("ADICIONAL_MOVIL_REQUIERE_SERVICIO_MOVIL")

    same_segment = (
        oferta_actual
        and normalized(oferta_actual.get("segmento_objetivo"))
        == normalized(oferta.get("segmento_objetivo"))
    )
    if same_segment and not es_oferta_mt(oferta):
        precio_actual = as_float(oferta_actual.get("precio_mensual"), -1)
        precio_nuevo = as_float(oferta.get("precio_mensual"), -1)
        gb_actual = as_float(oferta_actual.get("gb_incluidos"), -1)
        gb_nuevo = as_float(oferta.get("gb_incluidos"), -1)
        if precio_actual > 0 and 0 <= precio_nuevo < precio_actual:
            evaluation.warn("POSIBLE_DOWNGRADE_PRECIO")
        if 0 <= gb_nuevo < gb_actual and gb_actual < 9999:
            evaluation.warn("MENOR_CAPACIDAD_DATOS")

    return evaluation


def ajustar_score_ranking(
    probabilidad: float,
    cliente: dict[str, Any],
    oferta: dict[str, Any],
    warnings: list[str],
) -> tuple[float, list[dict[str, Any]]]:
    """Ajusta el ranking sin alterar ni renombrar la probabilidad del modelo."""
    adjustments: list[dict[str, Any]] = []

    def add(code: str, value: float) -> None:
        adjustments.append({"code": code, "value": value})

    if "POSIBLE_DOWNGRADE_PRECIO" in warnings:
        add("PENALIZA_DOWNGRADE", PENALTY_DOWNGRADE)
    if "MENOR_CAPACIDAD_DATOS" in warnings:
        add("PENALIZA_MENOR_CAPACIDAD", PENALTY_DATA_DEFICIT)

    precio = as_float(oferta.get("precio_mensual"))
    facturacion = as_float(cliente.get("monto_facturado_prom"))
    if nivel_riesgo(cliente) == "alto" and precio > facturacion > 0:
        add("PENALIZA_PRECIO_CON_RIESGO_ALTO", PENALTY_HIGH_RISK_PRICE)

    # Inyección de Valor Esperado Pseudo-normalizado
    # En lugar de rankear por probabilidad pura, rankeamos por EV = P * Precio
    # Se normaliza dividiendo entre un techo de catálogo (S/ 200.0) para mantener el dominio [0, 1]
    MAX_PRECIO_REF = 200.0
    ev_score = probabilidad * (precio / MAX_PRECIO_REF)

    # Las penalizaciones operativas se aplican sobre el score de valor esperado
    score = max(0.0, min(1.0, ev_score + sum(item["value"] for item in adjustments)))
    return score, adjustments


def motivo_rechazo_probable(
    cliente: dict[str, Any],
    oferta: dict[str, Any],
    warnings: list[str],
) -> dict[str, str]:
    """Genera una hipótesis explicable, no una predicción causal."""
    precio = as_float(oferta.get("precio_mensual"))
    facturacion = as_float(cliente.get("monto_facturado_prom"))
    reclamos = as_float(cliente.get("n_reclamos"))

    if facturacion > 0 and precio > facturacion * 1.15:
        motive = "precio"
        reason = "El precio supera en más de 15% su facturación promedio."
    elif reclamos >= 3:
        motive = "no_confia"
        reason = "El historial registra varios reclamos; requiere atención cuidadosa."
    elif "MENOR_CAPACIDAD_DATOS" in warnings:
        motive = "no_necesita"
        reason = "La capacidad ofrecida no mejora claramente su situación actual."
    else:
        motive = "otro"
        reason = "No existe señal suficiente para anticipar una objeción específica."

    return {"motivo": motive, "explicacion": reason, "confianza": "heuristica"}


def estrategia_rebate(motivo: str) -> dict[str, str]:
    strategies = {
        "precio": {
            "accion": "ofrecer_alternativa",
            "criterio": "menor_precio",
        },
        "no_necesita": {
            "accion": "ofrecer_alternativa",
            "criterio": "otra_categoria",
        },
        "ya_tiene_similar": {
            "accion": "ofrecer_alternativa",
            "criterio": "producto_complementario",
        },
        "mal_momento": {
            "accion": "programar_seguimiento",
            "criterio": "no_insistir",
        },
        "no_confia": {
            "accion": "derivar_canal_asistido",
            "criterio": "resolver_dudas_antes_de_ofrecer",
        },
        "otro": {
            "accion": "ofrecer_alternativa",
            "criterio": "siguiente_mejor_score",
        },
    }
    return strategies.get(normalized(motivo), strategies["otro"]).copy()
