// NoteDetail.jsx

import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Row, Col, Pagination, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { PencilSquare, CheckSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import MemberModal from './MemberModal';

import { getProjectDetails, getProjectMembers, getNoteDetails } from '../../api/note';

export default function NoteDetail() {
    const navigate = useNavigate();
    const { id } = useParams(); // 현재 프로젝트(폴더) ID

    // ... (모든 state 선언은 동일) ...
    const [project, setProject] = useState(null);
    const [subMeetings, setSubMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [currentMembers, setCurrentMembers] = useState([]);
    const [currentInviteLink, setCurrentInviteLink] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 7;

    const fetchProjectDetails = async (projectId) => {
        setLoading(true);
        setError('');
        let initialMeetings = []; // 👈 [수정] 2차 로딩을 위해 변수 분리

        // --- 1단계: 회의록 목록 우선 로드 ---
        try {
            const data = await getProjectDetails(projectId);
            setProject({ id: data.folderId, name: data.folderName });

            initialMeetings = (data.minutesList || []) // 👈 [수정]
                .map((minute) => ({
                    id: minute.id,
                    name: minute.name || '제목 없음',
                    members: minute.members || '...', // 👈 초기값 '...'
                    created: minute.createdAt ? new Date(minute.createdAt).toLocaleDateString() : '날짜 없음',
                    modified: minute.approachedAt ? new Date(minute.approachedAt).toLocaleDateString() : '날짜 없음',
                }))
                .reverse();

            setSubMeetings(initialMeetings); // 👈 1차 렌더링 (참가자는 '...')
            setLoading(false); // 👈 1차 로딩 완료, 스피너 숨기기
        } catch (err) {
            console.error('Failed to fetch details:', err);
            setError('회의록을 불러오는 데 실패했습니다.');
            setLoading(false); // 👈 실패 시에도 로딩 중지
            return; // 2차 로딩 시도 중지
        }

        // ==========================================================
        // 👇👇👇 [신규] 2단계: 개별 회의록 참가자 로딩 👇👇👇
        // ==========================================================
        try {
            console.log(`💡 [NoteDetail] 2. 총 ${initialMeetings.length}개 회의록 순회 시작.`);

            for (const meetingToLoad of initialMeetings) {
                try {
                    // 1. 개별 회의록 상세 정보 API 호출
                    const detailData = await getNoteDetails(meetingToLoad.id);

                    // ⭐️ (가정) API 응답 구조: { ..., participants: [{ participantName: '...' }] }
                    const participantsArray = detailData.participants;
                    let membersString = '참가자 없음';

                    if (participantsArray && participantsArray.length > 0) {
                        // 2. (가정) 이름이 participantName 속성에 있음
                        membersString = participantsArray.map((m) => m.participantName).join(' ');
                    }

                    console.log(`✅ [NoteDetail] (ID: ${meetingToLoad.id}) 참가자 로드 성공.`);

                    // 3. state 업데이트
                    setSubMeetings((prevMeetings) =>
                        prevMeetings.map((m) => (m.id === meetingToLoad.id ? { ...m, members: membersString } : m))
                    );
                } catch (err) {
                    console.error(
                        `❌ [NoteDetail] (ID: ${meetingToLoad.id}) 개별 회의록 로드 실패:`,
                        err.response || err.message
                    );
                    setSubMeetings((prevMeetings) =>
                        prevMeetings.map((m) => (m.id === meetingToLoad.id ? { ...m, members: '조회 실패' } : m))
                    );
                }
            }
            console.log('💡 [NoteDetail] 9. 개별 회의록 순회 완료.');
        } catch (err) {
            console.error('❌ [NoteDetail] 개별 회의록 순회 중 전체 오류:', err);
        }
        // ==========================================================
        // 👆👆👆 [신규] 2단계 로딩 끝 👆👆👆
        // ==========================================================
    };

    // ... (useEffect, handleAddSubMeeting, handleRowClick, Modals, Pagination 로직 모두 동일) ...
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

    const handleAddSubMeeting = () => {
        navigate('/notes/new', { state: { parentId: id } });
    };

    const handleRowClick = (meetingId) => {
        navigate(`/notes/meeting/${meetingId}`);
    };

    const handleShowMemberModal = async () => {
        try {
            const responseData = await getProjectMembers(id);
            setCurrentMembers(responseData.participants || []);
            setCurrentInviteLink(responseData.inviteLink || '');
            setShowMemberModal(true);
        } catch (err) {
            console.error('Failed to fetch members:', err);
            alert('멤버 목록을 불러오는 데 실패했습니다.');
        }
    };

    const handleCloseMemberModal = () => {
        setShowMemberModal(false);
        setCurrentMembers([]);
        setCurrentInviteLink('');
    };

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

    // ... (loading 처리 UI 동일) ...
    if (loading) {
        return (
            <Container className="pt-3 text-center">
                <Spinner animation="border" role="status" />
                <h5 className="mt-2">로딩 중...</h5>
            </Container>
        );
    }

    // [✅ 수정] if (error) 블록을 수정하여
    // 성공 시와 동일한 flex 구조(flex-grow-1)를 유지하도록 변경
    if (error) {
        return (
            // 1. .container-left 스타일 유지 (flex-direction: column)
            <Container fluid className="pt-3 container-left">
                {/* 2. 콘텐츠 영역 (flex-grow-1) */}
                {/* 이 div가 남은 공간을 모두 차지하고(flex-grow-1),
                   내부 아이템(에러 메시지)을 수직/수평 중앙 정렬합니다. */}
                <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center">
                    <div className="text-center">
                        <Alert variant="danger" className="mb-3">
                            {error}
                        </Alert>
                        <Button
                            variant="outline-secondary"
                            onClick={() => navigate(-1)} // -1: 이전 페이지(목록)로 이동
                        >
                            목록으로 돌아가기
                        </Button>
                    </div>
                </div>

                {/* 3. 하단 고정 영역 (페이지네이션 등) */}
                {/* 성공 상태와 구조를 맞추기 위해 빈 div를 유지합니다. */}
                <div></div>
            </Container>
        );
    }

    // ... (성공 시 렌더링하는 return 문은 동일) ...
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

            {/* [수정 없음] MemberModal에 'members'와 'inviteLink' prop을 모두 전달 */}
            <MemberModal
                show={showMemberModal}
                onHide={handleCloseMemberModal}
                members={currentMembers}
                inviteLink={currentInviteLink}
            />
        </Container>
    );
}
