import React from 'react';
import { Sparkles, Cpu, HardDrive, AlertTriangle } from 'lucide-react';

/**
 * Muestra qué motor produjo realmente el análisis post-hoc.
 *
 * La cascada del backend es Gemini (nube) -> Ollama (local) -> heurístico. Si se
 * agota la cuota gratuita de Gemini el análisis lo resuelve el modelo local y
 * sigue siendo una inferencia real, así que la UI debe distinguir los tres casos
 * en lugar de rotularlo todo como "LLM".
 */
const ESTILOS = {
  OLLAMA_LOCAL: {
    clase: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
    Icono: HardDrive,
  },
  GOOGLE_GEMINI: {
    clase: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
    Icono: Sparkles,
  },
};

const ESTILO_HEURISTICO = {
  clase: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  Icono: Cpu,
};

export default function MotorAnalisisBadge({ motor, className = '' }) {
  if (!motor) return null;

  const esLLM = motor.es_llm_real === true;
  const latencia = motor.latencia_ms ? `${(motor.latencia_ms / 1000).toFixed(1)}s` : null;

  const { clase, Icono } = esLLM
    ? (ESTILOS[motor.proveedor] || ESTILOS.GOOGLE_GEMINI)
    : ESTILO_HEURISTICO;

  const IconoFinal = (!esLLM && motor.error) ? AlertTriangle : Icono;

  const texto = esLLM
    ? (motor.etiqueta || `${motor.proveedor} · ${motor.modelo}`).replace(/ · \d+(\.\d+)?s$/, '')
    : 'Motor heurístico (sin LLM)';

  const titulo = motor.error
    ? motor.error
    : `Inferencia ${motor.ejecucion === 'local' ? 'ejecutada en este equipo' : 'ejecutada en la nube'} por ${motor.modelo}`;

  return (
    <span
      title={titulo}
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${clase} ${className}`}
    >
      <IconoFinal className="w-3 h-3" />
      {texto}
      {latencia && <span className="font-mono opacity-80">{latencia}</span>}
    </span>
  );
}
