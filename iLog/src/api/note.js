//여기에 note관련 api정리해서 하십쇼
import api from './axios';

const API_BASE_URL = 'https://webkit-ilo9-api.duckdns.org';

// ✅ 공통 헤더 (모든 요청에 적용)
// [수정] Content-Type 제거. Axios가 FormData를 감지하고 자동으로 설정하도록 합니다.
const defaultHeaders = {
    // 'Content-Type': 'multipart/form-data', // <-- ❌ 이 줄을 삭제했습니다.
    'Content-Type': 'application/json',
};

// ✅ 토큰 가져오기 헬퍼
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * 1. 프로젝트(폴더) 목록 조회 (Root 폴더 조회)
 */
export const getProjects = async () => {
    try {
        const response = await api.get('/folders');
        return response.data; // Root 폴더 객체 반환
    } catch (error) {
        console.error('❌ 프로젝트 목록 로드 실패:', error);
        throw error;
    }
};

/**
 * [추가] 1-1. 특정 프로젝트(폴더) 상세 조회 (하위 회의록 목록 포함)
 * 이 함수를 NoteDetail.jsx에서 사용합니다.
 */
export const getProjectDetails = async (folderId) => {
    try {
        // 토큰이 필요한 요청이므로 'api' 인스턴스 사용
        const response = await api.get(`/folders/${folderId}`);
        // 응답 데이터 예: { folderId: 9, folderName: "웹킷 팀프로젝트", childMinutes: [...] }
        return response.data;
    } catch (error) {
        console.error(`❌ (ID: ${folderId}) 프로젝트 상세 로드 실패:`, error);
        throw error;
    }
};

/**
 * 2. 새 프로젝트(폴더) 생성 (특정 폴더의 자식으로)
 */
export const createProject = async (parentId, projectName) => {
    try {
        const response = await api.post(`/folders/${parentId}`, { folderName: projectName });
        return response.data;
    } catch (error) {
        console.error('❌ 프로젝트 생성 실패:', error);
        throw error;
    }
};

/**
 * 3. 프로젝트 이미지 업로드 (수정)
 */
export const updateProjectImage = async (id, name, file) => {
    const formData = new FormData(); // 👈 "택배 상자" 생성
    formData.append('folderImage', file); // 👈 상자에 "파일" 담기

    // 'api'가 formData를 감지하고 자동으로 Content-Type: multipart/form-data 헤더를 설정
    const response = await api.patch(`/folders/${id}`, formData);

    return response.data;
};

/**
 * 4. 프로젝트 이미지 삭제
 * (가정) DELETE /folders/{folderId}/image
 */
export const deleteProjectImage = async (folderId) => {
    try {
        const response = await api.delete(`/folders/${folderId}/image`);
        return response.data;
    } catch (error) {
        console.error('❌ 이미지 삭제 실패:', error);
        throw error;
    }
};

/**
 * 5. 프로젝트(폴더) 삭제
 * (가정) DELETE /folders/{folderId}
 */
export const deleteProject = async (folderId) => {
    try {
        const response = await api.delete(`/folders/${folderId}`);
        return response.data;
    } catch (error) {
        console.error('❌ 프로젝트 삭제 실패:', error);
        throw error;
    }
};

/**
 * [✅] RAG 인덱싱을 위해 회의록 텍스트 전송
 * POST /rag/index
 * (createNote, updateNote 내부에서 호출됩니다)
 */
export const indexNoteForRAG = async (meetingId, text) => {
    const payload = {
        meetingId: String(meetingId),
        text: text,
    };
    console.group(`🤖 [indexNoteForRAG] (ID: ${meetingId}) RAG 인덱싱 요청`);
    try {
        const headers = {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        };
        const response = await api.post('/rag/index', payload, { headers });
        console.log('✅ RAG 인덱싱 성공:', response.data);
        return response.data;
    } catch (error) {
        console.error(`❌ (ID: ${meetingId}) RAG 인덱싱 실패:`, error.response?.data || error.message);
        throw error; // 에러를 던져서 호출한 쪽(createNote)에서 잡도록 함
    } finally {
        console.groupEnd();
    }
};

