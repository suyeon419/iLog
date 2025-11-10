// NoteHistory.jsx

import React, { useState, useEffect } from 'react';
import { Container, Table, Pagination, Row, Col, Alert } from 'react-bootstrap';
import { PencilSquare, CheckSquare, CalendarCheck, ShieldLock } from 'react-bootstrap-icons';
import { getNoteHistory } from '../../api/user';

export default function NoteHistory() {
    // --- 페이지네이션 로직 ---
    const [currentPage, setCurrentPage] = useState(1);
    const [subMeetings, setSubMeetings] = useState([]); // 빈 배열로 초기화
    const ITEMS_PER_PAGE = 10;

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
        <Container fluid className="pt-3 container-left">
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

                <Table className="align-middle">
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
                        {loading ? (
                            <tr>
                                <td colSpan="3" className="text-center p-4">
                                    데이터를 불러오는 중입니다...
                                </td>
                            </tr>
                        ) : currentMeetings.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="text-center p-4">
                                    회의록 이력이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            currentMeetings.map((meeting) => (
                                <tr key={meeting.id}>
                                    <td>{meeting.id}</td>
                                    <td>{meeting.status}</td>
                                    <td>{meeting.created64}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </Table>
            </div>

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
