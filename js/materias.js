document.addEventListener("DOMContentLoaded", () => {
  const tabla = document.getElementById("tabla_materias");

  if (tabla) {
    tabla.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) return;

      const grupoId = Number(button.dataset.grupoId || 0);
      if (!grupoId) return;

      if (button.dataset.action === "matricular") {
        await matricular(grupoId);
      }

      if (button.dataset.action === "cancelar") {
        await cancelar(grupoId);
      }
    });
  }

  cargarMaterias();
});

async function cargarMaterias() {
  const tabla = document.getElementById("tabla_materias");

  if (!tabla) {
    console.warn("No existe un elemento con id='tabla_materias'.");
    return;
  }

  tabla.innerHTML = `
    <tr>
      <td colspan="6">Cargando materias...</td>
    </tr>
  `;

  try {
    const data = await listarMaterias();

    if (!data.ok) {
      tabla.innerHTML = `
        <tr>
          <td colspan="6">${escapeHtml(data.mensaje || "No se pudieron cargar las materias.")}</td>
        </tr>
      `;
      return;
    }

    if (!Array.isArray(data.materias) || data.materias.length === 0) {
      tabla.innerHTML = `
        <tr>
          <td colspan="6">No hay materias disponibles.</td>
        </tr>
      `;
      return;
    }

    tabla.innerHTML = "";

    data.materias.forEach((m) => {
      const fila = document.createElement("tr");

      fila.innerHTML = `
        <td>${escapeHtml(m.materia)}</td>
        <td>${escapeHtml(String(m.id_materia || "-"))}</td>
        <td>${escapeHtml(String(m.id_grupo))}</td>
        <td>${escapeHtml(m.horario || "Sin horario")}</td>
        <td>${escapeHtml(String(m.cupos_disponibles))}</td>
        <td class="acciones">
          <button type="button" class="btn btn-primary" data-action="matricular" data-grupo-id="${Number(m.id_grupo)}">Matricular</button>
          <button type="button" class="btn btn-danger" data-action="cancelar" data-grupo-id="${Number(m.id_grupo)}">Cancelar</button>
        </td>
      `;

      tabla.appendChild(fila);
    });
  } catch (error) {
    console.error(error);
    tabla.innerHTML = `
      <tr>
        <td colspan="6">${escapeHtml(error.message || "Error de conexión con el servidor.")}</td>
      </tr>
    `;
  }
}

async function matricular(grupoId) {
  if (!confirm("¿Deseas matricular este grupo?")) {
    return;
  }

  try {
    const data = await matricularMateria(grupoId);
    alert(data.mensaje || (data.ok ? "Matrícula realizada." : "No fue posible matricular."));

    if (data.ok) {
      cargarMaterias();
    }
  } catch (error) {
    console.error(error);
    alert(error.message || "Error de conexión con el servidor.");
  }
}

async function cancelar(grupoId) {
  if (!confirm("¿Deseas cancelar este grupo?")) {
    return;
  }

  try {
    const data = await cancelarMateria(grupoId);
    alert(data.mensaje || (data.ok ? "Matrícula cancelada." : "No fue posible cancelar."));

    if (data.ok) {
      cargarMaterias();
    }
  } catch (error) {
    console.error(error);
    alert(error.message || "Error de conexión con el servidor.");
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
