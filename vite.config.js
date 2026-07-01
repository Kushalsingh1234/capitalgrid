import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  if (command === 'serve') {
    // Start backend server silently in the background
    console.log('\n[Vite] Spawning CapitalGrid backend process on port 5000...');
    const serverPath = path.resolve(__dirname, 'server', 'server.js');
    const child = spawn('node', [serverPath], {
      stdio: 'inherit',
      shell: true,
      cwd: path.resolve(__dirname, 'server')
    });

    child.on('error', (err) => {
      console.error('[Vite Backend Spawn Error]:', err);
    });

    process.on('exit', () => {
      child.kill();
    });
  }

  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        }
      }
    }
  };
});
