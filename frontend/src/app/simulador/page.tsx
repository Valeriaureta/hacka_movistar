'use client';

import { useState } from 'react';
import { simularScoring } from '@/lib/api';
import { ScoringAdHocResponse } from '@/lib/types';
import { useToast } from '@/components/Toast';
import { Zap, Play, Lightbulb, MessageSquare, Award } from 'lucide-react';

export default function SimulatorPage() {
  const { showToast } = useToast();
  const [clientId, setClientId] = useState('CLI000001');
  const [ofertaId, setOfertaId] = useState('OF020');
  const [canal, setCanal] = useState('Digital');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoringAdHocResponse | null>(null);

  const handleSimulate = async () => {
    if (!clientId.trim()) {
      showToast('Por favor ingresa un ID de cliente válido', 'info');
      return;
    }

    setLoading(true);
    try {
      const res = await simularScoring(clientId.trim().toUpperCase(), ofertaId, canal);
      setResult(res);
      showToast('Simulación de scoring calculada');
    } catch (err: unknown) {
      if (err instanceof Error) {
        showToast(err.message, 'info');
      } else {
        showToast('Error en simulación', 'info');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card bg-[#0C2136]/80 border-white/10 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#019DF4]/20 text-[#019DF4] flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Simulador de Propensión y Scoring en Tiempo Real</h2>
            <p className="text-xs text-slate-400">
              Evalúa el impacto y aceptación de cualquier combinación ad-hoc entre un cliente y una oferta.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Cliente ID</label>
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="search-input text-sm pl-4"
              placeholder="CLI000001"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Oferta a Evaluar</label>
            <select
              value={ofertaId}
              onChange={(e) => setOfertaId(e.target.value)}
              className="search-input text-sm pl-4 bg-[#081B2B]"
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
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Canal de Contacto</label>
            <select
              value={canal}
              onChange={(e) => setCanal(e.target.value)}
              className="search-input text-sm pl-4 bg-[#081B2B]"
            >
              <option value="Digital">Canal Digital / App</option>
              <option value="Call In">Call In (Entrante)</option>
              <option value="Call Out">Call Out (Saliente)</option>
              <option value="Tienda">Tienda Presencial</option>
            </select>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{loading ? 'Calculando predicción...' : 'Simular Score y Speech'}</span>
          </button>
        </div>

        {result && (
          <div className="mt-8 pt-6 border-t border-white/10 animate-in fade-in duration-300">
            <div className="bg-black/30 p-5 rounded-2xl border border-[#019DF4]/30">
              <div className="flex justify-between items-start gap-4 mb-4 flex-wrap">
                <div>
                  <span className="badge badge-mt text-xs mb-2">Simulación Evaluada</span>
                  <h4 className="text-lg font-black text-white">{result.oferta.nombre_oferta}</h4>
                  <div className="text-xs text-slate-400 mt-0.5">{result.oferta.descripcion_corta}</div>
                </div>

                <div className="text-right">
                  <div
                    className="text-3xl font-black"
                    style={{
                      color:
                        result.score_porcentaje >= 70
                          ? '#00C853'
                          : result.score_porcentaje >= 50
                          ? '#FFB300'
                          : '#019DF4',
                    }}
                  >
                    {result.score_porcentaje}%
                  </div>
                  <div className="text-xs uppercase text-slate-400 font-semibold mt-0.5">
                    Score Predicho
                  </div>
                </div>
              </div>

              <div className="bg-[#019DF4]/10 border-l-4 border-[#019DF4] p-3.5 rounded-r-xl text-xs text-slate-200 leading-relaxed mb-4">
                <div className="font-bold text-[#019DF4] flex items-center gap-1.5 mb-1">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Diagnóstico Explicable:
                </div>
                {result.explicabilidad.por_que_este_cliente}
              </div>

              <div className="bg-black/40 border border-dashed border-[#019DF4]/40 rounded-xl p-4">
                <div className="text-xs font-bold uppercase text-[#019DF4] flex items-center gap-1.5 mb-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Speech Comercial Adaptado
                </div>
                <p className="text-sm text-slate-100 italic leading-relaxed">
                  &ldquo;{result.explicabilidad.speech_comercial}&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
