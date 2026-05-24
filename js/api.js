function normalizeBase(base) {
  if (!base || typeof base !== "string") return null;

  base = base.trim();

  // Evita errores como /api/login.phplogin.php
  base = base.replace(/login\.php.*$/i, "");

  return base.endsWith("/") ? base : `${base}/`;
}

function buildApiCandidates() {
  const candidates = [
    window.UNIMATCH_API_BASE,
    window.API_BASE,
    localStorage.getItem("api_base"),
    "https://unimatch-backend-fid5.onrender.com/api/"
  ];

  return [...new Set(candidates.map(normalizeBase).filter(Boolean))];
}

function getUsuarioStorage() {
  try {
    return JSON.parse(
      sessionStorage.getItem("usuario") ||
      localStorage.getItem("usuario") ||
      "null"
    );
  } catch (error) {
    console.error("Error leyendo usuario:", error);
    return null;
  }
}

function getToken() {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    throw new Error("Respuesta vacía del servidor.");
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`La API devolvió una respuesta no válida: ${text.slice(0, 180)}`);
  }
}

async function request(endpoint, options = {}) {
  const API_CANDIDATES = buildApiCandidates();
  let lastError = null;

  endpoint = endpoint.replace(/^\/+/, "");

  for (const base of API_CANDIDATES) {
    try {
      const headers = {
        Accept: "application/json",
        ...(options.headers || {})
      };

      const token = getToken();

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(base + endpoint, {
        ...options,
        headers
      });

      const data = await parseResponse(response);

      if (response.status === 401) {
  console.warn("Token no autorizado o expirado en:", base + endpoint);
}

      if (!response.ok) {
        throw new Error(data?.error || data?.mensaje || "Error del servidor.");
      }

      if (data && typeof data === "object") {
        data.httpStatus = response.status;
      }

      localStorage.setItem("api_base", base);
      return data;

    } catch (error) {
      lastError = error;
      console.warn("Falló API con base:", base, error.message);
    }
  }

  console.error("No fue posible conectar con ninguna API candidata.", lastError);
  throw new Error(lastError?.message || "No fue posible conectar con la API.");
}

async function loginUsuario(correo, password) {
  return request("login.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ correo, password })
  });
}

async function listarMaterias() {
  return request("listar_materias.php", { method: "GET" });
}

async function matricularMateria(grupoId) {
  const body = new URLSearchParams();
  body.append("grupo_id", grupoId);

  return request("matricular_materia.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });
}

async function cancelarMateria(grupoId) {
  const body = new URLSearchParams();
  body.append("grupo_id", grupoId);

  return request("cancelar_materia.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });
}

async function crearSolicitud(payload) {
  const body = new URLSearchParams();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      body.append(key, value);
    }
  });

  return request("crear_solicitud.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });
}

async function listarSolicitudes() {
  return request("listar_solicitudes.php", { method: "GET" });
}

async function obtenerOpcionesSolicitud() {
  return request("opciones_solicitud.php", { method: "GET" });
}

async function obtenerMisMaterias() {
  return request("mis_materias.php", { method: "GET" });
}

async function obtenerPerfilUsuario() {
  return request("perfil_usuario.php", { method: "GET" });
}

async function crearTurno(payload) {
  const body = new URLSearchParams();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      body.append(key, value);
    }
  });

  return request("crear_turno.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });
}

async function listarTurnos() {
  return request("listar_turnos.php", { method: "GET" });
}

async function obtenerDetalleTurno(turnoId) {
  return request(`detalle_turno.php?id_turno=${encodeURIComponent(turnoId)}`, { method: "GET" });
}

async function obtenerResumenAdmin() {
  return request("admin_resumen.php", { method: "GET" });
}

async function actualizarEstadoTurno(turnoId, estado) {
  const body = new URLSearchParams();
  body.append("id_turno", turnoId);
  body.append("estado", estado);

  return request("actualizar_turno.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });
}

async function obtenerSolicitudesAdmin() {
  return request("admin_solicitudes.php", { method: "GET" });
}

async function obtenerConfiguracionAcademica() {
  return request("admin_configuracion_academica.php", { method: "GET" });
}


async function solicitarRecuperacionPassword(correo) {
    // Apuntamos a tu endpoint en Render que revisamos hace un momento
    const url = 'https://unimatch-backend-fid5.onmatch-fid5.onrender.com/api/solicitar_recuperacion.php'; 

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ correo: correo })
    });

    const data = await response.json();

    // Si la respuesta no es exitosa (ej. un error 422 o 500), lanzamos el error
    if (!response.ok || data.ok === false) {
        throw new Error(data.mensaje || 'No fue posible solicitar la recuperación.');
    }

    return data;
}

async function actualizarConfiguracionAcademica(payload) {
  const body = new URLSearchParams();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      body.append(key, value);
    }
  });

  return request("admin_configuracion_academica.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });
}