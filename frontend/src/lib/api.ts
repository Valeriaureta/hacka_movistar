import {
  ClientesPaginatedResponse,
  ClienteNBOResponse,
  Oferta,
  ScoringAdHocResponse,
  AnalyticsKPIs,
} from './types';

const API_BASE = '';

export async function getClientes(params: {
  page?: number;
  limit?: number;
  search?: string;
  elegible_mt?: boolean;
  departamento?: string;
  riesgo?: string;
  canal?: string;
} = {}): Promise<ClientesPaginatedResponse> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.search) query.append('search', params.search);
  if (params.elegible_mt !== undefined) query.append('elegible_mt', String(params.elegible_mt));
  if (params.departamento) query.append('departamento', params.departamento);
  if (params.riesgo) query.append('riesgo', params.riesgo);
  if (params.canal) query.append('canal', params.canal);

  const res = await fetch(`${API_BASE}/api/clientes?${query.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Error al cargar lista de clientes');
  return res.json();
}

export async function getClienteNBO(clienteId: string): Promise<ClienteNBOResponse> {
  const res = await fetch(`${API_BASE}/api/clientes/${encodeURIComponent(clienteId)}/nbo`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`No se pudo obtener recomendación para ${clienteId}`);
  return res.json();
}

export async function getOfertas(tipoOferta?: string): Promise<Oferta[]> {
  const url = tipoOferta
    ? `${API_BASE}/api/ofertas?tipo_oferta=${encodeURIComponent(tipoOferta)}`
    : `${API_BASE}/api/ofertas`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar catálogo de ofertas');
  return res.json();
}

export async function simularScoring(
  clienteId: string,
  ofertaId: string,
  canal?: string
): Promise<ScoringAdHocResponse> {
  const res = await fetch(`${API_BASE}/api/scoring`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cliente_id: clienteId,
      oferta_id: ofertaId,
      canal,
    }),
  });
  if (!res.ok) throw new Error('Error al calcular scoring ad-hoc');
  return res.json();
}

export async function getAnalytics(): Promise<AnalyticsKPIs> {
  const res = await fetch(`${API_BASE}/api/analytics`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar métricas directivas');
  return res.json();
}
