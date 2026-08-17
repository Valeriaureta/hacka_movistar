'use client';

import { useState } from 'react';
import { simularScoring } from '@/lib/api';
import { ScoringAdHocResponse } from '@/lib/types';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Play, Lightbulb, MessageSquare, Sparkles } from 'lucide-react';

export default function SimulatorPage() {
  const [clientId, setClientId] = useState('CLI000001');
  const [ofertaId, setOfertaId] = useState('OF020');
  const [canal, setCanal] = useState('Digital');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoringAdHocResponse | null>(null);

  const handleSimulate = async () => {
    if (!clientId.trim()) {
      toast.error('Por favor ingresa un ID de cliente válido');
      return;
    }

    setLoading(true);
    try {
      const res = await simularScoring(clientId.trim().toUpperCase(), ofertaId, canal);
      setResult(res);

      if (res.score_porcentaje >= 70) {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#019DF4', '#5CB615', '#00D2FF', '#FFFFFF'],
        });
        toast.success(`¡Alta Propensión (${res.score_porcentaje}%)!`, {
          description: 'Oportunidad óptima de conversión para el asesor.',
        });
      } else {
        toast.info(`Simulación completada: ${res.score_porcentaje}% de propensión`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Error al simular scoring');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card bg-white dark:bg-[#081B2B]/95 border border-slate-200 dark:border-white/10 p-6 sm:p-8 shadow-sm dark:shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-[#019DF4]/10 to-transparent pointer-events-none" />

        <div className="flex items-center gap-3.5 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-sky-500/10 dark:bg-gradient-to-br dark:from-[#019DF4]/30 dark:to-[#00D2FF]/20 text-[#0070B8] dark:text-[#00D2FF] flex items-center justify-center border border-sky-500/20 dark:border-[#019DF4]/30 shadow-inner">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-title">
              Simulador de Scoring y Speech en Tiempo Real
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Evalúa cualquier combinación ad-hoc entre un cliente, una oferta y un canal con el modelo logístico.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Cliente ID
            </label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="search-input text-sm pl-4 font-mono"
              placeholder="CLI000001"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Oferta a Evaluar
            </label>
            <select
              value={ofertaId}
              onChange={(e) => setOfertaId(e.target.value)}
              className="search-input text-sm pl-4 cursor-pointer"
            >
              <option value="OF020">OF020 - Movistar Total Básico (S/ 149.90)</option>
              <option value="OF021">OF021 - Movistar Total Plus (S/ 179.90)</option>
              <option value="OF022">OF022 - Movistar Total Max (S/ 219.90)</option>
              <option value="OF002">OF002 - Plan Móvil Plus 25GB (S/ 59.90)</option>
              <option value="OF004">OF004 - Plan Móvil Ilimitado (S/ 99.90)</option>
              <option value="OF010">OF010 - Internet Fibra 200Mbps (S/ 79.90)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Canal de Contacto
            </label>
            <select
              value={canal}
              onChange={(e) => setCanal(e.target.value)}
              className="search-input text-sm pl-4 cursor-pointer"
            >
              <option value="Digital">Canal Digital / App Mi Movistar</option>
              <option value="Call In">Call In (Atención Entrante)</option>
              <option value="Call Out">Call Out (Campaña Saliente)</option>
              <option value="Tienda">Tienda Presencial Movistar</option>
            </select>
          </div>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="btn-primary px-8 py-3 rounded-xl text-sm font-black shadow-lg gap-2.5 cursor-pointer font-title"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{loading ? 'Calculando con Motor NBO...' : 'Simular Propensión y Speech'}</span>
          </button>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10"
            >
              <div className="bg-slate-50 dark:bg-[#061524] p-6 sm:p-7 rounded-2xl border border-sky-300 dark:border-[#019DF4]/30 shadow-sm dark:shadow-lg space-y-6">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div>
                    <span className="badge badge-mt text-xs font-bold mb-2.5">
                      <Sparkles className="w-3.5 h-3.5" /> Simulación Evaluada
                    </span>
                    <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-title">{result.oferta.nombre_oferta}</h4>
                    <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">{result.oferta.descripcion_corta}</div>
                  </div>

                  <div className="text-right bg-white dark:bg-black/40 px-5 py-3 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <div
                      className="text-3xl sm:text-4xl font-black font-title"
                      style={{
                        color:
                          result.score_porcentaje >= 70
                            ? '#16A34A'
                            : result.score_porcentaje >= 50
                            ? '#D97706'
                            : '#0070B8',
                      }}
                    >
                      {result.score_porcentaje}%
                    </div>
                    <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold tracking-wider mt-1">
                      Score de Propensión
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 my-2">
                  <div className="bg-sky-500/10 dark:bg-sky-950/30 border border-sky-500/25 border-l-4 border-l-[#019DF4] p-3.5 sm:p-4 rounded-xl text-slate-800 dark:text-slate-200 shadow-sm">
                    <div className="font-bold text-[#0070B8] dark:text-[#00D2FF] flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wider font-title">
                      <Lightbulb className="w-3.5 h-3.5 text-[#0070B8] dark:text-[#00D2FF]" />
                      Diagnóstico Explicable (XAI):
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">{result.explicabilidad.por_que_este_cliente}</p>
                  </div>

                  <div className="bg-white dark:bg-[#040D17] border border-dashed border-sky-300 dark:border-[#019DF4]/40 rounded-2xl p-4 sm:p-5 shadow-sm">
                    <div className="text-xs font-extrabold uppercase text-[#0070B8] dark:text-[#019DF4] flex items-center gap-1.5 mb-2 tracking-wider font-title">
                      <MessageSquare className="w-3.5 h-3.5 text-[#0070B8] dark:text-[#00D2FF]" />
                      Speech Comercial Adaptado
                    </div>
                    <p className="text-sm sm:text-base text-slate-800 dark:text-slate-100 italic leading-relaxed font-sans pt-0.5">
                      &ldquo;{result.explicabilidad.speech_comercial}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
