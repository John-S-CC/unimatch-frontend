function getUsuarioActual() {
  try {
    return JSON.parse(localStorage.getItem("usuario") || "null");
  } catch (error) {
    console.error("Error leyendo usuario actual:", error);
    return null;
  }
}

function limpiarSesion() {
  localStorage.removeItem("usuario");
  localStorage.removeItem("token");
}

function verificarSesion() {
  const token = localStorage.getItem("token");

  if (!token) {
    limpiarSesion();
    window.location.href = "index.html";
    return false;
  }

  return true;
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
