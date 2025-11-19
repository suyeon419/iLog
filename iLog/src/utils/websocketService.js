// src/utils/websocketService.js (업데이트된 버전)

import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

let stompClient = null;

/**
 * WebSocket에 연결하고 특정 회의록의 실시간 업데이트를 구독합니다.
 * @param {string} meetingId - 구독할 회의록 ID
 * @param {function} onUpdated - 업데이트 메시지 수신 시 호출할 콜백 함수
 */
export function connectNoteUpdates(meetingId, onUpdated) {
    // [✅ 변경] 서버 담당자가 제공한 대로 토큰 없이 연결
    const socketUrl = 'https://webkit-ilo9-api.duckdns.org/ws'; // FIXME: 실제 백엔드 도메인 및 경로로 교체 필요

    const socket = new SockJS(socketUrl, null, {
        transports: ['websocket'],
    });
    stompClient = Stomp.over(socket);

    // 디버그 출력을 억제합니다.
    stompClient.debug = null;

    // 연결 시도 (헤더 객체 {} 비어 있음)
    stompClient.connect(
        {},
        () => {
            console.log('🟢 WebSocket 연결 성공');

            const destination = `/topic/minutes/${meetingId}`;

            // 구독 시작
            stompClient.subscribe(destination, (frame) => {
                console.log(`[WS] 메시지 수신: ${frame.body}`);
                if (frame.body === 'UPDATED') {
                    onUpdated(); // 회의록 갱신 함수 호출
                }
            });
        },
        (error) => {
            console.error('❌ WebSocket 연결 실패', error);
        }
    );
}

/**
 * WebSocket 연결을 해제합니다.
 */
export function disconnectNoteUpdates() {
    if (stompClient && stompClient.connected) {
        stompClient.disconnect(() => {
            console.log('🔴 WebSocket 연결 해제됨');
        });
        stompClient = null;
    }
}
