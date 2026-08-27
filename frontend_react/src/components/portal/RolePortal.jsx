import React from 'react';
import { 
  Building2, 
  PhoneCall, 
  PhoneIncoming, 
  MessageSquare, 
  BarChart3, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap,
  Target,
  Users,
  Smartphone
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const CHANNELS_HUB = [
  {
    id: 'tienda',
    title: 'Tienda Física / Centro de Experiencia',
    subtitle: 'Atención presencial rápida',
    desc: 'Búsqueda por ID/DNI de cliente, visualización de top ofertas NBO con explicabilidad XAI y speech de asesor.',
    icon: Building2,
    badge: 'Front Office',
    color: 'from-[#005C84] to-[#00C6D7]',
    stats: 'Buscador + XAI + Venta Rápida'
  },
  {
    id: 'call_out',
    title: 'Call Center Outbound (Emisión)',
    subtitle: 'Campañas proactivas de alto valor',
    desc: 'Bandeja de clientes pre-priorizados con alta propensión a compra, filtrado por canal preferido y registro de llamadas.',
    icon: PhoneCall,
    badge: 'Telemarketing Proactivo',
    color: 'from-indigo-600 to-[#00C6D7]',
    stats: 'Listado de Leads + Priorización'
  },
  {
    id: 'call_in',
    title: 'Call Center Inbound (Recepción)',
    subtitle: 'Cross-selling en atención de soporte',
    desc: 'Identificación inmediata de cliente en línea durante la consulta de servicio, recomendación de oferta oportuna y speech de cierre.',
    icon: PhoneIncoming,
    badge: 'Atención al Cliente',
    color: 'from-[#005C84] to-sky-400',
    stats: 'Búsqueda en Línea + Copiloto'
  },
  {
    id: 'whatsapp',
    title: 'Canal WhatsApp Asistido',
    subtitle: 'Omnicanalidad conversacional',
    desc: 'Simulación de interacción vía mensajería instantánea con Quick Replies generados por IA y entrega de ofertas en tiempo real.',
    icon: MessageSquare,
    badge: 'Asesor Digital',
    color: 'from-[#7AB800] to-teal-500',
    stats: 'Simulador Chat + Quick Replies'
  },
  {
    id: 'digital',
    title: 'Canal App Digital (Mi Movistar)',
    subtitle: 'Autogestión Zero-Touch',
    desc: 'Banners y pop-ups pre-renderizados en la App del cliente basados en su propensión, permitiendo la compra sin intervención humana.',
    icon: Smartphone,
    badge: 'Self-Service',
    color: 'from-[#00C6D7] to-cyan-500',
    stats: 'Banners Inteligentes + 1-Click'
  }
];

export default function RolePortal({ onSelectChannel, onOpenDashboard }) {
  const { isDark } = useTheme();

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto px-4 py-6">
      
      {/* Top Banner / Hero with Movistar Colors */}
      <div className={`relative rounded-3xl border p-8 overflow-hidden shadow-2xl transition-all duration-300 ${
        isDark 
          ? 'bg-gradient-to-r from-[#061426] via-[#005C84]/30 to-[#061426] border-[#005C84]/40 shadow-black/40' 
          : 'bg-gradient-to-r from-white via-[#005C84]/10 to-white border-[#005C84]/20 shadow-xl shadow-[#005C84]/10'
      }`}>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#00C6D7]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#7AB800]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00C6D7]/15 border border-[#00C6D7]/30 text-[#00C6D7] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#00C6D7]" />
              Hub Omnicanal MoviNexo · Movistar Perú
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg shadow-black/15 border border-slate-100 dark:border-white/10">
                <img src="/logo.svg" alt="MoviNexo Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                MoviNexo{' '}
                <span className="bg-gradient-to-r from-[#00C6D7] via-teal-400 to-[#7AB800] bg-clip-text text-transparent">
                  Personalización Inteligente
                </span>
              </h1>
            </div>
            <p className={`text-sm max-w-2xl leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
              Seleccione cualquiera de los canales comerciales o el módulo gerencial para interactuar con la orquestación inteligente de ofertas personalizadas, XAI y trazabilidad E2E.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={onOpenDashboard}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#005C84] via-[#00C6D7] to-[#7AB800] hover:opacity-95 text-white font-black text-xs transition-all shadow-lg shadow-[#00C6D7]/20 flex items-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Ver Dashboard Funnel E2E (Gerencia)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Channels */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
            isDark ? 'text-slate-200' : 'text-[#005C84]'
          }`}>
            <Target className="w-4 h-4 text-[#00C6D7]" />
            Canales Comerciales de Atención Movistar:
          </h2>
          <span className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
            5 interfaces especializadas activas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CHANNELS_HUB.map((chan) => {
            const Icon = chan.icon;
            return (
              <div
                key={chan.id}
                onClick={() => onSelectChannel(chan.id)}
                className={`group relative rounded-3xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden transform hover:-translate-y-1 ${
                  isDark 
                    ? 'bg-[#061426]/80 border border-[#005C84]/30 hover:border-[#00C6D7]/60 hover:shadow-2xl hover:shadow-[#00C6D7]/15' 
                    : 'bg-white border border-[#005C84]/15 hover:border-[#005C84]/40 hover:shadow-xl hover:shadow-[#005C84]/10'
                }`}
              >
                {/* Subtle top gradient bar */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${chan.color}`} />

                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${chan.color} flex items-center justify-center text-white shadow-md shadow-[#005C84]/20`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                      isDark 
                        ? 'bg-[#030a14] text-[#00C6D7] border-[#00C6D7]/30' 
                        : 'bg-slate-50 text-[#005C84] border-[#005C84]/20'
                    }`}>
                      {chan.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className={`text-base font-bold transition-colors ${
                      isDark ? 'text-white group-hover:text-[#00C6D7]' : 'text-[#002D42] group-hover:text-[#005C84]'
                    }`}>
                      {chan.title}
                    </h3>
                    <p className={`text-xs font-semibold mt-0.5 ${isDark ? 'text-[#00C6D7]' : 'text-[#005C84]'}`}>
                      {chan.subtitle}
                    </p>
                    <p className={`text-xs mt-2.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
                      {chan.desc}
                    </p>
                  </div>
                </div>

                <div className={`pt-4 mt-4 border-t flex items-center justify-between transition-colors ${
                  isDark ? 'border-[#005C84]/20' : 'border-slate-100'
                }`}>
                  <span className={`text-[11px] font-mono flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
                    <Zap className="w-3.5 h-3.5 text-[#7AB800]" />
                    {chan.stats}
                  </span>

                  <div className="inline-flex items-center gap-1 text-xs font-bold text-[#00C6D7] group-hover:text-[#7AB800] transition-colors">
                    <span>Acceder</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
