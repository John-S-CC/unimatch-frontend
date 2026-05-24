import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadScript, resetDom } from './test-utils.js';

describe('olvidaste_password.js', () => {
  beforeEach(() => {
    resetDom('<form id="forgotForm"><input id="correo" /></form><div id="mensaje"></div>');
    window.showToast = vi.fn();
    window.showGlobalLoader = vi.fn();
    window.hideGlobalLoader = vi.fn();
  });

  it('valida correo vacío e institucional', () => {
    loadScript('js/olvidaste_password.js');
    document.querySelector('#forgotForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelector('#mensaje').textContent).toBe('Escribe tu correo institucional.');

    document.querySelector('#correo').value = 'ana@gmail.com';
    document.querySelector('#forgotForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelector('#mensaje').textContent).toContain('@unimatch.edu.co');
  });

  it('solicita recuperación correctamente', async () => {
    document.querySelector('#correo').value = 'ANA@UNIMATCH.EDU.CO';
    window.solicitarRecuperacionPassword = vi.fn().mockResolvedValue({ mensaje: 'Correo enviado' });
    loadScript('js/olvidaste_password.js');
    document.querySelector('#forgotForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    await Promise.resolve();
    expect(window.solicitarRecuperacionPassword).toHaveBeenCalledWith('ana@unimatch.edu.co');
    expect(document.querySelector('#mensaje').textContent).toBe('Correo enviado');
  });
});

describe('recuperar_password.js', () => {
  beforeEach(() => {
    resetDom(`
      <form id="resetForm">
        <input id="password" />
        <input id="confirmacion" />
        <button type="submit">Enviar</button>
      </form>
      <div id="mensaje"></div>
    `);
    delete window.location;
    window.location = { href: '', search: '?token=abc' };
    window.showToast = vi.fn();
    window.showGlobalLoader = vi.fn();
    window.hideGlobalLoader = vi.fn();
  });

  it('bloquea formulario si no hay token', () => {
    window.location.search = '';
    loadScript('js/recuperar_password.js');
    expect(document.querySelector('#mensaje').textContent).toContain('token válido');
    expect(document.querySelector('button').disabled).toBe(true);
  });

  it('valida coincidencia y fortaleza de contraseña', () => {
    loadScript('js/recuperar_password.js');
    document.querySelector('#password').value = 'Clave123';
    document.querySelector('#confirmacion').value = 'Otra1234';
    document.querySelector('#resetForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelector('#mensaje').textContent).toBe('Las contraseñas no coinciden.');

    document.querySelector('#confirmacion').value = 'Clave123';
    document.querySelector('#resetForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelector('#mensaje').textContent).toContain('mínimo 8 caracteres');
  });

  it('restablece contraseña y redirige', async () => {
    vi.useFakeTimers();
    document.querySelector('#password').value = 'Clave1234';
    document.querySelector('#confirmacion').value = 'Clave1234';
    window.restablecerPassword = vi.fn().mockResolvedValue({ mensaje: 'Contraseña actualizada' });
    loadScript('js/recuperar_password.js');
    document.querySelector('#resetForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    await Promise.resolve();
    expect(window.restablecerPassword).toHaveBeenCalledWith('abc', 'Clave1234', 'Clave1234');
    expect(document.querySelector('#mensaje').textContent).toBe('Contraseña actualizada');
    vi.runAllTimers();
    expect(window.location.href).toBe('index.html');
    vi.useRealTimers();
  });
});
