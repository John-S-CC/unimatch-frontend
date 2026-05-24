import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadScript, resetDom } from './test-utils.js';

function setupLoginDom() {
  resetDom(`
    <form id="loginForm">
      <input id="correo" />
      <input id="password" />
      <button type="submit">Entrar</button>
    </form>
    <div id="mensaje"></div>
  `);
  delete window.location;
  window.location = { href: '' };
  window.showToast = vi.fn();
  window.showGlobalLoader = vi.fn();
  window.hideGlobalLoader = vi.fn();
  window.getHomeByRole = vi.fn(() => 'dashboard.html');
}

beforeEach(setupLoginDom);

describe('login.js', () => {
  it('valida campos obligatorios', async () => {
    loadScript('js/login.js');
    document.querySelector('#loginForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelector('#mensaje').textContent).toBe('Completa todos los campos.');
  });

  it('valida correo institucional', async () => {
    document.querySelector('#correo').value = 'ana@gmail.com';
    document.querySelector('#password').value = 'Clave123';
    loadScript('js/login.js');
    document.querySelector('#loginForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(document.querySelector('#mensaje').textContent).toContain('@unimatch.edu.co');
  });

  it('guarda sesión cuando login es exitoso', async () => {
    vi.useFakeTimers();
    document.querySelector('#correo').value = 'ana@unimatch.edu.co';
    document.querySelector('#password').value = 'Clave123';
    window.loginUsuario = vi.fn().mockResolvedValue({ ok: true, usuario: { rol: 'estudiante' }, token: 'tok' });

    loadScript('js/login.js');
    document.querySelector('#loginForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    await Promise.resolve();

    expect(sessionStorage.getItem('token')).toBe('tok');
    expect(document.querySelector('#mensaje').textContent).toContain('Inicio de sesión exitoso');
    vi.runAllTimers();
    expect(window.location.href).toBe('dashboard.html');
    vi.useRealTimers();
  });

  it('muestra mensaje de error si API rechaza login', async () => {
    document.querySelector('#correo').value = 'ana@unimatch.edu.co';
    document.querySelector('#password').value = 'Clave123';
    window.loginUsuario = vi.fn().mockResolvedValue({ ok: false, mensaje: 'Credenciales incorrectas' });

    loadScript('js/login.js');
    document.querySelector('#loginForm').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await Promise.resolve();
    await Promise.resolve();

    expect(document.querySelector('#mensaje').textContent).toBe('Credenciales incorrectas');
  });
});
