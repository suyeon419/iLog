// NoteDetail.jsx

import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Row, Col, Pagination, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { PencilSquare, CheckSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import MemberModal from './MemberModal';
// [수정] API 함수 임포트
import { getProjectDetails, createNote } from '../../api/note';

// [삭제] DUMMY_MEETINGS 배열 삭제

export default function NoteDetail() {
    const navigate = useNavigate();
    const { id } = useParams(); // id는 URL의 folderId 입니다.

    const [project, setProject] = useState(null);
    const [subMeetings, setSubMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(''); // [추가] 에러 상태

    const [showMemberModal, setShowMemberModal] = useState(false);

    // --- 페이지네이션 상태 및 로직 ---
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 7;
    // -------------------------------

    // [수정] API 연동
    const fetchProjectDetails = async (projectId) => {
        setLoading(true);
        setError('');
        try {
            const data = await getProjectDetails(projectId);

            // 1. 프로젝트 정보 설정
            setProject({ id: data.folderId, name: data.folderName });

            // 2. 하위 회의록 목록 설정 (API 응답을 UI에 맞게 매핑)
            const mappedMeetings = (data.childMinutes || [])
                .map((minute) => ({
                    id: minute.minuteId,
                    name: minute.title || '제목 없음', // API 'title' -> UI 'name'
                    members: minute.members || '참가자 없음', // API 'members' -> UI 'members'
                    created: minute.createdAt ? new Date(minute.createdAt).toLocaleDateString() : '날짜 없음',
                    modified: minute.updatedAt ? new Date(minute.updatedAt).toLocaleDateString() : '날짜 없음',
                }))
                .reverse(); // 최신순으로 정렬 (필요시)

            setSubMeetings(mappedMeetings);
        } catch (err) {
            console.error('Failed to fetch details:', err);
            setError('프로젝트 정보를 불러오는 데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectDetails(id);
    }, [id]);

    // [수정] '회의 추가하기' 버튼 핸들러
    const handleAddSubMeeting = async () => {
        try {
            // 1. 새 회의록 기본 데이터 (Postman 이미지 참고)
            const defaultMeetingData = {
                title: '새 회의록',
                content: '', // 내용은 비워둠
                status: 'NO_MEETING',
            };

            // 2. API 호출 (id = folderId)
            const newMeeting = await createNote(id, defaultMeetingData);

            // 3. 생성된 회의록 상세 페이지로 즉시 이동
            if (newMeeting && newMeeting.minuteId) {
                navigate(`/notes/meeting/${newMeeting.minuteId}`);
            } else {
                console.error('새 회의록이 생성되었으나 ID를 받지 못했습니다.', newMeeting);
                alert('회의록 생성에 오류가 발생했습니다. 목록을 새로고침합니다.');
                fetchProjectDetails(id); // 목록 새로고침 (폴백)
            }
        } catch (err) {
            console.error('회의록 생성 실패:', err);
            alert('새 회의록을 생성하는 데 실패했습니다.');
        }
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

    // [수정] 로딩 및 에러 처리
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
                {/* 프로젝트 타이틀 (중앙 정렬) */}
                <Row className="mb-3 mt-3 align-items-center">
                    {/* ... (왼쪽 공백) ... */}
                    <Col xs="auto" style={{ visibility: 'hidden' }}>
                        <PersonPlus size={24} />
                    </Col>

                    {/* [수정] 중앙 타이틀 (API 데이터 사용) */}
                    <Col className="text-center">
                        <h2 className="fw-bold m-0">
                            <PencilSquare className="me-3" />
                            {project ? project.name : '프로젝트 로딩 중...'}
                        </h2>
                    </Col>

                    {/* ... (오른쪽 아이콘) ... */}
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
                        {/* [수정] API 데이터(currentMeetings)로 렌더링 */}
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

                {/* [수정] onClick 핸들러 변경 */}
                <Button variant="primary" className="w-100 mt-3" onClick={handleAddSubMeeting}>
                    회의 추가하기
                </Button>
            </div>

            <MemberModal show={showMemberModal} onHide={handleCloseMemberModal} />
        </Container>
    );
}
