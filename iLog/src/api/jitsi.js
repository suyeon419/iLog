// jitsi.js
async function startJitsiMeeting() {
    const roomName = 'MyMeetingRoom'; // 방 이름
    const userName = '이수연'; // 표시될 이름
    const userEmail = 'suyeon@example.com'; // 사용자 이메일

    try {
        // 1️⃣ JWT 토큰 요청 (백엔드에 이미 구현된 /jitsi-jwt 사용)
        const response = await fetch('/jitsi-jwt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomName, userName, userEmail }),
        });

        if (!response.ok) {
            throw new Error('JWT 생성 실패: ' + response.statusText);
        }

        const { token } = await response.json();

        // 2️⃣ Jitsi Meet 임베드 설정
        const domain = 'meet.jit.si'; // 혹은 커스텀 Jitsi 서버 주소
        const options = {
            roomName: roomName,
            parentNode: document.getElementById('jitsi-container'),
            jwt: token,
            userInfo: {
                displayName: userName,
                email: userEmail,
            },
            configOverwrite: {
                startWithAudioMuted: true,
                startWithVideoMuted: false,
            },
            interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: ['microphone', 'camera', 'chat', 'raisehand', 'hangup'],
            },
        };

        // 3️⃣ Jitsi 객체 생성 및 이벤트 바인딩
        const api = new JitsiMeetExternalAPI(domain, options);
        api.addEventListener('videoConferenceJoined', () => {
            console.log('✅ 회의에 성공적으로 입장했습니다.');
        });
    } catch (error) {
        console.error('❌ Jitsi 로딩 실패:', error);
        alert('화상회의를 시작할 수 없습니다. 관리자에게 문의하세요.');
    }
}

// 페이지 로드 후 실행
window.addEventListener('load', startJitsiMeeting);
