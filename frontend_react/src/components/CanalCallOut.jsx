import React, { useState, useEffect } from 'react';
import { 
  PhoneOutgoing, 
  Clock, 
  Target, 
  PhoneForwarded, 
  Sparkles, 
  CheckCircle2, 
  Sliders, 
  ShieldCheck, 
  Loader2, 
  X, 
  XCircle, 
  TrendingUp, 
  User, 
  PhoneCall,
  Search,
  Zap,
  Phone,
  Radio
} from 'lucide-react';
import { MOCK_CLIENTES } from '../data/mockData';
import { api } from '../services/api';
import RebateModal from './RebateModal';

export function CanalCallOut() {
  const [clientes, setClientes] = useState(MOCK_CLIENTES);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isRebateOpen, setIsRebateOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    api.getClientes('Call Out', 20)
      .then(data => {
        if (!isMounted) return;
        if (data && data.length > 0) {
          setClientes(data);
          setSelectedCliente(data[0]);
        }
      })
      .catch(err => {
        console.error("Error al cargar leads de Call Out:", err);
        setSelectedCliente(MOCK_CLIENTES[0]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Filtrar clientes
  const clientesOrdenados = [...clientes]
    .filter(cli => {
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (cli.nombre && cli.nombre.toLowerCase().includes(q)) ||
             (cli.dni && cli.dni.toLowerCase().includes(q)) ||
             (cli.cliente_id && cli.cliente_id.toLowerCase().includes(q));
    });

  const handleToggleCall = () => {
    setCallActive(!callActive);
  };

  const motor = selectedCliente?.motor_nbo;
  const decision = motor?.decision_comercial;
  const topNBO = motor?.top_3?.[0];
  const alternativas = motor?.top_3?.slice(1) || [];
  const isCallAllowed = decision?.accion === 'CONTACTAR';

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-6">
      
      {/* Header Compact with Integrated Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
            <PhoneOutgoing className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white leading-none">Módulo Call Center Outbound</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                Emisión Priorizada
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-0.5">
              Marcación proactiva controlada por decisiones comerciales del Motor NBO.
            </p>
          </div>
        </div>

        {/* Integrated Search Bar & Lead Stats in Header */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value.slice(0, 9))}
              maxLength={9}
              placeholder="Filtrar por ID (máx 9)..."
              className="w-48 sm:w-60 bg-slate-950 border border-slate-700 focus:border-purple-400 text-white text-xs font-mono pl-8 pr-7 py-1.5 rounded-xl outline-none transition shadow-inner"
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

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-[11px] font-mono text-purple-300">
            <span className="text-slate-400">Total:</span>
            <strong className="text-white font-bold">{clientesOrdenados.length}</strong>
          </div>
        </div>
      </div>

      {/* Main Split Layout (Zero-Scroll Master-Detail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Queue & Selected Client Profile + Call Controls (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Quick Queue Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Cola Priorizada de Leads
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Búsqueda rápida</span>
            </div>

            {/* Micro Lead List */}
            <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-800/60 border border-slate-800/80 rounded-xl bg-slate-950/40">
              {isLoading ? (
                <div className="p-4 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                  Cargando leads...
                </div>
              ) : clientesOrdenados.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">
                  Sin resultados.
                </div>
              ) : (
                clientesOrdenados.map((cli, idx) => {
                  const isSelected = selectedCliente?.cliente_id === cli.cliente_id;
                  const leadNBO = cli?.motor_nbo?.top_3?.[0];

                  return (
                    <div
                      key={cli.cliente_id || cli.dni}
                      onClick={() => {
                        setSelectedCliente(cli);
                        setCallActive(false);
                      }}
                      className={`p-2.5 transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected 
                          ? 'bg-purple-950/40 border-l-4 border-l-purple-500' 
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-mono font-bold shrink-0 ${
                          idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : 'bg-slate-800 text-slate-300'
                        }`}>
                          #{idx + 1}
                        </span>

                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold truncate leading-tight ${isSelected ? 'text-purple-300' : 'text-white'}`}>
                            {cli.nombre || cli.cliente_id}
                          </h4>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                            <span className="text-indigo-300 flex items-center gap-0.5 truncate">
                              <Clock className="w-2.5 h-2.5" /> {cli.horario_optimo}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5">
                          Lead
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Client Profile & Call Terminal Box (Directly below queue, matching Tienda structure) */}
          {selectedCliente ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-xl">
              
              {/* Header Info & Risk */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-400 flex items-center justify-center font-bold text-white text-xs">
                    {selectedCliente.nombre ? selectedCliente.nombre[0] : 'L'}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xs leading-tight">
                      {selectedCliente.nombre || selectedCliente.cliente_id}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">DNI: {selectedCliente.dni || selectedCliente.cliente_id}</p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedCliente.score_churn > 0.6 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  Riesgo {selectedCliente.nivel_riesgo}
                </span>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 text-[10px] block">Plan Actual</span>
                  <span className="font-bold text-white truncate block">{selectedCliente.plan_actual_nombre}</span>
                  <span className="text-[#00a9e0] font-mono text-[10px] font-semibold">S/ {selectedCliente.plan_actual_precio}/mes</span>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 text-[10px] block">Horario Óptimo</span>
                  <span className="font-bold text-indigo-300 block flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {selectedCliente.horario_optimo}
                  </span>
                  <span className="text-slate-500 text-[10px]">Mayor contactabilidad</span>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 text-[10px] block">P(Contacto)</span>
                  <span className="font-bold text-emerald-400 text-xs block">
                    {((selectedCliente.prob_contactabilidad || 0.7) * 100).toFixed(0)}%
                  </span>
                  <span className="text-slate-500 text-[10px]">Historial de llamadas</span>
                </div>

                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 text-[10px] block">Antigüedad</span>
                  <span className="font-bold text-amber-300 block">{selectedCliente.antiguedad_meses} meses</span>
                  <span className="text-slate-500 text-[10px]">Permanencia</span>
                </div>
              </div>

              {/* Call Trigger Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleToggleCall}
                  disabled={!isCallAllowed}
                  className={`w-full py-2.5 px-4 rounded-xl font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                    !isCallAllowed 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                      : callActive
                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25 animate-pulse'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/25'
                  }`}
                >
                  {callActive ? (
                    <>
                      <Radio className="w-4 h-4 animate-spin" />
                      <span>📞 LLAMADA EN CURSO · COLGAR</span>
                    </>
                  ) : (
                    <>
                      <PhoneForwarded className={`w-4 h-4 ${!isCallAllowed ? 'fill-slate-500' : 'fill-slate-950'}`} />
                      <span>{decision?.accion === 'VALIDAR_CONSENTIMIENTO' ? 'FALTA CONSENTIMIENTO' : decision?.accion === 'ESPERAR' ? 'ESPERAR (DESCANSO)' : 'MARCAR LEAD / INICIAR LLAMADA'}</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs">
              <User className="w-6 h-6 mx-auto mb-2 opacity-40" />
              Seleccione un lead para ver su perfil y emitir la llamada
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Real-Time NBO Offer, Pitch & Action Buttons (lg:col-span-8) */}
        <div className="lg:col-span-8">
          {selectedCliente && topNBO ? (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Main NBO Recommendation Box */}
              <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-purple-900/20 border border-purple-500/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header Oferta */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500 text-white flex items-center gap-1">
                        <Sparkles className="w-3 h-3 fill-current" />
                        Oferta NBO Recomendada para Llamada
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{topNBO.oferta_id}</span>
                    </div>

                    <h2 className="text-xl font-black text-white mt-1.5">{topNBO.nombre_oferta}</h2>
                  </div>

                  <div className="text-left sm:text-right bg-slate-950/60 p-2.5 sm:p-0 sm:bg-transparent rounded-xl border sm:border-0 border-slate-800">
                    <div className="text-2xl font-black text-emerald-400 leading-none mt-0.5">
                      S/ {topNBO.precio_mensual}
                      <span className="text-[11px] font-normal text-slate-400 ml-1">/mes</span>
                    </div>
                    {topNBO.ahorro_pct > 0 && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block mt-1">
                        Ahorro del {topNBO.ahorro_pct}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Mostrar estado sin puntajes internos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4">
                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Acción Comercial</span>
                    <p className="text-sm font-black text-emerald-400 mt-1">
                      {decision?.accion || 'CONTACTAR'}
                    </p>
                    <span className="text-[10px] text-slate-500">{decision?.mensaje_asesor || 'Habilitado para llamada proactiva'}</span>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 block">Estado de la Línea</span>
                    <p className={`text-xs font-bold mt-1 flex items-center gap-1 ${callActive ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${callActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                      {callActive ? 'Línea Conectada' : 'En Espera'}
                    </p>
                    <span className="text-[10px] text-slate-500">Teleoperador listo</span>
                  </div>
                </div>

                {/* Beneficios */}
                <div className="mt-3.5 pt-3 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Razones y Beneficios Clave:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-200 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/70">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>{topNBO.vista_asesor?.beneficio_principal}</span>
                    </div>
                    {topNBO.vista_asesor?.razones?.map((razon, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                        <span>{razon}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Alternativas Secundarias (Top 2 y Top 3) */}
              {alternativas.length > 0 && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 shadow-lg">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                    Alternativas (No ofrecer directamente si no es necesario):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {alternativas.map((alt, idx) => (
                      <div key={idx} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-white">{alt.nombre_oferta}</span>
                            <span className="text-xs font-black text-emerald-400">S/ {alt.precio_mensual}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-2">{alt.vista_asesor?.beneficio_principal}</p>
                        </div>
                        {alt.vista_asesor?.etiqueta && (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-slate-800 text-slate-300 text-[9px] font-bold rounded w-fit">
                            {alt.vista_asesor.etiqueta}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Speech & Quick Replies Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Sales Pitch Asesor (7 cols) */}
                <div className="md:col-span-7 bg-slate-900/80 border border-[#00a9e0]/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#00a9e0] flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Pitch Telefónico (Plantilla Segura)
                      </span>
                    </div>
                    <p className="text-xs text-slate-100 leading-relaxed mt-2.5 italic bg-[#00a9e0]/10 p-3.5 rounded-xl border border-[#00a9e0]/20 font-medium">
                      "{topNBO.vista_asesor.speech.texto}"
                    </p>
                  </div>

                  <span className="text-[10px] text-slate-500 block mt-2 text-right">
                    Generado por Motor NBO (Sin LLM)
                  </span>
                </div>

                {/* 3 Quick Replies de Apoyo (5 cols) */}
                <div className="md:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      Argumentos Rápidos
                    </h3>
                  </div>

                  <div className="space-y-2 mt-1">
                    {topNBO.quick_replies?.map((rep, idx) => (
                      <div key={idx} className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-300 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-tight text-[10px]">{rep}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Feedback Alert */}
              {feedbackMsg && (
                <div className={`p-3 rounded-xl flex items-center justify-between text-xs font-bold animate-fadeIn ${
                  feedbackMsg.type === 'success' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  <div className="flex items-center gap-2">
                    {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>{feedbackMsg.text}</span>
                  </div>
                  <span className="text-[10px] opacity-75 font-mono">Trazabilidad Sincronizada</span>
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-1">
                <button 
                  onClick={() => setIsRebateOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  Objeción / No Interesado (Rebate IA)
                </button>

                <button 
                  onClick={async () => {
                    await api.registrarGestion({
                      cliente_id: selectedCliente.cliente_id,
                      canal: 'Call Out',
                      oferta_id: topNBO.oferta_id,
                      oferta_nombre: topNBO.nombre_oferta,
                      es_movistar_total: topNBO.es_movistar_total || topNBO.oferta_id.startsWith("OF020") || topNBO.oferta_id.startsWith("OF021") || topNBO.oferta_id.startsWith("OF022"),
                      estado: 'ACEPTADA',
                      precio_oferta: topNBO.precio_promocional,
                      ahorro_pct: topNBO.ahorro_pct
                    });
                    setCallActive(false);
                    setFeedbackMsg({ type: 'success', text: `¡Venta Call Out exitosa! Registrada para ${selectedCliente.cliente_id} (${topNBO.nombre_oferta}).` });
                    setTimeout(() => setFeedbackMsg(null), 5000);
                  }}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Venta Exitosa (Cerrar Llamada)
                </button>
              </div>

            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <PhoneOutgoing className="w-10 h-10 text-slate-600 mb-2" />
              <h3 className="text-sm font-bold text-slate-300">Seleccione un Lead de la Cola</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Haga clic en un lead de la lista priorizada para cargar inmediatamente su oferta NBO y su pitch telefónico.
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
          canal="Call Out"
          onConfirmReject={async (motivo) => {
            await api.registrarGestion({
              cliente_id: selectedCliente.cliente_id,
              canal: 'Call Out',
              oferta_id: topNBO.oferta_id,
              oferta_nombre: topNBO.nombre_oferta,
              es_movistar_total: topNBO.es_movistar_total || false,
              estado: 'RECHAZADA',
              motivo_rechazo: motivo,
              precio_oferta: topNBO.precio_promocional,
              ahorro_pct: topNBO.ahorro_pct
            });
            setCallActive(false);
            setFeedbackMsg({ type: 'reject', text: `Rechazo registrado para ${selectedCliente.cliente_id}. Motivo: ${motivo}` });
            setTimeout(() => setFeedbackMsg(null), 5000);
          }}
          onAcceptAfterRebate={async () => {
            await api.registrarGestion({
              cliente_id: selectedCliente.cliente_id,
              canal: 'Call Out',
              oferta_id: topNBO.oferta_id,
              oferta_nombre: topNBO.nombre_oferta,
              es_movistar_total: topNBO.es_movistar_total || false,
              estado: 'ACEPTADA',
              precio_oferta: topNBO.precio_promocional,
              ahorro_pct: topNBO.ahorro_pct
            });
            setCallActive(false);
            setFeedbackMsg({ type: 'success', text: `¡Rebate Exitoso en Call Out! Venta salvada para ${selectedCliente.cliente_id}.` });
            setTimeout(() => setFeedbackMsg(null), 5000);
          }}
        />
      )}

    </div>
  );
}
