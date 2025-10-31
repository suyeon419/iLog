// axios.js
import axios from 'axios';

// ✅ baseURL을 절대 URL이 아닌 상대 경로(`/api`)로 두면,
// ✅ Vite 개발 서버가 프록시를 가로채서 backend로 전달합니다.
const api = axios.create({
    baseURL: '/api',
    // baseURL: 'https://webkit-ilo9-api.duckdns.org',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 🧩 요청/응답 디버그용 로그 (기존 유지 가능)
api.interceptors.request.use((config) => {
    console.log('🌐 [Axios Request]');
    console.log('URL:', config.baseURL + config.url); // 여기서 URL 확인 가능
    console.log('Method:', config.method);
    console.log('Headers:', config.headers);
    console.log('Data:', config.data);
    return config;
});

api.interceptors.response.use(
    (response) => {
        console.log('✅ [Axios Response]', response);
        return response;
    },
    (error) => {
        console.error('❌ [Axios Error]');
        console.error('URL:', error.config?.url);
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        return Promise.reject(error);
    }
);

export default api;
