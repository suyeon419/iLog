import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Row, Col } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom'; // 1. useLocation 제거
import { PencilSquare, CheckSquare, People, CalendarCheck, CalendarPlus, PersonPlus } from 'react-bootstrap-icons';

export default function NoteDetail() {
    const navigate = useNavigate();
    const { id } = useParams(); // URL에서 현재 ID (e.g., '1')를 가져옴

    // 2. 프로젝트 정보 (e.g., 'LCK 팀프로젝트')와 하위 회의록 목록을 state로 관리
    const [project, setProject] = useState(null); // 프로젝트 제목 등
    const [subMeetings, setSubMeetings] = useState([]); // 하위 회의 목록
    const [loading, setLoading] = useState(true);

    // 3. 백엔드에서 상세 데이터를 가져오는 함수
    const fetchProjectDetails = async (projectId) => {
        setLoading(true);
        try {
            // TODO: (1) 프로젝트 자체 정보 가져오기 (e.g., fetch(`/api/notes/${projectId}`))
            // const projectRes = await fetch(`/api/notes/${projectId}`);
            // const projectData = await projectRes.json();
            // setProject(projectData); // 예: { id: 1, name: 'LCK 팀프로젝트' }

            // TODO: (2) 하위 회의록 목록 가져오기 (e.g., fetch(`/api/notes/${projectId}/meetings`))
            // const meetingsRes = await fetch(`/api/notes/${projectId}/meetings`);
            // const meetingsData = await meetingsRes.json();
            // setSubMeetings(meetingsData);

            // --- 지금은 API가 없으므로 임시 표시 ---
            // (백엔드 연동 시 이 2줄은 삭제하세요)
            setProject({ id: id, name: `LCK 팀프로젝트` }); // 임시 제목
            setSubMeetings([]); // 빈 목록
            // ------------------------------------
        } catch (error) {
            console.error('Failed to fetch details:', error);
            // TODO: 에러 처리
        } finally {
            setLoading(false);
        }
    };

    // 4. ID가 변경될 때마다 (페이지가 열릴 때) 상세 데이터를 가져옴
    useEffect(() => {
        fetchProjectDetails(id);
    }, [id]); // id가 바뀔 때마다 다시 실행

    // 5. "회의 추가하기" 버튼은 'parentId'를 state로 넘겨서 생성 페이지로 이동
    const handleAddSubMeeting = () => {
        navigate('/notes/new', { state: { parentId: id } });
    };

    // 6. 자동 생성(무한 루프)을 일으켰던 useEffect(newMeetingData) 제거

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
                        {/* 7. state의 project.name을 표시 (없으면 "...") */}
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
                    {/* 8. state(subMeetings)를 기반으로 목록 렌더링 */}
                    {subMeetings.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="text-center p-4">
                                하위 회의록이 없습니다.
                            </td>
                        </tr>
                    ) : (
                        subMeetings.map((meeting) => (
                            <tr key={meeting.id} style={{ cursor: 'pointer' }}>
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
