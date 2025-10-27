// Jitsi 라이브러리 초기화, JWT 토큰 요청, Connection 생성, 로컬 트랙 생성 및 회의 입장을 수행합니다.
const connectJitsi = async (roomNameToJoin, userDisplayName) => {
    console.log('📲 connectJitsi()');

    if (!navigator.mediaDevices) {
        alert('카메라/마이크 접근 권한이 필요합니다. 브라우저 설정을 확인해주세요.');
        setIsProcessing(false);
        return;
    }
    if (!window.JitsiMeetJS) return alert('Jitsi library is not loaded.');
    setIsProcessing(true);
    setSummaryText('녹음 버튼을 눌러 회의 요약을 시작하세요.');
    const currentRoomName = roomNameToJoin || `mysupermeeting-${Math.random().toString(36).substr(2, 9)}`;
    setRoomName(currentRoomName);

    try {
        // 1. Jitsi 라이브러리 초기화 (최초 1회)
        if (!JitsiMeetJSRef.current) {
            JitsiMeetJSRef.current = window.JitsiMeetJS;
            JitsiMeetJSRef.current.init({ disableAP: true, disableAEC: true });
            JitsiMeetJSRef.current.setLogLevel(JitsiMeetJSRef.current.logLevels.ERROR);
        }
        const JitsiMeetJS = JitsiMeetJSRef.current;

        // 2. 서버에서 JaaS용 JWT 토큰 발급
        const jwtRes = await fetch('https://webkit-ilo9-api.duckdns.org/api/generate-jitsi-jwt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roomName: currentRoomName,
                userName: userDisplayName,
            }),
        });
        if (!jwtRes.ok) throw new Error('Failed to get JWT');
        const { jwt } = await jwtRes.json(); // connection options - note: pass null as first param to JitsiConnection when using JWT for JaaS

        // 3. Jitsi Connection 옵션 설정
        const connectionOptions = {
            hosts: {
                domain: '8x8.vc',
                muc: `conference.${appId}.8x8.vc`,
                focus: 'focus.8x8.vc',
            },
            bosh: `https://8x8.vc/http-bind`,
            serviceUrl: `wss://8x8.vc/${appId}/xmpp-websocket?room=${currentRoomName}`,
            p2p: { enabled: false }, // P2P 강제 비활성화
        };

        // 4. JitsiConnection 객체 생성 및 Ref에 저장
        const connection = new JitsiMeetJS.JitsiConnection(null, jwt, connectionOptions);
        connectionRef.current = connection;

        // 5. Jitsi 연결 이벤트 리스너 설정
        // 5-1. 연결 성공 (CONNECTION_ESTABLISHED)
        connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, async () => {
            try {
                // 5-1a. JitsiConference 객체 생성
                const conf = connection.initJitsiConference(currentRoomName, {
                    openBridgeChannel: true,
                    disableSimulcast: true,
                    p2p: { enabled: false },
                    constraints: {
                        video: {
                            width: { ideal: 1280, max: 1280 },
                            height: { ideal: 720, max: 720 },
                            frameRate: { ideal: 15, max: 30 },
                        },
                    },
                });
                conferenceRef.current = conf;
                // 5-1b. 회의 이벤트 리스너(USER_JOINED, TRACK_ADDED 등) 설정
                setupConferenceListeners(conf, JitsiMeetJS);

                // 5-1c. 로컬 미디어 트랙 생성 (잡음제거, 원본, 비디오)
                // 1. 잡음 제거가 적용된 오디오 트랙
                const [suppressedTrack] = await JitsiMeetJS.createLocalTracks({
                    devices: ['audio'],
                    constraints: {
                        audio: { noiseSuppression: true, echoCancellation: true },
                    },
                });
                suppressedAudioTrackRef.current = suppressedTrack;
                // 2. 원본 오디오 트랙
                const [originalTrack] = await JitsiMeetJSRef.current.createLocalTracks({
                    devices: ['audio'],
                });
                originalAudioTrackRef.current = originalTrack;
                // 3. 비디오 트랙
                const [videoTrack] = await JitsiMeetJSRef.current.createLocalTracks({ devices: ['video'] });

                // 로컬 트랙 Ref에 저장 (기본 오디오는 잡음 제거 트랙 사용)
                localTracksRef.current.video = videoTrack;
                localTracksRef.current.audio = suppressedTrack;
                localTracksRef.current.currentActiveVideoTrack = videoTrack;

                // 5-1d. 로컬 오디오 레벨 리스너 연결 (isSpeaking 감지용)
                const localAudioLevelListener = (audioLevel) => {
                    setParticipants((prev) => prev.map((p) => (p.isLocal ? { ...p, audioLevel } : p)));
                };
                // 잡음제거/원본 트랙 양쪽에 모두 리스너 연결
                suppressedTrack.on(
                    JitsiMeetJSRef.current.events.track.TRACK_AUDIO_LEVEL_CHANGED,
                    localAudioLevelListener
                );
                originalAudioTrackRef.current.on(
                    JitsiMeetJSRef.current.events.track.TRACK_AUDIO_LEVEL_CHANGED,
                    localAudioLevelListener
                );

                // 5-1e. 회의에 로컬 트랙 추가 (기본 오디오/비디오)
                await conf.addTrack(suppressedTrack);
                await conf.addTrack(videoTrack);

                // 5-1f. `participants` 배열에 내(local) 정보 추가
                const myId = normalizeId(conf.myUserId?.() ?? '');
                participantInfoRef.current[myId] = userDisplayName;
                setParticipants([
                    {
                        id: myId,
                        name: userDisplayName,
                        isLocal: true,
                        videoTrack: videoTrack,
                        audioTrack: suppressedTrack,
                        videoType: 'camera',
                        isAudioMuted: false,
                        isVideoMuted: false,
                        audioLevel: 0,
                    },
                ]);

                // 5-1g. Jitsi 회의 참가 및 이름 설정
                conf.setDisplayName(userDisplayName);
                await conf.join();
            } catch (e) {
                console.error('conference init/join error', e);
                setIsProcessing(false);
            }
        });

        // 5-2. 연결 실패
        connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, (err) => {
            console.error('Connection failed:', err);
            setIsProcessing(false);
        });
        // 5-3. 연결 끊김 (강제 종료 또는 네트워크 문제)
        connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, () => {
            console.warn('Connection disconnected');
            cleanUpConnection(); // 연결이 끊기면 모든 상태 정리
        });

        // 6. Jitsi 서버에 연결 시작
        connection.connect();
    } catch (e) {
        console.error('Failed to connect to Jitsi:', e);
        setIsProcessing(false);
    }
};
