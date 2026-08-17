import { api } from '../api.js';
import { showToast } from '../state.js';

export function initSimulatorView(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="card" style="max-width: 900px; margin: 0 auto;">
      <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
        <span>⚡</span>
        <span>Simulador de Propensión y Scoring en Tiempo Real</span>
      </h3>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
        Permite simular el impacto y score de aceptación de cualquier combinación ad-hoc entre un cliente y una oferta específica.
      </p>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
        <div>
          <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.35rem;">Cliente ID</label>
          <input type="text" id="sim-client-id" class="search-input" value="CLI000001" style="padding-left: 1rem;" />
        </div>

        <div>
          <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.35rem;">Oferta a Probar</label>
          <select id="sim-oferta-id" class="search-input" style="padding-left: 1rem;">
            <option value="OF020">OF020 - Movistar Total Básico (S/ 119.90)</option>
            <option value="OF021">OF021 - Movistar Total Plus (S/ 149.90)</option>
            <option value="OF022">OF022 - Movistar Total Max (S/ 189.90)</option>
            <option value="OF002">OF002 - Plan Móvil Plus 25GB (S/ 59.90)</option>
            <option value="OF004">OF004 - Plan Móvil Ilimitado (S/ 99.90)</option>
            <option value="OF010">OF010 - Internet Fibra 200Mbps (S/ 79.90)</option>
          </select>
        </div>

        <div>
          <label style="display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.35rem;">Canal de Contacto</label>
          <select id="sim-canal" class="search-input" style="padding-left: 1rem;">
            <option value="Digital">Canal Digital / App</option>
            <option value="Call In">Call In (Entrante)</option>
            <option value="Call Out">Call Out (Saliente)</option>
            <option value="Tienda">Tienda Presencial</option>
          </select>
        </div>
      </div>

      <div style="text-align: center; margin-bottom: 1.5rem;">
        <button id="sim-submit-btn" class="copy-btn" style="padding: 0.65rem 1.75rem; font-size: 0.95rem; border-radius: var(--radius-md);">
          ⚡ Simular Score y Speech
        </button>
      </div>

      <div id="sim-result-container" style="display: none;">
        <!-- Resultado del simulador -->
      </div>
    </div>
  `;

  const btn = container.querySelector('#sim-submit-btn');
  const clientIdInput = container.querySelector('#sim-client-id');
  const ofertaSelect = container.querySelector('#sim-oferta-id');
  const canalSelect = container.querySelector('#sim-canal');
  const resultContainer = container.querySelector('#sim-result-container');

  btn.addEventListener('click', async () => {
    const clienteId = clientIdInput.value.trim().toUpperCase();
    const ofertaId = ofertaSelect.value;
    const canal = canalSelect.value;

    if (!clienteId) {
      showToast('Ingresa un Cliente ID válido', 'info');
      return;
    }

    resultContainer.style.display = 'block';
    resultContainer.innerHTML = `<div style="text-align: center; padding: 1.5rem; color: var(--text-muted);">Calculando predicción...</div>`;

    try {
      const res = await api.simularScoring(clienteId, ofertaId, canal);
      const scorePct = res.score_porcentaje;
      const color = scorePct >= 70 ? '#00C853' : scorePct >= 50 ? '#FFB300' : '#019DF4';

      resultContainer.innerHTML = `
        <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-active); border-radius: var(--radius-md); padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div>
              <div style="font-size: 1.1rem; font-weight: 700; color: #FFFFFF;">${res.oferta.nombre_oferta}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${res.oferta.descripcion_corta || ''}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 1.4rem; font-weight: 800; color: ${color};">${scorePct}%</div>
              <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Score Aceptación</div>
            </div>
          </div>

          <div class="xai-reason" style="margin-bottom: 1rem;">
            <strong>💡 Diagnóstico:</strong> ${res.explicabilidad.por_que_este_cliente}
          </div>

          <div class="speech-box">
            <div class="speech-label">
              <span>📢 Speech Comercial Adaptado</span>
            </div>
            <div class="speech-content">
              "${res.explicabilidad.speech_comercial}"
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      resultContainer.innerHTML = `<div style="color: var(--color-danger); padding: 1rem; text-align: center;">Error: ${err.message}</div>`;
    }
  });
}
