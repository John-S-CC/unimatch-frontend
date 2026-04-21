document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("tabla_materias");

  if (tabla) {
    tabla.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      const grupoId = Number(button.dataset.grupoId || 0);
      if (!grupoId) return;

      if (button.dataset.action === "matricular") {
        await matricular(grupoId, button);
      }
    });
  }

  cargarMaterias();
});

async function cargarMaterias() {
  const tabla = document.getElementById("tabla_materias");

  if (!tabla) return;

  tabla.innerHTML = `<tr><td colspan="6">Cargando materias...</td></tr>`;

  try {
    if (typeof showGlobalLoader === 'function') showGlobalLoader('Consultando grupos y cupos disponibles.', 'Cargando oferta académica');
    const data = await listarMaterias();

    if (!data.ok) {
      tabla.innerHTML = `<tr><td colspan="6">${escapeHtml(data.mensaje || "No se pudieron cargar las materias.")}</td></tr>`;
      return;
    }

    if (!Array.isArray(data.materias) || data.materias.length === 0) {
      tabla.innerHTML = `<tr><td colspan="6">No hay materias disponibles.</td></tr>`;
      return;
    }

    tabla.innerHTML = "";

    data.materias.forEach((m) => {
      const fila = document.createElement("tr");
      const cupos = Number(m.cupos_disponibles || 0);
      const badgeClass = cupos > 0 ? 'success' : 'danger';
      fila.innerHTML = `
        <td>${escapeHtml(m.materia)}</td>
        <td>${escapeHtml(String(m.id_materia || "-"))}</td>
        <td>${escapeHtml(String(m.id_grupo))}</td>
        <td>${escapeHtml(m.horario || "Sin horario")}</td>
        <td><span class="badge ${badgeClass}">${escapeHtml(String(cupos))} cupos</span></td>
        <td class="acciones">
          <button type="button" class="btn btn-primary" data-action="matricular" data-grupo-id="${Number(m.id_grupo)}" ${cupos <= 0 ? 'disabled' : ''}>Matricular</button>
        </td>
      `;
      tabla.appendChild(fila);
    });
  } catch (error) {
    console.error(error);
    tabla.innerHTML = `<tr><td colspan="6">${escapeHtml(error.message || "Error de conexión con el servidor.")}</td></tr>`;
    if (typeof showToast === 'function') showToast(error.message || 'No fue posible cargar la oferta.', 'error');
  } finally {
    if (typeof hideGlobalLoader === 'function') hideGlobalLoader();
    if (typeof hideGlobalLoader === 'function') hideGlobalLoader();
  }
}

async function matricular(grupoId, button) {
  const confirmed = typeof confirmAction === 'function'
    ? await confirmAction({
        title: 'Confirmar inscripción',
        message: `¿Deseas matricular el grupo ${grupoId}? La inscripción se hará de inmediato si hay cupos y no existe cruce horario.`,
        confirmText: 'Matricular ahora'
      })
    : window.confirm("¿Deseas matricular este grupo?");

  if (!confirmed) return;

  const originalText = button?.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = 'Procesando...';
  }

  try {
    if (typeof showGlobalLoader === 'function') showGlobalLoader('Validando cupos y horarios para completar la inscripción.', 'Procesando inscripción');
    const data = await matricularMateria(grupoId);
    if (typeof showToast === 'function') showToast(data.mensaje || (data.ok ? 'Matrícula realizada.' : 'No fue posible matricular.'), data.ok ? 'success' : 'error');
    if (data.ok) cargarMaterias();
  } catch (error) {
    console.error(error);
    if (typeof showToast === 'function') showToast(error.message || 'Error de conexión con el servidor.', 'error');
  } finally {
    if (typeof hideGlobalLoader === 'function') hideGlobalLoader();
    if (button) {
      button.disabled = false;
      button.textContent = originalText || 'Matricular';
    }
  }
}

function escapeHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
