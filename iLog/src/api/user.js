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
        const res = await api.post('/auth/login', data, { headers: { 'Content-Type': 'application/json' } });
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
 * 비밀번호 찾기 1차 인증 (토큰 필요)
 * ========================== */
export const verifyUserForPasswordReset = async (data) => {
    try {
        const headers = {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        };

        console.log('📤 비밀번호 찾기 1차 인증 요청:', data);

        const res = await api.post('/members/password/verify', data, { headers });

        console.log('✅ 비밀번호 찾기 1차 인증 성공:', res.data);
        return res.data;
    } catch (err) {
        if (err.response) {
            console.error('❌ 비밀번호 찾기 인증 실패:', {
                status: err.response.status,
                data: err.response.data,
            });
        } else if (err.request) {
            console.error('🚫 서버 응답 없음:', err.request);
        } else {
            console.error('⚙️ 요청 설정 오류:', err.message);
        }
        throw err;
    }
};

/* ==========================
 * 비밀번호 검증 (로그인 필요)
 * ========================== */
export const verifyPassword = async (data) => {
    try {
        const headers = {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        };

        const res = await api.post('/members/password/input', data, { headers });

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
        const headers = {
            'Content-Type': 'application/json',
        };

        console.log('📤 비밀번호 재설정 요청:', data);

        const res = await api.patch('/members/password/reset', data, { headers });

        console.log('✅ 비밀번호 재설정 성공');
        return res.data;
    } catch (err) {
        if (err.response) {
            console.error('❌ 비밀번호 재설정 실패:', {
                status: err.response.status,
                data: err.response.data,
            });
        } else if (err.request) {
            console.error('🚫 서버 응답 없음:', err.request);
        } else {
            console.error('⚙️ 요청 설정 오류:', err.message);
        }
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
 * 로그인 이력 조회 (로그인 필요)
 * ========================== */
export const getLoginHistory = async () => {
    console.log('📤 로그인 이력 요청');
    try {
        const headers = { ...getAuthHeader() };

        const res = await api.get('/logs/login', { headers });

        console.log('✅ 로그인 이력 조회 성공:', res.data);
        return res.data;
    } catch (err) {
        console.error('❌ 로그인 이력 조회 실패:', err);
        throw err;
    }
};

/* ==========================
 * 회원 정보 수정 (로그인 필요)
 * ========================== */
export const updateUserInfo = async (data) => {
    console.log('📤 회원 정보 수정 요청 전송:', data);
    try {
        const headers = { ...defaultHeaders, ...getAuthHeader() };

        const res = await api.patch('/members', data, { headers });

        console.log('✅ 회원 정보 수정 성공:', res.data);
        return res.data;
    } catch (err) {
        console.error('❌ 회원 정보 수정 실패:', err);
        throw err;
    }
};

/* ==========================
 * 화상회의 이력 조회 (로그인 필요)
 * ========================== */
export const getMeetingHistory = async () => {
    console.log('📤 화상회의 이력 요청');
    try {
        const headers = { ...getAuthHeader() };

        const res = await api.get('/logs/meeting', { headers });

        console.log('✅ 화상회의 이력 조회 성공:', res.data);

        return res.data.logs;
    } catch (err) {
        console.error('❌ 화상회의 이력 조회 실패:', err);
        throw err;
    }
};

export const getUserInfo = async () => {
    try {
        const headers = getAuthHeader();
        const res = await api.get('/members', { headers }); // /members/me 또는 /users/me 같은 엔드포인트
        return res.data;
    } catch (err) {
        console.error('사용자 정보 불러오기 실패:', err);
        throw err;
    }
};

/* ==========================
 * 회원 삭제 (회원 탈퇴)
 * ========================== */
export const deleteUser = async (memberId) => {
    try {
        const headers = {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        };

        console.log(`📤 회원 삭제 요청: /members/${memberId}`);

        const res = await api.delete(`/members/${memberId}`, { headers });

        console.log('✅ 회원 삭제 성공');
        return res.data;
    } catch (err) {
        if (err.response) {
            console.error('❌ 회원 삭제 실패:', {
                status: err.response.status,
                data: err.response.data,
            });
        } else if (err.request) {
            console.error('🚫 서버 응답 없음:', err.request);
        } else {
            console.error('⚙️ 요청 설정 오류:', err.message);
        }
        throw err;
    }
};
