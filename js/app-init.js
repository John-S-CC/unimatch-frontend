(function () {
  function enforceRoleAccess(body) {
    const scope = body.dataset.roleScope || '';
    if (!scope) return true;

    const admin = typeof esAdministrador === 'function' ? esAdministrador() : false;

    if (scope === 'admin' && !admin) {
      window.location.href = 'dashboard.html';
      return false;
    }

    if (scope === 'student' && admin) {
      window.location.href = 'admin_dashboard.html';
      return false;
    }

    return true;
  }

  async function init() {
    const body = document.body;
    const isPublic = body.hasAttribute('data-public-page');
    const currentPage = body.dataset.page || '';
    const userTarget = body.dataset.userTarget || '';

    if (!isPublic && typeof verificarSesion === 'function' && !verificarSesion()) {
      return;
    }

    if (!isPublic && typeof sincronizarPerfilSeguro === 'function') {
      try {
        await sincronizarPerfilSeguro();
      } catch (error) {
        limpiarSesion();
        window.location.href = 'index.html';
        return;
      }
    }

    if (!isPublic && !enforceRoleAccess(body)) {
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
