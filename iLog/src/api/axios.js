import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080',
});

// ✅ 요청 인터셉터: 토큰 자동 추가
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ 응답 인터셉터: 토큰 만료 등 에러 처리
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.warn('⚠️ 인증 만료 - 로그아웃 처리');
            localStorage.removeItem('token');
            window.location.href = '/login'; // 자동 로그아웃 리디렉션
        }
        return Promise.reject(error);
    }
);

export default api;
