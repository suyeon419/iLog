import React, { useState } from 'react';
import { Button, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function FindPw() {
    const handleSubmit = () => {
        console.log('hi');
    };
    return (
        <Container>
            <img src="./images/iLogLogo.png" alt="iLog Logo" style={{ width: '150px' }} />
            <br />
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-2">
                    <Form.Label className="mb-0">이메일</Form.Label>
                    <div className="d-flex align-items-end gap-2 mb-3">
                        <Form.Control
                            className="form"
                            type="text"
                            // value={phone}
                            // onChange={(e) => setPhone(e.target.value)}
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

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-2 mt-0">
                    <Form.Label className="mb-0">비밀번호</Form.Label>
                    <Form.Control
                        className="form"
                        type="text"
                        // value={email}
                        placeholder="비밀번호를 입력하세요"
                    />
                </Form.Group>
                <Form.Group className="mb-2">
                    <Form.Label className="mb-0">비밀번호 확인</Form.Label>
                    <div className="d-flex align-items-end gap-2 mb-3">
                        <Form.Control
                            className="form"
                            type="text"
                            // value={phone}
                            // onChange={(e) => setPhone(e.target.value)}
                            placeholder="비밀번호를 한 번 더 입력하세요"
                            required
                            style={{ width: '270px' }}
                        />
                        <Button type="submit" variant="primary mini-btn">
                            변경
                        </Button>
                    </div>
                </Form.Group>
            </Form>
        </Container>
    );
}
