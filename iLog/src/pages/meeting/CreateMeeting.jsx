import React, { useEffect, useState } from 'react';
import { Form, Button, Card, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getUserById } from '../../api/user';

export default function CreateMeeting() {
    const navigate = useNavigate();

    const [meetingURL, setMeetingURL] = useState('자동 주소 입력');
    const [name, setName] = useState('');
    const [video, setVideo] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const decoded = jwtDecode(token); // ✅ 토큰에서 id 추출
                const userId = decoded.id;

                getUserById(userId)
                    .then((data) => {
                        if (data && data.name) {
                            setName(data.name);
                        } else if (data?.data?.name) {
                            setName(data.data.name);
                        }
                    })
                    .catch((err) => {
                        console.error('❌ [JoinMeeting] 사용자 정보 요청 실패:', err);
                    });
            } catch (err) {
                console.error('❌ [JoinMeeting] JWT 디코딩 실패:', err);
                localStorage.removeItem('accessToken');
            }
        }
    }, []);

    const handlerSubmit = (e) => {
        e.preventDefault();

        console.log('meeting: ', meetingURL);
        console.log('name: ', name);
        console.log('video: ', video);

        navigate('/meeting/:meetingId');
    };
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
                    <h3 className="mb-3" style={{ fontWeight: 'bold' }}>
                        회의 만들기
                    </h3>

                    <Form onSubmit={handlerSubmit}>
                        <Form.Group>
                            <Form.Label className="mb-0">회의 주소</Form.Label>
                            <Form.Control type="text" value={meetingURL} required readOnly />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>참가자 이름</Form.Label>
                            <Form.Control type="text" value={name} placeholder="이름을 입력하세요" required readOnly />
                        </Form.Group>

                        <Form.Group className="mt-4">
                            <Form.Check
                                type="checkbox"
                                checked={video}
                                onChange={(e) => setVideo(e.target.checked)}
                                label="내 비디오 끄기"
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-end gap-2">
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
