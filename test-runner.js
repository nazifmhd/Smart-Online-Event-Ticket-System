#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Running Smart Event Ticket System Tests\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Test configuration
const tests = [
  {
    name: 'Backend API Tests',
    directory: 'server',
    command: 'npm test',
    description: 'Testing Node.js/Express API endpoints, authentication, and business logic'
  },
  {
    name: 'Frontend Component Tests',
    directory: 'client',
    command: 'npm test -- --coverage --watchAll=false',
    description: 'Testing React components, pages, and user interactions'
  }
];

// Run tests sequentially
async function runTests() {
  let allPassed = true;
  
  for (const test of tests) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`Running ${test.name}`, 'bright');
    log(`${test.description}`, 'yellow');
    log(`${'='.repeat(60)}`, 'cyan');
    
    try {
      await runTest(test);
      log(`✅ ${test.name} - PASSED`, 'green');
    } catch (error) {
      log(`❌ ${test.name} - FAILED`, 'red');
      log(`Error: ${error.message}`, 'red');
      allPassed = false;
    }
  }
  
  log(`\n${'='.repeat(60)}`, 'cyan');
  if (allPassed) {
    log('🎉 All tests passed successfully!', 'green');
    log('Your Smart Event Ticket System is ready for development!', 'bright');
  } else {
    log('⚠️  Some tests failed. Please check the output above.', 'yellow');
    log('Fix the failing tests before proceeding with development.', 'red');
  }
  log(`${'='.repeat(60)}`, 'cyan');
  
  process.exit(allPassed ? 0 : 1);
}

function runTest(test) {
  return new Promise((resolve, reject) => {
    const testDir = path.join(__dirname, test.directory);
    const [command, ...args] = test.command.split(' ');
    
    log(`\n📁 Directory: ${testDir}`, 'blue');
    log(`🚀 Command: ${test.command}`, 'blue');
    
    const child = spawn(command, args, {
      cwd: testDir,
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test command exited with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n\n⚠️  Test run interrupted by user', 'yellow');
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('\n\n⚠️  Test run terminated', 'yellow');
  process.exit(1);
});

// Start the test run
runTests().catch((error) => {
  log(`\n💥 Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});
