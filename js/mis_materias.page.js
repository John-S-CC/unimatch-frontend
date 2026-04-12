(function () {
  if (!verificarSesion()) {
    return;
  }

  const contenido = document.getElementById("contenido");
  const mensaje = document.getElementById("mensaje");
  const actionsTop = document.querySelector(".actions-top");

  function irConSolicitudPrellenada(tipo, item) {
    const params = new URLSearchParams({
      tipo_solicitud: tipo,
      grupo_origen: item.id_grupo,
      materia_origen: item.id_materia
    });

    window.location.href = `crear_solicitud.html?${params.toString()}`;
  }

  async function procesarCancelacionDirecta(item) {
    const confirmar = window.confirm(`¿Deseas cancelar directamente la materia del grupo ${item.id_grupo}?`);
    if (!confirmar) {
      return;
    }

    try {
      const data = await cancelarMateria(item.id_grupo);
      mensaje.textContent = data.mensaje || (data.ok ? "Materia cancelada correctamente." : "No fue posible cancelar la materia.");
      if (data.ok) {
        cargarMisMaterias();
      }
    } catch (error) {
      console.error(error);
      mensaje.textContent = error.message || "Error de conexión con el servidor.";
    }
  }

  function escapeHtml(texto) {
    return String(texto ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
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
          <td data-label="Materia">${escapeHtml(item.materia)}</td>
          <td data-label="Grupo">${escapeHtml(item.id_grupo)}</td>
          <td data-label="Horario">${escapeHtml(item.horario || "Sin horario registrado")}</td>
          <td data-label="Estado"><span class="tag">${escapeHtml(item.estado)}</span></td>
          <td data-label="Fecha matrícula">${escapeHtml(item.fecha_matricula)}</td>
          <td data-label="Acciones">
            <div class="row-actions">
              <button class="btn-cancel" data-action="cancelacion" data-item="${payload}">Cancelar</button>
              <button class="btn-group" data-action="cambio_grupo" data-item="${payload}">Cambio de grupo</button>
              <button class="btn-subject" data-action="cambio_materia" data-item="${payload}">Cambio de materia</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    contenido.innerHTML = `
      <table>
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
    `;
  }

  async function cargarMisMaterias() {
    contenido.innerHTML = "";
    mensaje.textContent = "";

    try {
      const data = await obtenerMisMaterias();

      if (!data.ok) {
        mensaje.textContent = data.mensaje || "No fue posible cargar las materias inscritas.";
        return;
      }

      const materias = Array.isArray(data.materias) ? data.materias : [];

      if (!materias.length) {
        contenido.innerHTML = '<div class="empty">No tienes materias inscritas en este momento.</div>';
        return;
      }

      renderTabla(materias);
    } catch (error) {
      console.error(error);
      mensaje.textContent = "Error de conexión con el servidor.";
    }
  }

  actionsTop.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;

    if (action === "go-materias") {
      window.location.href = "materias.html";
      return;
    }

    if (action === "go-crear-solicitud") {
      window.location.href = "crear_solicitud.html";
      return;
    }

    if (action === "go-solicitudes") {
      window.location.href = "consultar_solicitudes.html";
      return;
    }

    if (action === "logout") {
      cerrarSesion();
    }
  });

  contenido.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action][data-item]");
    if (!button) {
      return;
    }

    const tipo = button.dataset.action;
    const item = JSON.parse(decodeURIComponent(button.dataset.item));

    if (tipo === "cancelacion") {
      procesarCancelacionDirecta(item);
      return;
    }

    irConSolicitudPrellenada(tipo, item);
  });

  cargarMisMaterias();
})();
