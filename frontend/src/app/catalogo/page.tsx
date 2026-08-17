'use client';

import { useState, useEffect } from 'react';
import { getOfertas } from '@/lib/api';
import { Oferta } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Sparkles, Smartphone, Home, Zap } from 'lucide-react';

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
        setErrorMsg('Error al conectar con el backend. Asegúrate de que FastAPI esté en ejecución.');
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
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 font-title">
            <Package className="w-7 h-7 text-[#0070B8] dark:text-[#019DF4]" />
            Catálogo Comercial de Ofertas (22 Planes)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Portafolio estructurado para convergencia <strong className="text-emerald-700 dark:text-[#70D81E]">Movistar Total</strong>, líneas móviles y fibra óptica de alta velocidad.
          </p>
        </div>

        <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-black/30 rounded-2xl border border-slate-200 dark:border-white/5 flex-wrap">
          <button
            onClick={() => setCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              category === 'all'
                ? 'bg-[#019DF4] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            Todas (22)
          </button>
          <button
            onClick={() => setCategory('movistar_total')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              category === 'movistar_total'
                ? 'bg-[#16A34A] dark:bg-[#5CB615] text-white dark:text-black shadow-sm'
                : 'text-emerald-700 dark:text-[#70D81E] hover:bg-emerald-500/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Movistar Total
          </button>
          <button
            onClick={() => setCategory('plan_movil')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              category === 'plan_movil'
                ? 'bg-[#0088D6] dark:bg-[#00D2FF] text-white dark:text-black shadow-sm'
                : 'text-sky-700 dark:text-[#38BDF8] hover:bg-sky-500/10'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            Móvil Postpago
          </button>
          <button
            onClick={() => setCategory('plan_hogar')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              category === 'plan_hogar'
                ? 'bg-purple-600 dark:bg-[#9D65FF] text-white shadow-sm'
                : 'text-purple-700 dark:text-[#C4B5FD] hover:bg-purple-500/10'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            Internet Hogar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card text-center p-16 text-slate-600 dark:text-slate-300 bg-white dark:bg-[#081B2B]/80 border border-slate-200 dark:border-white/10 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#019DF4] border-t-transparent animate-spin" />
          <div className="text-lg font-bold text-slate-900 dark:text-white font-title">Cargando portafolio...</div>
        </div>
      ) : errorMsg ? (
        <div className="card text-center p-12 bg-white dark:bg-[#081B2B] border border-red-300 dark:border-red-500/30">
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2 font-title">Error de Conexión</h3>
          <p className="text-slate-600 dark:text-slate-300">{errorMsg}</p>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((of) => {
              const isMT = of.es_movistar_total || of.tipo_oferta === 'movistar_total';
              return (
                <motion.div
                  key={of.oferta_id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`card p-5 flex flex-col justify-between hover:translate-y-[-2px] transition-all shadow-sm hover:shadow-md relative overflow-hidden group border ${
                    isMT
                      ? 'bg-white dark:bg-gradient-to-b dark:from-[#092238] dark:to-[#061524] border-emerald-300 dark:border-[#5CB615]/30 hover:border-emerald-500 dark:hover:border-[#5CB615]/60'
                      : 'bg-white dark:bg-[#081B2B]/90 border-slate-200 dark:border-white/10 hover:border-sky-300 dark:hover:border-[#019DF4]/40'
                  }`}
                >
                  {isMT && (
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-[#019DF4] to-[#5CB615]" />
                  )}

                  <div>
                    <div className="flex justify-between items-start mb-2.5">
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400 font-bold">{of.oferta_id}</span>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {isMT ? (
                          <span className="badge badge-mt text-[10px] font-bold">
                            <Sparkles className="w-2.5 h-2.5" /> Movistar Total
                          </span>
                        ) : (
                          <span className="badge bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] border border-slate-200 dark:border-transparent">{of.tipo_oferta}</span>
                        )}
                        {of.ahorro_pct > 0 && (
                          <span className="badge badge-optimo text-[10px] font-bold">
                            {of.ahorro_pct}% Ahorro
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 dark:text-white mb-1.5 leading-snug font-title group-hover:text-[#0070B8] dark:group-hover:text-[#00D2FF] transition-colors">
                      {of.nombre_oferta}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {of.descripcion_corta || of.descripcion_bundle || 'Oferta estratégica convergente.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-white/10 flex justify-between items-center">
                    <div>
                      {of.gb_incluidos > 0 && (
                        <span className="badge badge-channel text-[10px] font-mono">
                          <Zap className="w-2.5 h-2.5 text-[#0070B8] dark:text-[#00D2FF]" />
                          {of.gb_incluidos >= 9000 ? 'GB Ilimitados' : `${of.gb_incluidos} GB`}
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-black text-[#0070B8] dark:text-[#00D2FF] font-title">
                      S/ {of.precio_mensual ? of.precio_mensual.toFixed(2) : '0.00'}
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/mes</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
