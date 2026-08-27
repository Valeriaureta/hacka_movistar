import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Sparkles, 
  Building2, 
  PhoneCall, 
  PhoneIncoming, 
  MessageSquare, 
  BarChart3, 
  ArrowRight,
  Fingerprint
} from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import { useTheme } from '../../context/ThemeContext';

const QUICK_ROLES = [
  {
    id: 'asesor_tienda',
    title: 'Tienda Física',
    icon: Building2,
    color: 'from-[#005C84] to-[#00C6D7]',
    username: 'asesor_tienda@movistar.com.pe'
  },
  {
    id: 'asesor_callout',
    title: 'Call Out',
    icon: PhoneCall,
    color: 'from-indigo-600 to-[#00C6D7]',
    username: 'agente_callout@movistar.com.pe'
  },
  {
    id: 'asesor_callin',
    title: 'Call In',
    icon: PhoneIncoming,
    color: 'from-[#005C84] to-sky-400',
    username: 'agente_callin@movistar.com.pe'
  },
  {
    id: 'asesor_digital',
    title: 'WhatsApp',
    icon: MessageSquare,
    color: 'from-[#7AB800] to-teal-500',
    username: 'whatsapp_lead@movistar.com.pe'
  },
  {
    id: 'asesor_app',
    title: 'App Digital',
    icon: Sparkles,
    color: 'from-[#00C6D7] to-cyan-500',
    username: 'app_digital@movistar.com.pe'
  },
  {
    id: 'gerente',
    title: 'Gerencia CVM',
    icon: BarChart3,
    color: 'from-amber-500 to-orange-500',
    username: 'gerencia_cvm@movistar.com.pe'
  },
  {
    id: 'admin_demo',
    title: 'Admin Demo',
    icon: ShieldCheck,
    color: 'from-[#005C84] via-[#00C6D7] to-[#7AB800]',
    username: 'admin_demo@movistar.com.pe'
  }
];

export default function LoginSSO({ onLogin }) {
  const [username, setUsername] = useState('admin_demo@movistar.com.pe');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState('admin_demo');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { isDark } = useTheme();

  const handleQuickSelect = (role) => {
    setSelectedRole(role.id);
    setUsername(role.username);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setTimeout(() => {
      const roleObj = QUICK_ROLES.find(r => r.id === selectedRole) || QUICK_ROLES[6];
      onLogin({
        role: selectedRole,
        username: username,
        displayName: roleObj.title,
        token: 'movistar-jwt-sso-session-2026'
      });
      setIsAuthenticating(false);
    }, 600);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#040c18] text-white selection:bg-[#00C6D7] selection:text-slate-950' : 'bg-[#F4F7FB] text-[#002D42] selection:bg-[#005C84] selection:text-white'
    }`}>
      
      {/* Top Right Theme Toggle */}
      <div className="absolute top-6 right-6 z-30">
        <ThemeToggle />
      </div>

      {/* Dynamic Movistar Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#005C84]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#00C6D7]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-[#7AB800]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl z-10 flex flex-col items-center">
        
        {/* Header Centered with Movistar Identity */}
        <div className="text-center mb-10 animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00C6D7]/15 border border-[#00C6D7]/30 text-[#00C6D7] text-xs font-bold tracking-widest uppercase mb-6 shadow-[0_0_20px_rgba(0,198,215,0.2)]">
            <Fingerprint className="w-4 h-4 text-[#00C6D7]" />
            Entorno Seguro · Movistar IAM
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-white p-2 flex items-center justify-center shadow-lg shadow-black/15 border border-slate-100 dark:border-white/10">
              <img src="/logo.svg" alt="MoviNexo Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              <span className={isDark ? 'text-white' : 'text-[#005C84]'}>Movi</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C6D7] via-teal-400 to-[#7AB800]">
                Nexo
              </span>
            </h1>
          </div>
          
          <p className={`text-sm md:text-base max-w-xl mx-auto leading-relaxed mt-3 ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
            Sistema Omnicanal de Recomendación Inteligente NBO 2.0 impulsado por <strong className={isDark ? 'text-white' : 'text-[#005C84]'}>IA Generativa</strong> y <strong className={isDark ? 'text-white' : 'text-[#005C84]'}>Machine Learning</strong> para Movistar Perú.
          </p>
        </div>

        {/* Main Login Card */}
        <div className={`w-full max-w-md backdrop-blur-xl border rounded-3xl p-8 shadow-2xl mb-12 transform transition-all duration-300 ${
          isDark 
            ? 'bg-[#061426]/75 border-[#005C84]/40 shadow-black/60 hover:border-[#00C6D7]/50' 
            : 'bg-white border-[#005C84]/20 shadow-xl shadow-[#005C84]/10 hover:border-[#005C84]/40'
        }`}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ml-1 ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
                  Identidad Corporativa
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-[#00C6D7] transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`block w-full pl-11 pr-4 py-3.5 border rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00C6D7]/50 transition-all ${
                      isDark 
                        ? 'bg-[#030914] border-[#005C84]/40 text-white placeholder-slate-500 focus:border-[#00C6D7]' 
                        : 'bg-[#F8FAFC] border-slate-300 text-[#002D42] placeholder-slate-400 focus:border-[#005C84]'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ml-1 ${isDark ? 'text-slate-300' : 'text-[#515559]'}`}>
                  Contraseña SSO (Entra ID)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#00C6D7] transition-colors" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full pl-11 pr-4 py-3.5 border rounded-2xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00C6D7]/50 transition-all ${
                      isDark 
                        ? 'bg-[#030914] border-[#005C84]/40 text-white placeholder-slate-500 focus:border-[#00C6D7]' 
                        : 'bg-[#F8FAFC] border-slate-300 text-[#002D42] placeholder-slate-400 focus:border-[#005C84]'
                    }`}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full mt-2 bg-gradient-to-r from-[#005C84] via-[#00C6D7] to-[#005C84] hover:from-[#00C6D7] hover:to-[#005C84] text-white font-bold text-sm py-4 rounded-2xl shadow-lg shadow-[#00C6D7]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isAuthenticating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Autenticando en IAM...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema Movistar</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick Demo Roles */}
        <div className={`w-full max-w-4xl text-center border-t pt-8 transition-colors ${
          isDark ? 'border-[#005C84]/30' : 'border-slate-300'
        }`}>
          <p className={`text-xs font-bold uppercase tracking-widest mb-6 ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
            Selección Rápida de Perfil (Demo Hackathon)
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {QUICK_ROLES.map((r) => {
              const Icon = r.icon;
              const isSelected = selectedRole === r.id;
              
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleQuickSelect(r)}
                  className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? isDark 
                        ? 'bg-[#005C84]/40 border-[#00C6D7] shadow-[0_0_20px_rgba(0,198,215,0.25)] scale-105 transform' 
                        : 'bg-white border-[#005C84] shadow-lg shadow-[#005C84]/15 scale-105 transform ring-2 ring-[#005C84]/20'
                      : isDark 
                        ? 'bg-[#061224]/50 border-[#005C84]/20 hover:border-[#00C6D7]/40 hover:bg-[#005C84]/20' 
                        : 'bg-white/80 border-slate-200 hover:border-[#005C84]/30 hover:bg-slate-50 shadow-sm'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white shadow-sm shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-sm font-bold ${
                    isSelected 
                      ? (isDark ? 'text-white' : 'text-[#005C84]') 
                      : (isDark ? 'text-slate-300' : 'text-[#515559]')
                  }`}>
                    {r.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
