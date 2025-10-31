import React from 'react';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function Settings() {
    return (
        <div className="container-left">
            {/* 내 프로필 */}
            <section className="profile-section">
                <h2>
                    <i className="bi bi-person"></i> 내 프로필
                </h2>
                <hr className="brownHr" />
                <div className="d-flex align-items-center justify-content-between mt-3">
                    <div className="d-flex align-items-center gap-3">
                        <img
                            src="./images/profile.png"
                            alt="프로필 이미지"
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid #b66e03',
                            }}
                        />
                        <div>
                            <div className="h3">최겸</div>
                            <div className="text-muted">gksdml7419@gmail.com</div>
                        </div>
                    </div>
                    <Button as={Link} to="/edit-profile" variant="primary">
                        회원 정보 수정
                    </Button>
                </div>
                <hr className="beigeHr" />
            </section>

            {/* 내 계정 관리 */}
            <section>
                <h2>🔐 내 계정 관리</h2>
                <hr className="brownHr" />
                <ul className="list-unstyled mt-2 ms-3">
                    <li>
                        <a href="/login-history" className="link" style={{ display: 'block' }}>
                            로그인 이력
                        </a>
                    </li>
                </ul>
                <hr className="beigeHr" />
            </section>

            {/* 내 활동 */}
            <section>
                <h2>📘 내 활동</h2>
                <hr className="brownHr" />
                <ul className="list-unstyled mt-2 ms-3">
                    <li>
                        <Link to="/note-history" className="link" style={{ display: 'block' }}>
                            회의록
                        </Link>
                    </li>
                    <hr className="beigeHr" />
                    <li>
                        <Link to="/meeting-history" className="link" style={{ display: 'block' }}>
                            화상 회의
                        </Link>
                    </li>
                    <hr className="beigeHr" />
                </ul>
            </section>

            {/* 하단 버튼 */}
            <div className="d-flex justify-content-center gap-3 mt-4">
                <Button variant="primary">로그아웃</Button>
                <Button variant="danger">회원탈퇴</Button>
            </div>
        </div>
    );
}
