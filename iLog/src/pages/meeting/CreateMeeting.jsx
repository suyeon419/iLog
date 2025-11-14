import React, { useEffect, useState } from 'react';
import { Form, Button, Card, Container, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { getUserById } from '../../api/user';
import { startJitsiMeeting } from '../../api/jitsi';
import axiosInstance from '../../api/axios';

export default function CreateMeeting() {
    const navigate = useNavigate();

    const [meetingURL, setMeetingURL] = useState('자동 주소 입력');
    const [fullUrl, setFullUrl] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
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
                        console.log('🧾 [CreateMeeting] getUserById 응답:', data);
                        if (data && data.name) {
                            setName(data.name);
                            setEmail(data.email);
                        } else if (data?.data?.name) {
                            setName(data.data.name);
                            setEmail(data.email);
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

    // 회의 주소 생성
    useEffect(() => {
        const randomRoom = `ilo9-${Math.random().toString(36).substring(2, 10)}`;
        setMeetingURL(`/meeting/${randomRoom}?room=${randomRoom}`); // ✅ 절대 URL 말고 상대경로만
    }, []);

    useEffect(() => {
        if (meetingURL) {
            setFullUrl(`${window.location.origin}${meetingURL}`);
        }
    }, [meetingURL]);

    const handlerSubmit = async (e) => {
        e.preventDefault();

        // meetingURL에서 방 이름 추출
        const roomName = meetingURL.split('/')[2].split('?')[0];

        // 이동할 URL 생성
        const url = `/meeting/${roomName}?room=${roomName}`;

        console.log('📨 [CreateMeeting] 회의방 생성 요청:', {
            roomName,
            name,
            email,
            meetingURL,
        });
        // // Jitsi JWT 요청 (userName, userEmail 전달)
        // await startJitsiMeeting({
        //     roomName,
        //     userName: name,
        //     userEmail: email,
        // });

        navigate(url, {
            state: { videoOff: video, isHost: true },
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
                        회의 만들기
                    </h3>

                    <Form onSubmit={handlerSubmit}>
                        <Form.Group>
                            <Form.Label className="mb-0">회의 주소</Form.Label>
                            <Form.Control type="text" value={fullUrl} required />
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
