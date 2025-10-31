// Note.jsx

import React, { useState, useRef } from 'react';
// Pagination을 import 합니다.
import { Container, Button, Card, Row, Col, Pagination } from 'react-bootstrap'; // <-- 변경
import { useNavigate } from 'react-router-dom';
import { PencilSquare } from 'react-bootstrap-icons';

import './Note.css';

// 테스트를 위해 데이터를 5개로 늘렸습니다. 1개로 줄이면 페이지네이션이 사라집니다.
const initialProjects = [
    {
        id: 1,
        name: '웹킷 팀프로젝트',
        members: '김가현 김우혁 이수연 최겸',
        created: '2025.00.00.',
        modified: '2025.00.00.',
        imageUrl: null,
    },
    {
        id: 2,
        name: '4-1 창설 프로젝트',
        members: '김가현 김우혁 이수연 최겸',
        created: '2025.00.00.',
        modified: '2025.00.00.',
        imageUrl: null,
    },
    {
        id: 3,
        name: '3-2 오픈소스',
        members: '김가현 김우혁 이수연 최겸',
        created: '2025.00.00.',
        modified: '2025.00.00.',
        imageUrl: null,
    },
    {
        id: 4,
        name: '3-2 임베디드',
        members: '김가현 김우혁 이수연 최겸',
        created: '2025.00.00.',
        modified: '2025.00.00.',
        imageUrl: null,
    },
    {
        id: 5,
        name: 'iLog 회의록',
        members: '김가현 김우혁 이수연 최겸',
        created: '2025.00.00.',
        modified: '2025.00.00.',
        imageUrl: null,
    },
];

export default function Note() {
    const navigate = useNavigate();
    const [items, setItems] = useState(initialProjects); // <-- 변경

    // --- 페이지네이션 상태 및 로직 ---
    const [currentPage, setCurrentPage] = useState(1); // <-- 변경: 현재 페이지 상태
    const ITEMS_PER_PAGE = 4; // <-- 변경: 페이지당 4개씩
    // -------------------------------

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
        setCurrentPage(1); // <-- 변경: 새 프로젝트 추가 시 1페이지로 이동
    };

    const handleRowClick = (id) => {
        navigate(`/notes/${id}`);
    };
    // 여기까지 백엔드 들어오면 필요없음

    // --- 페이지네이션 로직 ---
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    // .slice()를 사용해 현재 페이지에 보여줄 4개의 아이템만 자릅니다.
    const currentItems = items.slice(indexOfFirstItem, indexOfLastItem); // <-- 변경

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // 페이지 번호를 렌더링하는 함수
    const renderPaginationItems = () => {
        let pageItems = [];
        for (let number = 1; number <= totalPages; number++) {
            pageItems.push(
                <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>
                    {number}
                </Pagination.Item>
            );
        }
        return pageItems;
    };
    // ------------------------

    return (
        <>
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
                    {currentItems.map((item) => (
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

                {/* --- 페이지네이션 컴포넌트 추가 --- */}
                {totalPages > 1 && (
                    <nav className="mt-3 pagination-nav">
                        {' '}
                        {/* <-- 변경 */}
                        <Pagination className="justify-content-center">
                            <Pagination.Prev
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            />
                            {renderPaginationItems()}
                            <Pagination.Next
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            />
                        </Pagination>
                    </nav>
                )}

                <Button variant="primary" className="w-100 mt-3" onClick={handleAddMeeting}>
                    프로젝트 추가하기
                </Button>
            </Container>
        </>
    );
}
