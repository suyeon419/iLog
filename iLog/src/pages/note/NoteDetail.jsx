// NoteDetail.jsx

import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Row, Col, Pagination, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { PencilSquare, CheckSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import MemberModal from './MemberModal';
import { getProjectDetails } from '../../api/note';

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

    // [✅✅✅ 여기가 최종 수정된 함수입니다 ✅✅✅]
    const fetchProjectDetails = async (projectId) => {
        setLoading(true);
        setError('');
        try {
            // 1. API 호출 (이 부분은 동일)
            const data = await getProjectDetails(projectId);

            setProject({ id: data.folderId, name: data.folderName });

            // 2. [수정] 'data.childMinutes' -> 'data.minutesList'
            const mappedMeetings = (data.minutesList || [])
                .map((minute) => ({
                    // 3. [수정] 'minute.id' (이건 원래 맞았음)
                    id: minute.id,

                    // 4. [수정] 'minute.title' -> 'minute.name'
                    name: minute.name || '제목 없음',

                    // 5. [수정] 'minute.members' (API에 없으므로 임시 처리)
                    members: minute.members || '...', // 'members' 키가 없으므로 '...'로 표시

                    // 6. [수정] 'minute.createdAt' (원래 맞았음)
                    created: minute.createdAt ? new Date(minute.createdAt).toLocaleDateString() : '날짜 없음',

                    // 7. [수정] 'minute.updatedAt' -> 'minute.approachedAt'
                    modified: minute.approachedAt ? new Date(minute.approachedAt).toLocaleDateString() : '날짜 없음',
                }))
                .reverse(); // 최신순 정렬

            setSubMeetings(mappedMeetings);
        } catch (err) {
            console.error('Failed to fetch details:', err);
            // 맵핑 실패 시에도 에러 메시지 표시
            setError('프로젝트 정보를 불러오는 데 실패했습니다. (데이터 맵핑 오류 가능성)');
        } finally {
            setLoading(false);
        }
    };
    // [✅✅✅ 수정 끝 ✅✅✅]

    // [✅ 탭 포커스 시 새로고침]
    useEffect(() => {
        fetchProjectDetails(id); // 1. 처음 로드 시 실행

        const handleFocus = () => {
            console.log('💡 [NoteDetail] 탭 포커스됨. 목록 새로고침 실행.');
            fetchProjectDetails(id); // 2. 탭으로 돌아올 때마다 실행
        };

        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [id]);

    const handleAddSubMeeting = () => {
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
