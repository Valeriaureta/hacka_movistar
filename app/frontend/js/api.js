// Cliente API centralizado para el frontend
export const api = {
  async getClientes(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.elegible_mt !== undefined && params.elegible_mt !== null) query.append('elegible_mt', params.elegible_mt);
    if (params.departamento) query.append('departamento', params.departamento);
    if (params.riesgo) query.append('riesgo', params.riesgo);

    const res = await fetch(`/api/clientes?${query.toString()}`);
    if (!res.ok) throw new Error('Error al cargar clientes');
    return res.json();
  },

  async getClienteById(clienteId) {
    const res = await fetch(`/api/clientes/${clienteId}`);
    if (!res.ok) throw new Error(`Cliente ${clienteId} no encontrado`);
    return res.json();
  },

  async getClienteNBO(clienteId) {
    const res = await fetch(`/api/clientes/${clienteId}/nbo`);
    if (!res.ok) throw new Error(`Error al obtener NBO para ${clienteId}`);
    return res.json();
  },

  async getOfertas(tipoOferta = null) {
    const url = tipoOferta ? `/api/ofertas?tipo_oferta=${encodeURIComponent(tipoOferta)}` : '/api/ofertas';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Error al obtener catálogo de ofertas');
    return res.json();
  },

  async simularScoring(clienteId, ofertaId, canal = null) {
    const res = await fetch('/api/scoring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente_id: clienteId, oferta_id: ofertaId, canal })
    });
    if (!res.ok) throw new Error('Error al ejecutar scoring');
    return res.json();
  },

  async getAnalytics() {
    const res = await fetch('/api/analytics');
    if (!res.ok) throw new Error('Error al cargar métricas de negocio');
    return res.json();
  }
};
