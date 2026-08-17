'use client';

import { ClientePerfil } from '@/lib/types';
import { User, Smartphone, ShieldCheck, DollarSign, Database, Clock, HelpCircle } from 'lucide-react';

interface ClientProfileProps {
  clienteId: string;
  perfil: ClientePerfil;
}

export default function ClientProfile({ clienteId, perfil }: ClientProfileProps) {
  const riesgoBadgeClass =
    perfil.riesgo_badge === 'alerta'
      ? 'badge-alerta'
      : perfil.riesgo_badge === 'advertencia'
      ? 'badge-advertencia'
      : 'badge-optimo';

  return (
    <div className="card mb-6 bg-[#081B2B] border-[#019DF4]/20 shadow-md p-4">
      <div className="flex flex-col gap-3">
        {/* Superior: ID y Badges */}
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#019DF4]/10 text-[#019DF4] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-extrabold text-white">{clienteId}</h2>
                <span className="text-xs text-slate-400">
                  {perfil.departamento} • {perfil.edad_rango}
                </span>
              </div>
              <div className="flex gap-2 mt-1 flex-wrap items-center">
                {perfil.elegible_mt ? (
                  <span className="badge badge-mt text-[10px]">✨ Elegible MT</span>
                ) : perfil.es_movistar_total ? (
                  <span className="badge badge-channel text-[10px]">🛡️ Movistar Total</span>
                ) : (
                  <span className="badge bg-white/5 text-slate-400 text-[10px]">No Convergente</span>
                )}
                <span className={`badge ${riesgoBadgeClass} text-[10px]`}>
                  Mora: {perfil.dias_mora ? perfil.dias_mora.toFixed(0) : 0}d
                </span>
                {perfil.es_usuario_app && (
                  <span className="badge bg-[#7C4DFF]/15 text-[#B388FF] border border-[#7C4DFF]/30 text-[10px]">
                    <Smartphone className="w-3 h-3 inline mr-1" /> App Activa
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
              Canal Sugerido
            </div>
            <div className="text-xs font-bold text-[#38BDF8] flex items-center justify-end gap-1">
              <ShieldCheck className="w-3 h-3" />
              {perfil.canal_preferente || 'Digital'}
            </div>
          </div>
        </div>

        {/* Inferior: KPIs Inline */}
        <div className="flex flex-wrap gap-6 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#019DF4]" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase">ARPU</div>
              <div className="text-sm font-bold text-white">S/ {perfil.arpu_actual ? perfil.arpu_actual.toFixed(2) : '0.00'}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#00C853]" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Datos</div>
              <div className="text-sm font-bold text-white">{perfil.consumo_datos_gb ? perfil.consumo_datos_gb.toFixed(1) : '0.0'} GB</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FFB300]" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Antigüedad</div>
              <div className="text-sm font-bold text-white">{perfil.antiguedad_meses}m</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Reclamos</div>
              <div className="text-sm font-bold text-white">{perfil.reclamos}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
