// src/App.jsx

import React from 'react';
// CSS 파일 import (이미 main.jsx에서 임포트될 수 있으나, 명시적으로 추가)
// import './index.css'; // main.jsx에서 이미 import하고 있다면 중복될 수 있습니다.

function App() {
    return (
        // 최상단 div에 App 클래스를 추가하여 CSS가 적용되도록 함
        <div className="App">
            <header>
                <div className="header-left">
                    <img src="/images/logo-icon.jpg" alt="iLog Icon" className="logo-icon" />
                    <img src="/images/logo-text.jpg" alt="iLog Text Logo" className="logo-text" />
                </div>
                <nav className="header-right">
                    <a href="#" className="nav-item">
                        <i className="fas fa-home"></i>
                        <span>홈</span>
                    </a>
                    <a href="#" className="nav-item">
                        <i className="fas fa-file-alt"></i>
                        <span>회의록</span>
                    </a>
                    <a href="#" className="nav-item active">
                        <i className="fas fa-video"></i>
                        <span>화상 회의</span>
                    </a>
                    <a href="#" className="nav-item">
                        <i class="fas fa-cog"></i>
                        <span>설정</span>
                    </a>
                </nav>
            </header>

            {/* 메인 컨텐츠 영역을 감싸는 div 추가 */}
            <main className="main-content">
                <div className="meeting-container">
                    <h2>프로젝트 회의</h2>
                    <p>화상회의가 아래에 표시됩니다. 카메라와 마이크 권한을 허용해주세요.</p>

                    <iframe
                        allow="camera; microphone; fullscreen; display-capture"
                        src="https://meet.jit.si/iLog-Test-Meeting-Room"
                    ></iframe>
                </div>

                <button className="btn" onClick={() => alert('회의가 종료되었습니다!')}>
                    회의 종료
                </button>
            </main>
        </div>
    );
}

export default App;
