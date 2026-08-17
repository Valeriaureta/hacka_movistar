import { api } from '../api.js';

export async function initCatalogView(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="font-size: 1.35rem; font-weight: 700;">📦 Catálogo Comercial de Ofertas (22 Planes)</h3>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Portafolio estructurado para convergencia Movistar Total, líneas móviles y servicios hogar.
          </p>
        </div>

        <div class="filters-row" id="catalog-category-filters">
          <button class="filter-chip active" data-cat="all">Todas (22)</button>
          <button class="filter-chip" data-cat="movistar_total">✨ Movistar Total</button>
          <button class="filter-chip" data-cat="plan_movil">📱 Móvil Postpago</button>
          <button class="filter-chip" data-cat="plan_hogar">🏠 Internet Hogar</button>
        </div>
      </div>

      <div id="catalog-cards-container" class="catalog-grid">
        <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">Cargando catálogo...</div>
      </div>
    </div>
  `;

  const cardsContainer = container.querySelector('#catalog-cards-container');
  const filterChips = container.querySelectorAll('#catalog-category-filters .filter-chip');

  try {
    const ofertas = await api.getOfertas();

    function renderCards(category = 'all') {
      const filtered = category === 'all' 
        ? ofertas 
        : ofertas.filter(o => (o.tipo_oferta && o.tipo_oferta.toLowerCase() === category) || (category === 'movistar_total' && o.es_movistar_total));

      cardsContainer.innerHTML = filtered.map(of => {
        const isMT = of.es_movistar_total;
        const mtTag = isMT ? `<span class="badge badge-mt">✨ Movistar Total</span>` : `<span class="badge" style="background: rgba(255,255,255,0.06); color: var(--text-secondary);">${of.tipo_oferta || 'General'}</span>`;
        const ahorroTag = of.ahorro_pct > 0 ? `<span class="badge badge-optimo">${of.ahorro_pct}% Ahorro</span>` : '';
        const gbTag = of.gb_incluidos > 0 ? `<span class="badge badge-channel">${of.gb_incluidos >= 9000 ? 'GB Ilimitados' : `${of.gb_incluidos} GB`}</span>` : '';

        return `
          <div class="card catalog-card">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <span style="font-family: var(--font-family-mono); font-size: 0.75rem; color: var(--text-muted);">${of.oferta_id}</span>
                <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; justify-content: flex-end;">
                  ${mtTag}
                  ${ahorroTag}
                </div>
              </div>
              <h4 style="font-size: 1.05rem; font-weight: 700; color: #FFFFFF; margin-bottom: 0.5rem;">${of.nombre_oferta}</h4>
              <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">${of.descripcion_corta || of.descripcion_bundle || 'Oferta optimizada para el segmento correspondiente.'}</p>
            </div>

            <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
              <div>
                ${gbTag}
              </div>
              <div class="catalog-price">
                S/ ${Number(of.precio_mensual || 0).toFixed(2)}<span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">/mes</span>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderCards(chip.getAttribute('data-cat'));
      });
    });

    renderCards('all');

  } catch (err) {
    cardsContainer.innerHTML = `<div style="grid-column: 1/-1; color: var(--color-danger); text-align: center;">Error al cargar catálogo.</div>`;
  }
}
