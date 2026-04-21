(function () {
  const DAY_ORDER = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  const DAY_LABELS = {
    Lunes: 'Lun',
    Martes: 'Mar',
    Miercoles: 'Mié',
    Jueves: 'Jue',
    Viernes: 'Vie',
    Sabado: 'Sáb'
  };

  function getUsuario() {
    try {
      return JSON.parse(localStorage.getItem('usuario') || 'null');
    } catch (error) {
      return null;
    }
  }

  function parseBlocks(horario, fallbackGrupo, fallbackMateria) {
    if (!horario) return [];
    return String(horario)
      .split('|')
      .map(item => item.trim())
      .filter(Boolean)
      .map(item => {
        const match = item.match(/^(Lunes|Martes|Miercoles|Jueves|Viernes|Sabado)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/i);
        if (!match) return null;
        return {
          dia: normalizeDay(match[1]),
          hora_inicio: match[2],
          hora_fin: match[3],
          id_grupo: fallbackGrupo,
          materia: fallbackMateria,
        };
      })
      .filter(Boolean);
  }

  function normalizeDay(day) {
    const clean = String(day || '').trim().toLowerCase();
    if (clean.startsWith('mie')) return 'Miercoles';
    const map = {
      lunes: 'Lunes',
      martes: 'Martes',
      jueves: 'Jueves',
      viernes: 'Viernes',
      sabado: 'Sabado'
    };
    return map[clean] || day;
  }

  function pad(num) {
    return String(num).padStart(2, '0');
  }

  function currentAcademicDay(now = new Date()) {
    const dayMap = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    return dayMap[now.getDay()];
  }

  function currentTimeString(now = new Date()) {
    return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  function formatHumanDate(date = new Date()) {
    return new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }

  function buildScheduleEntries(materias) {
    return materias.flatMap((materia) => parseBlocks(materia.horario, materia.id_grupo, materia.materia)).sort((a, b) => {
      const dayDiff = DAY_ORDER.indexOf(a.dia) - DAY_ORDER.indexOf(b.dia);
      if (dayDiff !== 0) return dayDiff;
      return a.hora_inicio.localeCompare(b.hora_inicio);
    });
  }

  function compareTimes(a, b) {
    return String(a).localeCompare(String(b));
  }

  function statusForEntry(entry, now = new Date()) {
    const today = currentAcademicDay(now);
    if (entry.dia !== today) return 'future';
    const current = currentTimeString(now);
    if (compareTimes(current, entry.hora_inicio) >= 0 && compareTimes(current, entry.hora_fin) <= 0) return 'live';
    if (compareTimes(current, entry.hora_inicio) < 0) return 'next';
    return 'past';
  }

  function getCurrentAndNext(entries, now = new Date()) {
    const today = currentAcademicDay(now);
    const current = currentTimeString(now);
    const todayEntries = entries.filter(entry => entry.dia === today).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

    const currentClass = todayEntries.find(entry => compareTimes(current, entry.hora_inicio) >= 0 && compareTimes(current, entry.hora_fin) <= 0) || null;
    const nextClass = todayEntries.find(entry => compareTimes(current, entry.hora_inicio) < 0) || null;

    return { currentClass, nextClass, todayEntries };
  }

  function statusBadge(text, cls) {
    return `<span class="status-bullet ${cls}">${text}</span>`;
  }

  function renderGreeting(entries, openRequests, now = new Date()) {
    const usuario = getUsuario();
    const name = usuario?.nombre ? usuario.nombre.split(' ')[0] : 'estudiante';
    const greeting = now.getHours() < 12 ? 'Buenos días' : now.getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';
    const { currentClass, nextClass, todayEntries } = getCurrentAndNext(entries, now);

    const title = document.getElementById('dashboardGreetingTitle');
    const text = document.getElementById('dashboardGreetingText');
    const liveHeadline = document.getElementById('dashboardLiveHeadline');
    const liveCopy = document.getElementById('dashboardLiveCopy');
    const heroPendingCount = document.getElementById('heroPendingCount');
    const heroTodayCount = document.getElementById('heroTodayCount');

    if (title) title.textContent = `${greeting}, ${name}. Aquí tienes tu panorama académico.`;
    if (text) {
      text.textContent = currentClass
        ? `Tienes ${currentClass.materia} en curso y ${todayEntries.length} bloque${todayEntries.length === 1 ? '' : 's'} programado${todayEntries.length === 1 ? '' : 's'} para hoy.`
        : nextClass
          ? `Tu próxima clase es ${nextClass.materia} a las ${nextClass.hora_inicio}. Además, hoy tienes ${todayEntries.length} bloque${todayEntries.length === 1 ? '' : 's'} agendado${todayEntries.length === 1 ? '' : 's'}.`
          : `Hoy no tienes clases activas en el horario. Aprovecha este espacio para revisar solicitudes, cargas o preparar tu próxima semana.`;
    }
    if (liveHeadline) {
      liveHeadline.textContent = currentClass
        ? `${currentClass.materia} está en curso`
        : nextClass
          ? `Próxima clase: ${nextClass.materia}`
          : 'Sin clases activas hoy';
    }
    if (liveCopy) {
      liveCopy.textContent = currentClass
        ? `Horario actual: ${currentClass.hora_inicio} a ${currentClass.hora_fin} · Grupo ${currentClass.id_grupo}.`
        : nextClass
          ? `Empieza a las ${nextClass.hora_inicio} y termina a las ${nextClass.hora_fin}. Mantén tu día organizado con esta vista.`
          : 'El tablero sigue mostrándote tu actividad reciente y la intensidad semanal para planificarte con tiempo.';
    }
    if (heroPendingCount) heroPendingCount.textContent = String(openRequests);
    if (heroTodayCount) heroTodayCount.textContent = String(todayEntries.length);
  }

  function renderOverview(entries, solicitudes, now = new Date()) {
    const uniqueSubjects = new Set(entries.map(item => item.materia));
    const openRequests = solicitudes.filter(item => ['pendiente', 'procesando', 'permuta'].includes(String(item.estado || '').toLowerCase())).length;
    const { nextClass } = getCurrentAndNext(entries, now);

    document.getElementById('overviewActiveSubjects').textContent = String(uniqueSubjects.size);
    document.getElementById('overviewWeeklyBlocks').textContent = String(entries.length);
    document.getElementById('overviewOpenRequests').textContent = String(openRequests);

    const nextClassNode = document.getElementById('overviewNextClass');
    const nextClassMeta = document.getElementById('overviewNextClassMeta');
    if (nextClassNode) nextClassNode.textContent = nextClass ? nextClass.materia : 'Sin próxima clase';
    if (nextClassMeta) nextClassMeta.textContent = nextClass ? `${nextClass.dia} · ${nextClass.hora_inicio} a ${nextClass.hora_fin}` : 'No hay más bloques pendientes hoy';

    renderGreeting(entries, openRequests, now);
  }

  function renderSummary(entries) {
    const host = document.getElementById('dashboardScheduleSummary');
    if (!host) return;
    const now = new Date();
    const { currentClass, nextClass, todayEntries } = getCurrentAndNext(entries, now);
    const uniqueSubjects = new Set(entries.map(item => item.materia));

    const cards = [
      {
        label: 'Ahora mismo',
        value: currentClass ? currentClass.materia : 'Sin clase en curso',
        help: currentClass ? `Grupo ${currentClass.id_grupo} · ${currentClass.hora_inicio} a ${currentClass.hora_fin}` : 'No tienes un bloque activo en este momento.',
        className: 'schedule-highlight'
      },
      {
        label: 'Próxima clase',
        value: nextClass ? nextClass.materia : 'Sin más clases hoy',
        help: nextClass ? `${nextClass.dia} · ${nextClass.hora_inicio} a ${nextClass.hora_fin}` : 'Tu agenda académica de hoy ya terminó.',
        className: ''
      },
      {
        label: 'Carga actual',
        value: `${uniqueSubjects.size} materia${uniqueSubjects.size === 1 ? '' : 's'}`,
        help: `${todayEntries.length} bloque${todayEntries.length === 1 ? '' : 's'} para hoy · ${entries.length} bloque${entries.length === 1 ? '' : 's'} en la semana`,
        className: ''
      }
    ];

    host.innerHTML = cards.map(card => `
      <article class="metric-card ${card.className}">
        <div class="metric-label">${card.label}</div>
        <div class="metric-value metric-value--small">${card.value}</div>
        <div class="metric-help">${card.help}</div>
      </article>
    `).join('');
  }

  function renderWeek(entries) {
    const host = document.getElementById('weeklySchedule');
    const empty = document.getElementById('dashboardEmptyState');
    const meta = document.getElementById('dashboardDateText');
    if (meta) meta.textContent = formatHumanDate(new Date());
    if (!host) return;

    if (!entries.length) {
      host.innerHTML = '';
      if (empty) {
        empty.hidden = false;
        empty.innerHTML = `
          <h3>Aún no tienes materias matriculadas</h3>
          <p>Cuando registres materias activas, aquí verás tu horario semanal organizado por día y podrás identificar rápidamente qué tienes hoy.</p>
          <a class="btn-primary" href="materias.html">Ir a inscripciones</a>
        `;
      }
      return;
    }

    if (empty) empty.hidden = true;

    const today = currentAcademicDay(new Date());
    host.innerHTML = DAY_ORDER.map(day => {
      const items = entries.filter(entry => entry.dia === day);
      return `
        <article class="day-card${day === today ? ' is-today' : ''}">
          <header class="day-card-header">
            <div>
              <span class="day-chip">${DAY_LABELS[day]}</span>
              <h3>${day}</h3>
            </div>
            <span class="day-count">${items.length} bloque${items.length === 1 ? '' : 's'}</span>
          </header>
          <div class="day-card-body">
            ${items.length ? items.map(item => `
              <div class="schedule-item ${statusForEntry(item) === 'live' ? 'is-live' : ''}">
                <div class="schedule-time">${item.hora_inicio}<span></span>${item.hora_fin}</div>
                <div class="schedule-info">
                  <strong>${item.materia}</strong>
                  <small>Grupo ${item.id_grupo}</small>
                </div>
              </div>
            `).join('') : '<p class="schedule-empty">No tienes clases este día.</p>'}
          </div>
        </article>
      `;
    }).join('');
  }

  function renderWeekBars(entries) {
    const host = document.getElementById('dashboardWeekBars');
    if (!host) return;
    if (!entries.length) {
      host.innerHTML = '<div class="empty-state compact-empty"><strong>Sin bloques por graficar.</strong><span>Cuando tengas materias activas aparecerá la intensidad semanal.</span></div>';
      return;
    }
    const counts = DAY_ORDER.map(day => entries.filter(entry => entry.dia === day).length);
    const max = Math.max(...counts, 1);
    host.innerHTML = DAY_ORDER.map((day, index) => {
      const count = counts[index];
      const height = Math.max(14, Math.round((count / max) * 100));
      return `
        <div class="weekly-bar-card">
          <span class="weekly-bar-count">${count}</span>
          <div class="weekly-bar-track">
            <div class="weekly-bar-fill" style="height:${height}%"></div>
          </div>
          <strong>${DAY_LABELS[day]}</strong>
        </div>
      `;
    }).join('');
  }

  function renderTodayStack(entries) {
    const host = document.getElementById('dashboardTodayStack');
    if (!host) return;
    const { currentClass, nextClass, todayEntries } = getCurrentAndNext(entries, new Date());
    if (!todayEntries.length) {
      host.innerHTML = `
        <div class="empty-state compact-empty">
          <strong>Hoy no tienes clases programadas.</strong>
          <span>Puedes revisar tus solicitudes o preparar las próximas inscripciones desde el menú superior.</span>
        </div>
      `;
      return;
    }

    host.innerHTML = todayEntries.map(item => {
      const status = statusForEntry(item);
      const badge = status === 'live'
        ? statusBadge('En curso', 'is-live')
        : status === 'next'
          ? statusBadge('Próxima', 'is-next')
          : statusBadge('Completada', 'is-past');
      return `
        <article class="today-item ${status === 'live' ? 'is-live' : ''}">
          <div class="today-item-copy">
            <div class="today-item-head">
              <strong>${item.materia}</strong>
              ${badge}
            </div>
            <span>Grupo ${item.id_grupo}</span>
          </div>
          <div class="today-item-time">${item.hora_inicio} · ${item.hora_fin}</div>
        </article>
      `;
    }).join('');

    if (currentClass || nextClass) {
      const headline = document.getElementById('dashboardLiveHeadline');
      const copy = document.getElementById('dashboardLiveCopy');
      if (headline && currentClass) headline.textContent = `${currentClass.materia} está en curso`;
      if (copy && currentClass) copy.textContent = `Se encuentra activo el bloque ${currentClass.hora_inicio} a ${currentClass.hora_fin} del grupo ${currentClass.id_grupo}.`;
      if (headline && !currentClass && nextClass) headline.textContent = `Próxima clase: ${nextClass.materia}`;
    }
  }

  function timelineEvent(label, detail, type, stamp) {
    return { label, detail, type, stamp };
  }

  function renderTimeline(materias, solicitudes) {
    const host = document.getElementById('dashboardTimeline');
    if (!host) return;
    const events = [];

    materias.forEach(item => {
      events.push(timelineEvent(
        'Materia activa',
        `${item.materia} · Grupo ${item.id_grupo}`,
        'success',
        item.fecha_matricula || ''
      ));
    });

    solicitudes.forEach(item => {
      const state = String(item.estado || '').toLowerCase();
      const type = state === 'aprobada' ? 'success' : state === 'rechazada' ? 'danger' : 'warning';
      events.push(timelineEvent(
        `Solicitud ${item.tipo_solicitud}`,
        `${item.estado} · ${item.fecha_solicitud || 'Sin fecha'}`,
        type,
        item.fecha_solicitud || ''
      ));
    });

    events.sort((a, b) => String(b.stamp).localeCompare(String(a.stamp)));
    const slice = events.slice(0, 7);

    if (!slice.length) {
      host.innerHTML = '<div class="empty-state compact-empty"><strong>Sin actividad reciente.</strong><span>Cuando registres inscripciones o solicitudes, aquí verás la trazabilidad del módulo.</span></div>';
      return;
    }

    host.innerHTML = slice.map(item => `
      <article class="timeline-item">
        <div class="timeline-dot ${item.type}"></div>
        <div class="timeline-copy">
          <strong>${item.label}</strong>
          <span>${item.detail}</span>
        </div>
      </article>
    `).join('');
  }

  async function initDashboard() {
    const loading = document.getElementById('dashboardLoadingState');
    const errorBox = document.getElementById('dashboardErrorState');
    const emptyBox = document.getElementById('dashboardEmptyState');
    if (loading) loading.hidden = false;
    if (errorBox) errorBox.hidden = true;
    if (emptyBox) emptyBox.hidden = true;

    try {
      const [materiasResponse, solicitudesResponse] = await (typeof withGlobalLoader === 'function'
        ? withGlobalLoader(
            () => Promise.all([obtenerMisMaterias(), listarSolicitudes()]),
            'Consultando horario, métricas y actividad reciente.',
            'Cargando portal académico'
          )
        : Promise.all([obtenerMisMaterias(), listarSolicitudes()]));

      if (!materiasResponse?.ok) {
        throw new Error(materiasResponse?.mensaje || 'No fue posible cargar tu horario actual.');
      }

      const materias = Array.isArray(materiasResponse.materias) ? materiasResponse.materias : [];
      const solicitudes = Array.isArray(solicitudesResponse?.solicitudes) ? solicitudesResponse.solicitudes : [];
      const entries = buildScheduleEntries(materias);
      renderOverview(entries, solicitudes);
      renderSummary(entries);
      renderWeekBars(entries);
      renderTodayStack(entries);
      renderTimeline(materias, solicitudes);
      renderWeek(entries);
    } catch (error) {
      if (errorBox) {
        errorBox.hidden = false;
        errorBox.innerHTML = `
          <h3>No pudimos cargar el horario</h3>
          <p>${error.message}</p>
          <button type="button" class="btn-secondary" id="retryDashboardSchedule">Intentar de nuevo</button>
        `;
        const retry = document.getElementById('retryDashboardSchedule');
        if (retry) retry.addEventListener('click', initDashboard, { once: true });
      }
      if (typeof showToast === 'function') showToast(error.message || 'No fue posible cargar el tablero.', 'error');
    } finally {
      if (loading) loading.hidden = true;
    }
  }

  document.addEventListener('DOMContentLoaded', initDashboard);
})();
