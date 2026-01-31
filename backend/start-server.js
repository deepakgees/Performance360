const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting the backend server with comprehensive logging...');
console.log('📝 All API requests will be logged to backend/logs/');
console.log('📅 Log files are date-based (YYYY-MM-DD.log)');
console.log('👤 User information is included in all log entries');
console.log('');

// Start the server
const server = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  cwd: path.join(__dirname),
});

server.on('error', error => {
  console.error('❌ Failed to start server:', error);
});

server.on('close', code => {
  console.log(`\n🛑 Server stopped with code ${code}`);
});

console.log('✅ Server started! Make API requests to see logging in action.');
console.log('🌐 Server URL: http://localhost:3001');
console.log('📊 Health check: http://localhost:3001/health');
console.log('');
console.log('💡 Try making requests to see user-tagged logging:');
console.log('   - Login: POST http://localhost:3001/api/auth/login');
console.log('   - Get users: GET http://localhost:3001/api/users');
console.log(
  '   - Get direct reports: GET http://localhost:3001/api/users/direct-reports'
);
console.log('');
console.log('📁 Check logs at: backend/logs/');
