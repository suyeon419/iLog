// NoteDetail.jsx (수정됨)

import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { PencilSquare, CheckSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';

// 1. 이미지(image_e296b1.png) 기반의 더미 데이터
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
    const { id } = useParams(); // URL에서 현재 ID (e.g., '1')를 가져옴

    const [project, setProject] = useState(null);
    const [subMeetings, setSubMeetings] = useState([]); // 하위 회의 목록
    const [loading, setLoading] = useState(true);

    const fetchProjectDetails = async (projectId) => {
        setLoading(true);
        try {
            // TODO: (1) 프로젝트 자체 정보 가져오기
            // ...
            // TODO: (2) 하위 회의록 목록 가져오기
            // ...

            // --- 지금은 API가 없으므로 임시 표시 ---
            setProject({ id: id, name: `LCK 팀프로젝트` }); // 임시 제목
            // 2. setSubMeetings([]) 대신 더미 데이터로 설정
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

    // 3. 하위 회의록 클릭 시 세부 페이지로 이동하는 핸들러
    const handleRowClick = (meetingId) => {
        // 새 경로로 이동 (예: /notes/meeting/101)
        navigate(`/notes/meeting/${meetingId}`);
    };

    if (loading) {
        return (
            <Container fluid className="pt-3 text-center">
                <h5>로딩 중...</h5>
            </Container>
        );
    }

    return (
        <Container fluid className="pt-3 container-left">
            {/* 프로젝트 타이틀 */}
            <Row className="mb-3 align-items-center">
                <Col>
                    <h2 style={{ fontWeight: 'bold', color: '#333', margin: 0 }}>
                        <PencilSquare style={{ marginRight: '10px' }} />
                        {project ? project.name : '...'}
                    </h2>
                </Col>
                <Col xs="auto">
                    <PersonPlus size={24} style={{ cursor: 'pointer', color: '#333' }} />
                </Col>
            </Row>

            {/* 하위 회의록 목록 테이블 */}
            <Table style={{ verticalAlign: 'middle', color: '#333' }}>
                <thead>
                    <tr>
                        <th>
                            <CheckSquare style={{ marginRight: '5px' }} /> 회의 이름
                        </th>
                        <th>
                            <People style={{ marginRight: '5px' }} /> 참가자
                        </th>
                        <th>
                            <CalendarCheck style={{ marginRight: '5px' }} /> 생성일자
                        </th>
                        <th>
                            <CalendarPlus style={{ marginRight: '5px' }} /> 수정일자
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
                            // 4. <tr>에 onClick과 cursor: pointer 추가
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

            <Button variant="primary" className="w-100 mt-3" onClick={handleAddSubMeeting}>
                회의 추가하기
            </Button>
        </Container>
    );
}
