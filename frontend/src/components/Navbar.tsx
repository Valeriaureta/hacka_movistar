'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserCheck, Zap, Package, BarChart3 } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Visor Asesor (DITO)', icon: UserCheck },
    { href: '/simulador', label: 'Simulador Scoring', icon: Zap },
    { href: '/catalogo', label: 'Catálogo Ofertas', icon: Package },
    { href: '/dashboard', label: 'Dashboard Directivo', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#081B2B]/85 border-b border-white/10 px-6 py-3.5 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3 text-xl font-bold tracking-tight text-white">
          <Image 
            src="https://www.telefonica.com/es/wp-content/uploads/sites/4/2021/12/movistar-logo-marcas.png?w=640" 
            alt="Movistar Logo" 
            width={32} 
            height={32} 
            className="object-contain"
          />
          <span>
            Movistar <span className="font-light text-[var(--movistar-green)]">Personalization</span>
          </span>
        </Link>
        <span className="text-xs font-semibold uppercase text-[#019DF4] bg-[#019DF4]/10 px-2.5 py-0.5 rounded-full border border-[#019DF4]/20">
          NBO Engine 2.0
        </span>
      </div>

      <nav className="flex items-center gap-1.5">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#019DF4]/15 text-[#019DF4] font-semibold shadow-inner'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2.5 text-xs text-slate-400">
        <div className="w-2 h-2 rounded-full bg-[var(--movistar-green)] shadow-[0_0_8px_var(--movistar-green)] animate-pulse" />
        <span className="hidden sm:inline">Modelo Logístico Activo</span>
      </div>
    </header>
  );
}
