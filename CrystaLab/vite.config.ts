import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base: './' genera rutas relativas a los recursos. Combinado con el
// enrutamiento por hash (#/ruta), la app funciona en GitHub Pages sin
// importar el nombre del repositorio y sin errores 404 al recargar.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
