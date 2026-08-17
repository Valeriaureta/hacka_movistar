'use client';

import { useState, useEffect } from 'react';
import { getAnalytics } from '@/lib/api';
import { AnalyticsKPIs } from '@/lib/types';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart3, Users, Sparkles, DollarSign, Smartphone, Radio, MapPin, Trophy, Target, TrendingUp } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const CANAL_COLORS = ['#019DF4', '#16A34A', '#D97706', '#9333EA', '#0284C7'];

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await getAnalytics();
        setData(res);
      } catch (err: any) {
        setErrorMsg('No se pudo conectar con el backend. Asegúrate de que FastAPI esté corriendo en el puerto 8000.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="card text-center p-16 text-slate-600 dark:text-slate-300 bg-white dark:bg-[#081B2B]/80 border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-[#019DF4] border-t-transparent animate-spin" />
        <div className="text-lg font-bold text-slate-900 dark:text-white font-title">Cargando métricas ejecutivas...</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">Procesando agregaciones de 100,000 clientes y ranking NBO</div>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="card text-center p-12 bg-white dark:bg-[#081B2B] border border-red-300 dark:border-[#5CB615]/30">
        <h3 className="text-xl font-bold text-red-600 dark:text-[#70D81E] mb-2 font-title">Error de Conexión</h3>
        <p className="text-slate-600 dark:text-slate-300">{errorMsg || 'No se pudieron cargar los datos.'}</p>
        <p className="text-sm text-slate-500 mt-4">
          Ejecuta: <code className="bg-slate-100 dark:bg-black/50 p-1.5 rounded text-xs font-mono text-[#0070B8] dark:text-[#00D2FF]">python run.py</code> en la raíz del proyecto.
        </p>
      </div>
    );
  }

  const kpis = data?.kpis || {} as any;
  const distribucion_canales = data?.distribucion_canales || [];
  const departamentos_top = (data?.departamentos_top || []).slice(0, 6);
  const top_ofertas_ranking = data?.top_ofertas_ranking || [];

  const elegiblesPct = kpis.total_clientes ? ((kpis.elegibles_mt / kpis.total_clientes) * 100).toFixed(1) : '0.0';
  const appPct = kpis.total_clientes ? ((kpis.usuarios_app / kpis.total_clientes) * 100).toFixed(1) : '0.0';

  const channelChartData = distribucion_canales.map((c) => ({
    name: c.canal,
    value: c.cantidad,
    porcentaje: c.porcentaje,
  }));

  const deptChartData = departamentos_top.map((d) => ({
    name: d.departamento,
    clientes: d.cantidad,
    elegibles_mt: d.elegibles_mt,
  }));

  const tooltipBg = theme === 'dark' ? '#061320' : '#FFFFFF';
  const tooltipBorder = theme === 'dark' ? 'rgba(255,255,255,0.15)' : '#CBD5E1';
  const tooltipColor = theme === 'dark' ? '#F8FAFC' : '#0F172A';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 font-title">
            <BarChart3 className="w-7 h-7 text-[#0070B8] dark:text-[#019DF4]" />
            Dashboard Directivo & Funnel E2E
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Métricas de penetración comercial de <strong className="text-emerald-700 dark:text-[#70D81E]">Movistar Total</strong>, contactabilidad omnicanal y ranking NBO (100,000 Clientes B2C).
          </p>
        </div>

        <div className="bg-slate-100 dark:bg-[#0A2035] px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-white/10 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 shadow-sm">
          <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-[#5CB615]" />
          <span>Meta Negocio: <strong>&gt;50% Venta Hogar con MT</strong></span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card bg-white dark:bg-[#081B2B]/90 border-slate-200 dark:border-white/10 p-5 relative overflow-hidden shadow-sm"
        >
          <div className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#0070B8] dark:text-[#019DF4]" />
            Universo Total Clientes
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-title">
            {kpis.total_clientes?.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Base procesada B2C Perú</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-emerald-50/50 dark:bg-[#081B2B]/90 border-emerald-300 dark:border-[#5CB615]/40 p-5 shadow-sm dark:shadow-[0_0_20px_rgba(92,182,21,0.15)] relative overflow-hidden"
        >
          <div className="text-xs uppercase font-bold text-emerald-700 dark:text-[#70D81E] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Target Elegibles MT
          </div>
          <div className="text-3xl font-black text-emerald-700 dark:text-[#70D81E] mt-2 font-title">
            {kpis.elegibles_mt?.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-emerald-800 dark:text-[#70D81E] font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> {elegiblesPct}% del total de la cartera
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card bg-white dark:bg-[#081B2B]/90 border-slate-200 dark:border-white/10 p-5 relative overflow-hidden shadow-sm"
        >
          <div className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-[#0070B8] dark:text-[#00D2FF]" />
            ARPU Promedio
          </div>
          <div className="text-3xl font-black text-[#0070B8] dark:text-[#00D2FF] mt-2 font-title">
            S/ {kpis.arpu_promedio ? kpis.arpu_promedio.toFixed(2) : '0.00'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Facturación mensual media</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-white dark:bg-[#081B2B]/90 border-slate-200 dark:border-white/10 p-5 relative overflow-hidden shadow-sm"
        >
          <div className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-purple-600 dark:text-[#C4B5FD]" />
            Adopción App Digital
          </div>
          <div className="text-3xl font-black text-purple-700 dark:text-[#C4B5FD] mt-2 font-title">{appPct}%</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {kpis.usuarios_app?.toLocaleString() || '0'} usuarios App Mi Movistar
          </div>
        </motion.div>
      </div>

      {/* Gráficos Interactivos Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por Canal con PieChart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card bg-white dark:bg-[#081B2B]/90 border-slate-200 dark:border-white/10 p-5 shadow-sm"
        >
          <h3 className="text-sm font-bold text-[#0070B8] dark:text-[#00D2FF] flex items-center gap-2 mb-4 font-title uppercase tracking-wide">
            <Radio className="w-4 h-4" />
            Distribución por Canal de Contacto
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 items-center">
            <div className="h-[180px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {channelChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CANAL_COLORS[index % CANAL_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '10px',
                      fontSize: '12px',
                      color: tooltipColor,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                    formatter={(val: any) => [`${Number(val).toLocaleString()} contactos`, 'Volumen']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col gap-2.5">
              {channelChartData.map((c, i) => (
                <div key={c.name} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: CANAL_COLORS[i % CANAL_COLORS.length] }}
                    />
                    <span className="text-slate-800 dark:text-white font-medium">{c.name}</span>
                  </div>
                  <span className="text-slate-600 dark:text-slate-400 font-mono">
                    {c.value.toLocaleString()} <span className="text-slate-400 dark:text-slate-500">({c.porcentaje}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Top Departamentos con BarChart Recharts */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card bg-white dark:bg-[#081B2B]/90 border-slate-200 dark:border-white/10 p-5 shadow-sm"
        >
          <h3 className="text-sm font-bold text-[#0070B8] dark:text-[#00D2FF] flex items-center gap-2 mb-2 font-title uppercase tracking-wide">
            <MapPin className="w-4 h-4" />
            Top Regiones: Clientes vs. Oportunidad MT
          </h3>

          <div className="h-[200px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '10px',
                    fontSize: '12px',
                    color: tooltipColor,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="clientes" name="Total Clientes" fill="#019DF4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="elegibles_mt" name="Elegibles MT" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Top Ofertas Recomendadas */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="card bg-white dark:bg-[#081B2B]/90 border-slate-200 dark:border-white/10 p-5 shadow-sm"
      >
        <h3 className="text-sm font-bold text-emerald-700 dark:text-[#70D81E] flex items-center gap-2 mb-4 font-title uppercase tracking-wide">
          <Trophy className="w-4 h-4" />
          Ranking de Ofertas con Mayor Volumen Top 1 NBO
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {top_ofertas_ranking.map((o) => (
            <div key={o.nombre_oferta} className="bg-slate-50 dark:bg-black/35 p-4 rounded-xl border border-slate-200/80 dark:border-white/5 flex flex-col justify-between hover:border-sky-300 dark:hover:border-[#019DF4]/40 transition-all shadow-sm">
              <div>
                <span className={`text-[10px] font-extrabold uppercase ${o.oferta_es_mt ? 'text-emerald-700 dark:text-[#70D81E]' : 'text-[#0070B8] dark:text-[#38BDF8]'}`}>
                  {o.oferta_es_mt ? '✨ Movistar Total' : '📱 Móvil / Hogar'}
                </span>
                <div className="font-bold text-sm text-slate-900 dark:text-white mt-1 line-clamp-1 font-title">{o.nombre_oferta}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Score Promedio: {o.score_promedio ? (o.score_promedio * 100).toFixed(1) : '0.0'}%
                </div>
              </div>
              <div className="text-sm font-black text-[#0070B8] dark:text-[#00D2FF] mt-3 pt-2 border-t border-slate-100 dark:border-white/5 font-mono">
                {o.veces_top1?.toLocaleString() || '0'} veces Top 1
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