/* ==========================
 * 회의록 생성 (로그인 필요)
 * [✅] RAG 인덱싱 로직 포함
 * ========================== */
export const createNote = async (folderId, data) => {
    // 로그 메시지 수정
    console.group('🧾 [createNote] 회의록 생성 및 인덱싱');
    console.log('📁 폴더 ID:', folderId);
    console.log('📝 요청 데이터:', data);

    let createdNoteData; // 생성된 회의록 데이터를 저장할 변수

    try {
        // --- 1. (기존) 회의록 생성 시도 ---
        const headers = {
            ...defaultHeaders,
            ...getAuthHeader(),
        };

        const res = await api.post(`/minutes/${folderId}`, data, { headers });
        console.log('✅ 회의록 생성 성공:', res.data);
        createdNoteData = res.data; // 성공 시 데이터 저장
    } catch (err) {
        // --- 2. (기존) 회의록 생성 실패 시 ---
        if (err.response) {
            console.error('❌ 회의록 생성 실패:', {
                status: err.response.status,
                data: err.response.data,
            });
        } else if (err.request) {
            console.error('🚫 서버 응답 없음:', err.request);
        } else {
            console.error('⚙️ 요청 설정 오류:', err.message);
        }
        console.groupEnd(); // 실패 시에도 groupEnd
        throw err; // 🚨 생성 실패는 에러를 던져서 컴포넌트가 알게 함
    }

    // --- 3. [신규] 회의록 생성 성공 시, RAG 인덱싱 시도 ---
    if (createdNoteData && createdNoteData.id) {
        try {
            const textToIndex = data.content; // 요청 본문에 있던 content
            await indexNoteForRAG(createdNoteData.id, textToIndex);
        } catch (ragError) {
            // 🚨 중요: RAG 인덱싱이 실패해도, 회의록 생성은 성공한 것!
            // 에러를 throw하지 않고, 콘솔에만 기록합니다.
            console.error('⚠️ RAG 인덱싱 실패 (그러나 회의록 생성은 성공함):', ragError);
        }
    } else {
        console.error('⚠️ RAG 인덱싱 스킵: 생성된 회의록 ID를 응답에서 찾을 수 없습니다.');
    }

    console.groupEnd(); // 모든 작업 완료 후 groupEnd
    return createdNoteData; // 생성된 회의록 데이터 반환
};

// [추가] 프로젝트 이름 수정 API
export const updateProjectName = async (folderId, newName) => {
    try {
        // ✅ 1. 'api' 인스턴스 사용 (토큰 자동 주입)
        // ✅ 2. { folderName: newName }으로 변경
        const response = await api.patch(`/folders/${folderId}`, {
            folderName: newName,
        });
        return response.data;
    } catch (error) {
        console.error('API Error updateProjectName:', error);
        throw error;
    }
};

/**
 * 6. 개별 회의록 상세 조회
 * (가정) GET /minutes/{minuteId}
 */
