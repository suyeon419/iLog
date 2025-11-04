import api from './axios';

// ✅ 공통 헤더 (모든 요청에 적용)
const defaultHeaders = {
    'Content-Type': 'multipart/form-data',
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
    console.group('🧩 [loginUser] 요청 디버그 로그');
    console.log('📤 요청 데이터:', data);
    try {
        const res = await api.post('/auth/login', data, { headers: defaultHeaders });
        console.log('✅ 응답 상태 코드:', res.status);
        console.log('✅ 응답 데이터:', res.data);
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
        const res = await api.get(`/members`, { headers });
        return res.data;
    } catch (err) {
        console.error('❌ 회원 정보 조회 실패:', err);
        throw err;
    }
};
/* ==========================
 * 회원 정보 수정 (로그인 필요)
 * ========================== */
export const updateUserInfo = async (userData) => {
    // userData는 { name: '..', password: '..' }
    console.log('📤 회원정보 수정 요청 (원본 JS):', userData);

    // [중요] JS Object -> FormData로 변환 (이 로직은 좋습니다)
    const formData = new FormData();
    formData.append('name', userData.name);
    if (userData.password) {
        formData.append('newPassword', userData.password);
        formData.append('checkPassword', userData.password);
    }

    try {
        // [수정] 헤더 제거.
        // formData 객체이므로 axios가 'multipart/form-data' 헤더 자동 생성
        // 인터셉터가 'Authorization' 헤더 자동 첨부
        const res = await api.patch('/members', formData);
        console.log('✅ 회원정보 수정 성공:', res.data);
        return res.data;
    } catch (err) {
        console.error('❌ 회원정보 수정 실패:', err);
        throw err;
    }
};
