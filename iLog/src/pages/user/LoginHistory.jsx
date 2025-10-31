// LoginHistory.jsx

import React from 'react';
import { Container, Table, Pagination, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function LoginHistory() {
    const navigate = useNavigate();

    // '설정으로' 버튼 클릭 시 뒤로 가기
    const handleGoBack = () => {
        navigate(-1); // Settings 페이지로 돌아가기
    };

    return (
        // index.css의 .container 스타일 (중앙 정렬) 적용
        <Container className="pt-3">
            <h2 className="fw-bold text-center my-4">로그인 이력</h2>

            <Table style={{ width: '600px' }}>
                <thead>
                    <tr>
                        <th className="text-center" style={{ width: '50%' }}>
                            로그인 일시
                        </th>
                        <th className="text-center" style={{ width: '50%' }}>
                            접속 IP
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {/* 데이터가 없으므로 "이력이 없습니다" 표시 */}
                    <tr>
                        <td colSpan="2" className="text-center p-5 text-muted">
                            로그인 이력이 없습니다.
                        </td>
                    </tr>
                </tbody>
            </Table>

            {/* 페이지네이션 (데이터가 없으므로 비활성화된 1페이지만 표시) */}
            <nav className="mt-3 pagination-nav">
                <Pagination className="justify-content-center">
                    <Pagination.Prev disabled />
                    <Pagination.Item active>{1}</Pagination.Item>
                    <Pagination.Next disabled />
                </Pagination>
            </nav>

            {/* 설정으로 돌아가기 버튼 */}
            <Button variant="primary" className="mt-4" onClick={handleGoBack}>
                설정으로
            </Button>
        </Container>
    );
}
