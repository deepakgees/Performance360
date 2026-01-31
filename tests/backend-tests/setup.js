/**
 * Setup script for backend tests
 * 
 * Ensures Prisma Client is generated before running tests
 * Generates Prisma Client in the backend directory (where the schema is)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 Setting up backend tests...\n');

// Check if backend directory exists
const backendPath = path.join(__dirname, '../../backend');
if (!fs.existsSync(backendPath)) {
  console.error('❌ Backend directory not found at:', backendPath);
  process.exit(1);
}

// Check if backend has Prisma schema
const schemaPath = path.join(backendPath, 'prisma/schema.prisma');
if (!fs.existsSync(schemaPath)) {
  console.error('❌ Prisma schema not found at:', schemaPath);
  process.exit(1);
}

// Check if backend node_modules exists
const backendNodeModules = path.join(backendPath, 'node_modules');
if (!fs.existsSync(backendNodeModules)) {
  console.log('⚠️  Backend node_modules not found. Installing backend dependencies...');
  try {
    execSync('npm install', { cwd: backendPath, stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Failed to install backend dependencies');
    console.error('   Run manually: cd backend && npm install');
    process.exit(1);
  }
}

// Generate Prisma Client in backend (where schema is)
console.log('📦 Generating Prisma Client in backend...');
try {
  execSync('npm run db:generate', { cwd: backendPath, stdio: 'inherit' });
  console.log('✅ Prisma Client generated successfully!\n');
} catch (error) {
  console.error('❌ Failed to generate Prisma Client');
  console.error('   Make sure DATABASE_URL is set in backend/.env');
  console.error('   Run manually: cd backend && npm run db:generate');
  process.exit(1);
}

// Note: Tests will use @prisma/client from their own node_modules
// but the generated client code will be in backend/node_modules/.prisma/client
// We need to ensure the tests can find it, or we need to generate it here too
// For now, let's also generate it in the tests directory
console.log('📦 Generating Prisma Client in tests directory...');
try {
  // Create prisma directory in tests
  const testPrismaDir = path.join(__dirname, 'prisma');
  if (!fs.existsSync(testPrismaDir)) {
    fs.mkdirSync(testPrismaDir, { recursive: true });
  }
  
  // Copy schema to tests directory
  const testSchemaPath = path.join(testPrismaDir, 'schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  fs.writeFileSync(testSchemaPath, schemaContent);
  
  // Generate Prisma Client in tests directory
  execSync('npx prisma generate', { cwd: __dirname, stdio: 'inherit' });
  console.log('✅ Prisma Client generated in tests directory!\n');
} catch (error) {
  console.warn('⚠️  Could not generate Prisma Client in tests directory');
  console.warn('   Tests may still work if backend Prisma Client is accessible');
}

console.log('✅ Setup complete!');
