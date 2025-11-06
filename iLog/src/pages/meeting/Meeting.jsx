import { useEffect, useRef, useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './Meeting.css';
import { Button, Container, Form, ListGroup, Modal, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { getUserById } from '../../api/user';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { createNote } from '../../api/note';

// ******** 중간 요약 전송 간격 (ms 단위) ********
const SEGMENT_DURATION_MS = 300000; // == 5분
// ******** 중간 요약 전송 간격 (ms 단위) ********

// ****************** API 서버 기본 주소 ******************
const API_BASE_URL = 'https://webkit-ilo9-api.duckdns.org';

// ****************** API 서버 기본 주소 ******************

/**
 * ID를 일관된 문자열 형식으로 변환합니다.
 */
const normalizeId = (id) => String(id ?? '');

/**
 * Jitsi 트랙을 DOM 노드에 안전하게 연결(attach)하고 이전 트랙을 해제(detach) 합니다.
 */
const safeAttach = (track, node, prevRef) => {
    if (!node) return;
    // 이전 트랙이 있고, 현재 트랙과 다르면 이전 트랙을 해제합니다.
    if (prevRef.current && prevRef.current !== track) {
        try {
            prevRef.current.detach(node);
        } catch (e) {}
        try {
            prevRef.current.dispose?.();
        } catch (e) {}
        prevRef.current = null;
    }
    // 새 트랙이 있으면 노드에 연결합니다.
    if (track && typeof track.attach === 'function') {
        try {
            track.attach(node);
            prevRef.current = track;
        } catch (e) {
            console.warn('attach failed', e);
        }
    }
};

/**
 * 오디오 트랙을 받아 보이지 않는 <audio> 태그로 재생하는 전용 컴포넌트입니다.
 * (원격 참가자의 오디오 재생용)
 */
const AudioTrackPlayer = ({ audioTrack }) => {
    const audioRef = useRef(null);
    const prevAudioRef = useRef(null);

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

    return <audio ref={audioRef} autoPlay playsInline style={{ display: 'none' }} />;
};

/**
 * 개별 참가자의 비디오 타일(카메라 또는 화면공유)을 렌더링합니다.
 */
const ParticipantView = ({ participant, onClick, isSelected }) => {
    const videoRef = useRef(null);
    const prevVideoRef = useRef(null);
    const desktopVideoRef = useRef(null);
    const prevDesktopVideoRef = useRef(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const speakingTimeoutRef = useRef(null);

    // 참가자 발언 감지 (audioLevel)
    useEffect(() => {
        if (participant.audioLevel > 0.01) {
            setIsSpeaking(true);
            if (speakingTimeoutRef.current) {
                clearTimeout(speakingTimeoutRef.current);
                speakingTimeoutRef.current = null;
            }
        } else if (isSpeaking) {
            // 발언이 멈춘 후 100ms 뒤에 'speaking' 상태 해제
            speakingTimeoutRef.current = setTimeout(() => {
                setIsSpeaking(false);
                speakingTimeoutRef.current = null;
            }, 100);
        }
        return () => {
            if (speakingTimeoutRef.current) {
                clearTimeout(speakingTimeoutRef.current);
            }
        };
    }, [participant.audioLevel, isSpeaking]);

    // 화면 공유 여부에 따라 사용할 트랙과 Ref를 결정
    const isScreenShareView = participant.trackType === 'desktop';
    const mainTrack = isScreenShareView ? participant.desktopTrack : participant.videoTrack;
    const mainVideoRef = isScreenShareView ? desktopVideoRef : videoRef;
    const prevMainVideoRef = isScreenShareView ? prevDesktopVideoRef : prevVideoRef;

    // 비디오 트랙을 <video> 태그에 연결
    useEffect(() => {
        const node = mainVideoRef.current;
        const track = mainTrack;
        safeAttach(track, node, prevMainVideoRef);
        if (node) node.muted = !!participant.isLocal; // 로컬 비디오는 음소거
        return () => {
            try {
                mainTrack?.detach(node);
            } catch (e) {}
            prevMainVideoRef.current = null;
        };
    }, [mainTrack, participant.isLocal, isScreenShareView, mainVideoRef, prevMainVideoRef]);

    // 로컬 카메라는 좌우 반전(scaleX(-1))
    const videoStyle = {
        transform: participant.isLocal && !isScreenShareView ? 'scaleX(-1)' : 'none',
        display: mainTrack && !(!isScreenShareView && participant.isVideoMuted) ? 'block' : 'none',
        objectFit: 'cover',
    };

    const hasActiveVideo = !!mainTrack && !(!isScreenShareView && participant.isVideoMuted);

    return (
        <div
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
            <video
                ref={mainVideoRef}
                autoPlay
                playsInline
                className={isScreenShareView ? 'desktop-element' : 'video-element'}
                style={videoStyle}
            />
            {/* 비디오가 없을 때 이름 가운데로 표시 */}
            {!mainTrack && <div className="no-video-placeholder">{participant.name.charAt(0)}</div>}
            <div className={`participant-name ${isScreenShareView ? 'screenshare-label' : ''}`}>
                {participant.name}
                {isScreenShareView && <span style={{ color: 'green', fontWeight: 'bold' }}> (화면 공유 중)</span>}
                {!isScreenShareView && participant.isAudioMuted && <span className="muted-text"> (음소거됨)</span>}
                {!isScreenShareView && participant.isVideoMuted && <span className="muted-text"> (카메라 꺼짐)</span>}
            </div>
            {isSelected && <div className="selected-overlay" aria-hidden="true" />}
        </div>
    );
};

// ====================================================================
// 메인 앱 컴포넌트
// ====================================================================
const Meeting = () => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = '/lib-jitsi-meet.min.js';
        script.async = true;

        script.onload = () => {
            console.log('JitsiMeetJS 로드 완료! window.JitsiMeetJS:', !!window.JitsiMeetJS);
            // handleJoin(); // ✅ 로드 완료 후 실행
        };

        script.onerror = () => {
            console.error('JitsiMeetJS 로드 실패');
        };

        document.body.appendChild(script);
    }, []);

    const location = useLocation(); //[sy]이전페이지에서 카메라 꺼짐 정보 받아오기
    const { videoOff } = location.state || {}; //[sy]이전페이지에서 카메라 꺼짐 정보 받아오기

    // --- 어플리케이션 전역 상태 관리 ---
    const [meetingState, setMeetingState] = useState('idle'); // idle | active
    const [isProcessing, setIsProcessing] = useState(false); // 로딩 스피너 (JWT, 연결 중)
    const [roomName, setRoomName] = useState('');
    const [userName, setUserName] = useState('');
    const [participants, setParticipants] = useState([]);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [showCopiedTooltip, setShowCopiedTooltip] = useState(false); // 초대링크 복사 툴팁
    const [isRecording, setIsRecording] = useState(false); // (방장) 녹음 활성화 상태
    const [isNoiseSuppressionEnabled, setIsNoiseSuppressionEnabled] = useState(true);
    const [summaryText, setSummaryText] = useState(''); // 회의 요약 텍스트
    const [recordingStartTime, setRecordingStartTime] = useState(null); // 회의 시작 시간 (ISO string)
    const [selectedParticipantId, setSelectedParticipantId] = useState(null); // 스포트라이트된 참가자

    const [userInfo, setUserInfo] = useState({ name: '', email: '' }); //[sy]user정보 관리 위함
    const [isUserLoaded, setIsUserLoaded] = useState(false); //[sy] 서버에서 회원정보를 다 받아왔는지 확인하기 위함
    const [profileImageUrl, setProfileImageUrl] = useState(''); //[sy]회원 이미지

    // [sy] user 정보 받아옴
    useEffect(() => {
        const fetchUserInfo = async () => {
            try {
                const data = await getUserById(); // ⚠️ userId 인자가 필요하다면 getUserById(userId)로 수정
                let imageUrl = null;

                // --------[sy] 프로필 이미지 경로 설정-------------
                if (data.profileImage) {
                    // 서버에 저장된 정적 파일 경로를 그대로 사용 (Blob ❌)
                    imageUrl = `${API_BASE_URL}${data.profileImage}`;
                    console.log('🖼️ 서버 이미지 경로 사용:', imageUrl);
                }
                //--------------------------------------------------

                // ✅ 유저 정보 + 이미지 모두 저장
                const userData = {
                    name: data.name,
                    email: data.email,
                    imageUrl: imageUrl, // 👈 서버 경로 URL
                };

                setUserInfo(userData);
                setUserName(data.name);
                setIsUserLoaded(true);

                console.log('✅ 서버에서 불러온 유저 정보:', userData);
            } catch (error) {
                console.error('❌ 유저 정보 조회 실패:', error);
            }
        };

        fetchUserInfo();
    }, []);

    // 파일 상단 훅들 옆
    const hasJoinedRef = useRef(false);

    // 자동 참가 useEffect 교체
    useEffect(() => {
        if (!isUserLoaded || hasJoinedRef.current) return;
        hasJoinedRef.current = true; // ✅ 중복 방지
        console.log('🚀 유저 정보 로딩 완료 → 회의 자동 시작');
        handleJoin();
    }, [isUserLoaded]);

    // --- 요약 재시도 관련 상태 ---
    const [lastTranscriptId, setLastTranscriptId] = useState(null); // 요약 실패 시 재시도용 ID
    const [summaryError, setSummaryError] = useState(null); // 요약 실패 시 오류 메시지

    // 중간/최종 오디오 청크를 임시 수집하는 Ref (참가자들의 오디오를 모아서 백엔드로 **한번에** 전송할때 사용함)
    const chunkCollectorRef = useRef([]); // { fileForUpload, participantId, options }

    // --- Jitsi 객체 및 미디어 트랙 참조 관리 ---
    const JitsiMeetJSRef = useRef(null); // JitsiMeetJS 라이브러리 객체
    const connectionRef = useRef(null); // JitsiConnection
    const conferenceRef = useRef(null); // JitsiConference
    const localTracksRef = useRef({ audio: null, video: null, desktop: null, currentActiveVideoTrack: null });
    const participantInfoRef = useRef({}); // { [id]: name } 참가자 이름 저장소
    const recordersRef = useRef({});
    const audioChunksRef = useRef({});
    const nextChunkTimeoutRef = useRef(null); // 다음 청크 전송 타이머 ID (setTimeout)
    const meetingIdRef = useRef(null); // 회의 고유 ID (방장이 생성)
    const partialSendInProgressRef = useRef(false); // 중복 전송 방지 플래그
    const isHostRef = useRef(false); // 방장 여부 상태
    const lastSentAudioDataRef = useRef({}); // (사용 보류) 마지막 성공 전송 데이터
    const cleaningUpRef = useRef(false); // 정리(cleanup) 함수 중복 실행 방지 플래그
    const segmentedRecordersRef = useRef({}); // 세그먼트 레코더 컨트롤러 Ref { [id]: controller }

    // --- 잡음 제거 관련 Ref ---
    const originalAudioTrackRef = useRef(null); // 원본 오디오 (잡음 제거 OFF)
    const suppressedAudioTrackRef = useRef(null); // 잡음 제거된 오디오 (기본)

    // --- 화면 공유 관련 Ref ---
    const screenShareConnectionRef = useRef(null); // 화면 공유용 JitsiConnection
    const screenShareConferenceRef = useRef(null); // 화면 공유용 JitsiConference

    // JaaS 앱 ID
    const appId = 'vpaas-magic-cookie-a80559f9e99043869d59261473365c5a';

    /**
     * 참가자 타일 클릭 핸들러 (스포트라이트)
     */
    const handleParticipantClick = (id) => {
        setSelectedParticipantId((prev) => (prev === id ? null : id));
    };

    /**
     * 렌더링할 참가자 목록 계산 (Memoized)
     * - 로컬 참가자를 항상 최상단에 배치
     * - 화면 공유 트랙을 별도 참가자처럼 분리
     */
    const allRenderableParticipants = useMemo(() => {
        const local = participants.find((p) => p.isLocal);
        if (!local) {
            // 로컬 참가자가 없는 경우 (예: 연결 끊김)
            return participants
                .filter((p) => !p.isLocal)
                .map((p) => {
                    if (p.name && p.name.endsWith('-screen')) {
                        // 원격 화면 공유
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
                    const participant = { ...p, trackType: 'camera' };
                    if (!participant.videoTrack && !participant.desktopTrack) return null;
                    return participant;
                })
                .filter(Boolean);
        }

        // 정상 상태
        const localScreenShareName = `${userName}-screen`;
        const isLocalSharing = !!local.desktopTrack;
        const remoteList = participants
            .filter((p) => !p.isLocal)
            .filter((p) => !(p.name && p.name === localScreenShareName))
            .map((p) => {
                if (p.name && p.name.endsWith('-screen')) {
                    // 원격 화면 공유
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
                return { ...p, trackType: 'camera' };
            });

        const list = [...remoteList];
        if (isLocalSharing && local.desktopTrack) {
            // 로컬 화면 공유
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
        // 로컬 카메라
        list.unshift({
            id: local.id,
            name: local.name,
            isLocal: true,
            isAudioMuted: local.isAudioMuted,
            isVideoMuted: local.isVideoMuted,
            videoTrack: localTracksRef.current.video,
            audioTrack: local.audioTrack,
            desktopTrack: null,
            trackType: 'camera',
            audioLevel: local.audioLevel,
        });
        return list
            .map((p) => {
                if (!p.videoTrack && !p.desktopTrack) return null;
                return p;
            })
            .filter(Boolean);
    }, [participants, userName]);

    /**
     * 앱 마운트 시 URL 파라미터('room') 읽기 및 언마운트 시 정리
     */
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const r = params.get('room');
        if (r) setRoomName(r);
        return () => cleanUpConnection(true);
    }, []);

    /**
     * 컴포넌트 cleanup (세그먼트 레코더 정리)
     */
    useEffect(() => {
        return () => {
            Object.keys(segmentedRecordersRef.current).forEach((pid) => {
                try {
                    segmentedRecordersRef.current[pid].stop();
                } catch (e) {}
            });
            segmentedRecordersRef.current = {};
        };
    }, []);

    /**
     * (방장만) 새 참가자 입장 시 녹음 자동 시작
     */
    useEffect(() => {
        if (partialSendInProgressRef.current) {
            console.log('[useEffect participants] Send in progress. Skipping recording check.');
            return;
        }

        if (isRecording && isHostRef.current) {
            console.log('[useEffect participants] Host & not sending. Checking for new participants to record...');
            participants.forEach((p) => {
                const participantId = normalizeId(p.id);
                // 로컬 아니고, 오디오 트랙 있고, 이름 정상이고, 아직 레코더가 없을 때
                if (
                    !p.isLocal &&
                    p.audioTrack &&
                    p.name &&
                    p.name !== '...' &&
                    !segmentedRecordersRef.current[participantId]
                ) {
                    console.log(
                        `[useEffect participants] Starting recording for new remote participant: ${p.name} (${participantId})`
                    );
                    // [수정] 호출 방식 변경
                    startRecordingForParticipant(p.audioTrack, participantId, p.name);
                }
            });
        }
    }, [participants, isRecording]); // isRecording 의존성 유지 필요 (녹화 시작/중지 시 체크)

    /**
     * (방장만) 다음 중간 요약 전송 타이머를 예약합니다.
     * @param {number} intervalMillis - SEGMENT_DURATION_MS
     */
    const scheduleNextChunkSend = (intervalMillis) => {
        if (nextChunkTimeoutRef.current) {
            clearTimeout(nextChunkTimeoutRef.current);
            nextChunkTimeoutRef.current = null;
        }

        if (!isHostRef.current) {
            console.log('[scheduleNextChunkSend] Not host or recording start time missing. Stopping timer.');
            return;
        }

        // 다음 N분 정각 시점 계산
        const nowMillis = Date.now();
        const startMillis = recordingStartTime ? new Date(recordingStartTime).getTime() : nowMillis;
        const currentIntervalNum = Math.floor((nowMillis - startMillis) / intervalMillis);
        const nextMarkMillis = startMillis + (currentIntervalNum + 1) * intervalMillis;
        const delay = Math.max(nextMarkMillis - nowMillis, 100); // 최소 100ms 딜레이 보장

        console.log(`[scheduleNextChunkSend] Next chunk send scheduled in ${delay}ms`);
        nextChunkTimeoutRef.current = setTimeout(async () => {
            // 타임아웃 콜백 실행 시점에 방장인지 다시 확인
            if (!isHostRef.current) {
                // isRecording 조건 제거
                console.log('[scheduleNextChunkSend timeout] Not host anymore. Stopping timer.');
                return; // 전송 및 다음 예약 중단
            }

            try {
                // 중간 요약 청크 집계 및 전송 트리거
                await triggerSegmentFinalization();
            } catch (error) {
                console.error('[scheduleNextChunkSend timeout] Error during triggerSegmentFinalization:', error);
            } finally {
                // 다음 호출 예약 (방장일 때만)
                if (isHostRef.current) {
                    scheduleNextChunkSend(intervalMillis); // 재귀 호출
                } else {
                    console.log(
                        '[scheduleNextChunkSend timeout finally] Not host anymore AFTER send. Not rescheduling.'
                    );
                }
            }
        }, delay);
    };

    /**
     * (사용 보류) 새 참가자를 위해 과거 오디오 청크 전송 (Fire-and-forget)
     */
    const sendCatchUpChunk = async () => {
        if (!isHostRef.current || Object.keys(lastSentAudioDataRef.current).length === 0) {
            return;
        }
        console.log('🚀 [sendCatchUpChunk] Sending last successful chunk data for new participant...');
        const catchUpFormData = new FormData();
        catchUpFormData.append('meetingId', meetingIdRef.current);
        catchUpFormData.append('startTime', recordingStartTime);
        catchUpFormData.append('isFinal', 'false');
        catchUpFormData.append('isCatchUp', 'true'); // 따라잡기 요청임을 명시 (선택적)
        let catchUpFileCount = 0;
        for (const id in lastSentAudioDataRef.current) {
            const { blob, name } = lastSentAudioDataRef.current[id];
            if (blob && name) {
                const filename = `${name}.webm`;
                catchUpFormData.append('audio_files', blob, filename);
                catchUpFileCount++;
                console.log(`[sendCatchUpChunk] Adding catch-up blob for ${name} (size: ${blob.size} bytes)`);
            }
        }
        if (catchUpFileCount === 0) {
            console.warn('[sendCatchUpChunk] No valid blobs found in lastSentAudioDataRef.');
            return;
        }
        try {
            const url = `${API_BASE_URL}/summaries/audio`;
            const controller = new AbortController();
            const timeoutMs = 15000;
            const timeoutId = setTimeout(() => {
                console.warn(`[sendCatchUpChunk] Fetch timed out after ${timeoutMs}ms.`);
                controller.abort('timeout');
            }, timeoutMs);
            const resp = await fetch(url, { method: 'POST', body: catchUpFormData, signal: controller.signal });
            clearTimeout(timeoutId);
            if (!resp.ok) {
                const errorText = await resp.text().catch(() => '');
                console.error(`[sendCatchUpChunk] Server responded with ${resp.status}: ${errorText}`);
            } else {
                console.log('[sendCatchUpChunk] Catch-up chunk sent successfully.');
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                console.error(`[sendCatchUpChunk] Fetch aborted: ${controller.signal.reason || 'Unknown reason'}`);
            } else {
                console.error('[sendCatchUpChunk] Failed to send catch-up chunk:', err);
            }
        }
    };

    /**
     * Jitsi 트랙 객체에서 네이티브 MediaStream을 추출하는 헬퍼 함수입니다.
     */
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

    // 세그먼트 녹음 방식 활성화 토글
    const enableSegmentedRecording = true;

    /**
     * (방장만) 세그먼트 레코더를 시작하고,
     * onStop 콜백이 chunkCollectorRef에 청크를 수집하도록 설정합니다.
     */
    const startRecordingForParticipant = (audioTrack, participantId, participantName) => {
        console.log(`🎤🎶 startRecordingForParticipant() for: ${participantName || participantId}`);

        if (!participantId || !audioTrack) {
            console.warn(`[startRecordingForParticipant] invalid args:`, participantId, audioTrack);
            return;
        }

        const stream = jitsiTrackToMediaStream(audioTrack);
        if (!stream) {
            console.warn(`[${participantName || participantId}] no MediaStream available.`);
            return;
        }

        // 기존 segmented 레코더가 있으면 중복 생성 방지
        if (segmentedRecordersRef.current[participantId]) {
            console.log(`[startRecordingForParticipant] already have segmented recorder for ${participantId}`);
            return;
        }

        if (enableSegmentedRecording) {
            const controller = startSegmentedRecording(
                participantId,
                participantName,
                stream,
                // onStop 콜백: (중간/최종) 청크를 chunkCollectorRef에 수집
                // 실제 전송은 triggerSegmentFinalization(중간) 또는 cleanUpConnection(최종)이 담당
                async (fileForUpload, pid, optionsFromStop) => {
                    console.log(
                        `[onStopCallback] Collecting blob for ${pid} (isFinal: ${optionsFromStop.isFinal}, name: ${fileForUpload.name})`
                    );
                    chunkCollectorRef.current.push({
                        fileForUpload,
                        participantId: pid,
                        options: optionsFromStop,
                    });
                },
                SEGMENT_DURATION_MS // 반복 주기 (코드 최상단에 있음)
            );
            segmentedRecordersRef.current[participantId] = controller;
            console.log(`[startRecordingForParticipant] segmented recorder started for ${participantId}`);
            return;
        }
    };

    /**
     * [핵심] 집계된 FormData를 서버로 전송하는 공통 함수
     * (중간 요약, 최종 요약 모두 이 함수를 통해 전송됨)
     * @param {FormData} formData - 서버로 보낼 FormData (audio_files 포함)
     */
    async function sendAggregatedFormData(formData) {
        const isFinal = formData.get('isFinal') === 'true';
        const fileCount = formData.getAll('audio_files').length;
        console.log(`[sendAggregatedFormData] Sending ${fileCount} files, isFinal=${isFinal}`);

        try {
            const controller = new AbortController();
            // 여러 파일 전송 시 타임아웃을 넉넉하게 설정 (중간: 60초, 최종: 120초)
            const timeoutMs = isFinal ? 120000 : fileCount > 1 ? 60000 : 45000;
            const timeoutId = setTimeout(() => {
                console.warn(`[sendAggregatedFormData] Fetch timed out after ${timeoutMs}ms.`);
                controller.abort('timeout');
            }, timeoutMs);

            const resp = await fetch(`${API_BASE_URL}/summaries/audio`, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            // --- 서버 응답 공통 처리 ---
            if (!resp.ok) {
                const text = await resp.text().catch(() => '<no body>');
                console.error(
                    `[sendAggregatedFormData] 서버 오류 (isFinal=${isFinal}, status=${resp.status}): ${text}`
                );
                if (isFinal) {
                    setSummaryText(`최종 요약 요청 실패 (HTTP ${resp.status}): ${text.substring(0, 100)}...`);
                }
                return null;
            }

            let json = null;
            try {
                json = await resp.json();
            } catch (e) {
                console.warn(`[sendAggregatedFormData] 서버 응답 JSON 파싱 실패 (isFinal=${isFinal}):`, e);
                if (isFinal) {
                    setSummaryText('최종 요약 응답 처리 실패 (JSON 오류)');
                }
                return null;
            }

            console.log(`[sendAggregatedFormData] 업로드 성공 (isFinal=${isFinal})`, json);

            // 최종 요약일 때만 UI 업데이트
            if (isFinal) {
                console.log('[sendAggregatedFormData] 최종 요약 응답 수신:', json);
                setSummaryText(json?.summary || '최종 요약 생성 완료 (내용 없음)');
                // 재시도 버튼을 위한 상태 설정
                if (json?.error) {
                    setSummaryError(json.error);
                    setLastTranscriptId(json.transcriptId);
                } else {
                    setSummaryError(null);
                    setLastTranscriptId(null);
                }
            }
            // 중간 요약(isFinal:false) 성공 시에는 json을 반환 (UI 업데이트 없음)
            return json;
        } catch (e) {
            console.error(`[sendAggregatedFormData] 전송 실패 (isFinal=${isFinal}):`, e);
            if (e.name === 'AbortError') {
                console.error(
                    `[sendAggregatedFormData] Fetch aborted: ${controller.signal.reason || 'Unknown reason'}`
                );
            }
            if (isFinal) {
                setSummaryText(`최종 요약 요청 중 네트워크 오류 발생: ${e.message}`);
            }
            return null;
        }
    }

    /**
     * (참가자 퇴장 시) 세그먼트 레코더 중지
     */
    function stopSegmentedRecorderForParticipant(participantId) {
        const controller = segmentedRecordersRef.current[participantId];
        if (controller && typeof controller.stop === 'function') {
            try {
                controller.stop();
                console.log(`[Meeting] segmented recorder 중지: ${participantId}`);
            } catch (e) {
                console.warn(`[Meeting] segmented recorder stop 예외: ${participantId}`, e);
            }
            delete segmentedRecordersRef.current[participantId];
        }
    }

    /**
     * 세그먼트 녹음기 (MediaRecorder) 생성 및 제어 로직
     */
    function startSegmentedRecording(participantId, participantName, stream, sendBlobCallback) {
        const options = {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 64000,
        };

        let stopped = false; // 컨트롤러 중지 플래그
        let currentRecorder = null; // 현재 MediaRecorder 인스턴스
        let currentChunks = []; // 현재 세그먼트 청크
        let currentSegmentStartTime = null; // 현재 세그먼트 시작 시간
        let stopPromiseResolve = null; // stop() Promise 해결 함수
        let stopPromise = null; // stop() Promise 자체
        let finalizeOnStop = false; // onstop 핸들러가 finalize 모드로 동작해야 하는지 여부

        // 내부: 스트림 활성 상태 확인
        function isStreamActive(s) {
            try {
                if (!s) return false;
                const tracks = s.getTracks ? s.getTracks() : [];
                return tracks.some((t) => t.readyState === 'live' && !t.muted);
            } catch (e) {
                return false;
            }
        }

        // 내부: 새 MediaRecorder 시작
        function startNewRecorder() {
            if (stopped || !isStreamActive(stream)) {
                console.log(
                    `[segmentRecorder:${participantName}[${participantId}]] 새 레코더 시작 불가 (stopped=${stopped}, streamActive=${isStreamActive(
                        stream
                    )})`
                );
                if (stopPromiseResolve) stopPromiseResolve(); // 시작 못하면 stop 완료 처리
                return null;
            }

            try {
                const recorder = new MediaRecorder(stream, options);
                currentChunks = []; // 청크 초기화
                currentSegmentStartTime = new Date().toISOString(); // 시작 시간 기록

                recorder.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) currentChunks.push(e.data);
                };

                recorder.onerror = (err) => {
                    console.error(`[segmentRecorder:${participantName}[${participantId}]] 레코더 오류:`, err);
                    currentRecorder = null; // 오류난 레코더 참조 제거
                    // 오류 발생 시에도 stopPromise 해결 시도 (cleanup 진행되도록)
                    if (stopped && stopPromiseResolve) stopPromiseResolve();
                };

                // onstop: Blob 생성 및 'sendBlobCallback' (수집기) 호출
                recorder.onstop = async () => {
                    console.log(
                        `[segmentRecorder:${participantName}[${participantId}]] recorder.onstop 이벤트 발생 (Finalize Mode on Stop: ${finalizeOnStop})`
                    );
                    const recorderThatStopped = currentRecorder; // 클로저
                    currentRecorder = null; // 참조 제거
                    const chunksToProcess = [...currentChunks]; // 청크 복사
                    currentChunks = []; // 원본 비우기
                    const segmentStartTime = currentSegmentStartTime;
                    const isFinalSegment = finalizeOnStop; // stop(true) 호출 여부

                    // 처리할 청크가 있을 때만 콜백 호출
                    if (chunksToProcess.length > 0) {
                        try {
                            const blob = new Blob(chunksToProcess, { type: options.mimeType }); // 'audio/webm'
                            // 파일명 생성 (발언자 이름 사용)
                            const safeName = (participantName || participantId || 'participant').replace(/\s+/g, '_');
                            const filename = `${safeName}_${Date.now()}${isFinalSegment ? '_final' : ''}.webm`;
                            const fileForUpload = new File([blob], filename, { type: options.mimeType }); // 'audio/webm'

                            // 콜백으로 전달할 메타데이터 구성
                            const sendOptions = {
                                isFinal: isFinalSegment,
                                startTime: segmentStartTime || recordingStartTime || new Date().toISOString(),
                                meetingId: meetingIdRef.current,
                            };
                            console.log(
                                `[segmentRecorder:${participantName}[${participantId}]] Calling sendBlobCallback with options:`,
                                sendOptions
                            );
                            // 콜백(chunkCollectorRef.push) 실행
                            await sendBlobCallback(fileForUpload, participantId, sendOptions);
                        } catch (e) {
                            console.error(
                                `[segmentRecorder:${participantName}[${participantId}]] Blob 생성/전송 실패 (isFinal=${isFinalSegment}):`,
                                e
                            );
                        }
                    } else {
                        console.log(
                            `[segmentRecorder:${participantName}[${participantId}]] onstop 발생했지만 처리할 청크 없음 (isFinal=${isFinalSegment})`
                        );
                    }

                    // stop(true)로 인한 중지였으면 stopPromise 해결
                    if (isFinalSegment && stopPromiseResolve) {
                        console.log(
                            `[segmentRecorder:${participantName}[${participantId}]] 최종 세그먼트 처리 완료, stop Promise 해결.`
                        );
                        stopPromiseResolve();
                    }
                }; // end onstop

                recorder.start(1000); // 새 레코더 시작(1초마다 ondataavailable 이벤트 발생)
                console.log(`[segmentRecorder:${participantName}[${participantId}]] 새 세그먼트 레코더 시작됨.`);
                return recorder; // 성공
            } catch (err) {
                console.error(
                    `[segmentRecorder:${participantName}[${participantId}]] MediaRecorder 생성/시작 실패:`,
                    err
                );
                // 실패 시에도 stopPromise 해결 시도
                if (stopped && stopPromiseResolve) stopPromiseResolve();
                return null; // 실패
            }
        } // end startNewRecorder

        // (외부 호출) 현재 세그먼트 종료 및 다음 세그먼트 시작
        async function finalizeAndRestartSegment() {
            if (stopped) {
                console.log(`[segmentRecorder:${participantName}[${participantId}]] 현재 세그먼트 종료됨...`);
                return;
            }

            const recorderToStop = currentRecorder;
            if (recorderToStop && recorderToStop.state === 'recording') {
                console.log(`[segmentRecorder:${participantName}[${participantId}]] 현재 세그먼트 종료 중...`);
                try {
                    finalizeOnStop = false; // '중간' 청크임
                    recorderToStop.stop();
                } catch (e) {
                    console.warn(
                        `[segmentRecorder:${participantName}[${participantId}]] recorder.stop() 예외 (finalizeAndRestart):`,
                        e
                    );
                }
                await new Promise((resolve) => setTimeout(resolve, 50)); // onstop 처리 시간 확보
            } else {
                console.log(`[segmentRecorder:${participantName}[${participantId}]] 종료할 활성 레코더 없음.`);
            }

            // 다음 세그먼트 녹음 시작
            console.log(`[segmentRecorder:${participantName}[${participantId}]] 다음 세그먼트 시작 중...`);
            currentRecorder = startNewRecorder();
        } // end finalizeAndRestartSegment

        // (외부 호출) 녹음기 완전 중지 (finalize=true 시 최종 청크 생성)
        function stopLoop(finalize = false) {
            if (stopped) return stopPromise || Promise.resolve();
            stopped = true;
            finalizeOnStop = finalize; // onstop 핸들러가 'isFinal' 플래그로 사용
            console.log(
                `[segmentRecorder:${participantName}[${participantId}]] stopLoop 호출 (finalize=${finalize}, finalizeOnStop=${finalizeOnStop})`
            );

            if (!stopPromise) {
                stopPromise = new Promise((resolve) => {
                    stopPromiseResolve = resolve;
                });
            }

            const recorderToStop = currentRecorder;
            if (recorderToStop && recorderToStop.state === 'recording') {
                try {
                    console.log(
                        `[segmentRecorder:${participantName}[${participantId}]] recorder.stop() 호출 시도... (finalize=${finalize})`
                    );
                    recorderToStop.stop();
                } catch (e) {
                    console.warn(
                        `[segmentRecorder:${participantName}[${participantId}]] recorder.stop() 예외 (stopLoop):`,
                        e
                    );
                    currentRecorder = null;
                    if (stopPromiseResolve) stopPromiseResolve();
                }
            } else {
                console.log(`[segmentRecorder:${participantName}[${participantId}]] 중지할 활성 레코더 없음.`);
                if (stopPromiseResolve) stopPromiseResolve();
            }

            return stopPromise;
        } // end stopLoop

        // --- 초기 시작 ---
        currentRecorder = startNewRecorder();
        if (!currentRecorder) {
            console.warn(`[segmentRecorder:${participantName}[${participantId}]] 초기 레코더 시작 실패`);
        }
        // --- 초기 시작 끝 ---

        // 외부 제어 메서드 반환
        return { finalizeAndRestartSegment, stop: stopLoop };
    } // end startSegmentedRecording

    /**
     * (방장만) 타이머(N분)에 의해 호출:
     * 중간 요약 청크를 집계하여 'sendAggregatedFormData'로 전송
     */
    const triggerSegmentFinalization = async () => {
        console.log(`⏰ triggerSegmentFinalization called. isHost=${isHostRef.current}`);
        if (!isHostRef.current) {
            console.log('⏰ Skipping trigger: Not host.');
            return;
        }

        // 1. 이전 실행에서 남은 데이터가 있다면 비움
        chunkCollectorRef.current = [];
        console.log('⏰ Triggering segment finalization for all recorders...');

        const recorderIds = Object.keys(segmentedRecordersRef.current || {});
        if (recorderIds.length === 0) {
            console.log('⏰ No active segmented recorders found.');
            return;
        }

        // 2. 모든 레코더의 세그먼트 종료/재시작 (onStop 콜백이 chunkCollectorRef를 채움)
        const finalizePromises = recorderIds.map((id) => {
            const controller = segmentedRecordersRef.current[id];
            if (controller && typeof controller.finalizeAndRestartSegment === 'function') {
                // 개별 호출 오류는 catch하여 전체 중단 방지
                return controller.finalizeAndRestartSegment().catch((err) => {
                    console.error(`[triggerSegmentFinalization] Error finalizing recorder ${id}:`, err);
                });
            }
            return Promise.resolve();
        });

        // 3. 모든 stop()이 시작될 때까지 대기
        await Promise.all(finalizePromises);

        // 4. onStop 이벤트가 완료되고 chunkCollectorRef가 채워질 시간을 300ms 대기
        await new Promise((resolve) => setTimeout(resolve, 300));

        console.log('⏰ All recorders triggered. Collected chunks:', chunkCollectorRef.current.length);

        // 5. 수집된 청크가 없으면 전송 중단
        const collectedChunks = [...chunkCollectorRef.current];
        chunkCollectorRef.current = [];
        if (collectedChunks.length === 0) {
            console.log('⏰ No audio blobs were collected in this interval. Skipping send.');
            return;
        }

        // 6. 단일 FormData를 빌드하여 모든 청크(파일) 추가
        const formData = new FormData();
        let commonMeetingId = null;
        let commonMeetingStartTime = recordingStartTime; // 전역 회의 시작 시간
        let commonChunkStartTime = null; // 이 *배치*의 시작 시간 (가장 이른 시간)

        collectedChunks.forEach(({ fileForUpload, participantId, options }) => {
            // 백엔드는 audio_files 리스트를 순회하며 filename에서 발언자를 추측함
            formData.append('audio_files', fileForUpload, fileForUpload.name);
            if (!commonMeetingId) commonMeetingId = options.meetingId;
            // 이 배치의 시작 시간을 가장 이른 청크의 시작 시간으로 설정
            const chunkStart = options.startTime;
            if (chunkStart && (!commonChunkStartTime || chunkStart < commonChunkStartTime)) {
                commonChunkStartTime = chunkStart;
            }
        });

        // 공통 메타데이터 추가
        formData.append('meetingId', commonMeetingId || meetingIdRef.current || `meeting-${Date.now()}`);
        formData.append('startTime', commonMeetingStartTime || new Date().toISOString()); // 회의 시작 시간
        formData.append('chunkStartTime', commonChunkStartTime || new Date().toISOString()); // 배치 시작 시간
        formData.append('isFinal', 'false'); // 타이머로 인한 전송은 항상 '중간' 요약임

        console.log(`[triggerSegmentFinalization] Sending ${collectedChunks.length} blobs in ONE request...`);

        // 7. 집계된 폼을 'sendAggregatedFormData'로 *한 번만* 전송
        try {
            await sendAggregatedFormData(formData);
        } catch (e) {
            console.error('[triggerSegmentFinalization] Aggregated send failed:', e);
        }

        console.log('⏰ Segment finalization and aggregated send finished.');
    };

    /**
     * 특정 참가자의 녹음을 중지합니다.
     * (현재는 TRACK_REMOVED, USER_LEFT, NoiseToggle에서만 사용)
     */
    const stopRecording = (participantId) => {
        console.log('🎤❌ stopRecording()');
        const id = normalizeId(participantId);

        // 세그먼트 레코더 중지 시도
        const segController = segmentedRecordersRef.current?.[id];
        if (segController) {
            return new Promise((resolve) => {
                try {
                    segController.stop(); // finalize=false (데이터 버림)
                    setTimeout(() => {
                        delete segmentedRecordersRef.current[id];
                        console.log(`[${id}] segmented recorder stopped and removed.`);
                        resolve();
                    }, 200); // 비동기 stop 완료 시간 대기
                } catch (e) {
                    console.warn(`[${id}] segmented stop 예외:`, e);
                    delete segmentedRecordersRef.current[id];
                    resolve();
                }
            });
        }

        // 기존 recordersRef 기반 레코더 중지 로직 (하위 호환성)
        const recorder = recordersRef.current[id];
        return new Promise((resolve) => {
            if (!recorder || recorder.state !== 'recording') {
                console.warn(`[${id}] No active recorder found to stop or already stopped.`);
                delete recordersRef.current[id];
                resolve();
                return;
            }
            recorder.onstop = () => {
                console.log(`[${id}] recorder.onstop event fired.`);
                delete recordersRef.current[id];
                resolve();
            };
            recorder.onerror = (event) => {
                console.error(`[${id}] Recorder error during stop:`, event.error);
                delete recordersRef.current[id];
                resolve();
            };
            try {
                console.log(`[${id}] Calling recorder.stop()...`);
                recorder.stop();
            } catch (e) {
                console.error(`[${id}] Error calling recorder.stop():`, e);
                delete recordersRef.current[id];
                resolve();
            }
        });
    };

    /**
     * '재시도' 버튼 클릭 핸들러
     */
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
            const res = await fetch(`${API_BASE_URL}/summaries/retry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startTime: recordingStartTime, transcriptId: lastTranscriptId, isRetry: true }),
            });
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`서버 응답 오류 ${res.status}: ${errorText}`);
            }
            const data = await res.json();
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

    // --- 미디어 제어 함수들 ---

    const toggleAudio = async () => {
        console.log('🎛️🔊 toggleAudio()');
        const localParticipant = participants.find((p) => p.isLocal);
        const currentActiveTrack = localParticipant?.audioTrack;
        if (!currentActiveTrack) {
            console.warn('현재 활성화된 오디오 트랙을 찾을 수 없습니다.');
            return;
        }
        const newMutedState = !isAudioMuted;
        if (newMutedState) {
            await currentActiveTrack.mute();
        } else {
            await currentActiveTrack.unmute();
        }
        setIsAudioMuted(newMutedState);
        setParticipants((prev) => prev.map((p) => (p.isLocal ? { ...p, isAudioMuted: newMutedState } : p)));
    };
    const toggleVideo = async () => {
        console.log('🎛️🎬 toggleVideo()');
        const videoTrack = localTracksRef.current.video;
        if (!videoTrack) return;
        const newMutedState = !isVideoMuted;
        if (newMutedState) {
            await videoTrack.mute();
        } else {
            await videoTrack.unmute();
        }
        setIsVideoMuted(newMutedState);
        setParticipants((prev) => prev.map((p) => (p.isLocal ? { ...p, isVideoMuted: newMutedState } : p)));
    };
    const toggleNoiseSuppression = async () => {
        console.log('🎛️📢 toggleNoiseSuppression()');

        const conference = conferenceRef.current;
        const localParticipant = participants.find((p) => p.isLocal);
        const myId = localParticipant?.id;

        if (!conference || !originalAudioTrackRef.current || !suppressedAudioTrackRef.current || !myId) {
            console.warn('잡음 제거 토글 실패: 필요한 객체 없음');
            return;
        }

        const currentTrack = isNoiseSuppressionEnabled
            ? suppressedAudioTrackRef.current
            : originalAudioTrackRef.current;
        const newTrack = isNoiseSuppressionEnabled ? originalAudioTrackRef.current : suppressedAudioTrackRef.current;

        try {
            // 1. (세그먼트 이전버전 녹음기 호환성) 기존 레코더 중지
            if (isRecording && recordersRef.current[myId]) {
                console.log(`[NoiseToggle] 기존 레코더 중지 (Track: ${currentTrack.getType()})`);
                await stopRecording(myId);
            }

            // 2. Jitsi 트랙 교체
            console.log(`[NoiseToggle] Jitsi 트랙 교체 중...`);
            await conference.replaceTrack(currentTrack, newTrack);
            console.log(`[NoiseToggle] Jitsi 트랙 교체 완료.`);

            // 3. React 상태 업데이트 (UI 반영용 - 비동기)
            setParticipants((prev) => prev.map((p) => (p.isLocal ? { ...p, audioTrack: newTrack } : p)));

            // 4. 토글 상태 변경
            const newSuppressionState = !isNoiseSuppressionEnabled;
            setIsNoiseSuppressionEnabled(newSuppressionState);

            // 5. 세그먼트 레코더는 트랙 교체 시 자동으로 재시작되지 않으므로,
            // 수동으로 중지하고 새 트랙으로 다시 시작해야 함.
            if (isRecording && myId && localParticipant) {
                // 5.1. 기존 세그먼트 레코더 중지 (finalize=false)
                console.log(`[NoiseToggle] 새 트랙으로 녹음 재시작 (Track: ${newTrack.getType()})`);

                // 5.2. 새 트랙으로 세그먼트 레코더 재시작 (약간의 딜레이 후)
                setTimeout(() => startRecordingForParticipant(newTrack, myId, localParticipant.name), 500);
            }

            console.log(`🔊 잡음 제거 ${newSuppressionState ? '활성화' : '비활성화'}`);
        } catch (e) {
            console.error('오디오 트랙 교체 또는 녹음 재시작 실패:', e);
        }
    };

    // --- 화면 공유 함수들 ---

    const toggleScreenSharing = async () => {
        console.log('🎛️💻 toggleScreenSharing');
        if (!JitsiMeetJSRef.current || !conferenceRef.current) return;
        const currentCameraTrack = localTracksRef.current.video;

        // 화면 공유 중지
        if (isScreenSharing && localTracksRef.current.desktop) {
            await stopScreenShareUser();
            return;
        }

        // 화면 공유 시작
        try {
            if (!isScreenSharing) {
                // 1. 데스크탑 트랙 생성
                const tracks = await JitsiMeetJSRef.current.createLocalTracks({
                    devices: ['desktop'],
                    options: { audio: false },
                    constraints: { video: { width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 } } },
                });
                const desktopTrack = tracks.find((t) =>
                    typeof t.isScreenSharing === 'function' ? t.isScreenSharing() : t.videoType === 'desktop'
                );
                if (!desktopTrack || !currentCameraTrack) {
                    console.error('Desktop track not available.');
                    desktopTrack?.dispose();
                    return;
                }

                // 2. 별도의 '화면공유용 유저'로 접속하기 위해 새 JWT 발급
                desktopTrack.videoType = 'camera'; // 버그 우회(desktop 형식으로 하면 다른 참가자가 볼때 검정화면밖에 안보임)
                const screenUserName = `${userName}-screen`;
                const jwtRes = await fetch(`${API_BASE_URL}/jitsi-jwt`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomName: roomName, userName: screenUserName }),
                });
                if (!jwtRes.ok) throw new Error('Failed to get ScreenShare JWT');
                const { jwt } = await jwtRes.json();

                // 3. Jitsi 연결 옵션 설정
                const connectionOptions = {
                    hosts: { domain: '8x8.vc', muc: `conference.${appId}.8x8.vc`, focus: 'focus.8x8.vc' },
                    bosh: `https://8x8.vc/http-bind`,
                    serviceUrl: `wss://8x8.vc/${appId}/xmpp-websocket?room=${roomName}`,
                    p2p: { enabled: false },
                };
                const screenConnection = new JitsiMeetJSRef.current.JitsiConnection(null, jwt, connectionOptions);
                screenShareConnectionRef.current = screenConnection;

                // 4. '화면공유용 유저' 연결 및 회의 참가
                await new Promise((resolve, reject) => {
                    screenConnection.addEventListener(
                        JitsiMeetJSRef.current.events.connection.CONNECTION_ESTABLISHED,
                        async () => {
                            try {
                                const screenConf = screenConnection.initJitsiConference(roomName, {
                                    openBridgeChannel: true,
                                    p2p: { enabled: false },
                                    disableSimulcast: true,
                                });
                                screenShareConferenceRef.current = screenConf;
                                screenConf.on(JitsiMeetJSRef.current.events.conference.P2P_STATUS, (isP2P) => {
                                    if (isP2P) {
                                        console.warn(
                                            'P2P mode detected on screenshare connection, attempting to disconnect.'
                                        );
                                        stopScreenShareUser();
                                    }
                                });
                                await screenConf.addTrack(desktopTrack);
                                screenConf.setDisplayName(screenUserName);
                                await screenConf.join();
                                await currentCameraTrack.mute();
                                await currentCameraTrack.unmute();
                                resolve();
                            } catch (e) {
                                reject(e);
                            }
                        }
                    );
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
                localTracksRef.current.desktop = desktopTrack;

                // 사용자가 브라우저의 '공유 중지' 버튼을 눌렀을 때
                desktopTrack.on(JitsiMeetJSRef.current.events.track.TRACK_ENDED, () => {
                    console.warn('Desktop track ended by user action. Stopping share.');
                    stopScreenShareUser();
                });

                // 로컬 상태 업데이트
                setParticipants((prev) =>
                    prev.map((p) =>
                        p.isLocal ? { ...p, desktopTrack: desktopTrack, videoTrack: null, videoType: 'camera' } : p
                    )
                );
                setIsScreenSharing(true);
            }
        } catch (e) {
            console.error('screen share toggle failed:', e);
            localTracksRef.current.desktop?.dispose();
            localTracksRef.current.desktop = null;
            setIsScreenSharing(false);
            stopScreenShareUser(); // 실패 시 강제 정리
        }
    };

    /**
     * '화면공유용 유저' 연결 해제 및 정리
     */
    const stopScreenShareUser = async () => {
        console.log('❌💻 stopScreenShareUser()');
        const desktopTrack = localTracksRef.current.desktop;
        const screenConf = screenShareConferenceRef.current;
        const screenConn = screenShareConnectionRef.current;
        if (screenConf && desktopTrack) {
            try {
                await screenConf.removeTrack(desktopTrack);
            } catch (e) {
                console.warn('Error during removeTrack in stopScreenShareUser (IGNORING):', e);
            }
            desktopTrack.dispose();
        }
        if (screenConf) {
            try {
                await screenConf.leave();
            } catch (e) {
                console.warn('Error during screenConf.leave (IGNORING):', e);
            }
        }
        if (screenConn) {
            try {
                await screenConn.disconnect();
            } catch (e) {
                console.warn('Error during screenConn.disconnect (IGNORING):', e);
            }
        }
        screenShareConferenceRef.current = null;
        screenShareConnectionRef.current = null;
        localTracksRef.current.desktop = null;

        // 로컬 상태 복원
        setParticipants((prev) =>
            prev
                .map((p) =>
                    p.isLocal
                        ? { ...p, desktopTrack: null, videoType: 'camera', videoTrack: localTracksRef.current.video }
                        : p
                )
                .filter((p) => !(p.name && p.name.endsWith('-screen')))
        );
        setIsScreenSharing(false);
        console.log('ScreenShare User successfully disconnected.');
    };

    /**
     * Jitsi 회의 이벤트 리스너 설정
     */
    const setupConferenceListeners = (conf, JitsiMeetJS) => {
        console.log('🛠️👬 setupConferenceListeners()');
        const events = JitsiMeetJS.events;

        // 회의에 성공적으로 참가했을 때 (CONFERENCE_JOINED)
        conf.on(events.conference.CONFERENCE_JOINED, () => {
            setMeetingState('active');
            setIsProcessing(false);
            const myId = normalizeId(conf.myUserId?.() ?? '');
            participantInfoRef.current[myId] = participantInfoRef.current[myId] || userName;
            console.log('📥 CONFERENCE_JOINED', myId);
            setParticipants((prev) => {
                if (prev.some((p) => p.isLocal)) return prev;
                const localParticipant = {
                    id: myId,
                    name: userName,
                    email: userInfo.email,
                    imageUrl: userInfo.imageUrl,
                    isLocal: true,

                    videoTrack: localTracksRef.current.video,
                    audioTrack: localTracksRef.current.audio,
                    videoType: 'camera',
                };
                return [localParticipant, ...prev];
            });
        });

        // 다른 참가자가 입장했을 때 (USER_JOINED)
        conf.on(events.conference.USER_JOINED, (id, user) => {
            const pid = normalizeId(id);
            const name = (user && user.getDisplayName()) || participantInfoRef.current[pid] || '...';
            participantInfoRef.current[pid] = name;
            console.log('🙆 USER_JOINED', pid, name);
            setParticipants((prev) => {
                const idx = prev.findIndex((p) => p.id === pid);
                if (idx > -1) {
                    return prev.map((p, i) => (i === idx ? { ...p, name } : p));
                }
                return [...prev, { id: pid, name, isLocal: false }];
            });

            //[sy] 새로 들어온 사람에게 내 정보 전송
            conf.sendMessage({
                type: 'user_info',
                name: userInfo.name,
                email: userInfo.email,
                imageUrl: userInfo.imageUrl,
            });
        });

        // [sy] 다른 참가자에게서 정보(user_info)를 받았을 때
        conf.on(JitsiMeetJS.events.conference.ENDPOINT_MESSAGE_RECEIVED, (participantId, message) => {
            const pid = normalizeId(participantId);
            const data = message.eventData || message; // 메시지 구조 호환성 처리
            if (data.type === 'user_info' && data.email) {
                console.log('📩 사용자 정보 수신:', participantId, data);

                // 참가자 목록 업데이트 (이메일 반영)
                setParticipants((prev) => {
                    // 1️⃣ id 또는 name이 같은 참가자 찾기
                    const idx = prev.findIndex((p) => p.id === pid || (p.name && p.name === data.name));

                    if (idx > -1) {
                        // 2️⃣ 이미 있으면 업데이트 (이메일 추가)
                        return prev.map((p, i) =>
                            i === idx ? { ...p, name: data.name, email: data.email, imageUrl: message.imageUrl } : p
                        );
                    } else {
                        // 3️⃣ 없으면 새로 추가
                        return [
                            ...prev,
                            {
                                id: pid,
                                name: data.name,
                                email: data.email,
                                imageUrl: data.imageUrl || null,
                                isLocal: false,
                            },
                        ];
                    }
                });
            }
        });

        // 트랙(오디오, 비디오, 화면공유)이 추가되었을 때 (TRACK_ADDED)
        conf.on(events.conference.TRACK_ADDED, (track) => {
            const isLocal = track.isLocal();
            if (isLocal) return; // 로컬 트랙은 무시

            // 트랙 음소거/비음소거 이벤트 감지 (TRACK_MUTE_CHANGED)
            track.on(JitsiMeetJSRef.current.events.track.TRACK_MUTE_CHANGED, (mutedTrack) => {
                const participantId = mutedTrack.getParticipantId();
                const trackType = mutedTrack.getType();
                const isMuted = mutedTrack.isMuted();
                console.log('🔇🔊 TRACK_MUTE_CHANGED');
                setParticipants((prev) =>
                    prev.map((p) => {
                        if (p.id === participantId) {
                            const updatedP = { ...p };
                            if (trackType === 'audio' && p.audioTrack === mutedTrack) {
                                updatedP.isAudioMuted = isMuted;
                            }
                            if (
                                trackType === 'video' &&
                                (p.videoTrack === mutedTrack || p.desktopTrack === mutedTrack)
                            ) {
                                updatedP.isVideoMuted = isMuted;
                            } // 화면공유 음소거도 반영
                            return updatedP;
                        }
                        return p;
                    })
                );
            });

            const pid = normalizeId(track.getParticipantId?.());
            const type = track.getType();
            const isScreenShare = type === 'video' && track.videoType === 'desktop';
            const confName = conf.getParticipantById?.(pid)?.getDisplayName?.();
            const name = confName || participantInfoRef.current[pid] || '...';
            if (confName) participantInfoRef.current[pid] = confName;
            console.log('📲 TRACK_ADDED', pid, type, 'isScreenShare=', isScreenShare, 'name=', name);

            if (type === 'audio') {
                // 발언 감지 리스너 (TRACK_AUDIO_LEVEL_CHANGED)
                track.on(JitsiMeetJSRef.current.events.track.TRACK_AUDIO_LEVEL_CHANGED, (audioLevel) => {
                    const participantId = normalizeId(track.getParticipantId?.());
                    if (!participantId) return;
                    setParticipants((prev) => prev.map((p) => (p.id === participantId ? { ...p, audioLevel } : p)));
                });

                // (방장만) 새 참가자의 오디오 트랙이 추가되면 녹음 시작
                if (isHostRef.current && isRecording) {
                    const participantName = participantInfoRef.current[pid] || '...';
                    sendCatchUpChunk(); // (사용 보류)
                    console.log(
                        `[TRACK_ADDED] Host detected. Starting recording for new remote participant: ${participantName} (${pid})`
                    );
                    startRecordingForParticipant(track, pid, participantName);
                }
            }

            // 참가자 상태(participants)에 트랙 정보 업데이트
            setParticipants((prev) => {
                const exists = prev.some((p) => p.id === pid);
                if (!exists) {
                    // 참가자가 목록에 없으면 새로 추가
                    const newP = {
                        id: pid,
                        name,
                        isLocal: false,
                        isAudioMuted: type === 'audio' ? track.isMuted() : false,
                        isVideoMuted: type === 'video' ? track.isMuted() : false,
                        audioLevel: 0,
                    };
                    if (type === 'audio') newP.audioTrack = track;
                    if (type === 'video') {
                        if (isScreenShare) {
                            newP.desktopTrack = track;
                            newP.trackType = 'desktop';
                        } else {
                            newP.videoTrack = track;
                            newP.trackType = 'camera';
                        }
                    }
                    return [...prev, newP];
                }

                // 참가자가 이미 있으면 트랙 정보 업데이트
                return prev.map((p) => {
                    if (p.id === pid) {
                        const updatedP = { ...p, name: p.name === '...' && name !== '...' ? name : p.name };
                        if (type === 'audio') {
                            updatedP.audioTrack = track;
                            updatedP.isAudioMuted = track.isMuted();
                            updatedP.audioLevel = 0;
                        }
                        if (type === 'video') {
                            if (isScreenShare) {
                                updatedP.desktopTrack = track;
                                updatedP.trackType = 'desktop';
                            } else {
                                updatedP.videoTrack = track;
                                updatedP.trackType = 'camera';
                                updatedP.isVideoMuted = track.isMuted();
                            }
                        }
                        return updatedP;
                    }
                    return p;
                });
            });
        });

        // 원격 트랙이 제거되었을 때 (TRACK_REMOVED)
        conf.on(events.conference.TRACK_REMOVED, (track) => {
            const pid = normalizeId(track.getParticipantId?.());
            if (!pid) return;
            const type = track.getType();
            const isScreenShare = type === 'video' && track.videoType === 'desktop';
            console.log('❌ TRACK_REMOVED', pid, type, 'isScreenShare=', isScreenShare);
            stopRecording(pid); // 트랙 제거 시 녹음 중지 시도(이전 버전 레코더 호환성)

            // 참가자 상태에서 해당 트랙 정보 제거
            setParticipants((prev) =>
                prev
                    .map((p) => {
                        if (p.id === pid) {
                            const newP = { ...p };
                            if (type === 'video') {
                                if (isScreenShare && newP.desktopTrack === track) {
                                    newP.desktopTrack = null;
                                    newP.trackType = newP.videoTrack ? 'camera' : null;
                                } else if (newP.videoTrack === track) {
                                    newP.videoTrack = null;
                                    newP.trackType = newP.desktopTrack ? 'desktop' : null;
                                }
                            }
                            if (type === 'audio' && newP.audioTrack === track) {
                                newP.audioTrack = null;
                            }
                            // 오디오 트랙만 제거된 경우 참가자는 유지
                            return newP;
                        }
                        return p;
                    })
                    // 모든 트랙이 없고 로컬 참가자가 아니면 목록에서 제거
                    .filter((p) => !(!p.videoTrack && !p.audioTrack && !p.desktopTrack && !p.isLocal))
            );
        });

        // 다른 참가자가 퇴장했을 때 (USER_LEFT)
        conf.on(events.conference.USER_LEFT, (id) => {
            const pid = normalizeId(id);
            console.log('🙅 USER_LEFT', pid);
            // 녹음 중지
            stopRecording(pid);
            stopSegmentedRecorderForParticipant(id);

            // 참가자 목록에서 제거
            setParticipants((prev) => {
                prev.forEach((p) => {
                    if (p.id === pid) {
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

        // (사용 보류) Jitsi 커맨드 수신 (COMMAND_RECEIVED)
        conf.on(events.conference.COMMAND_RECEIVED, (cmd, payload) => {
            if (cmd === 'summary_update' && !isHostRef.current) {
                // 방장이 아닐 때만 외부 요약 업데이트 수신
                console.log('[COMMAND_RECEIVED]: ');
                console.log(payload?.value || '');
            }
        });
    };

    /**
     * 회의 종료 및 모든 자원 정리
     */
    const cleanUpConnection = async (isUnmounting = false) => {
        // 중복 실행 방지
        if (cleaningUpRef.current && !isUnmounting) {
            console.warn('[cleanUpConnection] Cleanup already in progress, ignoring call.');
            return; // 이미 정리 중이면 중복 실행 방지 (언마운트 시 제외)
        }
        cleaningUpRef.current = true; // 정리 시작 표시
        console.log('🧹 cleanUpConnection() - Starting cleanup...');

        // 1. 중간 요약 타이머 중지
        if (nextChunkTimeoutRef.current) {
            clearTimeout(nextChunkTimeoutRef.current);
            nextChunkTimeoutRef.current = null;
            console.log('[cleanUpConnection] Next chunk timer cleared.');
        }

        // 2. (방장만) 최종 요약 청크를 집계하여 전송
        if (!isUnmounting && meetingState === 'active' && isHostRef.current) {
            console.log('[cleanUpConnection] Host detected. Starting final summary aggregation...');
            setSummaryText('최종 요약이 수행 중입니다...');

            // 2.1. 최종 청크 수집을 위해 collector 비우기
            chunkCollectorRef.current = [];
            console.log('[cleanUpConnection] Cleared chunk collector for final send.');

            // 2.2. 모든 레코더에 'stop(true)' 호출 (onStop 콜백이 chunkCollectorRef를 채움)
            const segKeys = Object.keys(segmentedRecordersRef.current || {});
            const stopPromises = segKeys.map((pid) => {
                return (async () => {
                    try {
                        const controller = segmentedRecordersRef.current[pid];
                        if (controller && typeof controller.stop === 'function') {
                            console.log(`[cleanUpConnection] finalizing segmented recorder for ${pid}`);
                            await controller.stop(true); // 'isFinal: true'로 onStop 콜백 실행
                        }
                    } catch (e) {
                        console.warn(`[cleanUpConnection] finalize stop error for ${pid}`, e);
                    } finally {
                        delete segmentedRecordersRef.current[pid]; // stop이 완료/실패하면 Ref에서 제거
                    }
                })();
            });

            // 2.3. 모든 레코더의 stop()이 완료될 때까지 대기
            await Promise.all(stopPromises);
            console.log(
                '[cleanUpConnection] All recorders finalized. Collected final chunks:',
                chunkCollectorRef.current.length
            );

            // 2.4. 수집된 최종 청크로 단일 FormData 빌드
            const collectedChunks = [...chunkCollectorRef.current];
            chunkCollectorRef.current = []; // Ref 비우기

            if (collectedChunks.length > 0) {
                const formData = new FormData();
                let commonMeetingId = null;
                let commonMeetingStartTime = recordingStartTime;
                let finalMeetingEndTime = new Date().toISOString(); // 현재 시간을 최종 종료 시간으로

                collectedChunks.forEach(({ fileForUpload, participantId, options }) => {
                    formData.append('audio_files', fileForUpload, fileForUpload.name);
                    if (!commonMeetingId) commonMeetingId = options.meetingId;
                });

                formData.append('meetingId', commonMeetingId || meetingIdRef.current);
                formData.append('startTime', commonMeetingStartTime || new Date().toISOString()); // 회의 시작 시간
                formData.append('isFinal', 'true'); // ★ 최종 요약임을 명시
                formData.append('endTime', finalMeetingEndTime); // 회의 종료 시간

                console.log(`[cleanUpConnection] Sending ${collectedChunks.length} FINAL blobs in ONE request...`);

                // 2.5. 집계된 *최종* 폼을 전송하고, 요약이 완료될 때까지 대기
                await sendAggregatedFormData(formData);
                console.log('[cleanUpConnection] Final aggregated send finished.');
            } else {
                console.log('[cleanUpConnection] No final chunks were collected to send.');
            }
        } else if (!isUnmounting) {
            console.log('[cleanUpConnection] Not host or not active, skipping final summary send.');
        }

        // 3. 모든 레코더 Ref 및 오디오 Ref 초기화
        console.log('[cleanUpConnection] Clearing refs...');
        segmentedRecordersRef.current = {}; // 비어있는지 확인
        recordersRef.current = {};
        audioChunksRef.current = {};
        participantInfoRef.current = {};
        lastSentAudioDataRef.current = {};
        Object.keys(recordersRef.current || {}).forEach((pid) => {
            try {
                const r = recordersRef.current[pid];
                if (r && r.state === 'recording') {
                    r.stop();
                }
            } catch (e) {}
            delete recordersRef.current[pid];
        });

        // 4. 로컬 트랙 Dispose
        console.log('[cleanUpConnection] Disposing local tracks...');
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
        localTracksRef.current = { audio: null, video: null, desktop: null, currentActiveVideoTrack: null };

        // 5. React 상태 리셋 (연결 끊기 전에 수행)
        console.log('[cleanUpConnection] Resetting component state...');
        setMeetingState('idle'); // UI가 로비 화면 등으로 바뀔 수 있음
        setParticipants([]);
        // setRoomName(''); // 방 이름은 유지하는 것이 좋을 수 있음 (재접속 고려)
        setIsAudioMuted(false);
        setIsVideoMuted(false);
        setIsScreenSharing(false);
        setIsRecording(false);
        setIsNoiseSuppressionEnabled(true);
        // setSummaryText(''); // 최종 요약이 표시되어야 하므로 여기서 초기화 안 함!
        setRecordingStartTime(null);
        setSelectedParticipantId(null);
        isHostRef.current = false;
        partialSendInProgressRef.current = false;

        // 6. Jitsi 연결 해제
        console.log('[cleanUpConnection] Disconnecting Jitsi...');
        try {
            await stopScreenShareUser(); // 화면 공유 유저 먼저 종료
        } catch (e) {
            console.warn('Error stopping screen share user:', e);
        }
        try {
            if (conferenceRef.current) {
                console.log('Leaving conference...');
                await conferenceRef.current.leave();
                console.log('Left conference.');
            }
        } catch (e) {
            console.warn('Error leaving conference:', e);
        }
        conferenceRef.current = null;

        try {
            if (connectionRef.current) {
                console.log('Disconnecting connection...');
                connectionRef.current.disconnect();
                console.log('Called disconnect on connection.');
            }
        } catch (e) {
            console.warn('Error disconnecting connection:', e);
        }
        connectionRef.current = null;
        console.log('[cleanUpConnection] Jitsi disconnected.');

        if (isUnmounting) {
            cleaningUpRef.current = false;
            return;
        }

        // URL에서 'room' 파라미터 제거
        const url = new URL(window.location);
        url.searchParams.delete('room');
        window.history.pushState({}, '', url);
        cleaningUpRef.current = false; // 정리 완료
        console.log('[cleanUpConnection] Cleanup finished.');
    };

    /**
     * Jitsi 연결 및 회의 시작
     */
    const connectJitsi = async (roomNameToJoin, userDisplayName) => {
        console.log('📲 connectJitsi()');
        if (!navigator.mediaDevices) {
            alert('카메라/마이크 접근 권한이 필요합니다.');
            setIsProcessing(false);
            return;
        }
        if (!window.JitsiMeetJS) {
            alert('Jitsi 라이브러리가 로드되지 않았습니다.');
            return;
        }
        setIsProcessing(true);
        setSummaryText('회의 서버에 연결 중...');

        // ⭐ UUID v4를 사용하여 랜덤하고 고유한 방 이름 생성
        const randomUuid = crypto.randomUUID().replace(/-/g, ''); // 하이픈 제거
        // const currentRoomName = roomNameToJoin || `ilo9-${randomUuid.substring(0, 10)}`; // 일부만 사용하거나 전체 사용
        // setRoomName(currentRoomName);
        const params = new URLSearchParams(window.location.search);
        const roomFromUrl = params.get('room');
        const currentRoomName = roomFromUrl || roomNameToJoin || `ilo9-${randomUuid.substring(0, 10)}`;

        // ✅ 2️⃣ 실제 연결된 방 이름으로 state 동기화
        setRoomName(currentRoomName);
        console.log('📡 연결할 실제 방 이름:', currentRoomName);

        try {
            // 1. Jitsi 라이브러리 초기화
            if (!JitsiMeetJSRef.current) {
                JitsiMeetJSRef.current = window.JitsiMeetJS;
                JitsiMeetJSRef.current.init({ disableAP: true, disableAEC: true });
                JitsiMeetJSRef.current.setLogLevel(JitsiMeetJSRef.current.logLevels.ERROR);
            }
            const JitsiMeetJS = JitsiMeetJSRef.current;

            // 2. 서버에서 JWT 토큰 발급
            const jwtRes = await fetch(`${API_BASE_URL}/jitsi-jwt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomName: currentRoomName, userName: userInfo.name }), //[sy] userDisplayName를 userInfo.name로 바꿈
            });
            if (!jwtRes.ok) throw new Error('Failed to get JWT');
            const { jwt } = await jwtRes.json();

            // 3. Jitsi 연결 설정
            const connectionOptions = {
                hosts: { domain: '8x8.vc', muc: `conference.${appId}.8x8.vc`, focus: 'focus.8x8.vc' },
                bosh: `https://8x8.vc/http-bind`,
                serviceUrl: `wss://8x8.vc/${appId}/xmpp-websocket?room=${currentRoomName}`,
                p2p: { enabled: false },
            };
            const connection = new JitsiMeetJS.JitsiConnection(null, jwt, connectionOptions);
            connectionRef.current = connection;

            // 4. Jitsi 연결 이벤트 리스너 (CONNECTION_ESTABLISHED)
            connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, async () => {
                try {
                    // 4.1. 회의방(Conference) 초기화
                    const conf = connection.initJitsiConference(currentRoomName, {
                        openBridgeChannel: true,
                        disableSimulcast: true,
                        p2p: { enabled: false },
                    });
                    conferenceRef.current = conf;
                    setupConferenceListeners(conf, JitsiMeetJS); // 회의 이벤트 리스너 설정

                    // 4.2. 로컬 미디어 트랙 (오디오, 비디오) 생성
                    const [suppressedTrack] = await JitsiMeetJS.createLocalTracks({
                        devices: ['audio'],
                        constraints: { audio: { noiseSuppression: true, echoCancellation: true } },
                    });
                    const [originalTrack] = await JitsiMeetJS.createLocalTracks({ devices: ['audio'] });
                    const [videoTrack] = await JitsiMeetJS.createLocalTracks({ devices: ['video'] });

                    // Ref에 트랙 저장
                    suppressedAudioTrackRef.current = suppressedTrack; // 잡음 제거 (기본)
                    originalAudioTrackRef.current = originalTrack; // 원본
                    localTracksRef.current.video = videoTrack; // 비디오 트랙
                    localTracksRef.current.audio = suppressedTrack; // 기본 오디오 트랙
                    localTracksRef.current.currentActiveVideoTrack = videoTrack;

                    // [sy] videoOff 값에 따라 초기 비디오 상태 설정
                    if (videoOff) {
                        console.log('🎥 videoOff 설정 감지됨 → 로컬 비디오 트랙 mute');
                        await videoTrack.mute();

                        // toggleVideo가 비디오 트랙 mute/unmute 및 상태 갱신을 담당
                        // videoTrack이 attach되기 전일 수 있으므로 살짝 delay
                        setTimeout(() => {
                            toggleVideo();
                            ensureCssApplied();
                        }, 300);
                    } else {
                        console.log('🎥 videoOff false → 비디오 켜짐 상태로 시작');
                        // setIsVideoMuted(false);
                    }

                    // ✅ 비디오 엘리먼트가 attach된 후에 CSS 적용 재시도
                    const ensureCssApplied = () => {
                        const videoElem = document.querySelector('video');
                        if (videoElem && videoElem.offsetParent !== null) {
                            console.log('🎨 CSS 재적용 시도');
                            const parent = videoElem.closest('.participant, .video-element-container');
                            if (parent && !parent.classList.contains('no-video')) {
                                parent.classList.add('no-video');
                                console.log('✅ no-video 클래스 강제 적용 완료');
                            }
                        } else {
                            setTimeout(ensureCssApplied, 200); // 아직 attach 안됐으면 재시도
                        }
                    };

                    // 로컬 오디오 레벨 리스너 (발언 감지 UI용)
                    const localAudioLevelListener = (audioLevel) => {
                        setParticipants((prev) => prev.map((p) => (p.isLocal ? { ...p, audioLevel } : p)));
                    };
                    suppressedTrack.on(
                        JitsiMeetJSRef.current.events.track.TRACK_AUDIO_LEVEL_CHANGED,
                        localAudioLevelListener
                    );
                    originalAudioTrackRef.current.on(
                        JitsiMeetJSRef.current.events.track.TRACK_AUDIO_LEVEL_CHANGED,
                        localAudioLevelListener
                    );

                    // 4.3. 회의에 로컬 트랙 추가
                    await conf.addTrack(suppressedTrack);
                    await conf.addTrack(videoTrack);

                    // 4.4. (방장만) 녹음 시작 및 첫 중간요약 타이머 설정
                    if (isHostRef.current) {
                        console.log('[connectJitsi] Host detected via Ref. Starting recording setup...');
                        meetingIdRef.current = `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        const startTime = new Date();
                        setIsRecording(true);
                        setRecordingStartTime(startTime.toISOString());
                        setSummaryText(
                            `회의 녹음이 시작되었습니다. ${
                                SEGMENT_DURATION_MS / 1000 / 60
                            }분마다 중간 요약이 생성됩니다.`
                        );
                        setSummaryError(null);
                        setLastTranscriptId(null);

                        const intervalMillis = SEGMENT_DURATION_MS;

                        // 첫 번째 triggerSegmentFinalization 호출 예약 (N분 정각)
                        const nowMillis = startTime.getTime();
                        const nextMarkMillis = Math.ceil(nowMillis / intervalMillis) * intervalMillis;
                        const delay = Math.max(nextMarkMillis - nowMillis, 100);
                        console.log(`[connectJitsi] First segment trigger scheduled in ${delay}ms`);

                        nextChunkTimeoutRef.current = setTimeout(async () => {
                            // 첫 타임아웃 발생 시 방장인지 확인
                            if (!isHostRef.current) {
                                console.log('[connectJitsi initial timeout] Not host anymore before first send.');
                                return;
                            }
                            try {
                                await triggerSegmentFinalization(); // 첫 호출
                            } catch (error) {
                                console.error(
                                    '[connectJitsi initial timeout] Error during first triggerSegmentFinalization:',
                                    error
                                );
                            } finally {
                                // 첫 전송 완료 후 재귀 스케줄링 시작 (방장일 때만)
                                if (isHostRef.current) {
                                    scheduleNextChunkSend(intervalMillis);
                                } else {
                                    console.log(
                                        '[connectJitsi initial timeout finally] Not host anymore AFTER first send. Not scheduling next.'
                                    );
                                }
                            }
                        }, delay);
                    } else {
                        console.log('[connectJitsi] Participant detected via Ref. Recording setup skipped.');
                        setSummaryText('방장이 아닌 참여자로 참가했습니다.');
                    }

                    // 4.5. 로컬 참가자 정보 설정
                    const myId = normalizeId(conf.myUserId?.() ?? '');
                    participantInfoRef.current[myId] = userInfo.name; //[sy] userDisplayName -> userInfo.name
                    const localParticipant = {
                        id: myId,
                        name: userInfo.name, // [sy]서버에서 받은 이름 사용
                        email: userInfo.email, // [sy] 서버에서 받은 이메일 추가
                        imageUrl: userInfo.imageUrl, //[sy] 서버에서 받은 이미지 추가
                        isLocal: true,
                        videoTrack: videoTrack,
                        audioTrack: suppressedTrack,
                        videoType: 'camera',
                        isAudioMuted: false,
                        isVideoMuted: false,
                        audioLevel: 0,
                    };
                    setParticipants([localParticipant]);

                    // 4.6. (방장만) 로컬 참가자 녹음 시작
                    if (isHostRef.current) {
                        startRecordingForParticipant(
                            localParticipant.audioTrack,
                            localParticipant.id,
                            localParticipant.name
                        );
                    }

                    // 4.7. 회의 참가
                    conf.setDisplayName(userInfo.name); //[sy]userDisplayName
                    await conf.join();
                } catch (e) {
                    console.error('Conference initialization or join error:', e);
                    setIsProcessing(false);
                    // 만약에 에러 발생 시 **이곳에** 사용자에게 알림 또는 상태 초기화 로직 추가 가능
                    setSummaryText(`회의 참가 중 오류 발생: ${e.message}`);
                    cleanUpConnection(); // 실패 시 정리
                }
            });

            // 4.8. 연결 실패/끊김 이벤트 리스너 (CONNECTION_FAILED, CONNECTION_DISCONNECTED)
            connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, (err, ...args) => {
                console.error('Connection failed:', err, args);
                setIsProcessing(false);
                setSummaryText(`서버 연결 실패: ${err}`);
                cleanUpConnection();
            });
            connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, (msg) => {
                console.warn('Connection disconnected:', msg);
                if (!cleaningUpRef.current) {
                    // 정리 중이 아닐 때만 호출
                    console.log('[DISCONNECTED_LISTENER] Triggering cleanup...');
                    cleanUpConnection();
                } else {
                    console.log('[DISCONNECTED_LISTENER] Cleanup already in progress, skipping redundant call.');
                }
            });

            // 연결 시작
            connection.connect();
        } catch (e) {
            console.error('Failed to connect to Jitsi:', e);
            setIsProcessing(false);
            setSummaryText(`Jitsi 연결 설정 중 오류: ${e.message}`);
        }
    };

    /**
     * '회의 참가/시작' 버튼 핸들러
     */
    const handleJoin = () => {
        console.log('🔧 handleJoin()');
        const displayName = userInfo.name?.trim();
        // if (!userName.trim()) {
        //     alert('Please enter your name.');
        //     return;
        // }
        // 방 이름이 없으면 '새 회의 시작' (방장), 있으면 '회의 참가' (참가자)
        const joiningExistingRoom = !!roomName;
        isHostRef.current = !joiningExistingRoom;
        console.log(`[handleJoin] Is Host Ref: ${isHostRef.current}`);
        connectJitsi(roomName, userName);
    };

    /**
     * '초대링크 복사' 버튼 핸들러
     */
    const copyInviteLink = () => {
        console.log('📋️ copyInviteLink()');
        if (!roomName) return;
        // const inviteLink = `${window.location.origin}${window.location.pathname}?room=${roomName}`;
        navigator.clipboard.writeText(inviteLink).then(() => {
            setShowCopiedTooltip(true);
            setTimeout(() => setShowCopiedTooltip(false), 2000);
        });
    };

    // ---- [sy]추가 부분 --------
    const inviteLink = `${window.location.origin}${window.location.pathname}?room=${roomName}`;

    const [showModal, setShowModal] = useState(false);

    const openModal = () => {
        console.log('[DEBUG] openModal() 실행');

        setShowModal(true);
    };
    useEffect(() => {
        window.scrollTo(0, 0);

        // 페이지 진입 시 스크롤 막기
        document.body.style.overflow = 'hidden';
        document.body.style.backgroundColor = '#000';

        // 페이지 벗어날 때 스크롤 다시 가능하게
        return () => {
            document.body.style.overflow = 'auto';
            document.body.style.backgroundColor = '';
        };
    }, []);

    // 모달 상태 추가
    const [showSummaryModal, setShowSummaryModal] = useState(false);

    // 기존 cleanUpConnection 호출 뒤에 요약 모달 띄우기
    const handleEndMeeting = async () => {
        console.log('🚪 회의 종료 버튼 클릭됨');
        await cleanUpConnection(); // 기존 정리 로직
        setShowSummaryModal(true); // 종료 후 모달 표시
    };

    const [noteTitle, setNoteTitle] = useState('');
    const [locationQuery, setLocationQuery] = useState('');
    const [folderResults, setFolderResults] = useState([]); // 검색 결과
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [isCreatingNote, setIsCreatingNote] = useState(false);

    // 주소(저장 위치) 검색
    const handleSearchFolder = async () => {
        try {
            // user.js 패턴과 동일: token을 직접 Authorization에 실어 보냄:contentReference[oaicite:2]{index=2}
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
            };

            // ※ 백엔드에 검색 엔드포인트가 없으면, 숫자 입력 폴백만 사용됨
            if (!locationQuery.trim()) {
                setFolderResults([]);
                setSelectedFolder(null);
                return;
            }

            // 폴더 검색 엔드포인트 예시: /folders/search?q=...
            // 없다면 try/catch에서 폴백으로 처리됨
            const res = await api.get('/folders/search', {
                params: { q: locationQuery.trim() },
                headers,
            });
            const rows = res.data?.folders || [];
            setFolderResults(rows);
            setSelectedFolder(null);
        } catch (e) {
            console.warn('폴더 검색 엔드포인트가 없거나 실패했어요. 숫자 입력 시 폴더ID로 폴백합니다.', e);
            setFolderResults([]);
            setSelectedFolder(null);
        }
    };

    // 결과 선택
    const handleSelectFolder = (folder) => {
        setSelectedFolder(folder);
    };

    // “메인으로” 클릭 시 회의록 생성 후 이동
    const handleCreateNoteThenGoHome = async () => {
        if (!noteTitle.trim()) {
            alert('제목을 입력하세요.');
            return;
        }
        if (!summaryText || !summaryText.trim()) {
            alert('요약이 아직 비어있어요. 잠시 후 다시 시도해주세요.');
            return;
        }

        // 선택된 폴더가 없다면, locationQuery가 숫자면 그걸 폴더ID로 사용 (폴백)
        let folderId = selectedFolder?.id;
        if (!folderId && /^\d+$/.test(locationQuery.trim())) {
            folderId = Number(locationQuery.trim());
        }
        if (!folderId) {
            alert('저장 위치(폴더)를 선택하거나 폴더 ID를 숫자로 입력하세요.');
            return;
        }

        setIsCreatingNote(true);
        try {
            await createNote(folderId, {
                title: noteTitle.trim(),
                content: summaryText, // 모달에 보이는 최종 요약
                status: 'MEETING',
            });
            window.location.href = '/';
        } catch (err) {
            console.error('회의록 생성 실패:', err);
            alert('회의록 저장에 실패했습니다. 잠시 후 다시 시도하세요.');
        } finally {
            setIsCreatingNote(false);
        }
    };

    // --- 메인 렌더링 ---
    return (
        <Container className={`container-black`} style={{ overflow: 'hidden' }}>
            {/* 종료 모달 */}
            <Modal show={showSummaryModal} onHide={() => setShowSummaryModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        <i className="bi bi-robot me-1 fs-2"></i> <strong>AI 회의 요약</strong>
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>제목</Form.Label>
                        <div className="d-flex gap-2">
                            <Form.Control
                                className="form-modal"
                                type="text"
                                placeholder="제목을 입력하세요"
                                value={noteTitle}
                                onChange={(e) => setNoteTitle(e.target.value)}
                            />
                            <Button variant="secondary">검색</Button>
                        </div>
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>회의록 위치</Form.Label>
                        <div className="d-flex gap-2">
                            <Form.Control
                                className="form-modal"
                                type="text"
                                placeholder="폴더 경로 또는 ID를 입력하세요"
                                value={locationQuery}
                                onChange={(e) => setLocationQuery(e.target.value)}
                            />
                            <Button variant="secondary" onClick={handleSearchFolder}>
                                검색
                            </Button>
                        </div>
                        {/* 검색 결과 표시 (선택 리스트) */}
                        {folderResults.length > 0 && (
                            <ListGroup className="mt-2" style={{ maxHeight: 160, overflowY: 'auto' }}>
                                {folderResults.map((f) => (
                                    <ListGroup.Item
                                        key={f.id}
                                        action
                                        active={selectedFolder?.id === f.id}
                                        onClick={() => handleSelectFolder(f)}
                                    >
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span>{f.name || `폴더 #${f.id}`}</span>
                                            <small className="text-muted">ID: {f.id}</small>
                                        </div>
                                        {f.path && <div className="text-muted small">{f.path}</div>}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                        {/* 선택 상태 표시 / 폴백 안내 */}
                        <div className="mt-2 small text-muted">
                            {selectedFolder ? (
                                <>
                                    선택된 폴더: <strong>{selectedFolder.name || `#${selectedFolder.id}`}</strong> (ID:{' '}
                                    {selectedFolder.id})
                                </>
                            ) : (
                                '검색이 없거나 실패하면 폴더 ID(숫자)를 직접 입력할 수 있어요.'
                            )}
                        </div>
                    </Form.Group>

                    <div className="summary-box" style={{ height: '30vh', overflowY: 'auto' }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {summaryText || '요약을 불러오는 중입니다...'}
                        </ReactMarkdown>
                    </div>
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-center">
                    <Button
                        className="w-75"
                        variant="primary"
                        onClick={handleCreateNoteThenGoHome}
                        disabled={isCreatingNote}
                    >
                        메인으로
                    </Button>
                </Modal.Footer>
            </Modal>
            {/* 참가자 확인 및 링크 복사 모달 */}
            {showModal && (
                <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static" keyboard={false}>
                    <Modal.Header closeButton>
                        <Modal.Title>회의 참석자</Modal.Title>
                    </Modal.Header>

                    <Modal.Body style={{ borderBottomLeftRadius: '10px', borderBottomRightRadius: '10px' }}>
                        {/* 🔹 초대 링크 복사 영역 */}
                        <Form.Group className="mb-3 d-flex align-items-center">
                            <Form.Control className="form-modal" type="text" value={inviteLink} readOnly />
                            <OverlayTrigger
                                placement="top"
                                overlay={
                                    <Tooltip id="tooltip-copy">{showCopiedTooltip ? '복사됨!' : '복사하기'}</Tooltip>
                                }
                            >
                                <Button
                                    variant={showCopiedTooltip ? 'outline-secondary' : 'secondary'}
                                    onClick={copyInviteLink}
                                    className="ms-2"
                                >
                                    복사
                                </Button>
                            </OverlayTrigger>
                        </Form.Group>

                        {/* 🔹 참가자 목록 */}
                        <ListGroup variant="flush">
                            {participants.map((p, i) => (
                                <ListGroup.Item key={i} className="d-flex align-items-center">
                                    {p.imageUrl ? (
                                        <img
                                            src={p.imageUrl}
                                            alt={`${p.name} 프로필`}
                                            className="rounded-circle me-3"
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : (
                                        <div
                                            className="rounded-circle bg-secondary me-3"
                                            style={{ width: '36px', height: '36px' }}
                                        ></div>
                                    )}

                                    <div className="text-start">
                                        <div className="fw-semibold">{p.name}</div>
                                        <div className="text-muted small">{p.email}</div>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    </Modal.Body>
                </Modal>
            )}
            <div className="jitsi-container">
                <Container className="container-black">
                    {meetingState === 'idle' ? (
                        <>
                            회의 준비 중...
                            <div
                                className="spinner"
                                style={{
                                    width: '24px',
                                    height: '24px',
                                    borderWidth: '3px',
                                }}
                            />
                        </>
                    ) : (
                        <>
                            <div style={{ display: 'none' }}>
                                {participants
                                    .filter((p) => !p.isLocal && p.audioTrack)
                                    .map((p) => (
                                        <AudioTrackPlayer key={`audio-${p.id}`} audioTrack={p.audioTrack} />
                                    ))}
                            </div>
                            <div className="video-container">
                                {selectedParticipantId
                                    ? allRenderableParticipants
                                          .filter((p) => p.id === selectedParticipantId)
                                          .map((p) => (
                                              <div key={p.id} className="main-screen-share spotlight">
                                                  <ParticipantView
                                                      participant={p}
                                                      onClick={() => setSelectedParticipantId(null)}
                                                      isSelected
                                                  />
                                              </div>
                                          ))
                                    : allRenderableParticipants.map((p) => (
                                          <div key={p.id} className="video-element-container">
                                              <ParticipantView
                                                  participant={p}
                                                  onClick={() => handleParticipantClick(p.id)}
                                                  isSelected={selectedParticipantId === p.id}
                                              />
                                          </div>
                                      ))}
                            </div>
                            {/* (회의 중) 하단 컨트롤 버튼 바 */}
                            <div className="pb-2 d-flex justify-content-center gap-2">
                                <Button
                                    className="btn-icon"
                                    variant="outline-primary"
                                    size="lg"
                                    onClick={() => {
                                        console.log('[DEBUG] Button clicked');
                                        openModal();
                                    }}
                                >
                                    <i className="bi bi-people"></i>
                                </Button>

                                {/* 마이크 토글 버튼 */}
                                <Button
                                    className="btn-icon"
                                    size="lg"
                                    key={isAudioMuted ? 'mic-off' : 'mic-on'}
                                    variant={isAudioMuted ? 'primary' : 'outline-primary'}
                                    onClick={toggleAudio}
                                >
                                    {isAudioMuted ? <i className="bi bi-mic-mute"></i> : <i className="bi bi-mic"></i>}
                                </Button>
                                {/* 웹캠 토글 버튼 */}
                                <Button
                                    className="btn-icon"
                                    size="lg"
                                    key={isVideoMuted ? 'camera-off' : 'camera-on'}
                                    variant={isVideoMuted ? 'primary' : 'outline-primary'}
                                    onClick={toggleVideo}
                                >
                                    {isVideoMuted ? (
                                        <i className="bi bi-camera-video-off"></i>
                                    ) : (
                                        <i className="bi bi-camera-video"></i>
                                    )}
                                </Button>

                                {/* 잡음제거 토글 버튼 */}
                                <Button
                                    className="btn-icon"
                                    size="lg"
                                    key={isNoiseSuppressionEnabled ? 'noiseSuppression-off' : 'noiseSuppression-on'}
                                    variant={isNoiseSuppressionEnabled ? 'primary' : 'outline-primary'}
                                    onClick={toggleNoiseSuppression}
                                >
                                    <i className="bi bi-soundwave"></i>
                                </Button>
                                {/* 화면공유 토글 버튼 */}
                                <Button
                                    className="btn-icon"
                                    size="lg"
                                    key={isScreenSharing ? 'screenSharing-off' : 'screenSharing-on'}
                                    variant={isScreenSharing ? 'primary' : 'outline-primary'}
                                    onClick={toggleScreenSharing}
                                >
                                    <i className="bi bi-display"></i>
                                </Button>

                                {/* 회의 나가기 버튼 */}
                                <Button
                                    className="btn-icon"
                                    size="lg"
                                    variant="danger"
                                    onClick={() => {
                                        cleanUpConnection();
                                        handleEndMeeting();
                                    }}
                                >
                                    <i className="bi bi-telephone-x-fill"></i>
                                </Button>
                            </div>
                        </>
                    )}
                </Container>
            </div>
            {/* <div className="summary-container">
                <h2>회의 내용</h2>
                <div className="summary-box">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryText}</ReactMarkdown>
                    재시도 버튼은 방장에게만 표시될 수 있도록 조건 추가 (선택 사항)
                    {isHostRef.current && summaryError && !isProcessing && lastTranscriptId && (
                        <button onClick={handleRetry} className="retry-button" disabled={isProcessing}>
                            재시도
                        </button>
                    )}
                </div>
            </div> */}
        </Container>
    );
};

export default Meeting;
