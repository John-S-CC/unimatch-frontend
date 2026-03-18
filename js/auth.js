function cerrarSesion() {
  localStorage.removeItem("usuario");
  window.location.href = "index.html";
}
function verificarSesion() {
  const usuario = localStorage.getItem("usuario");

  if (!usuario) {
    window.location.href = "index.html";
  }
}