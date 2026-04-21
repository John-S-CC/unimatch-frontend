(function () {
  if (!verificarSesion()) return;

  const contenido = document.getElementById("contenido");
  const mensaje = document.getElementById("mensaje");

  function irConSolicitudPrellenada(tipo, item) {
    const params = new URLSearchParams({
      tipo_solicitud: tipo,
      grupo_origen: item.id_grupo,
      materia_origen: item.id_materia
    });

    window.location.href = `crear_solicitud.html?${params.toString()}`;
  }

  function showMessage(texto, clase) {
    mensaje.textContent = texto;
    mensaje.className = `msg show ${clase}`;
  }

  function clearMessage() {
    mensaje.textContent = "";
    mensaje.className = "msg";
  }

  async function procesarCancelacionDirecta(item, button) {
    const confirmar = typeof confirmAction === 'function'
      ? await confirmAction({
          title: 'Cancelar materia',
          message: `¿Deseas cancelar directamente la materia del grupo ${item.id_grupo}? Esta acción cambiará el estado de la matrícula actual.`,
          confirmText: 'Cancelar materia',
          danger: true
        })
      : window.confirm(`¿Deseas cancelar directamente la materia del grupo ${item.id_grupo}?`);
    if (!confirmar) return;

    const previousText = button?.textContent;
    if (button) {
      button.disabled = true;
      button.textContent = 'Cancelando...';
    }

    try {
      if (typeof showGlobalLoader === 'function') showGlobalLoader('Estamos cancelando la materia seleccionada.', 'Procesando cancelación');
      const data = await cancelarMateria(item.id_grupo);
      const texto = data.mensaje || (data.ok ? "Materia cancelada correctamente." : "No fue posible cancelar la materia.");
      showMessage(texto, data.ok ? 'ok' : 'error');
      if (typeof showToast === 'function') showToast(texto, data.ok ? 'success' : 'error');
      if (data.ok) cargarMisMaterias();
    } catch (error) {
      console.error(error);
      const texto = error.message || "Error de conexión con el servidor.";
      showMessage(texto, 'error');
      if (typeof showToast === 'function') showToast(texto, 'error');
    } finally {
      if (typeof hideGlobalLoader === 'function') hideGlobalLoader();
      if (button) {
        button.disabled = false;
        button.textContent = previousText || 'Cancelar';
      }
    }
  }

  function escapeHtml(texto) {
    return String(texto ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderTabla(materias) {
    const rows = materias.map((item) => {
      const payload = encodeURIComponent(JSON.stringify({
        id_grupo: item.id_grupo,
        id_materia: item.id_materia
      }));

      return `
        <tr>
          <td>${escapeHtml(item.materia)}</td>
          <td>${escapeHtml(item.id_grupo)}</td>
          <td>${escapeHtml(item.horario || "Sin horario registrado")}</td>
          <td><span class="tag">${escapeHtml(item.estado)}</span></td>
          <td>${escapeHtml(item.fecha_matricula)}</td>
          <td>
            <div class="row-actions">
              <button class="btn-danger" data-action="cancelacion" data-item="${payload}">Cancelar</button>
              <button class="btn-secondary" data-action="cambio_grupo" data-item="${payload}">Cambio de grupo</button>
              <button class="btn-secondary" data-action="cambio_materia" data-item="${payload}">Cambio de materia</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    contenido.innerHTML = `
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Materia</th>
              <th>Grupo</th>
              <th>Horario</th>
              <th>Estado</th>
              <th>Fecha matrícula</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  async function cargarMisMaterias() {
    contenido.innerHTML = "";
    clearMessage();

    try {
      if (typeof showGlobalLoader === 'function') showGlobalLoader('Consultando tus materias activas.', 'Cargando tus materias');
      const data = await obtenerMisMaterias();

      if (!data.ok) {
        showMessage(data.mensaje || "No fue posible cargar las materias inscritas.", 'error');
        return;
      }

      const materias = Array.isArray(data.materias) ? data.materias : [];

      if (!materias.length) {
        contenido.innerHTML = '<div class="empty-state"><strong>No tienes materias inscritas.</strong><span>Cuando completes una matrícula directa, aquí aparecerá el resumen de tus asignaturas activas.</span></div>';
        return;
      }

      renderTabla(materias);
    } catch (error) {
      console.error(error);
      showMessage("Error de conexión con el servidor.", 'error');
      if (typeof showToast === 'function') showToast('No fue posible cargar tus materias activas.', 'error');
    } finally {
      if (typeof hideGlobalLoader === 'function') hideGlobalLoader();
    }
  }

  contenido.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action][data-item]");
    if (!button) return;

    const tipo = button.dataset.action;
    const item = JSON.parse(decodeURIComponent(button.dataset.item));

    if (tipo === "cancelacion") {
      procesarCancelacionDirecta(item, button);
      return;
    }

    irConSolicitudPrellenada(tipo, item);
  });

  cargarMisMaterias();
})();
