(function () {
  if (!verificarSesion()) {
    return;
  }

  const tabla = document.getElementById("tabla_solicitudes");
  const mensaje = document.getElementById("mensaje");
  const topActions = document.querySelector(".top-actions");

  function valorVacio(valor) {
    return valor === null || valor === "" ? "-" : String(valor);
  }

  function escapeHtml(texto) {
    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function filaCarga(texto) {
    tabla.innerHTML = `
      <tr>
        <td colspan="8">${texto}</td>
      </tr>
    `;
  }

  async function cargarSolicitudes() {
    filaCarga("Cargando solicitudes...");
    mensaje.textContent = "";
    mensaje.className = "msg";

    try {
      const data = await listarSolicitudes();

      if (!data.ok) {
        filaCarga(data.mensaje || "No se pudieron cargar las solicitudes.");
        return;
      }

      if (!Array.isArray(data.solicitudes) || data.solicitudes.length === 0) {
        filaCarga("No tienes solicitudes registradas.");
        return;
      }

      tabla.innerHTML = data.solicitudes.map((s) => `
        <tr>
          <td data-label="ID">${escapeHtml(s.id_solicitud)}</td>
          <td data-label="Tipo">${escapeHtml(s.tipo_solicitud)}</td>
          <td data-label="Grupo origen">${escapeHtml(valorVacio(s.grupo_origen))}</td>
          <td data-label="Grupo destino">${escapeHtml(valorVacio(s.grupo_destino))}</td>
          <td data-label="Materia origen">${escapeHtml(valorVacio(s.materia_origen))}</td>
          <td data-label="Materia destino">${escapeHtml(valorVacio(s.materia_destino))}</td>
          <td data-label="Estado">${escapeHtml(s.estado)}</td>
          <td data-label="Fecha">${escapeHtml(s.fecha_solicitud)}</td>
        </tr>
      `).join("");
    } catch (error) {
      console.error(error);
      filaCarga("Error de conexión con el servidor.");
      mensaje.textContent = "No fue posible cargar las solicitudes.";
      mensaje.classList.add("error");
    }
  }

  topActions.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    if (button.dataset.action === "new-request") {
      window.location.href = "crear_solicitud.html";
      return;
    }

    if (button.dataset.action === "logout") {
      cerrarSesion();
    }
  });

  cargarSolicitudes();
})();
