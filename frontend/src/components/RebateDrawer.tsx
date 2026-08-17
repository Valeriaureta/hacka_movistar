'use client';

import { useState } from 'react';
import { NBOTopOferta } from '@/lib/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Copy, Check, RefreshCw, MessageSquare } from 'lucide-react';

interface RebateDrawerProps {
  rebates: NBOTopOferta[];
}

export default function RebateDrawer({ rebates }: RebateDrawerProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const handleCopyRebate = (text: string, idx: number, offerName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.info('Speech alternativo copiado', {
      description: `Argumento para ${offerName}`,
      duration: 2500,
    });
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const labels = ['Plan B', 'Plan C'];

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 font-title uppercase tracking-wider">
          <RefreshCw className="w-4 h-4 text-[#0070B8] dark:text-[#00D2FF]" />
          <span>Alternativas si el cliente no acepta (Plan B y C)</span>
        </h4>
        <span className="text-xs text-slate-500 dark:text-slate-400">Opciones secundarias de contingencia</span>
      </div>

      <div className="flex flex-col gap-3">
        {rebates.map((reb, idx) => {
          const isExpanded = expandedIndex === idx;
          const isCopied = copiedIndex === idx;
          const planTag = labels[idx] || `Opción ${idx + 2}`;

          return (
            <div
              key={reb.oferta_id}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isExpanded
                  ? 'bg-sky-50/80 dark:bg-[#081E32] border-sky-300 dark:border-[#019DF4]/40 shadow-sm'
                  : 'bg-white dark:bg-[#07192A]/80 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-sm'
              }`}
            >
              <div
                onClick={() => toggleExpand(idx)}
                className="flex justify-between items-center cursor-pointer select-none p-4 sm:p-4.5"
              >
                <div className="flex items-center gap-3.5">
                  <span className="px-3 py-1 rounded-lg bg-sky-500/10 dark:bg-[#019DF4]/15 text-[#0070B8] dark:text-[#00D2FF] text-xs font-bold font-mono border border-sky-500/20 dark:border-transparent">
                    {planTag}
                  </span>
                  <div>
                    <div className="font-bold text-base text-slate-900 dark:text-white font-title capitalize">
                      {reb.nombre_oferta}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-300 mt-1 flex items-center gap-2.5">
                      <span className="font-bold text-slate-900 dark:text-white">
                        S/ {reb.precio_mensual?.toFixed(2)}/mes
                      </span>
                      {reb.ahorro_pct > 0 && (
                        <span className="text-emerald-600 dark:text-[#70D81E] font-bold">
                          • Ahorra {reb.ahorro_pct}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                  <span>{isExpanded ? 'Ocultar' : 'Ver Speech de Rebate'}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#0070B8] dark:text-[#00D2FF]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-2 border-t border-slate-200 dark:border-white/5 flex flex-col gap-3">
                      <div className="bg-slate-50 dark:bg-[#051320] p-4 sm:p-5 rounded-xl text-xs sm:text-sm italic text-slate-800 dark:text-slate-200 leading-relaxed border-l-4 border-[#019DF4] shadow-inner">
                        <div className="not-italic text-xs uppercase font-bold text-[#0070B8] dark:text-[#00D2FF] mb-2 flex items-center gap-1.5 font-title">
                          <MessageSquare className="w-4 h-4" /> Speech si rechaza la oferta principal:
                        </div>
                        &ldquo;{reb.explicabilidad.rebate_si_rechaza}&rdquo;
                      </div>

                      <div className="flex justify-end items-center pt-1">
                        <button
                          onClick={() => handleCopyRebate(reb.explicabilidad.rebate_si_rechaza, idx, reb.nombre_oferta)}
                          className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                            isCopied
                              ? 'bg-[#16A34A] text-white'
                              : 'text-[#0070B8] dark:text-[#00D2FF] bg-sky-500/10 hover:bg-sky-500/20 dark:bg-[#019DF4]/10 dark:hover:bg-[#019DF4]/20 border border-sky-500/20 dark:border-[#019DF4]/30 hover:scale-105'
                          }`}
                        >
                          {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span>{isCopied ? '¡Copiado!' : 'Copiar Speech'}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
