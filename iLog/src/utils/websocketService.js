import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let stompClient = null;

export function connectNoteUpdates(meetingId, onUpdated) {
    const socketUrl = 'https://webkit-ilo9-api.duckdns.org/ws';

    // SockJS 인스턴스 생성
    const socket = new SockJS(socketUrl);

    // 최신 stompjs Client 기반 생성
    stompClient = new Client({
        webSocketFactory: () => socket, // SockJS 연결
        reconnectDelay: 5000, // 5초마다 재연결
        debug: () => {}, // stomp 로그 제거
    });

    // 연결 성공 시
    stompClient.onConnect = () => {
        console.log('🟢 WebSocket 연결 성공');

        const destination = `/topic/minutes/${meetingId}`;

        stompClient.subscribe(destination, (message) => {
            console.log(`[WS] 메시지 수신: ${message.body}`);
            if (message.body === 'UPDATED') {
                onUpdated();
            }
        });
    };

    // 오류 시
    stompClient.onStompError = (frame) => {
        console.error('❌ STOMP 오류', frame);
    };

    // 연결 시작
    stompClient.activate();
}

// 연결 해제
export function disconnectNoteUpdates() {
    if (stompClient) {
        stompClient.deactivate();
        console.log('🔴 WebSocket 연결 해제됨');
    }
}
