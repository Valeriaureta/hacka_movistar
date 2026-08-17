import math
from typing import Any, Dict, List, Optional
import duckdb
import pandas as pd
from app.backend.config import CLIENTES_CSV, OFERTAS_CSV, SCORING_TOP3_CSV

# Inicializar conexión en memoria para consultas analíticas ultra-rápidas
_con = duckdb.connect(database=":memory:")

def init_db():
    """Inicializa vistas y tablas en DuckDB para latencia <5ms."""
    # Tabla clientes
    _con.cursor().execute(f"""
        CREATE OR REPLACE TABLE clientes AS 
        SELECT * FROM read_csv_auto('{CLIENTES_CSV.as_posix()}', header=True);
    """)
    _con.cursor().execute("CREATE INDEX IF NOT EXISTS idx_cliente_id ON clientes(cliente_id);")

    # Tabla ofertas
    _con.cursor().execute(f"""
        CREATE OR REPLACE TABLE ofertas AS 
        SELECT * FROM read_csv_auto('{OFERTAS_CSV.as_posix()}', header=True);
    """)

    # Tabla scoring precalculado top 3
    if SCORING_TOP3_CSV.exists():
        _con.cursor().execute(f"""
            CREATE OR REPLACE TABLE scoring_top3 AS 
            SELECT * FROM read_csv_auto('{SCORING_TOP3_CSV.as_posix()}', header=True);
        """)
        _con.cursor().execute("CREATE INDEX IF NOT EXISTS idx_scoring_cliente ON scoring_top3(cliente_id);")

# Cargar base de datos al importar el módulo
init_db()

def _sanitize_dict(d: Dict[str, Any]) -> Dict[str, Any]:
    """Reemplaza NaN y float infinitos por None o valores JSON compliant."""
    sanitized = {}
    for k, v in d.items():
        if pd.isna(v) or v is None:
            sanitized[k] = None
        else:
            sanitized[k] = v
    return sanitized

def _sanitize_records(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [_sanitize_dict(r) for r in records]

def get_clientes_paginated(
    page: int = 1,
    limit: int = 15,
    search: Optional[str] = None,
    elegible_mt: Optional[bool] = None,
    departamento: Optional[str] = None,
    riesgo: Optional[str] = None
) -> Dict[str, Any]:
    """Retorna clientes paginados con filtros rápidos."""
    offset = (page - 1) * limit
    where_clauses = ["1=1"]
    params = []

    if search:
        search_pattern = f"%{search.strip().upper()}%"
        where_clauses.append("(UPPER(cliente_id) LIKE ? OR UPPER(ubicacion_departamento) LIKE ?)")
        params.extend([search_pattern, search_pattern])

    if elegible_mt is not None:
        where_clauses.append("elegible_mt = ?")
        params.append(elegible_mt)

    if departamento and departamento.strip() != "":
        where_clauses.append("LOWER(ubicacion_departamento) = LOWER(?)")
        params.append(departamento.strip())

    if riesgo:
        if riesgo.lower() == "alto":
            where_clauses.append("(meses_moroso >= 2 OR dias_mora_prom > 15)")
        elif riesgo.lower() == "medio":
            where_clauses.append("(meses_moroso = 1 OR (dias_mora_prom > 5 AND dias_mora_prom <= 15))")
        elif riesgo.lower() == "bajo":
            where_clauses.append("(meses_moroso = 0 AND dias_mora_prom <= 5)")

    where_str = " AND ".join(where_clauses)

    # Conteo total
    count_query = f"SELECT COUNT(*) FROM clientes WHERE {where_str}"
    total_count = _con.cursor().execute(count_query, params).fetchone()[0]

    # Datos
    query = f"""
        SELECT 
            cliente_id, tipo_cliente, antiguedad_meses, tiene_movil, tiene_hogar,
            tiene_internet_hogar, es_movistar_total, elegible_mt, plan_actual_id,
            monto_facturado_prom, edad_rango, ubicacion_departamento, es_usuario_app,
            consumo_datos_gb_prom, dias_mora_prom, meses_moroso, n_reclamos,
            canal_mas_usado
        FROM clientes 
        WHERE {where_str}
        ORDER BY cliente_id ASC
        LIMIT {limit} OFFSET {offset}
    """
    df = _con.cursor().execute(query, params).fetchdf()
    records = _sanitize_records(df.to_dict(orient="records"))

    return {
        "items": records,
        "total": total_count,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total_count / limit) if total_count > 0 else 1
    }

def get_cliente_by_id(cliente_id: str) -> Optional[Dict[str, Any]]:
    """Obtiene el perfil 360 de un cliente específico."""
    query = "SELECT * FROM clientes WHERE UPPER(cliente_id) = UPPER(?)"
    df = _con.cursor().execute(query, [cliente_id.strip()]).fetchdf()
    if df.empty:
        return None
    records = _sanitize_records(df.to_dict(orient="records"))
    return records[0]

