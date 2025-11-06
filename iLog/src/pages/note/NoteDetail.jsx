// NoteDetail.jsx

import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Row, Col, Pagination, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { PencilSquare, CheckSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import MemberModal from './MemberModal';
import { getProjectDetails } from '../../api/note'; // createNote는 여기서 사용 안 함

export default function NoteDetail() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [project, setProject] = useState(null);
    const [subMeetings, setSubMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showMemberModal, setShowMemberModal] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 7;

    const fetchProjectDetails = async (projectId) => {
        setLoading(true);
        setError('');
        try {
            const data = await getProjectDetails(projectId);

            setProject({ id: data.folderId, name: data.folderName });

            // [✅✅✅ 여기를 수정합니다 ✅✅✅]
            const mappedMeetings = (data.childMinutes || [])
                .map((minute) => ({
                    // 1. [수정] minute.minuteId -> minute.id
                    id: minute.id,
                    name: minute.title || '제목 없음',
                    members: minute.members || '참가자 없음',
                    // 2. [수정] 오타 수정 (toLocaleDateDateString -> toLocaleDateString)
                    created: minute.createdAt ? new Date(minute.createdAt).toLocaleDateString() : '날짜 없음',
                    modified: minute.updatedAt ? new Date(minute.updatedAt).toLocaleDateString() : '날짜 없음',
                }))
                .reverse();

            setSubMeetings(mappedMeetings);
        } catch (err) {
            console.error('Failed to fetch details:', err);
            setError('프로젝트 정보를 불러오는 데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // [✅✅✅ 수정된 부분 ✅✅✅]
    useEffect(() => {
        // 1. 컴포넌트가 로드될 때 즉시 데이터를 가져옵니다.
        fetchProjectDetails(id);

        // 2. 'focus' 이벤트 리스너를 추가합니다.
        // (다른 페이지로 갔다가 이 탭으로 다시 돌아왔을 때 발생)
        const handleFocus = () => {
            console.log('💡 [NoteDetail] 탭이 다시 포커스되었습니다. 데이터 새로고침을 시도합니다.');
            fetchProjectDetails(id);
        };

        // 3. 이벤트 리스너 등록
        window.addEventListener('focus', handleFocus);

        // 4. 컴포넌트가 언마운트될 때(사라질 때) 리스너를 정리합니다.
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [id]); // id가 바뀔 때도 물론 새로고침합니다.
    // [✅✅✅ 수정 끝 ✅✅✅]

    const handleAddSubMeeting = () => {
        // 새 회의록 작성 페이지로 이동
        navigate('/notes/new', { state: { parentId: id } });
    };

    const handleRowClick = (meetingId) => {
        navigate(`/notes/meeting/${meetingId}`);
    };

    const handleShowMemberModal = () => setShowMemberModal(true);
    const handleCloseMemberModal = () => setShowMemberModal(false);

    // --- 페이지네이션 로직 ---
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
                <Spinner animation="border" role="status" />
                <h5 className="mt-2">로딩 중...</h5>
            </Container>
        );
    }

    if (error) {
        return (
            <Container fluid className="pt-3 text-center">
                <Alert variant="danger">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container fluid className="pt-3 container-left">
            {/* 1. 콘텐츠 영역 (flex-grow-1) */}
            <div className="flex-grow-1">
                {/* 프로젝트 타이틀 */}
                <Row className="mb-3 mt-3 align-items-center">
                    <Col xs="auto" style={{ visibility: 'hidden' }}>
                        <PersonPlus size={24} />
                    </Col>

                    <Col className="text-center">
                        <h2 className="fw-bold m-0">
                            <PencilSquare className="me-3" />
                            {project ? project.name : '프로젝트 로딩 중...'}
                        </h2>
                    </Col>

                    <Col xs="auto">
                        <PersonPlus size={24} style={{ cursor: 'pointer' }} onClick={handleShowMemberModal} />
                    </Col>
                </Row>

                {/* 하위 회의록 목록 테이블 */}
                <Table className="align-middle">
                    <thead>
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
