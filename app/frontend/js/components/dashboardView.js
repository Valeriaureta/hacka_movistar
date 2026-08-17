import { api } from '../api.js';

export async function initDashboardView(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div>
      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.35rem; font-weight: 700;">📊 Dashboard Directivo & Funnel E2E</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
          Métricas de impacto comercial, penetración de Movistar Total y contactabilidad omnicanal (100,000 Clientes).
        </p>
      </div>

      <div id="dash-kpi-grid" class="kpi-grid">
        <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 1rem;">Cargando métricas...</div>
      </div>

      <div class="chart-panel">
        <div class="card">
          <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 1rem; color: var(--text-highlight);">
            📡 Distribución por Canal de Contacto
          </h4>
          <div id="dash-canales-container">
            <!-- Canales -->
          </div>
        </div>

        <div class="card">
          <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 1rem; color: var(--text-highlight);">
            📍 Top Departamentos y Oportunidad MT
          </h4>
          <div id="dash-dept-container">
            <!-- Departamentos -->
          </div>
        </div>

        <div class="card" style="grid-column: 1/-1;">
          <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 1rem; color: var(--color-success);">
            🏆 Ofertas con Mayor Volumen de Recomendación Top 1
          </h4>
          <div id="dash-top-offers-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <!-- Top Offers -->
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const data = await api.getAnalytics();
    const { kpis, distribucion_canales, departamentos_top, top_ofertas_ranking } = data;

    // Render KPIs
    const elegiblesPct = ((kpis.elegibles_mt / kpis.total_clientes) * 100).toFixed(1);
    const appPct = ((kpis.usuarios_app / kpis.total_clientes) * 100).toFixed(1);
    const moraPct = ((kpis.clientes_riesgo_mora / kpis.total_clientes) * 100).toFixed(1);

    const kpiContainer = container.querySelector('#dash-kpi-grid');
    kpiContainer.innerHTML = `
      <div class="kpi-card">
        <div class="stat-label">Universo Total Clientes</div>
        <div class="kpi-number" style="color: #FFFFFF;">${kpis.total_clientes.toLocaleString()}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Base procesada B2C</div>
      </div>

      <div class="kpi-card" style="border-color: rgba(0, 200, 83, 0.3);">
        <div class="stat-label">Target Elegibles MT</div>
        <div class="kpi-number" style="color: var(--color-success);">${kpis.elegibles_mt.toLocaleString()}</div>
        <div style="font-size: 0.75rem; color: var(--color-success); margin-top: 0.25rem;">${elegiblesPct}% del total de la planta</div>
      </div>

      <div class="kpi-card">
        <div class="stat-label">ARPU Promedio</div>
        <div class="kpi-number" style="color: var(--movistar-blue);">S/ ${Number(kpis.arpu_promedio).toFixed(2)}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Ingreso mensual medio</div>
      </div>

      <div class="kpi-card">
        <div class="stat-label">Adopción App Digital</div>
        <div class="kpi-number" style="color: #B388FF;">${appPct}%</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">${kpis.usuarios_app.toLocaleString()} clientes activos</div>
      </div>
    `;

    // Render Canales
    const canalContainer = container.querySelector('#dash-canales-container');
    canalContainer.innerHTML = distribucion_canales.map(c => `
      <div class="dist-item">
        <div class="dist-header">
          <span style="font-weight: 600; color: #FFFFFF;">${c.canal}</span>
          <span style="color: var(--text-secondary);">${c.cantidad.toLocaleString()} (${c.porcentaje}%)</span>
        </div>
        <div class="dist-bar-bg">
          <div class="dist-bar-fill" style="width: ${c.porcentaje}%;"></div>
        </div>
      </div>
    `).join('');

    // Render Departamentos
    const maxDeptCount = departamentos_top[0]?.cantidad || 1;
    const deptContainer = container.querySelector('#dash-dept-container');
    deptContainer.innerHTML = departamentos_top.map(d => {
      const pct = ((d.cantidad / maxDeptCount) * 100).toFixed(0);
      return `
        <div class="dist-item">
          <div class="dist-header">
            <span style="font-weight: 600; color: #FFFFFF;">${d.departamento}</span>
            <span style="color: var(--text-secondary);">${d.cantidad.toLocaleString()} clientes • ${d.elegibles_mt.toLocaleString()} elegibles MT</span>
          </div>
          <div class="dist-bar-bg">
            <div class="dist-bar-fill" style="width: ${pct}%; background: linear-gradient(90deg, var(--movistar-blue), var(--color-success));"></div>
          </div>
        </div>
      `;
    }).join('');

    // Render Top Offers
    const topOffersContainer = container.querySelector('#dash-top-offers-container');
    topOffersContainer.innerHTML = top_ofertas_ranking.map(o => `
      <div style="background: rgba(0,0,0,0.25); border: 1px solid var(--border-subtle); padding: 1rem; border-radius: var(--radius-md);">
        <div style="font-size: 0.75rem; color: var(--color-success); font-weight: 700;">${o.oferta_es_mt ? '✨ MOVISTAR TOTAL' : '📱 MÓVIL/HOGAR'}</div>
        <div style="font-weight: 700; color: #FFFFFF; font-size: 1rem; margin: 0.25rem 0;">${o.nombre_oferta}</div>
        <div style="font-size: 0.8rem; color: var(--text-secondary);">Score Medio: ${(o.score_promedio * 100).toFixed(1)}%</div>
        <div style="font-size: 0.85rem; font-weight: 700; color: var(--movistar-blue); margin-top: 0.5rem;">${o.veces_top1.toLocaleString()} veces Top 1</div>
      </div>
    `).join('');

  } catch (err) {
    container.innerHTML = `<div style="color: var(--color-danger); padding: 1rem;">Error al cargar dashboard: ${err.message}</div>`;
  }
}
