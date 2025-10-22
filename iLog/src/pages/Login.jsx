import React from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const navigate = useNavigate();
    const handleSubmit = (e) => {
        e.preventDefault();
        navigate('/');
    };
    return (
        <div className="container">
            <img src="./images/iLogLogo.png" alt="iLog Logo" style={{ width: '150px' }} /> <br />
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-2">
                    <Form.Label className="mb-0">이메일</Form.Label>
                    <Form.Control
                        className="form"
                        type="text"
                        // value={title}
                        // onChange={(e) => setTitle(e.target.value)}
                        placeholder="이메일을 입력하세요"
                        required
                    />
                </Form.Group>
                <Form.Group className="mb-2">
                    <Form.Label className="mb-0">비밀번호</Form.Label>
                    <Form.Control
                        className="form"
                        type="text"
                        // value={title}
                        // onChange={(e) => setTitle(e.target.value)}
                        placeholder="비밀번호를 입력하세요"
                        required
                    />
                </Form.Group>
                <p style={{ textAlign: 'center' }} className="mt-3">
                    <a href="/" className="link">
                        비밀번호 찾기{' '}
                    </a>
                    |
                    <a href="/" className="link">
                        {' '}
                        이메일 찾기{' '}
                    </a>
                    |
                    <a href="/" className="link">
                        {' '}
                        회원가입
                    </a>
                </p>
                <Button type="submit" variant="primary user-btn">
                    로그인
                </Button>
            </Form>
        </div>
    );
}
