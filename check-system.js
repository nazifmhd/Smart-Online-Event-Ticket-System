const http = require('http');

console.log('🔍 Checking Smart Event Ticket System Status...\n');

// Check backend server
function checkBackend() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/events', (res) => {
      console.log('✅ Backend Server: Running on port 5000');
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log('❌ Backend Server: Not running or not accessible');
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      console.log('❌ Backend Server: Connection timeout');
      resolve(false);
    });
  });
}

// Check frontend server
function checkFrontend() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      console.log('✅ Frontend Server: Running on port 3000');
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log('❌ Frontend Server: Not running or not accessible');
      resolve(false);
    });
    
    req.setTimeout(3000, () => {
      console.log('❌ Frontend Server: Connection timeout');
      resolve(false);
    });
  });
}

async function checkSystem() {
  console.log('1. Checking Backend Server...');
  const backendStatus = await checkBackend();
  
  console.log('\n2. Checking Frontend Server...');
  const frontendStatus = await checkFrontend();
  
  console.log('\n📊 System Status Summary:');
  console.log(`   Backend: ${backendStatus ? '✅ Running' : '❌ Not Running'}`);
  console.log(`   Frontend: ${frontendStatus ? '✅ Running' : '❌ Not Running'}`);
  
  if (backendStatus && frontendStatus) {
    console.log('\n🎉 SYSTEM IS FULLY OPERATIONAL!');
    console.log('🌐 Access your system at: http://localhost:3000');
    console.log('📊 API available at: http://localhost:5000');
  } else {
    console.log('\n⚠️  Some services are not running.');
    console.log('💡 Try running: node start-system-memory.js');
  }
}

checkSystem();
