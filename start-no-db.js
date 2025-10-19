const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Smart Event Ticket System (No Database Version)...\n');

// Set environment variables for development without database
process.env.MONGODB_URI = 'mongodb://localhost:27017/smart-event-tickets';
process.env.NODE_ENV = 'development';
process.env.JWT_SECRET = 'your-super-secret-jwt-key-for-development';
process.env.CLIENT_URL = 'http://localhost:3000';

console.log('📡 Starting Backend Server...');
console.log('🔧 Using local MongoDB (will show connection error but continue)');

const backend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    MONGODB_URI: 'mongodb://localhost:27017/smart-event-tickets',
    NODE_ENV: 'development'
  }
});

// Wait for backend to start
setTimeout(() => {
  console.log('\n🌐 Starting Frontend Server...');
  const frontend = spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'client'),
    stdio: 'inherit',
    shell: true
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

}, 5000);

console.log('\n✅ System startup initiated!');
console.log('📊 Backend: http://localhost:5000');
console.log('🌐 Frontend: http://localhost:3000');
console.log('\n⚠️  Note: Backend will show MongoDB connection error');
console.log('   Frontend will still work for UI testing');
console.log('\nPress Ctrl+C to stop both servers');
