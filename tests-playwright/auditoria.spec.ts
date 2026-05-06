import { test, expect, Page } from '@playwright/test';

function randomProduct() {
  const nombres = ['Tornillo', 'Tuerca', 'Clavija', 'Perno', 'Arandela', 'Gancho', 'Bisagra', 'Cerrojo', 'Llave', 'Remache'];
  const categorias = ['Ferretería', 'Herramientas', 'Electricidad', 'Plomería', 'Construcción'];
  const descripciones = [
    'Material de alta resistencia',
    'Uso industrial',
    'Fabricación local',
    'Importado certificado',
    'Calidad premium',
  ];
  const nombre = nombres[Math.floor(Math.random() * nombres.length)];
  const sufijo = Math.floor(Math.random() * 9000) + 1000;
  return {
    nombre: `${nombre} ${sufijo}`,
    categoria: categorias[Math.floor(Math.random() * categorias.length)],
    descripcion: descripciones[Math.floor(Math.random() * descripciones.length)],
    precio: (Math.random() * 990 + 10).toFixed(2),
  };
}

async function loginAs(page: Page, username: string, password: string) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear()); // limpiar JWT del usuario anterior
  await page.goto('/');                            // recargar para mostrar el login
  await page.fill('#login-user', username);
  await page.fill('#login-pass', password);
  await page.click('#btn-login');
  await page.waitForLoadState('networkidle');
}

async function crearProducto(page: Page, producto: ReturnType<typeof randomProduct>) {
  await page.getByTestId('btn-new-product').click();
  await expect(page.getByTestId('form-product')).toBeVisible();
  await page.getByTestId('input-prod-name').fill(producto.nombre);
  await page.getByTestId('input-prod-category').fill(producto.categoria);
  await page.getByTestId('input-prod-desc').fill(producto.descripcion);
  await page.getByTestId('input-prod-price').fill(producto.precio);
  await page.getByTestId('input-prod-stock').fill('10');
  await page.getByTestId('btn-save-product').click();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(producto.nombre)).toBeVisible();

  const fila = page.locator('[data-testid^="product-row-"]').filter({ hasText: producto.nombre });
  const filaId = await fila.getAttribute('data-testid');
  return filaId?.replace('product-row-', '') ?? '';
}

// Configura el listener ANTES de llamar a loginAs para capturar la carga de movimientos
async function loginAsAuditoria(page: Page) {
  const movimientosCargados = page.waitForResponse(
    r => r.url().includes('/api/movements') && r.status() === 200,
    { timeout: 15000 }
  );
  await loginAs(page, 'auditoria', '123');
  await expect(page.getByTestId('auditoria-container')).toBeVisible();
  await movimientosCargados;
}

