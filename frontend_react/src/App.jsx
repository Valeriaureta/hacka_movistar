import React, { useState } from 'react';
import { 
  Store, 
  PhoneIncoming, 
  PhoneOutgoing, 
  Smartphone, 
  MessageSquare, 
  BarChart3, 
  Sparkles,
  LogOut,
  LayoutGrid,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { CanalTienda } from './components/CanalTienda';
import { CanalCallIn } from './components/CanalCallIn';
import { CanalCallOut } from './components/CanalCallOut';
import { CanalDigital } from './components/CanalDigital';
import { CanalWhatsApp } from './components/CanalWhatsApp';
import DashboardE2E from './components/DashboardE2E';
import LoginSSO from './components/auth/LoginSSO';
import RolePortal from './components/portal/RolePortal';
import ThemeToggle from './components/ThemeToggle';
import { ThemeProvider, useTheme } from './context/ThemeContext';

function MainApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const { isDark } = useTheme();

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    
    // RBAC Routing Logic:
    switch (userData.role) {
      case 'asesor_tienda':
        setCurrentView('tienda');
        break;
      case 'asesor_callout':
        setCurrentView('callout');
        break;
      case 'asesor_callin':
        setCurrentView('callin');
        break;
      case 'asesor_digital':
        setCurrentView('whatsapp');
        break;
      case 'asesor_app':
        setCurrentView('digital');
        break;
      case 'gerente':
        setCurrentView('dashboard');
        break;
      case 'admin_demo':
      default:
        setCurrentView('portal');
        break;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

  // If not authenticated, show SSO Login
  if (!currentUser || currentView === 'login') {
    return <LoginSSO onLogin={handleLogin} />;
  }

  // Navigation Items available for admin_demo
  const adminChannels = [
    { id: 'portal', label: 'Hub Principal', icon: LayoutGrid, color: isDark ? 'text-[#00C6D7]' : 'text-[#005C84]' },
    { id: 'dashboard', label: 'Dashboard E2E', icon: BarChart3, color: isDark ? 'text-amber-400' : 'text-amber-600' },
    { id: 'tienda', label: 'Tienda Física', icon: Store, color: 'text-[#00C6D7]' },
    { id: 'callout', label: 'Call Out', icon: PhoneOutgoing, color: isDark ? 'text-indigo-400' : 'text-indigo-600' },
    { id: 'callin', label: 'Call In', icon: PhoneIncoming, color: isDark ? 'text-sky-400' : 'text-[#005C84]' },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-[#7AB800]' },
    { id: 'digital', label: 'App Digital', icon: Smartphone, color: isDark ? 'text-fuchsia-400' : 'text-fuchsia-600' },
  ];

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark 
        ? 'bg-[#040c18] text-slate-100 selection:bg-[#00C6D7] selection:text-slate-950' 
        : 'bg-[#F4F7FB] text-[#002D42] selection:bg-[#005C84] selection:text-white'
    }`}>
      
      {/* Top Enterprise Navigation Bar */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300 px-6 py-3 ${
        isDark 
          ? 'bg-[#061224]/90 border-[#005C84]/30 shadow-lg shadow-black/30' 
          : 'bg-white/95 border-[#005C84]/15 shadow-sm shadow-[#005C84]/5'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Branding Movi Nexo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white p-1.5 shadow-md shadow-black/10 flex items-center justify-center border border-slate-100 dark:border-white/10">
              <img src="/logo.svg" alt="Movi Nexo Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center">
                <span className={`font-extrabold text-base tracking-tight ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                  Movi <span className={`font-light ${isDark ? 'text-[#00C6D7]' : 'text-[#005C84]'}`}>Nexo</span>
                </span>
              </div>
            </div>
          </div>

          {/* If user is admin_demo, allow quick channel switching */}
          {currentUser.role === 'admin_demo' && (
            <nav className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {adminChannels.map((ch) => {
                const Icon = ch.icon;
                const isActive = currentView === ch.id;

                return (
                  <button
                    key={ch.id}
                    onClick={() => setCurrentView(ch.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ${
                      isActive 
                        ? isDark 
                          ? 'bg-[#005C84]/50 text-white shadow-md border border-[#00C6D7]/50 font-bold' 
                          : 'bg-[#005C84] text-white shadow-md font-bold'
                        : isDark 
                          ? 'text-slate-400 hover:text-slate-200 hover:bg-[#005C84]/20' 
                          : 'text-[#515559] hover:text-[#005C84] hover:bg-[#005C84]/10'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? (isDark ? ch.color : 'text-[#00C6D7]') : (isDark ? 'text-slate-400' : 'text-slate-500')}`} />
                    <span>{ch.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Controls: Theme Toggle + User Profile + Logout */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Sun / Moon */}
            <ThemeToggle />

            {/* User Profile Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
              isDark 
                ? 'bg-[#081a33]/80 border-[#005C84]/40 text-slate-300' 
                : 'bg-white border-[#005C84]/20 text-[#515559] shadow-sm'
            }`}>
              <div className="w-2.5 h-2.5 rounded-full bg-[#7AB800] animate-pulse" />
              <div className="text-left">
                <p className={`font-bold text-[11px] leading-tight truncate max-w-[120px] ${isDark ? 'text-white' : 'text-[#005C84]'}`}>
                  {currentUser.displayName}
                </p>
                <p className={`text-[10px] font-mono leading-tight ${isDark ? 'text-slate-400' : 'text-[#515559]'}`}>
                  {currentUser.role.replace('_', ' ').toUpperCase()}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Cerrar Sesión Corporativa"
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark 
                  ? 'bg-[#081a33] border-[#005C84]/30 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400' 
                  : 'bg-white border-slate-200 hover:border-rose-500/50 hover:bg-rose-50 text-[#515559] hover:text-rose-600 shadow-sm'
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full transition-colors duration-300">
        {currentView === 'portal' && (
          <RolePortal 
            onSelectChannel={(chanId) => setCurrentView(chanId)}
            onOpenDashboard={() => setCurrentView('dashboard')}
          />
        )}
        {currentView === 'dashboard' && <DashboardE2E />}
        {currentView === 'tienda' && <CanalTienda />}
        {currentView === 'callin' && <CanalCallIn />}
        {currentView === 'callout' && <CanalCallOut />}
        {currentView === 'digital' && <CanalDigital />}
        {currentView === 'whatsapp' && <CanalWhatsApp />}
      </main>

      {/* Footer Movistar */}
      <footer className={`border-t py-4 text-center text-xs font-mono transition-colors duration-300 ${
        isDark ? 'border-[#005C84]/20 text-slate-500' : 'border-slate-200 text-[#515559]'
      }`}>
        <p>Sistema NBO Omnicanal Adaptativo | Movistar (Integratel Perú) — 2026</p>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

export default App;
