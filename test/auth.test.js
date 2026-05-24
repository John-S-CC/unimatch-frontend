import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadScript, resetDom } from './test-utils.js';

beforeEach(() => {
  resetDom('<span id="nombre"></span>');
  delete window.location;
  window.location = { href: '' };
  loadScript('js/auth.js');
});

describe('auth.js', () => {
  it('identifica roles administradores', () => {
    expect(window.esRolAdministrador('admin')).toBe(true);
    expect(window.esRolAdministrador('administrador')).toBe(true);
    expect(window.esRolAdministrador('root')).toBe(true);
    expect(window.esRolAdministrador('estudiante')).toBe(false);
  });

  it('retorna home según rol', () => {
    sessionStorage.setItem('usuario', JSON.stringify({ rol: 'admin' }));
    expect(window.getHomeByRole()).toBe('admin_dashboard.html');

    sessionStorage.setItem('usuario', JSON.stringify({ rol: 'estudiante' }));
    expect(window.getHomeByRole()).toBe('dashboard.html');
  });

  it('limpia sesión con clearSessionStorage si existe', () => {
    window.clearSessionStorage = vi.fn();
    window.limpiarSesion();
    expect(window.clearSessionStorage).toHaveBeenCalled();
  });

  it('limpia storages y redirige si no hay token', () => {
    sessionStorage.setItem('usuario', '{}');
    localStorage.setItem('token', 'viejo');
    localStorage.removeItem('token');

    expect(window.verificarSesion()).toBe(false);
    expect(sessionStorage.getItem('usuario')).toBeNull();
    expect(window.location.href).toBe('index.html');
  });

  it('verifica sesión si existe token', () => {
    sessionStorage.setItem('token', 'token-ok');
    expect(window.verificarSesion()).toBe(true);
  });

  it('sincroniza perfil cuando la API devuelve usuario', async () => {
    window.obtenerPerfilUsuario = vi.fn().mockResolvedValue({ usuario: { nombre: 'Ana', rol: 'admin' } });
    const usuario = await window.sincronizarPerfilSeguro();
    expect(usuario).toEqual({ nombre: 'Ana', rol: 'admin' });
    expect(JSON.parse(sessionStorage.getItem('usuario')).nombre).toBe('Ana');
  });

  it('pinta el nombre de usuario en el DOM y cierra sesión', () => {
    sessionStorage.setItem('usuario', JSON.stringify({ nombre: 'Ana' }));
    window.pintarUsuario('#nombre');
    expect(document.querySelector('#nombre').textContent).toBe('Ana');

    window.cerrarSesion();
    expect(window.location.href).toBe('index.html');
  });
});
