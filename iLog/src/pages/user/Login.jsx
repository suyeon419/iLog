import React, { useState } from 'react';
import { Alert, Button, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../api/user';

export default function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: '',
        password: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log(form);

        try {
            const res = await loginUser(form); // 실제 로그인 API 호출
            console.log('로그인 성공:', res);

            if (!res) {
                console.error('❌ [Login] 응답이 없습니다. loginUser 함수에서 return이 누락된 듯합니다.');
            } else if (!res.accessToken && !res.data?.accessToken) {
                console.warn('⚠️ [Login] accessToken 필드가 응답에 없습니다. 응답 구조 확인 필요:', res);
            } else {
                const token = res.accessToken || res.data.accessToken;
                if (!token) {
                    console.warn('⚠️ [Login] accessToken이 undefined입니다. res 구조:', res);
                } else {
                    localStorage.setItem('accessToken', token);
                    console.log('✅ [Login] 토큰이 localStorage에 저장되었습니다:', token);
                }
            }

            // // 로그인 성공 시: 토큰 저장
            // if (res.token) {
            //     ocalStorage.setItem('accessToken', res.accessToken);
            //     console.log('토큰 저장');
            // } else {
            //     console.log('토큰 저장 안됨');
            // }

            // 메인 페이지 이동
            navigate('/');
        } catch (err) {
            console.error('로그인 실패:', err);
            setError(err.response?.data?.message || '로그인 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <img src="./images/iLogLogo.png" alt="iLog Logo" style={{ width: '150px' }} /> <br />
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
