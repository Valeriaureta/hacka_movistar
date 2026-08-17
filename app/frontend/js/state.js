// Gestor de estado reactivo simple
class StateStore {
  constructor() {
    this.state = {
      selectedClienteId: 'CLI000001',
      currentClientData: null,
      currentNBO: null,
      catalog: [],
      analytics: null,
      filters: {
        search: '',
        elegible_mt: null,
        departamento: '',
        riesgo: ''
      },
      activeTab: 'advisor' // advisor | simulator | catalog | dashboard
    };
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(l => l(this.state));
  }
}

export const store = new StateStore();

export function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : 'ℹ️'}</span>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
