import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Bot, 
  User, 
  Headphones, 
  Radio, 
  FileText, 
  Activity, 
  Zap,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

const SIMULACIONES_LOCAL = {
  call_in_averia_fibra: {
    tipo: "call_in",
    titulo: "Avería de Fibra / Intermitencia Severa",
    descripcion: "Cliente enojado por caída de internet hogar durante teletrabajo.",
    dialogos: [
      { speaker: "ASESOR", text: "Gracias por comunicarse con Movistar, le atiende Carlos. ¿Con quién tengo el gusto?", timestamp: "00:03" },
      { speaker: "CLIENTE", text: "Mire joven, habla Fernando Quispe. Estoy harto, desde ayer a las 3 de la tarde no tengo internet de fibra óptica en San Miguel y trabajo desde casa.", timestamp: "00:12" },
      { speaker: "ASESOR", text: "Comprendo perfectamente su molestia, señor Fernando. Permítame validar el estado de su nodo en nuestro sistema técnico.", timestamp: "00:20" },
      { speaker: "CLIENTE", text: "Siempre dicen lo mismo. Si no me solucionan hoy mismo la avería, voy a pedir la portabilidad de mis líneas móviles y cancelar el servicio.", timestamp: "00:31" },
      { speaker: "ASESOR", text: "Verifico que hubo una incidencia masiva en su zona y la cuadrilla técnica ya está cerrando la reposición. Le genero el código de reclamo REC-84920 con descuento en su siguiente ciclo.", timestamp: "00:45" },
      { speaker: "CLIENTE", text: "Espero que cumplan con el descuento porque ya son dos veces este mes. Quedo a la espera del mensaje de confirmación.", timestamp: "00:58" }
    ]
  },
  call_in_reclamo_facturacion: {
    tipo: "call_in",
    titulo: "Reclamo por Cobro Indebido en Facturación",
    descripcion: "Cliente reclama un cobro adicional por servicios no contratados.",
    dialogos: [
      { speaker: "ASESOR", text: "Bienvenido a Atención al Cliente Movistar, le atiende Patricia. ¿En qué le puedo asistir?", timestamp: "00:02" },
      { speaker: "CLIENTE", text: "Buenas tardes, me ha llegado el recibo de este mes con 45 soles de más. Yo tengo un plan de 69.90 y me están cobrando 114.90.", timestamp: "00:14" },
      { speaker: "ASESOR", text: "Lamento el inconveniente, déjeme revisar el desglose de su última factura emitida.", timestamp: "00:22" },
      { speaker: "CLIENTE", text: "Revisen bien porque yo nunca he solicitado paquetes adicionales de canales premium.", timestamp: "00:30" },
      { speaker: "ASESOR", text: "Tiene toda la razón, se activó una suscripción automática por error de plataforma. En este momento genero la anulación y una nota de crédito a su favor.", timestamp: "00:44" },
      { speaker: "CLIENTE", text: "Muchas gracias señorita, qué bueno que me lo haya resuelto de inmediato.", timestamp: "00:54" }
    ]
  },
  call_out_rechazo_precio_rebate_exitoso: {
    tipo: "call_out",
    titulo: "Rechazo por Precio -> Rebate a Movistar Total Exitoso",
    descripcion: "Oferta inicial rechazada por costo, pero acepta migrar a Movistar Total con 35% de ahorro.",
    dialogos: [
      { speaker: "ASESOR", text: "Buenas tardes, señorita Rosa. Le saluda Diego de promociones especiales Movistar. La llamamos porque por su puntualidad tiene preaprobado nuestro Plan Móvil Ilimitado 5G por S/ 99.90 al mes.", timestamp: "00:06" },
      { speaker: "CLIENTE", text: "Hola joven, gracias pero la verdad 99 soles me parece muy caro. Ahorita estoy ajustada con los gastos y no puedo pagar tanto por un plan móvil.", timestamp: "00:18" },
      { speaker: "ASESOR", text: "La entiendo totalmente. Pero veo en su perfil que usted ya cuenta con internet fibra en casa por separado y paga dos recibos distintos. Si unificamos sus servicios en Movistar Total Plus, en lugar de pagar más, ¡va a ahorrar 35% mensual y le duplicamos los gigas!", timestamp: "00:35" },
      { speaker: "CLIENTE", text: "¿Cómo es eso? ¿O sea que pagaría menos de lo que gasto sumando mis dos recibos actuales?", timestamp: "00:44" },
      { speaker: "ASESOR", text: "Exactamente, pasaría de pagar S/ 175 en total a solo S/ 123.44 con una sola boleta y velocidad simétrica en su hogar.", timestamp: "00:54" },
      { speaker: "CLIENTE", text: "Ah, perfecto. Si es con ahorro sí me interesa. Procedamos con el cambio.", timestamp: "01:03" }
    ]
  },
  call_out_rechazo_competencia_definitivo: {
    tipo: "call_out",
    titulo: "Rechazo por Compromiso de Permanencia con Claro/Entel",
    descripcion: "El cliente tiene contrato vigente con otro operador y no aplica para rebate inmediato.",
    dialogos: [
      { speaker: "ASESOR", text: "Hola, buenos días Sr. Manuel. Le llamamos de Movistar para ofrecerle una línea móvil con 25GB y redes ilimitadas a solo S/ 59.90.", timestamp: "00:06" },
      { speaker: "CLIENTE", text: "Mire amigo, no estoy interesado. Acabo de renovar contrato por 18 meses con mi operador actual y tengo penalidad si me cambio.", timestamp: "00:16" },
      { speaker: "ASESOR", text: "Comprendo. Le podemos ofrecer una segunda línea con 3 meses al 50% de descuento para algún familiar en su hogar.", timestamp: "00:26" },
      { speaker: "CLIENTE", text: "No gracias, toda mi familia está con el mismo operador. No me interesa ningún plan por ahora.", timestamp: "00:34" },
      { speaker: "ASESOR", text: "Entendido señor Manuel, agradezco su tiempo y que tenga buen día.", timestamp: "00:40" }
    ]
  }
};

