'use client';

import { useState, useEffect } from 'react';
import { getAnalytics } from '@/lib/api';
import { AnalyticsKPIs } from '@/lib/types';
import { BarChart3, Users, Sparkles, DollarSign, Smartphone, Radio, MapPin, Trophy } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await getAnalytics();
        setData(res);
      } catch (err: any) {
        // En lugar de console.error que activa el overlay rojo en dev, mostramos un mensaje
        setErrorMsg('No se pudo conectar con el backend. Asegúrate de que FastAPI esté corriendo en el puerto 8000.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="card text-center p-12 text-slate-400">Cargando métricas ejecutivas...</div>;
  }

  if (errorMsg || !data) {
    return (
      <div className="card text-center p-12 border-[var(--movistar-green)]/30">
        <h3 className="text-xl font-bold text-[var(--movistar-green)] mb-2">Error de Conexión</h3>
        <p className="text-slate-300">{errorMsg || 'No se pudieron cargar los datos.'}</p>
        <p className="text-sm text-slate-500 mt-4">Ejecuta: <code className="bg-black/50 p-1 rounded">python run.py</code> en la raíz del proyecto para levantar el backend.</p>
      </div>
    );
  }

  const kpis = data?.kpis || {} as any;
  const distribucion_canales = data?.distribucion_canales || [];
  const departamentos_top = data?.departamentos_top || [];
  const top_ofertas_ranking = data?.top_ofertas_ranking || [];

  const elegiblesPct = kpis.total_clientes ? ((kpis.elegibles_mt / kpis.total_clientes) * 100).toFixed(1) : '0.0';
  const appPct = kpis.total_clientes ? ((kpis.usuarios_app / kpis.total_clientes) * 100).toFixed(1) : '0.0';
  const maxDept = departamentos_top[0]?.cantidad || 1;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-[#019DF4]" />
          Dashboard Directivo & Funnel E2E
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Métricas de impacto comercial, penetración de Movistar Total y contactabilidad omnicanal (100,000 Clientes).
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card bg-[#0C2136]/80 border-white/10 p-5">
          <div className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#019DF4]" />
            Universo Total Clientes
          </div>
          <div className="text-3xl font-black text-white mt-2">
            {kpis.total_clientes?.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-slate-400 mt-1">Base procesada B2C</div>
        </div>

        <div className="card bg-[#0C2136]/80 border-[var(--movistar-green)]/30 p-5 shadow-[0_0_15px_rgba(92,182,21,0.15)]">
          <div className="text-xs uppercase font-semibold text-[var(--movistar-green)] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[var(--movistar-green)]" />
            Target Elegibles MT
          </div>
          <div className="text-3xl font-black text-[var(--movistar-green)] mt-2">
            {kpis.elegibles_mt?.toLocaleString() || '0'}
          </div>
          <div className="text-xs text-[var(--movistar-green)] font-medium mt-1">
            {elegiblesPct}% del total de la planta
          </div>
        </div>

        <div className="card bg-[#0C2136]/80 border-white/10 p-5">
          <div className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-[#019DF4]" />
            ARPU Promedio
          </div>
          <div className="text-3xl font-black text-[#019DF4] mt-2">
            S/ {kpis.arpu_promedio ? kpis.arpu_promedio.toFixed(2) : '0.00'}
          </div>
          <div className="text-xs text-slate-400 mt-1">Ingreso mensual medio</div>
        </div>

        <div className="card bg-[#0C2136]/80 border-white/10 p-5">
          <div className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-[#B388FF]" />
            Adopción App Digital
          </div>
          <div className="text-3xl font-black text-[#B388FF] mt-2">{appPct}%</div>
          <div className="text-xs text-slate-400 mt-1">
            {kpis.usuarios_app?.toLocaleString() || '0'} usuarios activos
          </div>
        </div>
      </div>

      {/* Gráficos de distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Distribución por canal */}
        <div className="card bg-[#0C2136]/80 border-white/10 p-5">
          <h3 className="text-sm font-bold text-[#38BDF8] flex items-center gap-2 mb-4">
            <Radio className="w-4 h-4 text-[#019DF4]" />
            Distribución por Canal de Contacto
          </h3>
          <div className="flex flex-col gap-3">
            {distribucion_canales.map((c) => (
              <div key={c.canal}>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-white">{c.canal}</span>
                  <span className="text-slate-400">
                    {c.cantidad?.toLocaleString() || '0'} ({c.porcentaje || 0}%)
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#019DF4] rounded-full"
                    style={{ width: `${c.porcentaje}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Departamentos */}
        <div className="card bg-[#0C2136]/80 border-white/10 p-5">
          <h3 className="text-sm font-bold text-[#38BDF8] flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-[#019DF4]" />
            Top Departamentos y Oportunidad MT
          </h3>
          <div className="flex flex-col gap-3">
            {departamentos_top.map((d) => {
              const barWidth = ((d.cantidad / maxDept) * 100).toFixed(0);
              return (
                <div key={d.departamento}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-white">{d.departamento}</span>
                    <span className="text-slate-400">
                      {d.cantidad?.toLocaleString() || '0'} clientes • {d.elegibles_mt?.toLocaleString() || '0'} elegibles MT
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#019DF4] to-[var(--movistar-green)] rounded-full"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Ofertas Recomendadas */}
      <div className="card bg-[#0C2136]/80 border-white/10 p-5">
        <h3 className="text-sm font-bold text-[var(--movistar-green)] flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-[var(--movistar-green)]" />
          Ofertas con Mayor Volumen de Recomendación Top 1
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {top_ofertas_ranking.map((o) => (
            <div key={o.nombre_oferta} className="bg-black/30 p-4 rounded-xl border border-white/5">
              <span className="text-[10px] font-bold text-[var(--movistar-green)] uppercase">
                {o.oferta_es_mt ? '✨ Movistar Total' : '📱 Móvil/Hogar'}
              </span>
              <div className="font-bold text-sm text-white mt-1 line-clamp-1">{o.nombre_oferta}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Score Medio: {o.score_promedio ? (o.score_promedio * 100).toFixed(1) : '0.0'}%
              </div>
              <div className="text-sm font-black text-[#019DF4] mt-2">
                {o.veces_top1?.toLocaleString() || '0'} veces Top 1
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
