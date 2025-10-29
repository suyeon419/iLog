import api from './axios';

/**
 * ✅ 회원가입
 * @param {Object} data - { email, name, phoneNum, password, checkPassword }
 */
export const registerUser = async (data) => {
    const res = await api.post('/members', data);
    return res.data;
};

/**
 * ✅ 로그인
 * 로그인 성공 시 토큰을 localStorage에 자동 저장합니다.
 * @param {Object} data - { email, password }
 */
export const loginUser = async (data) => {
    const res = await api.post('/auth/login', data);
    if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
    }
    return res.data;
};

/**
 * ✅ 로그아웃
 * 로그아웃 시 localStorage에서 토큰 자동 삭제합니다.
 */
export const logoutUser = async () => {
    try {
        await api.post('/auth/logout');
    } catch (err) {
        console.error('Logout API Error:', err);
    } finally {
        localStorage.removeItem('token');
    }
};

/**
 * ✅ 회원조회
 * @param {number|string} id - 사용자 ID
 */
export const getUserById = async (id) => {
    const res = await api.get(`/members/${id}`);
    return res.data;
};

/**
 * ✅ 회원수정
 * @param {number|string} id - 사용자 ID
 * @param {Object} data - { name, newPassword, checkPassword }
 */
export const updateUser = async (id, data) => {
    const res = await api.patch(`/members/${id}`, data);
    return res.data;
};

/**
 * ✅ 회원삭제
 * @param {number|string} id - 사용자 ID
 */
export const deleteUser = async (id) => {
    const res = await api.delete(`/members/${id}`);
    return res.data;
};

// ✅ 이메일 찾기
export const findEmail = async (phoneNum) => {
    const token = localStorage.getItem('token');
    const res = await api.post(
        '/members/find-email',
        { phoneNum },
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    return res.data;
};

// ✅ 비밀번호 찾기 (1차 인증)
export const verifyPassword = async (data) => {
    const token = localStorage.getItem('token');
    const res = await api.post('/members/password/verify', data, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
};

// ✅ 비밀번호 재설정
export const resetPassword = async (data) => {
    const res = await api.patch('/members/password/reset', data, {
        headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
};
