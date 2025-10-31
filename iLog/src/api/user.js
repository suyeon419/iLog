import api from './axios';

// ✅ 공통 헤더 (모든 요청에 적용)
const defaultHeaders = {
    'Content-Type': 'application/json',
};

// ✅ 토큰 가져오기 헬퍼
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/* ==========================
 * 회원가입 (비로그인 접근)
 * ========================== */
export const registerUser = async (userData) => {
    console.log('📤 회원가입 요청 전송:', userData);

    try {
        const response = await api.post('/members', userData);
        console.log('✅ 회원가입 성공:', response);
        return response.data;
    } catch (error) {
        if (error.response) {
            // 서버가 응답을 보냈지만 상태 코드가 2xx가 아닌 경우
            console.error('❌ 회원가입 실패:', {
                status: error.response.status,
                data: error.response.data,
            });
        } else if (error.request) {
            // 요청은 보냈지만 응답이 없는 경우
            console.error('🚫 서버 응답 없음:', error.request);
        } else {
            // 요청 설정 중 오류 발생
            console.error('⚙️ 요청 설정 중 오류:', error.message);
        }
        throw error;
    }
};

/* ==========================
 * 로그인 (비로그인 접근)
 * ========================== */
export const loginUser = async (data) => {
    try {
        const res = await api.post('/auth/login', data, { headers: defaultHeaders });
        if (res.data?.token) localStorage.setItem('token', res.data.token);
        return res.data;
    } catch (err) {
        console.error('❌ 로그인 실패:', err);
        throw err;
    }
};

/* ==========================
 * 로그아웃 (로그인 필요)
 * ========================== */
export const logoutUser = async () => {
    try {
        const headers = { ...defaultHeaders, ...getAuthHeader() };
        await api.post('/auth/logout', null, { headers });
        localStorage.removeItem('token');
        return true;
    } catch (err) {
        console.error('❌ 로그아웃 실패:', err);
        throw err;
    }
};

/* ==========================
 * 이메일 찾기 (비로그인 접근)
 * ========================== */
export const findEmail = async (data) => {
    try {
        const res = await api.post('/auth/find-email', data, { headers: defaultHeaders });
        return res.data;
    } catch (err) {
        console.error('❌ 이메일 찾기 실패:', err);
        throw err;
    }
};

/* ==========================
 * 비밀번호 검증 (로그인 필요)
 * ========================== */
export const verifyPassword = async (data) => {
    try {
        const headers = { ...defaultHeaders, ...getAuthHeader() };
        const res = await api.post('/auth/verify-password', data, { headers });
        return res.data;
    } catch (err) {
        console.error('❌ 비밀번호 검증 실패:', err);
        throw err;
    }
};

/* ==========================
 * 비밀번호 재설정 (비로그인 접근)
 * ========================== */
export const resetPassword = async (data) => {
    try {
        const res = await api.patch('/auth/reset-password', data, { headers: defaultHeaders });
        return res.data;
    } catch (err) {
        console.error('❌ 비밀번호 재설정 실패:', err);
        throw err;
    }
};

/* ==========================
 * 회원 정보 조회 (로그인 필요)
 * ========================== */
export const getUserById = async (id) => {
    try {
        const headers = { ...getAuthHeader() };
        const res = await api.get(`/members/${id}`, { headers });
        return res.data;
    } catch (err) {
        console.error('❌ 회원 정보 조회 실패:', err);
        throw err;
    }
};
