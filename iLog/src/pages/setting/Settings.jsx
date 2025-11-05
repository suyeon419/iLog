import React, { useEffect, useState } from 'react';
import { Button, Container, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { deleteUser, getUserById, loginUser } from '../../api/user';
import { jwtDecode } from 'jwt-decode';

export default function Settings() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(false);
    const [user, setUser] = useState(null);

    const logout = () => {
        localStorage.removeItem('accessToken');
        loginUser();
        navigate('/');
    };

    const handleDeleteAccount = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                alert('로그인이 필요합니다.');
                return;
            }

            const decoded = jwtDecode(token);
            console.log('🔍 decoded token (전체):', JSON.stringify(decoded, null, 2));

            const userId = decoded.id;
            console.log('🧩 추출된 사용자 ID:', userId);

            await deleteUser(userId); // ✅ 여기서 decoded.id 직접 전달
            alert('회원 탈퇴가 완료되었습니다.');
            localStorage.removeItem('accessToken');
            navigate('/');
        } catch (error) {
            console.error('❌ 회원 탈퇴 실패:', error);
            alert('회원 탈퇴 중 오류가 발생했습니다.');
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            setIsLogin(true);
            try {
                const decoded = jwtDecode(token);
                console.log('🔍 decoded token (전체):', JSON.stringify(decoded, null, 2)); // ✅ 전체 구조 확인
                const userId = decoded.id;
                console.log('🧩 추출된 사용자 ID:', userId);
                getUserById(userId)
                    .then((data) => {
                        setUser(data);
                    })
                    .catch((err) => {
                        console.error('❌ [Setting] 회원 정보 요청 실패:', err);
                        localStorage.removeItem('accessToken');
                        setIsLogin(false);
                    });
            } catch (err) {
                console.error('❌ [Setting] JWT 디코딩 실패:', err);
                localStorage.removeItem('accessToken');
                setIsLogin(false);
            }
        }
    }, []);

    return (
        <div className="container-left">
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
                            <div className="h3">{user?.name}</div>
                            <div className="text-muted">{user?.email}</div>
                        </div>
                    </div>
                    <Button as={Link} to="/confirm-password" variant="primary">
                        회원 정보 수정
                    </Button>
                </div>
                <hr className="beigeHr" />
            </section>

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

            <div className="d-flex justify-content-center gap-3 mt-4">
                <Button variant="primary" onClick={logout}>
                    로그아웃
                </Button>
                <Button variant="danger" onClick={handleDeleteAccount}>
                    회원탈퇴
                </Button>
            </div>
        </div>
    );
}
