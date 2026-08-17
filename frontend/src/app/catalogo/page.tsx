'use client';

import { useState, useEffect } from 'react';
import { getOfertas } from '@/lib/api';
import { Oferta } from '@/lib/types';
import { Package, Sparkles, Smartphone, Home } from 'lucide-react';

export default function CatalogPage() {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [category, setCategory] = useState<'all' | 'movistar_total' | 'plan_movil' | 'plan_hogar'>('all');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await getOfertas();
        setOfertas(res);
      } catch (err: any) {
        setErrorMsg('Error al conectar con el backend. Ejecuta python run.py');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = category === 'all'
    ? ofertas
    : ofertas.filter((o) =>
        category === 'movistar_total'
          ? o.es_movistar_total || o.tipo_oferta === 'movistar_total'
          : o.tipo_oferta === category
      );

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#019DF4]" />
            Catálogo Comercial de Ofertas (22 Planes)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Portafolio estructurado para convergencia Movistar Total, líneas móviles y fibra óptica.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              category === 'all'
                ? 'bg-[#019DF4] text-white'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            Todas (22)
          </button>
          <button
            onClick={() => setCategory('movistar_total')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              category === 'movistar_total'
                ? 'bg-[#00C853] text-black font-bold'
                : 'bg-[#00C853]/10 text-[#00C853] hover:bg-[#00C853]/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Movistar Total
          </button>
          <button
            onClick={() => setCategory('plan_movil')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              category === 'plan_movil'
                ? 'bg-[#38BDF8] text-black font-bold'
                : 'bg-[#38BDF8]/10 text-[#38BDF8] hover:bg-[#38BDF8]/20'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Móvil Postpago
          </button>
          <button
            onClick={() => setCategory('plan_hogar')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              category === 'plan_hogar'
                ? 'bg-[#7C4DFF] text-white font-bold'
                : 'bg-[#7C4DFF]/10 text-[#B388FF] hover:bg-[#7C4DFF]/20'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            Internet Hogar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card text-center p-12 text-slate-400">Cargando portafolio...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((of) => (
            <div
              key={of.oferta_id}
              className="card bg-[#0C2136]/80 border-white/10 p-5 flex flex-col justify-between hover:border-[#019DF4]/50 transition-all shadow-md"
            >
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <span className="font-mono text-xs text-slate-400">{of.oferta_id}</span>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    {of.es_movistar_total ? (
                      <span className="badge badge-mt text-[10px]">Movistar Total</span>
                    ) : (
                      <span className="badge bg-white/5 text-slate-400 text-[10px]">{of.tipo_oferta}</span>
                    )}
                    {of.ahorro_pct > 0 && (
                      <span className="badge badge-optimo text-[10px]">{of.ahorro_pct}% Ahorro</span>
                    )}
                  </div>
                </div>

                <h4 className="text-base font-bold text-white mb-1.5 leading-snug">{of.nombre_oferta}</h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {of.descripcion_corta || of.descripcion_bundle || 'Oferta estratégica optimizada.'}
                </p>
              </div>

              <div className="mt-4 pt-3.5 border-t border-white/10 flex justify-between items-center">
                <div>
                  {of.gb_incluidos > 0 && (
                    <span className="badge badge-channel text-[10px]">
                      {of.gb_incluidos >= 9000 ? 'GB Ilimitados' : `${of.gb_incluidos} GB`}
                    </span>
                  )}
                </div>
                <div className="text-lg font-black text-[#019DF4]">
                  S/ {of.precio_mensual ? of.precio_mensual.toFixed(2) : '0.00'}
                  <span className="text-xs font-normal text-slate-400">/mes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
