/**
 * Development server startup script
 * Sets HOST=0.0.0.0 to allow network access from other machines
 */

const { spawn } = require('child_process');
const path = require('path');

// Set environment variables for network access
process.env.HOST = '0.0.0.0';
process.env.WDS_SOCKET_HOST = '0.0.0.0';

// Get the react-scripts path
const reactScriptsPath = path.join(
  __dirname,
  'node_modules',
  '.bin',
  'react-scripts'
);
const reactScripts =
  process.platform === 'win32' ? `${reactScriptsPath}.cmd` : reactScriptsPath;

// Spawn react-scripts start with the environment variables
const reactScriptsProcess = spawn(reactScripts, ['start'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
  env: {
    ...process.env,
    HOST: '0.0.0.0',
    WDS_SOCKET_HOST: '0.0.0.0',
  },
});

reactScriptsProcess.on('error', error => {
  console.error('Failed to start react-scripts:', error);
  process.exit(1);
});

reactScriptsProcess.on('exit', code => {
  process.exit(code || 0);
});
