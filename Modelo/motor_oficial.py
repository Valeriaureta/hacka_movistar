"""Motor híbrido y auditable de Next Best Offer para Movistar.

El módulo es independiente del backend. Recibe cliente y catálogo ya cargados,
aplica reglas, invoca el contrato inmutable ``calcular_score`` y devuelve un
Top-3 listo para que otra capa agregue speech, UI y persistencia del funnel.
"""

from __future__ import annotations

import math
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable
from uuid import uuid4

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from inferencia_modelo import COLUMNAS_MODELO, calcular_score  # noqa: E402
from Motor.motor_reglas_negocio import (  # noqa: E402
    MT_AMBIGUITY_TOLERANCE,
    MT_SCORE_TIE_TOLERANCE,
    RULES_VERSION,
    ajustar_score_ranking,
    as_bool,
    as_float,
    decidir_accion_comercial,
    es_oferta_mt,
    estrategia_rebate,
    evaluar_reglas,
    motivo_rechazo_probable,
    normalized,
)


DEFAULT_MODEL_PATH = ROOT / "Modelo" / "modelo_propension_v2_candidato.joblib"
MODEL_VERSION = "v2_generalizable_31"
ID_COLUMNS = {"oferta_id", "oferta_hogar_id", "plan_actual_id"}
MT_QUESTION = "¿Qué prefieres priorizar: pagar menos, tener más gigas o contar con datos ilimitados?"


def _native(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (np.bool_, bool)):
        return bool(value)
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating, float)):
        return None if math.isnan(float(value)) or math.isinf(float(value)) else float(value)
    return value


def _records(ofertas: Iterable[dict[str, Any]] | pd.DataFrame) -> list[dict[str, Any]]:
    if isinstance(ofertas, pd.DataFrame):
        return ofertas.to_dict(orient="records")
    return [dict(oferta) for oferta in ofertas]


def _category(column: str, value: Any) -> Any:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    if column in ID_COLUMNS:
        return value
    if isinstance(value, str):
        return value.strip().lower()
    return value


def _find_current_offer(
    cliente: dict[str, Any], ofertas: list[dict[str, Any]]
) -> dict[str, Any] | None:
    current_id = normalized(cliente.get("plan_actual_id"))
    if not current_id:
        return None
    return next(
        (oferta for oferta in ofertas if normalized(oferta.get("oferta_id")) == current_id),
        None,
    )


def construir_entrada_modelo(
    cliente: dict[str, Any], oferta: dict[str, Any], canal: str
) -> dict[str, Any]:
    """Construye exactamente las 33 columnas requeridas por inferencia."""
    tiene_hogar = as_bool(cliente.get("tiene_hogar"))
    tiene_movil = as_bool(cliente.get("tiene_movil"))
    actividad = as_float(cliente.get("n_actividad_canal"))
    gb = as_float(oferta.get("gb_incluidos"), default=float("nan"))

    entrada = {
        "antiguedad_meses": cliente.get("antiguedad_meses"),
        "monto_facturado_prom": cliente.get("monto_facturado_prom"),
        "consumo_datos_gb_prom": cliente.get("consumo_datos_gb_prom"),
        "consumo_voz_min_prom": cliente.get("consumo_voz_min_prom"),
        "consumo_sms_prom": cliente.get("consumo_sms_prom"),
        "uso_app_movistar_prom": cliente.get("uso_app_movistar_prom"),
        "monto_facturado_prom_6m": cliente.get("monto_facturado_prom_6m"),
        "dias_mora_prom": cliente.get("dias_mora_prom"),
        "precio_mensual": oferta.get("precio_mensual"),
        "ahorro_pct": oferta.get("ahorro_pct"),
        "gb_incluidos_modelo": np.nan if gb == 9999 else gb,
        "tipo_cliente": cliente.get("tipo_cliente") or ("sin_movil" if not tiene_movil else None),
        "tiene_movil": cliente.get("tiene_movil"),
        "tiene_hogar": cliente.get("tiene_hogar"),
        "oferta_hogar_id": cliente.get("oferta_hogar_id") or (
            "sin_servicio_hogar" if not tiene_hogar else None
        ),
        "tiene_internet_hogar": cliente.get("tiene_internet_hogar"),
        "es_movistar_total": cliente.get("es_movistar_total"),
        "elegible_mt": cliente.get("elegible_mt"),
        "plan_actual_id": cliente.get("plan_actual_id"),
        "edad_rango": cliente.get("edad_rango"),
        "ubicacion_departamento": cliente.get("ubicacion_departamento"),
        "es_usuario_app": cliente.get("es_usuario_app"),
        "meses_moroso": cliente.get("meses_moroso"),
        "n_reclamos": cliente.get("n_reclamos"),
        "n_actividad_canal": cliente.get("n_actividad_canal"),
        "canal_mas_usado": cliente.get("canal_mas_usado") or (
            "sin_actividad" if actividad == 0 else None
        ),
        "oferta_id": oferta.get("oferta_id"),
        "canal": canal,
        "tipo_oferta": oferta.get("tipo_oferta"),
        "oferta_es_mt": es_oferta_mt(oferta),
        "segmento_objetivo": oferta.get("segmento_objetivo"),
        "cluster_hogar": oferta.get("cluster_hogar"),
        "oferta_ilimitada": gb == 9999,
    }
    return {column: _category(column, entrada[column]) for column in COLUMNAS_MODELO}


