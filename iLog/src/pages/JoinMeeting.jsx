import React from 'react';
import { Container, Form, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function JoinMeeting() {
    const navigate = useNavigate();
    return (
        <Container>
            <Card className="meetingcard">
                {/* 헤더 부분 */}
                <Card.Header className="cardHeader">
                    <span className="mini-logo">
                        <img src="/images/iLogLogo.png" alt="iLog Logo" style={{ height: '20px' }} />
                    </span>
                </Card.Header>

                {/* 본문 폼 */}
                <Card.Body>
                    <h5 className="text-center mb-4" style={{ fontWeight: 'bold' }}>
                        회의 참가
                    </h5>

                    <Form>
                        <Form.Group>
                            <Form.Label>회의 주소</Form.Label>
                            <Form.Control type="text" placeholder="회의 주소를 입력하세요" required />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>참가자 이름</Form.Label>
                            <Form.Control type="text" placeholder="이름을 입력하세요" required />
                        </Form.Group>

                        <Form.Group className="mt-4">
                            <Form.Check type="checkbox" label="내 비디오 끄기" />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="outline-primary" type="button" onClick={() => navigate('/meeting/create')}>
                                생성
                            </Button>
                            <Button variant="primary " type="submit">
                                참가
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}