def get_ofertas_catalog(tipo_oferta: Optional[str] = None) -> List[Dict[str, Any]]:
    """Obtiene el catálogo completo de ofertas."""
    query = "SELECT * FROM ofertas"
    params = []
    if tipo_oferta:
        query += " WHERE tipo_oferta = ?"
        params.append(tipo_oferta)
    query += " ORDER BY precio_mensual ASC"
    df = _con.cursor().execute(query, params).fetchdf()
    return _sanitize_records(df.to_dict(orient="records"))

def get_oferta_by_id(oferta_id: str) -> Optional[Dict[str, Any]]:
    """Obtiene información de una oferta específica."""
    query = "SELECT * FROM ofertas WHERE UPPER(oferta_id) = UPPER(?)"
    df = _con.cursor().execute(query, [oferta_id.strip()]).fetchdf()
    if df.empty:
        return None
    records = _sanitize_records(df.to_dict(orient="records"))
    return records[0]

def get_top3_scoring(cliente_id: str) -> List[Dict[str, Any]]:
    """Obtiene el ranking Top-3 precalculado para un cliente."""
    query = """
        SELECT 
            s.cliente_id, s.oferta_id, s.nombre_oferta, s.oferta_es_mt,
            s.elegible_mt, s.cliente_ya_tiene_mt, s.canal_contexto,
            s.score_aceptacion, s.ranking_predictivo,
            o.tipo_oferta, o.precio_mensual, o.ahorro_pct, o.gb_incluidos,
            o.descripcion_corta
        FROM scoring_top3 s
        LEFT JOIN ofertas o ON UPPER(s.oferta_id) = UPPER(o.oferta_id)
        WHERE UPPER(s.cliente_id) = UPPER(?)
        ORDER BY s.ranking_predictivo ASC
    """
    df = _con.cursor().execute(query, [cliente_id.strip()]).fetchdf()
    if df.empty:
        return []
    return _sanitize_records(df.to_dict(orient="records"))

def get_analytics_kpis() -> Dict[str, Any]:
    """Genera KPIs y métricas de negocio para el dashboard directivo."""
    client_kpis = _con.cursor().execute("""
        SELECT 
            COUNT(*) as total_clientes,
            SUM(CASE WHEN elegible_mt THEN 1 ELSE 0 END) as elegibles_mt,
            SUM(CASE WHEN es_movistar_total THEN 1 ELSE 0 END) as ya_tienen_mt,
            AVG(monto_facturado_prom) as arpu_promedio,
            AVG(consumo_datos_gb_prom) as consumo_gb_promedio,
            SUM(CASE WHEN meses_moroso >= 2 THEN 1 ELSE 0 END) as clientes_riesgo_mora,
            SUM(CASE WHEN es_usuario_app THEN 1 ELSE 0 END) as usuarios_app
        FROM clientes
    """).fetchdf().to_dict(orient="records")[0]

    canales = _con.cursor().execute("""
        SELECT 
            COALESCE(canal_mas_usado, 'No Determinado') as canal,
            COUNT(*) as cantidad,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM clientes), 1) as porcentaje
        FROM clientes
        GROUP BY canal_mas_usado
        ORDER BY cantidad DESC
    """).fetchdf().to_dict(orient="records")

    departamentos = _con.cursor().execute("""
        SELECT 
            ubicacion_departamento as departamento,
            COUNT(*) as cantidad,
            SUM(CASE WHEN elegible_mt THEN 1 ELSE 0 END) as elegibles_mt,
            ROUND(AVG(monto_facturado_prom), 1) as arpu
        FROM clientes
        WHERE ubicacion_departamento IS NOT NULL
        GROUP BY ubicacion_departamento
        ORDER BY cantidad DESC
        LIMIT 7
    """).fetchdf().to_dict(orient="records")

    top_ofertas_global = _con.cursor().execute("""
        SELECT 
            nombre_oferta,
            oferta_es_mt,
            COUNT(*) as veces_top1,
            ROUND(AVG(score_aceptacion), 3) as score_promedio
        FROM scoring_top3
        WHERE ranking_predictivo = 1
        GROUP BY nombre_oferta, oferta_es_mt
        ORDER BY veces_top1 DESC
        LIMIT 5
    """).fetchdf().to_dict(orient="records")

    return {
        "kpis": _sanitize_dict(client_kpis),
        "distribucion_canales": _sanitize_records(canales),
        "departamentos_top": _sanitize_records(departamentos),
        "top_ofertas_ranking": _sanitize_records(top_ofertas_global)
    }
