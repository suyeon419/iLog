// EditProfile.jsx

import React, { useState, useEffect } from 'react';
import { Alert, Button, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
// import { registerUser } from '../../api/user'; // [삭제] 백엔드 API 호출 삭제

// [수정] 함수 이름을 Register에서 EditProfile로 변경
export default function EditProfile() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: '',
        name: '',
        password: '',
        checkPassword: '',
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    // [수정] handleSubmit 함수를 대폭 수정
    // 수연아, 제발 괴롭히지 마..
    const handleSubmit = (e) => {
        e.preventDefault(); // 새로고침 방지
        setError('');

        // 1. 모든 필드가 채워졌는지 확인 (HTML 'required' 속성이 이미 하고 있음)
        // 2. 비밀번호와 비밀번호 확인이 일치하는지 확인 (선택 사항)
        if (form.password !== form.checkPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        // 3. 백엔드 API 호출 대신, '본인 인증' 페이지로 즉시 이동
        console.log('폼 제출 (시뮬레이션)', form);
        navigate('/confirm-password');
    };

    return (
        // [수정] index.css의 .container (중앙 정렬) 스타일 적용
        <Container className="pt-3">
            <h2 className="fw-bold text-center my-4">회원 정보 수정</h2>

            {/* 에러 메시지 표시 */}
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
                        // readOnly // (이메일 수정을 막으려면 이 주석을 해제하세요)
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
