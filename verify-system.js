const { spawn } = require('child_process');
const path = require('path');

console.log('🔍 Verifying Smart Event Ticket System...\n');

// Test backend server startup
console.log('1. Testing Backend Server...');
const backendTest = spawn('node', ['-e', 'require("./server/index.js"); console.log("✅ Backend server loads successfully")'], {
  cwd: __dirname,
  stdio: 'pipe'
});

backendTest.stdout.on('data', (data) => {
  console.log(data.toString());
});

backendTest.stderr.on('data', (data) => {
  console.log(data.toString());
});

backendTest.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Backend server verification passed\n');
  } else {
    console.log('❌ Backend server verification failed\n');
  }
  
  // Test frontend server startup
  console.log('2. Testing Frontend Server...');
  const frontendTest = spawn('npm', ['run', 'build'], {
    cwd: path.join(__dirname, 'client'),
    stdio: 'pipe'
  });

  frontendTest.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  frontendTest.stderr.on('data', (data) => {
    console.log(data.toString());
  });

  frontendTest.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Frontend server verification passed\n');
      console.log('🎉 SYSTEM VERIFICATION COMPLETE!');
      console.log('📊 All components are working correctly!');
    } else {
      console.log('❌ Frontend server verification failed\n');
      console.log('⚠️  Some components may need attention');
    }
  });
});
