import React, { useState } from 'react';
import { Button, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function FindPw() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        console.log('이메일:', email);
        console.log('전화번호:', phoneNumber);
        navigate('/findPw/changePw');
    };
    return (
        <Container>
            <h2 className="fw-bold text-center my-4">비밀번호 찾기</h2>

            <Form onSubmit={handleSubmit}>
                <Form.Group>
                    <Form.Label>이메일</Form.Label>
                    <Form.Control
                        type="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="이메일을 입력하세요"
                        required
                    />
                </Form.Group>
                <Form.Group className="mb-4">
                    <Form.Label>전화번호</Form.Label>
                    <Form.Control
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="전화번호를 입력하세요"
                        required
                    />
                </Form.Group>
                <Button type="submit" variant="primary user-btn">
                    비밀번호 찾기
                </Button>
            </Form>
        </Container>
    );
}