export const getNoteDetails = async (minuteId) => {
    try {
        const response = await api.get(`/minutes/${minuteId}`);
        console.log(`✅ (ID: ${minuteId}) 회의록 상세 로드 성공:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`❌ (ID: ${minuteId}) 회의록 상세 로드 실패:`, error);
        throw error;
    }
};

/**
 * 7. 개별 회의록 수정
 * [✅ 수정] RAG 인덱싱 로직 포함
 */
export const updateNote = async (minuteId, data) => {
    // 로그 메시지 수정
    console.group(`🧾 [updateNote] (ID: ${minuteId}) 회의록 수정 및 인덱싱`);
    console.log('📝 수정 데이터:', data);

    let updatedNoteData; // 수정된 회의록 데이터를 저장할 변수

    try {
        // --- 1. (기존) 회의록 수정 시도 ---
        const headers = {
            'Content-Type': 'application/json',
            ...getAuthHeader(), // ✅ 토큰 추가
        };
        const response = await api.patch(`/minutes/${minuteId}`, data, { headers });
        console.log('✅ 회의록 수정 성공:', response.data);
        updatedNoteData = response.data; // 성공 시 데이터 저장
    } catch (error) {
        // --- 2. (기존) 회의록 수정 실패 시 ---
        console.error(`❌ (ID: ${minuteId}) 회의록 수정 실패:`, error);
        console.groupEnd(); // 실패 시에도 groupEnd
        throw error; // 🚨 수정 실패는 에러를 던져서 컴포넌트가 알게 함
    }

    // --- 3. [신규] 회의록 수정 성공 시, RAG 인덱싱 시도 ---
    try {
        // payload로 받은 data 객체에서 content를 가져옴
        const textToIndex = data.content;
        if (textToIndex !== undefined) {
            // content가 payload에 있을 때만 실행
            await indexNoteForRAG(minuteId, textToIndex);
        } else {
            console.log('⚠️ RAG 인덱싱 스킵: 수정 요청에 content 필드가 없습니다.');
        }
    } catch (ragError) {
        // 🚨 중요: RAG 인덱싱이 실패해도, 회의록 수정은 성공한 것!
        // 에러를 throw하지 않고, 콘솔에만 기록합니다.
        console.error('⚠️ RAG 인덱싱 실패 (그러나 회의록 수정은 성공함):', ragError);
    }

    console.groupEnd(); // 모든 작업 완료 후 groupEnd
    return updatedNoteData; // 수정된 회의록 데이터 반환
};

/**
 * 8. 개별 회의록 삭제
 * (가정) DELETE /minutes/{minuteId}
 */
export const deleteNote = async (minuteId) => {
    try {
        const response = await api.delete(`/minutes/${minuteId}`);
        console.log(`✅ (ID: ${minuteId}) 회의록 삭제 성공`);
        return response.data; // 또는 response.status
    } catch (error) {
        console.error(`❌ (ID: ${minuteId}) 회의록 삭제 실패:`, error);
        throw error;
    }
};

// (Postman에서 보여주신 /minutes/{id}/summary 호출)
export const getMeetingSummary = async (meetingId) => {
    const response = await api.get(`/minutes/${meetingId}/summary`);
    // 응답: { id, title, summary, memos }
    return response.data;
};

/**
 * [신규] 메모 조회 (GET)
 * (수정 불필요 - 이미 올바름)
 * @returns {Promise<Array>} 메모 객체 배열
 */
export const getMemos = async (meetingId) => {
    const response = await api.get(`/minutes/${meetingId}/memos`);
    // 응답: { memos: [...] }
    return response.data.memos; // memos 배열만 반환
};

/**
 * [✅ 수정] 메모 생성 (POST)
 * Postman 응답을 보면, 생성 후에도 { memos: [...] } 객체를 반환합니다.
 * getMemos와 동일하게 memos 배열을 반환하도록 수정합니다.
 * @returns {Promise<Array>} 최신 메모 객체 배열
 */
export const createMemo = async (meetingId, payload) => {
    console.log('📤 [API 전송 직전] payload:', payload);

    try {
        const headers = {
            ...defaultHeaders, // ✅ 공통 헤더 (Content-Type 포함)
            ...getAuthHeader(), // ✅ 토큰 포함
        };

        const response = await api.post(
            `/minutes/${meetingId}/memos`,
            JSON.stringify(payload), // ✅ 명시적 직렬화 (서버가 확실히 JSON으로 인식)
            { headers }
        );

        console.log('✅ [메모 생성 응답]', response.data);
        return response.data.memos;
    } catch (error) {
        console.error('❌ 메모 생성 실패:', error.response?.data || error.message);
        throw error;
    }
};

// [신규] 메모 수정 (PATCH /minutes/{meetingId}/memos)
// ⚡ Postman(image_491ad6.png) 기준 수정
export const updateMemo = async (meetingId, memoId, newContent) => {
    try {
        const headers = {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        };

        // ⚡ Postman 요청 본문을 기준으로 payload 수정
        const payload = {
            id: memoId,
            content: newContent,
            memoType: 'SELF', // Postman 요청 본문에 있던 'memoType' 추가
        };

        // ⚡ URL에서 memoId 제거, payload를 JSON.stringify
        const response = await api.patch(
            `/minutes/${meetingId}/memos`, // URL에서 {memoId} 제거
            JSON.stringify(payload), // 수정된 payload 사용
            { headers }
        );

        console.log('✅ 메모 수정 성공:', response.data);
        return response.data.memos; // 최신 메모 목록 반환
    } catch (error) {
        console.error('❌ 메모 수정 실패:', error.response?.data || error.message);
        throw error;
    }
};

// [신규] 메모 삭제 (DELETE /minutes/{meetingId}/memos)
export const deleteMemo = async (meetingId, memoId) => {
    try {
        const headers = {
            ...getAuthHeader(),
        };

        const response = await api.delete(`/minutes/${meetingId}/memos`, {
            headers: headers,
            params: {
                deleteId: memoId,
            },
        });

        console.log('✅ 메모 삭제 성공:', response.data);

        // ⚡ Postman(image_491af8.png) 응답이 '1'이므로 .memos를 제거합니다.
        return response.data; // '1' 또는 성공 여부를 반환
    } catch (error) {
        console.error('❌ 메모 삭제 실패:', error.response?.data || error.message);
        throw error;
    }
};
// 9. 프로젝트(폴더) 참가자(조원) 목록 조회
// [수정] NoteDetail에서 멤버 목록(participants)과 초대 링크(inviteLink)가
//       모두 필요하므로, 응답 객체 전체(response.data)를 반환합니다.
export const getProjectMembers = async (folderId) => {
    try {
        const response = await api.get(`/folders/${folderId}/party`);
        console.log(`✅ (ID: ${folderId}) 참가자 목록 로드 성공:`, response.data);
        return response.data; // participants 배열만이 아닌 객체 전체 반환
    } catch (error) {
        console.error(`❌ (ID: ${folderId}) 참가자 목록 로드 실패:`, error);
        throw error;
    }
};

// [신규] 10. 프로젝트(폴더) 참가자 이메일로 추가
export const addProjectMemberByEmail = async (folderId, email) => {
    try {
        const payload = {
            createMemberEmail: email,
        };

        // [수정] 헤더에 인증 토큰(getAuthHeader)을 명시적으로 추가합니다.
        const headers = {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        };

        // [수정] api.post의 세 번째 인자로 headers 객체를 전달합니다.
        const response = await api.post(`/folders/${folderId}/party`, payload, { headers });

        console.log(`✅ (ID: ${folderId}) 이메일(${email})로 참가자 추가 성공:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`❌ (ID: ${folderId}) 이메일(${email})로 참가자 추가 실패:`, error);

        // [수정] 에러 핸들링을 좀 더 구체적으로
        if (error.response) {
            // 서버가 4xx, 5xx 응답을 한 경우
            console.error('Error data:', error.response.data);
            // 서버가 보낸 에러 메시지를 우선적으로 throw
            throw new Error(error.response.data.message || '서버 처리 중 오류가 발생했습니다.');
        } else if (error.request) {
            // 요청은 갔으나 응답을 받지 못한 경우
            console.error('No response received:', error.request);
            throw new Error('서버에서 응답이 없습니다.');
        } else {
            // 요청 설정 중 에러
            console.error('Error setting up request:', error.message);
            throw new Error('요청을 보내는 중 오류가 발생했습니다.');
        }
    }
};

