// ConfirmPw.jsx

import React, { useState } from 'react';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { verifyPassword } from '../../api/user';

export default function ConfirmPw() {
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        console.log('Step 1: 현재 비밀번호 검증 시도. 전송할 비밀번호:', currentPassword);

        try {
            // --- [수정] ---
            // 1. JSON이 아닌 FormData 객체를 생성합니다. (multipart/form-data)
            const formData = new FormData();

            // 2. 소문자 'password' 키로 FormData에 추가합니다.
            formData.append('password', currentPassword);
            // ----------------

            console.log('Step 2: 백엔드로 이 FormData 객체를 전송합니다.');
            // (참고: 브라우저 콘솔에서 formData 객체는 비어있는 것처럼 보일 수 있으나 정상입니다)
            await verifyPassword(formData);

            console.log('✅ 현재 비밀번호 검증 성공');
            navigate('/edit-profile');
        } catch (err) {
            console.error('❌ 비밀번호 검증 프로세스 실패:', err);
            if (err.response) {
                console.error('❌ 서버 응답 데이터:', err.response.data);
                console.error('❌ 서버 응답 상태:', err.response.status);
            }

            if (err.response && (err.response.status === 401 || err.response.status === 400)) {
                setError('비밀번호가 일치하지 않습니다.');
            } else {
                setError('검증 중 오류가 발생했습니다. 다시 시도해 주세요.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="pt-3">
            <h2 className="fw-bold text-center my-4">본인 인증</h2>
            <p className="text-center text-muted">
                정보를 안전하게 수정하기 위해 현재 비밀번호를 한 번 더 입력해 주세요.
            </p>

            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>현재 비밀번호</Form.Label>
                    <Form.Control
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="현재 비밀번호를 입력하세요"
                        required
                    />
                </Form.Group>

                <Button type="submit" variant="primary" className="user-btn" disabled={loading}>
                    {loading ? '확인 중...' : '확인'}
                </Button>
            </Form>
        </Container>
    );
}
