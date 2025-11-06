//여기에 note관련 api정리해서 하십쇼
import api from './axios';

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
 * (Postman 힌트 적용: folderName과 folderImage를 함께 전송)
 */
export const updateProjectImage = async (folderId, folderName, file) => {
    try {
        const formData = new FormData();

        // [수정] Postman처럼 'folderName'과 'folderImage'를 모두 추가
        formData.append('folderName', folderName);
        formData.append('folderImage', file);

        const response = await api.patch(`/folders/${folderId}`, formData, {
            headers: {
                ...getAuthHeader(),
                // [수정] Content-Type 제거. Axios가 FormData를 보고 자동으로 설정합니다.
                // 'Content-Type': 'multipart/form-data', // <-- ❌ 이 줄을 삭제했습니다.
            },
        });
        return response.data;
    } catch (error) {
        console.error('❌ 이미지 업로드/수정 실패:', error);
        throw error;
    }
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

/* ==========================
 * 회의록 생성 (로그인 필요)
 * ========================== */
export const createNote = async (folderId, data) => {
    console.group('🧾 [createNote] 회의록 생성 요청 디버그 로그');
    console.log('📁 폴더 ID:', folderId);
    console.log('📝 요청 데이터:', data);
    try {
        const headers = {
            ...defaultHeaders,
            ...getAuthHeader(),
        };

        const res = await api.post(`/minutes/${folderId}`, data, { headers });
        console.log('✅ 회의록 생성 성공:', res.data);

        return res.data;
    } catch (err) {
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
        throw err;
    } finally {
        console.groupEnd();
    }
};
