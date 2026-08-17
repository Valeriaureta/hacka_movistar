'use client';

import { NBOTopOferta } from '@/lib/types';
import { useToast } from './Toast';
import { Award, Copy, Check, Lightbulb, Compass, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface NBOHeroCardProps {
  topOffer: NBOTopOferta;
}

export default function NBOHeroCard({ topOffer }: NBOHeroCardProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(topOffer.explicabilidad.speech_comercial);
    setCopied(true);
    showToast('¡Speech comercial copiado con éxito!');
    setTimeout(() => setCopied(false), 2000);
  };

  const renderSpeech = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-white font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="card bg-[#0E2D4B] border-none relative overflow-hidden mb-6 shadow-md p-5">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#019DF4] via-[#00D2FF] to-[#00C853]" />

      <div className="flex justify-between items-start gap-4 flex-wrap mb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-[#FFB300]/20 text-[#FFB300]">
            <Award className="w-3.5 h-3.5" />
            TOP 1 RECOMENDACIÓN NBO
          </span>
          <h3 className="text-2xl font-black text-white mt-2 tracking-tight capitalize">
            {topOffer.nombre_oferta}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            {topOffer.oferta_es_mt
              ? '🌟 Producto Estratégico Movistar Total (Fijo + Móvil Convergente)'
              : '📱 Oferta Móvil / Hogar Optimizada'}
          </p>
        </div>

        <div className="text-right">
          <div className="text-2xl font-black text-[#38BDF8]">
            S/ {topOffer.precio_mensual ? topOffer.precio_mensual.toFixed(2) : '0.00'}
            <span className="text-xs font-normal text-slate-400">/mes</span>
          </div>
          {topOffer.ahorro_pct > 0 && (
            <div className="text-xs font-bold text-[#00C853] mt-0.5">
              Ahorro del {topOffer.ahorro_pct}%
            </div>
          )}
        </div>
      </div>

      {/* 5 Dimensiones XAI y Score Inline */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 bg-[#019DF4]/10 border-l-2 border-[#019DF4] p-3 rounded-r-md text-xs leading-relaxed text-slate-200">
            <div className="font-bold text-[#019DF4] flex items-center gap-1.5 mb-1">
              <Lightbulb className="w-3.5 h-3.5" />
              ¿Por qué a este cliente?
            </div>
            {topOffer.explicabilidad.por_que_este_cliente}
          </div>
          <div className="w-full sm:w-48 bg-black/20 p-3 rounded-md">
            <div className="text-[10px] text-slate-400 uppercase mb-1">Probabilidad</div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-black" style={{ color: topOffer.color }}>
                {topOffer.score_porcentaje}%
              </div>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${topOffer.score_porcentaje}%`, backgroundColor: topOffer.color }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2 px-1">
          <Compass className="w-4 h-4 text-[#019DF4]" />
          <span>
            <strong className="text-slate-200">Canal Sugerido:</strong>{' '}
            {topOffer.explicabilidad.canal_sugerido}
          </span>
        </div>

        {/* Speech Box Clean */}
        <div className="bg-[#081B2B] rounded-xl p-4 mt-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase text-[#019DF4] flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Speech Comercial
            </span>
            <button
              onClick={handleCopy}
              className="text-[#019DF4] bg-[#019DF4]/10 hover:bg-[#019DF4]/20 text-[10px] font-bold px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
          <p className="text-sm text-slate-200 italic leading-relaxed">
            &ldquo;{renderSpeech(topOffer.explicabilidad.speech_comercial)}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
