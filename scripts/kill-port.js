#!/usr/bin/env node

/**
 * Cross-platform script to kill a process running on a specific port
 */

const { exec } = require('child_process');
const os = require('os');

const port = process.argv[2] || '3001';
const platform = os.platform();

console.log(`Killing process on port ${port}...`);

if (platform === 'win32') {
  // Windows: Find PID using netstat and kill using taskkill
  const findPidCommand = `netstat -ano | findstr ":${port} "`;
  
  exec(findPidCommand, (error, stdout, stderr) => {
    if (error || !stdout) {
      console.log(`No process found on port ${port}`);
      process.exit(0);
      return;
    }

    // Extract PIDs from netstat output
    const lines = stdout.trim().split('\n');
    const pids = new Set();
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          pids.add(pid);
        }
      }
    });

    if (pids.size === 0) {
      console.log(`No process found on port ${port}`);
      process.exit(0);
      return;
    }

    // Kill each process
    let killedCount = 0;
    const killPromises = Array.from(pids).map(pid => {
      return new Promise((resolve) => {
        exec(`taskkill /PID ${pid} /F`, (killError) => {
          if (!killError) {
            killedCount++;
            console.log(`Killed process ${pid}`);
          }
          resolve();
        });
      });
    });

    Promise.all(killPromises).then(() => {
      if (killedCount > 0) {
        console.log(`Successfully killed ${killedCount} process(es) on port ${port}`);
      }
      process.exit(0);
    });
  });
} else {
  // Unix-like: Find PID using lsof and kill using kill
  const command = `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      // It's okay if no process is found
      if (error.code === 1) {
        console.log(`No process found on port ${port}`);
        process.exit(0);
      } else {
        console.error(`Error killing port ${port}:`, error.message);
        process.exit(1);
      }
    } else {
      if (stdout) {
        console.log(`Successfully killed process on port ${port}`);
      } else {
        console.log(`No process found on port ${port}`);
      }
      process.exit(0);
    }
  });
}

