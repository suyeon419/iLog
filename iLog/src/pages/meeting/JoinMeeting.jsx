import React, { useEffect, useState } from 'react';
import { Container, Form, Button, Card, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getUserById } from '../../api/user';
import { jwtDecode } from 'jwt-decode';

export default function JoinMeeting() {
    const navigate = useNavigate();

    const [meetingURL, setMeetingURL] = useState('');
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

    useEffect(() => {
        console.log('[TRACE] 부모 렌더링됨');
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // 입력값 정리
        let url = meetingURL.trim();

        // 프로토콜 자동 추가 (없을 경우)
        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }

        console.log('🌐 회의 참가 URL:', url);
        console.log('👤 참가자 이름:', name);
        console.log('🎥 비디오 끄기:', video);

        // URL에서 roomName 추출 (ex: https://webkit-ilo9-api.duckdns.org/meeting/ilo9-abcd123)
        const roomName = url.split('/').pop().split('?')[0];

        // React Router로 페이지 이동 + videoOff 값 전달
        navigate(`/meeting/${roomName}?room=${roomName}`, {
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
                    <span className="mini-logo pt-1">
                        <img src="/images/iLo9-white.png" alt="iLog Logo" />
                    </span>
                </Card.Header>

                {/* 본문 폼 */}
                <Card.Body>
                    <h3 className="mb-3" style={{ fontWeight: 'bold' }}>
                        회의 참가
                    </h3>

                    <Form onSubmit={handleSubmit}>
                        <Form.Group>
                            <Form.Label>회의 주소</Form.Label>
                            <Form.Control
                                type="text"
                                value={meetingURL}
                                onChange={(e) => setMeetingURL(e.target.value)}
                                placeholder="회의 주소를 입력하세요"
                                required
                            />
                        </Form.Group>

                        <Form.Group>
                            <Form.Label>참가자 이름</Form.Label>
                            <Form.Control type="text" value={name} placeholder="이름을 입력하세요" readOnly required />
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
