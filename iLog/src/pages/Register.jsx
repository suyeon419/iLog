import React from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function Register() {
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
                    <Form.Label className="mb-0">이름</Form.Label>
                    <Form.Control
                        className="form"
                        type="text"
                        // value={title}
                        // onChange={(e) => setTitle(e.target.value)}
                        placeholder="이름을 입력하세요"
                        required
                    />
                </Form.Group>
                <Form.Group className="mb-2">
                    <Form.Label className="mb-0">전화번호</Form.Label>
                    <Form.Control
                        className="form"
                        type="text"
                        // value={title}
                        // onChange={(e) => setTitle(e.target.value)}
                        placeholder="전화번호를 입력하세요"
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
                <Form.Group className="mb-3">
                    <Form.Label className="mb-0">비밀번호 확인</Form.Label>
                    <Form.Control
                        className="form"
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
        </div>
    );
}
