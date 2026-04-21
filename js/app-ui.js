(function () {
  let toastContainer;
  let modalHost;
  let loaderHost;
  let activeLoaders = 0;

  function ensureToastContainer() {
    if (toastContainer) return toastContainer;
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-stack';
    toastContainer.setAttribute('aria-live', 'polite');
    toastContainer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toastContainer);
    return toastContainer;
  }

  function ensureModalHost() {
    if (modalHost) return modalHost;
    modalHost = document.createElement('div');
    modalHost.className = 'modal-host';
    document.body.appendChild(modalHost);
    return modalHost;
  }

  function ensureLoaderHost() {
    if (loaderHost) return loaderHost;
    loaderHost = document.createElement('div');
    loaderHost.className = 'global-loader';
    loaderHost.setAttribute('aria-hidden', 'true');
    loaderHost.innerHTML = `
      <div class="global-loader-card" role="status" aria-live="polite">
        <div class="global-loader-spinner"></div>
        <div class="global-loader-copy">
          <strong id="globalLoaderTitle">Cargando información</strong>
          <span id="globalLoaderText">Estamos preparando la vista.</span>
        </div>
      </div>
    `;
    document.body.appendChild(loaderHost);
    return loaderHost;
  }

  window.showGlobalLoader = function showGlobalLoader(message = 'Estamos preparando la vista.', title = 'Cargando información') {
    const host = ensureLoaderHost();
    activeLoaders += 1;
    const titleEl = host.querySelector('#globalLoaderTitle');
    const textEl = host.querySelector('#globalLoaderText');
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = message;
    host.classList.add('is-visible');
  };

  window.hideGlobalLoader = function hideGlobalLoader() {
    const host = ensureLoaderHost();
    activeLoaders = Math.max(0, activeLoaders - 1);
    if (activeLoaders === 0) host.classList.remove('is-visible');
  };

  window.withGlobalLoader = async function withGlobalLoader(task, message, title) {
    window.showGlobalLoader(message, title);
    try {
      return await task();
    } finally {
      window.hideGlobalLoader();
    }
  };

  window.showToast = function showToast(message, type = 'info', duration = 3200) {
    if (!message) return;
    const host = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-copy">
        <strong>${type === 'success' ? 'Listo' : type === 'error' ? 'Atención' : 'Información'}</strong>
        <span>${String(message)}</span>
      </div>
      <button type="button" class="toast-close" aria-label="Cerrar notificación">×</button>
    `;

    let removed = false;
    const remove = () => {
      if (removed) return;
      removed = true;
      toast.classList.add('is-leaving');
      setTimeout(() => toast.remove(), 180);
    };

    toast.querySelector('.toast-close').addEventListener('click', remove);
    host.appendChild(toast);
    setTimeout(() => toast.classList.add('is-visible'), 10);
    setTimeout(remove, duration);
  };

  window.confirmAction = function confirmAction({
    title = 'Confirmar acción',
    message = '¿Deseas continuar?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    danger = false
  } = {}) {
    const host = ensureModalHost();
    host.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
        <div class="modal-icon ${danger ? 'is-danger' : ''}">${danger ? '!' : '?'}</div>
        <h3 id="confirmTitle">${title}</h3>
        <p>${message}</p>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" data-modal-action="cancel">${cancelText}</button>
          <button type="button" class="${danger ? 'btn-danger' : 'btn-primary'}" data-modal-action="confirm">${confirmText}</button>
        </div>
      </div>
    `;
    host.classList.add('is-open');

    return new Promise((resolve) => {
      function close(result) {
        host.classList.remove('is-open');
        host.innerHTML = '';
        resolve(result);
      }

      host.querySelector('[data-modal-action="cancel"]').addEventListener('click', () => close(false), { once: true });
      host.querySelector('[data-modal-action="confirm"]').addEventListener('click', () => close(true), { once: true });
      host.querySelector('.modal-backdrop').addEventListener('click', () => close(false), { once: true });
    });
  };
})();
