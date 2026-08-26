import { MOCK_CLIENTES, CATALOGO_OFERTAS } from '../data/mockData';

export const api = {
  token: null,

  async autoLogin() {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'supervisor_movistar', password: 'movistar2026' })
      });
      if (res.ok) {
        const data = await res.json();
        this.token = data.access_token;
      }
    } catch (err) {
      console.warn("Backend FastAPI no disponible en puerto 8000, operando en modo Mock reactivo:", err.message);
    }
  },

  async getClientes(canal = 'Tienda', limit = 20) {
    try {
      await this.autoLogin();
      const res = await fetch(`/api/clientes?limit=${limit}&canal=${encodeURIComponent(canal)}`, {
        headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.items && data.items.length > 0) return data.items;
      }
    } catch (e) {
      console.warn("Backend API /api/clientes no disponible, usando fallback:", e.message);
    }
    return MOCK_CLIENTES;
  },

  async getClienteByDniOrId(query, canal = 'Tienda') {
    if (!query) return null;
    const clean = query.toString().trim().toLowerCase();

    // Intentar consultar al backend primero
    try {
      await this.autoLogin();
      const res = await fetch(`/api/clientes/${encodeURIComponent(query)}?canal=${encodeURIComponent(canal)}`, {
        headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Backend no disponible, proceder con fallback local
    }

    // Fallback en memoria mock
    const found = MOCK_CLIENTES.find(c => 
      c.dni.toLowerCase() === clean || 
      c.cliente_id.toLowerCase() === clean ||
      c.nombre.toLowerCase().includes(clean)
    );
    if (found) return found;

    return MOCK_CLIENTES[0];
  },

  async getOfertas() {
    try {
      const res = await fetch('/api/ofertas');
      if (res.ok) return await res.json();
    } catch (e) {}
    return CATALOGO_OFERTAS;
  },

  async registrarGestion(datosGestion) {
    try {
      await this.autoLogin();
      const res = await fetch('/api/gestion/registro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
        },
        body: JSON.stringify(datosGestion)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Error al registrar gestión en backend:", e.message);
    }
    return { status: "local", message: "Registrado en memoria temporal" };
  },

  async getDashboardMetrics() {
    try {
      await this.autoLogin();
      const res = await fetch('/api/gestion/dashboard', {
        headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Error al consultar dashboard en backend:", e.message);
    }
    return null;
  },

  async generarRebateIA(cliente, oferta, motivoRechazo, canal = 'Tienda') {
    try {
      await this.autoLogin();
      const res = await fetch('/api/ai/rebate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
        },
        body: JSON.stringify({
          cliente,
          oferta,
          motivo_rechazo: motivoRechazo,
          canal
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Error al generar rebate con IA:", e.message);
    }
    return null;
  },

  async generarPitchIA(cliente, oferta, canal = 'Tienda') {
    try {
      await this.autoLogin();
      const res = await fetch('/api/ai/pitch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
        },
        body: JSON.stringify({
          cliente,
          oferta,
          canal
        })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Error al generar pitch con IA:", e.message);
    }
    return null;
  },

  async enviarPreferenciaMT(recomendacionId, preferencia) {
    try {
      await this.autoLogin();
      const res = await fetch(`/api/recomendaciones/${recomendacionId}/preferencia-mt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
        },
        body: JSON.stringify({ preferencia })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Error enviando preferencia MT:", e.message);
    }
    return null;
  },

  async registrarEvento(eventoData) {
    try {
      await this.autoLogin();
      const res = await fetch('/api/eventos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
        },
        body: JSON.stringify(eventoData)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Error registrando evento:", e.message);
    }
    return { status: "local", message: "Evento registrado en memoria" };
  },

  async evaluarNBO(clienteId, canal = 'Tienda', motivos = [], contexto = {}) {
    try {
      await this.autoLogin();
      const res = await fetch('/api/recomendaciones/evaluar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
        },
        body: JSON.stringify({
          cliente_id: clienteId,
          canal: canal,
          motivos: motivos,
          contexto: contexto
        })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Error al evaluar NBO en backend:", e.message);
    }
    
    // Fallback local en caso de que backend no responda
    const esIncidencia = motivos.some(m => {
      const lower = m.toLowerCase();
      return lower.includes('reclam') || lower.includes('aver') || lower.includes('falla') || lower.includes('tecnic') || lower.includes('técnic');
    });

    return {
      motor_nbo: {
        decision_comercial: {
          accion: esIncidencia ? 'NO_OFRECER' : 'CONTACTAR',
          mensaje_asesor: esIncidencia ? 'Priorizar la atención del cliente y cerrar sin ofrecimiento comercial.' : 'Cliente apto para recomendación comercial.',
          motivo_principal: esIncidencia ? 'INCIDENCIA_EN_INTERACCION' : 'OPORTUNIDAD_COMERCIAL'
        }
      }
    };
  }
};
