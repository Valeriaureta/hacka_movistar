import { showToast } from '../state.js';

export function renderNBOCards(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container || !data || !data.top_ofertas) return;

  const { top_ofertas } = data;
  const top1 = top_ofertas[0];
  const rebates = top_ofertas.slice(1);

  if (!top1) {
    container.innerHTML = `<div class="card" style="text-align: center; color: var(--text-muted);">Sin ofertas recomendadas.</div>`;
    return;
  }

  // Top 1 HTML
  const top1Html = `
    <div class="card nbo-hero-card">
      <div class="nbo-header">
        <div>
          <span class="nbo-rank-badge">🏆 TOP 1 RECOMENDACIÓN NBO</span>
          <h3 class="nbo-title">${top1.nombre_oferta}</h3>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">
            ${top1.oferta_es_mt ? '🌟 Producto Estratégico Movistar Total (Fijo + Móvil)' : '📱 Oferta Móvil / Hogar Optimizada'}
          </div>
        </div>

        <div class="nbo-price-tag">
          <div class="nbo-price">S/ ${Number(top1.precio_mensual || 0).toFixed(2)}<span style="font-size: 0.8rem; font-weight: 500; color: var(--text-muted);">/mes</span></div>
          ${top1.ahorro_pct > 0 ? `<div style="font-size: 0.75rem; color: var(--color-success); font-weight: 700;">Ahorro ${top1.ahorro_pct}%</div>` : ''}
        </div>
      </div>

      <div class="score-container">
        <div class="score-bar-wrapper">
          <span style="font-size: 0.8rem; color: var(--text-muted);">Probabilidad de Aceptación:</span>
          <div class="score-bar">
            <div class="score-fill" style="width: ${top1.score_porcentaje}%; background: ${top1.color};"></div>
          </div>
          <span class="score-text" style="color: ${top1.color};">${top1.score_porcentaje}%</span>
        </div>
      </div>

      <div class="xai-section">
        <div class="xai-reason">
          <strong>💡 ¿Por qué a este cliente?</strong><br/>
          ${top1.explicabilidad.por_que_este_cliente}
        </div>

        <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.4rem;">
          <span>🎯</span>
          <span><strong>Canal y Momento Sugerido:</strong> ${top1.explicabilidad.canal_sugerido}</span>
        </div>

        <div class="speech-box">
          <div class="speech-label">
            <span>📢 Speech Comercial Sugerido para el Asesor</span>
            <button class="copy-btn" data-speech="${encodeURIComponent(top1.explicabilidad.speech_comercial)}">
              📋 Copiar Speech
            </button>
          </div>
          <div class="speech-content">
            "${top1.explicabilidad.speech_comercial}"
          </div>
        </div>
      </div>
    </div>
  `;

  // Rebates HTML (Top 2 y Top 3)
  const rebatesHtml = `
    <div style="margin-top: 1.5rem;">
      <h4 style="font-size: 1rem; color: var(--text-secondary); margin-bottom: 0.85rem; display: flex; align-items: center; gap: 0.5rem;">
        <span>🔄</span>
        <span>Planes de Contingencia Inmediata (Rebates Top-2 y Top-3)</span>
      </h4>

      <div class="rebates-container">
        ${rebates.map((reb, idx) => `
          <div class="rebate-card">
            <div class="rebate-header" onclick="this.parentElement.querySelector('.rebate-details').classList.toggle('hidden')">
              <div class="rebate-title-group">
                <span class="badge" style="background: rgba(255,255,255,0.08); font-weight: 700;">#${idx + 2}</span>
                <div>
                  <div style="font-weight: 700; color: #FFFFFF; font-size: 0.95rem;">${reb.nombre_oferta}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Score: ${reb.score_porcentaje}% • S/ ${Number(reb.precio_mensual || 0).toFixed(2)}/mes</div>
                </div>
              </div>
              <span style="font-size: 0.8rem; color: var(--movistar-blue); cursor: pointer;">Ver Speech Rebate ▾</span>
            </div>

            <div class="rebate-details">
              <div style="margin-bottom: 0.5rem; font-size: 0.8rem; color: #CBD5E1;">
                <strong>Argumento de contingencia si rechaza la oferta principal:</strong>
              </div>
              <div style="background: rgba(0,0,0,0.3); padding: 0.75rem; border-radius: var(--radius-sm); font-style: italic; line-height: 1.45; color: #F1F5F9;">
                "${reb.explicabilidad.rebate_si_rechaza}"
              </div>
              <div style="text-align: right; margin-top: 0.5rem;">
                <button class="copy-btn" style="background: rgba(1, 157, 244, 0.2); color: var(--text-highlight); border: 1px solid var(--border-active);" data-speech="${encodeURIComponent(reb.explicabilidad.rebate_si_rechaza)}">
                  📋 Copiar Rebate
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.innerHTML = top1Html + rebatesHtml;

  // Listeners de copia
  container.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = decodeURIComponent(btn.getAttribute('data-speech'));
      navigator.clipboard.writeText(text).then(() => {
        showToast('¡Speech copiado al portapapeles con éxito!');
      }).catch(() => {
        showToast('Speech seleccionado para copiar', 'info');
      });
    });
  });
}
