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
  Radio,
  BrainCircuit,
  Award,
  AlertCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { MOCK_CLIENTES } from '../data/mockData';
import { api } from '../services/api';
import MotorAnalisisBadge from './MotorAnalisisBadge';
import RebateModal from './RebateModal';
import { SpeechTranscriber } from './SpeechTranscriber';
import { useTheme } from '../context/ThemeContext';

export function CanalCallOut() {
  const [clientes, setClientes] = useState(MOCK_CLIENTES);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isRebateOpen, setIsRebateOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [speechAnalisis, setSpeechAnalisis] = useState(null);
  const [isSpeechAnalyzing, setIsSpeechAnalyzing] = useState(false);
  const { isDark } = useTheme();

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

  const motor = selectedCliente?.motor_nbo;
  const decision = motor?.decision_comercial;
  const topNBO = motor?.top_3?.[0] || selectedCliente?.ofertas_nbo?.[0];
  const alternativas = motor?.top_3?.slice(1) || [];
  const rebateOffer = alternativas[0] || null;

  const handleAnalisisSpeechCompletado = async (payload) => {
    setIsSpeechAnalyzing(true);
    try {
      const analisis = await api.analizarCallOut({
        cliente_id: selectedCliente.cliente_id,
        oferta_inicial: topNBO?.nombre_oferta || "Plan Móvil Ilimitado",
        oferta_rebate: rebateOffer?.nombre_oferta || "Movistar Total Plus",
        transcripcion: payload.transcripcion,
        duracion_seg: payload.duracion_seg
      });
      setSpeechAnalisis(analisis);

      // Auto-registrar la gestión en la bitácora E2E si el LLM detecta un cierre claro
      if (analisis.efectividad_rebate === 'ALTA_CONVERSION') {
        await api.registrarGestion({
          cliente_id: selectedCliente.cliente_id,
          canal: 'Call Out',
          oferta_id: rebateOffer?.oferta_id || topNBO?.oferta_id || 'OF021',
          oferta_nombre: rebateOffer?.nombre_oferta || 'Movistar Total Plus',
          es_movistar_total: true,
          estado: 'ACEPTADA',
          precio_oferta: rebateOffer?.precio_mensual || 123.44,
          ahorro_pct: rebateOffer?.ahorro_pct || 35
        });
        setFeedbackMsg({
          type: 'success',
          text: `¡Rebate Convertido con Éxito! Se unificó cliente ${selectedCliente.cliente_id} a Movistar Total.`
        });
      } else if (analisis.efectividad_rebate === 'RECHAZO_TOTAL') {
        await api.registrarGestion({
          cliente_id: selectedCliente.cliente_id,
          canal: 'Call Out',
          oferta_id: topNBO?.oferta_id || 'OF004',
          oferta_nombre: topNBO?.nombre_oferta || 'Plan Movil',
          es_movistar_total: false,
          estado: 'RECHAZADA',
          motivo_rechazo: analisis.motivo_rechazo_inicial || 'Compromiso con otro operador',
          precio_oferta: topNBO?.precio_mensual || 0,
          ahorro_pct: 0
        });
        setFeedbackMsg({
          type: 'reject',
          text: `Rechazo registrado para ${selectedCliente.cliente_id}. Causa: ${analisis.motivo_rechazo_inicial}`
        });
      }
    } catch (error) {
      console.error("Error en análisis speech Call Out:", error);
    } finally {
      setIsSpeechAnalyzing(false);
    }
  };

  const getEfectividadBadge = (efectividad, score) => {
    if (efectividad === 'ALTA_CONVERSION') {
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40', label: '🎯 Rebate Altamente Efectivo (Cierre Exitoso)' };
    }
    if (efectividad === 'OBJECION_PERSISTENTE') {
      return { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40', label: '⏳ Interés Parcial / Requiere Seguimiento' };
    }
    if (efectividad === 'RECHAZO_TOTAL') {
      return { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40', label: '🛑 Rechazo Inamovible (Competencia / Permanencia)' };
    }
    return { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700', label: 'ℹ️ Rebate No Aplicado' };
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-6">
      
      {/* Header Compact with Integrated Search */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3 transition-colors duration-300 ${
        isDark ? 'border-[#005C84]/20' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-500 font-bold">
            <PhoneOutgoing className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-lg font-bold leading-none ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                Módulo Call Center Outbound
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                isDark 
                  ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' 
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}>
                Speech Analytics & Auditoría Rebate
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
              Marcación proactiva con transcripción en vivo y evaluación de efectividad del Rebate con LLM
            </p>
          </div>
        </div>

        {/* Integrated Search Bar & Lead Stats in Header */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Search className={`absolute left-3 w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value.slice(0, 9))}
              maxLength={9}
              placeholder="Filtrar por ID (máx 9)..."
              className={`w-48 sm:w-60 text-xs font-mono pl-8 pr-7 py-1.5 rounded-xl outline-none transition shadow-inner border ${
                isDark 
                  ? 'bg-[#030914] border-[#005C84]/40 focus:border-purple-400 text-white' 
                  : 'bg-white border-slate-300 focus:border-purple-600 text-slate-900'
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
              ? 'bg-[#061426] border-[#005C84]/30 text-purple-300' 
              : 'bg-purple-50 border-purple-200 text-purple-700'
          }`}>
            <Radio className="w-2.5 h-2.5 animate-ping text-purple-500" />
            <span>Outbound CTI Conectado</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Lead Priority List & Prospect Info (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Priority Call Queue */}
          <div className={`border rounded-2xl p-3.5 shadow-xl space-y-2 transition-all duration-300 ${
            isDark 
              ? 'bg-[#061426]/85 border-[#005C84]/35 shadow-black/40' 
              : 'bg-white border-[#005C84]/15 shadow-[#005C84]/10'
          }`}>
            <div className="flex items-center justify-between">
              <label className={`block text-[11px] font-bold uppercase tracking-wider ${
                isDark ? 'text-slate-300' : 'text-[#005C84]'
              }`}>
                Leads Priorizados (NBO Propensión)
              </label>
              <span className="text-[10px] text-purple-500 font-mono font-bold">
                {clientesOrdenados.length} en cola
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
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />
                  Cargando leads de emisión...
                </div>
              ) : (
                clientesOrdenados.map((cli) => {
                  const isSelected = selectedCliente?.cliente_id === cli.cliente_id;
                  const isTargetMT = cli.es_target_movistar_total || cli.elegible_mt;

                  return (
                    <div
                      key={cli.cliente_id || cli.dni}
                      onClick={() => {
                        setSelectedCliente(cli);
                        setSpeechAnalisis(null);
                      }}
                      className={`p-2.5 transition cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected 
                          ? isDark 
                            ? 'bg-purple-950/40 border-l-4 border-l-purple-500' 
                            : 'bg-purple-50 border-l-4 border-l-purple-600'
                          : isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-100'
                      }`}
                    >
                      <div className="min-w-0">
                        <h4 className={`text-xs font-bold truncate ${
                          isSelected 
                            ? (isDark ? 'text-purple-300' : 'text-purple-700') 
                            : (isDark ? 'text-white' : 'text-[#002D42]')
                        }`}>
                          {cli.nombre || cli.cliente_id}
                        </h4>
                        <div className={`text-[10px] font-mono flex items-center gap-1.5 mt-0.5 ${
                          isDark ? 'text-slate-400' : 'text-[#515559]'
                        }`}>
                          <span>ID: {cli.cliente_id}</span>
                          <span>•</span>
                          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Score: {((cli.score_propension || 0.75) * 100).toFixed(0)}%</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${
                        isTargetMT 
                          ? isDark 
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                            : 'bg-[#7AB800]/20 text-[#7AB800] border border-[#7AB800]/30 font-bold'
                          : isDark 
                            ? 'bg-purple-500/20 text-purple-300' 
                            : 'bg-purple-100 text-purple-700'
                      }`}>
                        {isTargetMT ? 'Target MT' : 'Upgrade'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Lead Details */}
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
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shadow-md">
                    {selectedCliente.nombre ? selectedCliente.nombre[0] : 'L'}
                  </div>
                  <div>
                    <h3 className={`font-bold text-xs leading-tight ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                      {selectedCliente.nombre || selectedCliente.cliente_id}
                    </h3>
                    <p className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
                      Línea: {selectedCliente.telefono || '987-654-321'}
                    </p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isDark 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-[#7AB800]/20 text-[#7AB800] border border-[#7AB800]/30'
                }`}>
                  Propensión: {((selectedCliente.score_propension || 0.78) * 100).toFixed(0)}%
                </span>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className={`p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>Gasto Actual (ARPU)</span>
                  <span className={`font-bold truncate block ${isDark ? 'text-white' : 'text-[#002D42]'}`}>
                    {selectedCliente.plan_actual_nombre || selectedCliente.plan_actual_id || 'Plan Móvil'}
                  </span>
                  <span className={`font-mono text-[10px] font-semibold ${isDark ? 'text-[#00C6D7]' : 'text-[#005C84]'}`}>
                    S/ {Number(selectedCliente.plan_actual_precio || selectedCliente.monto_facturado_prom || 0).toFixed(2)}/mes
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>Líneas Móviles</span>
                  <span className={`font-bold block ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                    {selectedCliente.num_lineas || 1} activa(s)
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {selectedCliente.tiene_internet ? 'Tiene Hogar' : 'Sin Fibra'}
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>Consumo Promedio</span>
                  <span className={`font-bold text-xs block font-mono ${isDark ? 'text-[#00C6D7]' : 'text-[#005C84]'}`}>
                    {Number(selectedCliente.consumo_datos_gb_prom || 0).toFixed(2)} GB
                  </span>
                  <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Datos móviles</span>
                </div>

                <div className={`p-2.5 rounded-xl border ${
                  isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>Antigüedad</span>
                  <span className={`font-bold block ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{selectedCliente.antiguedad_meses || 12} meses</span>
                  <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Permanencia</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Speech Transcriber, LLM Post-Hoc & Sales Pitch (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-4">
          {selectedCliente && topNBO ? (
            <div className="space-y-4 animate-fadeIn">
              
              {/* 🎙️ WIDGET 1: Transcriptor Speech-to-Text en Vivo (Outbound) */}
              <SpeechTranscriber
                tipo="call_out"
                clienteId={selectedCliente.cliente_id}
                ofertaInicial={topNBO.nombre_oferta}
                ofertaRebate={rebateOffer?.nombre_oferta || "Movistar Total Plus"}
                onAnalisisCompletado={handleAnalisisSpeechCompletado}
                isAnalyzing={isSpeechAnalyzing}
              />

              {/* 🧠 WIDGET 2: Panel de Análisis Post-Hoc LLM (Call Out) */}
              {speechAnalisis && (
                <div className={`border rounded-2xl p-5 shadow-xl space-y-4 animate-fadeIn transition-all duration-300 ${
                  isDark 
                    ? 'bg-gradient-to-br from-[#061426] via-purple-950/20 to-[#061426] border-purple-500/40 shadow-black/40' 
                    : 'bg-gradient-to-br from-white via-purple-50/30 to-white border-purple-200 shadow-purple-500/5'
                }`}>
                  <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${
                    isDark ? 'border-purple-500/20' : 'border-purple-100'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-500">
                        <BrainCircuit className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                          Auditoría Post-Hoc de Venta & Rebate (LLM Outbound)
                          <MotorAnalisisBadge motor={speechAnalisis.motor_analisis} />
                        </h4>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
                          Evaluación de la objeción inicial y conversión del rebate de contingencia
                        </p>
                      </div>
                    </div>

                    {/* Badge de Efectividad del Rebate */}
                    {(() => {
                      const badge = getEfectividadBadge(speechAnalisis.efectividad_rebate, speechAnalisis.score_efectividad_rebate);
                      return (
                        <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${badge.bg} ${badge.text} ${badge.border} flex items-center gap-2 shadow-sm`}>
                          <span>{badge.label}</span>
                          <span className={`font-mono text-sm px-1.5 py-0.5 rounded ${
                            isDark ? 'bg-black/40' : 'bg-white/80 shadow-xs'
                          }`}>
                            {((speechAnalisis.score_efectividad_rebate || 0) * 100).toFixed(0)}% Éxito
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Variables Clasificadas Call Out */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                    {/* Variable 1: Motivo de Rechazo Inicial */}
                    <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                      isDark ? 'bg-[#030914]/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        <XCircle className="w-3.5 h-3.5 text-rose-500" /> Motivo de Rechazo de Oferta Inicial:
                      </span>
                      <div className={`text-sm font-bold px-3 py-1.5 rounded-lg border inline-block ${
                        isDark ? 'bg-rose-950/40 text-rose-200 border-rose-800/60' : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        ⚠️ {speechAnalisis.motivo_rechazo_inicial || 'Precio muy alto'}
                      </div>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <strong className={isDark ? 'text-slate-400' : 'text-slate-500'}>Oferta Inicial:</strong> {topNBO.nombre_oferta}
                      </p>
                    </div>

                    {/* Variable 2: Efectividad del Rebate */}
                    <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                      isDark ? 'bg-[#030914]/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        <Award className="w-3.5 h-3.5 text-emerald-500" /> Oferta de Contingencia (Rebate) Aplicada:
                      </span>
                      <div className={`text-sm font-bold px-3 py-1.5 rounded-lg border inline-block ${
                        isDark ? 'text-emerald-300 bg-emerald-950/40 border-emerald-800/60' : 'text-emerald-900 bg-emerald-50 border-emerald-200'
                      }`}>
                        ✨ {speechAnalisis.oferta_rebate_ofrecida || rebateOffer?.nombre_oferta || 'Movistar Total Plus'}
                      </div>
                      <p className={`text-xs mt-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <strong className={isDark ? 'text-slate-400' : 'text-slate-500'}>Pivote del Asesor:</strong> {speechAnalisis.rebate_aplicado ? 'Rebate presentado correctamente' : 'No se ejecutó rebate'}
                      </p>
                    </div>
                  </div>

                  {/* Resumen y Feedback de Coaching */}
                  <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                    isDark ? 'bg-[#030914]/70 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <p className={`leading-relaxed ${isDark ? 'text-slate-200' : 'text-[#002D42]'}`}>
                      <strong className={isDark ? 'text-purple-400' : 'text-purple-700'}>Resumen de la Interacción:</strong> {speechAnalisis.resumen_interaccion}
                    </p>

                    {speechAnalisis.argumentos_asesor_evaluados && speechAnalisis.argumentos_asesor_evaluados.length > 0 && (
                      <div className="pt-1">
                        <span className={`text-[11px] font-bold block mb-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          Aciertos del Asesor:
                        </span>
                        <ul className={`list-disc list-inside space-y-0.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {speechAnalisis.argumentos_asesor_evaluados.map((arg, idx) => (
                            <li key={idx}>{arg}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {speechAnalisis.oportunidad_mejora_asesor && (
                      <div className={`p-2.5 rounded-lg border text-xs ${
                        isDark 
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' 
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        <strong>Oportunidad de Mejora / Coaching:</strong> {speechAnalisis.oportunidad_mejora_asesor}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Main NBO Recommendation Box */}
              <div className={`border rounded-2xl p-5 shadow-xl relative overflow-hidden transition-all duration-300 ${
                isDark 
                  ? 'bg-gradient-to-br from-[#061426]/90 via-[#061426]/80 to-purple-900/20 border-purple-500/40 shadow-black/40' 
                  : 'bg-gradient-to-br from-white via-purple-50/40 to-white border-purple-200 shadow-purple-500/10'
              }`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Header Oferta */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-3 h-3 fill-current" />
                        Oferta NBO Recomendada para Llamada
                      </span>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
                        {topNBO.oferta_id}
                      </span>
                    </div>

                    <h2 className={`text-xl font-black mt-1.5 ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                      {topNBO.nombre_oferta}
                    </h2>
                  </div>

                  <div className={`text-left sm:text-right p-2.5 sm:p-0 rounded-xl border sm:border-0 ${
                    isDark ? 'bg-[#030914]/60 border-slate-800' : 'bg-purple-50/70 border-purple-200'
                  }`}>
                    <div className="text-2xl font-black text-[#7AB800] leading-none mt-0.5">
                      S/ {topNBO.precio_mensual || topNBO.precio_promocional}
                      <span className={`text-[11px] font-normal ml-1 ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>/mes</span>
                    </div>
                    {topNBO.ahorro_pct > 0 && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block mt-1 ${
                        isDark 
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                          : 'text-[#7AB800] bg-[#7AB800]/15 border-[#7AB800]/30'
                      }`}>
                        Ahorro del {topNBO.ahorro_pct}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Beneficios */}
                <div className={`mt-3.5 pt-3 border-t ${isDark ? 'border-slate-800/80' : 'border-purple-100'}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${
                    isDark ? 'text-slate-400' : 'text-[#515559]'
                  }`}>
                    Razones y Beneficios Clave:
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <div className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg border ${
                      isDark 
                        ? 'text-slate-200 bg-[#030914]/60 border-slate-800/70' 
                        : 'text-[#002D42] bg-white border-purple-100 shadow-xs'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span>{topNBO.vista_asesor?.beneficio_principal || 'Excelente propuesta convergente con duplicador de gigas.'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Speech Telefónico */}
              <div className={`border rounded-2xl p-4 shadow-lg space-y-2 transition-all duration-300 ${
                isDark 
                  ? 'bg-[#061426]/85 border-[#00C6D7]/30' 
                  : 'bg-white border-[#005C84]/15 shadow-[#005C84]/10'
              }`}>
                <div className={`flex items-center justify-between pb-2 border-b ${
                  isDark ? 'border-slate-800' : 'border-slate-100'
                }`}>
                  <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                    isDark ? 'text-[#00C6D7]' : 'text-[#005C84]'
                  }`}>
                    <Sparkles className="w-3.5 h-3.5" /> Pitch Telefónico Recomendado (MoviNexo):
                  </span>
                </div>
                <p className={`text-xs leading-relaxed italic p-3.5 rounded-xl border font-medium ${
                  isDark 
                    ? 'text-slate-100 bg-[#00C6D7]/10 border-[#00C6D7]/20' 
                    : 'text-[#002D42] bg-sky-50 border-sky-200'
                }`}>
                  "{topNBO.vista_asesor?.speech?.texto || topNBO.speech_asesor || 'Buenas tardes, le saludamos de Movistar con una promoción especial personalizada para su línea.'}"
                </p>
              </div>

              {/* Feedback Alert */}
              {feedbackMsg && (
                <div className={`p-3 rounded-xl flex items-center justify-between text-xs font-bold animate-fadeIn ${
                  feedbackMsg.type === 'success' 
                    ? isDark 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : isDark 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
                    <span>{feedbackMsg.text}</span>
                  </div>
                  <span className="text-[10px] opacity-75 font-mono">Trazabilidad E2E Actualizada</span>
                </div>
              )}

              {/* Bottom Action Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-1">
                <button 
                  onClick={() => setIsRebateOpen(true)}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    isDark 
                      ? 'border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300' 
                      : 'border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-rose-500" />
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
                      precio_oferta: topNBO.precio_promocional || topNBO.precio_mensual,
                      ahorro_pct: topNBO.ahorro_pct
                    });
                    setFeedbackMsg({ type: 'success', text: `¡Venta Call Out exitosa! Registrada para ${selectedCliente.cliente_id} (${topNBO.nombre_oferta}).` });
                    setTimeout(() => setFeedbackMsg(null), 5000);
                  }}
                  className="w-full sm:w-auto bg-[#7AB800] hover:bg-[#689f00] text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Venta Exitosa (Cerrar Llamada)
                </button>
              </div>

            </div>
          ) : (
            <div className={`h-64 flex flex-col items-center justify-center text-center p-8 border rounded-2xl ${
              isDark ? 'bg-[#061426]/40 border-[#005C84]/20' : 'bg-white border-slate-200'
            }`}>
              <PhoneOutgoing className={`w-10 h-10 mb-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
              <h3 className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-[#005C84]'}`}>
                Seleccione un Lead de la Cola
              </h3>
              <p className={`text-xs max-w-sm mt-1 ${isDark ? 'text-slate-500' : 'text-[#515559]'}`}>
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
            setFeedbackMsg({ type: 'success', text: `¡Rebate Exitoso en Call Out! Venta salvada para ${selectedCliente.cliente_id}.` });
            setTimeout(() => setFeedbackMsg(null), 5000);
          }}
        />
      )}

    </div>
  );
}

export default CanalCallOut;
