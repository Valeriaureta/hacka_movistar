'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Search, Sparkles, AlertTriangle, Users, ChevronRight, X, Phone, MessageSquare, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getClientes } from '@/lib/api';

interface ClientSearchProps {
  selectedClientId: string;
  onSelectClient: (clientId: string) => void;
}

// Fetcher adapter para SWR
const fetcher = ([, params]: [string, any]) => getClientes(params);

export default function ClientSearch({ selectedClientId, onSelectClient }: ClientSearchProps) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'mt' | 'risk'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'call' | 'digital' | 'tienda'>('all');

  const { data, error, isLoading } = useSWR(
    ['/api/clientes', {
      limit: 25,
      search,
      elegible_mt: filterType === 'mt' ? true : undefined,
      riesgo: filterType === 'risk' ? 'alto' : undefined,
      canal: channelFilter === 'all' ? undefined : channelFilter,
    }],
    fetcher,
    { keepPreviousData: true }
  );

  const clients = data?.items || [];
  const totalCount = data?.total || 0;

  return (
    <div className="card flex flex-col gap-4 bg-white dark:bg-[#081B2B] border-slate-200 dark:border-white/10 shadow-sm p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 font-title">
          <Users className="w-4 h-4 text-[#0070B8] dark:text-[#019DF4]" />
          Buscar Cliente
        </h3>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">
          {isLoading && !data ? (
            <span className="animate-pulse text-[#0070B8] dark:text-[#00D2FF]">Conectando...</span>
          ) : error ? (
            <span className="text-red-500 dark:text-red-400">Error de red</span>
          ) : (
            `${clients.length} / ${totalCount.toLocaleString()}`
          )}
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por ID (ej. CLI000001)..."
          className="search-input text-sm pl-10 pr-9 py-2.5"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips: Estado */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 dark:bg-[#051424] rounded-2xl border border-slate-200 dark:border-white/5">
        <button
          onClick={() => setFilterType('all')}
          className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all text-center cursor-pointer ${
            filterType === 'all'
              ? 'bg-[#019DF4] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilterType('mt')}
          className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
            filterType === 'mt'
              ? 'bg-[#16A34A] dark:bg-[#5CB615] text-white dark:text-black shadow-sm'
              : 'text-emerald-700 dark:text-[#70D81E] hover:bg-emerald-500/10 dark:hover:bg-[#5CB615]/10'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Elegible Total</span>
        </button>
        <button
          onClick={() => setFilterType('risk')}
          className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
            filterType === 'risk'
              ? 'bg-rose-500 dark:bg-[#FF5252] text-white shadow-sm'
              : 'text-rose-600 dark:text-[#FF8A80] hover:bg-rose-500/10 dark:hover:bg-[#FF5252]/10'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Con Mora</span>
        </button>
      </div>

      {/* Filter Chips: Canal de Contacto */}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 px-1 flex items-center justify-between">
          <span>Canal de Contacto:</span>
          {channelFilter !== 'all' && (
            <button
              onClick={() => setChannelFilter('all')}
              className="text-[10px] text-[#0070B8] dark:text-[#00D2FF] hover:underline cursor-pointer"
            >
              Limpiar canal
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-[#051424] rounded-xl border border-slate-200 dark:border-white/5 text-[11px]">
          <button
            onClick={() => setChannelFilter('all')}
            className={`py-1.5 px-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
              channelFilter === 'all'
                ? 'bg-slate-300 dark:bg-white/20 text-slate-900 dark:text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setChannelFilter('call')}
            className={`py-1.5 px-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
              channelFilter === 'call'
                ? 'bg-[#019DF4] text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Phone className="w-3 h-3" /> Call
          </button>
          <button
            onClick={() => setChannelFilter('digital')}
            className={`py-1.5 px-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
              channelFilter === 'digital'
                ? 'bg-purple-600 dark:bg-[#9D65FF] text-white font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3 h-3" /> Digital
          </button>
          <button
            onClick={() => setChannelFilter('tienda')}
            className={`py-1.5 px-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
              channelFilter === 'tienda'
                ? 'bg-emerald-600 dark:bg-[#5CB615] text-white dark:text-black font-bold shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Store className="w-3 h-3" /> Tienda
          </button>
        </div>
      </div>

      {/* Clients List */}
      <div className="flex flex-col gap-2.5 max-h-[560px] overflow-y-auto pr-1">
        {error ? (
          <div className="text-center py-8 text-xs text-red-600 dark:text-red-400 bg-red-500/10 rounded-2xl border border-red-500/20 p-4">
            <div>Error al conectar con la API de clientes.</div>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-1.5 bg-red-500/20 text-red-700 dark:text-white rounded-xl hover:bg-red-500/30 text-xs font-semibold cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : isLoading && !data ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-4 pl-5 rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#061828] flex justify-between items-center min-h-[70px]"
            >
              <div className="space-y-2 w-2/3">
                <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/2 animate-pulse" />
                <div className="h-3 bg-slate-200 dark:bg-white/5 rounded w-3/4 animate-pulse" />
              </div>
              <div className="w-14 h-6 bg-slate-200 dark:bg-white/5 rounded-full animate-pulse" />
            </div>
          ))
        ) : clients.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
            No se encontraron clientes con el filtro seleccionado.
          </div>
        ) : (
          <AnimatePresence>
            {clients.map((c) => {
              const isSelected = c.cliente_id === selectedClientId;
              const arpu = c.monto_facturado_prom ? `S/ ${c.monto_facturado_prom.toFixed(0)}` : 'S/ --';
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={c.cliente_id}
                  onClick={() => onSelectClient(c.cliente_id)}
                  className={`p-3.5 pl-5 rounded-2xl cursor-pointer transition-all border flex justify-between items-center group relative shrink-0 min-h-[70px] ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-[#0E2C4A] border-[#019DF4] shadow-sm dark:shadow-[0_0_15px_rgba(1,157,244,0.3)]'
                      : 'bg-white dark:bg-[#061828] border-slate-200/80 dark:border-white/5 hover:border-sky-300 dark:hover:border-[#019DF4]/40 hover:bg-slate-50 dark:hover:bg-[#0A2238] shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
                  }`}
                >
                  {isSelected && (
                    <motion.div layoutId="activeIndicator" className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#019DF4] rounded-l-2xl" />
                  )}
                  <div className="pl-1">
                    <div className="font-bold text-sm text-slate-900 dark:text-white font-mono flex items-center gap-2">
                      {c.cliente_id}
                      {isSelected && <span className="w-2 h-2 rounded-full bg-[#0070B8] dark:bg-[#00D2FF] animate-ping" />}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {c.ubicacion_departamento || 'Perú'} • <span className="text-slate-800 dark:text-slate-200 font-semibold">{arpu}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex flex-col items-end gap-1">
                      {c.elegible_mt && <span className="badge badge-mt text-[10px]">Elegible MT</span>}
                      {c.meses_moroso && c.meses_moroso >= 2 ? (
                        <span className="badge badge-alerta text-[10px]">{c.meses_moroso}m mora</span>
                      ) : null}
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isSelected
                          ? 'text-[#0070B8] dark:text-[#019DF4] translate-x-0.5'
                          : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-400'
                      }`}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
