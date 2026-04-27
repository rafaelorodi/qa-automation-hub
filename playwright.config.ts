import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests-playwright',
  fullyParallel: true,
  forbidOnly: false,
  retries: 1,
  workers: 1, 

  reporter: [
    ['list'],
    ['allure-playwright', { outputFolder: 'allure-results' }]
  ],

  use: {
    baseURL: 'http://192.168.18.9:5173',
    screenshot: 'on',
    video: {
      mode: 'on',
      size: { width: 640, height: 480 }, // Resolución baja = menos esfuerzo para la Raspberry
    },
    trace: 'on', // Activamos trazas para ayudar al reporte
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});