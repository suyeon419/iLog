import React, { useState } from 'react';
import { Container, Table, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { PencilSquare, CheckSquare, People, CalendarCheck, CalendarPlus } from 'react-bootstrap-icons';

export default function Note() {
    const navigate = useNavigate();
    const [meetings, setMeetings] = useState([]);

    // 백엔드 들어오면 이 부분 필요 없음
    const project = {
        id: 1,
        name: 'LCK 팀프로젝트',
        members: '김가현 김우혁 이수연 최겸',
        created: '2025.00.00.',
        modified: '2025.00.00.',
    };

    const handleAddMeeting = () => {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '.') + '.';
        const newId = meetings.length === 0 ? 2 : meetings[meetings.length - 1].id + 1;

        const newMeeting = {
            id: newId,
            name: `새 회의 ${meetings.length + 1}`,
            members: '참가자를 입력하세요',
            created: today,
            modified: today,
        };

        setMeetings([...meetings, newMeeting]);
    };

    const handleRowClick = (id) => {
        navigate(`/notes/${id}`);
    };
    // 여기까지 백엔드 들어오면 필요없음

    return (
        <>
            <Container fluid className="container-left">
                <h2 style={{ fontWeight: 'bold', color: '#333' }} className="mb-3">
                    <PencilSquare style={{ marginRight: '10px' }} />
                    회의록
                </h2>

                <Table style={{ verticalAlign: 'middle', color: '#333' }}>
                    <thead style={{ borderBottom: '2px solid #333' }}>
                        <tr>
                            {/* 헤더 <th>의 세로줄: #ddd */}
                            <th style={{ borderRight: '1px solid #ddd' }}>
                                <CheckSquare style={{ marginRight: '5px' }} /> 회의 이름
                            </th>
                            <th style={{ borderRight: '1px solid #ddd' }}>
                                <People style={{ marginRight: '5px' }} /> 참가자
                            </th>
                            <th style={{ borderRight: '1px solid #ddd' }}>
                                <CalendarCheck style={{ marginRight: '5px' }} /> 생성일자
                            </th>
                            <th>
                                <CalendarPlus style={{ marginRight: '5px' }} /> 수정일자
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr key={project.id} onClick={() => handleRowClick(project.id)} style={{ cursor: 'pointer' }}>
                            <td style={{ borderRight: '1px solid #ddd' }}>{project.name}</td>
                            <td style={{ borderRight: '1px solid #ddd' }}>{project.members}</td>
                            <td style={{ borderRight: '1px solid #ddd' }}>{project.created}</td>
                            <td>{project.modified}</td>
                        </tr>
                        {meetings.map((meeting) => (
                            <tr
                                key={meeting.id}
                                onClick={() => handleRowClick(meeting.id)}
                                style={{ cursor: 'pointer' }}
                            >
                                <td style={{ borderRight: '1px solid #ddd' }}>{meeting.name}</td>
                                <td style={{ borderRight: '1px solid #ddd' }}>{meeting.members}</td>
                                <td style={{ borderRight: '1px solid #ddd' }}>{meeting.created}</td>
                                <td>{meeting.modified}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>

                <Button variant="primary" className="w-100 mt-3" onClick={handleAddMeeting}>
                    회의 추가하기
                </Button>
            </Container>
        </>
    );
}
