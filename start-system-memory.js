const { spawn } = require('child_process');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

console.log('🚀 Starting Smart Event Ticket System (Memory Database)...\n');

let mongoServer;

async function startSystem() {
  try {
    // Start MongoDB Memory Server
    console.log('📡 Starting MongoDB Memory Server...');
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    console.log('✅ MongoDB Memory Server started:', mongoUri);

    // Set environment variables
    process.env.MONGODB_URI = mongoUri;
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'your-super-secret-jwt-key-for-development';
    process.env.CLIENT_URL = 'http://localhost:3000';

    console.log('\n📡 Starting Backend Server...');
    const backend = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'server'),
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        MONGODB_URI: mongoUri,
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
      process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down servers...');
        backend.kill();
        frontend.kill();
        
        if (mongoServer) {
          await mongoServer.stop();
        }
        process.exit(0);
      });

    }, 5000);

    console.log('\n✅ System startup initiated!');
    console.log('📊 Backend: http://localhost:5000');
    console.log('🌐 Frontend: http://localhost:3000');
    console.log('🗄️  Database: MongoDB Memory Server (in-memory)');
    console.log('\nPress Ctrl+C to stop both servers');

  } catch (error) {
    console.error('❌ Failed to start system:', error.message);
    process.exit(1);
  }
}

startSystem();
