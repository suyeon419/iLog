// NoteDetail.jsx

import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Row, Col, Pagination, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { PencilSquare, CheckSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import MemberModal from './MemberModal';

// [수정 1] 멤버를 불러오는 API 함수를 임포트합니다.
// (주의: 'getProjectMembers'는 예시 이름입니다. 실제 함수 이름으로 변경하세요!)
import { getProjectDetails, getProjectMembers } from '../../api/note';

export default function NoteDetail() {
    const navigate = useNavigate();
    const { id } = useParams(); // 현재 프로젝트(폴더) ID

    const [project, setProject] = useState(null);
    const [subMeetings, setSubMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showMemberModal, setShowMemberModal] = useState(false);

    // [수정 2] 모달에 전달할 멤버 목록을 저장할 state 추가
    const [currentMembers, setCurrentMembers] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 7;

    // ... (fetchProjectDetails 함수는 동일) ...
    const fetchProjectDetails = async (projectId) => {
        setLoading(true);
        setError('');
        try {
            const data = await getProjectDetails(projectId);
            setProject({ id: data.folderId, name: data.folderName });

            const mappedMeetings = (data.minutesList || [])
                .map((minute) => ({
                    id: minute.id,
                    name: minute.name || '제목 없음',
                    members: minute.members || '...',
                    created: minute.createdAt ? new Date(minute.createdAt).toLocaleDateString() : '날짜 없음',
                    modified: minute.approachedAt ? new Date(minute.approachedAt).toLocaleDateString() : '날짜 없음',
                }))
                .reverse();

            setSubMeetings(mappedMeetings);
        } catch (err) {
            console.error('Failed to fetch details:', err);
            setError('프로젝트 정보를 불러오는 데 실패했습니다. (데이터 맵핑 오류 가능성)');
        } finally {
            setLoading(false);
        }
    };

    // ... (useEffect 탭 포커스 부분은 동일) ...
    useEffect(() => {
        fetchProjectDetails(id);

        const handleFocus = () => {
            console.log('💡 [NoteDetail] 탭 포커스됨. 목록 새로고침 실행.');
            fetchProjectDetails(id);
        };

        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, [id]);

    // ... (handleAddSubMeeting, handleRowClick 함수는 동일) ...
    const handleAddSubMeeting = () => {
        navigate('/notes/new', { state: { parentId: id } });
    };

    const handleRowClick = (meetingId) => {
        navigate(`/notes/meeting/${meetingId}`);
    };

    // [수정 3] 모달을 여는 함수 (API 호출 로직 추가)
    const handleShowMemberModal = async () => {
        try {
            // (주의: 'getProjectMembers'는 예시 이름입니다. 실제 함수 이름으로 변경하세요!)
            // GET /folders/{id}/party API를 호출합니다.
            const membersData = await getProjectMembers(id);

            // TODO: API 응답에 맞게 데이터 가공
            // (예시: membersData가 [{ id: 1, name: '김가현', email: '...', isLeader: true }] 형태라고 가정)
            setCurrentMembers(membersData);

            setShowMemberModal(true); // 데이터 로드 성공 시 모달 열기
        } catch (err) {
            console.error('Failed to fetch members:', err);
            alert('멤버 목록을 불러오는 데 실패했습니다.');
        }
    };

    // [수정 4] 모달을 닫는 함수 (state 초기화 로직 추가)
    const handleCloseMemberModal = () => {
        setShowMemberModal(false);
        setCurrentMembers([]); // 모달이 닫힐 때 목록 비우기
    };

    // --- 페이지네이션 로직 (동일) ---
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

    // ... (loading, error 처리 UI 동일) ...
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
                    {/* ... (thead 부분 동일) ... */}
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
                        {/* ... (tbody 맵핑 부분 동일) ... */}
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
                {/* ... (페이지네이션, 버튼 동일) ... */}
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

            {/* [수정 5] MemberModal에 members prop 전달 */}
            <MemberModal show={showMemberModal} onHide={handleCloseMemberModal} members={currentMembers} />
        </Container>
    );
}
