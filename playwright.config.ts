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
    
    video: 'on',
    
    trace: 'on-first-retry',
    
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});