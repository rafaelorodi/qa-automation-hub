import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Carpeta donde tenés tus archivos de prueba (.spec.ts)
  testDir: './tests-playwright', 
  
  /* Reportero de Allure - ESTO ES LO QUE NECESITAMOS */
  reporter: [
    ['list'], // Para ver el progreso en la consola
    ['allure-playwright', { outputFolder: 'allure-results' }]
  ],

  use: {
    // Para que si falla, te saque una foto de la pantalla automáticamente
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});