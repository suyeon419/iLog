import axios from 'axios';

// 기본 axios 인스턴스 생성
const axiosInstance = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});

// 🧩 요청 인터셉터: 로그인 후 자동으로 토큰 첨부
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔐 [Axios Interceptor] 토큰 자동 첨부 완료');
        } else {
            console.log('⚠️ [Axios Interceptor] 토큰 없음 — 로그인 필요');
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ❌ 응답 인터셉터: 토큰 만료 시 처리
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('🚫 [Axios Interceptor] 인증 만료 — 로그아웃 처리');
            // 필요하다면 자동 로그아웃 로직 추가 가능
            localStorage.removeItem('accessToken');
            // window.location.href = "/login"; // 로그인 페이지로 이동
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