def preparar_candidatos(
    cliente: dict[str, Any],
    ofertas: Iterable[dict[str, Any]] | pd.DataFrame,
    canal: str | None = None,
    contexto: dict[str, Any] | None = None,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, Any] | None]:
    catalogo = _records(ofertas)
    contexto = contexto or {}
    canal_efectivo = canal or str(cliente.get("canal_mas_usado") or "digital")
    oferta_actual = _find_current_offer(cliente, catalogo)
    ofertas_bloqueadas = {
        normalized(value)
        for value in (contexto.get("ofertas_rechazadas_bloqueadas") or [])
    }
    candidatos: list[dict[str, Any]] = []
    exclusiones: list[dict[str, Any]] = []

    for oferta in catalogo:
        evaluation = evaluar_reglas(cliente, oferta, contexto, oferta_actual)
        if normalized(oferta.get("oferta_id")) in ofertas_bloqueadas:
            evaluation.exclude("OFERTA_EN_ESPERA_TRAS_RECHAZO")
        if not evaluation.allowed:
            exclusiones.append(
                {
                    "oferta_id": oferta.get("oferta_id"),
                    "nombre_oferta": oferta.get("nombre_oferta"),
                    "codes": evaluation.exclusions,
                }
            )
            continue
        candidatos.append(
            {
                "cliente_id": cliente.get("cliente_id"),
                "canal": canal_efectivo,
                "oferta": oferta,
                "warnings": evaluation.warnings,
                "entrada_modelo": construir_entrada_modelo(cliente, oferta, canal_efectivo),
            }
        )
    return candidatos, exclusiones, oferta_actual


def puntuar_candidatos(
    candidatos: list[dict[str, Any]],
    cliente_por_id: dict[str, dict[str, Any]],
    ruta_modelo: str | Path = DEFAULT_MODEL_PATH,
) -> list[dict[str, Any]]:
    """Puntúa uno o varios clientes en una sola llamada vectorizada al modelo."""
    if not candidatos:
        return []
    entradas = pd.DataFrame([candidate["entrada_modelo"] for candidate in candidatos])
    scored = calcular_score(entradas, ruta_modelo=ruta_modelo)
    results: list[dict[str, Any]] = []

    for candidate, probability in zip(candidatos, scored["score_aceptacion"], strict=True):
        cliente = cliente_por_id[str(candidate["cliente_id"])]
        score_ranking, adjustments = ajustar_score_ranking(
            float(probability),
            cliente,
            candidate["oferta"],
            candidate["warnings"],
        )
        enriched = dict(candidate)
        enriched["probabilidad_aceptacion"] = float(probability)
        enriched["score_ranking"] = score_ranking
        enriched["ajustes"] = adjustments
        enriched["motivo_rechazo_probable"] = motivo_rechazo_probable(
            cliente, candidate["oferta"], candidate["warnings"]
        )
        results.append(enriched)
    return results


