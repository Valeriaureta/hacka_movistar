'use client';

import { useState } from 'react';
import useSWR from 'swr';
import ClientSearch from '@/components/ClientSearch';
import ClientProfile from '@/components/ClientProfile';
import NBOHeroCard from '@/components/NBOHeroCard';
import RebateDrawer from '@/components/RebateDrawer';
import { getClienteNBO } from '@/lib/api';
import { ClienteNBOResponse } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';

const fetcher = (clientId: string) => getClienteNBO(clientId);

export default function AdvisorPage() {
  const [selectedClientId, setSelectedClientId] = useState('CLI000001');

  const { data: nboData, error, isLoading, mutate } = useSWR<ClienteNBOResponse>(
    selectedClientId ? selectedClientId : null,
    fetcher,
    { 
      keepPreviousData: true,
      revalidateOnFocus: false
    }
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 items-start pt-2">
      {/* Sidebar de Búsqueda de Clientes */}
      <aside className="w-full">
        <ClientSearch
          selectedClientId={selectedClientId}
          onSelectClient={(id) => setSelectedClientId(id)}
        />
      </aside>

      {/* Área Central: Ficha 360 + Hero NBO + Rebates */}
      <section className="w-full">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card p-10 text-center bg-white dark:bg-[#081B2B]/95 border border-slate-200 dark:border-white/10 shadow-sm"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-500 dark:text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div className="font-bold text-slate-900 dark:text-white text-lg mb-1.5 font-title">El motor NBO está desconectado</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto leading-relaxed">
                No pudimos conectar con el servidor de análisis. MoviNEXO sigue intentando reconectar en segundo plano.
              </div>
              <button 
                onClick={() => mutate()}
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-md cursor-pointer font-semibold"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar Conexión
              </button>
            </motion.div>
          ) : isLoading && !nboData ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Skeleton Ficha 360 */}
              <div className="card bg-white dark:bg-[#081B2B]/95 border border-slate-200 dark:border-white/10 shadow-sm p-7 h-36 flex flex-col gap-4">
                 <div className="flex justify-between items-start">
                    <div className="space-y-3 w-1/3">
                      <div className="h-6 bg-slate-200 dark:bg-white/10 rounded-md w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-slate-200 dark:bg-white/5 rounded-md w-1/2 animate-pulse"></div>
                    </div>
                    <div className="h-8 w-24 bg-slate-200 dark:bg-white/5 rounded-full animate-pulse"></div>
                 </div>
              </div>
              {/* Skeleton Hero Card */}
              <div className="card bg-white dark:bg-[#081B2B]/95 border border-slate-200 dark:border-white/10 shadow-sm p-8 h-72 flex flex-col gap-6">
                 <div className="h-8 bg-slate-200 dark:bg-white/10 rounded-md w-1/3 animate-pulse"></div>
                 <div className="h-24 bg-slate-200 dark:bg-white/5 rounded-md w-full animate-pulse"></div>
                 <div className="h-12 bg-[#019DF4]/20 rounded-xl w-52 animate-pulse"></div>
              </div>
            </motion.div>
          ) : nboData ? (
            <motion.div
              key={nboData.cliente_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <ClientProfile clienteId={nboData.cliente_id} perfil={nboData.perfil} />
              {nboData.top_ofertas.length > 0 && (
                <>
                  <NBOHeroCard topOffer={nboData.top_ofertas[0]} />
                  {nboData.top_ofertas.length > 1 && (
                    <RebateDrawer rebates={nboData.top_ofertas.slice(1)} />
                  )}
                </>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>
    </div>
  );
}
