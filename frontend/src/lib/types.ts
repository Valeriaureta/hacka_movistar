export interface ClienteListItem {
  cliente_id: string;
  tipo_cliente: string | null;
  antiguedad_meses: number;
  tiene_movil: boolean;
  tiene_hogar: boolean;
  tiene_internet_hogar: boolean;
  es_movistar_total: boolean;
  elegible_mt: boolean;
  plan_actual_id: string | null;
  monto_facturado_prom: number | null;
  edad_rango: string | null;
  ubicacion_departamento: string | null;
  es_usuario_app: boolean;
  consumo_datos_gb_prom: number | null;
  dias_mora_prom: number | null;
  meses_moroso: number | null;
  n_reclamos: number | null;
  canal_mas_usado: string | null;
}

export interface ClientesPaginatedResponse {
  items: ClienteListItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface Oferta {
  oferta_id: string;
  nombre_oferta: string;
  tipo_oferta: string | null;
  segmento_objetivo: string | null;
  es_movistar_total: boolean;
  precio_mensual: number;
  ahorro_pct: number;
  gb_incluidos: number;
  cluster_hogar?: string | null;
  descripcion_bundle?: string | null;
  descripcion_corta?: string | null;
}

export interface XAIExplanation {
  que_ofrecer: string;
  por_que_este_cliente: string;
  canal_sugerido: string;
  speech_comercial: string;
  rebate_si_rechaza: string;
  rank: number;
}

export interface NBOTopOferta {
  ranking: number;
  oferta_id: string;
  nombre_oferta: string;
  tipo_oferta: string | null;
  precio_mensual: number;
  ahorro_pct: number;
  gb_incluidos: number;
  oferta_es_mt: boolean;
  score_aceptacion: number;
  score_porcentaje: number;
  semaforo: 'alto' | 'medio' | 'moderado';
  color: string;
  explicabilidad: XAIExplanation;
}

export interface ClientePerfil {
  tipo_cliente: string;
  departamento: string;
  edad_rango: string;
  antiguedad_meses: number;
  arpu_actual: number;
  consumo_datos_gb: number;
  es_usuario_app: boolean;
  elegible_mt: boolean;
  es_movistar_total: boolean;
  canal_preferente: string;
  nivel_riesgo: 'Alto' | 'Medio' | 'Bajo';
  riesgo_badge: 'alerta' | 'advertencia' | 'optimo';
  dias_mora: number;
  meses_moroso: number;
  reclamos: number;
}

export interface ClienteNBOResponse {
  cliente_id: string;
  perfil: ClientePerfil;
  top_ofertas: NBOTopOferta[];
}

export interface ScoringAdHocResponse {
  cliente_id: string;
  oferta_id: string;
  canal: string;
  score_aceptacion: number;
  score_porcentaje: number;
  oferta: Oferta;
  explicabilidad: XAIExplanation;
}

export interface AnalyticsKPIs {
  kpis: {
    total_clientes: number;
    elegibles_mt: number;
    ya_tienen_mt: number;
    arpu_promedio: number;
    consumo_gb_promedio: number;
    clientes_riesgo_mora: number;
    usuarios_app: number;
  };
  distribucion_canales: Array<{
    canal: string;
    cantidad: number;
    porcentaje: number;
  }>;
  departamentos_top: Array<{
    departamento: string;
    cantidad: number;
    elegibles_mt: number;
    arpu: number;
  }>;
  top_ofertas_ranking: Array<{
    nombre_oferta: string;
    oferta_es_mt: boolean;
    veces_top1: number;
    score_promedio: number;
  }>;
}