/**
 * [신규] 11. 프로젝트(폴더) 참가자 삭제
 * DELETE /folders/{folderId}/party?deleteMemberId={memberId}
 */
export const deleteProjectMember = async (folderId, participantId) => {
    console.log(`[API] 멤버 삭제 요청: folderId=${folderId}, participantId=${participantId}`);
    try {
        const headers = {
            ...getAuthHeader(), // 인증 토큰 포함
        };

        const response = await api.delete(`/folders/${folderId}/party`, {
            headers: headers,
            // `delete` 요청 시 쿼리 파라미터를 보내는 방법
            params: {
                deleteMemberId: participantId,
            },
        });

        console.log(`✅ (ID: ${folderId}) 멤버(PID: ${participantId}) 삭제 성공:`, response.data);
        // Postman과 동일하게 갱신된 참가자 목록을 반환합니다.
        return response.data;
    } catch (error) {
        console.error(`❌ (ID: ${folderId}) 멤버(PID: ${participantId}) 삭제 실패:`, error);

        if (error.response) {
            console.error('Error data:', error.response.data);
            throw new Error(error.response.data.message || '멤버 삭제에 실패했습니다.');
        } else if (error.request) {
            console.error('No response received:', error.request);
            throw new Error('서버에서 응답이 없습니다.');
        } else {
            console.error('Error setting up request:', error.message);
            throw new Error('요청을 보내는 중 오류가 발생했습니다.');
        }
    }
};

