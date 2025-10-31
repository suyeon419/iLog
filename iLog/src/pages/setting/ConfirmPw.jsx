// ConfirmPw.jsx

import React, { useState } from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function ConfirmPw() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault(); // 폼 제출 시 새로고침 방지

        // TODO: 여기서 입력된 password로 백엔드에 본인 인증 API를 호출합니다.
        console.log('Verifying password (simulation)...', password);

        // 인증 성공 시 Settings 페이지로 이동
        navigate('/settings');
    };

    return (
        <Container className="pt-3">
            <h2 className="fw-bold text-center my-4">본인 인증</h2>

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>비밀번호</Form.Label>
                    <Form.Control
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호를 입력하세요"
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
