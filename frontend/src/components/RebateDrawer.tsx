'use client';

import { useState } from 'react';
import { NBOTopOferta } from '@/lib/types';
import { useToast } from './Toast';
import { ChevronDown, ChevronUp, Copy, RefreshCw } from 'lucide-react';

interface RebateDrawerProps {
  rebates: NBOTopOferta[];
}

export default function RebateDrawer({ rebates }: RebateDrawerProps) {
  const { showToast } = useToast();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const handleCopyRebate = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('¡Speech de rebate copiado al portapapeles!');
  };

  return (
    <div className="mt-4">
      <h4 className="text-xs font-bold text-slate-400 mb-2.5 flex items-center gap-1.5 uppercase tracking-wider">
        <RefreshCw className="w-3.5 h-3.5 text-[#019DF4]" />
        <span>Contingencia Inmediata (Rebates)</span>
      </h4>

      <div className="flex flex-col gap-2">
        {rebates.map((reb, idx) => {
          const isExpanded = expandedIndex === idx;
          return (
            <div
              key={reb.oferta_id}
              className="bg-[#081B2B] rounded-lg border border-white/5 hover:border-white/10 transition-all"
            >
              <div
                onClick={() => toggleExpand(idx)}
                className="flex justify-between items-center cursor-pointer select-none p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-md bg-white/10 text-white flex items-center justify-center text-[10px] font-bold">
                    #{idx + 2}
                  </span>
                  <div>
                    <div className="font-bold text-sm text-white capitalize">{reb.nombre_oferta}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Score: {reb.score_porcentaje}% • S/ {reb.precio_mensual?.toFixed(2)}/mes
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <span>{isExpanded ? 'Ocultar' : 'Ver Rebate'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </div>

              {isExpanded && (
                <div className="px-3 pb-3 pt-2 border-t border-white/5 animate-in fade-in duration-200">
                  <div className="bg-[#019DF4]/5 p-2.5 rounded text-[11px] italic text-slate-300 leading-relaxed border-l-2 border-[#019DF4]">
                    &ldquo;{reb.explicabilidad.rebate_si_rechaza}&rdquo;
                  </div>
                  <div className="text-right mt-2">
                    <button
                      onClick={() => handleCopyRebate(reb.explicabilidad.rebate_si_rechaza)}
                      className="text-[#38BDF8] hover:text-white text-[10px] font-bold flex items-center gap-1.5 ml-auto transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
