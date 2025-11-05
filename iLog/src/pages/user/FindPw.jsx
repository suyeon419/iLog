import React, { useState } from 'react';
import { Alert, Button, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { verifyUserForPasswordReset } from '../../api/user';

export default function FindPw() {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await verifyUserForPasswordReset({
                email,
                phoneNum: phoneNumber,
            });
            console.log('서버 응답:', res);
            // 성공 시 다음 단계로 이동
            navigate('/findPw/changePw', { state: { resetToken: res.resetToken } });
        } catch (err) {
            const msg = err.response?.data?.message || '회원인증 오류가 발생했습니다.';
            setError(msg);
        }
    };

    const handlePhoneChange = (e) => {
        let value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 남기기

        // 010-1234-5678 형식 자동 변환
        if (value.length < 4) {
            value = value;
        } else if (value.length < 8) {
            value = `${value.slice(0, 3)}-${value.slice(3)}`;
        } else {
            value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7, 11)}`;
        }

        setPhoneNumber(value);
    };

    return (
        <Container>
            <h2 className="fw-bold text-center my-4">비밀번호 찾기</h2>
            {error && <Alert variant="danger">{error}</Alert>}
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
                        type="tel"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
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
