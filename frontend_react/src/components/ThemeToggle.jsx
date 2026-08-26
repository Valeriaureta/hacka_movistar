import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? "Cambiar a Modo Claro (Día Movistar)" : "Cambiar a Modo Oscuro (Noche Movistar)"}
      className={`relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-300 cursor-pointer ${
        isDark 
          ? 'bg-[#005C84]/30 hover:bg-[#005C84]/60 text-amber-300 border border-[#00C6D7]/40 shadow-[0_0_12px_rgba(0,198,215,0.25)] hover:scale-105' 
          : 'bg-white hover:bg-slate-100 text-[#005C84] border border-[#005C84]/30 shadow-md hover:scale-105'
      } ${className}`}
      aria-label="Alternar Modo Claro / Oscuro"
    >
      {isDark ? (
        <div className="flex items-center gap-1.5">
          <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
          <span className="text-[11px] font-bold tracking-tight text-amber-200 hidden sm:inline">Claro</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <Moon className="w-4 h-4 text-[#005C84]" />
          <span className="text-[11px] font-bold tracking-tight text-[#005C84] hidden sm:inline">Oscuro</span>
        </div>
      )}
    </button>
  );
}
