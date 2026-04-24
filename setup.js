/* SETUP.JS - Hostinger Deployment Entry Point
 *
 * Hostinger requires a setup.js file in the root directory
 * to configure and start the Node.js application.
 */

console.log('🚀 Starting Real or Fake application...');
console.log('📁 Current directory:', process.cwd());

// Directly import and run the API server
import('./api/index.js').catch(err => {
    console.error('❌ Failed to start server:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
});
