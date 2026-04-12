(function () {
  if (!verificarSesion()) {
    return;
  }

  let inscritas = [];
  let disponibles = [];

  const tipo = document.getElementById("tipo_solicitud");
  const origenSelect = document.getElementById("origen_select");
  const destinoSelect = document.getElementById("destino_select");
  const mensaje = document.getElementById("mensaje");
  const form = document.getElementById("formSolicitud");
  const bloqueOrigen = document.getElementById("bloque_origen");
  const bloqueDestino = document.getElementById("bloque_destino");
  const resumenTexto = document.getElementById("resumen_texto");
  const actions = document.querySelector(".actions");

  const params = new URLSearchParams(window.location.search);
  const tipoPre = params.get("tipo_solicitud");
  const grupoOrigenPre = params.get("grupo_origen");
  const materiaOrigenPre = params.get("materia_origen");

  function obtenerTextoOpcion(selectElement) {
    const option = selectElement.options[selectElement.selectedIndex];
    return option ? option.textContent : "";
  }

  function mostrarMensaje(texto, tipoClase) {
    mensaje.textContent = texto;
    mensaje.className = `msg ${tipoClase}`;
  }

  function limpiarMensaje() {
    mensaje.textContent = "";
    mensaje.className = "msg";
  }

  function resetSelect(selectElement, placeholder, disabled = false) {
    selectElement.innerHTML = `<option value="">${placeholder}</option>`;
    selectElement.disabled = disabled;
  }

  function actualizarVistaSegunTipo() {
    const tipoSolicitud = tipo.value;

    bloqueOrigen.classList.remove("hidden");
    bloqueDestino.classList.remove("hidden");
    origenSelect.disabled = false;
    destinoSelect.disabled = false;

    if (tipoSolicitud === "cancelacion") {
      bloqueDestino.classList.add("hidden");
      resetSelect(destinoSelect, "No aplica", true);
    } else if (tipoSolicitud === "nueva_inscripcion") {
      bloqueOrigen.classList.add("hidden");
      resetSelect(origenSelect, "No aplica", true);
    }

    actualizarResumen();
  }

  function llenarOrigen() {
    resetSelect(origenSelect, "Seleccione...");

    inscritas.forEach((item) => {
      const option = document.createElement("option");
      option.value = `${item.id_grupo}|${item.id_materia}`;
      option.textContent = item.etiqueta;
      origenSelect.appendChild(option);
    });

    if (grupoOrigenPre && materiaOrigenPre) {
      const value = `${grupoOrigenPre}|${materiaOrigenPre}`;
      const existe = Array.from(origenSelect.options).some((opt) => opt.value === value);
      if (existe) {
        origenSelect.value = value;
      }
    }
  }

  function llenarDestino() {
    const tipoSolicitud = tipo.value;
    resetSelect(destinoSelect, "Seleccione...");

    const origen = origenSelect.value ? origenSelect.value.split("|") : [];
    const grupoOrigen = parseInt(origen[0], 10) || 0;
    const materiaOrigen = parseInt(origen[1], 10) || 0;

    let opciones = disponibles;

    if (tipoSolicitud === "cambio_grupo") {
      opciones = disponibles.filter((item) => item.id_materia === materiaOrigen && item.id_grupo !== grupoOrigen);
    } else if (tipoSolicitud === "cambio_materia") {
      opciones = disponibles.filter((item) => item.id_materia !== materiaOrigen);
    } else if (tipoSolicitud === "nueva_inscripcion") {
      const gruposInscritos = new Set(inscritas.map((item) => item.id_grupo));
      opciones = disponibles.filter((item) => !gruposInscritos.has(item.id_grupo));
    }

    if (!opciones.length) {
      resetSelect(destinoSelect, "No hay opciones disponibles", true);
      actualizarResumen();
      return;
    }

    opciones.forEach((item) => {
      const option = document.createElement("option");
      option.value = `${item.id_grupo}|${item.id_materia}`;
      option.textContent = item.etiqueta;
      destinoSelect.appendChild(option);
    });

    destinoSelect.disabled = false;
    actualizarResumen();
  }

  function actualizarResumen() {
    const tipoSolicitud = tipo.value || "Sin seleccionar";
    const origenTexto = bloqueOrigen.classList.contains("hidden") ? "No aplica" : (obtenerTextoOpcion(origenSelect) || "Sin seleccionar");
    const destinoTexto = bloqueDestino.classList.contains("hidden") ? "No aplica" : (obtenerTextoOpcion(destinoSelect) || "Sin seleccionar");

    resumenTexto.innerHTML = `
      <strong>Tipo:</strong> ${tipoSolicitud}<br>
      <strong>Origen:</strong> ${origenTexto}<br>
      <strong>Destino:</strong> ${destinoTexto}
    `;
  }

  async function cargarOpciones() {
    limpiarMensaje();

    try {
      const data = await obtenerOpcionesSolicitud();

      if (!data.ok) {
        mostrarMensaje(data.mensaje || "No se pudieron cargar las opciones.", "error");
        return;
      }

      inscritas = Array.isArray(data.inscritas) ? data.inscritas : [];
      disponibles = Array.isArray(data.disponibles) ? data.disponibles : [];

      llenarOrigen();

      if (tipoPre) {
        tipo.value = tipoPre;
      }

      actualizarVistaSegunTipo();
      llenarDestino();
    } catch (error) {
      console.error(error);
      mostrarMensaje("Error de conexión con el servidor.", "error");
    }
  }

  function construirPayload() {
    const payload = { tipo_solicitud: tipo.value };

    if (!bloqueOrigen.classList.contains("hidden") && origenSelect.value) {
      const [grupoOrigen, materiaOrigen] = origenSelect.value.split("|");
      payload.grupo_origen = grupoOrigen;
      payload.materia_origen = materiaOrigen;
    }

    if (!bloqueDestino.classList.contains("hidden") && destinoSelect.value) {
      const [grupoDestino, materiaDestino] = destinoSelect.value.split("|");
      payload.grupo_destino = grupoDestino;
      payload.materia_destino = materiaDestino;
    }

    return payload;
  }

  async function guardarSolicitud(event) {
    event.preventDefault();
    limpiarMensaje();

    const payload = construirPayload();

    try {
      const data = await crearSolicitud(payload);

      if (!data.ok) {
        mostrarMensaje(data.mensaje || "No se pudo guardar la solicitud.", "error");
        return;
      }

      mostrarMensaje(data.mensaje || "Solicitud guardada correctamente.", "ok");
      form.reset();
      tipo.value = "";
      resetSelect(origenSelect, "Seleccione...");
      resetSelect(destinoSelect, "Seleccione...");
      bloqueOrigen.classList.remove("hidden");
      bloqueDestino.classList.remove("hidden");
      cargarOpciones();
    } catch (error) {
      console.error(error);
      mostrarMensaje("Error de conexión con el servidor.", "error");
    }
  }

  actions.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;

    if (action === "go-mis-materias") {
      window.location.href = "mis_materias.html";
    } else if (action === "go-solicitudes") {
      window.location.href = "consultar_solicitudes.html";
    } else if (action === "logout") {
      cerrarSesion();
    }
  });

  tipo.addEventListener("change", () => {
    limpiarMensaje();
    actualizarVistaSegunTipo();
    llenarDestino();
  });

  origenSelect.addEventListener("change", () => {
    limpiarMensaje();
    llenarDestino();
  });

  destinoSelect.addEventListener("change", actualizarResumen);
  form.addEventListener("submit", guardarSolicitud);

  cargarOpciones();
})();
