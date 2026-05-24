import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadScript, resetDom } from './test-utils.js';

beforeEach(() => {
  resetDom();
  loadScript('js/api.js');
});

describe('api.js', () => {
  it('normaliza bases de API y elimina login.php duplicado', () => {
    expect(window.normalizeBase(' http://localhost:8000/api/login.php ')).toBe('http://localhost:8000/api/');
    expect(window.normalizeBase('http://localhost:8000/api')).toBe('http://localhost:8000/api/');
    expect(window.normalizeBase(null)).toBeNull();
  });

  it('construye candidatos únicos desde window, localStorage y render', () => {
    window.UNIMATCH_API_BASE = 'http://localhost:8000/api/login.php';
    window.API_BASE = 'http://localhost:8000/api/';
    localStorage.setItem('api_base', 'http://localhost:8000/api/');

    expect(window.buildApiCandidates()).toEqual([
      'http://localhost:8000/api/',
      'https://unimatch-backend-fid5.onrender.com/api/'
    ]);
  });

  it('lee usuario válido y retorna null si el JSON está dañado', () => {
    sessionStorage.setItem('usuario', JSON.stringify({ id: 1, rol: 'admin' }));
    expect(window.getUsuarioStorage()).toEqual({ id: 1, rol: 'admin' });

    sessionStorage.setItem('usuario', '{mal-json');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(window.getUsuarioStorage()).toBeNull();
  });

  it('envía token Authorization, parsea JSON y guarda api_base', async () => {
    window.UNIMATCH_API_BASE = 'http://localhost:8000/api/';
    sessionStorage.setItem('token', 'abc123');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true, usuario: { id: 1 } })
    });

    const data = await window.loginUsuario('ana@unimatch.edu.co', 'Clave123');

    expect(data.ok).toBe(true);
    expect(data.httpStatus).toBe(200);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/login.php',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer abc123' })
      })
    );
    expect(localStorage.getItem('api_base')).toBe('http://localhost:8000/api/');
  });

  it('intenta otra base cuando la primera falla', async () => {
    window.UNIMATCH_API_BASE = 'http://mala.test/api/';
    window.API_BASE = 'http://buena.test/api/';
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    globalThis.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => JSON.stringify({ ok: true }) });

    const data = await window.listarMaterias();

    expect(data.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('api_base')).toBe('http://buena.test/api/');
  });

  it('lanza error si la respuesta viene vacía, inválida o con ok false', async () => {
    window.UNIMATCH_API_BASE = 'http://localhost/api/';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    await expect(window.listarMaterias()).rejects.toThrow('Respuesta vacía');

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => '<html>Error</html>' });
    await expect(window.listarMaterias()).rejects.toThrow('respuesta no válida');

    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => JSON.stringify({ mensaje: 'Error personalizado' }) });
    await expect(window.listarMaterias()).rejects.toThrow('Error personalizado');
  });

  it('arma correctamente endpoints GET y POST principales', async () => {
    window.UNIMATCH_API_BASE = 'http://localhost/api/';
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, text: async () => JSON.stringify({ ok: true }) });

    await window.matricularMateria(1001);
    await window.cancelarMateria(1002);
    await window.crearSolicitud({ origen: 1, destino: 2, vacio: '' });
    await window.obtenerDetalleTurno('T 1');
    await window.actualizarEstadoTurno(3, 'aprobado');
    await window.actualizarConfiguracionAcademica({ fecha_inicio: '2026-01-01', omitido: null });

    expect(fetch.mock.calls.map(call => call[0])).toEqual([
      'http://localhost/api/matricular_materia.php',
      'http://localhost/api/cancelar_materia.php',
      'http://localhost/api/crear_solicitud.php',
      'http://localhost/api/detalle_turno.php?id_turno=T%201',
      'http://localhost/api/actualizar_turno.php',
      'http://localhost/api/admin_configuracion_academica.php'
    ]);
    expect(fetch.mock.calls[0][1].body).toBe('grupo_id=1001');
    expect(fetch.mock.calls[2][1].body).toBe('origen=1&destino=2');
  });
});
