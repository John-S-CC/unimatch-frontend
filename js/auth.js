function getUsuarioActual() {
  try {
    return JSON.parse(sessionStorage.getItem("usuario") || localStorage.getItem("usuario") || "null");
  } catch (error) {
    console.error("Error leyendo usuario actual:", error);
    return null;
  }
}

function esRolAdministrador(rol) {
  return ["admin", "administrador", "root"].includes(String(rol || "").toLowerCase());
}

function esAdministrador() {
  return esRolAdministrador(getUsuarioActual()?.rol);
}

function getHomeByRole() {
  return esAdministrador() ? "admin_dashboard.html" : "dashboard.html";
}

function limpiarSesion() {
  if (typeof clearSessionStorage === "function") {
    clearSessionStorage();
    return;
  }
  sessionStorage.removeItem("usuario");
  sessionStorage.removeItem("token");
  localStorage.removeItem("usuario");
  localStorage.removeItem("token");
}

function verificarSesion() {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");

  if (!token) {
    limpiarSesion();
    window.location.href = "index.html";
    return false;
  }

  return true;
}

async function sincronizarPerfilSeguro() {
  if (typeof obtenerPerfilUsuario !== "function") return getUsuarioActual();

  const perfil = await obtenerPerfilUsuario();
  const usuario = perfil?.usuario || perfil?.perfil || perfil?.data || perfil;

  if (usuario && usuario.rol) {
    sessionStorage.setItem("usuario", JSON.stringify(usuario));
    localStorage.removeItem("usuario");
    return usuario;
  }

  return getUsuarioActual();
}

function cerrarSesion() {
  limpiarSesion();
  window.location.href = "index.html";
}

function pintarUsuario(selector) {
  const usuario = getUsuarioActual();
  const nodo = document.querySelector(selector);

  if (usuario && nodo) {
    nodo.textContent = usuario.nombre || "Usuario";
  }
}
