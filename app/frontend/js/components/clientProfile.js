export function renderClientProfile(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container || !data) return;

  const { cliente_id, perfil } = data;

  const mtBadge = perfil.elegible_mt
    ? `<span class="badge badge-mt">✨ Elegible Movistar Total</span>`
    : perfil.es_movistar_total
    ? `<span class="badge badge-channel">🛡️ Ya tiene Movistar Total</span>`
    : `<span class="badge" style="background: rgba(255,255,255,0.06); color: var(--text-muted);">No Convergente</span>`;

  const riesgoClass = perfil.riesgo_badge === 'alerta' ? 'badge-alerta' : perfil.riesgo_badge === 'advertencia' ? 'badge-advertencia' : 'badge-optimo';
  const appBadge = perfil.es_usuario_app 
    ? `<span class="badge" style="background: rgba(124, 77, 255, 0.15); color: #B388FF;">📱 App Mi Movistar Activa</span>` 
    : '';

  container.innerHTML = `
    <div class="card client-profile-card">
      <div class="profile-top-bar">
        <div class="profile-id-section">
          <h2>
            <span>👤</span>
            <span>${cliente_id}</span>
            <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-secondary);">(${perfil.departamento}, ${perfil.edad_rango})</span>
          </h2>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
            ${mtBadge}
            <span class="badge ${riesgoClass}">Riesgo Mora: ${perfil.nivel_riesgo} (${perfil.dias_mora ? perfil.dias_mora.toFixed(0) : 0} días mora)</span>
            ${appBadge}
          </div>
        </div>

        <div style="text-align: right;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Canal Más Efectivo</div>
          <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-highlight); margin-top: 0.15rem;">
            📡 ${perfil.canal_preferente || 'Digital'}
          </div>
        </div>
      </div>

      <div class="profile-stats-grid">
        <div class="stat-box">
          <div class="stat-label">ARPU Mensual</div>
          <div class="stat-value" style="color: var(--movistar-blue);">S/ ${Number(perfil.arpu_actual).toFixed(2)}</div>
        </div>

        <div class="stat-box">
          <div class="stat-label">Consumo Datos</div>
          <div class="stat-value">${Number(perfil.consumo_datos_gb).toFixed(1)} GB</div>
        </div>

        <div class="stat-box">
          <div class="stat-label">Antigüedad</div>
          <div class="stat-value">${perfil.antiguedad_meses} meses</div>
        </div>

        <div class="stat-box">
          <div class="stat-label">Reclamos Históricos</div>
          <div class="stat-value">${perfil.reclamos}</div>
        </div>
      </div>
    </div>
  `;
}
