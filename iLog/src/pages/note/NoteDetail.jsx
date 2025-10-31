// NoteDetail.jsx

import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Row, Col, Pagination } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { PencilSquare, CheckSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import MemberModal from './MemberModal';

const DUMMY_MEETINGS = [
    {
        id: 101,
        name: '개발 진행 회의',
        members: '김가현 김우혁 이수연 최겸',
        created: '2025.00.00.',
        modified: '2025.00.00.',
    },
    { id: 102, name: '설계 구체화 회의', members: '김가현 김우혁', created: '2025.00.00.', modified: '2025.00.00.' },
    { id: 103, name: '설계 회의', members: '김가현 이수연 최겸', created: '2025.00.00.', modified: '2025.00.00.' },
    { id: 104, name: '아이디어 회의', members: '김우혁 이수연', created: '2025.00.00.', modified: '2025.00.00.' },
    { id: 105, name: '5차 회의', members: '최겸', created: '2025.00.00.', modified: '2025.00.00.' },
    {
        id: 106,
        name: '6차 회의',
        members: '김가현 김우혁 이수연 최겸',
        created: '2025.00.00.',
        modified: '2025.00.00.',
    },
    { id: 107, name: '7차 회의', members: '김가현', created: '2025.00.00.', modified: '2025.00.00.' },
    { id: 108, name: '8차 회의', members: '김우혁', created: '2025.00.00.', modified: '2025.00.00.' },
];

export default function NoteDetail() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [project, setProject] = useState(null);
    const [subMeetings, setSubMeetings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showMemberModal, setShowMemberModal] = useState(false);

    // --- 페이지네이션 상태 및 로직 ---
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 7;
    // -------------------------------

    const fetchProjectDetails = (projectId) => {
        setLoading(true);
        try {
            setProject({ id: id, name: `웹킷 팀프로젝트` });
            setSubMeetings(DUMMY_MEETINGS);
        } catch (error) {
            console.error('Failed to fetch details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectDetails(id);
    }, [id]);

    const handleAddSubMeeting = () => {
        navigate('/notes/new', { state: { parentId: id } });
    };

    const handleRowClick = (meetingId) => {
        navigate(`/notes/meeting/${meetingId}`);
    };

    const handleShowMemberModal = () => setShowMemberModal(true);
    const handleCloseMemberModal = () => setShowMemberModal(false);

    // --- 페이지네이션 로직 (기존과 동일) ---
    const totalPages = Math.ceil(subMeetings.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentMeetings = subMeetings.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        const newPage = Math.max(1, Math.min(pageNumber, totalPages === 0 ? 1 : totalPages));
        setCurrentPage(newPage);
    };

    const renderPaginationItems = () => {
        let pageItems = [];
        const total = totalPages === 0 ? 1 : totalPages;
        for (let number = 1; number <= total; number++) {
            pageItems.push(
                <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>
                    {number}
                </Pagination.Item>
            );
        }
        return pageItems;
    };
    // ------------------------

    if (loading) {
        return (
            <Container fluid className="pt-3 text-center">
                <h5>로딩 중...</h5>
            </Container>
        );
    }

    return (
        <Container fluid className="pt-3 container-left">
            {/* 1. 콘텐츠 영역 (flex-grow-1) */}
            <div className="flex-grow-1">
                {/* [수정] 프로젝트 타이틀 (중앙 정렬) */}
                <Row className="mb-3 mt-3 align-items-center">
                    {/* 1. 왼쪽 공백 (오른쪽 아이콘과 너비를 맞추기 위함) */}
                    <Col xs="auto" style={{ visibility: 'hidden' }}>
                        <PersonPlus size={24} />
                    </Col>

                    {/* 2. 중앙 타이틀 */}
                    <Col className="text-center">
                        <h2 className="fw-bold m-0">
                            <PencilSquare className="me-3" />
                            {project ? project.name : '...'}
                        </h2>
                    </Col>

                    {/* 3. 오른쪽 아이콘 */}
                    <Col xs="auto">
                        <PersonPlus size={24} style={{ cursor: 'pointer' }} onClick={handleShowMemberModal} />
                    </Col>
                </Row>
                {/* ------------------------------------- */}

                {/* 하위 회의록 목록 테이블 */}
                <Table className="align-middle">
                    <thead>
                        {/* ... (thead 내용) ... */}
                        <tr>
                            <th>
                                <CheckSquare className="me-2" /> 회의 이름
                            </th>
                            <th>
                                <People className="me-2" /> 참가자
                            </th>
                            <th>
                                <CalendarCheck className="me-2" /> 생성일자
                            </th>
                            <th>
                                <CalendarPlus className="me-2" /> 수정일자
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentMeetings.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center p-4">
                                    하위 회의록이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            currentMeetings.map((meeting) => (
                                <tr
                                    key={meeting.id}
                                    onClick={() => handleRowClick(meeting.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td>{meeting.name}</td>
                                    <td>{meeting.members}</td>
                                    <td>{meeting.created}</td>
                                    <td>{meeting.modified}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>

            {/* 2. 하단 고정 영역 (페이지네이션 + 버튼) */}
            <div>
                <nav className="mt-3 pagination-nav">
                    {/* ... (Pagination 내용) ... */}
                    <Pagination className="justify-content-center">
                        <Pagination.Prev
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        />
                        {renderPaginationItems()}
                        <Pagination.Next
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === (totalPages === 0 ? 1 : totalPages)}
                        />
                    </Pagination>
                </nav>

                <Button variant="primary" className="w-100 mt-3" onClick={handleAddSubMeeting}>
                    회의 추가하기
                </Button>
            </div>

            <MemberModal show={showMemberModal} onHide={handleCloseMemberModal} />
        </Container>
    );
}
