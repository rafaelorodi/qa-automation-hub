import { test, expect } from '@playwright/test';

test.describe('Inicio de Sesión', () => {
  test.beforeEach(async ({ page }) => {
    // Ir a la página base definida en playwright.config.ts
    await page.goto('/');
  });

  test('debería mostrar el formulario de login', async ({ page }) => {
    // Verificar que los campos principales estén visibles
    await expect(page.locator('#login-user')).toBeVisible();
    await expect(page.locator('#login-pass')).toBeVisible();
    await expect(page.locator('#btn-login')).toBeVisible();
  });

  test('intento de login fallido con credenciales incorrectas', async ({ page }) => {
    await page.fill('#login-user', 'usuario_incorrecto');
    await page.fill('#login-pass', 'password_incorrecto');
    await page.click('#btn-login');

    // Aquí podrías agregar una aserción para el mensaje de error si conoces el selector
    // Por ejemplo:
    // await expect(page.locator('.error-message')).toBeVisible();
  });

  test('debería permitir el login con credenciales válidas', async ({ page }) => {
    const username = 'admin';
    const password = 'admin123';

    await page.fill('#login-user', username);
    await page.fill('#login-pass', password);
    await page.click('#btn-login');

    await page.waitForLoadState('networkidle');

    const dashboardTitle = page.getByTestId('dashboard-title');
    await expect(dashboardTitle).toBeVisible();
    
    await page.waitForTimeout(2000); 
    
    // ESTO ES LO QUE ARREGLA EL VIDEO:
    await page.context().close(); 
    await page.video()?.path(); // Forzamos a que Playwright espere a que el video se guarde en disco
  });
});
