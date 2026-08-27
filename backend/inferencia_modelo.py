from pathlib import Path

import joblib


COLUMNAS_MODELO = [
    "antiguedad_meses", "monto_facturado_prom", "consumo_datos_gb_prom",
    "consumo_voz_min_prom", "consumo_sms_prom", "uso_app_movistar_prom",
    "monto_facturado_prom_6m", "dias_mora_prom", "precio_mensual",
    "ahorro_pct", "gb_incluidos_modelo", "tipo_cliente", "tiene_movil",
    "tiene_hogar", "oferta_hogar_id", "tiene_internet_hogar",
    "es_movistar_total", "elegible_mt", "plan_actual_id", "edad_rango",
    "ubicacion_departamento", "es_usuario_app", "meses_moroso",
    "n_reclamos", "n_actividad_canal", "canal_mas_usado", "oferta_id",
    "canal", "tipo_oferta", "oferta_es_mt", "segmento_objetivo",
    "cluster_hogar", "oferta_ilimitada",
]

COLUMNAS_CATEGORICAS = [
    "tipo_cliente", "tiene_movil", "tiene_hogar", "oferta_hogar_id",
    "tiene_internet_hogar", "es_movistar_total", "elegible_mt",
    "plan_actual_id", "edad_rango", "ubicacion_departamento",
    "es_usuario_app", "meses_moroso", "n_reclamos", "n_actividad_canal",
    "canal_mas_usado", "oferta_id", "canal", "tipo_oferta",
    "oferta_es_mt", "segmento_objetivo", "cluster_hogar",
    "oferta_ilimitada",
]


def calcular_score(datos, ruta_modelo=None):
    """Devuelve P(aceptacion) para filas cliente-oferta ya construidas."""
    if ruta_modelo is None:
        ruta_modelo = Path(__file__).with_name("modelo_logistico_final.joblib")

    faltantes = [columna for columna in COLUMNAS_MODELO if columna not in datos.columns]
    if faltantes:
        raise ValueError(f"Faltan columnas requeridas: {faltantes}")

    modelo = joblib.load(ruta_modelo)
    entrada = datos[COLUMNAS_MODELO].copy()

    # Usar el mismo formato categorico empleado durante el entrenamiento.
    for columna in COLUMNAS_CATEGORICAS:
        entrada[columna] = entrada[columna].astype("object")
        tiene_valor = entrada[columna].notna()
        entrada.loc[tiene_valor, columna] = entrada.loc[tiene_valor, columna].astype(str)

    salida = datos.copy()
    try:
        salida["score_aceptacion"] = modelo.predict_proba(entrada)[:, 1]
    except AttributeError:
        # Parche de compatibilidad por diferencia de versiones de scikit-learn
        clf = modelo.steps[-1][1] if hasattr(modelo, "steps") else modelo
        if not hasattr(clf, "multi_class"):
            setattr(clf, "multi_class", "auto")
        salida["score_aceptacion"] = modelo.predict_proba(entrada)[:, 1]
    return salida
