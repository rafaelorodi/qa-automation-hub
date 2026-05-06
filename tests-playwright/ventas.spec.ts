import { test, expect } from '@playwright/test';

test.describe('Ventas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    await page.fill('#login-user', 'vendedor');
    await page.fill('#login-pass', '123');
    await page.click('#btn-login');

    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('vendedor-container')).toBeVisible();
  });

  test('debería mostrar la vista de ventas correctamente', async ({ page }) => {
    await expect(page.getByTestId('vendedor-grid')).toBeVisible();
    await expect(page.getByTestId('vendedor-search')).toBeVisible();
    await expect(page.getByTestId('vendedor-categories')).toBeVisible();
  });

  test('debería filtrar productos al usar el buscador', async ({ page }) => {
    const grid = page.getByTestId('vendedor-grid');
    await expect(grid).toBeVisible();

    // Obtener el nombre del primer producto disponible
    const primerProducto = grid.locator('.glass-card').first();
    const nombreProducto = await primerProducto.locator('h4').innerText();
    const palabraClave = nombreProducto.split(' ')[0];

    // Buscar por la primera palabra del nombre
    await page.getByTestId('vendedor-search').fill(palabraClave);
    await page.waitForTimeout(300); // esperar debounce del filtro

    // Todos los cards visibles deben contener la palabra buscada
    const cards = grid.locator('.glass-card');
    const cantidad = await cards.count();
    expect(cantidad).toBeGreaterThan(0);

    for (let i = 0; i < cantidad; i++) {
      const nombre = await cards.nth(i).locator('h4').innerText();
      expect(nombre.toLowerCase()).toContain(palabraClave.toLowerCase());
    }
  });

  test('debería realizar una venta exitosa', async ({ page }) => {
    const grid = page.getByTestId('vendedor-grid');

    // Buscar el primer producto con stock disponible
    const cardConStock = grid.locator('.glass-card').filter({ hasNotText: 'Sin Stock' }).first();
    await expect(cardConStock).toBeVisible();

    // Obtener el nombre y stock antes de vender
    const nombreProducto = await cardConStock.locator('h4').innerText();
    const stockTexto = await cardConStock.locator('.badge-green, .badge-red').innerText();
    const stockAntes = parseInt(stockTexto);

    // Click en la card para abrir el modal
    await cardConStock.click();
    await expect(page.getByTestId('sale-modal')).toBeVisible();

    // Vender 1 unidad
    await page.getByTestId('input-sale-amount').fill('1');
    await page.getByTestId('btn-confirm-sale').click();
    await page.waitForLoadState('networkidle');

    // El modal debe cerrarse
    await expect(page.getByTestId('sale-modal')).not.toBeVisible();

    // Esperar que el badge del producto refleje el nuevo stock (con timeout para el refresco del grid)
    const cardActualizada = grid.locator('.glass-card').filter({ hasText: nombreProducto }).first();
    const badgeActualizado = cardActualizada.locator('.badge-green, .badge-red');
    await expect(badgeActualizado).toHaveText(`${stockAntes - 1} disponibles`, { timeout: 5000 });
  });

  test('debería cancelar una venta sin modificar el stock', async ({ page }) => {
    const grid = page.getByTestId('vendedor-grid');

    const cardConStock = grid.locator('.glass-card').filter({ hasNotText: 'Sin Stock' }).first();
    await expect(cardConStock).toBeVisible();

    const stockTexto = await cardConStock.locator('.badge-green, .badge-red').innerText();
    const stockAntes = parseInt(stockTexto);

    // Abrir modal y cancelar
    await cardConStock.click();
    await expect(page.getByTestId('sale-modal')).toBeVisible();
    await page.getByTestId('btn-cancel-sale').click();

    // El modal debe cerrarse sin cambios
    await expect(page.getByTestId('sale-modal')).not.toBeVisible();

    // El stock no debe haber cambiado
    const stockTextoNuevo = await cardConStock.locator('.badge-green, .badge-red').innerText();
    expect(parseInt(stockTextoNuevo)).toBe(stockAntes);
  });

  test('no debería poder vender un producto sin stock', async ({ page }) => {
    const grid = page.getByTestId('vendedor-grid');

    // Buscar una card con "Sin Stock"
    const cardSinStock = grid.locator('.glass-card').filter({ hasText: 'Sin Stock' }).first();

    // Si no hay productos sin stock saltamos el test
    const hayCardSinStock = await cardSinStock.count();
    if (hayCardSinStock === 0) {
      test.skip();
      return;
    }

    // El botón debe estar deshabilitado y el click no debe abrir el modal
    await cardSinStock.click();
    await expect(page.getByTestId('sale-modal')).not.toBeVisible();
  });

  test('no debería permitir vender más unidades que el stock disponible', async ({ page }) => {
    const grid = page.getByTestId('vendedor-grid');

    const cardConStock = grid.locator('.glass-card').filter({ hasNotText: 'Sin Stock' }).first();
    await expect(cardConStock).toBeVisible();

    const stockTexto = await cardConStock.locator('.badge-green, .badge-red').innerText();
    const stockDisponible = parseInt(stockTexto);

    await cardConStock.click();
    await expect(page.getByTestId('sale-modal')).toBeVisible();

    // Intentar vender más unidades de las disponibles
    await page.getByTestId('input-sale-amount').fill(String(stockDisponible + 99));
    await page.getByTestId('btn-confirm-sale').click();
    await page.waitForLoadState('networkidle');

    // Debería mostrar un error y mantener el modal abierto
    await expect(page.getByTestId('sale-modal')).toBeVisible();
  });

  // BUG CONOCIDO: al ingresar 1.5 el sistema hace parseInt y descuenta 1 unidad en vez de rechazar el decimal.
  // Este test FALLA mientras el bug exista. Pasará cuando el sistema rechace correctamente los decimales.
  test.describe('bug decimal', () => {
    test.describe.configure({ retries: 0 });

    test('[BUG] no debería procesar una venta con cantidad decimal', async ({ page }) => {
      const grid = page.getByTestId('vendedor-grid');

      const cardConStock = grid.locator('.glass-card').filter({ hasNotText: 'Sin Stock' }).first();
      await expect(cardConStock).toBeVisible();

      await cardConStock.click();
      await expect(page.getByTestId('sale-modal')).toBeVisible();

      // Escuchar la request sin interceptarla (no rompe la llamada)
      let requestBody: any = null;
      page.on('request', request => {
        if (request.url().includes('/sell') && request.method() === 'POST') {
          requestBody = JSON.parse(request.postData() ?? '{}');
        }
      });

      // Inyectar '1.5' al onChange de React via fiber
      const inputAmount = page.getByTestId('input-sale-amount');
      await inputAmount.evaluate((el: HTMLInputElement) => {
        const reactKey = Object.keys(el).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
        if (!reactKey) throw new Error('React fiber no encontrado');
        let fiber = (el as any)[reactKey];
        while (fiber) {
          const onChange = fiber.memoizedProps?.onChange;
          if (onChange) {
            onChange({ target: { value: '1.5' }, currentTarget: { value: '1.5' } });
            break;
          }
          fiber = fiber.return;
        }
      });
      await page.waitForTimeout(300);

      await page.getByTestId('btn-confirm-sale').click();
      await page.waitForLoadState('networkidle');

      // COMPORTAMIENTO ESPERADO: requestBody null — el sistema no debería llamar a la API con un decimal
      // COMPORTAMIENTO ACTUAL (BUG): requestBody = {cantidad: 1} — el sistema trunca 1.5 → 1 y procesa la venta
      expect(requestBody, 'BUG: el sistema procesó la venta truncando el decimal 1.5 a 1').toBeNull();
    });
  });
});
