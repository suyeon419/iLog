// NoteDetail.jsx

import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { PencilSquare, CheckSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';
import MemberModal from './MemberModal';

const DUMMY_MEETINGS = [
    {
        id: 101, // 고유 ID
        name: '개발 진행 회의',
        members: '김가현 김우혁 이수연 최겸',
        created: '2025.00.00.',
        modified: '2025.00.00.',
    },
    {
        id: 102,
        name: '설계 구체화 회의',
        members: '김가현 김우혁 이수연 최겸',
        created: '2025.00.00.',
        modified: '2025.00.00.',
    },
    {
        id: 103,
        name: '설계 회의',
        members: '김가현 김우혁 최겸',
        created: '2025.00.00.',
        modified: '2025.00.00.',
    },
    {
        id: 104,
        name: '아이디어 회의',
        members: '김가현 김우혁 이수연 최겸',
        created: '2025.00.00.',
        modified: '2025.00.00.',
    },
];

export default function NoteDetail() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [project, setProject] = useState(null);
    const [subMeetings, setSubMeetings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showMemberModal, setShowMemberModal] = useState(false);

    const fetchProjectDetails = async (projectId) => {
        setLoading(true);
        try {
            // TODO: (1) 프로젝트 자체 정보 가져오기
            // ...
            // TODO: (2) 하위 회의록 목록 가져오기
            // ...

            // --- 지금은 API가 없으므로 임시 표시 ---
            setProject({ id: id, name: `웹킷 팀프로젝트` }); // 임시 제목
            setSubMeetings(DUMMY_MEETINGS);
            // ------------------------------------
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

    if (loading) {
        return (
            <Container fluid className="pt-3 text-center">
                <h5>로딩 중...</h5>
            </Container>
        );
    }

    return (
        <Container fluid className="pt-3 container-left">
            {/* 프로젝트 타이틀 (style -> className으로 변경) */}
            <Row className="mb-3 align-items-center">
                <Col>
                    {/* style을 className="fw-bold m-0"으로 변경 */}
                    <h2 className="fw-bold m-0">
                        <i class="bi bi-pen me-3"></i>
                        {project ? project.name : '...'}
                    </h2>
                </Col>
                <Col xs="auto">
                    {/* 불필요한 color 속성 제거 */}
                    <PersonPlus size={24} style={{ cursor: 'pointer' }} onClick={handleShowMemberModal} />
                </Col>
            </Row>

            {/* 하위 회의록 목록 테이블 (style -> className으로 변경) */}
            <Table className="align-middle">
                <thead>
                    <tr>
                        <th>
                            {/* style을 className="me-2"로 변경 */}
                            <CheckSquare className="me-2" /> 회의 이름
                        </th>
                        <th>
                            {/* style을 className="me-2"로 변경 */}
                            <People className="me-2" /> 참가자
                        </th>
                        <th>
                            {/* style을 className="me-2"로 변경 */}
                            <CalendarCheck className="me-2" /> 생성일자
                        </th>
                        <th>
                            {/* style을 className="me-2"로K로 변경 */}
                            <CalendarPlus className="me-2" /> 수정일자
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {subMeetings.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="text-center p-4">
                                하위 회의록이 없습니다.
                            </td>
                        </tr>
                    ) : (
                        subMeetings.map((meeting) => (
                            <tr
                                key={meeting.id}
                                onClick={() => handleRowClick(meeting.id)}
                                // cursor: pointer는 Bootstrap 클래스가 없으므로 유지
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

            <Button variant="primary" className="w-100 mt-3" onClick={handleAddSubMeeting}>
                회의 추가하기
            </Button>

            <MemberModal show={showMemberModal} onHide={handleCloseMemberModal} />
        </Container>
    );
}
