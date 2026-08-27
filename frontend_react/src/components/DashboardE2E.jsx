import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, CheckCircle2, XCircle, ShieldCheck, 
  RefreshCw, Award, ArrowUpRight, BarChart3, PieChart as PieIcon,
  Activity, Layers, Filter, Eye, AlertTriangle, ChevronRight, Zap,
  Headphones, BrainCircuit, MessageSquare, Tag, Radio, Database
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, CartesianGrid,
  FunnelChart, Funnel, LabelList
} from 'recharts';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

// Paleta de colores corporativa Movistar enriquecida
const MOVISTAR_COLORS = ['#005C84', '#0078A8', '#00C6D7', '#7AB800', '#F59E0B', '#EF4444', '#8B5CF6'];
const FUNNEL_COLORS = ['#005C84', '#0078A8', '#00A8C6', '#00C6D7', '#7AB800'];

export default function DashboardE2E() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [funnelViewMode, setFunnelViewMode] = useState('both'); // 'both' | 'chart' | 'steps'
  const [scope, setScope] = useState('consolidado'); // 'consolidado' | 'historico' | 'sesion'
  const { isDark } = useTheme();

  const fetchMetrics = async () => {
    setLoading(true);
    const metrics = await api.getDashboardMetrics(scope);
    if (metrics) {
      setData(metrics);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
    // Polling cada 15 segundos para actualización en vivo
    const interval = setInterval(fetchMetrics, 15000);
    return () => clearInterval(interval);
  }, [scope]);

  if (loading && !data) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[500px] ${isDark ? 'text-slate-200' : 'text-[#005C84]'}`}>
        <RefreshCw className="w-12 h-12 animate-spin text-[#00C6D7] mb-4" />
        <p className="font-extrabold text-xl tracking-tight">Cargando métricas del Funnel E2E Movistar...</p>
        <span className="text-sm font-medium opacity-70 mt-1">Conectando con el motor de personalización e IA</span>
      </div>
    );
  }

  const kpis = data?.kpis || {
    total: 0,
    contactados: 0,
    aceptadas: 0,
    rechazadas: 0,
    tasa_conversion: 0,
    share_mt: 0,
    mt_aceptadas: 0
  };

  // Procedencia real de lo que se está viendo, informada por el backend
  const fuente = data?.fuente || null;
  const scopeActivo = data?.scope || scope;
  const nFmt = (n) => (n ?? 0).toLocaleString('es-PE');

  const SCOPES = [
    { id: 'consolidado', label: 'Consolidado', hint: 'Histórico de campañas + gestiones registradas en esta sesión' },
    { id: 'historico', label: 'Histórico', hint: 'Solo el histórico real de campañas del backend' },
    { id: 'sesion', label: 'Sesión en vivo', hint: 'Solo las gestiones registradas desde la plataforma' }
  ];

  const descripcionFuente = () => {
    if (!fuente) return 'Esperando respuesta del backend…';
    const h = fuente.historico;
    const vivo = `${nFmt(fuente.gestiones_en_vivo)} gestiones en vivo`;
    if (scopeActivo === 'sesion') {
      return `${vivo} · registradas end-to-end desde los 5 canales`;
    }
    if (!h) {
      return `Histórico no disponible en este entorno · mostrando ${vivo}`;
    }
    const periodo = `${h.periodo_desde} a ${h.periodo_hasta}`;
    const base = `${nFmt(h.ofrecimientos)} ofrecimientos reales · ${nFmt(h.clientes_unicos)} clientes · ${periodo} · ${h.archivo}`;
    return scopeActivo === 'consolidado' ? `${base} + ${vivo}` : base;
  };

  const rawFunnel = data?.funnel || [];
  const canales = data?.canales || [];
  const motivosRechazo = (data?.motivos_rechazo || []).sort((a, b) => b.cantidad - a.cantidad);
  const ultimas = data?.ultimas_gestiones || [];

  // Calcular total de rechazos para el centro del Donut
  const totalRechazos = motivosRechazo.reduce((sum, item) => sum + item.cantidad, 0) || kpis.rechazadas || 0;

  // Formatear datos para el FunnelChart de Recharts
  const maxFunnelVal = rawFunnel[0]?.cantidad || 1;
  const funnelChartData = rawFunnel.map((item, idx) => {
    const stageName = item.etapa.replace(/^\d+\.\s*/, '');
    const pct = ((item.cantidad / maxFunnelVal) * 100).toFixed(1);
    return {
      ...item,
      name: stageName,
      shortName: stageName.length > 22 ? `${stageName.substring(0, 20)}...` : stageName,
      cantidadFormatted: item.cantidad.toLocaleString(),
      percentage: `${pct}%`,
      fill: item.fill || FUNNEL_COLORS[idx % FUNNEL_COLORS.length]
    };
  });

  // Custom Tooltip para Funnel
  const CustomFunnelTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const idx = funnelChartData.findIndex(f => f.name === d.name);
      const prevVal = idx > 0 ? funnelChartData[idx - 1].cantidad : null;
      const stepRetention = prevVal ? ((d.cantidad / prevVal) * 100).toFixed(1) : 100;
      const stepDrop = prevVal ? (100 - stepRetention).toFixed(1) : 0;

      return (
        <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-md ${
          isDark 
            ? 'bg-[#061426]/95 border-[#00C6D7]/40 text-white shadow-black/80' 
            : 'bg-white/95 border-[#005C84]/30 text-[#002D42] shadow-xl'
        }`}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
            <p className="text-sm font-black">{d.etapa}</p>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="opacity-80">Volumen:</span>
              <span className="font-extrabold text-sm text-[#00C6D7]">{d.cantidad.toLocaleString()} {d.unidad || 'registros'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="opacity-80">% del Total Evaluado:</span>
              <span className="font-bold text-[#7AB800]">{d.percentage}</span>
            </div>
            {idx > 0 && (
              <div className="flex justify-between gap-4 pt-1 border-t border-slate-500/20">
                <span className="opacity-80">Paso desde etapa anterior:</span>
                <span className="font-bold text-emerald-400">+{stepRetention}% (-{stepDrop}% drop)</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip para Motivos de Rechazo
  const CustomRejectionTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const pct = totalRechazos > 0 ? ((d.cantidad / totalRechazos) * 100).toFixed(1) : 0;
      return (
        <div className={`p-3.5 rounded-2xl shadow-2xl border backdrop-blur-md ${
          isDark 
            ? 'bg-[#061426]/95 border-[#005C84]/50 text-white shadow-black/80' 
            : 'bg-white/95 border-[#005C84]/30 text-[#002D42] shadow-xl'
        }`}>
          <p className="text-sm font-bold mb-1">{d.motivo}</p>
          <div className="flex items-center justify-between gap-4 text-xs font-semibold">
            <span className="opacity-80">Frecuencia:</span>
            <span className="text-rose-400 font-extrabold text-sm">{d.cantidad} casos ({pct}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header con botón de refresco */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl border shadow-xl transition-colors duration-300 ${
        isDark 
          ? 'bg-gradient-to-r from-[#061426] via-[#005C84]/30 to-[#061426] border-[#005C84]/40' 
          : 'bg-gradient-to-r from-white via-sky-50 to-white border-[#005C84]/20 shadow-[#005C84]/10'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#00C6D7]/15 text-[#00C6D7] border border-[#00C6D7]/30 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 animate-pulse text-[#00C6D7]" /> Telemetría en Tiempo Real Movistar
            </span>
            <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>Sincronización activa</span>
          </div>
          <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
            Dashboard de Control{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C6D7] via-teal-400 to-[#7AB800]">
              Funnel E2E & NBO
            </span>
          </h1>
          <p className={`text-sm md:text-base mt-1 font-medium ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
            Supervisión integral del ciclo de personalización comercial y cumplimiento de metas Movistar Total.
          </p>

          {/* Procedencia del dato: qué está alimentando exactamente este tablero */}
          <div className={`flex items-start gap-2 mt-3 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
            <Database className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#00C6D7]" />
            <span className="leading-snug">{descripcionFuente()}</span>
          </div>
        </div>

        <div className="flex flex-col items-stretch md:items-end gap-3 shrink-0">
          {/* Selector de alcance de los datos */}
          <div className={`flex items-center p-1 rounded-xl border self-start md:self-auto ${
            isDark ? 'bg-[#030914] border-[#005C84]/40' : 'bg-slate-100 border-slate-200'
          }`}>
            {SCOPES.map(({ id, label, hint }) => (
              <button
                key={id}
                onClick={() => setScope(id)}
                title={hint}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  scope === id
                    ? 'bg-[#005C84] text-white shadow'
                    : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-[#005C84]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-[#005C84] to-[#00C6D7] hover:from-[#00C6D7] hover:to-[#005C84] text-white text-sm font-extrabold rounded-2xl transition shadow-lg shadow-[#00C6D7]/25 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Sincronizar Datos
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gestiones */}
        <div className={`p-5 rounded-3xl border transition duration-300 relative overflow-hidden group ${
          isDark 
            ? 'bg-[#061426]/85 border-[#005C84]/35 hover:border-[#00C6D7]/60 shadow-xl' 
            : 'bg-white border-[#005C84]/15 hover:border-[#005C84]/40 shadow-md shadow-[#005C84]/5'
        }`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition">
            <Users className="w-16 h-16 text-[#00C6D7]" />
          </div>
          <p className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-[#005C84]'}`}>
            Gestiones Totales
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-[#005C84]'}`}>{kpis.total}</span>
            <span className="text-xs font-bold text-[#00C6D7] flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> NBO Evaluados
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-[#7AB800] font-bold">
              <CheckCircle2 className="w-4 h-4" /> {kpis.aceptadas} Aceptadas
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-bold">
              <XCircle className="w-4 h-4" /> {kpis.rechazadas} Rechazos
            </span>
          </div>
        </div>

        {/* Tasa de Conversión */}
        <div className={`p-5 rounded-3xl border transition duration-300 relative overflow-hidden group ${
          isDark 
            ? 'bg-[#061426]/85 border-[#005C84]/35 hover:border-[#7AB800]/60 shadow-xl' 
            : 'bg-white border-[#005C84]/15 hover:border-[#7AB800]/40 shadow-md shadow-[#005C84]/5'
        }`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition">
            <TrendingUp className="w-16 h-16 text-[#7AB800]" />
          </div>
          <p className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-[#005C84]'}`}>
            Tasa de Conversión Global
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl md:text-4xl font-black text-[#7AB800]">{kpis.tasa_conversion}%</span>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#7AB800]/20 text-[#7AB800] font-extrabold">
              Efectividad
            </span>
          </div>
          <div className={`mt-3 w-full rounded-full h-2.5 overflow-hidden ${isDark ? 'bg-[#030914]' : 'bg-slate-100'}`}>
            <div 
              className="bg-[#7AB800] h-2.5 rounded-full transition-all duration-500 shadow-sm" 
              style={{ width: `${Math.min(kpis.tasa_conversion, 100)}%` }}
            />
          </div>
        </div>

        {/* Participación Movistar Total (MT Share) */}
        <div className={`p-5 rounded-3xl border transition duration-300 relative overflow-hidden group ${
          isDark 
            ? 'bg-[#061426]/85 border-[#005C84]/35 hover:border-[#00C6D7]/60 shadow-xl' 
            : 'bg-white border-[#005C84]/15 hover:border-[#00C6D7]/40 shadow-md shadow-[#005C84]/5'
        }`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition">
            <ShieldCheck className="w-16 h-16 text-[#00C6D7]" />
          </div>
          <p className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-[#005C84]'}`}>
            Participación Movistar Total
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl md:text-4xl font-black text-[#00C6D7]">{kpis.share_mt}%</span>
            <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
              ({kpis.mt_aceptadas} paquetes MT)
            </span>
          </div>
          <p className="mt-3 text-xs text-[#00C6D7] font-bold flex items-center gap-1">
            <Award className="w-4 h-4 shrink-0" /> Meta desafío: &gt;50% Hogar / &gt;10% Móvil
          </p>
        </div>

        {/* Canales Activos */}
        <div className={`p-5 rounded-3xl border transition duration-300 relative overflow-hidden group ${
          isDark 
            ? 'bg-[#061426]/85 border-[#005C84]/35 hover:border-indigo-500/60 shadow-xl' 
            : 'bg-white border-[#005C84]/15 hover:border-indigo-500/40 shadow-md shadow-[#005C84]/5'
        }`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-25 transition">
            <Layers className="w-16 h-16 text-indigo-400" />
          </div>
          <p className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-[#005C84]'}`}>
            Canales Integrados E2E
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl md:text-4xl font-black ${isDark ? 'text-white' : 'text-[#005C84]'}`}>5 / 5</span>
            <span className="text-xs px-2.5 py-0.5 rounded-md bg-[#005C84]/20 text-[#00C6D7] font-extrabold">
              Omnicanal
            </span>
          </div>
          <p className={`mt-3 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
            Tienda · WhatsApp · Call In · Call Out · Digital
          </p>
        </div>
      </div>

      {/* Grid Principal de Gráficos: Funnel E2E & Top Rechazos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SECCIÓN 1: Embudo de Conversión E2E Movistar */}
        <div className={`lg:col-span-7 p-6 rounded-3xl shadow-xl flex flex-col justify-between border transition-colors ${
          isDark ? 'bg-[#061426]/85 border-[#005C84]/35' : 'bg-white border-[#005C84]/15'
        }`}>
          <div>
            {/* Header del Embudo con controles de vista */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#005C84]/20 border border-[#00C6D7]/30">
                  <BarChart3 className="w-6 h-6 text-[#00C6D7]" />
                </div>
                <div>
                  <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                    Embudo de Conversión E2E Movistar
                  </h2>
                  <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
                    Eficiencia y trazabilidad de cada fase del pipeline comercial
                  </p>
                </div>
              </div>

              {/* Selector de modo de vista */}
              <div className={`flex items-center p-1 rounded-xl border self-start sm:self-auto ${
                isDark ? 'bg-[#030914] border-[#005C84]/40' : 'bg-slate-100 border-slate-200'
              }`}>
                <button
                  onClick={() => setFunnelViewMode('both')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    funnelViewMode === 'both'
                      ? 'bg-[#005C84] text-white shadow'
                      : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-[#005C84]'
                  }`}
                >
                  Vista Completa
                </button>
                <button
                  onClick={() => setFunnelViewMode('chart')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    funnelViewMode === 'chart'
                      ? 'bg-[#005C84] text-white shadow'
                      : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-[#005C84]'
                  }`}
                >
                  Gráfico Funnel
                </button>
                <button
                  onClick={() => setFunnelViewMode('steps')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    funnelViewMode === 'steps'
                      ? 'bg-[#005C84] text-white shadow'
                      : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-[#005C84]'
                  }`}
                >
                  Etapas Detalladas
                </button>
              </div>
            </div>

            <p className={`text-xs md:text-sm mb-5 font-normal leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
              Visualización del flujo desde el universo analizado con IA hasta el cierre de ofertas convergentes Movistar Total.
            </p>

            {/* GRÁFICO RECHARTS: Funnel Trapezoidal */}
            {(funnelViewMode === 'both' || funnelViewMode === 'chart') && funnelChartData.length > 0 && (
              <div className={`p-4 rounded-2xl mb-5 border transition ${
                isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-[#00C6D7]' : 'text-[#005C84]'}`}>
                    <Filter className="w-3.5 h-3.5" /> Diagrama de Embudo Recharts
                  </span>
                  <span className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                    Hover para ver retención y drop-off
                  </span>
                </div>
                <div className="h-[230px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <Tooltip content={<CustomFunnelTooltip />} />
                      <Funnel
                        dataKey="cantidad"
                        data={funnelChartData}
                        isAnimationActive
                      >
                        <LabelList 
                          position="right" 
                          fill={isDark ? '#E2E8F0' : '#002D42'} 
                          stroke="none" 
                          dataKey="shortName"
                          fontSize={12}
                          fontWeight="700"
                        />
                        <LabelList 
                          position="inside" 
                          fill="#FFFFFF" 
                          stroke="none" 
                          dataKey="percentage" 
                          fontSize={13}
                          fontWeight="800"
                        />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* VISTA DETALLADA: Tarjetas de Etapas */}
            {(funnelViewMode === 'both' || funnelViewMode === 'steps') && (
              <div className="space-y-3">
                {rawFunnel.map((step, idx) => {
                  const maxVal = rawFunnel[0]?.cantidad || 1;
                  const pctOfTotal = ((step.cantidad / maxVal) * 100).toFixed(1);
                  
                  const prevVal = idx > 0 ? rawFunnel[idx - 1].cantidad : null;
                  const stepConversion = prevVal ? ((step.cantidad / prevVal) * 100).toFixed(1) : 100;
                  const stepDropoff = prevVal ? (100 - stepConversion).toFixed(1) : 0;

                  const stageColors = [
                    { border: 'border-[#005C84]/40', text: 'text-[#00C6D7]', bar: 'from-[#005C84] to-[#0078A8]', badge: 'bg-[#005C84]/25 text-[#00C6D7] border-[#00C6D7]/40' },
                    { border: 'border-[#0078A8]/40', text: 'text-[#00C6D7]', bar: 'from-[#0078A8] to-[#00A8C6]', badge: 'bg-[#0078A8]/25 text-[#00C6D7] border-[#00C6D7]/40' },
                    { border: 'border-[#00C6D7]/40', text: 'text-[#00C6D7]', bar: 'from-[#00A8C6] to-[#00C6D7]', badge: 'bg-[#00C6D7]/25 text-[#00C6D7] border-[#00C6D7]/40' },
                    { border: 'border-[#7AB800]/40', text: 'text-[#7AB800]', bar: 'from-[#00C6D7] to-[#7AB800]', badge: 'bg-[#7AB800]/25 text-[#7AB800] border-[#7AB800]/40' },
                    { border: 'border-[#7AB800]/60', text: 'text-[#7AB800]', bar: 'from-[#7AB800] to-emerald-400', badge: 'bg-[#7AB800]/30 text-[#7AB800] border-[#7AB800]/60' },
                  ];

                  const color = stageColors[idx % stageColors.length];
                  const stageName = step.etapa.replace(/^\d+\.\s*/, '');

                  return (
                    <div key={idx} className="relative">
                      {idx > 0 && (
                        <div className="flex items-center justify-center -my-2 relative z-10">
                          <div className={`px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg border ${
                            isDark ? 'bg-[#030914] border-[#005C84]/40 text-slate-200' : 'bg-white border-slate-300 text-[#002D42]'
                          }`}>
                            <span className="text-[#7AB800] font-extrabold flex items-center gap-0.5">
                              ↓ {stepConversion}% pasan
                            </span>
                            <span className="opacity-40">|</span>
                            <span className="text-rose-400 font-semibold">
                              -{stepDropoff}% drop
                            </span>
                          </div>
                        </div>
                      )}

                      <div className={`w-full rounded-2xl p-4 transition duration-300 shadow-md border ${
                        isDark ? `bg-[#030914]/90 ${color.border}` : `bg-slate-50 ${color.border}`
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-black border ${color.badge} shrink-0`}>
                              Paso {idx + 1}
                            </span>
                            <div>
                              <h3 className={`font-bold text-base md:text-lg leading-snug ${isDark ? 'text-white' : 'text-[#002D42]'}`}>
                                {stageName}
                              </h3>
                              <span className={`text-xs md:text-sm font-medium block ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
                                {step.detalle}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-baseline sm:items-end justify-between sm:justify-start gap-3 shrink-0 pl-1">
                            <div className="text-right">
                              <span className={`text-2xl md:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                                {step.cantidad.toLocaleString()}
                              </span>
                              <span className={`text-xs md:text-sm ml-1.5 font-bold ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
                                {step.unidad || 'registros'}
                              </span>
                            </div>
                            <div className={`px-2.5 py-1 rounded-lg text-xs font-black ${color.badge} shrink-0`}>
                              {pctOfTotal}%
                            </div>
                          </div>
                        </div>

                        <div className={`mt-3 w-full rounded-full h-2.5 overflow-hidden border ${isDark ? 'bg-[#061426] border-[#005C84]/30' : 'bg-slate-200 border-slate-200'}`}>
                          <div 
                            className={`h-2.5 rounded-full bg-gradient-to-r ${color.bar} transition-all duration-700 shadow-sm`} 
                            style={{ width: `${Math.max(parseFloat(pctOfTotal), 2)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Informativo del Embudo */}
          <div className={`mt-6 pt-4 border-t grid grid-cols-3 gap-3 text-center ${isDark ? 'border-[#005C84]/30' : 'border-slate-200'}`}>
            <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>Eficiencia Base</span>
              <span className={`font-black text-base md:text-lg ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                {rawFunnel[0] && rawFunnel[rawFunnel.length - 2] ? ((rawFunnel[rawFunnel.length - 2].cantidad / rawFunnel[0].cantidad) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>Cierre Efectivo</span>
              <span className="font-black text-base md:text-lg text-[#7AB800]">
                {kpis.tasa_conversion}%
              </span>
            </div>
            <div className={`p-3 rounded-2xl border ${isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>Captura MT</span>
              <span className="font-black text-base md:text-lg text-[#00C6D7]">
                {kpis.share_mt}%
              </span>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Top Objeciones y Rechazos (Donut Chart + Ranked List) */}
        <div className={`lg:col-span-5 p-6 rounded-3xl shadow-xl flex flex-col justify-between border transition-colors ${
          isDark ? 'bg-[#061426]/85 border-[#005C84]/35' : 'bg-white border-[#005C84]/15'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30">
                  <PieIcon className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                    Top Objeciones y Rechazos
                  </h2>
                  <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
                    Detección con Feedback IA para retroalimentar el speech
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 font-mono">
                Feedback IA
              </span>
            </div>

            <p className={`text-xs md:text-sm mb-5 font-normal leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
              Calibración automática del motor de rebate según las principales razones de declinación del cliente.
            </p>

            {motivosRechazo.length > 0 ? (
              <div className="space-y-6">
                {/* Donut Chart con Total Central */}
                <div className="relative flex items-center justify-center">
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip content={<CustomRejectionTooltip />} />
                        <Pie
                          data={motivosRechazo}
                          dataKey="cantidad"
                          nameKey="motivo"
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={95}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {motivosRechazo.map((entry, index) => (
                            <Cell 
                              key={`cell-donut-${index}`} 
                              fill={MOVISTAR_COLORS[index % MOVISTAR_COLORS.length]} 
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Indicador Central en el Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-rose-400 leading-tight">
                      {totalRechazos}
                    </span>
                    <span className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
                      Rechazos
                    </span>
                  </div>
                </div>

                {/* Ranked List con Barras Horizontales */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-500/20">
                    <span className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-[#005C84]'}`}>
                      Ranking de Objeciones
                    </span>
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
                      Impacto Relativo
                    </span>
                  </div>

                  {motivosRechazo.map((item, idx) => {
                    const pct = totalRechazos > 0 ? ((item.cantidad / totalRechazos) * 100).toFixed(1) : 0;
                    const color = MOVISTAR_COLORS[idx % MOVISTAR_COLORS.length];

                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-2xl border transition duration-200 ${
                          isDark 
                            ? 'bg-[#030914]/80 border-[#005C84]/30 hover:border-[#00C6D7]/40' 
                            : 'bg-slate-50 border-slate-200 hover:border-[#005C84]/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span 
                              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm"
                              style={{ backgroundColor: color }}
                            >
                              #{idx + 1}
                            </span>
                            <span className={`font-bold text-sm md:text-base truncate ${isDark ? 'text-white' : 'text-[#002D42]'}`}>
                              {item.motivo}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-xs md:text-sm font-bold ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
                              {item.cantidad} {item.cantidad === 1 ? 'caso' : 'casos'}
                            </span>
                            <span 
                              className="px-2.5 py-0.5 rounded-md text-xs font-black text-white shadow-sm"
                              style={{ backgroundColor: color }}
                            >
                              {pct}%
                            </span>
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className={`w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-[#061426]' : 'bg-slate-200'}`}>
                          <div 
                            className="h-2 rounded-full transition-all duration-700 shadow-sm"
                            style={{ 
                              width: `${Math.max(parseFloat(pct), 5)}%`,
                              backgroundColor: color 
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 py-16">
                <CheckCircle2 className="w-16 h-16 text-[#7AB800] mx-auto mb-3 opacity-70" />
                <p className="text-base font-bold">No se han registrado rechazos todavía.</p>
                <p className="text-xs text-slate-500 mt-1">El 100% de las propuestas NBO han sido aceptadas.</p>
              </div>
            )}
          </div>

          {/* Footer de Insight IA */}
          <div className={`mt-6 p-3.5 rounded-2xl border flex items-center gap-3 ${
            isDark ? 'bg-[#005C84]/15 border-[#00C6D7]/30 text-slate-200' : 'bg-sky-50 border-[#005C84]/20 text-[#002D42]'
          }`}>
            <Zap className="w-5 h-5 text-[#00C6D7] shrink-0" />
            <p className="text-xs font-semibold leading-snug">
              <span className="text-[#00C6D7] font-black">Acción Inteligente:</span> Los rebate scripts de IA se reentrenan automáticamente con cada nuevo rechazo registrado.
            </p>
          </div>
        </div>
      </div>

      {/* Rendimiento por Canal */}
      <div className={`p-6 rounded-3xl shadow-xl border transition-colors ${
        isDark ? 'bg-[#061426]/85 border-[#005C84]/35' : 'bg-white border-[#005C84]/15'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#005C84]/20 border border-[#00C6D7]/30">
              <TrendingUp className="w-5 h-5 text-[#00C6D7]" />
            </div>
            <div>
              <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                Rendimiento y Tasa de Conversión por Canal Movistar
              </h2>
              <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
                Comparativa de efectividad y volumen en cada punto de contacto omnicanal
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#00C6D7]/15 text-[#00C6D7] border border-[#00C6D7]/30">
            Eficiencia Omnicanal
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          {canales.map((c, i) => (
            <div key={i} className={`p-4 rounded-2xl flex flex-col justify-between border transition ${
              isDark ? 'bg-[#030914]/80 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <p className="text-xs font-extrabold text-[#00C6D7] uppercase tracking-wider">{c.canal}</p>
                <div className="flex items-baseline justify-between mt-2">
                  <span className={`text-2xl md:text-3xl font-black ${isDark ? 'text-white' : 'text-[#005C84]'}`}>{c.conversion}%</span>
                  <span className={`text-xs md:text-sm font-bold ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
                    {c.aceptadas} / {c.total} ventas
                  </span>
                </div>
              </div>
              <div className={`mt-3 w-full rounded-full h-2 overflow-hidden ${isDark ? 'bg-[#061426]' : 'bg-slate-200'}`}>
                <div 
                  className="bg-gradient-to-r from-[#005C84] via-[#00C6D7] to-[#7AB800] h-2 rounded-full shadow-sm" 
                  style={{ width: `${Math.min(c.conversion, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sección Speech Analytics & LLM Post-Hoc */}
      <div className={`p-6 rounded-3xl shadow-xl overflow-hidden border transition-colors ${
        isDark ? 'bg-[#061426]/85 border-[#005C84]/35' : 'bg-white border-[#005C84]/15'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/30">
              <Headphones className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                Speech Analytics & Calidad de Voz en Call Center (Post-Hoc LLM)
              </h2>
              <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
                Clasificación automática de llamadas Call In (Reclamos & Sentimiento) y Call Out (Rechazos & Rebate)
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono w-fit">
            Gemini & NLP Engine
          </span>
        </div>

        {/* 3 KPI Cards de Speech */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#030914] border-[#005C84]/30' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[11px] font-bold text-slate-400 block mb-1">SCORE DE SENTIMIENTO CALL-IN</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400">3.8</span>
              <span className="text-xs text-slate-400 font-mono">/ 5.0 (Calibrado)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">NPS Inbound recuperado tras contención técnica</p>
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#030914] border-[#005C84]/30' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[11px] font-bold text-slate-400 block mb-1">TÓPICO DE RECLAMO PREDOMINANTE</span>
            <div className="text-sm font-black text-rose-400 truncate">
              🛠️ Avería Técnica / Fibra (42%)
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Activa automáticamente regla de protección anti-presión</p>
          </div>

          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#030914] border-[#005C84]/30' : 'bg-slate-50 border-slate-200'}`}>
            <span className="text-[11px] font-bold text-slate-400 block mb-1">EFECTIVIDAD DE REBATE CALL-OUT</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-400">78.4%</span>
              <span className="text-xs text-emerald-400 font-bold">+12% vs. sin IA</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Conversión hacia Movistar Total tras objeción de precio</p>
          </div>
        </div>

        {/* 2 Columnas de Detalle Call In vs Call Out */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Call In Tópicos */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#030914]/80 border-[#005C84]/20' : 'bg-slate-50/80 border-slate-200'}`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
              <Tag className="w-3.5 h-3.5" /> Distribución de Tópicos de Reclamo (Call In)
            </h4>
            <div className="space-y-2 text-xs">
              {[
                { topico: 'Avería Técnica / Fibra Óptica', pct: 42, color: 'bg-rose-500' },
                { topico: 'Facturación / Cobro Indebido', pct: 28, color: 'bg-amber-500' },
                { topico: 'Portabilidad / Solicitud de Baja', pct: 18, color: 'bg-purple-500' },
                { topico: 'Consultas Comerciales / Otros', pct: 12, color: 'bg-blue-500' }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-semibold text-slate-300">{item.topico}</span>
                    <span className="font-mono text-slate-400 font-bold">{item.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className={`${item.color} h-1.5 rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Call Out Rebates */}
          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#030914]/80 border-[#005C84]/20' : 'bg-slate-50/80 border-slate-200'}`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
              <BrainCircuit className="w-3.5 h-3.5" /> Efectividad del Rebate según Objeción (Call Out)
            </h4>
            <div className="space-y-2 text-xs">
              {[
                { motivo: 'Precio muy alto -> Pivote a Movistar Total (35% Ahorro)', conv: '84.2%', badge: 'Alta Conversión', color: 'text-emerald-400' },
                { motivo: 'Compromiso con competencia -> Oferta Línea Familiar', conv: '15.0%', badge: 'Rechazo Fuerte', color: 'text-rose-400' },
                { motivo: 'Falta de tiempo -> Agendamiento Callback NBO', conv: '62.5%', badge: 'Seguimiento', color: 'text-amber-400' },
                { motivo: 'No necesita más gigas -> Migración a Plan Base', conv: '48.0%', badge: 'Moderado', color: 'text-blue-400' }
              ].map((item, idx) => (
                <div key={idx} className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'} flex items-center justify-between`}>
                  <div className="min-w-0 pr-2">
                    <p className="text-[11px] font-medium text-slate-300 leading-tight">{item.motivo}</p>
                    <span className="text-[10px] text-slate-400">{item.badge}</span>
                  </div>
                  <span className={`text-xs font-black font-mono shrink-0 ${item.color}`}>{item.conv}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Últimas Gestiones */}
      <div className={`p-6 rounded-3xl shadow-xl overflow-hidden border transition-colors ${
        isDark ? 'bg-[#061426]/85 border-[#005C84]/35' : 'bg-white border-[#005C84]/15'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#7AB800]/20 border border-[#7AB800]/30">
              <Activity className="w-5 h-5 text-[#7AB800]" />
            </div>
            <div>
              <h2 className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                Trazabilidad en Vivo de Gestiones Registradas
              </h2>
              <p className={`text-xs md:text-sm font-medium ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
                Últimos registros de interacciones E2E procesadas
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#7AB800]/15 text-[#7AB800] border border-[#7AB800]/30 font-mono">
            Auditoría en Vivo
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className={`w-full text-left text-sm ${isDark ? 'text-slate-200' : 'text-[#002D42]'}`}>
            <thead className={`text-xs uppercase font-extrabold tracking-wider ${isDark ? 'bg-[#030914] text-slate-300' : 'bg-slate-100 text-[#005C84]'}`}>
              <tr>
                <th className="px-4 py-3.5 rounded-l-xl">ID</th>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Cliente ID</th>
                <th className="px-4 py-3.5">Canal</th>
                <th className="px-4 py-3.5">Oferta Sugerida</th>
                <th className="px-4 py-3.5">Precio / Ahorro</th>
                <th className="px-4 py-3.5">Resultado</th>
                <th className="px-4 py-3.5 rounded-r-xl">Motivo / Detalle</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#005C84]/20' : 'divide-slate-200'}`}>
              {ultimas.map((row, idx) => (
                <tr key={idx} className={`transition ${isDark ? 'hover:bg-[#005C84]/15' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 py-3.5 font-mono text-xs text-[#00C6D7] font-extrabold">{row.id}</td>
                  <td className="px-4 py-3.5 text-xs font-medium text-slate-400">{row.timestamp}</td>
                  <td className={`px-4 py-3.5 font-bold ${isDark ? 'text-white' : 'text-[#002D42]'}`}>{row.cliente_id}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                      isDark ? 'bg-[#030914] border-[#005C84]/30 text-[#00C6D7]' : 'bg-white border-slate-200 text-[#005C84]'
                    }`}>
                      {row.canal}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-[#002D42]'}`}>{row.oferta_nombre}</span>
                      {row.es_movistar_total && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#00C6D7]/20 text-[#00C6D7] border border-[#00C6D7]/30">
                          MT
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm">
                    <span className="text-[#7AB800] font-extrabold">S/ {row.precio_oferta}</span>
                    {row.ahorro_pct > 0 && (
                      <span className="text-[#00C6D7] ml-2 font-black">(-{row.ahorro_pct}%)</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {row.estado === 'ACEPTADA' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#7AB800]/20 text-[#7AB800] border border-[#7AB800]/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aceptada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <XCircle className="w-3.5 h-3.5" /> Rechazada
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs md:text-sm text-slate-400 italic">
                    {row.motivo_rechazo || 'Venta Exitosa'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
