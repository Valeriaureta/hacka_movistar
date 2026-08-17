'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserCheck, Zap, Package, BarChart3, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { href: '/', label: 'Visor Asesor', icon: UserCheck },
    { href: '/simulador', label: 'Simulador', icon: Zap },
    { href: '/catalogo', label: 'Catálogo', icon: Package },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 dark:bg-[#061320]/95 border-b border-slate-200 dark:border-white/10 px-4 sm:px-8 py-4 sm:py-5 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-[1440px] mx-auto flex justify-between items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3.5">
          <Link href="/" className="flex items-center gap-3.5 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white group">
            <div className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#019DF4]/20 to-[#5CB615]/20 p-1.5 border border-slate-200 dark:border-white/10 group-hover:border-[#019DF4]/50 group-hover:scale-105 transition-all shadow-md">
              <Image 
                src="https://www.telefonica.com/es/wp-content/uploads/sites/4/2021/12/movistar-logo-marcas.png?w=640" 
                alt="Movistar Logo" 
                width={36} 
                height={36} 
                className="object-contain drop-shadow"
              />
            </div>
            <span className="font-title tracking-tight">
              Movi<span className="text-[#16A34A] dark:text-[#70D81E] font-black">NEXO</span>
            </span>
          </Link>
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0070B8] dark:text-[#019DF4] bg-sky-500/10 px-3 py-1 rounded-full border border-[#019DF4]/25">
            <Sparkles className="w-3.5 h-3.5 text-[#0070B8] dark:text-[#00D2FF]" />
            Asistente Comercial
          </span>
        </div>

        <nav className="flex items-center gap-1 bg-slate-100 dark:bg-black/25 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                  isActive
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 rounded-xl bg-sky-500/15 dark:bg-gradient-to-r dark:from-[#019DF4]/25 dark:to-[#00D2FF]/20 border border-sky-500/30 dark:border-[#019DF4]/50 shadow-sm dark:shadow-[0_0_15px_rgba(1,157,244,0.25)]"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-[#0070B8] dark:text-[#38BDF8]' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {/* Botón de Modo Claro / Oscuro */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 transition-all cursor-pointer shadow-sm hover:scale-105"
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-[#FFB300]" />
                <span className="hidden sm:inline">Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#0070B8]" />
                <span className="hidden sm:inline">Modo Oscuro</span>
              </>
            )}
          </button>

          <div className="hidden lg:flex items-center gap-2 text-xs text-emerald-800 dark:text-slate-300 bg-emerald-500/10 dark:bg-[#0A1E32]/70 px-3.5 py-2 rounded-full border border-emerald-500/20 dark:border-white/5 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] dark:bg-[#5CB615] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#16A34A] dark:bg-[#5CB615]"></span>
            </span>
            <span className="font-bold text-[11px]">Sistema Activo</span>
          </div>
        </div>
      </div>
    </header>
  );
}
