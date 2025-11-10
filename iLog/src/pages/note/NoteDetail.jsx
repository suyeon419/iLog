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

        try {
            const data = await getProjectDetails(projectId);
            setProject({ id: data.folderId, name: data.folderName });

            // 👇 서버가 주는 순서를 그대로 사용
            const meetings = (data.minutesList || []).map((minute) => ({
                id: minute.id,
                name: minute.name || '제목 없음',
                members: minute.members || '-', // 서버가 이 필드에 참가자 요약을 담는다면 그대로
                created: minute.createdAt ? new Date(minute.createdAt).toLocaleDateString() : '날짜 없음',
                modified: minute.approachedAt ? new Date(minute.approachedAt).toLocaleDateString() : '날짜 없음',
            }));

            setSubMeetings(meetings); // ✅ 한 번만 set
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

            <MemberModal
                show={showMemberModal}
                onHide={handleCloseMemberModal}
                members={currentMembers}
                inviteLink={currentInviteLink}
            />
        </Container>
    );
}
