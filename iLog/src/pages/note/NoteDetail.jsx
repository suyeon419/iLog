// NoteDetail.jsx

import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Row, Col, Pagination, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { PencilSquare, CheckSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import MemberModal from './MemberModal';

import {
    getProjectDetails,
    getProjectMembers,
    addProjectMemberByEmail,
    getMeetingMembers,
    deleteProjectMember,
} from '../../api/note';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function NoteDetail() {
    const navigate = useNavigate();
    const { id } = useParams(); // 현재 프로젝트(폴더) ID

    const [project, setProject] = useState(null);
    const [subMeetings, setSubMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [currentMembers, setCurrentMembers] = useState([]);
    const [currentInviteLink, setCurrentInviteLink] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 7;

    const [members, setMembers] = useState();

    useEffect(() => {
        if (!project?.id) return;

        const loadMembers = async () => {
            try {
                const res = await getProjectMembers(project.id);
                setMembers(res.participants || []);
            } catch (err) {
                console.error(err);
            }
        };

        loadMembers();
    }, [project]);

    const fetchProjectDetails = async (projectId) => {
        setLoading(true);
        setError('');

        try {
            const data = await getProjectDetails(projectId);
            setProject({ id: data.folderId, name: data.folderName });

            // [1] 회의 목록을 최신순으로 정렬
            const sortedMinutes = (data.minutesList || []).sort((a, b) => {
                return (
                    (b.approachedAt ? new Date(b.approachedAt).getTime() : 0) -
                    (a.approachedAt ? new Date(a.approachedAt).getTime() : 0)
                );
            });

            // [2] 별도 API 호출 없이 바로 매핑 (수정된 부분)
            const meetings = sortedMinutes.map((minute) => {
                // API 응답 이미지에 있는 'minutesParticipants' 필드를 직접 사용
                const memberNames =
                    (minute.minutesParticipants || [])
                        .map((p) => p.participantName)
                        .filter(Boolean)
                        .join(', ') || '-';

                return {
                    id: minute.id,
                    name: minute.name || '제목 없음',
                    members: memberNames, // 바로 추출한 참가자 이름
                    created: minute.createdAt ? new Date(minute.createdAt).toLocaleDateString() : '날짜 없음',
                    modified: minute.approachedAt ? new Date(minute.approachedAt).toLocaleDateString() : '날짜 없음',
                };
            });

            setSubMeetings(meetings);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch details:', err);
            setError('회의록을 불러오는 데 실패했습니다.');
            setLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
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
            <Container className="pt-3 text-center">
                <LoadingSpinner animation="border" role="status" />
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
                <Row className="mb-3 mt-3 align-items-center">
                    <Col className="d-flex align-items-end">
                        <h1 className="fw-bold">
                            <i class="bi bi-pen me-2"></i>
                            {project ? project.name : ''}
                        </h1>
                        <h6 className="ms-3">
                            {members?.length > 0 ? members.map((m) => m.participantName).join(', ') : ' '}
                        </h6>
                    </Col>

                    <Col xs="auto">
                        <PersonPlus size={24} style={{ cursor: 'pointer' }} onClick={handleShowMemberModal} />
                    </Col>
                </Row>

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
                                    <td>{meeting.updated}</td>
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
                deleteMemberApi={deleteProjectMember}
            />
        </Container>
    );
}
