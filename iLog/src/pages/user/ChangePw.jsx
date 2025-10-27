import React, { useState } from 'react';
import { Alert, Button, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function ChangePw() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault(); // 폼 제출 시 새로고침 방지
        if (password !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        console.log('password: ', password);

        // 비밀번호가 일치하면 다음 페이지로 이동
        navigate('/');
    };
    return (
        <Container>
            <img src="/images/iLogLogo.png" alt="iLog Logo" style={{ width: '150px' }} /> <br />
            <Form onSubmit={handleSubmit}>
                <Form.Group>
                    <Form.Label>비밀번호</Form.Label>
                    <Form.Control
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호를 입력하세요"
                        required
                    />
                </Form.Group>
                <Form.Group className="mb-4">
                    <Form.Label>비밀번호 확인</Form.Label>
                    <Form.Control
                        type="text"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="비밀번호를 한 번 더 입력하세요"
                        required
                    />
                </Form.Group>
                <Button type="submit" variant="primary user-btn">
                    비밀번호 변경
                </Button>
            </Form>
        </Container>
    );
}
