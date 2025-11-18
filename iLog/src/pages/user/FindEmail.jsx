import React, { useState, useEffect } from 'react';
import { Alert, Button, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { findEmail } from '../../api/user';

export default function FindEmail() {
    const navigate = useNavigate();

    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setEmail('');
        setLoading(true);

        try {
            const res = await findEmail(phone);
            console.log('이메일 조회 결과:', res);

            if (Array.isArray(res) && res.length > 0) {
                const allEmails = res.map((item) => item.email).join(', ');
                setEmail(allEmails);
            } else {
                setEmail('등록된 이메일이 없습니다.');
            }
        } catch (err) {
            console.error('이메일 조회 실패:', err);
            const msg = err.response?.data?.message || '이메일 찾기 중 오류가 발생했습니다.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    });
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

        setPhone(value);
    };

    return (
        <Container>
            <h2 className="fw-bold text-center my-4">이메일 찾기</h2>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-2">
                    <Form.Label className="mb-0">전화번호</Form.Label>
                    <div className="d-flex align-items-end gap-2">
                        <Form.Control
                            className="form"
                            type="text"
                            value={phone}
                            onChange={handlePhoneChange}
                            placeholder="전화번호를 입력하세요"
                            required
                            style={{ width: '270px' }}
                        />
                        <Button type="submit" variant="primary mini-btn">
                            검색
                        </Button>
                    </div>
                </Form.Group>
            </Form>

            <Form className="mb-2 mt-0">
                <Form.Label className="mb-0">이메일</Form.Label>
                <Form.Control
                    className="form"
                    type="text"
                    value={email}
                    readOnly
                    placeholder="검색을 하시면 이메일이 나옵니다."
                />
            </Form>
            <Button
                type="button"
                variant="primary user-btn"
                className="mt-2"
                onClick={() => {
                    navigate('/login');
                }}
            >
                로그인 화면으로
            </Button>
        </Container>
    );
}
