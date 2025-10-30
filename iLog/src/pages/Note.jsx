// Note.jsx

// 1. useRef, useState import 추가
import React, { useState, useRef } from 'react';
// 2. Container, Button, Card, Row, Col import
import { Container, Button, Card, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { PencilSquare } from 'react-bootstrap-icons';

// 3. CSS 파일 import (경로가 다를 경우 수정하세요)
// import './Note.css'; // -> Note.css를 사용하지 않으므로 주석 처리 (index.css가 전역 적용)

const initialProject = {
    id: 'lck-project', // ID를 문자열이나 숫자로 고유하게 설정
    name: 'LCK 팀프로젝트',
    members: '김가현 김우혁 이수연 최겸',
    created: '2025.00.00.',
    modified: '2025.00.00.',
    imageUrl: null, // 초기 이미지 null
};

export default function Note() {
    const navigate = useNavigate();
    const [items, setItems] = useState([initialProject]);

    const fileInputRef = useRef(null);
    const [targetItemId, setTargetItemId] = useState(null);

    /**
     * '추가' 또는 '변경' 버튼 클릭 시 실행
     */
    const handleTriggerFileInput = (e, id) => {
        e.stopPropagation(); // 카드 클릭(이동) 방지
        setTargetItemId(id); // 어느 item에 업로드할지 id 저장
        fileInputRef.current.click(); // 숨겨진 file input을 클릭
    };

    /**
     * 사용자가 파일 선택을 완료했을 때 실행
     */
    const handleFileChange = (e) => {
        const file = e.target.files[0]; // 선택된 파일

        if (file && targetItemId) {
            const reader = new FileReader();

            // 파일을 Data URL(Base64)로 읽기 완료
            reader.onloadend = () => {
                const newImageUrl = reader.result;

                // items 배열에서 대상 item의 imageUrl을 업데이트
                setItems((prevItems) =>
                    prevItems.map((item) => (item.id === targetItemId ? { ...item, imageUrl: newImageUrl } : item))
                );
                setTargetItemId(null); // 대상 id 초기화
            };

            reader.readAsDataURL(file); // 파일 읽기 시작
        }

        e.target.value = null; // file input 값 초기화
    };

    /**
     * 이미지 '삭제' 버튼 클릭 시 실행
     */
    const handleDeleteImage = (e, id) => {
        e.stopPropagation();
        setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, imageUrl: null } : item)));
    };

    /**
     * '새 회의 추가하기' 버튼 클릭 시 실행
     */
    const handleAddMeeting = () => {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '.') + '.';
        // ID를 숫자가 아닌 고유 문자열로 생성 (예: 'project-timestamp')
        const newId = `project-${Date.now()}`;

        const newMeeting = {
            id: newId,
            name: `새 프로젝트 ${items.length + 1}`,
            members: '참가자 없음', // 초기값
            created: today,
            modified: today,
            imageUrl: null,
        };

        setItems([...items, newMeeting]);
    };

    /**
     * 카드 클릭 시 실행 (NoteDetail로 이동)
     */
    const handleRowClick = (id) => {
        navigate(`/notes/${id}`); // '/notes/:id' 경로로 이동
    };

    return (
        <>
            {/* 4. container-left 클래스 적용 */}
            <Container>
                <h2 style={{ fontWeight: 'bold', color: '#333' }} className="mb-3">
                    <PencilSquare className="me-3" />
                    회의록
                </h2>

                {/* 5. 숨겨진 파일 입력(file input) */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept="image/*" // 이미지 파일만 선택
                />

                <Row>
                    {items.map((item) => (
                        <Col md={6} lg={4} className="mb-4" key={item.id}>
                            {/* 6. 카드에 인라인 스타일로 갈색 테두리 적용 */}
                            <Card
                                className="h-100" // h-100 클래스로 카드 높이 통일
                                style={{
                                    border: '2px solid #b66e03',
                                    borderRadius: '10px',
                                    overflow: 'hidden', // 테두리 끊어짐 방지
                                }}
                            >
                                {/* 7. 카드 이미지 영역 (호버 버튼 포함) */}
                                <div className="card-image-container" style={{ position: 'relative' }}>
                                    {item.imageUrl ? (
                                        <Card.Img
                                            variant="top"
                                            src={item.imageUrl}
                                            alt={item.name}
                                            style={{ height: '200px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                backgroundColor: '#f5f1ec',
                                                height: '200px',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                color: '#6c757d',
                                                fontSize: '0.9rem',
                                            }}
                                        >
                                            <span>사진을 추가해 주세요</span>
                                        </div>
                                    )}

                                    {/* 8. 마우스 호버 시 나타나는 버튼들 */}
                                    <div
                                        className="card-hover-buttons"
                                        style={{
                                            position: 'absolute',
                                            top: '10px',
                                            right: '10px',
                                            display: 'flex',
                                            gap: '5px',
                                        }}
                                    >
                                        {item.imageUrl ? (
                                            <>
                                                <Button
                                                    variant="light"
                                                    size="sm"
                                                    onClick={(e) => handleTriggerFileInput(e, item.id)}
                                                >
                                                    변경
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={(e) => handleDeleteImage(e, item.id)}
                                                >
                                                    삭제
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                variant="light"
                                                size="sm"
                                                onClick={(e) => handleTriggerFileInput(e, item.id)}
                                            >
                                                추가
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* 9. 카드 바디 (클릭 시 이동) */}
                                <Card.Body
                                    onClick={() => handleRowClick(item.id)}
                                    style={{ cursor: 'pointer', textAlign: 'center' }}
                                >
                                    <Card.Title style={{ fontWeight: 'bold' }} className="mb-2">
                                        {item.name}
                                    </Card.Title>

                                    <p style={{ fontSize: '0.95rem', color: '#6c757d' }}>{item.created}</p>

                                    <div className="mt-3">
                                        {item.members ? (
                                            item.members.split(' ').map((member, index) => (
                                                <p key={index} style={{ marginBottom: '0.25rem', fontWeight: '500' }}>
                                                    {member}
                                                </p>
                                            ))
                                        ) : (
                                            <p style={{ fontStyle: 'italic', color: '#aaa' }}>...</p>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* 10. '새 회의 추가하기' 버튼 */}
                <Button variant="primary" className="w-100 mt-3" onClick={handleAddMeeting}>
                    새 회의 추가하기
                </Button>
            </Container>
        </>
    );
}
