(function () {
  const form = document.getElementById('forgotForm');
  const mensaje = document.getElementById('mensaje');

  function showMessage(texto, type) {
    mensaje.textContent = texto;
    mensaje.className = `msg show ${type}`;
    if (texto && typeof showToast === 'function') {
      showToast(texto, type === 'ok' ? 'success' : 'error');
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('', '');

    const correo = document.getElementById('correo').value.trim().toLowerCase();

    if (!correo) {
      showMessage('Escribe tu correo institucional.', 'error');
      return;
    }

    if (!correo.endsWith('@unimatch.edu.co')) {
      showMessage('El correo debe terminar en @unimatch.edu.co.', 'error');
      return;
    }

    try {
      if (typeof showGlobalLoader === 'function') showGlobalLoader('Estamos validando el correo institucional.', 'Recuperación');
      const data = await solicitarRecuperacionPassword(correo);
      showMessage(data.mensaje || 'Si el correo está registrado, enviaremos un enlace de recuperación.', 'ok');
      form.reset();
    } catch (error) {
      showMessage(error.message || 'No fue posible solicitar la recuperación.', 'error');
    } finally {
      if (typeof hideGlobalLoader === 'function') hideGlobalLoader();
    }
  });
})();
