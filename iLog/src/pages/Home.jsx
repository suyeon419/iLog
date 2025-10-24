import React, { useState } from 'react';
import { Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(false);
    const [name, setName] = useState('최겸');

    return (
        <Container>
            <img src="./images/iLogLogo.png" alt="iLog Logo" style={{ width: '200px' }} /> <br />
            {isLogin ? (
                <>
                    <Button variant="primary" style={{ borderRadius: '20px', width: '300px' }}>
                        내가 참여한 회의를 정리해주는 AI
                    </Button>
                    <p>
                        환영합니다. <span className="signup-link">{name}</span>님!
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
