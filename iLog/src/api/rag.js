import api from './axios';

export const askQuestion = async (meetingId, query) => {
    try {
        console.log('🧩 [askQuestion] 요청 payload:', { meetingId, query }); // ✅ 추가
        const res = await api.post(
            '/rag/ask',
            { meetingId, query },
            { headers: { 'Content-Type': 'application/json' } }
        );
        console.log('✅ [askQuestion] 응답:', res.data); // ✅ 추가
        return res.data;
    } catch (err) {
        console.error('RAG 질문 요청 실패:', err.response?.data || err.message);
        throw err;
    }
};
