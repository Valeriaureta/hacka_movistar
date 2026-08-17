import { api } from './api.js';
import { store, showToast } from './state.js';
import { initSearchComponent } from './components/search.js';
import { renderClientProfile } from './components/clientProfile.js';
import { renderNBOCards } from './components/nboCard.js';
import { initSimulatorView } from './components/simulatorView.js';
import { initCatalogView } from './components/catalogView.js';
import { initDashboardView } from './components/dashboardView.js';

// Cargar ficha y recomendación de un cliente
async function loadClientData(clienteId) {
  const profileContainer = document.getElementById('client-profile-container');
  const nboContainer = document.getElementById('nbo-cards-container');

  if (profileContainer) profileContainer.innerHTML = `<div class="card" style="text-align: center; color: var(--text-muted);">Cargando perfil de ${clienteId}...</div>`;
  if (nboContainer) nboContainer.innerHTML = `<div class="card" style="text-align: center; color: var(--text-muted);">Calculando recomendación NBO con XAI...</div>`;

  try {
    const nboData = await api.getClienteNBO(clienteId);
    store.setState({ selectedClienteId: clienteId, currentNBO: nboData });
    renderClientProfile('client-profile-container', nboData);
    renderNBOCards('nbo-cards-container', nboData);
  } catch (err) {
    if (profileContainer) profileContainer.innerHTML = `<div class="card" style="color: var(--color-danger);">Error al cargar perfil de ${clienteId}</div>`;
    if (nboContainer) nboContainer.innerHTML = `<div class="card" style="color: var(--color-danger);">Error al cargar recomendación.</div>`;
  }
}

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs Switching
  const navButtons = document.querySelectorAll('.nav-item');
  const views = {
    advisor: document.getElementById('view-advisor'),
    simulator: document.getElementById('view-simulator'),
    catalog: document.getElementById('view-catalog'),
    dashboard: document.getElementById('view-dashboard')
  };

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      Object.keys(views).forEach(v => {
        if (views[v]) views[v].classList.remove('active');
      });

      if (views[tab]) {
        views[tab].classList.add('active');
        if (tab === 'simulator') initSimulatorView('view-simulator');
        if (tab === 'catalog') initCatalogView('view-catalog');
        if (tab === 'dashboard') initDashboardView('view-dashboard');
      }
    });
  });

  // Inicializar componentes de la vista principal Asesor
  initSearchComponent('sidebar-search-container', (selectedId) => {
    loadClientData(selectedId);
  });

  // Carga inicial del primer cliente
  loadClientData('CLI000001');
});
