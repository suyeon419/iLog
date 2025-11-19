import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https'; // ✅ ESM import로 변경

export default defineConfig({
    plugins: [react()],
    define: {
        global: 'window',
    },
    server: {
        host: true,
        allowedHosts: ['webkit-ilo9.duckdns.org'],
        proxy: {
            '/api': {
                target: 'https://webkit-ilo9-api.duckdns.org',
                changeOrigin: true,
                secure: false,
                agent: new https.Agent({ rejectUnauthorized: false }), // ✅ 수정된 부분
                rewrite: (path) => path.replace(/^\/api/, ''),
                configure: (proxy, options) => {
                    proxy.on('proxyReq', (proxyReq, req) => {
                        console.log(`[VITE PROXY] ${req.method} ${req.url} -> ${options.target}${req.url}`);
                    });
                    proxy.on('error', (err) => {
                        console.error('[VITE PROXY ERROR]', err?.message);
                    });
                },
            },
        },
    },
});
