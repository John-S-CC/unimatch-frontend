import { vi } from 'vitest';
import fs from 'fs';
import path from 'path';

export function loadScript(relativePath) {
  const fullPath = path.resolve(process.cwd(), relativePath);
  const code = fs.readFileSync(fullPath, 'utf8');
  window.eval(code);
}

export function resetDom(html = '') {
  document.body.innerHTML = html;
  localStorage.clear();
  sessionStorage.clear();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  delete window.UNIMATCH_API_BASE;
  delete window.API_BASE;
}