def _preferencia_mt_normalizada(value: Any) -> str | None:
    aliases = {
        "pagar_menos": "pagar_menos",
        "precio": "pagar_menos",
        "mas_gigas": "mas_gigas",
        "más_gigas": "mas_gigas",
        "capacidad": "mas_gigas",
        "datos_ilimitados": "datos_ilimitados",
        "ilimitado": "datos_ilimitados",
    }
    key = normalized(value).replace(" ", "_")
    return aliases.get(key)


def _oferta_mt_por_preferencia(
    candidatos_mt: list[dict[str, Any]], preferencia: str | None
) -> dict[str, Any] | None:
    if not candidatos_mt or not preferencia:
        return None
    if preferencia == "pagar_menos":
        return min(
            candidatos_mt,
            key=lambda item: as_float(item["oferta"].get("precio_mensual"), float("inf")),
        )
    if preferencia == "datos_ilimitados":
        ilimitadas = [
            item for item in candidatos_mt if as_float(item["oferta"].get("gb_incluidos")) >= 9999
        ]
        return max(ilimitadas, key=lambda item: item["score_ranking"], default=None)
    if preferencia == "mas_gigas":
        capacidad_finita = [
            item for item in candidatos_mt if as_float(item["oferta"].get("gb_incluidos")) < 9999
        ]
        return max(
            capacidad_finita,
            key=lambda item: as_float(item["oferta"].get("gb_incluidos")),
            default=None,
        )
    return None


def detectar_ambiguedad_mt(
    cliente: dict[str, Any],
    candidatos: list[dict[str, Any]],
    preferencia: Any = None,
) -> dict[str, Any]:
    """Detecta cuando el modelo no separa las variantes MT con utilidad práctica."""
    respuesta_base = {
        "aplica": False,
        "requiere_pregunta": False,
        "pregunta": None,
        "preferencia": None,
        "oferta_seleccionada_id": None,
        "umbral_ambiguedad": MT_AMBIGUITY_TOLERANCE,
        "rango_scores_mt": None,
        "opciones": [],
    }
    if not as_bool(cliente.get("elegible_mt")) or as_bool(cliente.get("es_movistar_total")):
        return respuesta_base

    candidatos_mt = [item for item in candidatos if es_oferta_mt(item["oferta"])]
    if len(candidatos_mt) < 2 or not candidatos:
        return respuesta_base

    probabilities = [item["probabilidad_aceptacion"] for item in candidatos_mt]
    score_range = max(probabilities) - min(probabilities)
    best_global = max(item["score_ranking"] for item in candidatos)
    best_mt = max(item["score_ranking"] for item in candidatos_mt)
    mt_is_competitive = best_global - best_mt <= MT_SCORE_TIE_TOLERANCE
    applies = score_range <= MT_AMBIGUITY_TOLERANCE and mt_is_competitive
    if not applies:
        return {**respuesta_base, "rango_scores_mt": round(score_range, 6)}

    preference_key = _preferencia_mt_normalizada(preferencia)
    chosen = _oferta_mt_por_preferencia(candidatos_mt, preference_key)
    options = []
    for item in sorted(
        candidatos_mt,
        key=lambda candidate: as_float(candidate["oferta"].get("precio_mensual")),
    ):
        offer = item["oferta"]
        gb = as_float(offer.get("gb_incluidos"))
        if gb >= 9999:
            criterion = "datos_ilimitados"
        elif as_float(offer.get("precio_mensual")) == min(
            as_float(candidate["oferta"].get("precio_mensual")) for candidate in candidatos_mt
        ):
            criterion = "pagar_menos"
        else:
            criterion = "mas_gigas"
        options.append(
            {
                "preferencia": criterion,
                "oferta_id": _native(offer.get("oferta_id")),
                "nombre_oferta": _native(offer.get("nombre_oferta")),
                "precio_mensual": _native(offer.get("precio_mensual")),
                "gb_incluidos": "ilimitados" if gb >= 9999 else _native(offer.get("gb_incluidos")),
            }
        )

    return {
        "aplica": True,
        "requiere_pregunta": chosen is None,
        "pregunta": MT_QUESTION if chosen is None else None,
        "preferencia": preference_key,
        "oferta_seleccionada_id": (
            _native(chosen["oferta"].get("oferta_id")) if chosen is not None else None
        ),
        "umbral_ambiguedad": MT_AMBIGUITY_TOLERANCE,
        "rango_scores_mt": round(score_range, 6),
        "opciones": options,
    }


