(function () {
  if (!verificarSesion()) return;

  const tabla = document.getElementById("tabla_solicitudes");
  const mensaje = document.getElementById("mensaje");
  const filtro = document.getElementById("filtroSolicitudes");
  const paginationInfo = document.getElementById("paginationInfo");
  const paginationControls = document.getElementById("paginationControls");

  const state = {
    solicitudes: [],
    filtradas: [],
    currentPage: 1,
    pageSize: 6,
  };

  function valorVacio(valor) {
    return valor === null || valor === "" ? "-" : String(valor);
  }

  function escapeHtml(texto) {
    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function filaCarga(texto) {
    tabla.innerHTML = `<tr><td colspan="8">${texto}</td></tr>`;
  }

  function statusClass(estado) {
    const value = String(estado || '').toLowerCase();
    if (["aprobada"].includes(value)) return 'status-aprobada';
    if (["rechazada", "cancelada"].includes(value)) return 'status-rechazada';
    if (["permuta", "procesando", "pendiente"].includes(value)) return `status-${value}`;
    return 'status-pendiente';
  }

  function buildRow(s) {
    return `
      <tr>
        <td>${escapeHtml(s.id_solicitud)}</td>
        <td>${escapeHtml(s.tipo_solicitud)}</td>
        <td>${escapeHtml(valorVacio(s.grupo_origen))}</td>
        <td>${escapeHtml(valorVacio(s.grupo_destino))}</td>
        <td>${escapeHtml(valorVacio(s.materia_origen_nombre || s.materia_origen))}</td>
        <td>${escapeHtml(valorVacio(s.materia_destino_nombre || s.materia_destino))}</td>
        <td><span class="status-chip ${statusClass(s.estado)}">${escapeHtml(s.estado)}</span></td>
        <td>${escapeHtml(s.fecha_solicitud)}</td>
      </tr>
    `;
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) {
      paginationControls.innerHTML = '';
      return;
    }

    const buttons = [];
    buttons.push(`<button type="button" class="btn-secondary" data-page-nav="prev" ${state.currentPage === 1 ? 'disabled' : ''}>Anterior</button>`);

    for (let page = 1; page <= totalPages; page += 1) {
      buttons.push(`<button type="button" class="page-number ${page === state.currentPage ? 'is-active' : ''}" data-page="${page}">${page}</button>`);
    }

    buttons.push(`<button type="button" class="btn-secondary" data-page-nav="next" ${state.currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>`);
    paginationControls.innerHTML = buttons.join('');
  }

  function renderTable() {
    const total = state.filtradas.length;

    if (!total) {
      filaCarga('No tienes solicitudes registradas para este criterio.');
      paginationInfo.textContent = 'Sin resultados';
      paginationControls.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(total / state.pageSize);
    if (state.currentPage > totalPages) state.currentPage = totalPages;

    const start = (state.currentPage - 1) * state.pageSize;
    const end = start + state.pageSize;
    const currentItems = state.filtradas.slice(start, end);

    tabla.innerHTML = currentItems.map(buildRow).join('');
    paginationInfo.textContent = `Mostrando ${start + 1}-${Math.min(end, total)} de ${total} solicitudes.`;
    renderPagination(totalPages);
  }

  function applyFilter() {
    const term = (filtro.value || '').trim().toLowerCase();
    state.currentPage = 1;

    if (!term) {
      state.filtradas = [...state.solicitudes];
      renderTable();
      return;
    }

    state.filtradas = state.solicitudes.filter((item) => {
      return [
        item.id_solicitud,
        item.tipo_solicitud,
        item.grupo_origen,
        item.grupo_destino,
        item.materia_origen,
        item.materia_destino,
        item.materia_origen_nombre,
        item.materia_destino_nombre,
        item.estado,
        item.fecha_solicitud,
      ].some((value) => String(value ?? '').toLowerCase().includes(term));
    });

    renderTable();
  }

  async function cargarSolicitudes() {
    filaCarga("Cargando solicitudes...");
    mensaje.className = 'msg';
    mensaje.textContent = '';

    try {
      if (typeof showGlobalLoader === 'function') showGlobalLoader('Cargando el historial paginado de solicitudes.', 'Consultando peticiones');
      const data = await listarSolicitudes();
      if (!data.ok) {
        filaCarga(data.mensaje || "No se pudieron cargar las solicitudes.");
        return;
      }

      state.solicitudes = Array.isArray(data.solicitudes) ? data.solicitudes : [];
      state.filtradas = [...state.solicitudes];
      renderTable();
    } catch (error) {
      console.error(error);
      filaCarga("Error de conexión con el servidor.");
      mensaje.textContent = "No fue posible cargar las solicitudes.";
      mensaje.className = 'msg show error';
      if (typeof showToast === 'function') showToast('No fue posible cargar las solicitudes.', 'error');
    } finally {
      if (typeof hideGlobalLoader === 'function') hideGlobalLoader();
    }
  }

  paginationControls.addEventListener('click', (event) => {
    const numbered = event.target.closest('[data-page]');
    const nav = event.target.closest('[data-page-nav]');
    if (numbered) {
      state.currentPage = Number(numbered.dataset.page);
      renderTable();
      return;
    }
    if (nav) {
      const totalPages = Math.ceil(state.filtradas.length / state.pageSize);
      if (nav.dataset.pageNav === 'prev' && state.currentPage > 1) state.currentPage -= 1;
      if (nav.dataset.pageNav === 'next' && state.currentPage < totalPages) state.currentPage += 1;
      renderTable();
    }
  });

  filtro.addEventListener('input', applyFilter);
  cargarSolicitudes();
})();
