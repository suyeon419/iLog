import React from 'react';
import { Alert, Button, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function Register() {
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
                    <Form.Label>이름</Form.Label>
                    <Form.Control
                        type="text"
                        // value={title}
                        // onChange={(e) => setTitle(e.target.value)}
                        placeholder="이름을 입력하세요"
                        required
                    />
                </Form.Group>
                <Form.Group>
                    <Form.Label className="mb-0">전화번호</Form.Label>
                    <Form.Control
                        type="text"
                        // value={title}
                        // onChange={(e) => setTitle(e.target.value)}
                        placeholder="전화번호를 입력하세요"
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
                <Form.Group className="mb-3">
                    <Form.Label>비밀번호 확인</Form.Label>
                    <Form.Control
                        type="text"
                        // value={title}
                        // onChange={(e) => setTitle(e.target.value)}
                        placeholder="비밀번호를 한 번 더 입력하세요"
                        required
                    />
                </Form.Group>

                <Button type="submit" variant="primary user-btn">
                    회원가입
                </Button>
            </Form>
        </Container>
    );
}
