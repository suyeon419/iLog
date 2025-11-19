import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const socket = new SockJS(socketUrl);

stompClient = new Client({
    webSocketFactory: () => socket,
    debug: () => {}, // 로그 끄기
    reconnectDelay: 5000, // 재연결 5초
});

stompClient.onConnect = () => {
    console.log('🟢 WebSocket 연결 성공');
    const destination = `/topic/minutes/${meetingId}`;

    stompClient.subscribe(destination, (message) => {
        console.log(`[WS] 메시지 수신: ${message.body}`);
        if (message.body === 'UPDATED') onUpdated();
    });
};

stompClient.onStompError = (frame) => {
    console.error('❌ STOMP 오류 발생', frame);
};

stompClient.activate();

export function disconnectNoteUpdates() {
    if (stompClient) {
        stompClient.deactivate();
        console.log('🔴 WebSocket 연결 해제');
    }
}