/* =============================================
 * [✅ 신규] 회의록(Minutes) 참가자 관리 API 3종
 * ============================================= */

/**
 * [✅ 신규] 12. 회의록 참가자 목록 조회
 * (가정) GET /minutes/{minutesId}/party
 */
export const getMeetingMembers = async (minutesId) => {
    try {
        const response = await api.get(`/minutes/${minutesId}/party`);
        console.log(`✅ (Minute ID: ${minutesId}) 회의록 참가자 목록 로드 성공:`, response.data);
        return response.data; // { participants: [], ... }
    } catch (error) {
        console.error(`❌ (Minute ID: ${minutesId}) 회의록 참가자 목록 로드 실패:`, error);
        throw error;
    }
};

/**
 * [✅ 신규] 13. 회의록 참가자 이메일로 추가
 * POST /minutes/{minutesId}/party
 * (Postman 스크린샷 기반)
 */
export const addMeetingMemberByEmail = async (minutesId, email) => {
    try {
        const payload = {
            createMemberEmail: email,
        };
        const headers = {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        };
        const response = await api.post(`/minutes/${minutesId}/party`, payload, { headers });
        console.log(`✅ (Minute ID: ${minutesId}) 이메일(${email})로 회의록 참가자 추가 성공:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`❌ (Minute ID: ${minutesId}) 이메일(${email})로 회의록 참가자 추가 실패:`, error);
        if (error.response) {
            console.error('Error data:', error.response.data);
            throw new Error(error.response.data.message || '서버 처리 중 오류가 발생했습니다.');
        } else if (error.request) {
            console.error('No response received:', error.request);
            throw new Error('서버에서 응답이 없습니다.');
        } else {
            console.error('Error setting up request:', error.message);
            throw new Error('요청을 보내는 중 오류가 발생했습니다.');
        }
    }
};

/**
 * [✅ 신규] 14. 회의록 참가자 삭제
 * DELETE /minutes/{minutesId}/party?deleteMemberId={memberId}
 * (Postman 스크린샷 기반)
 */
export const deleteMeetingMember = async (minutesId, participantId) => {
    console.log(`[API] 회의록 멤버 삭제 요청: minutesId=${minutesId}, participantId=${participantId}`);
    try {
        const headers = {
            ...getAuthHeader(), // 인증 토큰 포함
        };
        const response = await api.delete(`/minutes/${minutesId}/party`, {
            headers: headers,
            params: {
                deleteMemberId: participantId,
            },
        });
        console.log(`✅ (Minute ID: ${minutesId}) 회의록 멤버(PID: ${participantId}) 삭제 성공:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`❌ (Minute ID: ${minutesId}) 회의록 멤버(PID: ${participantId}) 삭제 실패:`, error);
        if (error.response) {
            console.error('Error data:', error.response.data);
            throw new Error(error.response.data.message || '멤버 삭제에 실패했습니다.');
        } else if (error.request) {
            console.error('No response received:', error.request);
            throw new Error('서버에서 응답이 없습니다.');
        } else {
            console.error('Error setting up request:', error.message);
            throw new Error('요청을 보내는 중 오류가 발생했습니다.');
        }
    }
};

