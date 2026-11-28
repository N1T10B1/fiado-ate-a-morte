import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CORE = join(import.meta.dirname, '..', 'src', 'core');
const FORBIDDEN = [
  /Math\.random/,
  /Date\.now|new Date\b|performance\.now/,
  /\b(window|document|localStorage|sessionStorage|navigator|requestAnimationFrame|setTimeout|setInterval)\b/,
  /from\s+['"](vite|vitest|node:)/,
  /AudioContext/,
];

describe('pureza do core', () => {
  const files = readdirSync(CORE).filter((f) => f.endsWith('.ts'));

  it('há arquivos de core para verificar', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s não usa aleatoriedade global, relógio, DOM, áudio ou ferramentas de build', (f) => {
    const src = readFileSync(join(CORE, f), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    for (const re of FORBIDDEN) expect(src, `${f} contém ${re}`).not.toMatch(re);
  });

  it('core só importa módulos relativos do próprio core', () => {
    for (const f of files) {
      const src = readFileSync(join(CORE, f), 'utf8');
      for (const m of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) expect(m[1]).toMatch(/^\.\/[\w-]+$/);
    }
  });
});
