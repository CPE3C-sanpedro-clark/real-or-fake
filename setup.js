/* SETUP.JS - Hostinger Deployment Entry Point
 *
 * Hostinger requires a setup.js file in the root directory
 * to configure and start the Node.js application.
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Real or Fake application...');
console.log('📁 Current directory:', process.cwd());

// Start the main API server
const server = spawn('node', ['api/index.js'], {
    stdio: 'inherit',
    env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'production'
    }
});

server.on('error', (err) => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
});

server.on('exit', (code) => {
    console.log('Server exited with code:', code);
    process.exit(code);
});
