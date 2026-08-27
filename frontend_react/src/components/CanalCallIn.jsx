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
  ArrowLeft,
  Headphones,
  FileText,
  ShieldAlert,
  ThumbsDown,
  ThumbsUp,
  Tag,
  Activity,
  AlertCircle,
  BrainCircuit,
  MessageSquareWarning,
  Check
} from 'lucide-react';
import { MOCK_CLIENTES } from '../data/mockData';
import { api } from '../services/api';
import MotorAnalisisBadge from './MotorAnalisisBadge';
import RebateModal from './RebateModal';
import { SpeechTranscriber } from './SpeechTranscriber';
import { useTheme } from '../context/ThemeContext';

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
  const [speechAnalisis, setSpeechAnalisis] = useState(null);
  const [isSpeechAnalyzing, setIsSpeechAnalyzing] = useState(false);
  const { isDark } = useTheme();

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
        setSelectedCliente(res);
      }
    } catch (e) {
      console.error("Error evaluando NBO:", e);
    } finally {
      setIsEvaluating(false);
      setShowNbo(true);
    }
  };

  const handleAnalisisSpeechCompletado = async (payload) => {
    setIsSpeechAnalyzing(true);
    try {
      const analisis = await api.analizarCallIn({
        cliente_id: rawClient.cliente_id,
        transcripcion: payload.transcripcion,
        duracion_seg: payload.duracion_seg
      });
      setSpeechAnalisis(analisis);

      // Si el LLM detecta insatisfacción severa o reclamo
      if (analisis.cliente_insatisfecho || analisis.score_sentimiento < 2.5) {
        let nuevoMotivo = '⚠️ Reclamo de Facturación';
        if (analisis.topico_reclamo.includes('Averia') || analisis.topico_reclamo.includes('Fibra')) {
          nuevoMotivo = '🛠️ Avería Técnica / Falla de Red';
        }
        setMotivosSeleccionados([nuevoMotivo]);
        
        // Evaluar NBO con el bloqueo correspondiente
        const res = await api.evaluarNBO(rawClient.cliente_id, 'Call In', [nuevoMotivo], {
          reclamo_activo: true,
          bloqueo_presion_activo: true,
          score_sentimiento: analisis.score_sentimiento
        });
        if (res && res.motor_nbo) {
          setSelectedCliente(res);
        }
        setShowNbo(true);
      }
    } catch (error) {
      console.error("Error en análisis speech Call In:", error);
    } finally {
      setIsSpeechAnalyzing(false);
    }
  };

  const handleResponderMT = async (valor) => {
    if (!selectedCliente?.recomendacion_id) {
      setFeedbackMsg({ type: 'error', text: 'No existe una recomendación activa para actualizar.' });
      return;
    }
    setIsEvaluating(true);
    try {
      const res = await api.enviarPreferenciaMT(selectedCliente.recomendacion_id, valor);
      if (!res?.motor_nbo) throw new Error('El motor no devolvió una recomendación actualizada.');
      setSelectedCliente(res);
      setFeedbackMsg({ type: 'success', text: 'Preferencia registrada y Top-3 recalculado.' });
    } catch (error) {
      setFeedbackMsg({ type: 'error', text: error.message });
    } finally {
      setIsEvaluating(false);
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const getSentimientoBadge = (nivel, score) => {
    if (score <= 2.0 || nivel === 'MUY_NEGATIVO') {
      return { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40', label: '😡 Muy Molesto / Churn Inminente' };
    }
    if (score <= 3.0 || nivel === 'NEGATIVO') {
      return { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40', label: '⚠️ Insatisfecho / Reclamo' };
    }
    if (score <= 4.0 || nivel === 'NEUTRO') {
      return { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/40', label: '😐 Neutro / Consulta' };
    }
    return { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40', label: '😊 Satisfecho / Receptivo' };
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-6">
      
      {/* Header Compact with Integrated Search */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3 transition-colors duration-300 ${
        isDark ? 'border-[#005C84]/20' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-500 font-bold">
            <PhoneIncoming className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-lg font-bold leading-none ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                Módulo Call Center Inbound
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                isDark 
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' 
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                Speech-to-Text & Analizador Post-Hoc
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
              Detección de motivo de reclamo, score de sentimiento e impacto en reglas NBO en tiempo real
            </p>
          </div>
        </div>

        {/* Integrated Search Bar & Line Status in Header */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Search className={`absolute left-3 w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value.slice(0, 9))}
              maxLength={9}
              placeholder="Buscar ID/DNI (máx 9)..."
              className={`w-48 sm:w-60 text-xs font-mono pl-8 pr-7 py-1.5 rounded-xl outline-none transition shadow-inner border ${
                isDark 
                  ? 'bg-[#030914] border-[#005C84]/40 focus:border-rose-400 text-white' 
                  : 'bg-white border-slate-300 focus:border-rose-600 text-slate-900'
              }`}
            />
            {searchFilter && (
              <button
                type="button"
                onClick={() => setSearchFilter('')}
                className={`absolute right-2 text-[10px] px-1 py-0.5 rounded ${
                  isDark ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-500 hover:text-slate-900 bg-slate-200'
                }`}
              >
                ✕
              </button>
            )}
          </div>

          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono ${
            isDark 
              ? 'bg-[#061426] border-[#005C84]/30 text-rose-300' 
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            <Radio className="w-2.5 h-2.5 animate-ping text-rose-500" />
            <span>Línea 104 Activa</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Queue & Client Profile (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Quick Incoming Queue */}
          <div className={`border rounded-2xl p-3.5 shadow-xl space-y-2 transition-all duration-300 ${
            isDark 
              ? 'bg-[#061426]/85 border-[#005C84]/35 shadow-black/40' 
              : 'bg-white border-[#005C84]/15 shadow-[#005C84]/10'
          }`}>
            <div className="flex items-center justify-between">
              <label className={`block text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-slate-300' : 'text-[#005C84]'
              }`}>
                Llamadas Entrantes (En Cola)
              </label>
              <span className="text-[10px] text-rose-500 font-mono font-bold">
                {clientesFiltrados.length} llamadas
              </span>
            </div>

            {/* List */}
            <div className={`max-h-[170px] overflow-y-auto divide-y rounded-xl border ${
              isDark 
                ? 'bg-[#030914]/70 border-[#005C84]/30 divide-[#005C84]/20' 
                : 'bg-slate-50 border-slate-200 divide-slate-200'
            }`}>
              {isLoading ? (
                <div className={`p-4 text-center text-xs flex items-center justify-center gap-2 ${
                  isDark ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
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
                        setSpeechAnalisis(null);
                        setMotivosSeleccionados(['📋 Consulta de Saldo / Plan']);
                      }}
                      className={`p-2.5 transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected 
                          ? isDark 
                            ? 'bg-rose-950/40 border-l-4 border-l-rose-500' 
                            : 'bg-rose-50 border-l-4 border-l-rose-600'
                          : isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-100'
                      }`}
                    >
                      <div className="min-w-0">
                        <h4 className={`text-xs font-bold truncate ${
                          isSelected 
                            ? (isDark ? 'text-rose-300' : 'text-rose-700') 
                            : (isDark ? 'text-white' : 'text-[#002D42]')
                        }`}>
                          {cli.nombre || cli.cliente_id}
                        </h4>
                        <div className={`text-[10px] font-mono flex items-center gap-1.5 mt-0.5 ${
                          isDark ? 'text-slate-400' : 'text-[#515559]'
                        }`}>
                          <span>DNI: {cli.dni || cli.cliente_id}</span>
                          <span>•</span>
                          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                            S/ {Number(cli.plan_actual_precio || cli.monto_facturado_prom || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                        cliHighRisk 
                          ? isDark 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                          : isDark 
                            ? 'bg-emerald-500/20 text-emerald-300' 
                            : 'bg-emerald-100 text-emerald-800'
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
            <div className={`border rounded-2xl p-4 space-y-3 shadow-xl transition-all duration-300 ${
              isDark 
                ? 'bg-[#061426]/85 border-[#005C84]/35 shadow-black/40' 
                : 'bg-white border-[#005C84]/15 shadow-[#005C84]/10'
            }`}>
              <div className={`flex items-center justify-between pb-2.5 border-b ${
                isDark ? 'border-[#005C84]/20' : 'border-slate-100'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
                    {rawClient.nombre ? rawClient.nombre[0] : 'C'}
                  </div>
                  <div>
                    <h3 className={`font-bold text-xs leading-tight ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                      {rawClient.nombre || rawClient.cliente_id}
                    </h3>
                    <p className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
                      Línea: {rawClient.telefono || rawClient.dni || rawClient.cliente_id}
                    </p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isHighRisk 
                    ? isDark 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse' 
                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                    : isDark 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-[#7AB800]/20 text-[#7AB800] border border-[#7AB800]/30'
                }`}>
                  Churn: {((rawClient.score_churn || 0) * 100).toFixed(0)}%
                </span>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className={`p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>Gasto Actual (ARPU)</span>
                  <span className={`font-bold truncate block ${isDark ? 'text-white' : 'text-[#002D42]'}`}>
                    {rawClient.plan_actual_nombre || rawClient.plan_actual_id || 'Plan Móvil'}
                  </span>
                  <span className={`font-mono text-[10px] font-semibold ${isDark ? 'text-[#00C6D7]' : 'text-[#005C84]'}`}>
                    S/ {Number(rawClient.plan_actual_precio || rawClient.monto_facturado_prom || 0).toFixed(2)}/mes
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>Líneas Móviles</span>
                  <span className={`font-bold block ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                    {rawClient.num_lineas || 1} activa(s)
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {rawClient.tiene_internet ? 'Tiene Hogar' : 'Sin Fibra'}
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>Consumo Promedio</span>
                  <span className={`font-bold text-xs block font-mono ${isDark ? 'text-[#00C6D7]' : 'text-[#005C84]'}`}>
                    {Number(rawClient.consumo_datos_gb_prom || 0).toFixed(2)} GB
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Datos móviles</span>
                </div>

                <div className={`p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>Antigüedad</span>
                  <span className={`font-bold block ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{rawClient.antiguedad_meses || 12} meses</span>
                  <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Permanencia</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Speech Transcriber, LLM Post-Hoc & Retention NBO (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedCliente ? (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Dynamic Early Warning Banner */}
              {isHighRisk ? (
                <div className={`border rounded-2xl p-3.5 flex items-center justify-between text-xs shadow-xl transition-all duration-300 ${
                  isDark 
                    ? 'bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-[#061426] border-rose-500/50 text-rose-200 shadow-rose-950/30' 
                    : 'bg-gradient-to-r from-rose-50 via-rose-100/50 to-white border-rose-300 text-rose-900 shadow-rose-500/10'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/30 text-rose-500 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4 animate-bounce" />
                    </div>
                    <div>
                      <h4 className={`font-bold text-xs flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-rose-900'}`}>
                        ALERTA DE RETENCIÓN PRIORITARIA: ALTO RIESGO DE BAJA
                      </h4>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-rose-300/80' : 'text-rose-800'}`}>
                        El cliente registra {rawClient.n_reclamos || 0} reclamos y un score de fuga de {((rawClient.score_churn || 0) * 100).toFixed(0)}%. No ofrecer venta agresiva; priorizar contención con beneficio exclusivo.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`border rounded-2xl p-3.5 flex items-center justify-between text-xs transition-all duration-300 ${
                  isDark 
                    ? 'bg-gradient-to-r from-emerald-950/60 via-[#061426] to-[#061426] border-emerald-500/30 text-emerald-200' 
                    : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-300 text-emerald-900'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-emerald-950'}`}>
                        CLIENTE ESTABLE: OPORTUNIDAD DE FIDELIZACIÓN / UPGRADE
                      </h4>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-emerald-800'}`}>
                        Bajo riesgo de churn. Proceder con oferta NBO de mejora de velocidad o unificación Movistar Total.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 🎙️ WIDGET 1: Transcriptor Speech-to-Text en Vivo */}
              <SpeechTranscriber
                tipo="call_in"
                clienteId={rawClient.cliente_id}
                onAnalisisCompletado={handleAnalisisSpeechCompletado}
                isAnalyzing={isSpeechAnalyzing}
              />

              {/* 🧠 WIDGET 2: Panel de Análisis Post-Hoc LLM (Call-In) */}
              {speechAnalisis && (
                <div className={`border rounded-2xl p-5 shadow-xl space-y-4 animate-fadeIn transition-all duration-300 ${
                  isDark 
                    ? 'bg-gradient-to-br from-[#061426] via-indigo-950/30 to-[#061426] border-indigo-500/40 shadow-black/40' 
                    : 'bg-gradient-to-br from-white via-indigo-50/30 to-white border-indigo-200 shadow-indigo-500/5'
                }`}>
                  <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${
                    isDark ? 'border-indigo-500/20' : 'border-indigo-100'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-500">
                        <BrainCircuit className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                          Auditoría Post-Hoc con LLM (Call Inbound)
                          <MotorAnalisisBadge motor={speechAnalisis.motor_analisis} />
                        </h4>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
                          Análisis cualitativo y cuantitativo de la conversación
                        </p>
                      </div>
                    </div>

                    {/* Badge de Sentimiento */}
                    {(() => {
                      const badge = getSentimientoBadge(speechAnalisis.nivel_sentimiento, speechAnalisis.score_sentimiento);
                      return (
                        <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${badge.bg} ${badge.text} ${badge.border} flex items-center gap-2 shadow-sm`}>
                          <span>{badge.label}</span>
                          <span className={`font-mono text-sm px-1.5 py-0.5 rounded ${
                            isDark ? 'bg-black/40' : 'bg-white/80 shadow-xs'
                          }`}>
                            {speechAnalisis.score_sentimiento} / 5.0
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Variables Clasificadas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                    {/* Variable 1: Topico de Reclamo */}
                    <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                      isDark ? 'bg-[#030914]/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        <Tag className="w-3.5 h-3.5 text-indigo-500" /> Tópico de Reclamo Clasificado:
                      </span>
                      <div className={`text-sm font-bold px-3 py-1.5 rounded-lg border inline-block ${
                        isDark ? 'text-white bg-slate-900/90 border-slate-700/60' : 'text-[#002D42] bg-white border-slate-300'
                      }`}>
                        🏷️ {speechAnalisis.topico_reclamo.replace(/_/g, ' ')}
                      </div>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <strong className={isDark ? 'text-slate-400' : 'text-slate-500'}>Problema detectado:</strong> {speechAnalisis.descripcion_problema}
                      </p>
                    </div>

                    {/* Variable 2: Score de Sentimiento & Diagnóstico */}
                    <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                      isDark ? 'bg-[#030914]/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        <Activity className="w-3.5 h-3.5 text-rose-500" /> Diagnóstico de Presión Comercial:
                      </span>
                      <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border inline-flex items-center gap-1.5 ${
                        speechAnalisis.cliente_insatisfecho 
                          ? isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-50 text-rose-800 border-rose-200'
                          : isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}>
                        {speechAnalisis.cliente_insatisfecho ? <ShieldAlert className="w-4 h-4 text-rose-500" /> : <Check className="w-4 h-4 text-emerald-500" />}
                        {speechAnalisis.cliente_insatisfecho ? 'BLOQUEO DE VENTA ACTIVO (Priorizar Atención)' : 'CLIENTE APTO PARA NBO FIDELIZACIÓN'}
                      </div>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <strong className={isDark ? 'text-slate-400' : 'text-slate-500'}>Recomendación IA:</strong> {speechAnalisis.accion_recomendada}
                      </p>
                    </div>
                  </div>

                  {/* Puntos Críticos Extraídos */}
                  {speechAnalisis.puntos_criticos && speechAnalisis.puntos_criticos.length > 0 && (
                    <div className={`p-3 rounded-xl border text-xs ${
                      isDark ? 'bg-[#030914]/70 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-[11px] font-bold block mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        Detonantes y Citas Clave de la Llamada:
                      </span>
                      <ul className={`list-disc list-inside space-y-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {speechAnalisis.puntos_criticos.map((pt, idx) => (
                          <li key={idx} className="italic">"{pt}"</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Panel de Tipificación Manual / Evaluación NBO */}
              {!showNbo ? (
                <div className={`border rounded-2xl p-6 text-center shadow-lg space-y-5 transition-all duration-300 ${
                  isDark 
                    ? 'bg-[#061426]/85 border-[#005C84]/35 shadow-black/40' 
                    : 'bg-white border-[#005C84]/15 shadow-[#005C84]/10'
                }`}>
                  <div>
                    <h3 className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                      Atención Telefónica en Curso
                    </h3>
                    <p className={`text-xs max-w-lg mx-auto ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
                      Atienda la solicitud principal de la llamada y seleccione los motivos identificados para que el Motor NBO evalúe la viabilidad de una oferta.
                    </p>
                  </div>

                  {/* Panel de Tipificación Rápida */}
                  <div className={`text-left p-4 rounded-xl border max-w-xl mx-auto space-y-2.5 ${
                    isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                      isDark ? 'text-slate-300' : 'text-[#005C84]'
                    }`}>
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
                                  ? isDark ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-rose-100 border-rose-400 text-rose-900 font-bold'
                                  : isDark ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                                : isDark ? 'bg-[#061426] border-[#005C84]/30 text-slate-400 hover:border-[#00C6D7]' : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
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
                    className="bg-[#7AB800] hover:bg-[#689f00] disabled:opacity-50 text-slate-950 font-black text-xs px-6 py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
                  >
                    {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Abrir Recomendación Comercial (Consultar NBO)</span>
                  </button>
                </div>
              ) : isActionBlocked ? (
                /* Bloqueo Comercial según Regla Oficial */
                <div className={`border rounded-2xl p-6 text-center shadow-xl space-y-4 animate-fadeIn transition-all duration-300 ${
                  isDark 
                    ? 'bg-gradient-to-br from-rose-950/60 via-[#061426] to-[#061426] border-rose-500/50 shadow-black/40' 
                    : 'bg-gradient-to-br from-rose-50 via-white to-white border-rose-300 shadow-rose-500/10'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-sm">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-500 border border-rose-500/30">
                      Regla de Protección al Cliente
                    </span>
                    <h3 className={`font-bold text-base mt-2 ${isDark ? 'text-white' : 'text-rose-900'}`}>
                      Acción Comercial Restringida: {decision?.accion || 'NO_OFRECER'}
                    </h3>
                    <p className={`text-xs max-w-md mx-auto mt-1 ${isDark ? 'text-rose-300/90' : 'text-rose-700'}`}>
                      {decision?.mensaje_asesor || 'Se ha detectado una incidencia o queja activa en la llamada. La regla oficial de Movistar prohíbe presentar ofertas de venta agresiva en este contexto.'}
                    </p>
                  </div>

                  <div className={`p-3.5 rounded-xl border text-left text-xs max-w-md mx-auto ${
                    isDark ? 'bg-[#030914]/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-[#002D42]'
                  }`}>
                    <span className="font-bold text-rose-500 block mb-1">Directriz para el Asesor:</span>
                    Enfocarse al 100% en solucionar el reclamo/avería del cliente. Registrar la atención y despedirse cordialmente sin prescribir promociones.
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setShowNbo(false)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 mx-auto cursor-pointer border ${
                        isDark 
                          ? 'bg-[#0a1b30] hover:bg-[#0e2440] text-slate-200 border-[#005C84]/40' 
                          : 'bg-slate-100 hover:bg-slate-200 text-[#002D42] border-slate-300'
                      }`}
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Regresar a la Atención / Cambiar Motivo
                    </button>
                  </div>
                </div>
              ) : topNBO ? (
                <>
                  {/* Main NBO Recommendation Box */}
                  <div className={`border rounded-2xl p-5 shadow-xl relative overflow-hidden transition-all duration-300 ${
                    isDark 
                      ? 'bg-gradient-to-br from-[#061426]/95 via-[#061426]/80 to-rose-900/15 border-rose-500/30 shadow-black/40' 
                      : 'bg-gradient-to-br from-white via-rose-50/30 to-white border-rose-200 shadow-rose-500/5'
                  }`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className={`flex items-center justify-between pb-3 mb-3 border-b ${
                      isDark ? 'border-slate-800' : 'border-rose-100'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-3 h-3 fill-current" />
                          Oferta de Retención / Solución NBO
                        </span>
                        <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>{topNBO.oferta_id}</span>
                      </div>
                      <button
                        onClick={() => setShowNbo(false)}
                        className={`text-[11px] flex items-center gap-1 cursor-pointer font-semibold ${
                          isDark ? 'text-slate-400 hover:text-white' : 'text-[#005C84] hover:text-[#0078A8]'
                        }`}
                      >
                        <ArrowLeft className="w-3 h-3" /> Modificar Motivo
                      </button>
                    </div>

                    {/* Pregunta Inteligente MT */}
                    {preguntaMT && (preguntaMT.requiere_pregunta || preguntaMT.estado === 'PENDIENTE') && (
                      <div className={`border rounded-xl p-4 mb-4 ${
                        isDark ? 'bg-indigo-950/60 border-indigo-500/50' : 'bg-indigo-50 border-indigo-200'
                      }`}>
                        <h3 className={`font-bold text-xs mb-2 flex items-center gap-2 ${
                          isDark ? 'text-white' : 'text-indigo-900'
                        }`}>
                          <User className="w-4 h-4 text-indigo-500" />
                          Pregunta de Perfilamiento Requerida:
                        </h3>
                        <p className={`text-sm font-medium italic mb-4 ${
                          isDark ? 'text-indigo-200' : 'text-indigo-800'
                        }`}>"{preguntaMT.pregunta}"</p>
                        <div className="flex flex-wrap gap-2">
                          {preguntaMT.opciones.map((opc, idx) => (
                            <button 
                              key={idx} 
                              onClick={() => handleResponderMT(opc.preferencia || opc.valor)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-md"
                            >
                              {opc.texto || opc.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* NBO Product Details */}
                    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border mb-4 ${
                      isDark ? 'bg-[#030914]/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div>
                        <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#005C84]'}`}>{topNBO.nombre_oferta}</h3>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>{topNBO.categoria_oferta || 'Convergencia / Retención'}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs block ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>Precio Mensual</span>
                        <span className="text-lg font-bold text-[#7AB800] font-mono">
                          S/ {topNBO.precio_mensual || topNBO.precio_promocional}/mes
                        </span>
                      </div>
                    </div>

                    {/* Speech Comercial Generado */}
                    <div className={`p-4 rounded-xl border space-y-2 ${
                      isDark ? 'bg-[#030914]/80 border-slate-800' : 'bg-rose-50/50 border-rose-100'
                    }`}>
                      <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Speech de Retención Recomendado:
                      </span>
                      <p className={`text-xs leading-relaxed italic ${isDark ? 'text-slate-200' : 'text-[#002D42]'}`}>
                        "{topNBO.vista_asesor?.speech?.texto || topNBO.speech_asesor || 'Señor(a), por su fidelidad tenemos preparado un beneficio convergente exclusivo para unificar sus boletas con ahorro inmediato.'}"
                      </p>
                    </div>
                  </div>

                  {/* Alternativas de Rebate Top-2 y Top-3 */}
                  {alternativas.length > 0 && (
                    <div className="space-y-2">
                      <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                        isDark ? 'text-slate-400' : 'text-[#515559]'
                      }`}>
                        Alternativas de Rebate (Top-2 & Top-3):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {alternativas.map((alt, idx) => (
                          <div key={idx} className={`border rounded-xl p-3 space-y-1 ${
                            isDark ? 'bg-[#061426]/60 border-slate-800/80' : 'bg-white border-slate-200 shadow-xs'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold font-mono ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
                                Opción #{idx + 2}
                              </span>
                              <span className="text-xs font-bold text-[#7AB800] font-mono">
                                S/ {alt.precio_mensual || alt.precio_promocional}/m
                              </span>
                            </div>
                            <h4 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-[#005C84]'}`}>{alt.nombre_oferta}</h4>
                            <p className={`text-[11px] italic truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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
                      feedbackMsg.type === 'success' 
                        ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : isDark ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-rose-50 text-rose-900 border border-rose-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                        <span>{feedbackMsg.text}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setIsRebateOpen(true)}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                        isDark 
                          ? 'border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300' 
                          : 'border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800'
                      }`}
                    >
                      <XCircle className="w-4 h-4 text-rose-500" />
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
                      className={`font-black text-xs px-6 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer ${
                        !isSellAllowed 
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                          : 'bg-[#7AB800] hover:bg-[#689f00] text-slate-950 shadow-sm'
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
            <div className={`h-64 flex flex-col items-center justify-center text-center p-8 rounded-2xl border ${
              isDark ? 'border-[#005C84]/20 bg-[#061426]/30' : 'border-slate-200 bg-white'
            }`}>
              <Search className={`w-8 h-8 mb-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
              <h3 className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-[#005C84]'}`}>
                Seleccione una llamada en cola
              </h3>
              <p className={`text-xs mt-1 max-w-sm ${isDark ? 'text-slate-500' : 'text-[#515559]'}`}>
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
