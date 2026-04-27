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
    // Nota: Estos valores deberían ser configurados o pasados como variables de entorno
    const username = 'admin'; // Ejemplo
    const password = '123'; // Ejemplo

    await page.fill('#login-user', username);
    await page.fill('#login-pass', password);
    await page.click('#btn-login');

    // 1. Verificar el título usando el data-testid
    const dashboardTitle = page.getByTestId('dashboard-title');
    await expect(dashboardTitle).toBeVisible();
    await expect(dashboardTitle).toHaveText(/Terminal de Punto de Venta/);

    // 2. Verificar el badge de VENDEDOR
    // Usamos filter para asegurar que el span tenga exactamente ese texto
    const roleBadge = page.locator('span.badge').filter({ hasText: 'VENDEDOR' });
    await expect(roleBadge).toBeVisible();
  });
});
