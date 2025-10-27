import React, { useEffect, useRef, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Meeting.css';

// ID를 일관된 문자열 형식으로 변환합니다.
const normalizeId = (id) => String(id ?? '');

// Jitsi 트랙을 DOM 노드에 안전하게 연결(attach)하고 이전 트랙을 해제(detach) 합니다.
const safeAttach = (track, node, prevRef) => {
    if (!node) return;
    if (prevRef.current && prevRef.current !== track) {
        try {
            prevRef.current.detach(node);
        } catch (e) {}
        try {
            prevRef.current.dispose?.();
        } catch (e) {}
        prevRef.current = null;
    }
    if (track && typeof track.attach === 'function') {
        try {
            track.attach(node);
            prevRef.current = track;
        } catch (e) {
            console.warn('attach failed', e);
        }
    }
};

// 오디오 트랙을 받아 보이지 않는 <audio> 태그로 재생하는 전용 컴포넌트입니다.
// 스포트라이트 여부(특정 사용자 클릭하면 커지는 기능)와 관계없이 항상 모든 소리를 듣기 위해 사용됩니다.
const AudioTrackPlayer = ({ audioTrack }) => {
    const audioRef = useRef(null);
    const prevAudioRef = useRef(null); // safeAttach 헬퍼를 위해 추가

    // audioTrack prop이 변경될 때마다 safeAttach를 호출하여 오디오를 재생/교체합니다.
    useEffect(() => {
        const node = audioRef.current;
        const track = audioTrack;
        safeAttach(track, node, prevAudioRef);

        return () => {
            try {
                track?.detach(node);
            } catch (e) {}
            prevAudioRef.current = null;
        };
    }, [audioTrack]);

    // 이 <audio> 태그는 시각적으로 보이지 않으며 오직 소리 재생만 담당합니다.
    return <audio ref={audioRef} autoPlay playsInline style={{ display: 'none' }} />;
};

// 개별 참가자의 비디오 타일(카메라 또는 화면공유)을 렌더링합니다.
// 이 컴포넌트는 오디오가 아닌 시각적인 부분만 담당합니다.
const ParticipantView = ({ participant, onClick, isSelected }) => {
    // 비디오 렌더링을 위한 ref
    const videoRef = useRef(null);
    const prevVideoRef = useRef(null);

    // 화면 공유 렌더링을 위한 ref
    const desktopVideoRef = useRef(null);
    const prevDesktopVideoRef = useRef(null);

    // '말하는 중' 상태(녹색 테두리) 관리를 위한 state 및 ref
    const [isSpeaking, setIsSpeaking] = useState(false);
    const speakingTimeoutRef = useRef(null);

    // 참가자의 오디오 레벨을 감지하여 'isSpeaking' 상태를 부드럽게(타임아웃) 업데이트합니다.
    useEffect(() => {
        if (participant.audioLevel > 0.01) {
            setIsSpeaking(true);

            if (speakingTimeoutRef.current) {
                clearTimeout(speakingTimeoutRef.current);
                speakingTimeoutRef.current = null;
            }
        } else if (isSpeaking) {
            // 말이 끝나도 0.1초간 테두리를 유지합니다.
            speakingTimeoutRef.current = setTimeout(() => {
                setIsSpeaking(false);
                speakingTimeoutRef.current = null;
            }, 100);
        }

        // 컴포넌트 언마운트 시 타이머 정리
        return () => {
            if (speakingTimeoutRef.current) {
                clearTimeout(speakingTimeoutRef.current);
            }
        };
    }, [participant.audioLevel, isSpeaking]);

    // 참가자가 화면 공유 중인지, 카메라 뷰인지 판단하여 렌더링할 메인 비디오 트랙을 결정합니다.
    const isScreenShareView = participant.trackType === 'desktop';
    const mainTrack = isScreenShareView ? participant.desktopTrack : participant.videoTrack;
    const mainVideoRef = isScreenShareView ? desktopVideoRef : videoRef;
    const prevMainVideoRef = isScreenShareView ? prevDesktopVideoRef : prevVideoRef;

    // 결정된 메인 비디오 트랙(mainTrack)을 <video> 요소에 연결합니다.
    useEffect(() => {
        const node = mainVideoRef.current;
        const track = mainTrack;
        safeAttach(track, node, prevMainVideoRef);

        // 로컬 비디오는 음소거 처리합니다. (내 목소리가 나에게 다시 들리는 것 방지)
        if (node) node.muted = !!participant.isLocal;
        return () => {
            try {
                mainTrack?.detach(node);
            } catch (e) {}
            prevMainVideoRef.current = null;
        };
    }, [mainTrack, participant.isLocal, isScreenShareView, mainVideoRef, prevMainVideoRef]);

    // 비디오 스타일에 대한 동적 로직입니다.
    const videoStyle = {
        // 로컬 카메라인 경우 좌우 반전
        transform: participant.isLocal && !isScreenShareView ? 'scaleX(-1)' : 'none',
        // 비디오가 음소거(카메라 꺼짐)된 경우 숨김 처리
        display: mainTrack && !(!isScreenShareView && participant.isVideoMuted) ? 'block' : 'none',
        objectFit: 'cover',
    };

    // 현재 활성화된 비디오 트랙이 있는지 여부입니다.
    const hasActiveVideo = !!mainTrack && !(!isScreenShareView && participant.isVideoMuted);

    // --- ParticipantView JSX 렌더링 ---
    return (
        // isSpeaking 상태에 따라 'speaking-border' 클래스를 토글합니다.
        <div
            // isVideoMuted 상태가 true이면 'no-video' 클래스 추가 (카메라 꺼진 상태에서 이름 중앙정렬)
            className={`video-element-container participant ${participant.isVideoMuted ? 'no-video' : ''} ${
                isSpeaking && !participant.isAudioMuted ? 'speaking-border' : ''
            } ${isSelected ? 'participant-selected' : ''}`}
            id={`participant-${participant.id}-${isScreenShareView ? 'desktop' : 'camera'}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
                if (e.key === 'Enter') onClick?.();
            }}
            aria-pressed={!!isSelected}
        >
            {/* 실제 비디오(카메라 또는 화면공유)를 렌더링합니다. */}
            <video
                ref={mainVideoRef}
                autoPlay
                playsInline
                className={isScreenShareView ? 'desktop-element' : 'video-element'}
                style={videoStyle}
            />
            {/* 비디오/화면 공유가 없는 경우 이름 배경 표시 */}
            {!mainTrack && <div className="no-video-placeholder">{participant.name.charAt(0)}</div>}
            {/* 참가자 이름 및 음소거/카메라 꺼짐 상태 텍스트 */}
            <div className={`participant-name ${isScreenShareView ? 'screenshare-label' : ''}`}>
                {participant.name}
                {isScreenShareView && <span style={{ color: 'green', fontWeight: 'bold' }}> (화면 공유 중)</span>}     
                {!isScreenShareView && participant.isAudioMuted && <span className="muted-text"> (음소거됨)</span>}     
                {!isScreenShareView && participant.isVideoMuted && <span className="muted-text"> (카메라 꺼짐)</span>}  
            </div>
            {/* 선택되었을 때(스포트라이트) 표시되는 오버레이 */}
            {isSelected && <div className="selected-overlay" aria-hidden="true" />}
        </div>
    );
};

// 화상회의 어플리케이션의 메인 컴포넌트입니다.
const Meeting = () => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = '/lib-jitsi-meet.min.js';
        script.async = true;

        script.onload = () => {
            console.log('JitsiMeetJS 로드 완료! window.JitsiMeetJS:', !!window.JitsiMeetJS);
            handleJoin(); // ✅ 로드 완료 후 실행
        };

        script.onerror = () => {
            console.error('JitsiMeetJS 로드 실패');
        };

        document.body.appendChild(script);
    }, []);

    // --- 어플리케이션 전역 상태 관리 ---
    const [meetingState, setMeetingState] = useState('idle'); // 'idle', 'active' (회의 대기/진행)
    const [isProcessing, setIsProcessing] = useState(false); // 로딩 스피너 (연결 중, 요약 중)
    const [roomName, setRoomName] = useState(''); // 현재 방 이름
    const [userName, setUserName] = useState('최겸'); // 내 이름
    const [participants, setParticipants] = useState([]); // 모든 참가자 목록 (로컬 포함)

    const [isAudioMuted, setIsAudioMuted] = useState(false); // 내 마이크 음소거 상태
    const [isVideoMuted, setIsVideoMuted] = useState(false); // 내 카메라 꺼짐 상태
    const [isScreenSharing, setIsScreenSharing] = useState(false); // 내 화면 공유 상태
    const [showCopiedTooltip, setShowCopiedTooltip] = useState(false); // '초대링크 복사' 툴팁
    const [isRecording, setIsRecording] = useState(false); // 녹음 진행 상태
    const [isNoiseSuppressionEnabled, setIsNoiseSuppressionEnabled] = useState(true); // 잡음 제거 활성화 상태
    const [summaryText, setSummaryText] = useState('녹음 버튼을 눌러 회의 요약을 시작하세요.'); // 요약 내용
    const [recordingStartTime, setRecordingStartTime] = useState(null); // 녹음 시작 시간 (API 전송용)
    const [selectedParticipantId, setSelectedParticipantId] = useState(null); // 스포트라이트된 참가자 ID

    // --- 요약 재시도 관련 상태 ---
    const [lastTranscriptId, setLastTranscriptId] = useState(null); // 실패 시 받은 스크립트 ID
    const [summaryError, setSummaryError] = useState(null); // 요약 실패 에러 메시지

    // --- Jitsi 객체 및 미디어 트랙 참조 관리 (State 대신 Ref 사용) ---
    const JitsiMeetJSRef = useRef(null); // JitsiMeetJS 라이브러리
    const connectionRef = useRef(null); // JitsiConnection 객체 (메인)
    const conferenceRef = useRef(null); // JitsiConference 객체 (메인)
    const localTracksRef = useRef({
        audio: null,
        video: null,
        desktop: null,
        currentActiveVideoTrack: null,
    }); // 내 로컬 트랙
    const participantInfoRef = useRef({}); // 참가자 ID-이름 매핑
    const recordersRef = useRef({}); // 참가자별 MediaRecorder 객체
    const audioChunksRef = useRef({}); // 참가자별 녹음된 오디오 청크

    // 잡음 제거 토글을 위한 2개의 오디오 트랙
    const originalAudioTrackRef = useRef(null); // 원본 마이크 트랙
    const suppressedAudioTrackRef = useRef(null); // 잡음 제거된 마이크 트랙

    // 화면 공유 전용 연결 및 회의 Ref (별도 참가자로 위장)
    const screenShareConnectionRef = useRef(null);
    const screenShareConferenceRef = useRef(null);

    // JaaS 앱 ID
    const appId = 'vpaas-magic-cookie-a80559f9e99043869d59261473365c5a';

    // 참가자 타일을 클릭했을 때 스포트라이트(확대) 상태를 토글합니다.
    const handleParticipantClick = (id) => {
        // 이미 선택된 ID를 다시 클릭하면 null로, 아니면 해당 ID로 설정합니다.
        setSelectedParticipantId((prev) => (prev === id ? null : id));
    };

    // `participants` 상태가 변경될 때마다 화면에 렌더링할 참가자 목록을 계산합니다.
    // 로컬/원격, 카메라/화면공유를 분리하고 정렬하는 복잡한 로직을 담당합니다.
    const allRenderableParticipants = useMemo(() => {
        const local = participants.find((p) => p.isLocal);

        // 1. 로컬 유저가 없으면 (연결 끊김 등) 원격 참가자만 필터링
        if (!local) {
            return participants
                .filter((p) => !p.isLocal)
                .map((p) => {
                    // 원격 화면 공유 참가자 객체 변환
                    if (p.name && p.name.endsWith('-screen')) {
                        return {
                            ...p,
                            id: `${p.id}-desktop`,
                            trackType: 'desktop',
                            desktopTrack: p.videoTrack,
                            videoTrack: p.videoTrack,
                            audioTrack: null,
                            name: p.name.replace('-screen', ' (화면)'),
                        };
                    }
                    // 원격 카메라 참가자 객체
                    const participant = { ...p, trackType: 'camera' };
                    if (!participant.videoTrack && !participant.desktopTrack) return null;
                    return participant;
                })
                .filter(Boolean);
        }

        // --- 로컬 유저가 있는 경우 ---
        const localScreenShareName = `${userName}-screen`;
        const isLocalSharing = !!local.desktopTrack;

        // 2. 원격 참가자 목록 필터링 (내 화면공유 가상 참가자 제외)
        const remoteList = participants
            .filter((p) => !p.isLocal)
            .filter((p) => {
                return !(p.name && p.name === localScreenShareName);
            })
            .map((p) => {
                // 원격 화면 공유 참가자 객체 변환
                if (p.name && p.name.endsWith('-screen')) {
                    return {
                        ...p,
                        id: `${p.id}-desktop`,
                        trackType: 'desktop',
                        desktopTrack: p.videoTrack,
                        videoTrack: p.videoTrack,
                        audioTrack: null,
                        name: p.name.replace('-screen', ' (화면)'),
                    };
                }
                // 원격 카메라 참가자 객체
                return { ...p, trackType: 'camera' };
            });

        // 3. 최종 렌더링 목록 생성 (원격 목록으로 시작)
        const list = [...remoteList];

        // 4. 로컬 원본(고화질) 화면 공유 트랙 추가 (가장 앞에)
        if (isLocalSharing && local.desktopTrack) {
            list.unshift({
                ...local,
                id: `${local.id}-desktop`,
                isLocal: true,
                trackType: 'desktop',
                desktopTrack: local.desktopTrack,
                videoTrack: local.desktopTrack,
                audioTrack: null,
                videoType: 'desktop',
                name: `${local.name} (화면)`,
                isVideoMuted: false,
                audioLevel: 0,
            });
        }

        // 5. 로컬 카메라 트랙 추가 (가장 앞에)
        list.unshift({
            id: local.id,
            name: local.name,
            isLocal: true,
            isAudioMuted: local.isAudioMuted,
            isVideoMuted: local.isVideoMuted,
            videoTrack: localTracksRef.current.video, // 로컬 트랙 ref에서 직접 가져옴
            audioTrack: local.audioTrack,
            desktopTrack: null,
            trackType: 'camera',
            audioLevel: local.audioLevel, // 🌟 [버그 수정] 누락되었던 오디오 레벨 상태 추가
        });

        // 6. 트랙이 없는 항목(예: 오디오 전용 참가자) 최종 필터링
        return list
            .map((p) => {
                if (!p.videoTrack && !p.desktopTrack) return null;
                return p;
            })
            .filter(Boolean);
    }, [participants, userName]);

    // 앱 마운트 시 URL에서 'room' 파라미터를 읽어 방 이름을 설정하고, 언마운트 시 연결을 정리합니다.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const r = params.get('room');
        if (r) setRoomName(r);
        return () => cleanUpConnection(true); // 컴포넌트 언마운트 시 정리
    }, []);

    // 녹음 중 상태일 때, 새 참가자가 입장(participants 변경)하면 해당 참가자의 녹음을 자동으로 시작합니다.
    useEffect(() => {
        if (isRecording) {
            // start recorders for participants with audio track and valid name
            participants.forEach((p) => {
                if (p.audioTrack && p.name && p.name !== '...' && !recordersRef.current[p.id]) {
                    startRecordingForParticipant(p);
                }
            });
        }
    }, [participants, isRecording]);

    // Jitsi 트랙 객체에서 네이티브 MediaStream을 추출하는 헬퍼 함수입니다.
    const jitsiTrackToMediaStream = (jitsiTrack) => {
        console.log('📤 jitsiTrackToMediaStream()');

        if (!jitsiTrack) return null;
        if (jitsiTrack.stream) return jitsiTrack.stream;
        try {
            if (typeof jitsiTrack.getOriginalStream === 'function') {
                const s = jitsiTrack.getOriginalStream();
                if (s) return s;
            }
        } catch (e) {}
        try {
            if (typeof jitsiTrack.getTrack === 'function') {
                const trackObj = jitsiTrack.getTrack();
                if (trackObj) return new MediaStream([trackObj]);
            }
            if (jitsiTrack.getOriginalStream && typeof jitsiTrack.getOriginalStream === 'function') {
                const s2 = jitsiTrack.getOriginalStream();
                if (s2) return s2;
            }
        } catch (e) {}
        return null;
    };

    // 특정 참가자의 오디오 트랙을 MediaRecorder로 녹음 시작합니다.
    const startRecordingForParticipant = (participant) => {
        console.log('🎤🎶 startRecordingForParticipant()');

        const participantId = participant.id;
        if (!participantId || !participant?.audioTrack) return;

        const stream = jitsiTrackToMediaStream(participant.audioTrack);
        if (!stream) {
            console.warn(`[${participant.name}] no MediaStream available for recording`);
            return;
        }

        if (recordersRef.current[participantId]) return; // 이미 녹음 중이면 return

        try {
            audioChunksRef.current[participantId] = audioChunksRef.current[participantId] || [];

            // MediaRecorder 생성 시 옵션 추가 (백엔드로 보내는 음성 파일 크기 줄이기 위함)
            const options = {
                mimeType: 'audio/webm;codecs=opus', // 코덱 명시 (Opus가 효율적)
                audioBitsPerSecond: 64000, // 오디오 비트레이트 설정 (단위: bps)
                // 예시 값:
                // 128000 (128kbps): 높은 음질 (기본값 근처)
                // 64000 (64kbps): 중간 음질 (파일 크기 감소)
                // 32000 (32kbps): 낮은 음질 (더 작은 파일 크기, STT 정확도 영향 가능)
            };

            const recorder = new MediaRecorder(stream, options); // 옵션 객체 전달
            recordersRef.current[participantId] = recorder;

            // 녹음 데이터(청크)가 발생할 때마다 audioChunksRef에 저장합니다.
            recorder.ondataavailable = (e) => {
                try {
                    if (!audioChunksRef.current[participantId]) audioChunksRef.current[participantId] = [];
                    if (e.data && e.data.size > 0) {
                        audioChunksRef.current[participantId].push(e.data);
                    }
                } catch (err) {
                    console.error('ondataavailable error', err);
                }
            };

            recorder.onstop = () => {
                console.log(`[${participant.name}] recorder.onstop fired`);
            };

            recorder.start(1000); // 1초 단위로 청크 생성
            console.log(`[${participant.name}] recording started`);
        } catch (e) {
            console.error(`[${participant.name}] Failed to start recording:`, e);
        }
    };

    // 특정 참가자의 녹음을 중지합니다. (데이터는 audioChunksRef에 유지)
    const stopRecording = (participantId) => {
        console.log('🎤❌ stopRecording()');

        const id = normalizeId(participantId);
        const r = recordersRef.current[id];
        if (r) {
            try {
                if (r.state === 'recording') r.stop();
            } catch (e) {}
            delete recordersRef.current[id];
        }
    };

    // 모든 참가자의 녹음을 중지하고, 수집된 오디오 청크를 서버 API로 보내 요약을 요청합니다.
    const stopRecordingAndSummarize = async () => {
        console.log('🎤📄 stopRecordingAndSummarize()');
        console.log('Stopping all recordings and preparing for summary...');
        setIsRecording(false);
        setSummaryError(null);
        setLastTranscriptId(null);
        setIsProcessing(true); // 상태 초기화

        setSummaryText('녹음 파일을 취합하여 요약을 생성하고 있습니다...');

        const formData = new FormData();
        if (recordingStartTime) {
            formData.append('startTime', recordingStartTime);
        }

        // 모든 MediaRecorder가 'onstop' 이벤트를 완료할 때까지 기다립니다.
        const stopPromises = Object.keys(recordersRef.current).map((id) => {
            return new Promise((resolve) => {
                const r = recordersRef.current[id];
                if (!r) return resolve();
                const originalOnStop = r.onstop;
                r.onstop = (ev) => {
                    try {
                        originalOnStop?.(ev);
                    } catch (e) {}
                    resolve();
                };
                try {
                    if (r.state === 'recording') r.stop();
                    else resolve();
                } catch (e) {
                    console.warn('error stopping recorder', e);
                    resolve();
                }
            });
        });

        await Promise.all(stopPromises); // Now collect chunks

        // audioChunksRef에 저장된 청크를 Blob으로 변환하여 FormData에 추가합니다.
        let audioFileCount = 0;
        Object.keys(audioChunksRef.current).forEach((id) => {
            const chunks = audioChunksRef.current[id] || [];
            if (chunks.length > 0) {
                const blob = new Blob(chunks, { type: 'audio/webm' });

                // Blob 크기를 콘솔에 로그로 출력
                const participant = participants.find((p) => p.id === id);
                const participantName = participant ? participant.name : id;
                console.log(`🎤 [${participantName}] WebM Blob size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`); // MB 단위로 표시

                formData.append('audio_files', blob, `${participantName}.webm`);
                audioFileCount++;
            }
        }); // clear recorders and chunks

        // 녹음 관련 Ref를 초기화합니다.
        recordersRef.current = {};
        audioChunksRef.current = {};

        if (audioFileCount === 0) {
            setSummaryText('녹음된 오디오가 없습니다.');
            setIsProcessing(false);
            return;
        }

        // 서버로 FormData를 전송하고 요약 결과를 받습니다.
        try {
            const res = await fetch('https://webkit-ilo9-api.duckdns.org/api/summarize-whisper', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                throw new Error(`Server responded with ${res.status}`);
            }

            const data = await res.json();
            const finalSummary = data.summary || '요약을 생성하지 못했습니다.';

            // 서버 응답에 에러가 포함된 경우, 재시도 버튼을 표시하기 위해 상태를 설정합니다.
            if (data.error) {
                setSummaryText(data.error);
                setSummaryError(data.error);
                setLastTranscriptId(data.transcriptId); // 재시도를 위한 ID 저장
            } else {
                setSummaryText(data.summary);
                setSummaryError(null);
                setLastTranscriptId(null); // 성공 시 ID 초기화
            }
            setSummaryText(finalSummary);
        } catch (e) {
            console.error('Failed to get summary:', e);
            setSummaryText(`요약 생성 중 오류가 발생했습니다: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // '재시도' 버튼 클릭 핸들러. 요약 생성 실패 시, 저장된 transcriptId로 서버에 재요청합니다.
    const handleRetry = async () => {
        console.log('🔁handleRetry()');

        if (!lastTranscriptId || !recordingStartTime) {
            alert('재시도에 필요한 정보가 없습니다.');
            return;
        }

        setIsProcessing(true);
        setSummaryText('요약 생성을 재시도합니다...');
        setSummaryError(null);

        try {
            // 이번에는 오디오 파일이 아닌, transcriptId와 startTime만 JSON으로 보냅니다.
            const res = await fetch('https://webkit-ilo9-api.duckdns.org/api/retry-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startTime: recordingStartTime,
                    transcriptId: lastTranscriptId,
                }),
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`서버 응답 오류 ${res.status}: ${errorText}`);
            }

            const data = await res.json();

            // 재시도 결과에 따라 상태 업데이트
            if (data.error) {
                setSummaryText(data.error);
                setSummaryError(data.error);
                setLastTranscriptId(data.transcriptId);
            } else {
                setSummaryText(data.summary);
                setSummaryError(null);
                setLastTranscriptId(null);
            }
        } catch (e) {
            console.error('Failed to retry summary:', e);
            setSummaryText(`재시도 중 오류가 발생했습니다: ${e.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // '녹음' 버튼 클릭 핸들러. 녹음을 시작하거나 중지(및 요약)합니다.
    const toggleRecording = () => {
        console.log('🎛️🎤 toggleRecording()');

        if (isProcessing) return; // 요약 처리 중에는 중복 클릭 방지

        if (!isRecording) {
            // 녹음 시작
            setIsRecording(true);
            setSummaryText('회의 녹음이 시작되었습니다...');
            setRecordingStartTime(new Date().toISOString());
            setSummaryError(null);
            setLastTranscriptId(null);
            // 현재 참가 중인 모든 사람의 녹음 시작
            participants.forEach((p) => {
                if (p.audioTrack && p.name && p.name !== '...' && !recordersRef.current[p.id]) {
                    startRecordingForParticipant(p);
                }
            });
        } else {
            // 녹음 중지 및 요약 시작
            stopRecordingAndSummarize();
        }
    }; // UI toggles

    // '마이크' 버튼 클릭 핸들러. 로컬 오디오 트랙을 음소거/해제합니다.
    const toggleAudio = async () => {
        console.log('🎛️🔊 toggleAudio()');

        // 현재 Jitsi 회의에서 사용 중인 오디오 트랙을 찾습니다. (잡음 제거 트랙 또는 원본 트랙)
        const localParticipant = participants.find((p) => p.isLocal);
        const currentActiveTrack = localParticipant?.audioTrack;

        if (!currentActiveTrack) {
            console.warn('현재 활성화된 오디오 트랙을 찾을 수 없습니다.');
            return;
        }

        const newMutedState = !isAudioMuted;
        // 실제 Jitsi 트랙을 음소거/해제합니다. (다른 참가자에게 신호 전송)
        if (newMutedState) {
            await currentActiveTrack.mute();
        } else {
            await currentActiveTrack.unmute();
        }

        // 버튼 UI 및 내 화면 텍스트를 위한 상태 업데이트
        setIsAudioMuted(newMutedState);
        setParticipants((prev) => prev.map((p) => (p.isLocal ? { ...p, isAudioMuted: newMutedState } : p)));
    };

    // '카메라' 버튼 클릭 핸들러. 로컬 비디오 트랙을 음소거/해제합니다.
    const toggleVideo = async () => {
        console.log('🎛️🎬 toggleVideo()');

        const videoTrack = localTracksRef.current.video;
        if (!videoTrack) return;

        const newMutedState = !isVideoMuted;

        // 실제 Jitsi 트랙을 음소거/해제합니다.
        if (newMutedState) {
            await videoTrack.mute();
        } else {
            await videoTrack.unmute();
        }
        // UI 상태 업데이트
        setIsVideoMuted(newMutedState);
        setParticipants((prev) => prev.map((p) => (p.isLocal ? { ...p, isVideoMuted: newMutedState } : p)));
    };

    // '잡음 제거' 버튼 클릭 핸들러. 원본 트랙과 잡음 제거 트랙을 교체합니다.
    const toggleNoiseSuppression = async () => {
        console.log('🎛️📢 toggleNoiseSuppression()');

        const conference = conferenceRef.current;
        if (!conference || !originalAudioTrackRef.current || !suppressedAudioTrackRef.current) {
            console.warn('트랙이 준비되지 않았습니다.');
            return;
        }

        // 현재 상태에 따라 교체할 트랙을 결정합니다.
        const currentTrack = isNoiseSuppressionEnabled
            ? suppressedAudioTrackRef.current
            : originalAudioTrackRef.current;
        const newTrack = isNoiseSuppressionEnabled ? originalAudioTrackRef.current : suppressedAudioTrackRef.current;

        try {
            // Jitsi 회의의 실제 오디오 트랙을 교체합니다.
            await conference.replaceTrack(currentTrack, newTrack);
            // React의 로컬 상태(UI, 녹화 등)도 새 트랙으로 업데이트합니다.
            setParticipants((prev) => prev.map((p) => (p.isLocal ? { ...p, audioTrack: newTrack } : p)));
            // 토글 상태 변경
            setIsNoiseSuppressionEnabled(!isNoiseSuppressionEnabled);
            console.log(`🔊 잡음 제거 ${!isNoiseSuppressionEnabled ? '활성화' : '비활성화'}`);
        } catch (e) {
            console.error('오디오 트랙 교체 실패:', e);
        }
    };

    // screenshareTrack: JitsiLocalTrack (desktopTrack)
    // screenConf: screenShareConferenceRef.current (JitsiConference instance)
    async function raiseScreenshareSenderBitrate(screenConf, screenshareTrack, attempts = 8, delayMs = 500) {
        if (!screenConf || !screenshareTrack) {
            console.warn('raiseScreenshareSenderBitrate: missing args');
            return false;
        }

        const targetTrackId =
            (screenshareTrack.getTrack && screenshareTrack.getTrack().id) || screenshareTrack.getId?.();

        for (let i = 1; i <= attempts; i++) {
            try {
                // 1) JitsiConference API로 현재 활성 PeerConnection(TraceablePeerConnection) 얻기
                const tpc =
                    typeof screenConf.getActivePeerConnection === 'function'
                        ? screenConf.getActivePeerConnection()
                        : null;

                if (!tpc) {
                    console.info(`attempt ${i}: active TraceablePeerConnection not available yet`);
                    await new Promise((r) => setTimeout(r, delayMs));
                    continue;
                }

                // 2) TraceablePeerConnection 내부의 real RTCPeerConnection
                const pc = tpc.peerconnection || tpc.getPeerconnection?.() || null;
                if (!pc) {
                    console.info(`attempt ${i}: peerconnection missing on TraceablePeerConnection`);
                    await new Promise((r) => setTimeout(r, delayMs));
                    continue;
                }

                // 3) senders 중 screenshare 트랙을 보내는 sender 찾기
                const senders = typeof pc.getSenders === 'function' ? pc.getSenders() : [];
                const sender = senders.find((s) => s.track && s.track.id === targetTrackId);

                if (!sender) {
                    console.info(`attempt ${i}: sender for track ${targetTrackId} not found yet`);
                    await new Promise((r) => setTimeout(r, delayMs));
                    continue;
                }

                // 4) setParameters로 최대 비트레이트 설정 (예: 2.5 Mbps)
                const params = sender.getParameters ? sender.getParameters() : {};
                if (!params.encodings || params.encodings.length === 0) {
                    params.encodings = [{}];
                }
                // 원하는 수치로 조정하세요. (단위: bps)
                params.encodings[0].maxBitrate = 1_000_000;
                params.encodings[0].active = true;
                // 필요하면 params.encodings[0].active = true; 등 추가

                // setParameters는 브라우저/구현에 따라 Promise 반환
                await sender.setParameters(params);
                console.log('Successfully increased screenshare sender bitrate.');
                return true;
            } catch (err) {
                console.warn(`attempt ${i} failed to set parameters:`, err);
                // 실패 시 재시도
                await new Promise((r) => setTimeout(r, delayMs));
            }
        }

        console.warn('raiseScreenshareSenderBitrate: failed after attempts');
        return false;
    }

    // '화면 공유' 버튼 클릭 핸들러.
    const toggleScreenSharing = async () => {
        console.log('🎛️💻 toggleScreenSharing');

        if (!JitsiMeetJSRef.current || !conferenceRef.current) return;

        const currentCameraTrack = localTracksRef.current.video;

        // 이미 화면 공유 중이라면, 종료 함수를 호출합니다.
        if (isScreenSharing && localTracksRef.current.desktop) {
            await stopScreenShareUser();
            return;
        }

        try {
            if (!isScreenSharing) {
                // --- 1. 화면 공유 시작 ---
                // 1-1. 화면 공유 트랙 생성
                const tracks = await JitsiMeetJSRef.current.createLocalTracks({
                    devices: ['desktop'],
                    options: {
                        audio: false,
                    },
                    constraints: {
                        video: {
                            width: { ideal: 1280, max: 1280 },
                            height: { ideal: 720, max: 720 },
                        },
                    },
                });

                const desktopTrack = tracks.find((t) =>
                    typeof t.isScreenSharing === 'function' ? t.isScreenSharing() : t.videoType === 'desktop'
                );

                if (!desktopTrack || !currentCameraTrack) {
                    console.error('Desktop track not available. Failed to start sharing.');
                    desktopTrack?.dispose();
                    return;
                }

                // 1-2. [핵심] 화면 공유 트랙을 'camera' 타입으로 위장
                desktopTrack.videoType = 'camera';

                // 1-3. 화면 공유용 가상 참가자 이름으로 별도 JWT 토큰 발급
                const screenUserName = `${userName}-screen`;
                const jwtRes = await fetch('https://webkit-ilo9-api.duckdns.org/api/generate-jitsi-jwt', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        roomName: roomName,
                        userName: screenUserName,
                    }),
                });
                if (!jwtRes.ok) throw new Error('Failed to get ScreenShare JWT');
                const { jwt } = await jwtRes.json();

                // 1-4. 화면 공유 전용 JitsiConnection 생성
                const connectionOptions = {
                    hosts: {
                        domain: '8x8.vc',
                        muc: `conference.${appId}.8x8.vc`,
                        focus: 'focus.8x8.vc',
                    },
                    bosh: `https://8x8.vc/http-bind`,
                    serviceUrl: `wss://8x8.vc/${appId}/xmpp-websocket?room=${roomName}`, // 🌟 [핵심 수정] 화면 공유 연결에도 P2P 비활성화 옵션을 명시
                    p2p: { enabled: false },
                };

                const screenConnection = new JitsiMeetJSRef.current.JitsiConnection(null, jwt, connectionOptions);
                screenShareConnectionRef.current = screenConnection; // 2. 🌟 화면 공유 연결 이벤트 리스너 설정 및 연결

                // 1-5. 화면 공유 연결 및 회의 참가 (Promise 사용)
                await new Promise((resolve, reject) => {
                    screenConnection.addEventListener(
                        JitsiMeetJSRef.current.events.connection.CONNECTION_ESTABLISHED,
                        async () => {
                            try {
                                // 화면 공유 전용 JitsiConference 생성
                                const screenConf = screenConnection.initJitsiConference(roomName, {
                                    openBridgeChannel: true,
                                    p2p: { enabled: false },
                                    disableSimulcast: true,
                                    constraints: {
                                        video: {
                                            height: { ideal: 720, max: 720 },
                                            frameRate: { ideal: 15, max: 15 },
                                        },
                                    },
                                    videoQuality: {
                                        preferredCodec: 'VP9', // 또는 H264
                                        maxBitratesVideo: {
                                            desktop: 1000_000, // 1 Mbps
                                        },
                                        minHeightForQualityLvl: {
                                            720: 'standard',
                                            1080: 'high',
                                        },
                                    },
                                });
                                screenShareConferenceRef.current = screenConf;

                                // P2P 오류 방지 리스너
                                screenConf.on(JitsiMeetJSRef.current.events.conference.P2P_STATUS, (isP2P) => {
                                    // P2P 감지 시 즉시 연결 종료 (가상 회의자 만들어서 참가하는 특성상 P2P 방식으로 하면 오류가 뜨더라구요...)
                                    if (isP2P) {
                                        console.warn(
                                            'P2P mode detected on screenshare connection, attempting to disconnect.'
                                        );
                                        stopScreenShareUser();
                                    }
                                });

                                // 화면 공유 트랙 추가 및 회의 참가
                                await screenConf.addTrack(desktopTrack);

                                screenConf.setDisplayName(screenUserName);
                                await screenConf.join();
                                raiseScreenshareSenderBitrate(screenShareConferenceRef.current, desktopTrack);

                                // [핵심] 메인 카메라 트랙을 잠시 음소거/해제하여 서버가 화면 공유를 메인으로 인식하게 함
                                await currentCameraTrack.mute();
                                await currentCameraTrack.unmute();

                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        }
                    );

                    // 연결 실패/끊김 리스너
                    screenConnection.addEventListener(
                        JitsiMeetJSRef.current.events.connection.CONNECTION_FAILED,
                        reject
                    );
                    screenConnection.addEventListener(
                        JitsiMeetJSRef.current.events.connection.CONNECTION_DISCONNECTED,
                        () => reject(new Error('ScreenShare connection disconnected unexpectedly.'))
                    );

                    screenConnection.connect();
                });

                // 1-6. 화면 공유 트랙 Ref에 저장 및 종료 이벤트 리스너(브라우저의 '중지' 버튼) 등록
                localTracksRef.current.desktop = desktopTrack;
                desktopTrack.on(JitsiMeetJSRef.current.events.track.TRACK_ENDED, () => {
                    console.warn('Desktop track ended by user action. Stopping share.');
                    stopScreenShareUser(); // 트랙이 종료되면 화면 공유 정리
                });

                // 1-7. 로컬 상태 업데이트 (내 화면에 화면공유 타일 표시)
                setParticipants((prev) =>
                    prev.map((p) =>
                        p.isLocal
                            ? {
                                  ...p,
                                  desktopTrack: desktopTrack,
                                  videoTrack: null,
                                  videoType: 'camera',
                              }
                            : p
                    )
                );
                setIsScreenSharing(true);
            } else {
                // --- 2. 화면 공유 종료 ---
                await stopScreenShareUser();
                // 로컬 상태 업데이트 (내 화면에서 화면공유 타일 제거, 카메라 타일 복구)
                setParticipants((prev) =>
                    prev.map((p) =>
                        p.isLocal
                            ? {
                                  ...p,
                                  desktopTrack: null,
                                  videoTrack: localTracksRef.current.video,
                                  videoType: 'camera',
                              }
                            : p
                    )
                );
                setIsScreenSharing(false);
            }
        } catch (e) {
            console.error('screen share toggle failed:', e);
            // 실패 시 강제 정리
            localTracksRef.current.desktop?.dispose();
            localTracksRef.current.desktop = null;
            setIsScreenSharing(false);
            stopScreenShareUser();
        }
    };

    // 화면 공유 전용 연결(connection)과 회의(conference)를 안전하게 종료하고 리소스를 해제합니다.
    // SSRC 오류 등을 방지하기 위해 leave/disconnect를 명시적으로 호출합니다.
    const stopScreenShareUser = async () => {
        console.log('❌💻 stopScreenShareUser()');

        const desktopTrack = localTracksRef.current.desktop;
        const screenConf = screenShareConferenceRef.current;
        const screenConn = screenShareConnectionRef.current;

        // 1. 트랙 제거 및 폐기
        if (screenConf && desktopTrack) {
            try {
                await screenConf.removeTrack(desktopTrack);
            } catch (e) {
                console.warn('Error during removeTrack in stopScreenShareUser (IGNORING):', e);
            }
            desktopTrack.dispose();
        }

        // 2. 회의(conference) 떠나기
        if (screenConf) {
            await screenConf.leave();
        }

        // 3. 연결(connection) 끊기
        if (screenConn) {
            await screenConn.disconnect();
        }

        // 4. 로컬 Ref 및 상태 정리
        screenShareConferenceRef.current = null;
        screenShareConnectionRef.current = null;
        localTracksRef.current.desktop = null;

        setParticipants(
            (prev) =>
                prev
                    .map((p) =>
                        p.isLocal
                            ? {
                                  ...p,
                                  desktopTrack: null,
                                  videoType: 'camera',
                              }
                            : p
                    )
                    .filter((p) => !p.name.endsWith('-screen')) // 가상 참가자 목록에서 완전히 제거
        );
        setIsScreenSharing(false);
        console.log('ScreenShare User successfully disconnected. SSRC errors avoided.');
    };

    // Jitsi 회의(conference) 객체에 핵심 이벤트 리스너를 설정합니다.
    const setupConferenceListeners = (conf, JitsiMeetJS) => {
        console.log('🛠️👬 setupConferenceListeners()');

        const events = JitsiMeetJS.events;

        // 1. 회의에 성공적으로 입장했을 때
        conf.on(events.conference.CONFERENCE_JOINED, () => {
            setMeetingState('active');
            setIsProcessing(false);
            const myId = normalizeId(conf.myUserId?.() ?? '');
            participantInfoRef.current[myId] = participantInfoRef.current[myId] || userName;
            console.log('📥 CONFERENCE_JOINED', myId);

            // `participants` 배열에 내(local) 정보가 없으면 추가
            setParticipants((prev) => {
                if (prev.some((p) => p.isLocal)) return prev;
                const localParticipant = {
                    id: myId,
                    name: userName,
                    isLocal: true,
                    videoTrack: localTracksRef.current.video,
                    audioTrack: localTracksRef.current.audio,
                    videoType: localTracksRef.current.desktop ? 'desktop' : 'camera',
                };
                return [localParticipant, ...prev];
            });
        });

        // 2. 다른 참가자가 입장했을 때
        conf.on(events.conference.USER_JOINED, (id, user) => {
            const pid = normalizeId(id);
            const name =
                (user && typeof user.getDisplayName === 'function' && user.getDisplayName()) ||
                participantInfoRef.current[pid] ||
                '...';
            participantInfoRef.current[pid] = name;
            console.log('🙆 USER_JOINED', pid, name);

            // `participants` 배열에 새 참가자 추가
            setParticipants((prev) => {
                const idx = prev.findIndex((p) => p.id === pid);
                if (idx > -1) {
                    return prev.map((p, i) => (i === idx ? { ...p, name } : p));
                }
                return [...prev, { id: pid, name, isLocal: false }];
            });
        });

        // 3. 원격 참가자의 트랙(오디오/비디오/화면공유)이 추가되었을 때
        conf.on(events.conference.TRACK_ADDED, (track) => {
            const isLocal = typeof track.isLocal === 'function' ? track.isLocal() : !!track.isLocal;
            if (isLocal) return; // 로컬 트랙은 무시

            // (TRACK_ADDED 내부) 트랙의 음소거 상태가 변경될 때 UI에 반영
            track.on(JitsiMeetJSRef.current.events.track.TRACK_MUTE_CHANGED, (mutedTrack) => {
                const participantId = mutedTrack.getParticipantId();
                const trackType = mutedTrack.getType();
                const isMuted = mutedTrack.isMuted();
                console.log('🔇🔊 TRACK_MUTE_CHANGED');

                setParticipants((prev) =>
                    prev.map((p) => {
                        if (p.id === participantId) {
                            // 🌟 [수정] 오디오/비디오 상태 분리 업데이트
                            const updatedP = { ...p };
                            if (trackType === 'audio' && p.audioTrack === mutedTrack) {
                                updatedP.isAudioMuted = isMuted;
                            }
                            if (trackType === 'video' && p.videoTrack === mutedTrack) {
                                updatedP.isVideoMuted = isMuted;
                            }
                            return updatedP;
                        }
                        return p;
                    })
                );
            });

            const pid = normalizeId(track.getParticipantId?.());
            const type = typeof track.getType === 'function' ? track.getType() : track.type || 'unknown';
            // Jitsi는 화면 공유 트랙에 videoType을 'desktop'으로 설정합니다.
            const isScreenShare = type === 'video' && (track.videoType === 'screen' || track.videoType === 'desktop');

            const confName = conf.getParticipantById?.(pid)?.getDisplayName?.();
            const name = confName || participantInfoRef.current[pid] || '...';
            if (confName) participantInfoRef.current[pid] = confName;

            console.log('📲 TRACK_ADDED', pid, type, 'isScreenShare=', isScreenShare, 'name=', name);

            // (TRACK_ADDED 내부) 오디오 트랙인 경우, 레벨 리스너를 연결 (isSpeaking 감지용)
            if (type === 'audio') {
                track.on(JitsiMeetJSRef.current.events.track.TRACK_AUDIO_LEVEL_CHANGED, (audioLevel) => {
                    const participantId = normalizeId(track.getParticipantId?.());
                    if (!participantId) return;

                    // participants 상태의 audioLevel을 업데이트
                    setParticipants((prev) => prev.map((p) => (p.id === participantId ? { ...p, audioLevel } : p)));
                });
            }

            // `participants` 배열에 해당 참가자의 트랙 정보(audioTrack, videoTrack, desktopTrack)를 업데이트합니다.
            setParticipants((prev) => {
                const exists = prev.some((p) => p.id === pid);
                // 참가자가 아직 목록에 없으면 새로 추가
                if (!exists) {
                    const newP = {
                        id: pid,
                        name,
                        isLocal: false, // 🌟 [수정] 트랙 타입에 따라 올바른 뮤트 상태 초기화
                        isAudioMuted: type === 'audio' ? track.isMuted() : false,
                        isVideoMuted: type === 'video' && !isScreenShare ? track.isMuted() : false,
                        audioLevel: 0, // 🌟 [추가] audioLevel 초기화 // 화면 공유 트랙을 videoTrack에 직접 연결 (렌더링 로직에서 분리함)
                        ...(type === 'video'
                            ? {
                                  videoTrack: track,
                                  videoType: isScreenShare ? 'desktop' : 'camera',
                              }
                            : {}),
                        ...(type === 'audio' && { audioTrack: track }),
                        _,
                    };
                    return [...prev, newP];
                }

                // 참가자가 이미 있으면 트랙 정보만 업데이트
                return prev.map((p) => {
                    if (p.id === pid) {
                        const updatedP = {
                            ...p,
                            name: p.name === '...' && name !== '...' ? name : p.name,
                        };
                        if (type === 'audio') {
                            updatedP.audioTrack = track;
                            updatedP.isAudioMuted = track.isMuted();
                            updatedP.audioLevel = 0;
                        }

                        // Jitsi의 표준 Multi-stream 방식에 따라 화면공유는 desktopTrack에, 카메라는 videoTrack에 저장
                        if (type === 'video') {
                            if (isScreenShare) {
                                updatedP.desktopTrack = track;
                            } else {
                                updatedP.videoTrack = track;
                                updatedP.videoType = 'camera';
                                updatedP.isVideoMuted = track.isMuted();
                            }
                        }
                        return updatedP;
                    }
                    return p;
                });
            });
        });

        // 4. 원격 참가자의 트랙이 제거되었을 때
        conf.on(events.conference.TRACK_REMOVED, (track) => {
            const pid = normalizeId(track.getParticipantId?.());
            if (!pid) return;
            const type = typeof track.getType === 'function' ? track.getType() : track.type || 'unknown';
            const isScreenShare = type === 'video' && (track.videoType === 'screen' || track.videoType === 'desktop');
            console.log('❌ TRACK_REMOVED', pid, type, 'isScreenShare=', isScreenShare);

            // `participants` 배열에서 해당 트랙 정보를 null로 설정
            setParticipants((prev) => {
                return prev.reduce((acc, p) => {
                    if (p.id !== pid) {
                        acc.push(p);
                        return acc;
                    }
                    const newP = { ...p };
                    if (type === 'video') {
                        if (isScreenShare && newP.desktopTrack === track) {
                            newP.desktopTrack = null;
                        } else if (newP.videoTrack === track) {
                            newP.videoTrack = null;
                            newP.videoType = null;
                        }
                    }
                    if (type === 'audio' && newP.audioTrack === track) newP.audioTrack = null;

                    // 모든 트랙이 제거되고 로컬 참가자가 아니면, 참가자 목록에서 완전히 제거
                    if (!newP.videoTrack && !newP.audioTrack && !newP.desktopTrack && !newP.isLocal) {
                        delete participantInfoRef.current[pid];
                        return acc; // remove participant entirely
                    }
                    acc.push(newP);
                    return acc;
                }, []);
            });
        });

        // 5. 원격 참가자가 퇴장했을 때
        conf.on(events.conference.USER_LEFT, (id) => {
            const pid = normalizeId(id);
            console.log('🙅 USER_LEFT', pid);
            stopRecording(pid); // 해당 참가자의 녹음 중지

            // `participants` 배열에서 참가자 제거
            setParticipants((prev) => {
                prev.forEach((p) => {
                    if (p.id === pid) {
                        // 트랙 리소스 정리
                        [p.videoTrack, p.audioTrack, p.desktopTrack].forEach((track) => {
                            try {
                                track?.dispose?.();
                            } catch (e) {}
                        });
                    }
                });
                return prev.filter((p) => p.id !== pid);
            });
            delete participantInfoRef.current[pid];
        });

        // (사용 안 함) Jitsi의 COMMAND 기능을 이용한 데이터 수신
        conf.on(events.conference.COMMAND_RECEIVED, (cmd, payload) => {
            if (cmd === 'summary_update') setSummaryText(payload?.value || '');
        });
    };

    // 회의를 종료하고 모든 Jitsi 객체, 트랙, 상태를 초기화합니다.
    const cleanUpConnection = (isUnmounting = false) => {
        console.log('🧹 cleanUpConnection()');

        Object.values(recordersRef.current).forEach((r) => {
            try {
                r.stop();
            } catch (e) {}
        });
        recordersRef.current = {};
        audioChunksRef.current = {};
        participantInfoRef.current = {};

        // 모든 로컬 트랙(오디오 원본, 잡음제거, 비디오, 화면공유) 리소스 해제
        try {
            originalAudioTrackRef.current?.dispose();
        } catch (e) {}
        try {
            suppressedAudioTrackRef.current?.dispose();
        } catch (e) {}
        originalAudioTrackRef.current = null;
        suppressedAudioTrackRef.current = null;
        Object.values(localTracksRef.current).forEach((t) => {
            try {
                t?.dispose?.();
            } catch (e) {}
        });
        localTracksRef.current = {
            audio: null,
            video: null,
            desktop: null,
            currentActiveVideoTrack: null,
        };

        // Jitsi 회의 및 연결 종료
        try {
            conferenceRef.current?.leave?.();
        } catch (e) {}
        conferenceRef.current = null;
        try {
            connectionRef.current?.disconnect?.();
        } catch (e) {}
        connectionRef.current = null;
        if (isUnmounting) return; // 앱 종료 시에는 상태 초기화 불필요

        // 모든 React 상태를 초기값으로 리셋
        setMeetingState('idle');
        setSummaryText('회의 시작...');
        setParticipants([]);
        setRoomName('');
        setIsAudioMuted(false);
        setIsVideoMuted(false);
        setIsScreenSharing(false);
        setIsRecording(false);
        setIsNoiseSuppressionEnabled(false);

        // URL에서 'room' 파라미터 제거
        const url = new URL(window.location);
        url.searchParams.delete('room');
        window.history.pushState({}, '', url);
    };

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

    // '회의 참가/시작' 버튼 클릭 핸들러. connectJitsi를 호출합니다.
    const handleJoin = () => {
        console.log('🔧 handleJoin()');

        if (!userName.trim()) {
            alert('Please enter your name.');
            return;
        }
        connectJitsi(roomName || null, userName);
    };

    // '초대링크 복사' 버튼 클릭 핸들러.
    const copyInviteLink = () => {
        console.log('📋️ copyInviteLink()');

        if (!roomName) return;
        const inviteLink = `${window.location.origin}${window.location.pathname}?room=${roomName}`;
        navigator.clipboard.writeText(inviteLink).then(() => {
            setShowCopiedTooltip(true);
            setTimeout(() => setShowCopiedTooltip(false), 2000);
        });
    };

    // --- 메인 렌더링 ---
    return (
        <div className="app-container">
            {/* Jitsi 비디오 및 컨트롤이 포함된 메인 영역 */}
            <div className="jitsi-container">
                {/* 1. 'idle' 상태: 로비(참가 전) 화면 렌더링 */}
                {meetingState === 'idle' ? (
                    <div className="join-container">
                        회의 준비 중...
                        <div
                            className="spinner"
                            style={{
                                width: '24px',
                                height: '24px',
                                borderWidth: '3px',
                            }}
                        />
                    </div>
                ) : (
                    /* 2. 'active' 상태: 회의 중 화면 렌더링 */
                    <>
                        {/* (회의 중) 모든 원격 참가자의 오디오를 재생하는 숨겨진 컨테이너 */}
                        <div style={{ display: 'none' }}>
                            {participants
                                .filter((p) => !p.isLocal && p.audioTrack) // 로컬이 아니고 오디오 트랙이 있는 모든 참가자
                                .map((p) => (
                                    <AudioTrackPlayer key={`audio-${p.id}`} audioTrack={p.audioTrack} />
                                ))}
                        </div>
                        {/* (회의 중) 참가자 비디오 타일(그리드 또는 스포트라이트)을 렌더링하는 컨테이너 */}  
                        <div className="video-container">
                            {selectedParticipantId
                                ? // 2a. 스포트라이트 모드: 선택된 참가자만 크게 표시
                                  allRenderableParticipants
                                      .filter((p) => p.id === selectedParticipantId)
                                      .map((p) => (
                                          <div key={p.id} className="main-screen-share spotlight">
                                              <ParticipantView
                                                  participant={p}
                                                  // 큰 화면 클릭 시 그리드 뷰로 복귀
                                                  onClick={() => setSelectedParticipantId(null)}
                                                  isSelected
                                              />
                                          </div>
                                      ))
                                : // 2b. 그리드 뷰 모드: 모든 참가자를 타일로 표시
                                  allRenderableParticipants.map((p) => (
                                      <div key={p.id} className="video-element-container">
                                          <ParticipantView
                                              participant={p}
                                              // 타일 클릭 시 스포트라이트
                                              onClick={() => handleParticipantClick(p.id)}
                                              isSelected={selectedParticipantId === p.id}
                                          />
                                      </div>
                                  ))}
                        </div>
                        {/* (회의 중) 하단 컨트롤 버튼 바 */}
                        <div className="controls-container">
                            {/* 초대링크 복사 버튼 */}
                            <button onClick={copyInviteLink} className="control-button">
                                <div className={`tooltip ${showCopiedTooltip ? 'visible' : ''}`}>복사됨!</div>         
                                <div>초대링크 복사</div>
                            </button>
                            {/* 마이크 토글 버튼 */}
                            <button onClick={toggleAudio} className={`control-button ${!isAudioMuted ? 'active' : ''}`}>
                                {isAudioMuted ? <div>MIC OFF</div> : <div>MIC ON</div>}
                            </button>
                            {/* 웹캠 토글 버튼 */}
                            <button onClick={toggleVideo} className={`control-button ${!isVideoMuted ? 'active' : ''}`}>
                                {isVideoMuted ? <div>CAM OFF</div> : <div>CAM ON</div>}
                            </button>
                            {/* 잡음제거 토글 버튼 */}
                            <button
                                onClick={toggleNoiseSuppression}
                                className={`control-button ${isNoiseSuppressionEnabled ? 'active' : ''}`}
                            >
                                {!isNoiseSuppressionEnabled ? <div>잡음제거 OFF</div> : <div>잡음제거 ON</div>}         
                            </button>
                            {/* 화면공유 토글 버튼 */}
                            <button
                                onClick={toggleScreenSharing}
                                className={`control-button ${isScreenSharing ? 'active' : ''}`}
                            >
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M21 16H3V4h18v12zm-2-10H5v8h14V6zM1 18h22v2H1z" />                         
                                </svg>
                            </button>
                            {/* 음성녹음(요약) 토글 버튼 */}
                            <button
                                onClick={toggleRecording}
                                className={`control-button record ${isRecording ? 'active' : ''}`}
                                title={
                                    isProcessing ? '요약 생성 중...' : isRecording ? '녹음 중지 및 요약' : '녹음 시작'
                                }
                                disabled={isProcessing}
                            >
                                {isProcessing && !isRecording ? ( // 녹음 중지가 아닌, 순수 요약 처리 중에만 스피너 표시
                                    <div
                                        className="spinner"
                                        style={{
                                            width: '24px',
                                            height: '24px',
                                            borderWidth: '3px',
                                        }}
                                    />
                                ) : (
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                        {isRecording ? (
                                            <rect x="8" y="8" width="8" height="8" />
                                        ) : (
                                            <circle cx="12" cy="12" r="6" />
                                        )}
                                    </svg>
                                )}
                            </button>
                            {/* 회의 나가기 버튼 */}
                            <button onClick={() => cleanUpConnection()} className="control-button hangup">
                                <div>END</div>
                            </button>
                        </div>
                    </>
                )}
            </div>
            {/* (회의 중) 우측 회의 요약 사이드바 */}
            {/* <div className="summary-container"> */}
            {/* <h2>회의 내용</h2> */}
            {/* <div className="summary-box"> */}
            {/* 서버에서 받은 요약 텍스트(마크다운)를 렌더링 */}
            {/* <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryText}</ReactMarkdown> */}
            {/* 요약 실패 시 '재시도' 버튼 표시 */}
            {/* {summaryError && !isProcessing && lastTranscriptId && ( */}
            {/* <button onClick={handleRetry} className="retry-button" disabled={isProcessing}> */}
            {/* 재시도 */}
            {/* </button> */}
            {/* )} */}
            {/* </div> */}
            {/* </div> */}
        </div>
    );
};

export default Meeting;
