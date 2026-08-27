import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Code, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  Wifi, 
  Shield, 
  Bell, 
  ArrowUpRight, 
  Zap, 
  User, 
  Loader2,
  Signal,
  Battery,
  Layers,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { MOCK_CLIENTES } from '../data/mockData';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export function CanalDigital() {
  const [clientesList, setClientesList] = useState(MOCK_CLIENTES);
  const [selectedClienteIndex, setSelectedClienteIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isContracting, setIsContracting] = useState(false);
  const [contractSuccess, setContractSuccess] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    api.getClientes('Digital', 10)
      .then(data => {
        if (!isMounted) return;
        if (data && data.length > 0) {
          setClientesList(data);
        }
      })
      .catch(err => console.error("Error al cargar clientes digitales:", err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const rawClient = clientesList[selectedClienteIndex]?.cliente || clientesList[selectedClienteIndex] || MOCK_CLIENTES[0];
  const motor = clientesList[selectedClienteIndex]?.motor_nbo;
  const isHighRisk = (rawClient?.score_churn || 0) > 0.45;
  const topNBO = motor?.top_3?.[0] || clientesList[selectedClienteIndex]?.ofertas_nbo?.[0] || {
    oferta_id: "MT-01",
    nombre_oferta: "Movistar Total Dúo Fibra 200 Mbps",
    precio_promocional: 119.90,
    precio_mensual: 119.90,
    precio_regular: 189.90,
    ahorro_pct: 35
  };
  const precioOferta = topNBO.precio_mensual || topNBO.precio_promocional;

  // Simulación de payload JSON inyectado a la App
  const jsonPayload = {
    event: "IN_APP_NBO_POPUP",
    timestamp: new Date().toISOString(),
    cliente_id: rawClient.cliente_id,
    churn_score: rawClient.score_churn,
    segment: isHighRisk ? "RISK_RETENTION" : rawClient.elegible_mt ? "CONVERGENT_PROMO_MT" : "DATA_UPSELL_5G",
    personalized_banner: {
      title: isHighRisk 
        ? "¡Bono Especial de Retención! 30% OFF en tu factura" 
        : rawClient.elegible_mt 
        ? "¡Eres elegible a Movistar Total!" 
        : "¡Upgrade a Plan Datos Ilimitados!",
      action_cta: isHighRisk ? "Activar Descuento Ahora" : "Migrar con 1 Clic",
      badge: isHighRisk ? "Compensación VIP" : topNBO.ahorro_pct > 0 ? `Ahorro Exclusivo ${topNBO.ahorro_pct}%` : "Upgrade Premium",
      offer_id: topNBO.oferta_id,
      monthly_price: `S/ ${precioOferta}`
    }
  };

  const handleInAppContract = async () => {
    setIsContracting(true);
    try {
      await api.registrarGestion({
        cliente_id: rawClient.cliente_id,
        canal: 'Digital',
        oferta_id: topNBO.oferta_id,
        oferta_nombre: topNBO.nombre_oferta,
        es_movistar_total: topNBO.es_movistar_total || topNBO.oferta_id.startsWith("OF020") || topNBO.oferta_id.startsWith("OF021") || topNBO.oferta_id.startsWith("OF022"),
        estado: 'ACEPTADA',
        precio_oferta: precioOferta,
        ahorro_pct: topNBO.ahorro_pct
      });
      setContractSuccess(true);
      setTimeout(() => setContractSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsContracting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-6">
      
      {/* Header Compact */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 transition-colors duration-300 ${
        isDark ? 'border-[#005C84]/20' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-500 font-bold">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-lg font-bold leading-none ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                Canal Digital (App Mi Movistar & Web)
              </h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                isDark 
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' 
                  : 'bg-cyan-50 text-cyan-700 border-cyan-200'
              }`}>
                Inyección Headless Zero-Touch
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
              Demostración de personalización dinámica de banners vía API sin intervención humana
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className={`font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>Middleware:</span>
          <span className="font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            API RESTful Active
          </span>
        </div>
      </div>

      {/* Main Split Layout: Control & JSON (Left 7 cols) vs Mobile Mockup (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: Customer Selector & JSON API Payload (lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Customer Archetype Selector */}
          <div className={`border rounded-2xl p-4 shadow-xl space-y-3 transition-all duration-300 ${
            isDark 
              ? 'bg-[#061426]/85 border-[#005C84]/35 shadow-black/40' 
              : 'bg-white border-[#005C84]/15 shadow-[#005C84]/10'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-slate-300' : 'text-[#005C84]'
              }`}>
                <Layers className="w-4 h-4 text-[#00C6D7]" />
                1. Seleccionar Arquetipo de Cliente para Simulación:
              </span>
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Reactiva en vivo</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {clientesList.slice(0, 6).map((item, idx) => {
                const isSelected = selectedClienteIndex === idx;
                const cli = item.cliente || item;
                const cliHighRisk = (cli.score_churn || 0) > 0.45;

                return (
                  <button
                    key={cli.cliente_id || cli.dni}
                    onClick={() => setSelectedClienteIndex(idx)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected 
                        ? isDark
                          ? 'bg-[#00a9e0]/15 border-[#00a9e0] shadow-md shadow-[#00a9e0]/10'
                          : 'bg-sky-50 border-[#005C84] shadow-sm'
                        : isDark
                          ? 'bg-[#030914] border-slate-800 hover:bg-slate-800/40'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`font-bold text-xs ${
                        isSelected 
                          ? (isDark ? 'text-[#00C6D7]' : 'text-[#005C84]') 
                          : (isDark ? 'text-white' : 'text-[#002D42]')
                      }`}>
                        {cli.nombre || cli.cliente_id}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                        cliHighRisk 
                          ? 'bg-rose-500/20 text-rose-500' 
                          : cli.elegible_mt 
                          ? 'bg-[#7AB800]/20 text-[#7AB800]' 
                          : 'bg-cyan-500/20 text-cyan-600'
                      }`}>
                        {cliHighRisk ? '🔥 Churn' : cli.elegible_mt ? 'MT Propenso' : 'Upgrade'}
                      </span>
                    </div>
                    <p className={`text-[10px] mt-1 font-mono ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
                      {cli.plan_actual_nombre || cli.plan_actual_id} · S/ {cli.plan_actual_precio || cli.monto_facturado_prom}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* JSON Payload Viewer */}
          <div className={`border rounded-2xl p-4 shadow-xl space-y-2.5 transition-all duration-300 ${
            isDark 
              ? 'bg-[#061426]/85 border-[#005C84]/35 shadow-black/40' 
              : 'bg-white border-[#005C84]/15 shadow-[#005C84]/10'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isDark ? 'text-slate-300' : 'text-[#005C84]'
              }`}>
                <Code className="w-4 h-4 text-emerald-500" />
                2. Payload JSON Inyectado por API / Middleware NBO:
              </span>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                HTTP 200 OK · Latency: 2.1ms
              </span>
            </div>

            <div className={`p-3.5 rounded-xl border text-[11px] font-mono overflow-x-auto max-h-64 shadow-inner ${
              isDark ? 'bg-[#030914] border-[#005C84]/30 text-emerald-300' : 'bg-slate-900 border-slate-700 text-emerald-400'
            }`}>
              <pre className="leading-relaxed">{JSON.stringify(jsonPayload, null, 2)}</pre>
            </div>

            <div className={`flex items-center justify-between text-[10px] font-mono pt-1 ${
              isDark ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <span>Endpoint: POST /api/nbo/predict-digital</span>
              <span>FastAPI + Micro-segmentación</span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Realistic Mobile Mockup iPhone (lg:col-span-5) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-[320px] h-[610px] bg-slate-950 rounded-[44px] border-[6px] border-slate-800 shadow-2xl overflow-hidden relative flex flex-col justify-between select-none">
            
            {/* Status Bar */}
            <div className="pt-2 px-6 flex justify-between items-center text-[10px] text-slate-400 z-30 font-mono">
              <span className="font-bold text-white">9:41</span>
              {/* Dynamic Island */}
              <div className="w-20 h-3.5 bg-slate-900 rounded-full mx-auto" />
              <div className="flex items-center gap-1">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Mi Movistar App Header */}
            <div className="pt-3 pb-2.5 px-4 bg-gradient-to-b from-[#00a9e0]/20 via-slate-950/80 to-transparent flex justify-between items-center border-b border-slate-900/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#00a9e0] text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                  M
                </div>
                <span className="font-extrabold text-xs text-white tracking-wide">Mi Movistar</span>
              </div>
              <div className="relative">
                <Bell className="w-4 h-4 text-slate-300" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />
              </div>
            </div>

            {/* App Body Container */}
            <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
              
              {/* Saludo y Plan Actual */}
              <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800/80 shadow">
                <span className="text-[10px] text-slate-400">Hola de nuevo,</span>
                <h4 className="font-bold text-white text-xs leading-tight">
                  {rawClient.nombre ? rawClient.nombre.split(' ')[0] : 'Cliente'}
                </h4>
                <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex justify-between text-[10px]">
                  <span className="text-slate-400">Plan Actual:</span>
                  <span className="font-semibold text-[#00a9e0] truncate max-w-[140px]">
                    {rawClient.plan_actual_nombre || rawClient.plan_actual_id}
                  </span>
                </div>
              </div>

              {/* DYNAMIC PERSONALIZED HERO BANNER */}
              <div className={`p-3.5 rounded-2xl border shadow-xl relative overflow-hidden transition-all duration-300 ${
                isHighRisk 
                  ? 'bg-gradient-to-br from-rose-950/90 via-slate-900 to-slate-900 border-rose-500/50' 
                  : 'bg-gradient-to-br from-[#00a9e0]/30 via-slate-900 to-slate-900 border-[#00a9e0]/50'
              }`}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-white/20 text-white backdrop-blur">
                    {jsonPayload.personalized_banner.badge}
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </div>

                <h5 className="font-black text-white text-xs leading-tight">
                  {jsonPayload.personalized_banner.title}
                </h5>

                <p className="text-[10px] text-slate-200 mt-1.5">
                  {topNBO.nombre_oferta} a solo <strong className="text-emerald-400 font-mono">{jsonPayload.personalized_banner.monthly_price}/mes</strong>
                </p>

                {contractSuccess ? (
                  <div className="w-full mt-2.5 bg-emerald-500 text-slate-950 font-black text-[10px] py-2 rounded-xl flex items-center justify-center gap-1 animate-fadeIn">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ¡Plan Activado con Éxito!
                  </div>
                ) : (
                  <button 
                    onClick={handleInAppContract}
                    disabled={isContracting}
                    className="w-full mt-2.5 bg-white hover:bg-slate-100 text-slate-950 font-bold text-[10px] py-2 rounded-xl flex items-center justify-center gap-1 transition shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {isContracting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> Procesando...
                      </>
                    ) : (
                      <>
                        {jsonPayload.personalized_banner.action_cta} <ArrowUpRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Consumo de Datos Visual */}
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-[10px]">
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Mis Datos Consumidos</span>
                  <span className="font-mono font-bold text-white">{rawClient.consumo_datos_gb_prom || 15} GB</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#00a9e0] h-full rounded-full" style={{ width: '70%' }} />
                </div>
              </div>

            </div>

            {/* Bottom App Navigation Bar */}
            <div className="p-2.5 bg-slate-900/90 border-t border-slate-800/80 flex justify-around text-[9px] text-slate-400">
              <span className="text-[#00a9e0] font-bold">Inicio</span>
              <span>Servicios</span>
              <span>Beneficios</span>
              <span>Soporte</span>
            </div>

            {/* Home Indicator Bar */}
            <div className="pb-1.5 pt-0.5 flex justify-center bg-slate-900/90">
              <div className="w-24 h-1 bg-slate-600 rounded-full" />
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

export default CanalDigital;
