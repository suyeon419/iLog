import React, { useState } from 'react';
import { Alert, Button, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../api/user';

export default function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: '',
        name: '',
        phoneNum: '',
        password: '',
        checkPassword: '',
    });

    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        console.log(form);

        try {
            const res = await registerUser(form); // ✅ API 호출
            console.log('회원가입 성공:', res);

            setSuccess(true);
            setTimeout(() => navigate('/login'), 1500); // 1.5초 후 로그인 페이지로 이동
        } catch (err) {
            console.error('회원가입 실패:', err);
            const msg = err.response?.data?.message || '회원가입 중 오류가 발생했습니다.';
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

        setForm({ ...form, phoneNum: value });
    };

    return (
        <Container>
            <img className="w-35" src="./images/ko.ilo9.png" alt="iLog Logo" /> <br />
            {error && <Alert variant="danger">{error}</Alert>}
            <Form onSubmit={handleSubmit}>
                <Form.Group>
                    <Form.Label>이메일</Form.Label>
                    <Form.Control
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="이메일을 입력하세요"
                        required
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
                    <Form.Label className="mb-0">전화번호</Form.Label>
                    <Form.Control
                        type="tel"
                        name="phoneNum"
                        value={form.phoneNum}
                        onChange={handlePhoneChange}
                        placeholder="전화번호를 입력하세요"
                        maxLength={13}
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
                        placeholder="비밀번호를 입력하세요"
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
