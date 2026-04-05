const API_CANDIDATES = [
  window.API_BASE,
  localStorage.getItem("api_base"),
  "http://localhost:8000/api/",
  "http://localhost:8000/unimatch-backend/api/"
].filter(Boolean);

const API_BASE = API_CANDIDATES[0];

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

async function request(endpoint, options = {}) {
  let lastError = null;

  for (const base of API_CANDIDATES) {
    try {
      const headers = {
        ...(options.headers || {})
      };

      const token = getToken();
      if (token) {
        headers["Authorization"] = "Bearer " + token;
      }

      const response = await fetch(base + endpoint, {
        ...options,
        headers
      });

      const text = await response.text();
      const data = JSON.parse(text);

      if (!response.ok && data && !data.ok) {
        return data;
      }

      localStorage.setItem("api_base", base);
      return data;
    } catch (error) {
      lastError = error;
    }
  }

  console.error("No fue posible conectar con ninguna API candidata.", lastError);
  throw new Error("No fue posible conectar con la API.");
}

async function loginUsuario(correo, password) {
  return await request("login.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ correo, password })
  });
}

async function listarMaterias() {
  return await request("listar_materias.php", {
    method: "GET"
  });
}

async function matricularMateria(grupoId) {
  const body = new URLSearchParams();
  body.append("grupo_id", grupoId);

  return await request("matricular_materia.php", {
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

  return await request("cancelar_materia.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });
}

async function crearSolicitud(payload) {
  const body = new URLSearchParams();

  Object.keys(payload).forEach((key) => {
    if (payload[key] !== null && payload[key] !== undefined && payload[key] !== "") {
      body.append(key, payload[key]);
    }
  });

  return await request("crear_solicitud.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });
}

async function listarSolicitudes() {
  return await request("listar_solicitudes.php", {
    method: "GET"
  });
}
async function obtenerOpcionesSolicitud() {
  return await request("opciones_solicitud.php", {
    method: "GET"
  });
}
async function obtenerMisMaterias() {
  return await request("mis_materias.php", {
    method: "GET"
  });
}