// EditProfile.jsx

import React, { useState, useEffect } from 'react';
import { Alert, Button, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getUserById } from '../../api/user';
import { jwtDecode } from 'jwt-decode';

export default function EditProfile() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: '',
        name: '',
        password: '', // (새 비밀번호)
        checkPassword: '',
    });

    const [error, setError] = useState('');
    const [isLogin, setIsLogin] = useState(false);
    const [user, setUser] = useState(null);

    // ... (useEffect 및 handleChange 함수는 기존과 동일) ...
    // --- [추가] Home.jsx의 useEffect (회원 정보 불러오기) ---
    useEffect(() => {
        const token = localStorage.getItem('accessToken');

        if (token) {
            setIsLogin(true);
            try {
                const decoded = jwtDecode(token);
                const userId = decoded.id;

                getUserById(userId)
                    .then((data) => {
                        console.log('✅ [EditProfile] 회원 정보 조회 성공:', data);
                        setUser(data);
                    })
                    .catch((err) => {
                        console.error('❌ [EditProfile] 회원 정보 요청 실패:', err);
                        localStorage.removeItem('accessToken');
                        setIsLogin(false);
                    });
            } catch (err) {
                console.error('❌ [EditProfile] JWT 디코딩 실패:', err);
                localStorage.removeItem('accessToken');
                setIsLogin(false);
            }
        }
    }, []); // 페이지 로드 시 1회 실행

    // --- [추가] 불러온 user 정보로 form state 업데이트 ---
    useEffect(() => {
        if (user) {
            // user 데이터가 있으면 form의 email과 name을 채웁니다.
            setForm((prevForm) => ({
                ...prevForm,
                email: user.email,
                name: user.name,
            }));
        }
    }, [user]); // user state가 변경될 때마다 실행

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    // --- [수정] handleSubmit ---
    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.checkPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        // [수정] 폼 데이터를 state에 담아 /confirm-password 페이지로 전달
        console.log('폼 제출 (데이터 전달):', form);
        navigate('/confirm-password', {
            state: {
                // '이수연'으로 바뀐 이름과 '새 비밀번호'를 전달
                updatedData: {
                    name: form.name,
                    password: form.password,
                },
            },
        });
    };
    // ----------------------------

    return (
        <Container className="pt-3">
            <h2 className="fw-bold text-center my-4">회원 정보 수정</h2>
            {/* ... (Form 렌더링 부분은 기존과 동일) ... */}

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Form.Group>
                    <Form.Label>이메일</Form.Label>
                    <Form.Control
                        type="text"
                        name="email"
                        value={form.email} // user.email이 채워짐
                        onChange={handleChange}
                        placeholder="이메일을 입력하세요"
                        required
                        readOnly // 이메일은 수정 불가
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>이름</Form.Label>
                    <Form.Control
                        type="text"
                        name="name"
                        value={form.name} // user.name이 채워짐 (여기서 '이수연'으로 수정)
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
                        placeholder="새 비밀번호를 입력하세요"
                        required
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>비밀번호 확인</Form.Label>
                    <Form.Control
                        type="password"
                        name="checkPassword"
                        value={form.checkPassword}
                        onChange={handleChange}
                        placeholder="새 비밀번호를 한 번 더 입력하세요"
                        required
                    />
                </Form.Group>

                <Button type="submit" variant="primary" className="user-btn">
                    수정 완료
                </Button>
            </Form>
        </Container>
    );
}
