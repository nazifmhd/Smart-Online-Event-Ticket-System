const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Smart Event Ticket System Setup...\n');

let allGood = true;
const checks = [];

// Function to check if file/directory exists
function checkExists(name, pathToCheck, isRequired = true) {
  const exists = fs.existsSync(pathToCheck);
  const status = exists ? '✅' : (isRequired ? '❌' : '⚠️');
  const message = exists ? 'Found' : (isRequired ? 'Missing (Required)' : 'Missing (Optional)');
  
  checks.push({ name, status, message, path: pathToCheck, required: isRequired });
  
  if (isRequired && !exists) {
    allGood = false;
  }
  
  return exists;
}

// Check root package.json
console.log('📦 Checking Root Configuration...');
checkExists('Root package.json', './package.json');
checkExists('Test runner', './test-runner.js');
checkExists('Startup script', './start-simple.js');
checkExists('README.md', './README.md');

// Check server files
console.log('\n🔧 Checking Backend Server...');
checkExists('Server package.json', './server/package.json');
checkExists('Server index.js', './server/index.js');
checkExists('Server .env (optional)', './server/.env', false);
checkExists('Server env.example', './server/env.example');

// Check server dependencies
checkExists('Server node_modules', './server/node_modules');
checkExists('Server models directory', './server/models');
checkExists('Server routes directory', './server/routes');
checkExists('Server middleware', './server/middleware/auth.js');
checkExists('Server utils', './server/utils');

// Check specific server files
checkExists('User model', './server/models/User.js');
checkExists('Event model', './server/models/Event.js');
checkExists('Ticket model', './server/models/Ticket.js');
checkExists('Payment model', './server/models/Payment.js');
checkExists('Auth routes', './server/routes/auth.js');
checkExists('Events routes', './server/routes/events.js');
checkExists('Tickets routes', './server/routes/tickets.js');
checkExists('Payments routes', './server/routes/payments.js');
checkExists('Admin routes', './server/routes/admin.js');

// Check client files
console.log('\n🌐 Checking Frontend Client...');
checkExists('Client package.json', './client/package.json');
checkExists('Client src directory', './client/src');
checkExists('Client public directory', './client/public');
checkExists('Client node_modules', './client/node_modules');

// Check client source files
checkExists('Client App.js', './client/src/App.js');
checkExists('Client index.js', './client/src/index.js');
checkExists('Client AuthContext', './client/src/contexts/AuthContext.js');
checkExists('Client API service', './client/src/services/api.js');

// Check client components
checkExists('Client components', './client/src/components');
checkExists('Client pages', './client/src/pages');
checkExists('Layout component', './client/src/components/Layout.js');
checkExists('ProtectedRoute component', './client/src/components/ProtectedRoute.js');

// Check essential pages
checkExists('Home page', './client/src/pages/Home.js');
checkExists('Login page', './client/src/pages/Login.js');
checkExists('Register page', './client/src/pages/Register.js');
checkExists('Dashboard page', './client/src/pages/Dashboard.js');
checkExists('AdminDashboard page', './client/src/pages/AdminDashboard.js');

// Display results
console.log('\n' + '='.repeat(70));
console.log('📊 Setup Verification Results');
console.log('='.repeat(70) + '\n');

checks.forEach(check => {
  console.log(`${check.status} ${check.name.padEnd(35)} - ${check.message}`);
});

console.log('\n' + '='.repeat(70));

// Summary
if (allGood) {
  console.log('✅ All required files are present!');
  console.log('🚀 Your system is ready to run!\n');
  
  console.log('📝 Quick Start:');
  console.log('   1. Start MongoDB (if using local database)');
  console.log('   2. Create server/.env file from server/env.example');
  console.log('   3. Run: node start-simple.js');
  console.log('   4. Or use: npm run dev\n');
  
  console.log('🌐 Access:');
  console.log('   Frontend: http://localhost:3000');
  console.log('   Backend:  http://localhost:5000');
  console.log('   Health:   http://localhost:5000/api/health\n');
  
} else {
  console.log('❌ Some required files are missing!');
  console.log('⚠️  Please install dependencies: npm run install-all\n');
}

// Check for .env file
if (!fs.existsSync('./server/.env')) {
  console.log('💡 Tip: Create server/.env file from server/env.example');
  console.log('   The system will work with defaults, but it\'s recommended.\n');
}

console.log('='.repeat(70));

