import { api } from '../api.js';
import { store } from '../state.js';

export function initSearchComponent(containerId, onSelectClient) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="sidebar-panel card">
      <div class="search-box-wrapper">
        <span class="search-icon">🔍</span>
        <input type="text" id="client-search-input" class="search-input" placeholder="Buscar por ID (ej. CLI000001)..." />
      </div>

      <div class="filters-row">
        <button class="filter-chip" data-filter="all">Todos</button>
        <button class="filter-chip" data-filter="mt">✨ Elegibles MT</button>
        <button class="filter-chip" data-filter="risk">⚠️ Riesgo Mora</button>
      </div>

      <div id="clients-count-label" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
        Cargando cartera de clientes...
      </div>

      <div id="clients-list-container" class="client-list">
        <!-- Lista de clientes inyectada dinámicamente -->
      </div>
    </div>
  `;

  const input = container.querySelector('#client-search-input');
  const countLabel = container.querySelector('#clients-count-label');
  const listContainer = container.querySelector('#clients-list-container');
  const filterChips = container.querySelectorAll('.filter-chip');

  let currentFilter = 'all';
  let searchTimeout = null;

  async function loadClients(searchQuery = '') {
    listContainer.innerHTML = `<div style="padding: 1rem; color: var(--text-muted); font-size: 0.85rem; text-align: center;">Buscando clientes...</div>`;
    try {
      const params = { limit: 25, search: searchQuery };
      if (currentFilter === 'mt') params.elegible_mt = true;
      if (currentFilter === 'risk') params.riesgo = 'alto';

      const data = await api.getClientes(params);
      countLabel.textContent = `Mostrando ${data.items.length} de ${data.total.toLocaleString()} clientes`;

      if (data.items.length === 0) {
        listContainer.innerHTML = `<div style="padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem; text-align: center;">No se encontraron clientes con esos filtros.</div>`;
        return;
      }

      const selectedId = store.getState().selectedClienteId;

      listContainer.innerHTML = data.items.map(client => {
        const isSelected = client.cliente_id === selectedId;
        const mtBadge = client.elegible_mt ? `<span class="badge badge-mt">Elegible MT</span>` : '';
        const moraBadge = client.meses_moroso >= 2 ? `<span class="badge badge-alerta">${client.meses_moroso}m mora</span>` : '';
        const dept = client.ubicacion_departamento || 'Perú';
        const arpu = client.monto_facturado_prom ? `S/ ${Number(client.monto_facturado_prom).toFixed(0)}` : 'S/ --';

        return `
          <div class="client-item ${isSelected ? 'selected' : ''}" data-id="${client.cliente_id}">
            <div>
              <div class="client-item-id">${client.cliente_id}</div>
              <div class="client-item-sub">${dept} • ${client.tipo_cliente || 'Cliente'} • ${arpu}</div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem;">
              ${mtBadge}
              ${moraBadge}
            </div>
          </div>
        `;
      }).join('');

      // Click event
      listContainer.querySelectorAll('.client-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-id');
          listContainer.querySelectorAll('.client-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
          onSelectClient(id);
        });
      });

    } catch (err) {
      listContainer.innerHTML = `<div style="padding: 1rem; color: var(--color-danger); font-size: 0.85rem;">Error al cargar lista.</div>`;
    }
  }

  // Event Listeners
  input.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadClients(e.target.value);
    }, 250);
  });

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilter = chip.getAttribute('data-filter');
      loadClients(input.value);
    });
  });

  // Carga inicial
  loadClients();
}
