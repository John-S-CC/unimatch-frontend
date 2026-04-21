(function () {
  const form = document.getElementById('loginForm');
  const mensaje = document.getElementById('mensaje');

  function showMessage(texto, type) {
    mensaje.textContent = texto;
    mensaje.className = `msg show ${type}`;
    if (texto && typeof showToast === 'function' && type === 'error') {
      showToast(texto, 'error');
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('', '');

    const correo = document.getElementById('correo').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!correo || !password) {
      showMessage('Completa todos los campos.', 'error');
      return;
    }

    try {
      if (typeof showGlobalLoader === 'function') showGlobalLoader('Estamos validando tus credenciales institucionales.', 'Iniciando sesión');
      const data = await loginUsuario(correo, password);

      if (!data.ok) {
        showMessage(data.mensaje || 'No fue posible iniciar sesión.', 'error');
        return;
      }

      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      localStorage.setItem('token', data.token);
      showMessage('Inicio de sesión exitoso. Redirigiendo...', 'ok');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);
    } catch (error) {
      console.error(error);
      showMessage(error.message || 'Error de conexión con el servidor.', 'error');
    } finally {
      if (typeof hideGlobalLoader === 'function') hideGlobalLoader();
    }
  });
})();
