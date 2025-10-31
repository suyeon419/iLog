import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                // 프론트에서 '/api'로 시작하는 요청을 대신 전달
                target: 'https://webkit-ilo9-api.duckdns.org',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api/, ''), // '/api'를 제거하고 백엔드로 전달
            },
        },
    },
});
