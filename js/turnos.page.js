(function () {
  if (!verificarSesion()) return;

  const nombre = document.getElementById('turnoNombre');
  const fecha = document.getElementById('turnoFecha');
  const programa = document.getElementById('turnoPrograma');
  const extension = document.getElementById('turnoExtension');
  const motivo = document.getElementById('turnoMotivo');
  const form = document.getElementById('turnoForm');
  const mensaje = document.getElementById('turnoMensaje');
  const resultado = document.getElementById('turnoResultado');
  const tabla = document.getElementById('tablaTurnosEstudiante');

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
  }

  function statusClass(estado) {
    const value = String(estado || '').toLowerCase();
    if (value === 'resuelta') return 'status-aprobada';
    if (value === 'rechazada') return 'status-rechazada';
    return 'status-pendiente';
  }

  function showMessage(text, type = '') {
    mensaje.textContent = text;
    mensaje.className = text ? `msg show ${type}` : 'msg';
  }

  function renderTurnoResult(turno) {
    if (!turno) {
      resultado.innerHTML = '<strong>No hay turno reciente para mostrar.</strong>';
      return;
    }

    resultado.innerHTML = `
      <div class="turno-big-code">${escapeHtml(turno.codigo_turno)}</div>
      <div class="detail-grid mt-16">
        <div class="detail-item"><span>Estudiante</span><strong>${escapeHtml(turno.nombre_estudiante)}</strong></div>
        <div class="detail-item"><span>Programa</span><strong>${escapeHtml(turno.programa || 'Sin registrar')}</strong></div>
        <div class="detail-item"><span>Extensión</span><strong>${escapeHtml(turno.extension || 'Sin registrar')}</strong></div>
        <div class="detail-item"><span>Estado</span><strong><span class="status-chip ${statusClass(turno.estado)}">${escapeHtml(turno.estado)}</span></strong></div>
      </div>
      <div class="detail-block mt-16">
        <span>Motivo</span>
        <p>${escapeHtml(turno.motivo)}</p>
      </div>
      <small class="footer-note">Generado el ${escapeHtml(turno.fecha_turno)}</small>
    `;
  }

  function renderTable(turnos) {
    if (!turnos.length) {
      tabla.innerHTML = '<tr><td colspan="4">Aún no tienes turnos registrados.</td></tr>';
      return;
    }

    tabla.innerHTML = turnos.map((item) => `
      <tr>
        <td>${escapeHtml(item.codigo_turno)}</td>
        <td>${escapeHtml(item.fecha_turno)}</td>
        <td>${escapeHtml(item.motivo)}</td>
        <td><span class="status-chip ${statusClass(item.estado)}">${escapeHtml(item.estado)}</span></td>
      </tr>
    `).join('');
  }

  async function cargarPerfil() {
    const usuario = getUsuarioActual() || {};
    nombre.value = usuario.nombre || '';
    programa.value = usuario.programa || '';
    extension.value = usuario.extension || 'Extensión Facatativá';
    fecha.value = new Date().toLocaleDateString('es-CO');

    try {
      const data = await obtenerPerfilUsuario();
      if (data.ok && data.perfil) {
        nombre.value = data.perfil.nombre || nombre.value;
        programa.value = data.perfil.programa || programa.value;
        extension.value = data.perfil.extension || extension.value;
        fecha.value = data.perfil.fecha_actual || fecha.value;

        localStorage.setItem('usuario', JSON.stringify({
          ...usuario,
          nombre: data.perfil.nombre || usuario.nombre,
          programa: data.perfil.programa || usuario.programa,
          extension: data.perfil.extension || usuario.extension
        }));
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function cargarTurnos() {
    try {
      const data = await listarTurnos();
      const turnos = Array.isArray(data.turnos) ? data.turnos : [];
      renderTable(turnos);
      if (turnos.length) renderTurnoResult(turnos[0]);
    } catch (error) {
      console.error(error);
      tabla.innerHTML = '<tr><td colspan="4">No fue posible cargar los turnos.</td></tr>';
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('', '');

    const motivoTexto = motivo.value.trim();
    if (!motivoTexto) {
      showMessage('Debes ingresar el motivo del turno.', 'error');
      return;
    }

    try {
      if (typeof showGlobalLoader === 'function') showGlobalLoader('Generando el turno y registrando la solicitud.', 'Registrando turno');
      const data = await crearTurno({ motivo: motivoTexto });
      if (!data.ok) {
        showMessage(data.mensaje || 'No fue posible generar el turno.', 'error');
        return;
      }

      showMessage(data.mensaje || 'Turno generado correctamente.', 'ok');
      if (data.turno) renderTurnoResult(data.turno);
      motivo.value = '';
      await cargarTurnos();
    } catch (error) {
      console.error(error);
      showMessage(error.message || 'No fue posible generar el turno.', 'error');
    } finally {
      if (typeof hideGlobalLoader === 'function') hideGlobalLoader();
    }
  });

  cargarPerfil();
  cargarTurnos();
})();