/**
 * [✅ 신규] 회의록 수정 히스토리 조회
 * GET /minutes/{minuteId}/history
 * (image_374a21.png 참고)
 */
export const getNoteHistory = async (minuteId) => {
    try {
        const response = await api.get(`/minutes/${minuteId}/history`);
        console.log(`✅ (ID: ${minuteId}) 회의록 히스토리 로드 성공:`, response.data);
        // Postman에서 배열 [ { ... } ]을 반환하므로 response.data를 그대로 반환
        return response.data;
    } catch (error) {
        console.error(`❌ (ID: ${minuteId}) 회의록 히스토리 로드 실패:`, error);
        throw error;
    }
};

/**
 * [신규] 15. 락 상태 조회 (편집 버튼 활성/비활성)
 * GET /minutes/{id}/lock
 */
export const getLockStatus = async (minuteId) => {
    try {
        const response = await api.get(`/minutes/${minuteId}/lock`);
        // 응답 예: { locked: true }
        return response.data;
    } catch (error) {
        console.error(`❌ (ID: ${minuteId}) 락 상태 조회 실패:`, error);
        throw error;
    }
};

/**
 * [신규] 16. 락 획득 (편집 시작 시)
 * POST /minutes/{id}/lock
 */
export const acquireLock = async (minuteId) => {
    try {
        const headers = { ...getAuthHeader() };
        // 본문(body) 없이 POST 요청
        const response = await api.post(`/minutes/${minuteId}/lock`, {}, { headers });
        // 응답 예: { token: "uuid-..." }
        console.log(`🔒 (ID: ${minuteId}) 락 획득 성공`);
        return response.data;
    } catch (error) {
        console.error(`❌ (ID: ${minuteId}) 락 획득 실패:`, error.response?.data || error);
        // 403 LOCK_DENIED 등
        throw error;
    }
};

/**
 * [신규] 17. 락 갱신 (편집 중)
 * POST /minutes/{id}/lock/refresh
 */
export const refreshLock = async (minuteId, token) => {
    try {
        const payload = { token: token };
        const headers = {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
        };
        const response = await api.post(`/minutes/${minuteId}/lock/refresh`, payload, { headers });
        console.log(`🔄 (ID: ${minuteId}) 락 갱신 성공`);
        return response.data;
    } catch (error) {
        console.error(`❌ (ID: ${minuteId}) 락 갱신 실패:`, error);
        throw error;
    }
};

/**
 * [신규] 18. 락 해제 (페이지 이탈 시)
 * DELETE /minutes/{id}/lock
 */
export const releaseLock = async (minuteId, token) => {
    try {
        const headers = { ...getAuthHeader() };
        const payload = { token: token };

        // Axios
        const response = await api.delete(`/minutes/${minuteId}/lock`, {
            headers: headers,
            data: payload, // 👈 DELETE 요청에 body를 포함하는 방법
        });

        console.log(`🔓 (ID: ${minuteId}) 락 해제 성공`);
        return response.data;
    } catch (error) {
        console.error(`❌ (ID: ${minuteId}) 락 해제 실패:`, error);
        throw error;
    }
};
