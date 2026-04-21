(function () {
  function init() {
    const body = document.body;
    const isPublic = body.hasAttribute('data-public-page');
    const currentPage = body.dataset.page || '';
    const userTarget = body.dataset.userTarget || '';

    if (!isPublic && typeof verificarSesion === 'function' && !verificarSesion()) {
      return;
    }

    if (!isPublic && typeof renderAppShell === 'function') {
      renderAppShell(currentPage);
    }

    if (userTarget && typeof pintarUsuario === 'function') {
      pintarUsuario(userTarget);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
