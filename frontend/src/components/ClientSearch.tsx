'use client';

import { useState, useEffect } from 'react';
import { Search, Sparkles, AlertTriangle } from 'lucide-react';
import { getClientes } from '@/lib/api';
import { ClienteListItem } from '@/lib/types';

interface ClientSearchProps {
  selectedClientId: string;
  onSelectClient: (clientId: string) => void;
}

export default function ClientSearch({ selectedClientId, onSelectClient }: ClientSearchProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mt' | 'risk'>('all');
  const [clients, setClients] = useState<ClienteListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await getClientes({
          limit: 25,
          search,
          elegible_mt: filterType === 'mt' ? true : undefined,
          riesgo: filterType === 'risk' ? 'alto' : undefined,
        });
        setClients(data.items);
        setTotalCount(data.total);
      } catch (err) {
        setClients([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [search, filterType]);

  return (
    <div className="card flex flex-col gap-3.5 bg-[#0C2136]/80 border-white/10">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por ID (ej. CLI000001)..."
          className="search-input text-sm pl-10"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            filterType === 'all'
              ? 'bg-[#019DF4] text-white'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilterType('mt')}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
            filterType === 'mt'
              ? 'bg-[#00C853] text-black font-semibold'
              : 'bg-[#00C853]/10 text-[#00C853] hover:bg-[#00C853]/20'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          Elegibles MT
        </button>
        <button
          onClick={() => setFilterType('risk')}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${
            filterType === 'risk'
              ? 'bg-[#FF5252] text-white font-semibold'
              : 'bg-[#FF5252]/10 text-[#FF5252] hover:bg-[#FF5252]/20'
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          Mora Alta
        </button>
      </div>

      <div className="text-xs text-slate-400">
        {loading ? 'Buscando clientes...' : `Mostrando ${clients.length} de ${totalCount.toLocaleString()} clientes`}
      </div>

      <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
        {clients.map((c) => {
          const isSelected = c.cliente_id === selectedClientId;
          const arpu = c.monto_facturado_prom ? `S/ ${c.monto_facturado_prom.toFixed(0)}` : 'S/ --';
          return (
            <div
              key={c.cliente_id}
              onClick={() => onSelectClient(c.cliente_id)}
              className={`p-3 rounded-xl cursor-pointer transition-all border flex justify-between items-center ${
                isSelected
                  ? 'bg-[#019DF4]/20 border-[#019DF4] shadow-[0_0_12px_rgba(1,157,244,0.2)]'
                  : 'bg-[#081B2B]/60 border-white/5 hover:border-[#019DF4]/40 hover:bg-[#019DF4]/5'
              }`}
            >
              <div>
                <div className="font-bold text-sm text-white">{c.cliente_id}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {c.ubicacion_departamento || 'Perú'} • {c.tipo_cliente || 'Cliente'} • {arpu}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {c.elegible_mt && <span className="badge badge-mt text-[10px]">Elegible MT</span>}
                {c.meses_moroso && c.meses_moroso >= 2 ? (
                  <span className="badge badge-alerta text-[10px]">{c.meses_moroso}m mora</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
