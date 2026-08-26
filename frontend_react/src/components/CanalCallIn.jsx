import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  XCircle, 
  Search, 
  TrendingUp, 
  User, 
  PhoneIncoming, 
  AlertTriangle,
  Flame,
  Radio,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { MOCK_CLIENTES } from '../data/mockData';
import { api } from '../services/api';
import RebateModal from './RebateModal';

const MOTIVOS_CALL_IN = [
  { id: 'consulta', label: '📋 Consulta de Saldo / Plan' },
  { id: 'reclamo', label: '⚠️ Reclamo de Facturación', esIncidencia: true },
  { id: 'averia', label: '🛠️ Avería Técnica / Falla de Red', esIncidencia: true },
  { id: 'comercial', label: '🔄 Consulta de Renovación / Comercial' },
  { id: 'traslado', label: '📦 Traslado / Trámite Administrativo' },
];

export function CanalCallIn() {
  const [clientesList, setClientesList] = useState(MOCK_CLIENTES);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isRebateOpen, setIsRebateOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [showNbo, setShowNbo] = useState(false);
  const [motivosSeleccionados, setMotivosSeleccionados] = useState(['📋 Consulta de Saldo / Plan']);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    api.getClientes('Call In', 15)
      .then(data => {
        if (!isMounted) return;
        if (data && data.length > 0) {
          setClientesList(data);
          const highRisk = data.find(c => c.score_churn > 0.4) || data[0];
          setSelectedCliente(highRisk);
        }
      })
      .catch(err => {
        console.error("Error al cargar clientes de Call In:", err);
        setSelectedCliente(MOCK_CLIENTES[1] || MOCK_CLIENTES[0]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const clientesFiltrados = clientesList.filter(cli => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (cli.nombre && cli.nombre.toLowerCase().includes(q)) ||
           (cli.dni && cli.dni.toLowerCase().includes(q)) ||
           (cli.cliente_id && cli.cliente_id.toLowerCase().includes(q));
  });

  const rawClient = selectedCliente?.cliente || selectedCliente;
  const motor = selectedCliente?.motor_nbo;
  const decision = motor?.decision_comercial;
  const topNBO = motor?.top_3?.[0] || selectedCliente?.ofertas_nbo?.[0];
  const alternativas = motor?.top_3?.slice(1) || [];
  const preguntaMT = motor?.pregunta_inteligente;

  const isHighRisk = (rawClient?.score_churn || 0) > 0.45;
  const isActionBlocked = decision?.accion === 'NO_OFRECER';
  const isSellAllowed = decision?.accion === 'CONTACTAR' || decision?.accion === 'RECOMENDACION_DISPONIBLE';

  const handleEvaluarNBO = async () => {
    if (!rawClient?.cliente_id) return;
    setIsEvaluating(true);
    try {
      const res = await api.evaluarNBO(rawClient.cliente_id, 'Call In', motivosSeleccionados);
      if (res && res.motor_nbo) {
        setSelectedCliente(prev => ({
          ...prev,
          motor_nbo: res.motor_nbo
        }));
      }
    } catch (e) {
      console.error("Error evaluando NBO:", e);
    } finally {
      setIsEvaluating(false);
      setShowNbo(true);
    }
  };

  const handleResponderMT = async (valor) => {
    setFeedbackMsg({ type: 'success', text: `Preferencia MT '${valor}' enviada al motor.` });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-6">
      
      {/* Header Compact with Integrated Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold">
            <PhoneIncoming className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white leading-none">Módulo Call Center Inbound</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                Atención & Retención Receptiva
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Prescripción en vivo orientada a contención de Churn y fidelización rápida
            </p>
          </div>
        </div>

        {/* Integrated Search Bar & Line Status in Header */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value.slice(0, 9))}
              maxLength={9}
              placeholder="Buscar ID/DNI (máx 9)..."
              className="w-48 sm:w-60 bg-slate-950 border border-slate-700 focus:border-rose-400 text-white text-xs font-mono pl-8 pr-7 py-1.5 rounded-xl outline-none transition shadow-inner"
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2 text-slate-400 hover:text-white text-[10px] bg-slate-800 px-1 py-0.5 rounded"
              >
                ✕
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-[11px] font-mono text-rose-300">
            <Radio className="w-2.5 h-2.5 animate-ping text-rose-400" />
            <span>Línea 104</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Queue & Client Profile (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Quick Incoming Queue */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Llamadas Entrantes (En Espera)
              </label>
              <span className="text-[10px] text-rose-400 font-mono">
                {clientesFiltrados.length} en cola
              </span>
            </div>

            {/* List */}
            <div className="max-h-[170px] overflow-y-auto divide-y divide-slate-800/60 border border-slate-800/80 rounded-xl bg-slate-950/40">
              {isLoading ? (
                <div className="p-4 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                  Cargando llamadas...
                </div>
              ) : (
                clientesFiltrados.map((cli) => {
                  const isSelected = selectedCliente?.cliente_id === cli.cliente_id;
                  const cliHighRisk = (cli.score_churn || 0) > 0.45;

                  return (
                    <div
                      key={cli.cliente_id || cli.dni}
                      onClick={() => {
                        setSelectedCliente(cli);
                        setShowNbo(false);
                        setMotivosSeleccionados(['📋 Consulta de Saldo / Plan']);
                      }}
                      className={`p-2.5 transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected 
                          ? 'bg-rose-950/40 border-l-4 border-l-rose-500' 
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="min-w-0">
                        <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-rose-300' : 'text-white'}`}>
                          {cli.nombre || cli.cliente_id}
                        </h4>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>DNI: {cli.dni || cli.cliente_id}</span>
                          <span>•</span>
                          <span className="text-slate-300">S/ {cli.plan_actual_precio || cli.monto_facturado_prom}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                        cliHighRisk ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {cliHighRisk ? '🔥 Riesgo Alto' : 'Normal'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Client Profile Box */}
          {selectedCliente && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center font-bold text-white text-xs">
                    {rawClient.nombre ? rawClient.nombre[0] : 'C'}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xs leading-tight">
                      {rawClient.nombre || rawClient.cliente_id}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">DNI: {rawClient.dni || rawClient.cliente_id}</p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isHighRisk 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  Churn: {((rawClient.score_churn || 0) * 100).toFixed(0)}%
                </span>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 text-[10px] block">Plan Actual</span>
                  <span className="font-bold text-white truncate block">{rawClient.plan_actual_nombre || rawClient.plan_actual_id}</span>
                  <span className="text-[#00a9e0] font-mono text-[10px] font-semibold">S/ {rawClient.plan_actual_precio || rawClient.monto_facturado_prom}/mes</span>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 text-[10px] block">Historial Reclamos</span>
                  <span className="font-bold text-rose-400 block">{rawClient.n_reclamos || 0} incidencias</span>
                  <span className="text-slate-500 text-[10px]">{rawClient.meses_moroso || 0} meses mora</span>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 text-[10px] block">Consumo Promedio</span>
                  <span className="font-bold text-indigo-300 text-xs block">
                    {rawClient.consumo_datos_gb_prom || 0} GB
                  </span>
                  <span className="text-slate-500 text-[10px]">Datos móviles</span>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 text-[10px] block">Antigüedad</span>
                  <span className="font-bold text-amber-300 block">{rawClient.antiguedad_meses} meses</span>
                  <span className="text-slate-500 text-[10px]">Permanencia</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Real-Time Retention/Up-sell NBO & Copilot Pitch (lg:col-span-8) */}
        <div className="lg:col-span-8">
          {selectedCliente ? (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Dynamic Early Warning Banner */}
              {isHighRisk ? (
                <div className="bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-slate-900 border border-rose-500/50 rounded-2xl p-3.5 flex items-center justify-between text-xs text-rose-200 shadow-xl shadow-rose-950/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/30 text-rose-300 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4 animate-bounce" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                        ALERTA DE RETENCIÓN PRIORITARIA: ALTO RIESGO DE BAJA
                      </h4>
                      <p className="text-[11px] text-rose-300/80 mt-0.5">
                        El cliente registra {rawClient.n_reclamos || 0} reclamos y un score de fuga de {((rawClient.score_churn || 0) * 100).toFixed(0)}%. No ofrecer venta agresiva; priorizar contención con beneficio exclusivo.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">CLIENTE ESTABLE: OPORTUNIDAD DE FIDELIZACIÓN / UPGRADE</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Bajo riesgo de churn. Proceder con oferta NBO de mejora de velocidad o unificación Movistar Total.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!showNbo ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-center shadow-lg space-y-5">
                  <div>
                    <h3 className="text-white font-bold text-base mb-1">Atención Telefónica en Curso</h3>
                    <p className="text-slate-400 text-xs max-w-lg mx-auto">
                      Atienda la solicitud principal de la llamada y seleccione los motivos identificados para que el Motor NBO evalúe la viabilidad de una oferta.
                    </p>
                  </div>

                  {/* Panel de Tipificación Rápida */}
                  <div className="text-left bg-slate-950/80 p-4 rounded-xl border border-slate-800 max-w-xl mx-auto space-y-2.5">
                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Motivo(s) detectado(s) durante la llamada:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {MOTIVOS_CALL_IN.map(m => {
                        const isChecked = motivosSeleccionados.includes(m.label);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                setMotivosSeleccionados(prev => prev.filter(item => item !== m.label));
                              } else {
                                setMotivosSeleccionados(prev => [...prev, m.label]);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 cursor-pointer ${
                              isChecked
                                ? m.esIncidencia
                                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm shadow-rose-500/20'
                                  : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/20'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <span>{m.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button 
                    onClick={handleEvaluarNBO}
                    disabled={isEvaluating}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-black text-xs px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Abrir Recomendación Comercial (Consultar NBO)</span>
                  </button>
                </div>
              ) : isActionBlocked ? (
                /* Bloqueo Comercial según Regla Oficial */
                <div className="bg-gradient-to-br from-rose-950/60 via-slate-900 to-slate-900 border border-rose-500/50 rounded-2xl p-6 text-center shadow-2xl space-y-4 animate-fadeIn">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Regla de Protección al Cliente
                    </span>
                    <h3 className="text-white font-bold text-base mt-2">
                      Acción Comercial Restringida: {decision?.accion || 'NO_OFRECER'}
                    </h3>
                    <p className="text-rose-300/90 text-xs max-w-md mx-auto mt-1">
                      {decision?.mensaje_asesor || 'Se ha detectado una incidencia o queja activa en la llamada. La regla oficial de Movistar prohíbe presentar ofertas de venta agresiva en este contexto.'}
                    </p>
                  </div>

                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-left text-xs text-slate-300 max-w-md mx-auto">
                    <span className="font-bold text-rose-400 block mb-1">Directriz para el Asesor:</span>
                    Enfocarse al 100% en solucionar el reclamo/avería del cliente. Registrar la atención y despedirse cordialmente sin prescribir promociones.
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setShowNbo(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 mx-auto cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Regresar a la Atención / Cambiar Motivo
                    </button>
                  </div>
                </div>
              ) : topNBO ? (
                <>
                  {/* Main NBO Recommendation Box */}
                  <div className="bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-rose-900/15 border border-rose-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white flex items-center gap-1">
                          <Sparkles className="w-3 h-3 fill-current" />
                          Oferta de Retención / Solución NBO
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{topNBO.oferta_id}</span>
                      </div>
                      <button
                        onClick={() => setShowNbo(false)}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3 h-3" /> Modificar Motivo
                      </button>
                    </div>

                    {/* Pregunta Inteligente MT */}
                    {preguntaMT && preguntaMT.estado === 'PENDIENTE' && (
                      <div className="bg-indigo-950/60 border border-indigo-500/50 rounded-xl p-4 mb-4">
                        <h3 className="text-white font-bold text-xs mb-2 flex items-center gap-2">
                          <User className="w-4 h-4 text-indigo-400" />
                          Pregunta de Perfilamiento Requerida:
                        </h3>
                        <p className="text-indigo-200 text-sm font-medium italic mb-4">"{preguntaMT.pregunta}"</p>
                        <div className="flex flex-wrap gap-2">
                          {preguntaMT.opciones.map((opc, idx) => (
                            <button 
                              key={idx} 
                              onClick={() => handleResponderMT(opc.valor)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
                            >
                              {opc.texto}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Header Oferta */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-black text-white">{topNBO.nombre_oferta}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl font-black text-emerald-400 font-mono">
                            S/ {topNBO.precio_mensual || topNBO.precio_promocional}/mes
                          </span>
                          {topNBO.ahorro_pct > 0 && (
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              -{topNBO.ahorro_pct}% Ahorro
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Copilot Speech */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Speech Sugerido de Retención / Fidelización
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Reglas Motor v2</span>
                      </div>

                      <div className="bg-slate-950/90 border border-indigo-500/30 rounded-xl p-3.5 relative shadow-inner">
                        <p className="text-slate-200 text-xs font-medium italic leading-relaxed">
                          "{topNBO.vista_asesor?.speech?.texto || topNBO.speech_asesor || 'Estimado cliente, tenemos una oferta especial para mejorar su servicio manteniendo una tarifa preferencial.'}"
                        </p>
                      </div>
                    </div>

                    {/* Beneficios clave */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(topNBO.beneficios || [topNBO.vista_asesor?.beneficio_principal]).filter(Boolean).map((b, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Alternativas Disponibles */}
                  {alternativas.length > 0 && (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#00a9e0]" />
                          Alternativas Secundarias en caso de Objeción:
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Opciones 2 y 3</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {alternativas.map((alt, idx) => (
                          <div key={alt.oferta_id || idx} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 font-mono">Opción #{idx + 2}</span>
                              <span className="text-xs font-bold text-emerald-400 font-mono">S/ {alt.precio_mensual || alt.precio_promocional}/m</span>
                            </div>
                            <h4 className="text-xs font-bold text-white truncate">{alt.nombre_oferta}</h4>
                            <p className="text-[11px] text-slate-400 italic truncate">
                              "{alt.vista_asesor?.speech?.texto || alt.speech_asesor}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback Msg */}
                  {feedbackMsg && (
                    <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn ${
                      feedbackMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      <div className="flex items-center gap-2">
                        {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span>{feedbackMsg.text}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setIsRebateOpen(true)}
                      className="px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      Objeción / No Acepta (Rebate)
                    </button>

                    <button
                      disabled={!isSellAllowed}
                      onClick={async () => {
                        await api.registrarGestion({
                          cliente_id: rawClient.cliente_id,
                          canal: 'Call In',
                          oferta_id: topNBO.oferta_id,
                          oferta_nombre: topNBO.nombre_oferta,
                          es_movistar_total: topNBO.es_movistar_total || false,
                          estado: 'ACEPTADA',
                          precio_oferta: topNBO.precio_mensual || topNBO.precio_promocional,
                          ahorro_pct: topNBO.ahorro_pct
                        });
                        setFeedbackMsg({ type: 'success', text: `¡Retención Exitosa! Contratación registrada para ${rawClient.cliente_id}.` });
                        setTimeout(() => setFeedbackMsg(null), 5000);
                      }}
                      className={`font-black text-xs px-6 py-2.5 rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer ${
                        !isSellAllowed 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isActionBlocked ? 'Venta Bloqueada' : 'Aceptó Oferta (Registrar)'}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-slate-800 bg-slate-900/30">
              <Search className="w-8 h-8 text-slate-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-400">Seleccione una llamada en cola</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Elija un cliente de la lista de espera para iniciar la atención.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Rebate Modal */}
      {selectedCliente && topNBO && (
        <RebateModal
          isOpen={isRebateOpen}
          onClose={() => setIsRebateOpen(false)}
          cliente={selectedCliente}
          oferta={topNBO}
          canal="Call In"
          onConfirmReject={async (motivo) => {
            await api.registrarGestion({
              cliente_id: rawClient.cliente_id,
              canal: 'Call In',
              oferta_id: topNBO.oferta_id,
              oferta_nombre: topNBO.nombre_oferta,
              es_movistar_total: topNBO.es_movistar_total || false,
              estado: 'RECHAZADA',
              motivo_rechazo: motivo,
              precio_oferta: topNBO.precio_promocional,
              ahorro_pct: topNBO.ahorro_pct
            });
            setFeedbackMsg({ type: 'reject', text: `Rechazo registrado para ${rawClient.cliente_id}. Motivo: ${motivo}` });
            setTimeout(() => setFeedbackMsg(null), 5000);
          }}
          onAcceptAfterRebate={async () => {
            await api.registrarGestion({
              cliente_id: rawClient.cliente_id,
              canal: 'Call In',
              oferta_id: topNBO.oferta_id,
              oferta_nombre: topNBO.nombre_oferta,
              es_movistar_total: topNBO.es_movistar_total || false,
              estado: 'ACEPTADA',
              precio_oferta: topNBO.precio_promocional,
              ahorro_pct: topNBO.ahorro_pct
            });
            setFeedbackMsg({ type: 'success', text: `¡Rebate Exitoso! Retención salvada para ${rawClient.cliente_id}.` });
            setTimeout(() => setFeedbackMsg(null), 5000);
          }}
        />
      )}

    </div>
  );
}

export default CanalCallIn;
