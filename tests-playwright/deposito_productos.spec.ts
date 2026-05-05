import { test, expect } from '@playwright/test';

// Generador de datos aleatorios para productos
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
  const sufijo = Math.floor(Math.random() * 9000) + 1000; // 4 dígitos para unicidad

  return {
    nombre: `${nombre} ${sufijo}`,
    categoria: categorias[Math.floor(Math.random() * categorias.length)],
    descripcion: descripciones[Math.floor(Math.random() * descripciones.length)],
    precio: (Math.random() * 990 + 10).toFixed(2), // entre 10.00 y 1000.00
    stock: '10',
  };
}

test.describe('Depósito de Productos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    await page.fill('#login-user', 'deposito');
    await page.fill('#login-pass', '123');
    await page.click('#btn-login');

    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('dashboard-title')).toBeVisible();
  });

  async function crearProducto(page: any, producto: ReturnType<typeof randomProduct>) {
    await page.getByTestId('btn-new-product').click();
    await expect(page.getByTestId('form-product')).toBeVisible();
    await page.getByTestId('input-prod-name').fill(producto.nombre);
    await page.getByTestId('input-prod-category').fill(producto.categoria);
    await page.getByTestId('input-prod-desc').fill(producto.descripcion);
    await page.getByTestId('input-prod-price').fill(producto.precio);
    await page.getByTestId('input-prod-stock').fill(producto.stock);
    await page.getByTestId('btn-save-product').click();
    await page.waitForLoadState('networkidle');
  }

  test('debería agregar un nuevo producto con 10 unidades de stock', async ({ page }) => {
    const producto = randomProduct();

    // Abrir el formulario de nuevo producto
    await page.getByTestId('btn-new-product').click();
    await expect(page.getByTestId('form-product')).toBeVisible();

    // Completar el formulario con datos aleatorios
    await page.getByTestId('input-prod-name').fill(producto.nombre);
    await page.getByTestId('input-prod-category').fill(producto.categoria);
    await page.getByTestId('input-prod-desc').fill(producto.descripcion);
    await page.getByTestId('input-prod-price').fill(producto.precio);

    // Stock fijo en 10 unidades
    await page.getByTestId('input-prod-stock').fill(producto.stock);

    // Guardar el producto
    await page.getByTestId('btn-save-product').click();
    await page.waitForLoadState('networkidle');

    // Verificar que el producto aparece en la tabla
    await expect(page.getByTestId('products-table')).toBeVisible();
    await expect(page.getByText(producto.nombre)).toBeVisible();
  });

  async function obtenerProductId(page: any, nombreProducto: string): Promise<string> {
    const fila = page.locator('[data-testid^="product-row-"]').filter({ hasText: nombreProducto });
    const filaId = await fila.getAttribute('data-testid');
    return filaId?.replace('product-row-', '') ?? '';
  }

  test('debería aumentar el stock de un producto en 2 unidades', async ({ page }) => {
    const producto = randomProduct();
    await crearProducto(page, producto);

    const productId = await obtenerProductId(page, producto.nombre);
    await expect(page.getByTestId(`stock-value-${productId}`)).toHaveText('10');

    await page.getByTestId(`btn-add-stock-${productId}`).click();
    await expect(page.getByTestId('modal-justification')).toBeVisible();

    await page.getByTestId('input-modal-amount').fill('2');
    await page.getByTestId('input-modal-justification').fill('PRUEBAS AUTOMATIZADAS AUMENTAR');
    await page.getByTestId('btn-modal-confirm').click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('modal-justification')).not.toBeVisible();
    await expect(page.getByTestId(`stock-value-${productId}`)).toHaveText('12');
  });

  test('debería disminuir el stock de un producto en 2 unidades', async ({ page }) => {
    const producto = randomProduct();
    await crearProducto(page, producto);

    const productId = await obtenerProductId(page, producto.nombre);
    await expect(page.getByTestId(`stock-value-${productId}`)).toHaveText('10');

    await page.getByTestId(`btn-remove-stock-${productId}`).click();
    await expect(page.getByTestId('modal-justification')).toBeVisible();

    await page.getByTestId('input-modal-amount').fill('2');
    await page.getByTestId('input-modal-justification').fill('PRUEBAS AUTOMATIZADAS DISMINUIR');
    await page.getByTestId('btn-modal-confirm').click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('modal-justification')).not.toBeVisible();
    await expect(page.getByTestId(`stock-value-${productId}`)).toHaveText('8');
  });

  test('debería eliminar un producto existente', async ({ page }) => {
    const producto = randomProduct();

    // Crear el producto primero para tener uno conocido que eliminar
    await crearProducto(page, producto);
    await expect(page.getByText(producto.nombre)).toBeVisible();

    // Obtener la fila del producto para encontrar su ID y hacer click en eliminar
    const fila = page.locator('[data-testid^="product-row-"]').filter({ hasText: producto.nombre });
    const filaId = await fila.getAttribute('data-testid');
    const productId = filaId?.replace('product-row-', '');

    await page.getByTestId(`btn-delete-prod-${productId}`).click();

    // Confirmar en el modal de justificación
    await expect(page.getByTestId('modal-justification')).toBeVisible();
    await page.getByTestId('input-modal-justification').fill('Producto creado por test automatizado, eliminación de limpieza');
    await page.getByTestId('btn-modal-confirm').click();
    await page.waitForLoadState('networkidle');

    // Verificar que el producto ya no aparece en la tabla
    await expect(page.getByTestId('modal-justification')).not.toBeVisible();
    await expect(page.getByTestId('products-table').getByText(producto.nombre)).not.toBeVisible();
  });
});
