import React from 'react';
import { Button, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();
    return (
        <Container>
            <img src="./images/iLogLogo.png" alt="iLog Logo" style={{ width: '200px' }} /> <br />
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
        </Container>
    );
}