def _ordenar_con_prioridad_mt(
    cliente: dict[str, Any],
    candidatos: list[dict[str, Any]],
    ambiguedad_mt: dict[str, Any],
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    ordered = sorted(candidatos, key=lambda item: item["score_ranking"], reverse=True)
    audit = {
        "aplicado": False,
        "umbral": MT_SCORE_TIE_TOLERANCE,
        "oferta_mt_promovida": None,
        "diferencia_score": None,
        "motivo": None,
    }
    if not ordered or not as_bool(cliente.get("elegible_mt")):
        return ordered, audit

    candidatos_mt = [item for item in ordered if es_oferta_mt(item["oferta"])]
    if not candidatos_mt:
        return ordered, audit

    selected_id = normalized(ambiguedad_mt.get("oferta_seleccionada_id"))
    preferred = next(
        (
            item
            for item in candidatos_mt
            if normalized(item["oferta"].get("oferta_id")) == selected_id
        ),
        None,
    )
    best_mt = preferred or max(candidatos_mt, key=lambda item: item["score_ranking"])
    best_global = ordered[0]
    gap = best_global["score_ranking"] - best_mt["score_ranking"]

    should_promote = preferred is not None or (
        not es_oferta_mt(best_global["oferta"]) and gap <= MT_SCORE_TIE_TOLERANCE
    )
    if should_promote and best_mt is not best_global:
        ordered.remove(best_mt)
        ordered.insert(0, best_mt)
        audit = {
            "aplicado": True,
            "umbral": MT_SCORE_TIE_TOLERANCE,
            "oferta_mt_promovida": _native(best_mt["oferta"].get("oferta_id")),
            "diferencia_score": round(gap, 6),
            "motivo": (
                "PREFERENCIA_CLIENTE" if preferred is not None else "DESEMPATE_ESTRATEGICO_MT"
            ),
        }
    return ordered, audit


def _select_top3(
    cliente: dict[str, Any],
    candidatos: list[dict[str, Any]],
    ambiguedad_mt: dict[str, Any],
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    remaining, tie_audit = _ordenar_con_prioridad_mt(cliente, candidatos, ambiguedad_mt)
    if not remaining:
        return [], tie_audit

    selected = [remaining.pop(0)]
    primary_price = as_float(selected[0]["oferta"].get("precio_mensual"), float("inf"))

    cheaper = [
        candidate
        for candidate in remaining
        if as_float(candidate["oferta"].get("precio_mensual"), float("inf")) < primary_price
    ]
    if cheaper:
        rebate = max(cheaper, key=lambda item: item["score_ranking"])
        selected.append(rebate)
        remaining.remove(rebate)
    elif remaining:
        selected.append(remaining.pop(0))

    if remaining:
        if not as_bool(cliente.get("elegible_mt")):
            selected_types = {normalized(item["oferta"].get("tipo_oferta")) for item in selected}
            alternatives = [
                item
                for item in remaining
                if normalized(item["oferta"].get("tipo_oferta")) not in selected_types
            ]
            selected.append((alternatives or remaining)[0])
        else:
            selected.append(remaining[0])

    return selected[:3], tie_audit


def finalizar_recomendacion(
    cliente: dict[str, Any],
    candidatos_puntuados: list[dict[str, Any]],
    exclusiones: list[dict[str, Any]],
    canal: str,
    contexto: dict[str, Any] | None = None,
) -> dict[str, Any]:
    contexto = contexto or {}
    decision = decidir_accion_comercial(canal, contexto)
    ambiguedad_mt = detectar_ambiguedad_mt(
        cliente,
        candidatos_puntuados,
        preferencia=contexto.get("preferencia_mt"),
    )
    selected, tie_audit = _select_top3(cliente, candidatos_puntuados, ambiguedad_mt)
    roles = ["oferta_principal", "rebate_precio", "rebate_alternativo"]
    top3: list[dict[str, Any]] = []

    for rank, (candidate, role) in enumerate(zip(selected, roles, strict=False), start=1):
        oferta = candidate["oferta"]
        top3.append(
            {
                "ranking": rank,
                "rol": role,
                "oferta_id": _native(oferta.get("oferta_id")),
                "nombre_oferta": _native(oferta.get("nombre_oferta")),
                "tipo_oferta": _native(oferta.get("tipo_oferta")),
                "oferta_es_mt": es_oferta_mt(oferta),
                "precio_mensual": _native(oferta.get("precio_mensual")),
                "ahorro_pct": _native(oferta.get("ahorro_pct")),
                "gb_incluidos": _native(oferta.get("gb_incluidos")),
                "probabilidad_aceptacion": round(candidate["probabilidad_aceptacion"], 6),
                "score_ranking": round(candidate["score_ranking"], 6),
                "ajustes": candidate["ajustes"],
                "advertencias": candidate["warnings"],
                "motivo_rechazo_probable": candidate["motivo_rechazo_probable"],
            }
        )

    if not decision["permite_recomendar"]:
        status = decision["accion"].lower()
        top3 = []
    elif ambiguedad_mt["requiere_pregunta"]:
        status = "requiere_preferencia_mt"
    else:
        status = "ok" if top3 else "sin_ofertas_elegibles"

    return {
        "recommendation_id": str(uuid4()),
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "model_version": MODEL_VERSION,
        "rules_version": RULES_VERSION,
        "cliente_id": _native(cliente.get("cliente_id")),
        "cliente_elegible_mt": as_bool(cliente.get("elegible_mt")),
        "cliente_ya_tiene_mt": as_bool(cliente.get("es_movistar_total")),
        "canal": canal,
        "status": status,
        "decision_comercial": decision,
        "pregunta_inteligente": ambiguedad_mt,
        "top_3": top3,
        "audit": {
            "ofertas_evaluadas": len(candidatos_puntuados),
            "ofertas_excluidas": len(exclusiones),
            "exclusiones": exclusiones,
            "desempate_mt": tie_audit,
            "fuentes_operativas_no_inferidas": [
                "oposicion_comercial",
                "bloqueo_presion_activo",
                "reclamo_activo",
                "averia_activa",
                "incidencia_en_interaccion",
            ],
        },
    }


def recomendar_top3(
    cliente: dict[str, Any],
    ofertas: Iterable[dict[str, Any]] | pd.DataFrame,
    canal: str | None = None,
    contexto: dict[str, Any] | None = None,
    ruta_modelo: str | Path = DEFAULT_MODEL_PATH,
) -> dict[str, Any]:
    canal_efectivo = canal or str(cliente.get("canal_mas_usado") or "digital")
    contexto = contexto or {}
    decision = decidir_accion_comercial(canal_efectivo, contexto)
    if not decision["permite_recomendar"]:
        return finalizar_recomendacion(
            cliente,
            [],
            [],
            canal_efectivo,
            contexto=contexto,
        )
    candidatos, exclusiones, _ = preparar_candidatos(
        cliente, ofertas, canal=canal_efectivo, contexto=contexto
    )
    cliente_id = str(cliente.get("cliente_id"))
    scored = puntuar_candidatos(candidatos, {cliente_id: cliente}, ruta_modelo)
    return finalizar_recomendacion(
        cliente,
        scored,
        exclusiones,
        canal_efectivo,
        contexto=contexto,
    )


def evaluar_oferta(
    cliente: dict[str, Any],
    oferta: dict[str, Any],
    canal: str | None = None,
    contexto: dict[str, Any] | None = None,
    ruta_modelo: str | Path = DEFAULT_MODEL_PATH,
) -> dict[str, Any]:
    canal_efectivo = canal or str(cliente.get("canal_mas_usado") or "digital")
    contexto = contexto or {}
    decision = decidir_accion_comercial(canal_efectivo, contexto)
    if not decision["permite_recomendar"]:
        return {
            "cliente_id": cliente.get("cliente_id"),
            "oferta_id": oferta.get("oferta_id"),
            "canal": canal_efectivo,
            "elegible": False,
            "decision_comercial": decision,
            "exclusiones": [],
            "model_version": MODEL_VERSION,
            "rules_version": RULES_VERSION,
        }
    candidatos, exclusiones, _ = preparar_candidatos(
        cliente, [oferta], canal=canal_efectivo, contexto=contexto
    )
    if not candidatos:
        return {
            "cliente_id": cliente.get("cliente_id"),
            "oferta_id": oferta.get("oferta_id"),
            "canal": canal_efectivo,
            "elegible": False,
            "exclusiones": exclusiones,
            "model_version": MODEL_VERSION,
            "rules_version": RULES_VERSION,
        }
    cliente_id = str(cliente.get("cliente_id"))
    candidate = puntuar_candidatos(candidatos, {cliente_id: cliente}, ruta_modelo)[0]
    return {
        "cliente_id": cliente.get("cliente_id"),
        "oferta_id": oferta.get("oferta_id"),
        "canal": canal_efectivo,
        "elegible": True,
        "decision_comercial": decision,
        "probabilidad_aceptacion": round(candidate["probabilidad_aceptacion"], 6),
        "score_ranking": round(candidate["score_ranking"], 6),
        "ajustes": candidate["ajustes"],
        "advertencias": candidate["warnings"],
        "motivo_rechazo_probable": candidate["motivo_rechazo_probable"],
        "model_version": MODEL_VERSION,
        "rules_version": RULES_VERSION,
    }


def recomendar_rebate(
    cliente: dict[str, Any],
    ofertas: Iterable[dict[str, Any]] | pd.DataFrame,
    oferta_rechazada_id: str,
    motivo_rechazo: str,
    canal: str | None = None,
    contexto: dict[str, Any] | None = None,
    ruta_modelo: str | Path = DEFAULT_MODEL_PATH,
) -> dict[str, Any]:
    canal_efectivo = canal or str(cliente.get("canal_mas_usado") or "digital")
    contexto = contexto or {}
    decision = decidir_accion_comercial(canal_efectivo, contexto)
    if not decision["permite_recomendar"]:
        return {
            "accion": decision["accion"].lower(),
            "criterio": "bloqueo_comercial",
            "oferta": None,
            "decision_comercial": decision,
        }
    strategy = estrategia_rebate(motivo_rechazo)
    if strategy["accion"] != "ofrecer_alternativa":
        return {"accion": strategy["accion"], "criterio": strategy["criterio"], "oferta": None}

    catalogo = _records(ofertas)
    rejected = next(
        (item for item in catalogo if normalized(item.get("oferta_id")) == normalized(oferta_rechazada_id)),
        None,
    )
    candidatos, _, _ = preparar_candidatos(
        cliente, catalogo, canal_efectivo, contexto
    )
    candidatos = [
        item
        for item in candidatos
        if normalized(item["oferta"].get("oferta_id")) != normalized(oferta_rechazada_id)
    ]
    cliente_id = str(cliente.get("cliente_id"))
    scored = puntuar_candidatos(candidatos, {cliente_id: cliente}, ruta_modelo)

    if rejected and strategy["criterio"] == "menor_precio":
        rejected_price = as_float(rejected.get("precio_mensual"), float("inf"))
        scored = [item for item in scored if as_float(item["oferta"].get("precio_mensual")) < rejected_price]
    elif rejected and strategy["criterio"] in {"otra_categoria", "producto_complementario"}:
        rejected_type = normalized(rejected.get("tipo_oferta"))
        scored = [item for item in scored if normalized(item["oferta"].get("tipo_oferta")) != rejected_type]

    if not scored:
        return {"accion": "sin_alternativa_compatible", "criterio": strategy["criterio"], "oferta": None}

    chosen = max(scored, key=lambda item: item["score_ranking"])
    return {
        "accion": strategy["accion"],
        "criterio": strategy["criterio"],
        "oferta": {
            "oferta_id": chosen["oferta"].get("oferta_id"),
            "nombre_oferta": chosen["oferta"].get("nombre_oferta"),
            "tipo_oferta": chosen["oferta"].get("tipo_oferta"),
            "precio_mensual": _native(chosen["oferta"].get("precio_mensual")),
            "probabilidad_aceptacion": round(chosen["probabilidad_aceptacion"], 6),
            "score_ranking": round(chosen["score_ranking"], 6),
        },
    }
