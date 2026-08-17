'use client';

import { useState, useEffect } from 'react';
import ClientSearch from '@/components/ClientSearch';
import ClientProfile from '@/components/ClientProfile';
import NBOHeroCard from '@/components/NBOHeroCard';
import RebateDrawer from '@/components/RebateDrawer';
import { getClienteNBO } from '@/lib/api';
import { ClienteNBOResponse } from '@/lib/types';

export default function AdvisorPage() {
  const [selectedClientId, setSelectedClientId] = useState('CLI000001');
  const [nboData, setNboData] = useState<ClienteNBOResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getClienteNBO(selectedClientId);
        setNboData(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Error al cargar recomendación');
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedClientId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
      {/* Sidebar de Búsqueda de Clientes */}
      <aside>
        <ClientSearch
          selectedClientId={selectedClientId}
          onSelectClient={(id) => setSelectedClientId(id)}
        />
      </aside>

      {/* Área Central: Ficha 360 + Hero NBO + Rebates */}
      <section>
        {loading ? (
          <div className="card text-center p-12 text-slate-400 animate-pulse bg-[#0C2136]/50">
            <div className="text-lg font-bold text-white mb-2">Calculando recomendación NBO con XAI...</div>
            <div className="text-xs">Cargando perfil 360 y aplicando reglas de negocio de convergencia...</div>
          </div>
        ) : error ? (
          <div className="card p-8 text-center text-[#FF5252] bg-[#FF5252]/10 border-[#FF5252]/30">
            {error}
          </div>
        ) : nboData ? (
          <>
            <ClientProfile clienteId={nboData.cliente_id} perfil={nboData.perfil} />
            {nboData.top_ofertas.length > 0 && (
              <>
                <NBOHeroCard topOffer={nboData.top_ofertas[0]} />
                {nboData.top_ofertas.length > 1 && (
                  <RebateDrawer rebates={nboData.top_ofertas.slice(1)} />
                )}
              </>
            )}
          </>
        ) : null}
      </section>
    </div>
  );
}
