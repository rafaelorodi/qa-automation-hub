import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests-playwright',
  
  fullyParallel: true,
  
  // Simplificado: Evita el error de sintaxis con "process"
  forbidOnly: false, 
  retries: 1,        
  workers: 1,

  reporter: [
    ['list'], 
    ['allure-playwright', { outputFolder: 'allure-results' }]
  ],

  use: {
    // Ajustado: 127.0.0.1 es más estricto y seguro que localhost para la red
    baseURL: 'http://192.168.18.9:5173',
    
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});