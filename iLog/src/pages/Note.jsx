import React, { useState, useRef } from 'react';
import { Container, Button, Card, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { PencilSquare, People, CalendarCheck, CalendarPlus } from 'react-bootstrap-icons';

import './Note.css'; // CSS 파일은 그대로 사용

const initialProject = {
    id: 1,
    name: 'LCK 팀프로젝트',
    members: '김가현 김우혁 이수연 최겸',
    created: '2025.00.00.',
    modified: '2025.00.00.',
    imageUrl: null, // 초기 이미지를 null로 변경 (테스트용)
};

export default function Note() {
    const navigate = useNavigate();
    const [items, setItems] = useState([initialProject]);

    // 2. 숨겨진 file input에 접근하기 위한 ref 생성
    const fileInputRef = useRef(null);
    // 3. 현재 이미지를 업로드할 대상 item의 id를 저장할 state
    const [targetItemId, setTargetItemId] = useState(null);

    /**
     * '추가' 또는 '변경' 버튼 클릭 시 실행
     * - (e) 이벤트 객체, (id) 대상 item의 id
     */
    const handleTriggerFileInput = (e, id) => {
        e.stopPropagation(); // 카드 클릭(이동) 방지
        setTargetItemId(id); // 4. 어느 item에 업로드할지 id 저장
        fileInputRef.current.click(); // 5. 숨겨진 file input을 클릭
    };

    /**
     * 사용자가 파일 선택을 완료했을 때 실행
     */
    const handleFileChange = (e) => {
        const file = e.target.files[0]; // 선택된 파일

        // 6. 파일과 대상 id가 모두 있어야 실행
        if (file && targetItemId) {
            const reader = new FileReader();

            // 7. 파일을 Data URL(Base64)로 읽기 완료
            reader.onloadend = () => {
                const newImageUrl = reader.result;

                // 8. items 배열에서 대상 item의 imageUrl을 업데이트
                setItems((prevItems) =>
                    prevItems.map((item) => (item.id === targetItemId ? { ...item, imageUrl: newImageUrl } : item))
                );
                setTargetItemId(null); // 대상 id 초기화
            };

            reader.readAsDataURL(file); // 9. 파일 읽기 시작
        }

        // 10. file input 값을 초기화 (같은 파일 재업로드 시 onChange가 실행되도록)
        e.target.value = null;
    };

    const handleDeleteImage = (e, id) => {
        e.stopPropagation();
        setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, imageUrl: null } : item)));
    };

    const handleAddMeeting = () => {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '.') + '.';
        const maxId = items.reduce((max, item) => (item.id > max ? item.id : max), 0);
        const newId = maxId + 1;

        const newMeeting = {
            id: newId,
            name: `새 회의 ${items.length}`,
            members: '',
            created: today,
            modified: '',
            imageUrl: null,
        };

        setItems([...items, newMeeting]);
    };

    const handleRowClick = (id) => {
        navigate(`/notes/${id}`);
    };
    // 여기까지 백엔드 들어오면 필요없음

    return (
        <>
            <Container>
                <h2 style={{ fontWeight: 'bold', color: '#333' }} className="mb-3">
                    <PencilSquare className="me-3" />
                    회의록
                </h2>

                {/* 11. 숨겨진 파일 입력(file input) */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept="image/*" // 이미지 파일만 선택 가능하도록
                />

                <Row>
                    {items.map((item) => (
                        <Col md={6} lg={3} className="mb-4" key={item.id}>
                            <Card className="h-100 card-project ">
                                <div className="card-image-container">
                                    {item.imageUrl ? (
                                        <Card.Img top src={item.imageUrl} alt={item.name} />
                                    ) : (
                                        <div className="card-image-placeholder">
                                            <span>사진을 추가해 주세요</span>
                                        </div>
                                    )}

                                    <div className="card-hover-buttons">
                                        {item.imageUrl ? (
                                            <>
                                                {/* 12. '변경' 버튼 클릭 시 handleTriggerFileInput 실행 */}
                                                <Button
                                                    variant="light"
                                                    className="btn-change"
                                                    onClick={(e) => handleTriggerFileInput(e, item.id)}
                                                >
                                                    변경
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    className="btn-delete"
                                                    onClick={(e) => handleDeleteImage(e, item.id)}
                                                >
                                                    삭제
                                                </Button>
                                            </>
                                        ) : (
                                            // 13. '추가' 버튼 클릭 시 handleTriggerFileInput 실행
                                            <Button
                                                variant="light"
                                                className="btn-add"
                                                onClick={(e) => handleTriggerFileInput(e, item.id)}
                                            >
                                                추가
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <Card.Body
                                    onClick={() => handleRowClick(item.id)}
                                    style={{ cursor: 'pointer' }}
                                    className="text-center"
                                >
                                    {/* 1. 프로젝트 이름 (Card.Title) */}
                                    <Card.Title style={{ fontWeight: 'bold' }} className="mb-2">
                                        {item.name}
                                    </Card.Title>

                                    {/* 2. 생성일자 (Card.Subtitle 또는 p 태그) */}
                                    {/* <hr/> 제거, 레이블 제거 */}
                                    <p style={{ fontSize: '0.95rem', color: '#6c757d' }}>{item.created}</p>

                                    {/* 3. 참가자 이름 (수직 나열) */}
                                    {/* 'item.members'가 공백으로 구분된 문자열이라고 가정 */}
                                    <div className="mt-3">
                                        {item.members ? (
                                            item.members.split(' ').map((member, index) => (
                                                // 각 이름을 별도의 <p> 태그로 렌더링
                                                <p key={index} style={{ marginBottom: '0.25rem', fontWeight: '500' }}>
                                                    {member}
                                                </p>
                                            ))
                                        ) : (
                                            // 참가자가 없을 경우
                                            <p style={{ fontStyle: 'italic', color: '#aaa' }}>...</p>
                                        )}
                                    </div>

                                    {/* 수정일자는 요청하신 디자인에서 제외되어 제거했습니다. */}
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                <Button variant="primary" className="w-100 mt-3" onClick={handleAddMeeting}>
                    프로젝트 추가하기
                </Button>
            </Container>
        </>
    );
}
