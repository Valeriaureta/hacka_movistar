import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Zap, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Loader2, 
  XCircle, 
  User, 
  Layers,
  Award,
  ArrowLeft
} from 'lucide-react';
import { MOCK_CLIENTES } from '../data/mockData';
import { api } from '../services/api';
import RebateModal from './RebateModal';
import { useTheme } from '../context/ThemeContext';

const MOTIVOS_TIENDA = [
  { id: 'consulta', label: '👤 Consulta de Línea / Plan' },
  { id: 'pago', label: '💳 Trámite de Pago / Recibo' },
  { id: 'reclamo', label: '⚠️ Reclamo Presencial / Queja', esIncidencia: true },
  { id: 'soporte', label: '🛠️ Soporte Técnico / Chip / Avería', esIncidencia: true },
  { id: 'compra', label: '🛒 Interés en Nuevos Equipos / Planes' }
];

export function CanalTienda() {
  const [dniInput, setDniInput] = useState('');
  const [clienteActual, setClienteActual] = useState(null);
  const [demoClientes, setDemoClientes] = useState(MOCK_CLIENTES);
  const [selectedOfferIndex, setSelectedOfferIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [latencyMs, setLatencyMs] = useState('3.2');
  const [isRebateOpen, setIsRebateOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [showNbo, setShowNbo] = useState(false);
  const [motivosSeleccionados, setMotivosSeleccionados] = useState(['👤 Consulta de Línea / Plan']);
  const { isDark } = useTheme();

  useEffect(() => {
    let isMounted = true;
    api.getClientes('Tienda', 6)
      .then(data => {
        if (!isMounted) return;
        if (data && data.length > 0) {
          setDemoClientes(data);
          setClienteActual(data[0]);
          setDniInput(data[0].dni || data[0].cliente_id);
          setSelectedOfferIndex(0);
          setLatencyMs("3.4");
        }
      })
      .catch(() => {
        setClienteActual(MOCK_CLIENTES[0]);
        setDniInput(MOCK_CLIENTES[0].dni);
        setSelectedOfferIndex(0);
        setLatencyMs("3.8");
      });

    return () => { isMounted = false; };
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!dniInput.trim()) return;

    setIsSearching(true);
    const start = performance.now();

    try {
      const match = await api.getClienteByDniOrId(dniInput.trim(), 'Tienda');
      const end = performance.now();
      setLatencyMs((end - start).toFixed(1));
      setClienteActual(match);
      setSelectedOfferIndex(0);
      setShowNbo(false);
      setMotivosSeleccionados(['👤 Consulta de Línea / Plan']);
      if (!match) {
        setFeedbackMsg({ type: 'reject', text: `No se encontró ningún cliente con "${dniInput.trim()}".` });
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
    } catch (err) {
      const fallback = MOCK_CLIENTES[0];
      setClienteActual(fallback);
      setSelectedOfferIndex(0);
      setShowNbo(false);
      setMotivosSeleccionados(['👤 Consulta de Línea / Plan']);
      setLatencyMs("4.2");
    } finally {
      setIsSearching(false);
    }
  };

  const rawClient = clienteActual?.cliente || clienteActual;
  const motor = clienteActual?.motor_nbo;
  const decision = motor?.decision_comercial;
  const preguntaMT = motor?.pregunta_inteligente;
  const ofertasList = motor?.top_3 || clienteActual?.ofertas_nbo || [];
  const currentOffer = ofertasList[selectedOfferIndex] || ofertasList[0];
  const isActionBlocked = decision?.accion === 'NO_OFRECER';
  const isSellAllowed = !isActionBlocked && (decision?.accion === 'CONTACTAR' || decision?.accion === 'RECOMENDACION_DISPONIBLE');

  const handleEvaluarNBO = async () => {
    if (!rawClient?.cliente_id) return;
    setIsEvaluating(true);
    try {
      const res = await api.evaluarNBO(rawClient.cliente_id, 'Tienda', motivosSeleccionados);
      if (res && res.motor_nbo) {
        setClienteActual(res);
        setSelectedOfferIndex(0);
      }
    } catch (e) {
      console.error("Error evaluando NBO en tienda:", e);
    } finally {
      setIsEvaluating(false);
      setShowNbo(true);
    }
  };

  const handleResponderMT = async (valor) => {
    if (!clienteActual?.recomendacion_id) {
      setFeedbackMsg({ type: 'error', text: 'No existe una recomendación activa para actualizar.' });
      return;
    }
    setIsEvaluating(true);
    try {
      const res = await api.enviarPreferenciaMT(clienteActual.recomendacion_id, valor);
      if (!res?.motor_nbo) throw new Error('El motor no devolvió una recomendación actualizada.');
      setClienteActual(res);
      setSelectedOfferIndex(0);
      setFeedbackMsg({ type: 'success', text: 'Preferencia registrada y Top-3 recalculado.' });
    } catch (error) {
      setFeedbackMsg({ type: 'error', text: error.message });
    } finally {
      setIsEvaluating(false);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-6 animate-fadeIn">
      
      {/* Top Header with Integrated Search Bar */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b transition-colors ${
        isDark ? 'border-[#005C84]/30' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#005C84] to-[#00C6D7] flex items-center justify-center text-white font-bold shadow-md shadow-[#00C6D7]/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-lg font-extrabold leading-none ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                Módulo Tienda Física (Atención Presencial)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#7AB800]/20 text-[#7AB800] border border-[#7AB800]/30">
                Front Office
              </span>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
              Ventanilla de atención y prescripción presencial en tiempo real · Movistar Perú
            </p>
          </div>
        </div>

        {/* Integrated Search Bar in Header */}
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearch} className="flex items-center gap-1.5">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={dniInput}
                onChange={(e) => setDniInput(e.target.value.slice(0, 9))}
                maxLength={9}
                placeholder="ID o DNI (máx 9 caracteres)..."
                className={`w-44 sm:w-60 text-xs font-mono pl-8 pr-2.5 py-2 rounded-xl outline-none transition shadow-inner border ${
                  isDark 
                    ? 'bg-[#030914] border-[#005C84]/40 text-white focus:border-[#00C6D7]' 
                    : 'bg-white border-slate-300 text-[#002D42] focus:border-[#005C84]'
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="bg-gradient-to-r from-[#005C84] to-[#00C6D7] hover:from-[#00C6D7] hover:to-[#005C84] disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-[#00C6D7]/20 transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Buscar Perfil</span>
            </button>
          </form>

          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-mono text-[#7AB800] ${
            isDark ? 'bg-[#061426] border-[#005C84]/30' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <Zap className="w-3.5 h-3.5 fill-[#7AB800]" /> {latencyMs || '2.8'} ms
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Client Profile + Selected Offer Summary Card (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Client Profile Card */}
          {clienteActual ? (
            <div className={`rounded-3xl p-5 space-y-4 shadow-xl border transition-all duration-300 ${
              isDark 
                ? 'bg-[#061426]/85 border-[#005C84]/35 shadow-black/40' 
                : 'bg-white border-[#005C84]/15 shadow-[#005C84]/10'
            }`}>
              <div className={`flex items-center justify-between pb-3 border-b ${
                isDark ? 'border-[#005C84]/20' : 'border-slate-100'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#005C84] to-[#00C6D7] flex items-center justify-center font-bold text-white text-sm shadow-md shadow-[#00C6D7]/20">
                    {rawClient.nombre ? rawClient.nombre[0] : 'C'}
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm leading-tight ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                      {rawClient.nombre || rawClient.cliente_id}
                    </h3>
                    <p className={`text-[10px] font-mono mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
                      DNI: {rawClient.dni || rawClient.cliente_id}
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  (rawClient.score_churn || 0) > 0.6 
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                    : 'bg-[#7AB800]/20 text-[#7AB800] border border-[#7AB800]/30'
                }`}>
                  Riesgo {rawClient.nivel_riesgo || (rawClient.score_churn > 0.5 ? 'Alto' : 'Bajo')}
                </span>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                <div className={`p-3 rounded-2xl border ${
                  isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>Plan Actual</span>
                  <span className={`font-bold truncate block ${isDark ? 'text-white' : 'text-[#002D42]'}`}>
                    {rawClient.plan_actual_nombre || rawClient.plan_actual_id || 'Plan Postpago'}
                  </span>
                  <span className="text-[#00C6D7] font-mono text-[10px] font-bold">
                    S/ {rawClient.plan_actual_precio || rawClient.monto_facturado_prom}/mes
                  </span>
                </div>

                <div className={`p-3 rounded-2xl border ${
                  isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>Gasto Promedio</span>
                  <span className={`font-bold block ${isDark ? 'text-white' : 'text-[#002D42]'}`}>
                    S/ {rawClient.monto_facturado_prom}
                  </span>
                  <span className="text-slate-400 text-[10px]">Facturación 6m</span>
                </div>

                <div className={`p-3 rounded-2xl border ${
                  isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>Consumo Mensual</span>
                  <span className="font-bold text-[#00C6D7] text-xs block font-mono">
                    {rawClient.consumo_datos_gb_prom} GB
                  </span>
                  <span className="text-slate-400 text-[10px]">Datos móviles</span>
                </div>

                <div className={`p-3 rounded-2xl border ${
                  isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>Antigüedad</span>
                  <span className="font-bold text-[#7AB800] block">{rawClient.antiguedad_meses} meses</span>
                  <span className="text-slate-400 text-[10px]">Permanencia</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={`border border-dashed rounded-3xl p-6 text-center text-xs ${
              isDark ? 'bg-[#061426]/40 border-[#005C84]/30 text-slate-400' : 'bg-white border-slate-300 text-[#515559]'
            }`}>
              <User className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#00C6D7]" />
              Ingrese un DNI en la barra superior para consultar el perfil del cliente
            </div>
          )}

          {/* Cuadro de la Oferta Recomendada (Solo si se activó NBO y no está bloqueado) */}
          {showNbo && !isActionBlocked && currentOffer && (
            <div className={`rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden border transition-all duration-300 ${
              isDark 
                ? 'bg-gradient-to-br from-[#061426] via-[#005C84]/20 to-[#00C6D7]/15 border-[#00C6D7]/40 shadow-black/40' 
                : 'bg-gradient-to-br from-white via-slate-50 to-[#00C6D7]/10 border-[#005C84]/30 shadow-md'
            }`}>
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#005C84] to-[#00C6D7] text-white flex items-center gap-1 shadow-sm">
                  <Award className="w-3 h-3 fill-current" />
                  Oferta Seleccionada (#{selectedOfferIndex + 1})
                </span>
              </div>

              <div>
                <h4 className={`font-bold text-sm leading-snug ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                  {currentOffer.nombre_oferta}
                </h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xl font-black text-[#7AB800] font-mono">
                    S/ {currentOffer.precio_mensual || currentOffer.precio_promocional}/mes
                  </span>
                  {currentOffer.ahorro_pct > 0 && (
                    <span className="text-[10px] font-bold text-[#7AB800] bg-[#7AB800]/15 px-2 py-0.5 rounded-md border border-[#7AB800]/30">
                      {currentOffer.ahorro_pct}% de ahorro estimado
                    </span>
                  )}
                </div>
              </div>

              {/* Beneficios clave de la oferta */}
              <div className={`pt-3 border-t space-y-1.5 ${isDark ? 'border-[#005C84]/20' : 'border-slate-200'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
                  Beneficios del Plan:
                </span>
                {(currentOffer.beneficios || [currentOffer.vista_asesor?.beneficio_principal]).filter(Boolean).map((b, idx) => (
                  <div key={idx} className={`flex items-center gap-2 text-[10px] ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00C6D7] shrink-0" />
                    <span className="truncate">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Top 3 Offers Selector + Hero Speech (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          {clienteActual ? (
            <div className="space-y-4 animate-fadeIn">
              
              {!showNbo ? (
                <div className={`rounded-3xl p-6 text-center shadow-lg border space-y-5 ${
                  isDark ? 'bg-[#061426]/60 border-[#005C84]/30' : 'bg-white border-slate-200'
                }`}>
                  <div>
                    <h3 className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                      Atención Presencial en Módulo
                    </h3>
                    <p className={`text-xs max-w-lg mx-auto ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
                      Atienda la consulta presencial del cliente y marque los motivos de la visita para que el Motor NBO evalúe si corresponde una recomendación comercial.
                    </p>
                  </div>

                  {/* Panel de Tipificación Rápida de Tienda */}
                  <div className={`text-left p-4 rounded-2xl border max-w-xl mx-auto space-y-2.5 ${
                    isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                      isDark ? 'text-slate-300' : 'text-[#005C84]'
                    }`}>
                      Motivo(s) de la visita en Tienda:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {MOTIVOS_TIENDA.map(m => {
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
                                  ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-sm'
                                  : 'bg-[#00C6D7]/20 border-[#00C6D7] text-[#00C6D7] shadow-sm'
                                : isDark
                                ? 'bg-[#061426] border-[#005C84]/20 text-slate-400 hover:border-[#00C6D7]/40'
                                : 'bg-white border-slate-300 text-slate-600 hover:border-[#005C84]/40'
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
                    className="bg-gradient-to-r from-[#005C84] to-[#00C6D7] hover:from-[#00C6D7] hover:to-[#005C84] disabled:opacity-50 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-[#00C6D7]/20 transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Revelar Ofertas Recomendadas (Consultar NBO)</span>
                  </button>
                </div>
              ) : isActionBlocked ? (
                /* Bloqueo Comercial en Tienda */
                <div className={`rounded-3xl p-6 text-center shadow-2xl border-2 space-y-4 animate-fadeIn ${
                  isDark ? 'bg-gradient-to-br from-rose-950/40 via-[#061426] to-[#061426] border-rose-500/50' : 'bg-rose-50 border-rose-300'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-500 border border-rose-500/30">
                      Regla de Protección al Cliente
                    </span>
                    <h3 className={`font-bold text-base mt-2 ${isDark ? 'text-white' : 'text-rose-950'}`}>
                      Acción Comercial Restringida: {decision?.accion || 'NO_OFRECER'}
                    </h3>
                    <p className={`text-xs max-w-md mx-auto mt-1 ${isDark ? 'text-rose-300/90' : 'text-rose-800'}`}>
                      {decision?.mensaje_asesor || 'Se ha registrado un reclamo o incidencia técnica durante la visita. La regla oficial de Movistar prohíbe presentar ofertas de venta agresiva en este contexto.'}
                    </p>
                  </div>

                  <div className={`p-3.5 rounded-2xl border text-left text-xs max-w-md mx-auto ${
                    isDark ? 'bg-[#030914]/90 border-[#005C84]/30 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <span className="font-bold text-rose-500 block mb-1">Directriz para Asesor en Tienda:</span>
                    Resolver la disconformidad o avería del cliente en ventanilla. Finalizar la atención presencial con amabilidad sin realizar prescripción comercial.
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setShowNbo(false)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 mx-auto cursor-pointer border ${
                        isDark ? 'bg-[#061426] hover:bg-[#005C84]/20 border-[#005C84]/40 text-slate-200' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                      }`}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Regresar a la Atención / Modificar Motivo
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Pregunta Inteligente MT */}
                  {preguntaMT && (preguntaMT.requiere_pregunta || preguntaMT.estado === 'PENDIENTE') && (
                    <div className={`border rounded-2xl p-5 mb-4 shadow-md ${
                      isDark ? 'bg-indigo-950/40 border-indigo-500/50' : 'bg-indigo-50 border-indigo-200'
                    }`}>
                      <h3 className={`font-bold text-sm mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-indigo-900'}`}>
                        <User className="w-4 h-4 text-indigo-500" />
                        Pregunta de Perfilamiento Requerida:
                      </h3>
                      <p className={`text-sm font-medium italic mb-4 ${isDark ? 'text-indigo-200' : 'text-indigo-800'}`}>
                        "{preguntaMT.pregunta}"
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {preguntaMT.opciones.map((opc, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => handleResponderMT(opc.preferencia || opc.valor)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
                          >
                            {opc.texto || ({
                              pagar_menos: 'Pagar menos',
                              mas_gigas: 'Tener más gigas',
                              datos_ilimitados: 'Datos ilimitados',
                            }[opc.preferencia]) || opc.nombre_oferta}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TOP 3 OFFERS SELECTOR BAR */}
                  <div className={`rounded-3xl p-4 shadow-xl space-y-3 border transition-all duration-300 ${
                    isDark ? 'bg-[#061426]/85 border-[#005C84]/35' : 'bg-white border-[#005C84]/15 shadow-md'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        isDark ? 'text-slate-200' : 'text-[#005C84]'
                      }`}>
                        <Layers className="w-4 h-4 text-[#00C6D7]" />
                        Top Ofertas Prescritas:
                      </span>
                      <button
                        onClick={() => setShowNbo(false)}
                        className="text-[10px] text-slate-400 hover:text-[#00C6D7] flex items-center gap-1 cursor-pointer font-mono"
                      >
                        <ArrowLeft className="w-3 h-3" /> Modificar Motivo
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {ofertasList.slice(0, 3).map((off, idx) => {
                        const isSelected = selectedOfferIndex === idx;
                        const precio = off.precio_mensual || off.precio_promocional;
                        return (
                          <button
                            key={off.oferta_id || idx}
                            type="button"
                            onClick={() => setSelectedOfferIndex(idx)}
                            className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? isDark 
                                  ? 'bg-[#005C84]/30 border-[#00C6D7] shadow-[0_0_15px_rgba(0,198,215,0.2)] scale-[1.02]' 
                                  : 'bg-[#005C84]/10 border-[#005C84] shadow-md scale-[1.02] ring-1 ring-[#005C84]/30'
                                : isDark 
                                  ? 'bg-[#030914]/70 border-[#005C84]/20 hover:border-[#00C6D7]/40 hover:bg-[#005C84]/10' 
                                  : 'bg-slate-50 border-slate-200 hover:border-[#005C84]/30 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                idx === 0 
                                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black' 
                                  : idx === 1 
                                  ? 'bg-slate-200 text-slate-900 font-bold' 
                                  : 'bg-slate-700 text-white'
                              }`}>
                                {idx === 0 ? '⭐ Oferta Principal' : idx === 1 ? '🥈 Opción 2' : '🥉 Opción 3'}
                              </span>
                            </div>

                            <h5 className={`text-xs font-bold truncate mt-1 ${
                              isSelected ? (isDark ? 'text-[#00C6D7]' : 'text-[#005C84]') : (isDark ? 'text-white' : 'text-[#002D42]')
                            }`}>
                              {off.nombre_oferta}
                            </h5>

                            <div className={`flex items-center justify-between text-[11px] mt-2 pt-2 border-t font-mono ${
                              isDark ? 'border-[#005C84]/20' : 'border-slate-200'
                            }`}>
                              <span className="font-bold text-[#7AB800]">S/ {precio}/m</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* #1 HERO CARD: PITCH RECOMENDADO DESTACADO */}
                  <div className={`rounded-3xl p-6 shadow-2xl space-y-4 relative overflow-hidden border-2 transition-all duration-300 ${
                    isDark 
                      ? 'bg-gradient-to-r from-[#061426] via-[#005C84]/25 to-[#061426] border-[#00C6D7]/50 shadow-[0_0_30px_rgba(0,198,215,0.15)]' 
                      : 'bg-gradient-to-r from-white via-sky-50/50 to-white border-[#005C84]/40 shadow-xl shadow-[#005C84]/10'
                  }`}>
                    <div className={`flex items-center justify-between pb-3 border-b ${
                      isDark ? 'border-[#005C84]/30' : 'border-slate-200'
                    }`}>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#00C6D7] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#00C6D7] animate-pulse" />
                        Speech de Venta Recomendado (Motor NBO v2)
                      </span>
                      <span className="text-[10px] font-mono text-[#7AB800] bg-[#7AB800]/15 px-2.5 py-1 rounded-full border border-[#7AB800]/30 font-bold">
                        Reglas Oficiales
                      </span>
                    </div>

                    <div className={`border rounded-2xl p-4 shadow-inner relative ${
                      isDark 
                        ? 'bg-[#030914]/80 border-[#00C6D7]/30' 
                        : 'bg-white border-[#005C84]/20 shadow-sm'
                    }`}>
                      <p className={`text-sm font-medium italic leading-relaxed ${isDark ? 'text-slate-100' : 'text-[#002D42]'}`}>
                        "{currentOffer?.vista_asesor?.speech?.texto || currentOffer?.speech_asesor || 'Estimado cliente, tenemos una oferta especial para mejorar su plan con mayores beneficios y tarifa preferencial.'}"
                      </p>
                    </div>

                    {decision?.mensaje_asesor && (
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-500 font-medium flex items-center gap-2">
                        <span className="font-bold">Guía Comercial:</span> {decision.mensaje_asesor}
                      </div>
                    )}
                  </div>

                  {/* 3 Quick Replies de Apoyo */}
                  <div className={`rounded-3xl p-5 space-y-3 border transition-all duration-300 ${
                    isDark ? 'bg-[#061426]/85 border-[#005C84]/35' : 'bg-white border-[#005C84]/15 shadow-md'
                  }`}>
                    <div className={`flex items-center justify-between pb-2 border-b ${
                      isDark ? 'border-[#005C84]/20' : 'border-slate-100'
                    }`}>
                      <h3 className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                        <TrendingUp className="w-3.5 h-3.5 text-[#7AB800]" />
                        Argumentos Rápidos de Apoyo
                      </h3>
                    </div>

                    <div className="space-y-2 mt-1">
                      {currentOffer?.quick_replies?.map((rep, idx) => (
                        <div key={idx} className={`p-2.5 rounded-xl border text-[11px] flex items-start gap-2 ${
                          isDark ? 'bg-[#030914]/80 border-[#005C84]/20 text-slate-300' : 'bg-slate-50 border-slate-200 text-[#515559]'
                        }`}>
                          <span className="w-4 h-4 rounded-full bg-[#00C6D7]/20 text-[#00C6D7] font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-tight">{rep}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Alert */}
                  {feedbackMsg && (
                    <div className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold animate-fadeIn ${
                      feedbackMsg.type === 'success' 
                        ? 'bg-[#7AB800]/20 text-[#7AB800] border border-[#7AB800]/40' 
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}>
                      <div className="flex items-center gap-2">
                        {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        <span>{feedbackMsg.text}</span>
                      </div>
                      <span className="text-[10px] opacity-80 font-mono">Trazabilidad E2E Movistar</span>
                    </div>
                  )}

                  {/* Bottom Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                    <button 
                      onClick={() => setIsRebateOpen(true)}
                      className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      Objeción / No Interesado (Rebate IA)
                    </button>

                    <button 
                      disabled={!isSellAllowed}
                      onClick={async () => {
                        await api.registrarGestion({
                          cliente_id: rawClient.cliente_id,
                          canal: 'Tienda',
                          oferta_id: currentOffer.oferta_id,
                          oferta_nombre: currentOffer.nombre_oferta,
                          es_movistar_total: currentOffer.es_movistar_total || currentOffer.oferta_id.startsWith("OF020") || currentOffer.oferta_id.startsWith("OF021") || currentOffer.oferta_id.startsWith("OF022"),
                          estado: 'ACEPTADA',
                          precio_oferta: currentOffer.precio_mensual || currentOffer.precio_promocional,
                          ahorro_pct: currentOffer.ahorro_pct
                        });
                        setFeedbackMsg({ type: 'success', text: `¡Venta Presencial exitosa! Registrada para ${rawClient.cliente_id} (${currentOffer.nombre_oferta}).` });
                        setTimeout(() => setFeedbackMsg(null), 5000);
                      }}
                      className={`w-full sm:w-auto font-black text-xs px-6 py-3 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                        !isSellAllowed 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                          : 'bg-[#7AB800] hover:bg-[#6ba300] text-slate-950 shadow-[#7AB800]/25 hover:scale-[1.02] active:scale-[0.98]'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isActionBlocked ? 'Venta Bloqueada por Regla' : 'Venta Exitosa (Registrar)'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className={`h-64 flex flex-col items-center justify-center text-center p-8 rounded-3xl border ${
              isDark ? 'bg-[#061426]/40 border-[#005C84]/30' : 'bg-white border-slate-200'
            }`}>
              <Search className="w-10 h-10 text-[#00C6D7] mb-2 opacity-60" />
              <h3 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-[#005C84]'}`}>
                Consulte un Cliente en la Barra Superior
              </h3>
              <p className={`text-xs max-w-sm mt-1 ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
                Ingrese el DNI del cliente para iniciar la atención presencial y consultar el Top de ofertas NBO.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Rebate Modal */}
      {clienteActual && currentOffer && (
        <RebateModal
          isOpen={isRebateOpen}
          onClose={() => setIsRebateOpen(false)}
          cliente={clienteActual}
          oferta={currentOffer}
          canal="Tienda"
          onConfirmReject={async (motivo) => {
            await api.registrarGestion({
              cliente_id: clienteActual.cliente_id,
              canal: 'Tienda',
              oferta_id: currentOffer.oferta_id,
              oferta_nombre: currentOffer.nombre_oferta,
              es_movistar_total: currentOffer.es_movistar_total || false,
              estado: 'RECHAZADA',
              motivo_rechazo: motivo,
              precio_oferta: currentOffer.precio_promocional,
              ahorro_pct: currentOffer.ahorro_pct
            });
            setFeedbackMsg({ type: 'reject', text: `Rechazo registrado para ${clienteActual.cliente_id}. Motivo: ${motivo}` });
            setTimeout(() => setFeedbackMsg(null), 5000);
          }}
          onAcceptAfterRebate={async () => {
            await api.registrarGestion({
              cliente_id: clienteActual.cliente_id,
              canal: 'Tienda',
              oferta_id: currentOffer.oferta_id,
              oferta_nombre: currentOffer.nombre_oferta,
              es_movistar_total: currentOffer.es_movistar_total || false,
              estado: 'ACEPTADA',
              precio_oferta: currentOffer.precio_promocional,
              ahorro_pct: currentOffer.ahorro_pct
            });
            setFeedbackMsg({ type: 'success', text: `¡Rebate Exitoso en Tienda! Venta salvada para ${clienteActual.cliente_id}.` });
            setTimeout(() => setFeedbackMsg(null), 5000);
          }}
        />
      )}

    </div>
  );
}

export default CanalTienda;
