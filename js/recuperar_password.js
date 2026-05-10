(function () {
  const form = document.getElementById('resetForm');
  const mensaje = document.getElementById('mensaje');
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';

  function showMessage(texto, type) {
    mensaje.textContent = texto;
    mensaje.className = `msg show ${type}`;
    if (texto && typeof showToast === 'function') {
      showToast(texto, type === 'ok' ? 'success' : 'error');
    }
  }

  function passwordValida(password) {
    return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
  }

  if (!token) {
    showMessage('El enlace de recuperación no contiene un token válido.', 'error');
    form.querySelector('button[type="submit"]').disabled = true;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('', '');

    const password = document.getElementById('password').value;
    const confirmacion = document.getElementById('confirmacion').value;

    if (!password || !confirmacion) {
      showMessage('Completa ambos campos.', 'error');
      return;
    }

    if (password !== confirmacion) {
      showMessage('Las contraseñas no coinciden.', 'error');
      return;
    }

    if (!passwordValida(password)) {
      showMessage('La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número.', 'error');
      return;
    }

    try {
      if (typeof showGlobalLoader === 'function') showGlobalLoader('Estamos actualizando tu contraseña.', 'Seguridad');
      const data = await restablecerPassword(token, password, confirmacion);
      showMessage(data.mensaje || 'Contraseña actualizada correctamente.', 'ok');
      form.reset();
      setTimeout(() => { window.location.href = 'index.html'; }, 1200);
    } catch (error) {
      showMessage(error.message || 'No fue posible actualizar la contraseña.', 'error');
    } finally {
      if (typeof hideGlobalLoader === 'function') hideGlobalLoader();
    }
  });
})();
