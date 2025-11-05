import React, { useState } from 'react';
import { Alert, Button, Container, Form } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../api/user';

export default function ChangePw() {
    const navigate = useNavigate();
    const location = useLocation();

    const resetToken = location.state?.resetToken || '';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const res = await resetPassword({
                resetToken,
                newPassword: password,
                checkPassword: confirmPassword,
            });

            console.log('✅ 비밀번호 변경 성공:', res);
            alert('비밀번호가 성공적으로 변경되었습니다.');
            navigate('/login');
        } catch (err) {
            console.error('❌ 비밀번호 변경 실패:', err);
            setError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
        }
    };
    return (
        <Container>
            <img src="/images/iLogLogo.png" alt="iLog Logo" style={{ width: '150px' }} /> <br />
            <Form onSubmit={handleSubmit}>
                <Form.Group>
                    <Form.Label>비밀번호</Form.Label>
                    <Form.Control
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호를 입력하세요"
                        required
                    />
                </Form.Group>
                <Form.Group className="mb-4">
                    <Form.Label>비밀번호 확인</Form.Label>
                    <Form.Control
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="비밀번호를 한 번 더 입력하세요"
                        required
                    />
                </Form.Group>
                {error && <p className="text-danger">{error}</p>}
                <Button type="submit" variant="primary user-btn">
                    비밀번호 변경
                </Button>
            </Form>
        </Container>
    );
}
