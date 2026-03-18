const API_BASE = "http://localhost:8000/api/";

function getUsuarioStorage() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch (error) {
    console.error("Error leyendo usuario de localStorage:", error);
    return null;
  }
}

function getUsuarioId() {
  const usuario = getUsuarioStorage();
  return usuario?.id ?? null;
}

async function request(endpoint, options = {}) {
  const response = await fetch(API_BASE + endpoint, options);

  let data;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error("La respuesta del servidor no es JSON válido.");
  }

  return data;
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
  const usuarioId = getUsuarioId();

  if (!usuarioId) {
    return {
      ok: false,
      mensaje: "No hay sesión activa. Inicia sesión nuevamente."
    };
  }

  const body = new URLSearchParams();
  body.append("usuario_id", usuarioId);
  body.append("grupo_id", grupoId);

  return await request("matricular_materia.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString()
  });
}