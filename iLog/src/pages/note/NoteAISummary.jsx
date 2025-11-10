// NoteAISummary.jsx

import React from 'react';
import { Row, Col } from 'react-bootstrap';

// ✅ props에서 initialMemos, meetingId 제거
export default function NoteAISummary({ summaryText }) {
    return (
        <>
            <Row>
                {/* 1. AI 요약 본문 */}
                {/* ✅ Col 너비를 8에서 12로 변경하고 이벤트 핸들러(onMouseUp, onContextMenu) 제거 */}
                <Col md={12} className="ai-summary-content">
                    <h4 className="fw-bold mb-3">
                        <i className="bi bi-robot me-2"></i>AI 요약 피드백
                    </h4>

                    {/* Postman에서 \n으로 줄바꿈된 텍스트를 그대로 렌더링하기 위해 
                      <pre> 태그 사용 (부트스트랩 기본 스타일 리셋 필요 시 css 추가) 
                    */}
                    <pre
                        className="ai-summary-pre"
                        style={{
                            whiteSpace: 'pre-wrap' /* 줄바꿈 및 공백 유지 */,
                            wordBreak: 'break-all' /* 긴 단어 줄바꿈 */,
                            fontFamily: 'inherit' /* 부모 폰트 상속 */,
                            fontSize: 'inherit' /* 부모 폰트 크기 상속 */,
                        }}
                    >
                        {summaryText}
                    </pre>
                </Col>
            </Row>
        </>
    );
}
