(function () {
  if (!verificarSesion()) return;

  const totalSolicitudes = document.getElementById('adminTotalSolicitudes');
  const totalTurnos = document.getElementById('adminTotalTurnos');
  const pendientes = document.getElementById('adminTurnosPendientes');
  const resueltos = document.getElementById('adminTurnosResueltos');
  const estadosSolicitudes = document.getElementById('adminEstadosSolicitudes');
  const resolucionSolicitudes = document.getElementById('adminResolucionSolicitudes');
  const estadosTurnos = document.getElementById('adminEstadosTurnos');
  const tablaTurnos = document.getElementById('adminTablaTurnos');
  const tablaSolicitudes = document.getElementById('adminTablaSolicitudes');
  const detalleTurno = document.getElementById('adminDetalleTurno');
  const detalleSolicitud = document.getElementById('adminDetalleSolicitud');
  const queueHeadline = document.getElementById('adminQueueHeadline');
  const queueCopy = document.getElementById('adminQueueCopy');
  const formConfig = document.getElementById('adminConfigForm');
  const cfgFechaSistema = document.getElementById('cfgFechaSistema');
  const cfgFechaInscripcion = document.getElementById('cfgFechaInscripcion');
  const cfgFechaCancelacion = document.getElementById('cfgFechaCancelacion');
  const cfgFechaPermutas = document.getElementById('cfgFechaPermutas');
  const adminCalendarHint = document.getElementById('adminCalendarHint');

  let cacheSolicitudes = [];

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
  }

  function statusClass(estado) {
    const value = String(estado || '').toLowerCase();
    if (value === 'resuelta' || value === 'aprobada' || value === 'permuta') return 'status-aprobada';
    if (value === 'rechazada') return 'status-rechazada';
    return 'status-pendiente';
  }

  function formatLabel(value) {
    const raw = String(value || 'sin_definir').replace(/_/g, ' ');
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  function toInputDate(value) {
    if (!value) return '';
    return String(value).slice(0, 16);
  }

  function renderKeyValue(host, obj) {
    const entries = Object.entries(obj || {});
    if (!entries.length) {
      host.innerHTML = '<div class="detail-item"><span>Sin datos</span><strong>0</strong></div>';
      return;
    }

    host.innerHTML = entries.map(([key, value]) => `
      <div class="detail-item">
        <span>${escapeHtml(formatLabel(key))}</span>
        <strong>${escapeHtml(String(value))}</strong>
      </div>
    `).join('');
  }

  function renderTurnos(turnos) {
    if (!turnos.length) {
      tablaTurnos.innerHTML = '<tr><td colspan="6">No hay turnos registrados.</td></tr>';
      return;
    }

    tablaTurnos.innerHTML = turnos.map((turno) => `
      <tr>
        <td>${escapeHtml(turno.codigo_turno)}</td>
        <td>${escapeHtml(turno.fecha_turno)}</td>
        <td>${escapeHtml(turno.nombre_estudiante)}</td>
        <td>${escapeHtml(turno.programa || 'Sin programa')}</td>
        <td><span class="status-pill ${statusClass(turno.estado)}">${escapeHtml(turno.estado)}</span></td>
        <td><button type="button" class="btn btn-secondary btn-sm" data-turno-id="${Number(turno.id_turno)}">Ver detalle</button></td>
      </tr>
    `).join('');
  }

  function resumenSolicitud(item) {
    const origen = item.nombre_materia_origen ? `Origen: ${item.nombre_materia_origen}${item.grupo_origen ? ` · G${item.grupo_origen}` : ''}` : 'Origen: no aplica';
    const destino = item.nombre_materia_destino ? `Destino: ${item.nombre_materia_destino}${item.grupo_destino ? ` · G${item.grupo_destino}` : ''}` : 'Destino: no aplica';
    return `${origen} · ${destino}`;
  }

  function renderSolicitudes(items) {
    if (!items.length) {
      tablaSolicitudes.innerHTML = '<tr><td colspan="7">No hay solicitudes registradas.</td></tr>';
      return;
    }

    tablaSolicitudes.innerHTML = items.map((item, index) => `
      <tr>
        <td>${escapeHtml(String(item.id_solicitud))}</td>
        <td>${escapeHtml(item.fecha_solicitud)}</td>
        <td>${escapeHtml(item.estudiante || 'Sin nombre')}</td>
        <td>
          <strong>${escapeHtml(formatLabel(item.tipo_solicitud))}</strong>
          <div class="table-subcopy">${escapeHtml(resumenSolicitud(item))}</div>
        </td>
        <td><span class="status-pill ${statusClass(item.estado)}">${escapeHtml(item.estado)}</span></td>
        <td>${escapeHtml(formatLabel(item.canal_resolucion))}</td>
        <td><button type="button" class="btn btn-secondary btn-sm" data-solicitud-index="${index}">Ver detalle</button></td>
      </tr>
    `).join('');
  }

  function renderSolicitudDetalle(item) {
    detalleSolicitud.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item"><span>ID</span><strong>${escapeHtml(item.id_solicitud)}</strong></div>
        <div class="detail-item"><span>Estudiante</span><strong>${escapeHtml(item.estudiante || 'Sin nombre')}</strong></div>
        <div class="detail-item"><span>Correo</span><strong>${escapeHtml(item.correo || 'Sin correo')}</strong></div>
        <div class="detail-item"><span>Programa</span><strong>${escapeHtml(item.programa || 'Sin programa')}</strong></div>
        <div class="detail-item"><span>Extensión</span><strong>${escapeHtml(item.extension || 'Sin extensión')}</strong></div>
        <div class="detail-item"><span>Tipo</span><strong>${escapeHtml(formatLabel(item.tipo_solicitud))}</strong></div>
        <div class="detail-item"><span>Estado</span><strong>${escapeHtml(item.estado)}</strong></div>
        <div class="detail-item"><span>Canal</span><strong>${escapeHtml(formatLabel(item.canal_resolucion))}</strong></div>
        <div class="detail-item"><span>Fecha solicitud</span><strong>${escapeHtml(item.fecha_solicitud)}</strong></div>
        <div class="detail-item"><span>Fecha resolución</span><strong>${escapeHtml(item.fecha_resolucion || 'Aún no resuelta')}</strong></div>
        <div class="detail-item detail-item-wide"><span>Ruta académica</span><strong>${escapeHtml(resumenSolicitud(item))}</strong></div>
        <div class="detail-item detail-item-wide"><span>Detalle de estado</span><strong>${escapeHtml(item.detalle_estado || 'Sin detalle adicional')}</strong></div>
      </div>
    `;
  }

  function renderDetalleTurno(turno) {
    detalleTurno.innerHTML = `
      <div class="detail-grid">
        <div class="detail-item"><span>Código</span><strong>${escapeHtml(turno.codigo_turno)}</strong></div>
        <div class="detail-item"><span>Fecha</span><strong>${escapeHtml(turno.fecha_turno_formateada || turno.fecha_turno || '')}</strong></div>
        <div class="detail-item"><span>Estudiante</span><strong>${escapeHtml(turno.nombre_estudiante)}</strong></div>
        <div class="detail-item"><span>Correo</span><strong>${escapeHtml(turno.correo_estudiante || 'No registrado')}</strong></div>
        <div class="detail-item"><span>Programa</span><strong>${escapeHtml(turno.programa || 'No registrado')}</strong></div>
        <div class="detail-item"><span>Extensión</span><strong>${escapeHtml(turno.extension || 'No registrada')}</strong></div>
        <div class="detail-item detail-item-wide"><span>Motivo</span><strong>${escapeHtml(turno.motivo)}</strong></div>
      </div>
      <div class="detail-actions mt-16">
        <button type="button" class="btn btn-secondary" data-update-state="pendiente" data-detail-id="${Number(turno.id_turno)}">Marcar pendiente</button>
        <button type="button" class="btn btn-primary" data-update-state="resuelta" data-detail-id="${Number(turno.id_turno)}">Marcar resuelta</button>
        <button type="button" class="btn btn-danger" data-update-state="rechazada" data-detail-id="${Number(turno.id_turno)}">Marcar rechazada</button>
      </div>
    `;
  }

  async function cargarDetalleTurno(turnoId) {
    try {
      const data = await obtenerDetalleTurno(turnoId);
      if (!data.ok || !data.turno) {
        detalleTurno.innerHTML = '<div class="empty-state compact-empty"><strong>No fue posible cargar el turno.</strong></div>';
        return;
      }
      renderDetalleTurno(data.turno);
    } catch (error) {
      console.error(error);
      detalleTurno.innerHTML = '<div class="empty-state compact-empty"><strong>No fue posible cargar el turno.</strong></div>';
    }
  }

  async function cargarPanel() {
    try {
      if (typeof showGlobalLoader === 'function') showGlobalLoader('Estamos cargando el panel administrativo.', 'Panel administrativo');
      const [resumenData, solicitudesData] = await Promise.all([
        obtenerResumenAdmin(),
        obtenerSolicitudesAdmin()
      ]);

      if (!resumenData.ok) {
        throw new Error(resumenData.mensaje || 'No fue posible cargar el resumen del panel.');
      }

      const resumen = resumenData.resumen || {};
      totalSolicitudes.textContent = resumen.total_solicitudes || 0;
      totalTurnos.textContent = resumen.total_turnos || 0;
      pendientes.textContent = resumen.turnos_pendientes || 0;
      resueltos.textContent = resumen.turnos_resueltos || 0;
      renderKeyValue(estadosSolicitudes, resumen.solicitudes_por_estado || {});
      renderKeyValue(resolucionSolicitudes, resumen.solicitudes_por_resolucion || {});
      renderKeyValue(estadosTurnos, {
        pendiente: resumen.turnos_pendientes || 0,
        resuelta: resumen.turnos_resueltos || 0,
        rechazada: resumen.turnos_rechazados || 0,
      });
      renderTurnos(Array.isArray(resumen.turnos) ? resumen.turnos : []);

      const config = resumen.configuracion || {};
      cfgFechaSistema.value = toInputDate(config.fecha_sistema);
      cfgFechaInscripcion.value = toInputDate(config.fecha_limite_inscripcion);
      cfgFechaCancelacion.value = toInputDate(config.fecha_limite_cancelacion);
      cfgFechaPermutas.value = toInputDate(config.fecha_limite_permutas);

      const listaTurnos = Array.isArray(resumen.turnos) ? resumen.turnos : [];
      const rechazadas = Number(resumen.rechazadas_por_vencimiento || 0);
      queueHeadline.textContent = `Fecha simulada: ${config.fecha_sistema || 'No definida'}`;
      queueCopy.textContent = rechazadas > 0
        ? `Se rechazaron ${rechazadas} solicitud(es) pendientes por vencimiento del periodo de permutas.`
        : (listaTurnos.length
          ? `Hay ${listaTurnos.length} turno(s) registrados y la cola respeta el orden cronológico.`
          : 'No hay turnos registrados en este momento.');

      if (solicitudesData.ok) {
        cacheSolicitudes = Array.isArray(solicitudesData.solicitudes) ? solicitudesData.solicitudes : [];
        renderSolicitudes(cacheSolicitudes);
      } else {
        tablaSolicitudes.innerHTML = '<tr><td colspan="7">No fue posible cargar el historial de solicitudes.</td></tr>';
      }
    } catch (error) {
      console.error(error);
      tablaTurnos.innerHTML = '<tr><td colspan="6">No fue posible cargar el panel administrativo.</td></tr>';
      tablaSolicitudes.innerHTML = '<tr><td colspan="7">No fue posible cargar el historial de solicitudes.</td></tr>';
    } finally {
      if (typeof hideGlobalLoader === 'function') hideGlobalLoader();
    }
  }

  tablaTurnos.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-turno-id]');
    if (!btn) return;
    cargarDetalleTurno(btn.dataset.turnoId);
  });

  tablaSolicitudes.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-solicitud-index]');
    if (!btn) return;
    const index = Number(btn.dataset.solicitudIndex || -1);
    const item = cacheSolicitudes[index];
    if (item) renderSolicitudDetalle(item);
  });

  detalleTurno.addEventListener('click', async (event) => {
    const btn = event.target.closest('[data-update-state]');
    if (!btn) return;

    try {
      const data = await actualizarEstadoTurno(btn.dataset.detailId, btn.dataset.updateState);
      if (!data.ok) {
        if (typeof showToast === 'function') showToast(data.mensaje || 'No fue posible actualizar el turno.', 'error');
        return;
      }
      if (typeof showToast === 'function') showToast(data.mensaje || 'Turno actualizado.', 'success');
      await cargarDetalleTurno(btn.dataset.detailId);
      await cargarPanel();
    } catch (error) {
      console.error(error);
      if (typeof showToast === 'function') showToast('No fue posible actualizar el turno.', 'error');
    }
  });

  formConfig.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const data = await actualizarConfiguracionAcademica({
        fecha_sistema: cfgFechaSistema.value,
        fecha_limite_inscripcion: cfgFechaInscripcion.value,
        fecha_limite_cancelacion: cfgFechaCancelacion.value,
        fecha_limite_permutas: cfgFechaPermutas.value,
      });

      if (!data.ok) {
        if (typeof showToast === 'function') showToast(data.mensaje || 'No fue posible guardar la configuración.', 'error');
        return;
      }

      adminCalendarHint.textContent = data.rechazadas_por_vencimiento
        ? `Se actualizaron las fechas y se rechazaron ${data.rechazadas_por_vencimiento} solicitud(es) pendientes fuera del plazo.`
        : 'Configuración guardada correctamente.';
      if (typeof showToast === 'function') showToast(data.mensaje || 'Configuración actualizada.', 'success');
      await cargarPanel();
    } catch (error) {
      console.error(error);
      if (typeof showToast === 'function') showToast('No fue posible guardar la configuración académica.', 'error');
    }
  });

  cargarPanel();
})();
