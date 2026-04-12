function normalizeBase(base) {
  if (!base || typeof base !== "string") return null;
  return base.endsWith("/") ? base : `${base}/`;
}

function buildApiCandidates() {
  const candidates = [
    window.API_BASE,
    localStorage.getItem("api_base")
  ];

  if (window.location?.origin?.startsWith("http")) {
    candidates.push(`${window.location.origin}/api/`);
    candidates.push(`${window.location.origin}/unimatch-backend/api/`);
  }

  candidates.push(
    "http://localhost:8000/api/",
    "http://localhost:8000/unimatch-backend/api/"
  );

  return [...new Set(candidates.map(normalizeBase).filter(Boolean))];
}

const API_CANDIDATES = buildApiCandidates();

function getUsuarioStorage() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch (error) {
    console.error("Error leyendo usuario:", error);
    return null;
  }
}

function getToken() {
  return localStorage.getItem("token");
}

async function parseResponse(response) {
  const text = await response.text();

  if (!text) {
    return {
      ok: response.ok,
      mensaje: response.ok ? "Operación completada." : "Respuesta vacía del servidor."
    };
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`La API devolvió una respuesta no válida: ${text.slice(0, 180)}`);
  }
}

async function request(endpoint, options = {}) {
  let lastError = null;

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
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
      }

      if (data && typeof data === "object") {
        data.httpStatus = response.status;
      }

      localStorage.setItem("api_base", base);
      return data;
    } catch (error) {
      lastError = error;
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
