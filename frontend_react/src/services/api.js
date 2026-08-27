import { MOCK_CLIENTES, CATALOGO_OFERTAS } from '../data/mockData';

export const api = {
  token: null,
  mode: 'connecting',
  lastError: null,

  normalizeCliente(payload) {
    if (!payload?.cliente) return payload;
    return {
      ...payload.cliente,
      recomendacion_id: payload.recomendacion_id,
      motor_nbo: payload.motor_nbo,
      fuente_datos: payload.fuente_datos,
    };
  },

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
        this.mode = 'motor';
        this.lastError = null;
      }
    } catch (err) {
      this.mode = 'mock';
      this.lastError = err.message;
      console.warn("Backend FastAPI no disponible en puerto 8000, operando en modo Mock reactivo:", err.message);
    }
  },

  async getModelStatus() {
    try {
      const res = await fetch('/api/model/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      this.mode = data.modelo_cargado ? 'motor' : 'error';
      this.lastError = data.modelo_cargado ? null : 'El artefacto del modelo no está disponible';
      return data;
    } catch (e) {
      this.mode = 'mock';
      this.lastError = e.message;
      return null;
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
        if (data && data.items && data.items.length > 0) {
          this.mode = 'motor';
          return data.items.map(item => this.normalizeCliente(item));
        }
      }
    } catch (e) {
      this.mode = 'mock';
      this.lastError = e.message;
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
        this.mode = 'motor';
        return this.normalizeCliente(await res.json());
      }
    } catch (e) {
      this.mode = 'mock';
      this.lastError = e.message;
    }

    // Fallback en memoria mock
    const found = MOCK_CLIENTES.find(c => 
      c.dni.toLowerCase() === clean || 
      c.cliente_id.toLowerCase() === clean ||
      c.nombre.toLowerCase().includes(clean)
    );
    if (found) return found;

    return null;
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
      if (res.ok) {
        this.mode = 'motor';
        return this.normalizeCliente(await res.json());
      }
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
      if (res.ok) {
        this.mode = 'motor';
        return this.normalizeCliente(await res.json());
      }
    } catch (e) {
      console.warn("Error al evaluar NBO en backend:", e.message);
    }
    
    // Fallback local en caso de que backend no responda
    const esIncidencia = motivos.some(m => {
      const lower = m.toLowerCase();
      return lower.includes('reclam') || lower.includes('aver') || lower.includes('falla') || lower.includes('tecnic') || lower.includes('técnic');
    });

    return {
      source_mode: 'mock',
      motor_nbo: {
        decision_comercial: {
          accion: esIncidencia ? 'NO_OFRECER' : 'CONTACTAR',
          mensaje_asesor: esIncidencia ? 'Priorizar la atención del cliente y cerrar sin ofrecimiento comercial.' : 'Cliente apto para recomendación comercial.',
          motivo_principal: esIncidencia ? 'INCIDENCIA_EN_INTERACCION' : 'OPORTUNIDAD_COMERCIAL'
        }
      }
    };
  },

  async getDiagnosticoLLM() {
    try {
      await this.autoLogin();
      const res = await fetch('/api/speech/diagnostico-llm', {
        headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("No se pudo verificar el estado del LLM:", e.message);
    }
    return { conexion_ok: false, motor_activo: 'DESCONOCIDO', error: 'Backend inaccesible' };
  },

  async getSpeechSimulaciones() {
    try {
      await this.autoLogin();
      const res = await fetch('/api/speech/simulaciones', {
        headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {}
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("No se pudo cargar simulaciones desde backend:", e.message);
    }
    return null;
  },

  async analizarCallIn(payload) {
    try {
      await this.autoLogin();
      const res = await fetch('/api/speech/analisis-call-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Error al analizar Call In en backend:", e.message);
    }
    // Fallback local
    return {
      cliente_id: payload.cliente_id,
      score_sentimiento: 2.1,
      nivel_sentimiento: "NEGATIVO",
      topico_reclamo: "Averia_Tecnica_Fibra_Red",
      descripcion_problema: "Interrupción de servicio reportada en llamada.",
      cliente_insatisfecho: true,
      accion_recomendada: "Bloquear oferta comercial y derivar a soporte técnico.",
      puntos_criticos: ["Cliente reporta incidencia activa"],
      sugerencia_nbo: {
        accion_nbo: "NO_OFRECER_BLOQUEO_PRESION",
        bloqueo_presion_activo: true,
        sugerencia_fidelizacion: "Movistar Total con descuento de rescate"
      },
      motor_analisis: {
        proveedor: 'FALLBACK_FRONTEND',
        modelo: 'Mock local del navegador',
        latencia_ms: null,
        es_llm_real: false,
        etiqueta: 'Demo local (backend no disponible)',
        error: 'El backend no respondió; se muestra un análisis de ejemplo.'
      }
    };
  },

  async analizarCallOut(payload) {
    try {
      await this.autoLogin();
      const res = await fetch('/api/speech/analisis-call-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Error al analizar Call Out en backend:", e.message);
    }
    // Fallback local
    return {
      cliente_id: payload.cliente_id,
      resultado_oferta_inicial: "RECHAZADA",
      motivo_rechazo_inicial: "Precio muy alto",
      rebate_aplicado: true,
      oferta_rebate_ofrecida: payload.oferta_rebate || "Movistar Total Plus",
      efectividad_rebate: "ALTA_CONVERSION",
      score_efectividad_rebate: 0.92,
      argumentos_asesor_evaluados: ["Excelente pivote del asesor hacia ahorro convergente."],
      oportunidad_mejora_asesor: null,
      resumen_interaccion: "El cliente rechazó oferta inicial por precio pero aceptó Movistar Total tras presentar ahorro del 35%.",
      motor_analisis: {
        proveedor: 'FALLBACK_FRONTEND',
        modelo: 'Mock local del navegador',
        latencia_ms: null,
        es_llm_real: false,
        etiqueta: 'Demo local (backend no disponible)',
        error: 'El backend no respondió; se muestra un análisis de ejemplo.'
      }
    };
  }
};
