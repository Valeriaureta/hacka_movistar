import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Sparkles, CheckCircle2, XCircle, Bot, Loader2, Lightbulb } from 'lucide-react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const MOTIVOS_PREDETERMINADOS = [
  { id: "Precio muy alto", label: "Precio percibido muy alto / Fuera de presupuesto" },
  { id: "Mala experiencia previa", label: "Mala experiencia previa / Reclamos pasados" },
  { id: "No necesita el servicio", label: "No siente necesidad de más gigas o velocidad" },
  { id: "Compromiso con otro operador", label: "Permanencia o contrato con otro operador" },
  { id: "Sin cobertura fibra", label: "Dudas sobre cobertura técnica en su zona" }
];

export default function RebateModal({ isOpen, onClose, cliente, oferta, canal, onConfirmReject, onAcceptAfterRebate }) {
  const [selectedMotivo, setSelectedMotivo] = useState(MOTIVOS_PREDETERMINADOS[0].id);
  const [loadingAI, setLoadingAI] = useState(false);
  const [rebateData, setRebateData] = useState({
    argumento: "",
    tip: "",
    origen: "Iniciando...",
    is_live_ai: false
  });
  const { isDark } = useTheme();

  // Generar respuesta IA cada vez que se abre el modal o cambia el motivo
  useEffect(() => {
    if (!isOpen || !cliente || !oferta) return;

    let isMounted = true;
    setLoadingAI(true);

    api.generarRebateIA(cliente, oferta, selectedMotivo, canal)
      .then(res => {
        if (!isMounted) return;
        if (res && res.argumento_rebate) {
          setRebateData({
            argumento: res.argumento_rebate,
            tip: res.tip_asesor || "Mantener escucha activa.",
            origen: res.origen || "Gemini AI",
            is_live_ai: res.is_live_ai || false
          });
        } else {
          // Fallback local
          const precio = oferta.precio_mensual || oferta.precio_promocional || 0;
          setRebateData({
            argumento: `Estimado cliente, comprendo su postura sobre "${selectedMotivo}". Con ${oferta.nombre_oferta} usted ahorra ${oferta.ahorro_pct || 0}% y optimiza su consumo a solo S/ ${precio}.`,
            tip: "Enfatizar el ahorro neto comparado con la facturación dispersa.",
            origen: "Motor NBO",
            is_live_ai: false
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          const precio = oferta.precio_mensual || oferta.precio_promocional || 0;
          setRebateData({
            argumento: `Comprendo perfectamente su duda sobre ${selectedMotivo}. Con ${oferta.nombre_oferta} a S/ ${precio}, unificamos su servicio garantizando ${oferta.ahorro_pct || 0}% de ahorro.`,
            tip: "Enfocar el cierre en el beneficio del primer mes.",
            origen: "Motor NBO",
            is_live_ai: false
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoadingAI(false);
      });

    return () => { isMounted = false; };
  }, [isOpen, selectedMotivo, cliente?.cliente_id, oferta?.oferta_id, canal]);

  if (!isOpen || !cliente || !oferta) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className={`border rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden transition-colors duration-300 ${
        isDark ? 'bg-[#061426] border-[#005C84]/40 text-white' : 'bg-white border-[#005C84]/20 text-[#002D42]'
      }`}>
        {/* Glow effect Movistar */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00C6D7]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className={`flex items-start justify-between pb-4 border-b ${
          isDark ? 'border-[#005C84]/20' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#005C84] to-[#00C6D7] flex items-center justify-center text-white shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                  Manejo de Objeción & Rebate IA
                </h3>
                {rebateData.is_live_ai ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#7AB800]/20 text-[#7AB800] border border-[#7AB800]/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Gemini Live
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00C6D7]/20 text-[#00C6D7] border border-[#00C6D7]/30">
                    Copiloto Movistar
                  </span>
                )}
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
                Canal {canal} · Cliente {cliente.cliente_id}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-[#005C84]/20' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario y Speech */}
        <div className="space-y-4 py-4">
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
              isDark ? 'text-slate-300' : 'text-[#515559]'
            }`}>
              Seleccione la objeción expresada por el cliente:
            </label>
            <select
              value={selectedMotivo}
              onChange={(e) => setSelectedMotivo(e.target.value)}
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm outline-none transition ${
                isDark 
                  ? 'bg-[#030914] border-[#005C84]/40 text-white focus:border-[#00C6D7]' 
                  : 'bg-slate-50 border-slate-300 text-[#002D42] focus:border-[#005C84]'
              }`}
            >
              {MOTIVOS_PREDETERMINADOS.map((m) => (
                <option key={m.id} value={m.id} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Speech de Rebate Asistido por IA Generativa */}
          <div className={`border p-4 rounded-2xl relative ${
            isDark 
              ? 'bg-gradient-to-br from-[#005C84]/20 via-[#061426] to-[#061426] border-[#00C6D7]/30' 
              : 'bg-gradient-to-br from-[#005C84]/5 via-white to-sky-50 border-[#005C84]/20'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00C6D7] flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-[#00C6D7]" /> Speech de Rebate Sugerido (IA Movistar)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {rebateData.origen}
              </span>
            </div>

            {loadingAI ? (
              <div className="flex items-center gap-2 py-4 text-xs text-[#00C6D7] font-medium justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generando contraargumento con IA en tiempo real...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className={`text-xs leading-relaxed italic p-3 rounded-xl border ${
                  isDark 
                    ? 'bg-[#030914]/80 text-slate-100 border-[#005C84]/20' 
                    : 'bg-white text-[#002D42] border-slate-200'
                }`}>
                  "{rebateData.argumento}"
                </p>

                {/* Tip táctico */}
                {rebateData.tip && (
                  <div className={`flex items-start gap-2 text-xs p-2.5 rounded-xl border ${
                    isDark 
                      ? 'text-[#7AB800] bg-[#7AB800]/10 border-[#7AB800]/20' 
                      : 'text-[#515559] bg-[#7AB800]/10 border-[#7AB800]/30'
                  }`}>
                    <Lightbulb className="w-3.5 h-3.5 text-[#7AB800] shrink-0 mt-0.5" />
                    <span><strong>Tip táctico:</strong> {rebateData.tip}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className={`flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t ${
          isDark ? 'border-[#005C84]/20' : 'border-slate-100'
        }`}>
          <button
            onClick={() => {
              onConfirmReject(selectedMotivo);
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            Registrar Rechazo Definitivo
          </button>

          <button
            onClick={() => {
              onAcceptAfterRebate();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#7AB800] hover:bg-[#6ba300] text-slate-950 text-xs font-black transition shadow-lg shadow-[#7AB800]/25 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            ¡Rebate Exitoso! Aceptar Oferta
          </button>
        </div>
      </div>
    </div>
  );
}
