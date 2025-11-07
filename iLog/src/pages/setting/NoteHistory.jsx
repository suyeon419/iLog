// NoteHistory.jsx

import React, { useState, useEffect } from 'react';
// [수정] Alert 추가
import { Container, Table, Pagination, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
// [수정] 아이콘 변경 (API 응답에 맞게)
import { PencilSquare, CheckSquare, CalendarCheck, ShieldLock } from 'react-bootstrap-icons';
// [수정] API 함수 임포트
import { getNoteHistory } from '../../api/user'; // [수정] getNoteHistory 임포트

export default function NoteHistory() {
    const navigate = useNavigate();

    // Note: 회의록 클릭 시 상세 페이지로 이동 (기존 로직 유지)
    const handleRowClick = (meetingId) => {
        // TODO: 회의록 상세 페이지 경로로 수정 (기존 TODO 유지)
        navigate(`/notes/meeting/${meetingId}`);
        // console.log('Clicked meeting:', meetingId);
    };

    // --- 페이지네이션 로직 ---
    const [currentPage, setCurrentPage] = useState(1);
    const [subMeetings, setSubMeetings] = useState([]); // 빈 배열로 초기화
    const ITEMS_PER_PAGE = 7;

    // [수정] 로딩 및 오류 상태 추가
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // [수정] 백엔드 연동 useEffect
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                setError('');
                console.log('[NoteHistory] 회의록 이력 로드 시작...');

                // 1. API 호출
                const data = await getNoteHistory();

                // 2. State 설정
                setSubMeetings(data);
                console.log('[NoteHistory] 데이터 로드 성공:', data);
            } catch (err) {
                console.error('❌ [NoteHistory] 데이터 로드 실패:', err);
                setError('데이터를 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []); // 페이지 로드 시 1회 실행

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
    // ---------------------------------------------

    return (
        // .container-left 스타일 적용
        <Container fluid className="pt-3 container-left">
            {/* 1. 콘텐츠 영역 (flex-grow-1) */}
            <div className="flex-grow-1">
                <Row className="mb-3 mt-3 align-items-center">
                    <Col>
                        <h2 className="fw-bold m-0">
                            <PencilSquare className="me-3" />
                            회의록 이력
                        </h2>
                    </Col>
                </Row>

                {/* [수정] 에러 발생 시 Alert 표시 */}
                {error && <Alert variant="danger">{error}</Alert>}

                {/* 회의록 이력 테이블 */}
                <Table className="align-middle">
                    {/* [수정] <thead>: API 응답에 맞게 헤더 변경 */}
                    <thead>
                        <tr>
                            <th>
                                <CheckSquare className="me-2" /> 회의록 ID
                            </th>
                            <th>
                                <ShieldLock className="me-2" /> 상태
                            </th>
                            <th>
                                <CalendarCheck className="me-2" /> 생성일자
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* [수정] 로딩, 데이터 없음, 데이터 있음 3가지 상태 처리 */}
                        {loading ? (
                            <tr>
                                {/* [수정] colSpan="3"로 변경 */}
                                <td colSpan="3" className="text-center p-4">
                                    데이터를 불러오는 중입니다...
                                </td>
                            </tr>
                        ) : currentMeetings.length === 0 ? (
                            <tr>
                                {/* [수정] colSpan="3"로 변경 */}
                                <td colSpan="3" className="text-center p-4">
                                    회의록 이력이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            currentMeetings.map((meeting) => (
                                <tr
                                    key={meeting.id}
                                    onClick={() => handleRowClick(meeting.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {/* [수정] API 응답 키(id, status, created64)에 맞게 수정 */}
                                    <td>{meeting.id}</td>
                                    <td>{meeting.status}</td>
                                    <td>{meeting.created64}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>

            {/* 2. 하단 고정 영역 (페이지네이션) */}
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
            </div>
        </Container>
    );
}
