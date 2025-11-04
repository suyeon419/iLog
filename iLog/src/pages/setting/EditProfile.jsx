// EditProfile.jsx

import React, { useState, useEffect } from 'react';
import { Alert, Button, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
// [수정] updateUserInfo 임포트 추가
import { getUserById, updateUserInfo } from '../../api/user';

export default function EditProfile() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: '',
        name: '',
        password: '',
        checkPassword: '',
    });

    const [error, setError] = useState('');
    const [isLogin, setIsLogin] = useState(false);
    const [user, setUser] = useState(null);
    // [수정] 로딩 상태 추가
    const [loading, setLoading] = useState(false);

    // --- 회원 정보 불러오기 (기존과 동일) ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLogin(true);
            getUserById()
                .then((data) => {
                    console.log('✅ [EditProfile] 회원 정보 조회 성공:', data);
                    if (data) {
                        setUser(data);
                    } else {
                        console.warn('⚠️ [EditProfile] 회원 정보 조회는 성공했으나 데이터가 비어있습니다.');
                    }
                })
                .catch((err) => {
                    console.error('❌ [EditProfile] 회원 정보 요청 실패:', err);
                    localStorage.removeItem('token');
                    setIsLogin(false);
                });
        } else {
            setIsLogin(false);
            console.log('🔌 [EditProfile] 토큰이 없어 로그인 상태가 아닙니다.');
        }
    }, []);

    // --- 불러온 user 정보로 form state 업데이트 (기존과 동일) ---
    useEffect(() => {
        if (user) {
            setForm((prevForm) => ({
                ...prevForm,
                email: user.email,
                name: user.name,
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    // --- [수정] handleSubmit 로직 변경 ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true); // 로딩 시작

        // 1. 비밀번호 일치 검사 (기존과 동일)
        if (form.password && form.password !== form.checkPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            setLoading(false); // 로딩 끝
            return;
        }

        // 2. API에 보낼 데이터 정제 (기존과 동일)
        const dataToUpdate = {
            name: form.name,
        };
        if (form.password) {
            dataToUpdate.password = form.password;
        }

        // 3. [수정] 여기서 직접 API 호출 (ConfirmPw에서 가져온 로직)
        try {
            console.log('Step: 회원 정보 수정 시도...', dataToUpdate);
            // (참고: API의 updateUserInfo 함수가 FormData가 아닌 객체를 받도록 구현되어 있어야 함)
            await updateUserInfo(dataToUpdate);
            console.log('✅ 회원 정보 수정 성공');

            // 4. [수정] 성공 시 Settings 페이지로 이동
            alert('회원 정보가 성공적으로 수정되었습니다.');
            navigate('/settings');
        } catch (err) {
            console.error('❌ 회원 정보 수정 실패:', err);
            setError('정보 수정 중 오류가 발생했습니다. 다시 시도해 주세요.');
        } finally {
            setLoading(false); // 로딩 끝
        }
    };

    return (
        <Container className="pt-3">
            <h2 className="fw-bold text-center my-4">회원 정보 수정</h2>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Form.Group>
                    <Form.Label>이메일</Form.Label>
                    <Form.Control
                        type="text"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="이메일을 입력하세요"
                        required
                        readOnly
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>이름</Form.Label>
                    <Form.Control
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="이름을 입력하세요"
                        required
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>비밀번호</Form.Label>
                    <Form.Control
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="새 비밀번호 (변경 시에만 입력)"
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>비밀번호 확인</Form.Label>
                    <Form.Control
                        type="password"
                        name="checkPassword"
                        value={form.checkPassword}
                        onChange={handleChange}
                        placeholder="새 비밀번호 확인"
                    />
                </Form.Group>

                {/* [수정] 로딩 상태 버튼에 적용 */}
                <Button type="submit" variant="primary" className="user-btn" disabled={loading}>
                    {loading ? '수정 중...' : '수정 완료'}
                </Button>
            </Form>
        </Container>
    );
}
