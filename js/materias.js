document.addEventListener("DOMContentLoaded", () => {
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
      <td colspan="5">Cargando materias...</td>
    </tr>
  `;

  try {
    const data = await listarMaterias();

    if (!data.ok) {
      tabla.innerHTML = `
        <tr>
          <td colspan="5">${data.mensaje || "No se pudieron cargar las materias."}</td>
        </tr>
      `;
      return;
    }

    if (!data.materias || data.materias.length === 0) {
      tabla.innerHTML = `
        <tr>
          <td colspan="5">No hay materias disponibles.</td>
        </tr>
      `;
      return;
    }

    tabla.innerHTML = "";

    data.materias.forEach((m) => {
      const fila = document.createElement("tr");

      fila.innerHTML = `
        <td>${escapeHtml(m.materia)}</td>
        <td>${escapeHtml(String(m.id_grupo))}</td>
        <td>${escapeHtml(m.horario)}</td>
        <td>${escapeHtml(String(m.cupos_disponibles))}</td>
        <td>
          <button type="button" onclick="matricular(${Number(m.id_grupo)})">
            Matricular
          </button>
        </td>
      `;

      tabla.appendChild(fila);
    });
  } catch (error) {
    console.error(error);
    tabla.innerHTML = `
      <tr>
        <td colspan="5">Error de conexión con el servidor.</td>
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
    alert("Error de conexión con el servidor.");
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