import React, { useState } from 'react';
import { Button, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function FindEmail() {
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const dummyData = {
            '01012345678': 'suyeon@example.com',
            '01099998888': 'gahyun@ilog.com',
            '01055557777': 'guest@ilog.com',
        };

        if (dummyData[phone]) {
            setEmail(dummyData[phone]);
        } else {
            setEmail('등록된 이메일이 없습니다.');
        }
    };

    return (
        <Container>
            <img src="./images/iLogLogo.png" alt="iLog Logo" style={{ width: '150px' }} />
            <br />
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-2">
                    <Form.Label className="mb-0">전화번호</Form.Label>
                    <div className="d-flex align-items-end gap-2 mb-3">
                        <Form.Control
                            className="form"
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
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
        </Container>
    );
}
