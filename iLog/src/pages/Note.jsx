// Note.jsx

import React, { useState, useRef } from 'react';
import { Container, Button, Card, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { PencilSquare } from 'react-bootstrap-icons';

import './Note.css'; // CSS 파일은 그대로 사용

const initialProject = {
    id: 1,
    name: '웹킷 팀프로젝트',
    members: '김가현 김우혁 이수연 최겸',
    created: '2025.00.00.',
    modified: '2025.00.00.',
    imageUrl: null,
};

export default function Note() {
    const navigate = useNavigate();
    const [items, setItems] = useState([initialProject]);

    const fileInputRef = useRef(null);
    const [targetItemId, setTargetItemId] = useState(null);

    const handleTriggerFileInput = (e, id) => {
        e.stopPropagation();
        setTargetItemId(id);
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (file && targetItemId) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newImageUrl = reader.result;
                setItems((prevItems) =>
                    prevItems.map((item) => (item.id === targetItemId ? { ...item, imageUrl: newImageUrl } : item))
                );
                setTargetItemId(null);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = null;
    };

    const handleDeleteImage = (e, id) => {
        e.stopPropagation();
        setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, imageUrl: null } : item)));
    };

    const handleAddMeeting = () => {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '.') + '.';
        const newId = `project-${Date.now()}`;

        const newMeeting = {
            id: newId,
            name: `새 회의 ${items.length + 1}`,
            members: '...',
            created: today,
            modified: today,
            imageUrl: null,
        };
        setItems([newMeeting, ...items]); // 새 항목을 맨 앞에 추가
    };

    const handleRowClick = (id) => {
        navigate(`/notes/${id}`);
    };
    // 여기까지 백엔드 들어오면 필요없음

    return (
        <>
            {/* 1. 'fluid' prop 제거 */}
            <Container className="pt-3">
                <h2 style={{ fontWeight: 'bold', color: '#333' }} className="mb-4">
                    <PencilSquare className="me-3" />
                    프로젝트
                </h2>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept="image/*"
                />

                <Row className="justify-content-center">
                    {items.map((item) => (
                        <Col md="auto" lg="auto" className="mb-4" key={item.id}>
                            <Card className="h-100 card-project">
                                <div className="card-image-container">
                                    {item.imageUrl ? (
                                        <Card.Img
                                            className="card-image-placeholder"
                                            variant="top"
                                            src={item.imageUrl}
                                            alt={item.name}
                                        />
                                    ) : (
                                        <div className="card-image-placeholder">
                                            <span>사진을 추가해 주세요</span>
                                        </div>
                                    )}

                                    <div className="card-hover-buttons">
                                        {item.imageUrl ? (
                                            <>
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

                <Button variant="primary" className="w-100 mt-3" onClick={handleAddMeeting}>
                    프로젝트 추가하기
                </Button>
            </Container>
        </>
    );
}
