import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Caminhos relativos para hospedagem estática (GitHub Pages / itch.io).
  base: './',
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
