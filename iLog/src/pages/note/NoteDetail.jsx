// NoteDetail.jsx

import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Row, Col, Pagination, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { PencilSquare, CheckSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import MemberModal from './MemberModal';

import { getProjectDetails, getProjectMembers, addProjectMemberByEmail, getMeetingMembers } from '../../api/note';

export default function NoteDetail() {
    const navigate = useNavigate();
    const { id } = useParams(); // 현재 프로젝트(폴더) ID

    // ... (state 선언 동일) ...
    const [project, setProject] = useState(null);
    const [subMeetings, setSubMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [currentMembers, setCurrentMembers] = useState([]);
    const [currentInviteLink, setCurrentInviteLink] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 7;

    // const fetchProjectDetails = async (projectId) => {
    //     setLoading(true);
    //     setError('');

    //     try {
    //         const data = await getProjectDetails(projectId);
    //         setProject({ id: data.folderId, name: data.folderName });

    //         // [수정] 1. 원본 목록을 approachedAt (최종 접근/수정일) 기준으로 내림차순 정렬 (최신순)
    //         const sortedMinutes = (data.minutesList || []).sort((a, b) => {
    //             // b가 최신(값이 큼)이면 앞으로 오도록 (b - a)
    //             // 날짜가 없는 경우 0으로 처리하여 오류 방지
    //             return (
    //                 (b.approachedAt ? new Date(b.approachedAt).getTime() : 0) -
    //                 (a.approachedAt ? new Date(a.approachedAt).getTime() : 0)
    //             );
    //         });

    //         // [수정] 2. 정렬된 목록(sortedMinutes)을 기반으로 매핑
    //         const meetings = sortedMinutes.map((minute) => ({
    //             id: minute.id,
    //             name: minute.name || '제목 없음',
    //             members: minute.members || '-',
    //             created: minute.createdAt ? new Date(minute.createdAt).toLocaleDateString() : '날짜 없음',
    //             // API 응답의 'approachedAt'을 'modified'로 사용
    //             modified: minute.approachedAt ? new Date(minute.approachedAt).toLocaleDateString() : '날짜 없음',
    //         }));

    //         setSubMeetings(meetings);
    //         setLoading(false);
    //     } catch (err) {
    //         console.error('Failed to fetch details:', err);
    //         setError('회의록을 불러오는 데 실패했습니다.');
    //         setLoading(false);
    //     }
    // };

    const fetchProjectDetails = async (projectId) => {
        setLoading(true);
        setError('');

        try {
            const data = await getProjectDetails(projectId);
            setProject({ id: data.folderId, name: data.folderName });

            console.log('✅ [NoteDetail] getProjectDetails 응답 (원본 데이터):', data);

            // [1] 회의 목록을 최신순으로 정렬
            const sortedMinutes = (data.minutesList || []).sort((a, b) => {
                return (
                    (b.approachedAt ? new Date(b.approachedAt).getTime() : 0) -
                    (a.approachedAt ? new Date(a.approachedAt).getTime() : 0)
                );
            });

            // [2] 각 회의록별 참가자 목록 불러오기
            const meetings = await Promise.all(
                sortedMinutes.map(async (minute) => {
                    try {
                        const memberRes = await getMeetingMembers(minute.id); // ✅ 회의록 참가자 API 호출
                        console.log(`✅ [NoteDetail] 회의록 ID [${minute.id}]의 참가자 정보:`, memberRes);
                        const memberNames =
                            (memberRes.participants || [])
                                .map((p) => p.participantName)
                                .filter(Boolean)
                                .join(', ') || '-';

                        return {
                            id: minute.id,
                            name: minute.name || '제목 없음',
                            members: memberNames, // ✅ 실제 참가자 이름 표시
                            created: minute.createdAt ? new Date(minute.createdAt).toLocaleDateString() : '날짜 없음',
                            modified: minute.approachedAt
                                ? new Date(minute.approachedAt).toLocaleDateString()
                                : '날짜 없음',
                        };
                    } catch (err) {
                        console.error(`❌ 회의(${minute.id}) 참가자 로드 실패:`, err);
                        return {
                            id: minute.id,
                            name: minute.name || '제목 없음',
                            members: '-', // 실패 시 기본값
                            created: minute.createdAt ? new Date(minute.createdAt).toLocaleDateString() : '날짜 없음',
                            modified: minute.approachedAt
                                ? new Date(minute.approachedAt).toLocaleDateString()
                                : '날짜 없음',
                        };
                    }
                })
            );

            console.log('✅ [NoteDetail] 최종 가공된 회의록 목록 (subMeetings에 저장될 값):', meetings);
            // [3] 상태 업데이트
            setSubMeetings(meetings);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch details:', err);
            setError('회의록을 불러오는 데 실패했습니다.');
            setLoading(false);
        }
    };

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
    };

    const handleMemberUpdate = (updatedData) => {
        console.log('멤버 목록이 갱신되었습니다.', updatedData);
        setCurrentMembers(updatedData.participants || []);
        setCurrentInviteLink(updatedData.inviteLink || '');
    };

    // ... (페이지네이션 관련 로직은 모두 동일) ...
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

    // ... (loading, error 렌더링 부분은 모두 동일) ...
    if (loading) {
        return (
            <Container className="pt-3 text-center">
                <Spinner animation="border" role="status" />
                <h5 className="mt-2">로딩 중...</h5>
            </Container>
        );
    }

    if (error) {
        return (
            <Container fluid className="pt-3 container-left">
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

                <div></div>
            </Container>
        );
    }

    return (
        <Container fluid className="pt-3 container-left">
            <div className="flex-grow-1">
                {/* ... (상단 Row 동일) ... */}
                <Row className="mb-3 mt-3 align-items-center">
                    <Col xs="auto" style={{ visibility: 'hidden' }}>
                        <PersonPlus size={24} />
                    </Col>

                    <Col className="text-center">
                        <h2 className="fw-bold m-0">{project ? project.name : '프로젝트 로딩 중...'}</h2>
                    </Col>

                    <Col xs="auto">
                        <PersonPlus size={24} style={{ cursor: 'pointer' }} onClick={handleShowMemberModal} />
                    </Col>
                </Row>

                {/* ... (테이블 동일) ... */}
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
                            {/* [수정] '접근일자' -> '수정일자'로 텍스트 변경 */}
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

            {/* 2. 하단 고정 영역 (페이지네이션 + 버튼) (동일) */}
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

            {/* 모달 (동일) */}
            <MemberModal
                show={showMemberModal}
                onHide={handleCloseMemberModal}
                members={currentMembers}
                inviteLink={currentInviteLink}
                entityId={id}
                addMemberApi={addProjectMemberByEmail}
                onMemberUpdate={handleMemberUpdate}
            />
        </Container>
    );
}
