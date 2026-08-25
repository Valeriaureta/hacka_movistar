"""Reglas de negocio auditables para el motor Next Best Offer.

Este módulo no carga datos, no llama al modelo y no conoce el backend. Solo
evalúa elegibilidad y calcula ajustes comerciales separados de la probabilidad
predictiva.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


RULES_VERSION = "2.0.0"
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
        return {
            "accion": "NO_CONTACTAR",
            "permite_recomendar": False,
            "motivos": ["OPOSICION_COMERCIAL_REGISTRADA"],
        }

    if as_bool(contexto.get("bloqueo_presion_activo")):
        return {
            "accion": "ESPERAR",
            "permite_recomendar": False,
            "motivos": ["PERIODO_DESCANSO_COMERCIAL_ACTIVO"],
        }

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
        return {
            "accion": "NO_OFRECER",
            "permite_recomendar": False,
            "motivos": reasons,
        }

    if normalized(canal).replace("_", " ") == "call out":
        return {
            "accion": "CONTACTAR",
            "permite_recomendar": True,
            "motivos": ["SIN_BLOQUEOS_INFORMADOS"],
        }

    return {
        "accion": "RECOMENDACION_DISPONIBLE",
        "permite_recomendar": True,
        "motivos": ["ACTIVAR_SOLO_SI_SURGE_OPORTUNIDAD_COMERCIAL"],
    }


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

    score = max(0.0, min(1.0, probabilidad + sum(item["value"] for item in adjustments)))
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
