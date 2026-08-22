"""Entrenamiento reproducible del candidato V2 de propensión NBO.

Este script no modifica los CSV de ``data/raw`` ni los contratos de
``inferencia_modelo.py``. La selección de candidatos usa únicamente Train;
el Test reservado solo se evalúa cuando se pasa ``--open-test`` explícitamente.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.calibration import calibration_curve
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    f1_score,
    log_loss,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import GroupKFold, GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
OUTPUT_DIR = ROOT / "data" / "processed" / "modelo_v2"
MODEL_OUTPUT = ROOT / "Modelo" / "modelo_propension_v2_candidato.joblib"

sys.path.insert(0, str(ROOT))
from inferencia_modelo import COLUMNAS_CATEGORICAS, COLUMNAS_MODELO  # noqa: E402


VARIABLES_NUMERICAS = [
    columna for columna in COLUMNAS_MODELO if columna not in COLUMNAS_CATEGORICAS
]

IDS = {
    "cliente_id",
    "oferta_id",
    "ofrecimiento_id",
    "oferta_hogar_id",
    "plan_actual_id",
}


@dataclass(frozen=True)
class Candidate:
    name: str
    numeric_features: list[str]
    categorical_features: list[str]
    class_weight: str | None = None
    model_kind: str = "logistic"
    purpose: str = ""

    @property
    def feature_count(self) -> int:
        return len(self.numeric_features) + len(self.categorical_features)


def normalize_strings(frame: pd.DataFrame) -> pd.DataFrame:
    result = frame.copy()
    for column in result.select_dtypes(include=["object", "str"]).columns:
        if column not in IDS:
            result[column] = result[column].str.strip().str.lower()
    return result


def load_modeling_data() -> tuple[pd.DataFrame, pd.Series, pd.Series, pd.DataFrame, dict[str, Any]]:
    clients = normalize_strings(pd.read_csv(RAW_DIR / "dataset_clientes.csv"))
    offers = normalize_strings(pd.read_csv(RAW_DIR / "catalogo_ofertas_entrega.csv"))
    campaigns = normalize_strings(pd.read_csv(RAW_DIR / "historial_campanias.csv"))

    clients.loc[
        clients["oferta_hogar_id"].isna() & ~clients["tiene_hogar"],
        "oferta_hogar_id",
    ] = "sin_servicio_hogar"
    clients.loc[
        clients["tipo_cliente"].isna() & ~clients["tiene_movil"],
        "tipo_cliente",
    ] = "sin_movil"
    clients.loc[
        clients["canal_mas_usado"].isna() & (clients["n_actividad_canal"] == 0),
        "canal_mas_usado",
    ] = "sin_actividad"

    analytical = campaigns.merge(
        clients,
        on="cliente_id",
        how="left",
        suffixes=("_camp", "_cli"),
    )

    for column in ["tipo_cliente", "antiguedad_meses", "elegible_mt", "es_movistar_total"]:
        analytical[column] = analytical[f"{column}_cli"]
        analytical = analytical.drop(columns=[f"{column}_camp", f"{column}_cli"])

    offers_join = offers.rename(columns={"es_movistar_total": "oferta_catalogo_es_mt"})
    analytical = analytical.merge(
        offers_join,
        on="oferta_id",
        how="left",
        suffixes=("_camp", "_cat"),
    )

    for column in ["nombre_oferta", "tipo_oferta"]:
        analytical[column] = analytical[f"{column}_cat"]
        analytical = analytical.drop(columns=[f"{column}_camp", f"{column}_cat"])

    # El catálogo es la fuente autoritativa para identificar ofertas MT.
    analytical["oferta_es_mt"] = analytical["oferta_catalogo_es_mt"].fillna(
        analytical["oferta_es_mt"]
    )
    analytical["fecha"] = pd.to_datetime(analytical["fecha"], errors="coerce")

    contacted = analytical["contactabilidad"].eq("contactado")
    closed = analytical["resultado"].isin(["aceptada", "rechazada"])
    principal_offer = ~analytical["es_rebate"].fillna(False).astype(bool)

    modeling = analytical.loc[contacted & closed & principal_offer].copy()
    modeling["target_aceptacion"] = modeling["resultado"].eq("aceptada").astype(int)
    modeling["oferta_ilimitada"] = modeling["gb_incluidos"].eq(9999)
    modeling["gb_incluidos_modelo"] = modeling["gb_incluidos"].replace(9999, np.nan)

    x = modeling[COLUMNAS_MODELO].copy()
    y = modeling["target_aceptacion"].copy()
    groups = modeling["cliente_id"].copy()

    for column in COLUMNAS_CATEGORICAS:
        x[column] = x[column].astype("object")
        mask = x[column].notna()
        x.loc[mask, column] = x.loc[mask, column].astype(str)

    metadata = modeling[
        [
            "cliente_id",
            "fecha",
            "canal",
            "tipo_oferta",
            "oferta_id",
            "oferta_es_mt",
            "elegible_mt",
            "resultado",
        ]
    ].copy()

    audit = {
        "campaign_rows": int(len(campaigns)),
        "modeling_rows": int(len(modeling)),
        "unique_clients": int(groups.nunique()),
        "accepted": int(y.sum()),
        "rejected": int((y == 0).sum()),
        "acceptance_rate": float(y.mean()),
        "excluded_pending_or_not_contacted": int((~(contacted & closed)).sum()),
        "excluded_rebates": int((contacted & closed & ~principal_offer).sum()),
    }
    return x, y, groups, metadata, audit


def build_pipeline(candidate: Candidate) -> Pipeline:
    numeric_pipeline = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_pipeline = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="constant", fill_value="faltante")),
            (
                "one_hot",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=candidate.model_kind != "hist_gradient_boosting",
                ),
            ),
        ]
    )
    preprocessing = ColumnTransformer(
        [
            ("numeric", numeric_pipeline, candidate.numeric_features),
            ("categorical", categorical_pipeline, candidate.categorical_features),
        ]
    )
    if candidate.model_kind == "hist_gradient_boosting":
        estimator = HistGradientBoostingClassifier(
            learning_rate=0.08,
            max_iter=200,
            max_leaf_nodes=15,
            min_samples_leaf=100,
            l2_regularization=5.0,
            random_state=42,
        )
    else:
        estimator = LogisticRegression(
            max_iter=1_000,
            random_state=42,
            class_weight=candidate.class_weight,
        )

    return Pipeline(
        [
            ("preprocessing", preprocessing),
            ("model", estimator),
        ]
    )


def lift_at_fraction(y_true: pd.Series, probabilities: np.ndarray, fraction: float) -> float:
    count = max(1, int(np.ceil(len(y_true) * fraction)))
    order = np.argsort(-probabilities)
    top_rate = float(y_true.iloc[order[:count]].mean())
    baseline = float(y_true.mean())
    return top_rate / baseline if baseline else float("nan")


def calculate_metrics(y_true: pd.Series, probabilities: np.ndarray) -> dict[str, float]:
    predictions = (probabilities >= 0.5).astype(int)
    observed, predicted = calibration_curve(
        y_true,
        probabilities,
        n_bins=10,
        strategy="quantile",
    )
    return {
        "pr_auc": float(average_precision_score(y_true, probabilities)),
        "roc_auc": float(roc_auc_score(y_true, probabilities)),
        "brier": float(brier_score_loss(y_true, probabilities)),
        "log_loss": float(log_loss(y_true, probabilities)),
        "precision_05": float(precision_score(y_true, predictions, zero_division=0)),
        "recall_05": float(recall_score(y_true, predictions, zero_division=0)),
        "f1_05": float(f1_score(y_true, predictions, zero_division=0)),
        "lift_top10": float(lift_at_fraction(y_true, probabilities, 0.10)),
        "calibration_mae": float(np.mean(np.abs(observed - predicted))),
    }


def evaluate_candidate(
    candidate: Candidate,
    x_train: pd.DataFrame,
    y_train: pd.Series,
    groups_train: pd.Series,
) -> tuple[dict[str, Any], np.ndarray]:
    splitter = GroupKFold(n_splits=5)
    probabilities = np.zeros(len(x_train), dtype=float)
    fold_metrics: list[dict[str, Any]] = []

    for fold, (fit_index, validation_index) in enumerate(
        splitter.split(x_train, y_train, groups=groups_train),
        start=1,
    ):
        pipeline = build_pipeline(candidate)
        pipeline.fit(x_train.iloc[fit_index], y_train.iloc[fit_index])
        fold_probabilities = pipeline.predict_proba(x_train.iloc[validation_index])[:, 1]
        probabilities[validation_index] = fold_probabilities
        metrics = calculate_metrics(y_train.iloc[validation_index], fold_probabilities)
        metrics["fold"] = fold
        fold_metrics.append(metrics)

    aggregate = calculate_metrics(y_train, probabilities)
    aggregate.update(
        {
            "candidate": candidate.name,
            "input_features_used": candidate.feature_count,
            "class_weight": candidate.class_weight or "none",
            "model_kind": candidate.model_kind,
            "purpose": candidate.purpose,
            "pr_auc_fold_std": float(pd.DataFrame(fold_metrics)["pr_auc"].std()),
            "fold_metrics": fold_metrics,
        }
    )
    return aggregate, probabilities


def segment_metrics(
    candidate_name: str,
    y_true: pd.Series,
    probabilities: np.ndarray,
    metadata: pd.DataFrame,
) -> list[dict[str, Any]]:
    reports: list[dict[str, Any]] = []
    for segment_column in ["canal", "tipo_oferta", "oferta_es_mt"]:
        for segment_value, indexes in metadata.groupby(segment_column, dropna=False).groups.items():
            positions = metadata.index.get_indexer(indexes)
            segment_y = y_true.iloc[positions]
            if len(segment_y) < 100 or segment_y.nunique() < 2:
                continue
            metrics = calculate_metrics(segment_y, probabilities[positions])
            reports.append(
                {
                    "candidate": candidate_name,
                    "segment_type": segment_column,
                    "segment_value": str(segment_value),
                    "rows": int(len(segment_y)),
                    "acceptance_rate": float(segment_y.mean()),
                    **metrics,
                }
            )
    return reports


def choose_candidate(results: list[dict[str, Any]]) -> str:
    summary = pd.DataFrame([{key: value for key, value in row.items() if key != "fold_metrics"} for row in results])
    # El uso principal del score es ordenar ofertas. Por eso PR-AUC es el
    # criterio primario; calibración y parsimonia solo resuelven empates.
    ranked = summary.sort_values(
        ["pr_auc", "brier", "calibration_mae", "input_features_used"],
        ascending=[False, True, True, True],
    )
    return str(ranked.iloc[0]["candidate"])


def candidates() -> list[Candidate]:
    reduced_numeric = [
        column for column in VARIABLES_NUMERICAS if column != "monto_facturado_prom_6m"
    ]
    generalized_categorical = [
        column for column in COLUMNAS_CATEGORICAS if column != "oferta_id"
    ]
    return [
        Candidate(
            name="baseline_33",
            numeric_features=VARIABLES_NUMERICAS,
            categorical_features=list(COLUMNAS_CATEGORICAS),
            purpose="Referencia compatible con el contrato actual.",
        ),
        Candidate(
            name="sin_facturacion_redundante",
            numeric_features=reduced_numeric,
            categorical_features=list(COLUMNAS_CATEGORICAS),
            purpose="Retira monto_facturado_prom_6m por correlación casi perfecta.",
        ),
        Candidate(
            name="generalizable_sin_oferta_id",
            numeric_features=reduced_numeric,
            categorical_features=generalized_categorical,
            purpose="Evalúa generalización usando atributos de oferta y no su identidad.",
        ),
        Candidate(
            name="class_weight_balanced_diagnostico",
            numeric_features=VARIABLES_NUMERICAS,
            categorical_features=list(COLUMNAS_CATEGORICAS),
            class_weight="balanced",
            purpose="Diagnóstico de balance; no sustituye sesgo de exposición.",
        ),
        Candidate(
            name="hist_gradient_boosting_interacciones",
            numeric_features=reduced_numeric,
            categorical_features=generalized_categorical,
            model_kind="hist_gradient_boosting",
            purpose=(
                "Aprende interacciones no lineales cliente-oferta-canal sin usar la "
                "identidad de la oferta."
            ),
        ),
    ]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--open-test",
        action="store_true",
        help="Evalúa una sola vez el candidato elegido en el Test reservado.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    x, y, groups, metadata, audit = load_modeling_data()
    split = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
    train_index, test_index = next(split.split(x, y, groups=groups))

    x_train = x.iloc[train_index].reset_index(drop=True)
    y_train = y.iloc[train_index].reset_index(drop=True)
    groups_train = groups.iloc[train_index].reset_index(drop=True)
    metadata_train = metadata.iloc[train_index].reset_index(drop=True)

    all_results: list[dict[str, Any]] = []
    all_segments: list[dict[str, Any]] = []
    candidate_map = {candidate.name: candidate for candidate in candidates()}

    for candidate in candidate_map.values():
        result, probabilities = evaluate_candidate(candidate, x_train, y_train, groups_train)
        all_results.append(result)
        all_segments.extend(
            segment_metrics(candidate.name, y_train, probabilities, metadata_train)
        )

    selected_name = choose_candidate(all_results)
    selected_candidate = candidate_map[selected_name]
    selected_pipeline = build_pipeline(selected_candidate)
    selected_pipeline.fit(x_train, y_train)
    joblib.dump(selected_pipeline, MODEL_OUTPUT)

    summary_rows = [
        {key: value for key, value in row.items() if key != "fold_metrics"}
        for row in all_results
    ]
    pd.DataFrame(summary_rows).sort_values("pr_auc", ascending=False).to_csv(
        OUTPUT_DIR / "comparacion_candidatos.csv",
        index=False,
    )
    pd.DataFrame(all_segments).to_csv(OUTPUT_DIR / "metricas_segmentos.csv", index=False)

    report: dict[str, Any] = {
        "audit": audit,
        "methodology": {
            "target": "aceptada=1, rechazada=0 entre contactados",
            "rebates_in_primary_model": False,
            "synthetic_oversampling": False,
            "synthetic_data_decision": (
                "No se usa SMOTE: la clase positiva no es rara y el problema dominante "
                "es sesgo de exposición MT/no-MT."
            ),
            "selection": "GroupKFold de 5 folds por cliente, solo dentro de Train",
            "test_reserved_opened": bool(args.open_test),
        },
        "selected_candidate": selected_name,
        "candidate_results": all_results,
    }

    if args.open_test:
        x_test = x.iloc[test_index].reset_index(drop=True)
        y_test = y.iloc[test_index].reset_index(drop=True)
        test_probabilities = selected_pipeline.predict_proba(x_test)[:, 1]
        report["test_metrics"] = calculate_metrics(y_test, test_probabilities)

    with (OUTPUT_DIR / "reporte_entrenamiento.json").open("w", encoding="utf-8") as file:
        json.dump(report, file, ensure_ascii=False, indent=2)

    print(pd.DataFrame(summary_rows).sort_values("pr_auc", ascending=False).to_string(index=False))
    print(f"\nCandidato seleccionado: {selected_name}")
    print(f"Artefacto: {MODEL_OUTPUT}")
    if not args.open_test:
        print("Test reservado: cerrado. Use --open-test solo después de congelar la decisión.")


if __name__ == "__main__":
    main()
