/**
 * Wrapper script to start serve for PM2 on Windows
 * This script is needed because PM2 on Windows has issues with .cmd files
 */

const { spawn } = require('child_process');
const path = require('path');

// Get the serve command from node_modules
const servePath = path.join(__dirname, 'node_modules', '.bin', 'serve');
const serveScript = process.platform === 'win32' ? `${servePath}.cmd` : servePath;

// Spawn the serve process
const serve = spawn(serveScript, ['-s', 'build', '-l', '3000'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

serve.on('error', (error) => {
  console.error('Failed to start serve:', error);
  process.exit(1);
});

serve.on('exit', (code) => {
  process.exit(code || 0);
});

// Handle process termination
process.on('SIGTERM', () => {
  serve.kill('SIGTERM');
});

process.on('SIGINT', () => {
  serve.kill('SIGINT');
});