test.describe('Auditoría', () => {

  test('debería registrar los movimientos de depósito: aumentar, disminuir y eliminar', async ({ page }) => {
    const producto = randomProduct();

    // ── DEPÓSITO: crear, aumentar y disminuir ──────────────────────
    await loginAs(page, 'deposito', '123');
    await expect(page.getByTestId('dashboard-title')).toBeVisible();

    const productId = await crearProducto(page, producto);

    // Aumentar stock (+2) → ENTRADA
    await page.getByTestId(`btn-add-stock-${productId}`).click();
    await expect(page.getByTestId('modal-justification')).toBeVisible();
    await page.getByTestId('input-modal-amount').fill('2');
    await page.getByTestId('input-modal-justification').fill('PRUEBAS AUTOMATIZADAS AUMENTAR');
    await page.getByTestId('btn-modal-confirm').click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('modal-justification')).not.toBeVisible();

    // Disminuir stock (-3) → SALIDA
    await page.getByTestId(`btn-remove-stock-${productId}`).click();
    await expect(page.getByTestId('modal-justification')).toBeVisible();
    await page.getByTestId('input-modal-amount').fill('3');
    await page.getByTestId('input-modal-justification').fill('PRUEBAS AUTOMATIZADAS DISMINUIR');
    await page.getByTestId('btn-modal-confirm').click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('modal-justification')).not.toBeVisible();

    // ── AUDITORÍA: verificar ENTRADA y SALIDA (producto aún existe) ─
    await loginAsAuditoria(page);

    await page.getByTestId('input-filter-auditoria').fill(producto.nombre);
    await page.waitForTimeout(300);

    const tabla = page.getByTestId('auditoria-table');
    await expect(tabla).toBeVisible();

    // ENTRADA: viene de la creación inicial (stock 10) y del aumento (+2)
    // SALIDA: viene de la disminución (-3)
    await expect(tabla.getByText('ENTRADA').first()).toBeVisible();
    await expect(tabla.getByText('SALIDA').first()).toBeVisible();

    // ── DEPÓSITO: eliminar producto → ELIMINACION ──────────────────
    await loginAs(page, 'deposito', '123');
    await expect(page.getByTestId('dashboard-title')).toBeVisible();

    await page.getByTestId(`btn-delete-prod-${productId}`).click();
    await expect(page.getByTestId('modal-justification')).toBeVisible();
    await page.getByTestId('input-modal-justification').fill('Eliminación en prueba de auditoría');
    await page.getByTestId('btn-modal-confirm').click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('modal-justification')).not.toBeVisible();

    // ── AUDITORÍA: verificar ELIMINACION ──────────────────────────
    // Tras eliminar, el backend resuelve product_name como "Producto Eliminado"
    // porque el producto ya no existe en la tabla. Filtramos por ese texto.
    await loginAsAuditoria(page);

    await page.getByTestId('input-filter-auditoria').fill('Producto Eliminado');
    await page.waitForTimeout(300);

    const tablaFinal = page.getByTestId('auditoria-table');
    // El movimiento más reciente (primera fila, orden descendente) debe ser nuestro ELIMINACION
    const primeraFila = tablaFinal.locator('[data-testid^="audit-row-"]').first();
    await expect(primeraFila.getByText('ELIMINACION')).toBeVisible();
    await expect(primeraFila.getByText('deposito')).toBeVisible();
  });

  test('debería registrar los movimientos de ventas: 2 ventas', async ({ page }) => {
    const producto = randomProduct();

    // ── DEPÓSITO: crear producto ───────────────────────────────────
    await loginAs(page, 'deposito', '123');
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    await crearProducto(page, producto);

    // ── VENDEDOR: realizar 2 ventas ────────────────────────────────
    await loginAs(page, 'vendedor', '123');
    await expect(page.getByTestId('vendedor-container')).toBeVisible();

    await page.getByTestId('vendedor-search').fill(producto.nombre);
    await page.waitForTimeout(300);

    const cardProducto = page.getByTestId('vendedor-grid')
      .locator('.glass-card')
      .filter({ hasText: producto.nombre })
      .first();
    await expect(cardProducto).toBeVisible();

    // Venta 1
    await cardProducto.click();
    await expect(page.getByTestId('sale-modal')).toBeVisible();
    await page.getByTestId('input-sale-amount').fill('1');
    await page.getByTestId('btn-confirm-sale').click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('sale-modal')).not.toBeVisible();

    // Venta 2
    await cardProducto.click();
    await expect(page.getByTestId('sale-modal')).toBeVisible();
    await page.getByTestId('input-sale-amount').fill('1');
    await page.getByTestId('btn-confirm-sale').click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('sale-modal')).not.toBeVisible();

    // ── AUDITORÍA: verificar exactamente 2 VENTA para este producto ─
    await loginAsAuditoria(page);

    await page.getByTestId('input-filter-auditoria').fill(producto.nombre);
    await page.waitForTimeout(300);

    const tabla = page.getByTestId('auditoria-table');
    await expect(tabla).toBeVisible();

    // Exactamente 2 filas de tipo VENTA (la creación genera ENTRADA automáticamente,
    // pero solo verificamos las VENTA de este test)
    const filasVenta = tabla.locator('[data-testid^="audit-row-"]').filter({ hasText: 'VENTA' });
    await expect(filasVenta).toHaveCount(2);
  });

});
