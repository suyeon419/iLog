import React, { useEffect, useState } from 'react';
import { Button, Container, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getUserById } from '../../api/user';
import { jwtDecode } from 'jwt-decode';

export default function Home() {
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');

        if (token) {
            console.log('✅ [Home] 토큰이 localStorage에 존재합니다:', token);
            setIsLogin(true);

            try {
                const decoded = jwtDecode(token);
                const userId = decoded.id;
                console.log('🧩 [Home] 디코딩된 사용자 ID:', userId);

                getUserById(userId)
                    .then((data) => {
                        console.log('✅ [Home] 회원 정보 조회 성공:', data);
                        setUser(data);
                    })
                    .catch((err) => {
                        console.error('❌ [Home] 회원 정보 요청 실패:', err);
                        localStorage.removeItem('accessToken');
                        setIsLogin(false);
                    })
                    .finally(() => {
                        setIsLoading(false);
                    });
            } catch (err) {
                console.error('❌ [Home] JWT 디코딩 실패:', err);
                localStorage.removeItem('accessToken');
                setIsLogin(false);
            }
        } else {
            console.warn('⚠️ [Home] 토큰이 없습니다. 비로그인 상태입니다.');
            setIsLoading(false);
        }
    }, []);

    if (isLoading) {
        return (
            <Container
                className="d-flex flex-column justify-content-center align-items-center"
                style={{ height: '100vh' }}
            >
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">회원 정보를 불러오는 중입니다...</p>
            </Container>
        );
    }

    return (
        <Container>
            <img src="./images/iLogLogo.png" alt="iLog Logo" style={{ width: '200px' }} /> <br />
            {isLogin ? (
                <>
                    <Button variant="primary" style={{ borderRadius: '20px', width: '300px' }}>
                        내가 참여한 회의를 정리해주는 AI
                    </Button>
                    <p>
                        환영합니다. <span className="signup-link">{user?.name}</span>님!
                    </p>
                </>
            ) : (
                <>
                    <Button
                        variant="primary"
                        style={{ borderRadius: '20px', width: '300px' }}
                        onClick={() => navigate('/login')}
                    >
                        로그인
                    </Button>
                    <p>
                        회원이 아니신가요?
                        <a href="/register" className="signup-link mx-2">
                            회원가입
                        </a>
                    </p>
                </>
            )}
        </Container>
    );
}
