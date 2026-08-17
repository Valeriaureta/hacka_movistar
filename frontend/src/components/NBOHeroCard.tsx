'use client';

import { NBOTopOferta } from '@/lib/types';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Award, Copy, Check, Lightbulb, MessageSquare, Sparkles, TrendingUp, PhoneCall } from 'lucide-react';
import { useState } from 'react';

interface NBOHeroCardProps {
  topOffer: NBOTopOferta;
}

export default function NBOHeroCard({ topOffer }: NBOHeroCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(topOffer.explicabilidad.speech_comercial);
    setCopied(true);
    toast.success('Speech comercial copiado', {
      description: `Listo para ofrecer ${topOffer.nombre_oferta}`,
      duration: 2500,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const renderSpeech = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="text-[#0070B8] dark:text-[#38BDF8] font-bold bg-sky-500/15 dark:bg-[#019DF4]/20 px-1.5 py-0.5 rounded not-italic">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const isMT = topOffer.oferta_es_mt;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`card relative overflow-hidden p-6 sm:p-7 border bg-white dark:bg-[#081B2B]/95 border-slate-200 dark:border-white/10 shadow-sm dark:shadow-md ${
        isMT ? 'border-l-4 border-l-[#16A34A] dark:border-l-[#5CB615]' : 'border-l-4 border-l-[#019DF4]'
      }`}
    >
      {/* Top Accent Line */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
          isMT ? 'from-[#019DF4] via-[#00D2FF] to-[#5CB615]' : 'from-[#019DF4] to-[#00D2FF]'
        }`}
      />

      {/* Header: Oferta y Precio */}
      <div className="flex justify-between items-start gap-4 flex-wrap mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-700 dark:text-[#FFB300] border border-amber-500/25">
              <Award className="w-3.5 h-3.5" />
              OFERTA PRINCIPAL RECOMENDADA
            </span>
            {isMT && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-[#70D81E] border border-emerald-500/25">
                <Sparkles className="w-3 h-3" /> Movistar Total
              </span>
            )}
          </div>

          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 font-title capitalize tracking-tight">
            {topOffer.nombre_oferta}
          </h3>
        </div>

        <div className="text-right bg-slate-50 dark:bg-black/30 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="text-2xl sm:text-3xl font-black text-[#0070B8] dark:text-[#00D2FF] font-title">
            S/ {topOffer.precio_mensual ? topOffer.precio_mensual.toFixed(2) : '0.00'}
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/mes</span>
          </div>
          {topOffer.ahorro_pct > 0 && (
            <div className="text-xs font-extrabold text-emerald-600 dark:text-[#70D81E] mt-0.5 flex items-center justify-end gap-1">
              <TrendingUp className="w-3 h-3" /> Ahorra {topOffer.ahorro_pct}%
            </div>
          )}
        </div>
      </div>

      {/* CONTENEDOR CON SEPARACIÓN CLARA ENTRE AMBAS CAJAS */}
      <div className="flex flex-col gap-4 my-4">
        {/* CAJA 1: Diagnóstico / Por qué ofrecer este plan (Píldora informativa) */}
        <div className="bg-sky-500/10 dark:bg-sky-950/30 border border-sky-500/25 border-l-4 border-l-[#019DF4] p-3.5 sm:p-4 rounded-xl text-slate-800 dark:text-slate-200 shadow-sm">
          <div className="font-bold text-[#0070B8] dark:text-[#00D2FF] flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wider font-title">
            <Lightbulb className="w-3.5 h-3.5 text-[#0070B8] dark:text-[#00D2FF]" />
            ¿Por qué ofrecerle este plan?
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
            {topOffer.explicabilidad.por_que_este_cliente}
          </p>
        </div>

        {/* CAJA 2: Speech Comercial (Tarjeta independiente con cabecera y botón) */}
        <div className="bg-slate-50 dark:bg-[#040D17] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/10 relative shadow-sm dark:shadow-md">
          <div className="flex justify-between items-center mb-2.5 pb-2.5 border-b border-slate-200 dark:border-white/5 flex-wrap gap-2">
            <span className="text-xs font-extrabold uppercase text-[#0070B8] dark:text-[#019DF4] flex items-center gap-1.5 tracking-wider font-title">
              <MessageSquare className="w-3.5 h-3.5 text-[#0070B8] dark:text-[#00D2FF]" />
              Speech Comercial Recomendado (Listo para leer)
            </span>
            <button
              onClick={handleCopy}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                copied
                  ? 'bg-[#16A34A] text-white'
                  : 'text-[#0070B8] dark:text-[#00D2FF] bg-sky-500/10 hover:bg-sky-500/20 dark:bg-[#019DF4]/15 dark:hover:bg-[#019DF4]/25 border border-sky-500/20 dark:border-[#019DF4]/30 hover:scale-105'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Speech'}</span>
            </button>
          </div>

          <p className="text-sm sm:text-base text-slate-800 dark:text-slate-100 italic leading-relaxed font-sans pt-0.5">
            &ldquo;{renderSpeech(topOffer.explicabilidad.speech_comercial)}&rdquo;
          </p>
        </div>
      </div>

      {/* Footer con información de apoyo */}
      <div className="flex justify-between items-center gap-3 pt-3 border-t border-slate-100 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
        <div className="flex items-center gap-1.5">
          <PhoneCall className="w-3.5 h-3.5 text-[#0070B8] dark:text-[#00D2FF]" />
          <span>Canal sugerido: <strong className="text-slate-800 dark:text-slate-200">{topOffer.explicabilidad.canal_sugerido}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400">Afinidad estimada:</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-[#70D81E] border border-emerald-500/25">
            {topOffer.score_porcentaje}% Alta
          </span>
        </div>
      </div>
    </motion.div>
  );
}
