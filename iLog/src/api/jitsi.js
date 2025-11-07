import apiClient from './axios'; // axios 인스턴스

/**
 * 회의 JWT 토큰 발급 함수
 * @param {string} roomName - 회의방 이름
 * @param {string} userName - 사용자 이름
 * @param {string} userEmail - 사용자 이메일
 * @returns {Promise<string>} - JWT 토큰
 */
export async function startJitsiMeeting({ roomName, userName, userEmail }) {
    console.log('🚀 [Jitsi.js] startJitsiMeeting 호출됨');
    console.log('📩 전달받은 인자:', { roomName, userName, userEmail });

    try {
        // ✅ JWT 요청
        const { data, status } = await apiClient.post(
            '/jitsi-jwt',
            { roomName, userName, userEmail },
            { headers: { 'Content-Type': 'application/json' } }
        );

        console.log('📬 [Jitsi.js] 응답 상태:', status);
        console.log('🪙 [Jitsi.js] 받은 데이터:', data);

        const token = data?.jwt || data?.token;
        if (!token) throw new Error('JWT 토큰 누락됨');

        // ✅ iframe 생성은 제거 → Meeting.jsx에서 JitsiMeetJS가 사용하므로 불필요
        return token;
    } catch (error) {
        console.error('❌ [Jitsi.js] JWT 요청 실패:', error);
        throw error;
    }
}
