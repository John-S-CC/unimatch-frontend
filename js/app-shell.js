(function () {
  function initials(name) {
    return String(name || 'UE').trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('') || 'UE';
  }

  function getUsuario() {
    try {
      return JSON.parse(localStorage.getItem('usuario') || 'null');
    } catch (error) {
      return null;
    }
  }

  function isAdminRole(rol) {
    return ['admin', 'administrador', 'root'].includes(String(rol || '').toLowerCase());
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char] || char));
  }

  function normalizeBase(base) {
    if (!base || typeof base !== 'string') return null;
    return base.endsWith('/') ? base : `${base}/`;
  }

  function getApiCandidates() {
    const candidates = [window.API_BASE, localStorage.getItem('api_base')];

    if (window.location?.origin?.startsWith('http')) {
      candidates.push(`${window.location.origin}/api/`);      
    }

    candidates.push('https://unimatch-backend-fid5.onrender.com/api/');
    return [...new Set(candidates.map(normalizeBase).filter(Boolean))];
  }

  async function requestHeaderApi(endpoint) {
    const token = localStorage.getItem('token');
    let lastError = null;

    for (const base of getApiCandidates()) {
      try {
        const response = await fetch(base + endpoint, {
          headers: {
            Accept: 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });

        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
        }

        localStorage.setItem('api_base', base);
        return { ok: response.ok, status: response.status, data };
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('No fue posible consultar la API para el header.');
  }

  function navItems(currentPage) {
    const usuario = getUsuario();
    const isAdmin = isAdminRole(usuario?.rol);

    if (isAdmin) {
      return [
        { href: 'admin_dashboard.html', label: 'Panel admin', page: 'admin_dashboard', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 13h8V3H3zM13 21h8v-6h-8zM13 10h8V3h-8zM3 21h8v-6H3z"/></svg>' }
      ].map(item => ({ ...item, active: item.page === currentPage }));
    }

    return [
      { href: 'dashboard.html', label: 'Inicio', page: 'dashboard', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14v-9.5"/></svg>' },
      { href: 'academico.html', label: 'Módulo académico', page: 'academico', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16v12H4z"/><path d="M9 6v12"/><path d="M14 10h3"/><path d="M14 14h3"/></svg>' },
      { href: 'materias.html', label: 'Inscripciones', page: 'materias', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 4h10l4 4v12H5z"/><path d="M15 4v4h4"/><path d="M9 13h6"/><path d="M12 10v6"/></svg>' },
      { href: 'mis_materias.html', label: 'Mis materias', page: 'mis_materias', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16v12H4z"/><path d="M8 10h8"/><path d="M8 14h5"/></svg>' },
      { href: 'crear_solicitud.html', label: 'Crear solicitud', page: 'crear_solicitud', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h16v14H4z"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>' },
      { href: 'consultar_solicitudes.html', label: 'Peticiones', page: 'consultar_solicitudes', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 4h10v16H7z"/><path d="M9.5 9h5"/><path d="M9.5 13h5"/></svg>' },
      { href: 'turnos.html', label: 'Turnos', page: 'turnos', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6h11"/><path d="M8 12h11"/><path d="M8 18h11"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>' }
    ].map(item => ({ ...item, active: item.page === currentPage }));
  }

  function shellTemplate(currentPage) {
    const usuario = getUsuario();
    const name = usuario?.nombre || 'Estudiante';
    const role = usuario?.rol || 'Usuario activo';
    const isAdmin = isAdminRole(role);
    const homeHref = isAdmin ? 'admin_dashboard.html' : 'dashboard.html';
    const links = navItems(currentPage).map(item => `
      <a class="nav-link${item.active ? ' is-active' : ''}" href="${item.href}" aria-current="${item.active ? 'page' : 'false'}">
        ${item.icon}
        <span>${item.label}</span>
      </a>
    `).join('');

    return `
      <header>
        <div class="top-utility">
          <div class="top-utility-inner">
            <div class="top-utility-badges">
              <span class="utility-pill"><span class="utility-dot"></span> ${escapeHtml(usuario?.extension || 'Extensión Facatativá')}</span>
              <span class="utility-pill">UniMatch · ${isAdmin ? 'panel administrativo' : 'módulo complementario'}</span>
            </div>
            <span class="footer-note">Diseño orientado a claridad, contraste y navegación institucional.</span>
          </div>
        </div>
        <div class="main-header">
          <div class="main-header-inner">
            <a class="brand-link" href="${homeHref}" aria-label="Ir al inicio del módulo UniMatch">
              <img class="brand-mark" src="img/logo-ucundinamarca.png" alt="Escudo de la Universidad de Cundinamarca" />
              <div class="brand-text">
                <span class="brand-eyebrow">${escapeHtml(usuario?.extension || 'Extensión Facatativá')}</span>
                <h1 class="brand-title">Universidad de Cundinamarca</h1>
                <span class="brand-subtitle">UniMatch · ${isAdmin ? 'gestión administrativa de turnos' : 'módulo académico complementario'}</span>
              </div>
            </a>
            <div class="header-utilities">
              <button type="button" class="header-icon-button notify-button" data-shell-action="toggle-notifications" aria-expanded="false" aria-controls="headerNotifications" aria-label="Abrir notificaciones">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5"/><path d="M10 17a2 2 0 0 0 4 0"/></svg>
                <span class="notify-badge" id="headerNotifyBadge" hidden>0</span>
              </button>

              <div class="header-dropdown notifications-menu" id="headerNotifications" role="menu" aria-label="Notificaciones del módulo">
                <div class="dropdown-heading">
                  <div>
                    <strong>Notificaciones</strong>
                    <small id="headerNotifyMeta">Cargando novedades del módulo...</small>
                  </div>
                  <span class="dropdown-counter" id="headerNotifyCounter">0</span>
                </div>
                <div class="dropdown-list" id="headerNotifyList">
                  <div class="dropdown-empty">Estamos preparando tus alertas.</div>
                </div>
                <div class="dropdown-footer">
                  <a href="${isAdmin ? 'admin_dashboard.html' : 'consultar_solicitudes.html'}">Ver detalle</a>
                </div>
              </div>

              <div class="user-menu" id="userMenu">
                <button type="button" class="user-menu-trigger" data-shell-action="toggle-user-menu" aria-expanded="false" aria-controls="headerUserMenu" aria-label="Abrir menú del usuario">
                  <div class="user-avatar">${initials(name)}</div>
                  <div class="user-meta">
                    <small>Sesión activa</small>
                    <strong class="js-user-name">${escapeHtml(name)}</strong>
                    <small>${escapeHtml(role)}</small>
                  </div>
                  <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
                </button>

                <div class="header-dropdown user-dropdown" id="headerUserMenu" role="menu" aria-label="Menú del usuario">
                  <div class="dropdown-user-card">
                    <div class="user-avatar large">${initials(name)}</div>
                    <div>
                      <strong>${escapeHtml(name)}</strong>
                      <small>${escapeHtml(role)}</small>
                    </div>
                  </div>
                  <div class="dropdown-list compact">
                    ${isAdmin ? `
                      <a class="dropdown-link" href="admin_dashboard.html">
                        <span>Panel administrativo</span>
                        <small>Métricas, turnos y trazabilidad</small>
                      </a>
                    ` : `
                      <a class="dropdown-link" href="dashboard.html">
                        <span>Inicio</span>
                        <small>Resumen del día y agenda actual</small>
                      </a>
                      <a class="dropdown-link" href="mis_materias.html">
                        <span>Mi horario y materias</span>
                        <small>Consulta tus bloques activos</small>
                      </a>
                      <a class="dropdown-link" href="turnos.html">
                        <span>Mis turnos</span>
                        <small>Genera y consulta tus turnos</small>
                      </a>
                    `}
                  </div>
                  <div class="dropdown-footer user-dropdown-footer">
                    <button type="button" class="dropdown-danger" data-shell-action="logout">Cerrar sesión</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <nav class="main-nav" aria-label="Navegación principal del módulo">
          <div class="main-nav-inner">
            <button type="button" class="nav-toggle" data-shell-action="toggle-nav" aria-expanded="false" aria-controls="mainNavLinks">
              <span></span><span></span><span></span>
              <strong>Menú</strong>
            </button>
            <div class="nav-links" id="mainNavLinks">${links}</div>
            <div class="nav-actions">
              <span class="nav-notice">${isAdmin ? 'Gestión activa' : 'Portal activo'}</span>
            </div>
          </div>
        </nav>
      </header>
    `;
  }

  function footerTemplate() {
    return `
      <footer class="footer">
        <div class="footer-inner">
          <div>
            <p><strong>UniMatch · Universidad de Cundinamarca</strong></p>
            <small>Interfaz académica complementaria con navegación superior fija, lenguaje claro y componentes accesibles para la gestión de solicitudes y turnos.</small>
          </div>
          <div>
            <small>www.ucundinamarca.edu.co · Vigilada MinEducación</small>
            <p class="footer-note">Paleta visual basada en el verde institucional y componentes adaptados por rol.</p>
          </div>
        </div>
      </footer>
    `;
  }

  function closeMenus() {
    document.body.classList.remove('nav-open');
    const navToggle = document.querySelector('[data-shell-action="toggle-nav"]');
    if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    document.querySelectorAll('.header-dropdown.is-open').forEach(menu => menu.classList.remove('is-open'));
    document.querySelectorAll('[data-shell-action="toggle-user-menu"], [data-shell-action="toggle-notifications"]').forEach(btn => btn.setAttribute('aria-expanded', 'false'));
  }

  function bindShellInteractions() {
    document.querySelectorAll('[data-shell-action="logout"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof cerrarSesion === 'function') cerrarSesion();
      });
    });

    const toggle = document.querySelector('[data-shell-action="toggle-nav"]');
    const navLinks = document.getElementById('mainNavLinks');
    if (toggle && navLinks) {
      toggle.addEventListener('click', () => {
        const open = document.body.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', String(open));
      });

      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          document.body.classList.remove('nav-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    const userMenu = document.getElementById('userMenu');
    const userToggle = document.querySelector('[data-shell-action="toggle-user-menu"]');
    const userDropdown = document.getElementById('headerUserMenu');
    const notificationsToggle = document.querySelector('[data-shell-action="toggle-notifications"]');
    const notificationsMenu = document.getElementById('headerNotifications');

    function toggleMenu(button, menu, otherMenu, otherButton) {
      if (!button || !menu) return;
      const willOpen = !menu.classList.contains('is-open');
      if (otherMenu) otherMenu.classList.remove('is-open');
      if (otherButton) otherButton.setAttribute('aria-expanded', 'false');
      menu.classList.toggle('is-open', willOpen);
      button.setAttribute('aria-expanded', String(willOpen));
    }

    if (userToggle && userDropdown) {
      userToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleMenu(userToggle, userDropdown, notificationsMenu, notificationsToggle);
      });
    }

    if (notificationsToggle && notificationsMenu) {
      notificationsToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleMenu(notificationsToggle, notificationsMenu, userDropdown, userToggle);
      });
    }

    [userDropdown, notificationsMenu].forEach(menu => {
      if (!menu) return;
      menu.addEventListener('click', event => event.stopPropagation());
    });

    document.addEventListener('click', (event) => {
      const insideUser = userMenu?.contains(event.target);
      const insideNotifications = notificationsMenu?.contains(event.target) || notificationsToggle?.contains(event.target);
      if (!insideUser && !insideNotifications) {
        document.querySelectorAll('.header-dropdown.is-open').forEach(menu => menu.classList.remove('is-open'));
        if (userToggle) userToggle.setAttribute('aria-expanded', 'false');
        if (notificationsToggle) notificationsToggle.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenus();
    });
  }

  function renderHeaderNotifications(model) {
    const badge = document.getElementById('headerNotifyBadge');
    const counter = document.getElementById('headerNotifyCounter');
    const meta = document.getElementById('headerNotifyMeta');
    const list = document.getElementById('headerNotifyList');
    if (!badge || !counter || !meta || !list) return;

    const count = Number(model?.count || 0);
    badge.hidden = count <= 0;
    badge.textContent = String(count);
    counter.textContent = String(count);
    meta.textContent = model?.summary || 'Novedades del módulo.';

    list.innerHTML = (model?.items || []).map(item => `
      <a class="notification-item tone-${item.tone || 'neutral'}" href="${item.href || '#'}">
        <span class="notification-dot"></span>
        <div>
          <strong>${escapeHtml(item.title || 'Notificación')}</strong>
          <small>${escapeHtml(item.text || '')}</small>
        </div>
      </a>
    `).join('');
  }

  function buildNotificationsFromAdmin(resumen) {
    const pending = Number(resumen?.turnos_pendientes || 0);
    const rejected = Number(resumen?.turnos_rechazados || 0);
    const total = Number(resumen?.total_turnos || 0);
    const items = [];

    if (pending) {
      items.push({ tone: 'warning', title: `${pending} turno(s) pendientes`, text: 'Hay turnos por revisar desde la cola administrativa.', href: 'admin_dashboard.html' });
    }
    if (rejected) {
      items.push({ tone: 'danger', title: `${rejected} turno(s) rechazados`, text: 'Verifica si requieren trazabilidad o nueva atención.', href: 'admin_dashboard.html' });
    }
    if (!items.length) {
      items.push({ tone: 'neutral', title: 'Sin alertas críticas', text: total ? 'Todos los turnos están al día o ya fueron gestionados.' : 'Aún no hay turnos registrados.', href: 'admin_dashboard.html' });
    }
    return {
      count: pending,
      summary: `Resumen administrativo de ${total} turno(s) registrados.`,
      items
    };
  }

  function buildNotificationsFromStudent(materiasPayload, solicitudesPayload, turnosPayload) {
    const materias = Array.isArray(materiasPayload?.data) ? materiasPayload.data : [];
    const solicitudes = Array.isArray(solicitudesPayload?.data) ? solicitudesPayload.data : [];
    const turnos = Array.isArray(turnosPayload?.data) ? turnosPayload.data : [];
    const activeRequests = solicitudes.filter(item => ['pendiente', 'procesando', 'permuta'].includes(String(item.estado || '').toLowerCase()));
    const pendingTurns = turnos.filter(item => String(item.estado || '').toLowerCase() === 'pendiente');
    const items = [];

    if (activeRequests.length) {
      items.push({ tone: 'warning', title: `${activeRequests.length} petición(es) activa(s)`, text: 'Tu módulo detectó solicitudes en curso.', href: 'consultar_solicitudes.html' });
    }
    if (pendingTurns.length) {
      items.push({ tone: 'info', title: `${pendingTurns.length} turno(s) pendiente(s)`, text: 'Ya generaste turnos que siguen en espera de gestión.', href: 'turnos.html' });
    }
    if (materias.length) {
      items.push({ tone: 'success', title: `${materias.length} materia(s) activa(s)`, text: 'Tu horario está disponible para consulta.', href: 'mis_materias.html' });
    }
    if (!items.length) {
      items.push({ tone: 'neutral', title: 'Todo al día', text: 'No encontramos alertas nuevas en tu sesión.', href: 'dashboard.html' });
    }

    return {
      count: activeRequests.length + pendingTurns.length,
      summary: `${items.length} novedades relevantes para tu seguimiento académico.`,
      items
    };
  }

  async function hydrateHeaderData() {
    const usuario = getUsuario();
    const isAdmin = isAdminRole(usuario?.rol);

    try {
      if (isAdmin) {
        const adminResponse = await requestHeaderApi('admin_resumen.php');
        renderHeaderNotifications(buildNotificationsFromAdmin(adminResponse.data?.resumen || {}));
        return;
      }

      const [materiasResponse, solicitudesResponse, turnosResponse] = await Promise.all([
        requestHeaderApi('mis_materias.php'),
        requestHeaderApi('listar_solicitudes.php'),
        requestHeaderApi('listar_turnos.php')
      ]);
      renderHeaderNotifications(buildNotificationsFromStudent(materiasResponse.data, solicitudesResponse.data, turnosResponse.data));
    } catch (error) {
      renderHeaderNotifications({
        count: 0,
        summary: 'No fue posible actualizar las alertas del header en este momento.',
        items: [{ tone: 'neutral', title: 'Sincronización pendiente', text: 'El menú seguirá disponible y podrás consultar la información manualmente.', href: isAdmin ? 'admin_dashboard.html' : 'dashboard.html' }]
      });
    }
  }

  window.renderAppShell = function renderAppShell(currentPage) {
    const headerHost = document.querySelector('[data-app-shell="header"]');
    const footerHost = document.querySelector('[data-app-shell="footer"]');
    if (headerHost) headerHost.innerHTML = shellTemplate(currentPage);
    if (footerHost) footerHost.innerHTML = footerTemplate();
    bindShellInteractions();
    hydrateHeaderData();
  };
})();
