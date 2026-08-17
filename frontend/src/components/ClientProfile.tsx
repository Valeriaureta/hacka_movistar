'use client';

import { ClientePerfil } from '@/lib/types';
import { motion } from 'framer-motion';
import { User, Smartphone, ShieldCheck, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface ClientProfileProps {
  clienteId: string;
  perfil: ClientePerfil;
}

export default function ClientProfile({ clienteId, perfil }: ClientProfileProps) {
  const tieneMora = perfil.dias_mora && perfil.dias_mora > 0;
  const arpuNum = perfil.arpu_actual || 0;
  const gbNum = perfil.consumo_datos_gb || 0;
  const gbPct = Math.min(100, Math.round((gbNum / 40) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="card bg-white dark:bg-[#081B2B]/95 border border-slate-200 dark:border-white/10 shadow-sm p-6 sm:p-7 relative overflow-hidden"
    >
      <div className="flex flex-col gap-4">
        {/* Superior: ID del Cliente y Estado */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 dark:bg-[#019DF4]/15 text-[#0070B8] dark:text-[#00D2FF] flex items-center justify-center border border-sky-500/20 dark:border-[#019DF4]/25 shadow-inner">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white font-mono">{clienteId}</h2>
                <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-transparent px-2.5 py-0.5 rounded-lg">
                  {perfil.departamento}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {perfil.edad_rango}
                </span>
              </div>
              <div className="flex gap-2 mt-1.5 flex-wrap items-center">
                {perfil.elegible_mt ? (
                  <span className="badge badge-mt text-[11px] font-bold">
                    <Sparkles className="w-3.5 h-3.5" /> Elegible Movistar Total
                  </span>
                ) : perfil.es_movistar_total ? (
                  <span className="badge badge-channel text-[11px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 inline mr-0.5" /> Cliente Movistar Total
                  </span>
                ) : null}

                {tieneMora ? (
                  <span className="badge badge-alerta text-[11px] font-bold">
                    <AlertCircle className="w-3.5 h-3.5" /> Mora {perfil.dias_mora?.toFixed(0)}d
                  </span>
                ) : (
                  <span className="badge badge-optimo text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Pagos al día
                  </span>
                )}

                {perfil.es_usuario_app && (
                  <span className="badge bg-purple-500/10 dark:bg-[#9D65FF]/15 text-purple-700 dark:text-[#C4B5FD] border border-purple-500/20 dark:border-[#9D65FF]/30 text-[11px] font-medium">
                    <Smartphone className="w-3.5 h-3.5 inline mr-0.5" /> App Activa
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-[#061524] px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/5 text-right shadow-sm">
            <ShieldCheck className="w-5 h-5 text-[#0070B8] dark:text-[#00D2FF]" />
            <div className="text-left">
              <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">Canal Recomendado</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{perfil.canal_preferente || 'Digital'}</div>
            </div>
          </div>
        </div>

        {/* Inferior: 4 Datos Clave */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4 border-t border-slate-100 dark:border-white/5">
          <div className="bg-slate-50 dark:bg-[#051424] p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-sm">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Gasto Actual (ARPU)</div>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-title mt-0.5">
              S/ {arpuNum.toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#051424] p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-sm">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Consumo Promedio</div>
            <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-[#70D81E] font-title mt-0.5">
              {gbNum.toFixed(1)} GB
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-emerald-500 dark:bg-[#5CB615] rounded-full" style={{ width: `${gbPct}%` }} />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#051424] p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-sm">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Antigüedad</div>
            <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-[#FFB300] font-title mt-0.5">
              {perfil.antiguedad_meses} meses
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#051424] p-3.5 rounded-2xl border border-slate-200/80 dark:border-white/5 shadow-sm">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Historial Reclamos</div>
            <div className={`text-lg sm:text-xl font-black font-title mt-0.5 ${perfil.reclamos > 0 ? 'text-rose-600 dark:text-[#FF5252]' : 'text-slate-800 dark:text-slate-200'}`}>
              {perfil.reclamos === 0 ? '0 reclamos' : `${perfil.reclamos} reclamo(s)`}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
