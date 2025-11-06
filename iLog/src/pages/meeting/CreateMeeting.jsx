import React, { useEffect, useState } from 'react';
import { Form, Button, Card, Container, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getUserById } from '../../api/user';
import axiosInstance from '../../api/axios';

export default function CreateMeeting() {
    const navigate = useNavigate();

    const [meetingURL, setMeetingURL] = useState('자동 주소 입력');
    const [name, setName] = useState('');
    const [video, setVideo] = useState(false);

    const [isLoading, setIsLoading] = useState(true);

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
                    })
                    .finally(() => {
                        setIsLoading(false);
                    });
            } catch (err) {
                console.error('❌ [JoinMeeting] JWT 디코딩 실패:', err);
                localStorage.removeItem('accessToken');
            }
        }
    }, []);

    //회의 주소 생성
    useEffect(() => {
        const randomRoom = `ilo9-${Math.random().toString(36).substring(2, 10)}`;
        setMeetingURL(`http://localhost:5173/meeting/${randomRoom}?room=${randomRoom}`);
    }, []);

    const handlerSubmit = (e) => {
        e.preventDefault();

        const roomName = meetingURL.split('/').pop().split('?')[0];

        navigate(`/meeting/${roomName}`, {
            state: {
                videoOff: video,
            },
        });
    };

    if (isLoading) {
        return (
            <Container
                className="d-flex flex-column justify-content-center align-items-center"
                style={{ height: '100vh' }}
            >
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">회원 정보를 불러오는 중입니다...</p>
            </Container>
        );
    }

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
                            <Form.Control type="text" value={meetingURL} required />
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
