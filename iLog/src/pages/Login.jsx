import React from 'react';
import { Alert, Button, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const navigate = useNavigate();
    const handleSubmit = (e) => {
        e.preventDefault();
        navigate('/');
    };
    return (
        <Container>
            <img src="./images/iLogLogo.png" alt="iLog Logo" style={{ width: '150px' }} /> <br />
            <Form onSubmit={handleSubmit}>
                <Form.Group>
                    <Form.Label>이메일</Form.Label>
                    <Form.Control
                        type="text"
                        // value={title}
                        // onChange={(e) => setTitle(e.target.value)}
                        placeholder="이메일을 입력하세요"
                        required
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label>비밀번호</Form.Label>
                    <Form.Control
                        type="text"
                        // value={title}
                        // onChange={(e) => setTitle(e.target.value)}
                        placeholder="비밀번호를 입력하세요"
                        required
                    />
                </Form.Group>
                <p style={{ textAlign: 'center' }} className="mt-3">
                    <a href="/findPw" className="link">
                        비밀번호 찾기{' '}
                    </a>
                    |
                    <a href="/findEmail" className="link">
                        {' '}
                        이메일 찾기{' '}
                    </a>
                    |
                    <a href="/register" className="link">
                        {' '}
                        회원가입
                    </a>
                </p>
                <Button type="submit" variant="primary user-btn">
                    로그인
                </Button>
            </Form>
        </Container>
    );
}