export function SpeechTranscriber({ 
  tipo = 'call_in', // 'call_in' | 'call_out'
  clienteId,
  ofertaInicial,
  ofertaRebate,
  onAnalisisCompletado,
  isAnalyzing = false 
}) {
  const [isPlayingSim, setIsPlayingSim] = useState(false);
  const [simulaciones, setSimulaciones] = useState(SIMULACIONES_LOCAL);
  const initialKey = tipo === 'call_in' ? 'call_in_averia_fibra' : 'call_out_rechazo_precio_rebate_exitoso';
  const [selectedSimKey, setSelectedSimKey] = useState(initialKey);
  const [transcript, setTranscript] = useState([]);
  const [simIndex, setSimIndex] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState([20, 45, 75, 30, 60, 90, 40, 65, 80, 25, 55, 70]);
  
  const timerRef = useRef(null);
  const simTimerRef = useRef(null);
  const animAudioRef = useRef(null);
  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);

  // Asegurar que si cambia el tipo ('call_in' vs 'call_out') se actualice la clave seleccionada
  useEffect(() => {
    const defaultKey = tipo === 'call_in' ? 'call_in_averia_fibra' : 'call_out_rechazo_precio_rebate_exitoso';
    setSelectedSimKey(defaultKey);
    setTranscript([]);
    setSimIndex(0);
    setCallDuration(0);
    setIsPlayingSim(false);
  }, [tipo]);

  // Cargar catálogo de simulaciones adicionales si el backend responde
  useEffect(() => {
    let isMounted = true;
    api.getSpeechSimulaciones().then(data => {
      if (!isMounted) return;
      if (data && Object.keys(data).length > 0) {
        setSimulaciones(prev => ({ ...prev, ...data }));
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Auto-scroll contenido SOLO dentro del div del chat (sin mover la ventana principal)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [transcript]);

  // Temporizador de duración de llamada y ondas de audio
  useEffect(() => {
    if (isPlayingSim) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      animAudioRef.current = setInterval(() => {
        setAudioLevel([
          Math.floor(Math.random() * 80) + 15,
          Math.floor(Math.random() * 95) + 20,
          Math.floor(Math.random() * 90) + 10,
          Math.floor(Math.random() * 75) + 30,
          Math.floor(Math.random() * 100) + 20,
          Math.floor(Math.random() * 85) + 15,
          Math.floor(Math.random() * 90) + 25,
          Math.floor(Math.random() * 70) + 20,
          Math.floor(Math.random() * 85) + 15,
          Math.floor(Math.random() * 95) + 25,
          Math.floor(Math.random() * 60) + 10,
          Math.floor(Math.random() * 80) + 20,
        ]);
      }, 150);
    } else {
      clearInterval(timerRef.current);
      clearInterval(animAudioRef.current);
    }
    return () => {
      clearInterval(timerRef.current);
      clearInterval(animAudioRef.current);
    };
  }, [isPlayingSim]);

  // Manejo de reproducción paso a paso de simulación
  useEffect(() => {
    if (isPlayingSim && selectedSimKey && simulaciones[selectedSimKey]) {
      const dialogos = simulaciones[selectedSimKey].dialogos || [];
      if (simIndex < dialogos.length) {
        simTimerRef.current = setTimeout(() => {
          setTranscript(prev => [...prev, dialogos[simIndex]]);
          setSimIndex(prev => prev + 1);
        }, 1800);
      } else {
        setIsPlayingSim(false);
      }
    }
    return () => clearTimeout(simTimerRef.current);
  }, [isPlayingSim, simIndex, selectedSimKey, simulaciones]);

  const handleStartSim = () => {
    setTranscript([]);
    setSimIndex(0);
    setCallDuration(0);
    setIsPlayingSim(true);
  };

  const handleCargarInmediato = () => {
    const key = selectedSimKey || (tipo === 'call_in' ? 'call_in_averia_fibra' : 'call_out_rechazo_precio_rebate_exitoso');
    if (simulaciones[key]) {
      const dialogos = simulaciones[key].dialogos || [];
      setTranscript(dialogos);
      setSimIndex(dialogos.length);
      setCallDuration(55);
      setIsPlayingSim(false);
    }
  };

  const handleStopSim = () => {
    setIsPlayingSim(false);
    clearTimeout(simTimerRef.current);
  };

  const handleReset = () => {
    setIsPlayingSim(false);
    setTranscript([]);
    setSimIndex(0);
    setCallDuration(0);
  };

  const handleEjecutarAnalisis = () => {
    if (transcript.length === 0) {
      alert("Primero selecciona y reproduce una simulación de llamada para generar la transcripción.");
      return;
    }
    setIsPlayingSim(false);

    if (onAnalisisCompletado) {
      onAnalisisCompletado({
        transcripcion: transcript,
        duracion_seg: callDuration,
        cliente_id: clienteId,
        oferta_inicial: ofertaInicial,
        oferta_rebate: ofertaRebate
      });
    }
  };

  const { isDark } = useTheme();

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const simKeys = Object.keys(simulaciones).filter(k => simulaciones[k]?.tipo === tipo);
  const currentSim = selectedSimKey && simulaciones[selectedSimKey] ? simulaciones[selectedSimKey] : (simKeys.length > 0 ? simulaciones[simKeys[0]] : null);

  return (
    <div className={`border rounded-2xl p-4 shadow-xl flex flex-col gap-4 transition-all duration-300 ${
      isDark 
        ? 'bg-[#061426]/90 border-[#005C84]/40 text-slate-100 shadow-black/40' 
        : 'bg-white border-[#005C84]/15 text-[#002D42] shadow-[#005C84]/10'
    }`}>
      {/* Header del Widget */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
        isDark ? 'border-[#005C84]/20' : 'border-slate-100'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2.5 rounded-xl ${
            isPlayingSim 
              ? 'bg-rose-500/20 text-rose-500 animate-pulse' 
              : isDark ? 'bg-[#00C6D7]/20 text-[#00C6D7]' : 'bg-[#005C84]/10 text-[#005C84]'
          }`}>
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className={`font-bold text-sm leading-tight ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                Speech-to-Text & Transcripción Diarizada HD
              </h4>
              {isPlayingSim && (
                <span className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                  isDark ? 'text-rose-400 bg-rose-950/80 border-rose-800/60' : 'text-rose-700 bg-rose-50 border-rose-200 font-bold'
                }`}>
                  <Radio className="w-3 h-3 animate-ping text-rose-500" /> EN VIVO ({formatTime(callDuration)})
                </span>
              )}
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
              Canales estéreo separados (Asesor Diadema / Cliente Línea Telefónica) + LLM Post-Hoc
            </p>
          </div>
        </div>

        {/* Selector de Simulación */}
        <div className="flex items-center gap-2">
          <label className={`text-[11px] font-bold shrink-0 ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>Caso Demo:</label>
          <select
            value={selectedSimKey}
            onChange={(e) => {
              setSelectedSimKey(e.target.value);
              handleReset();
            }}
            disabled={isPlayingSim}
            className={`text-xs rounded-xl px-3 py-2 focus:outline-none transition shadow-inner font-medium ${
              isDark 
                ? 'bg-[#030914] border border-[#005C84]/40 text-slate-200 focus:border-[#00C6D7]' 
                : 'bg-slate-50 border border-slate-300 text-slate-800 focus:border-[#005C84]'
            }`}
          >
            {simKeys.map(k => (
              <option key={k} value={k}>
                📻 {simulaciones[k]?.titulo}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Visualizador de Ondas de Audio y Estado de CTI */}
      <div className={`border rounded-xl p-2.5 flex items-center justify-between gap-3 ${
        isDark ? 'bg-[#030914]/90 border-[#005C84]/30' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2 text-xs font-mono">
          <Activity className={`w-4 h-4 ${
            isPlayingSim ? 'text-emerald-500 animate-spin' : isDark ? 'text-slate-600' : 'text-slate-400'
          }`} />
          <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Audio CTI:</span>
          <span className={
            isPlayingSim 
              ? 'text-emerald-500 font-bold' 
              : transcript.length > 0 
              ? (isDark ? 'text-[#00C6D7] font-semibold' : 'text-[#005C84] font-semibold')
              : (isDark ? 'text-slate-500' : 'text-slate-400')
          }>
            {isPlayingSim ? "TRANSMITIENDO EN VIVO (ESTÉREO DIARIZADO)" : transcript.length > 0 ? "LLAMADA FINALIZADA" : "LISTO PARA SIMULACIÓN"}
          </span>
          {currentSim && (
            <span className={`hidden md:inline-block ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>• {currentSim.descripcion}</span>
          )}
        </div>

        {/* Barras animadas de ecualizador */}
        <div className="flex items-center gap-1 h-5">
          {audioLevel.map((lvl, idx) => (
            <div
              key={idx}
              className={`w-1 rounded-full transition-all duration-150 ${
                isPlayingSim 
                  ? 'bg-gradient-to-t from-[#005C84] to-[#00C6D7]' 
                  : isDark ? 'bg-slate-700' : 'bg-slate-300'
              }`}
              style={{ height: isPlayingSim ? `${lvl}%` : '20%' }}
            />
          ))}
        </div>
      </div>

      {/* Caja de Transcripción en Vivo (Chat Diarizado) */}
      <div 
        ref={chatContainerRef}
        className={`border rounded-xl p-3.5 h-64 overflow-y-auto flex flex-col gap-2.5 text-xs font-sans shadow-inner ${
          isDark ? 'bg-[#030914]/95 border-[#005C84]/30' : 'bg-slate-50/80 border-slate-200'
        }`}
      >
        {transcript.length === 0 ? (
          <div className={`h-full flex flex-col items-center justify-center gap-2.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <PhoneCall className={`w-9 h-9 stroke-[1.5] animate-pulse ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
            <p className="text-center max-w-md">
              Haz clic en <strong className={isDark ? 'text-blue-400' : 'text-[#005C84]'}>"Reproducir Llamada Demo"</strong> para ver el diálogo en tiempo real o en <strong className={isDark ? 'text-amber-400' : 'text-amber-700'}>"Carga Inmediata"</strong> para ver todo el caso instantáneamente.
            </p>
          </div>
        ) : (
          transcript.map((item, idx) => {
            const isAsesor = item.speaker === "ASESOR";
            return (
              <div 
                key={idx}
                className={`flex gap-2.5 max-w-[88%] animate-fadeIn ${isAsesor ? 'self-start' : 'self-end flex-row-reverse'}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 shadow-md ${
                  isAsesor ? 'bg-[#005C84] text-white' : 'bg-[#7AB800] text-white'
                }`}>
                  {isAsesor ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>
                <div className={`p-3 rounded-2xl shadow-sm border ${
                  isAsesor 
                    ? isDark 
                      ? 'bg-[#0b1c34] border-[#005C84]/40 text-slate-100 rounded-tl-none' 
                      : 'bg-white border-slate-200 text-[#002D42] rounded-tl-none shadow-sm'
                    : isDark 
                      ? 'bg-emerald-950/60 border-emerald-800/70 text-emerald-100 rounded-tr-none' 
                      : 'bg-emerald-50 border-emerald-200 text-emerald-950 rounded-tr-none shadow-sm'
                }`}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className={`font-bold text-[10px] uppercase tracking-wider ${
                      isAsesor 
                        ? (isDark ? 'text-[#00C6D7]' : 'text-[#005C84]') 
                        : (isDark ? 'text-emerald-300' : 'text-emerald-700')
                    }`}>
                      {isAsesor ? '🎧 Asesor Movistar' : '👤 Cliente'}
                    </span>
                    <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.timestamp}</span>
                  </div>
                  <p className="leading-relaxed text-xs font-normal">{item.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Controles de Acción */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-2">
          {/* Botón Reproducción en Tiempo Real */}
          {!isPlayingSim ? (
            <button
              onClick={handleStartSim}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#005C84] hover:bg-[#0078A8] active:scale-95 text-xs font-bold text-white transition shadow-md cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Reproducir Llamada Demo
            </button>
          ) : (
            <button
              onClick={handleStopSim}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-xs font-bold text-white transition shadow-lg cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-current" /> Pausar
            </button>
          )}

          {/* Botón Carga Instantánea */}
          <button
            onClick={handleCargarInmediato}
            disabled={isPlayingSim}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition shadow-sm cursor-pointer disabled:opacity-50 border ${
              isDark 
                ? 'bg-[#0a1b30] hover:bg-[#0e2440] text-slate-200 border-[#005C84]/40' 
                : 'bg-slate-100 hover:bg-slate-200 text-[#002D42] border-slate-300'
            }`}
            title="Carga el diálogo completo al instante sin esperar"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Carga Inmediata
          </button>

          {/* Botón Reiniciar */}
          {(transcript.length > 0 || isPlayingSim) && (
            <button
              onClick={handleReset}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark 
                  ? 'bg-[#0a1b30] hover:bg-[#0e2440] text-slate-400 hover:text-slate-200 border-[#005C84]/40' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-[#002D42] border-slate-300'
              }`}
              title="Limpiar Conversación"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Botón Analizar con LLM Post-Hoc */}
        <button
          onClick={handleEjecutarAnalisis}
          disabled={transcript.length === 0 || isAnalyzing}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-[#005C84] hover:from-purple-500 hover:to-[#0078A8] active:scale-95 text-xs font-black text-white shadow-md transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : 'text-amber-300'}`} />
          {isAnalyzing ? "Analizando con LLM..." : "Finalizar & Analizar con IA"}
        </button>
      </div>
    </div>
  );
}

export default SpeechTranscriber;
