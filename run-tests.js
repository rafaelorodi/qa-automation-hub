#!/usr/bin/env node

/**
 * Script para ejecutar pruebas locales seleccionando historias de usuario
 * Uso: node run-tests.js [hu001|hu002|hu003|all] [playwright|karate|all]
 * 
 * Ejemplos:
 *   node run-tests.js hu001 playwright  -> Ejecuta solo HU001 en Playwright
 *   node run-tests.js all all           -> Ejecuta todas las HUs en todos los frameworks
 */

const { execSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const hu = args[0]?.toLowerCase() || 'hu001';
const framework = args[1]?.toLowerCase() || 'all';

const validHUs = ['hu001', 'hu002', 'hu003', 'all'];
const validFrameworks = ['playwright', 'karate', 'all'];

console.log('\n🧪 QA Automation Hub - Test Runner\n');

if (!validHUs.includes(hu)) {
  console.error(`❌ HU inválido. Usa: ${validHUs.join(' | ')}`);
  process.exit(1);
}

if (!validFrameworks.includes(framework)) {
  console.error(`❌ Framework inválido. Usa: ${validFrameworks.join(' | ')}`);
  process.exit(1);
}

const getHUs = (input) => {
  if (input === 'all') return ['hu001', 'hu002', 'hu003'];
  return [input];
};

const getFrameworks = (input) => {
  if (input === 'all') return ['playwright', 'karate'];
  return [input];
};

const hus = getHUs(hu);
const frameworks_list = getFrameworks(framework);

console.log(`📋 HUs a ejecutar: ${hus.map(h => h.toUpperCase()).join(', ')}`);
console.log(`🛠️  Frameworks: ${frameworks_list.join(', ')}\n`);

try {
  if (frameworks_list.includes('playwright')) {
    console.log('🎭 Ejecutando Playwright tests...\n');
    hus.forEach(hu_item => {
      const cmd = `npx playwright test tests-playwright/${hu_item.toUpperCase()}_*`;
      console.log(`   → ${cmd}`);
      execSync(cmd, { stdio: 'inherit' });
    });
  }

  if (frameworks_list.includes('karate')) {
    console.log('\n🥋 Ejecutando Karate tests...\n');
    hus.forEach(hu_item => {
      const cmd = `npx karate tests-karate/${hu_item.toUpperCase()}_*/`;
      console.log(`   → ${cmd}`);
      try {
        execSync(cmd, { stdio: 'inherit' });
      } catch (e) {
        console.warn(`   ⚠️  Karate HU no encontrado o error en ejecución`);
      }
    });
  }

  console.log('\n✅ Pruebas completadas\n');
} catch (error) {
  console.error('\n❌ Error durante la ejecución de pruebas:', error.message);
  process.exit(1);
}
