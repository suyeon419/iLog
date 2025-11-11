// Note.jsx

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Container, Button, Card, Row, Col, Pagination, Alert, Spinner, Form } from 'react-bootstrap';
import { PencilSquare, CheckSquare } from 'react-bootstrap-icons';
import {
    getProjects,
    createProject,
    updateProjectImage,
    deleteProjectImage,
    deleteProject,
    updateProjectName,
    getProjectMembers,
    getProjectDetails,
} from '../../api/note';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

import './Note.css';

const SERVER_BASE_URL = 'https://webkit-ilo9-api.duckdns.org';

export default function Note() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [rootFolderId, setRootFolderId] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 4;
    const fileInputRef = useRef(null);

    const [targetItemId, setTargetItemId] = useState(null);
    const [targetItemName, setTargetItemName] = useState(null);

    const [editingItemId, setEditingItemId] = useState(null);
    const [editingItemName, setEditingItemName] = useState('');

    // ==================================================================
    // [1. 목록 조회] useEffect
    // ==================================================================
    // useEffect(() => {
    //     const fetchProjects = async () => {
    //         let initialItems = [];
    //         try {
    //             setLoading(true);
    //             setError('');

    //             // 1. 프로젝트 목록(텍스트) 우선 가져오기
    //             const rootFolderData = await getProjects();
    //             setRootFolderId(rootFolderData.folderId);

    //             initialItems = rootFolderData.childFolders
    //                 .map((project) => ({
    //                     id: project.id,
    //                     name: project.name,
    //                     imagePath: project.folderImage,
    //                     blobUrl: null,

    //                     // [수정] 날짜는 원래대로 'createdAt'을 사용합니다.
    //                     created: project.createdAt
    //                         ? new Date(project.createdAt).toLocaleDateString()
    //                         : '날짜 정보 없음',

    //                     members: project.members || '...',
    //                 }))
    //                 .reverse();

    //             setItems(initialItems);
    //             setLoading(false);
    //         } catch (err) {
    //             console.error('❌ [Note] 데이터 로드 실패:', err);
    //             setError('프로젝트를 불러오는 데 실패했습니다.');
    //             setLoading(false);
    //             return;
    //         }

    //         // --- 3. Blob 이미지 및 참가자 로딩 ---
    //         try {
    //             console.log(`💡 [Note] 2. 총 ${initialItems.length}개 아이템 순회 시작.`);

    //             for (const itemToLoad of initialItems) {
    //                 // ... (이미지 로드 로직은 동일) ...
    //                 if (itemToLoad.imagePath) {
    //                     console.log(
    //                         `💡 [Note] 3. (ID: ${itemToLoad.id}) 이미지 로드 필요. 경로: ${itemToLoad.imagePath}`
    //                     );
    //                     try {
    //                         const imageUrl = `${SERVER_BASE_URL}${itemToLoad.imagePath}`;
    //                         console.log(`💡 [Note] 4. (ID: ${itemToLoad.id}) 다음 URL로 GET 요청 시도: ${imageUrl}`);
    //                         const res = await api.get(imageUrl, {
    //                             responseType: 'blob',
    //                         });
    //                         const blobUrl = URL.createObjectURL(res.data);
    //                         console.log(`✅ [Note] 5. (ID: ${itemToLoad.id}) 이미지 로드 성공. Blob URL 생성됨.`);
    //                         setItems((prevItems) =>
    //                             prevItems.map((item) =>
    //                                 item.id === itemToLoad.id ? { ...item, blobUrl: blobUrl } : item
    //                             )
    //                         );
    //                     } catch (err) {
    //                         console.error(
    //                             `❌ [Note] 7. (ID: ${itemToLoad.id}) 이미지 로드 실패:`,
    //                             err.response || err.message
    //                         );
    //                         setItems((prevItems) =>
    //                             prevItems.map((item) =>
    //                                 item.id === itemToLoad.id ? { ...item, imagePath: null } : item
    //                             )
    //                         );
    //                     }
    //                 } else {
    //                     console.log(`💡 [Note] (ID: ${itemToLoad.id}) imagePath가 없으므로 건너뜁니다.`);
    //                 }

    //                 // ==========================================================
    //                 // 👇👇👇 [수정] 참가자 로드 로직 (여기부터) 👇👇👇
    //                 // ==========================================================
    //                 try {
    //                     // 1. 참가자 API 호출
    //                     // (getProjectMembers는 { participants: [...] } 객체를 반환)
    //                     const membersData = await getProjectMembers(itemToLoad.id);
    //                     let membersString = '참가자 없음'; // 기본값

    //                     // [수정] membersData는 객체이므로, membersData.participants 배열로 확인
    //                     if (membersData.participants && membersData.participants.length > 0) {
    //                         // [수정] m.participantName을 사용합니다.
    //                         membersString = membersData.participants.map((m) => m.participantName).join(' '); // 렌더링 코드와 맞추기 위해 띄어쓰기로 join
    //                     }

    //                     console.log(`✅ [Note] (ID: ${itemToLoad.id}) 참가자 로드 성공.`);

    //                     // 3. state 업데이트
    //                     setItems((prevItems) =>
    //                         prevItems.map((item) =>
    //                             item.id === itemToLoad.id ? { ...item, members: membersString } : item
    //                         )
    //                     );
    //                 } catch (err) {
    //                     console.error(
    //                         `❌ [Note] (ID: ${itemToLoad.id}) 참가자 로드 실패:`,
    //                         err.response || err.message
    //                     );
    //                     setItems((prevItems) =>
    //                         prevItems.map((item) =>
    //                             item.id === itemToLoad.id ? { ...item, members: '멤버 조회 실패' } : item
    //                         )
    //                     );
    //                 }
    //                 // ==========================================================
    //                 // 👆👆👆 [수정] 참가자 로드 로직 (여기까지) 👆👆👆
    //                 // ==========================================================
    //             }
    //             console.log('💡 [Note] 9. 이미지/멤버 로드 순회 완료.');
    //         } catch (err) {
    //             console.error('❌ [Note] Blob 이미지/멤버 로딩 순회 중 전체 오류:', err);
    //         }
    //     };

    //     fetchProjects();
    // }, []);
    // ==================================================================
    // useEffect 끝
    // ==================================================================

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                setError('');

                console.log('📡 [Note] /folders API 호출 시작');
                const rootData = await getProjects();
                console.log('📂 [Note] /folders 응답:', rootData);

                // ✅ 루트 폴더 ID 저장
                setRootFolderId(rootData.folderId);

                // 2️⃣ 토큰에서 내 id 추출
                const token = localStorage.getItem('token');
                let myId = null;
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        myId = payload.id;
                        console.log('👤 내 사용자 ID:', myId);
                    } catch (err) {
                        console.error('❌ JWT 파싱 실패:', err);
                    }
                }

                // ✅ mapFolder 헬퍼 함수
                const mapFolder = (p) => ({
                    id: p.id,
                    name: p.name,
                    imagePath: p.folderImage,
                    blobUrl: null,
                    created: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '날짜 정보 없음',
                    approachedAt: p.approachedAt || null,
                    members: '...',
                });

                const combinedProjects = [];
                console.log('🔍 [Note] 루트 폴더 목록:', rootData.childFolders);

                // ✅ 폴더 순회
                for (const folder of rootData.childFolders || []) {
                    console.log(`📁 [폴더 탐색] 폴더명: ${folder.name} (id=${folder.id})`);

                    if (folder.name === 'Root') {
                        // 🚪 남의 루트 폴더 → 초대받은 프로젝트
                        console.log(`🔵 남의 root 폴더 감지됨 → ${folder.name} (id=${folder.id})`);
                        try {
                            const detail = await getProjectDetails(folder.id);
                            console.log(`  📂 하위 응답(남의 root ${folder.name}):`, detail);

                            (detail.childFolders || []).forEach((sub) => {
                                console.log(`   ↳ 초대받은 프로젝트 추가: ${sub.name}`);
                                combinedProjects.push(mapFolder(sub));
                            });
                        } catch (err) {
                            console.error(`❌ (남의 root ${folder.id}) 하위 조회 실패:`, err);
                        }
                    } else {
                        // 🟢 내 프로젝트
                        console.log(`🟢 내 프로젝트 감지됨 → ${folder.name}`);
                        combinedProjects.push(mapFolder(folder));
                    }
                }

                console.log('📊 [병합 완료 전 정렬 전] 총', combinedProjects.length, '개');

                // ✅ approachedAt 기준 정렬 (최신순)
                combinedProjects.sort((a, b) => {
                    const aTime = a.approachedAt ? new Date(a.approachedAt).getTime() : 0;
                    const bTime = b.approachedAt ? new Date(b.approachedAt).getTime() : 0;
                    return bTime - aTime;
                });

                console.log('📊 [정렬 후] 접근일자 기준 최신순으로 정렬됨');
                console.table(
                    combinedProjects.map((p) => ({
                        id: p.id,
                        name: p.name,
                        approachedAt: p.approachedAt,
                    }))
                );

                // ✅ 최신순 그대로 렌더링
                setItems(combinedProjects);
                // ✅ 정렬 후 setItems 직전에 추가
                console.log('🖼️ [Note] 이미지 로딩 시작');

                for (const project of combinedProjects) {
                    if (project.imagePath) {
                        try {
                            const imageUrl = `${SERVER_BASE_URL}${project.imagePath}`;
                            const res = await api.get(imageUrl, { responseType: 'blob' });
                            const blobUrl = URL.createObjectURL(res.data);

                            setItems((prev) =>
                                prev.map((item) => (item.id === project.id ? { ...item, blobUrl } : item))
                            );

                            console.log(`✅ 이미지 로드 성공: ${project.name}`);
                        } catch (err) {
                            console.error(`❌ 이미지 로드 실패 (${project.name}):`, err);
                        }
                    } else {
                        console.log(`⚪ ${project.name} → 이미지 없음, 건너뜀`);
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error('❌ 전체 폴더 로드 실패:', err);
                setError('프로젝트를 불러오는 데 실패했습니다.');
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                setError('');

                // 1) /folders
                const rootData = await getProjects();
                setRootFolderId(rootData.folderId);

                // 2) helper
                const mapFolder = (p) => ({
                    id: p.id,
                    name: p.name,
                    imagePath: p.folderImage || null,
                    blobUrl: null,
                    created: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '날짜 정보 없음',
                    approachedAt: p.approachedAt || null,
                    members: '...',
                });

                // 3) collect: mine directly, invited via /folders/{id}
                const combinedProjects = [];
                for (const folder of rootData.childFolders || []) {
                    if (folder.name === 'Root') {
                        // invited bundle → dive once
                        try {
                            const detail = await getProjectDetails(folder.id);
                            (detail.childFolders || []).forEach((sub) => combinedProjects.push(mapFolder(sub)));
                        } catch (e) {
                            console.error('하위 조회 실패(초대 루트):', folder.id, e);
                        }
                    } else {
                        // my project
                        combinedProjects.push(mapFolder(folder));
                    }
                }

                // 4) sort by approachedAt desc (latest first)
                combinedProjects.sort((a, b) => {
                    const aT = a.approachedAt ? new Date(a.approachedAt).getTime() : 0;
                    const bT = b.approachedAt ? new Date(b.approachedAt).getTime() : 0;
                    return bT - aT;
                });

                // 5) paint list first
                setItems(combinedProjects);
                setLoading(false);

                // 6) lazy-load images + participants in parallel
                await Promise.all(
                    combinedProjects.map(async (proj) => {
                        // image
                        if (proj.imagePath) {
                            try {
                                const imageUrl = `${SERVER_BASE_URL}${proj.imagePath}`;
                                const res = await api.get(imageUrl, { responseType: 'blob' });
                                const blobUrl = URL.createObjectURL(res.data);
                                setItems((prev) => prev.map((it) => (it.id === proj.id ? { ...it, blobUrl } : it)));
                            } catch (e) {
                                // hide broken image
                                setItems((prev) =>
                                    prev.map((it) => (it.id === proj.id ? { ...it, imagePath: null } : it))
                                );
                            }
                        }

                        // participants (defensive: array 또는 {participants, link} 모두 처리)
                        try {
                            const raw = await getProjectMembers(proj.id);
                            // note.js가 배열을 반환하도록 되어 있지만,
                            // 환경마다 {participants: [...], link: "..."} 전체 객체가 올 수도 있으니 방어적으로 처리
                            const arr = Array.isArray(raw) ? raw : raw?.participants ?? [];

                            const membersString =
                                arr.length > 0 ? arr.map((m) => m.participantName || m.name).join(' ') : '참가자 없음';

                            setItems((prev) =>
                                prev.map((it) => (it.id === proj.id ? { ...it, members: membersString } : it))
                            );
                        } catch (e) {
                            setItems((prev) =>
                                prev.map((it) => (it.id === proj.id ? { ...it, members: '멤버 조회 실패' } : it))
                            );
                        }
                    })
                );
            } catch (err) {
                console.error('전체 폴더 로드 실패:', err);
                setError('프로젝트를 불러오는 데 실패했습니다.');
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    // ... (이미지 핸들러, 이름 수정 핸들러 등은 모두 동일) ...
    // --- 이미지 핸들러 ---
    const handleTriggerFileInput = (e, id, name) => {
        e.stopPropagation();
        setTargetItemId(id);
        setTargetItemName(name);
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !targetItemId || !targetItemName) return;

        console.log('업로드 시도:', file);
        console.log('파일명:', file.name);
        console.log('타겟 폴더 ID:', targetItemId);
        console.log('폴더 이름:', targetItemName);

        const newPreviewUrl = URL.createObjectURL(file);
        try {
            setItems((prevItems) =>
                prevItems.map((item) => (item.id === targetItemId ? { ...item, blobUrl: newPreviewUrl } : item))
            );
            const response = await updateProjectImage(targetItemId, targetItemName, file);
            const newImagePath = response.folderImage;
            setItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === targetItemId ? { ...item, imagePath: newImagePath, blobUrl: newPreviewUrl } : item
                )
            );
        } catch (err) {
            console.error('❌ [Note] 이미지 업로드 실패:', err);
            setItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === targetItemId ? { ...item, blobUrl: item.imagePath ? item.blobUrl : null } : item
                )
            );
            alert('이미지 업로드에 실패했습니다.');
        } finally {
            setTargetItemId(null);
            setTargetItemName(null);
            e.target.value = null;
        }
    };

    const handleDeleteImage = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('이미지를 삭제하시겠습니까?')) return;
        try {
            await deleteProjectImage(id);
            setItems((prevItems) =>
                prevItems.map((item) => (item.id === id ? { ...item, imagePath: null, blobUrl: null } : item))
            );
        } catch (err) {
            console.error('❌ [Note] 이미지 삭제 실패:', err);
            alert('이미지 삭제에 실패했습니다.');
        }
    };
    // --- 이미지 핸들러 끝 ---

    // --- 이름 수정 핸들러 ---
    const handleEditClick = (e, item) => {
        e.stopPropagation();
        setEditingItemId(item.id);
        setEditingItemName(item.name);
    };

    const handleCancelEdit = (e) => {
        e.stopPropagation();
        setEditingItemId(null);
        setEditingItemName('');
    };

    const handleNameChange = (e) => {
        setEditingItemName(e.target.value);
    };

    const handleSaveEdit = async (e, id) => {
        e.stopPropagation();
        if (!editingItemName.trim()) {
            alert('프로젝트 이름은 비워둘 수 없습니다.');
            return;
        }
        try {
            await updateProjectName(id, editingItemName);
            setItems((prevItems) =>
                prevItems.map((item) => (item.id === id ? { ...item, name: editingItemName } : item))
            );
            setEditingItemId(null);
            setEditingItemName('');
        } catch (err) {
            console.error('❌ [Note] 프로젝트 이름 수정 실패:', err);
            alert('이름 수정에 실패했습니다.');
        }
    };
    // --- 이름 수정 핸들러 끝 ---

    // --- 프로젝트 핸들러 ---
    const handleAddMeeting = async () => {
        const newName = window.prompt('새 프로젝트 이름을 입력하세요:', `새 프로젝트 ${items.length + 1}`);
        if (!newName) return;
        if (!rootFolderId) {
            alert('상위 폴더(Root) ID를 찾지 못했습니다. 페이지를 새로고침 해주세요.');
            return;
        }
        try {
            const newProject = await createProject(rootFolderId, newName);
            const mappedProject = {
                id: newProject.folderId,
                name: newProject.folderName,
                imagePath: newProject.folderImage,
                blobUrl: null,
                // [수정] 날짜는 원래대로 'createdAt'을 사용합니다.
                created: newProject.createdAt ? new Date(newProject.createdAt).toLocaleDateString() : '날짜 정보 없음',
                members: '...',
            };
            setItems((prevItems) => [mappedProject, ...prevItems]);
            setCurrentPage(1);

            // [수정] 새 프로젝트 생성 후, 해당 프로젝트의 멤버도 바로 불러옵니다.
            try {
                const membersData = await getProjectMembers(newProject.folderId);
                let membersString = '참가자 없음';
                if (membersData.participants && membersData.participants.length > 0) {
                    membersString = membersData.participants.map((m) => m.participantName).join(' ');
                }
                setItems((prevItems) =>
                    prevItems.map((item) =>
                        item.id === newProject.folderId ? { ...item, members: membersString } : item
                    )
                );
            } catch (err) {
                console.error(`❌ [Note] (ID: ${newProject.folderId}) 새 프로젝트 참가자 로드 실패:`, err);
                setItems((prevItems) =>
                    prevItems.map((item) =>
                        item.id === newProject.folderId ? { ...item, members: '멤버 조회 실패' } : item
                    )
                );
            }
        } catch (err) {
            console.error('❌ [Note] 프로젝트 생성 실패:', err);
            alert('프로젝트 생성에 실패했습니다.');
        }
    };

    const handleDeleteProject = async (e, id, name) => {
        e.stopPropagation();
        if (!window.confirm(`'${name}' 프로젝트를 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
        try {
            await deleteProject(id);
            setItems((prevItems) => prevItems.filter((item) => item.id !== id));

            const newTotalPages = Math.ceil((items.length - 1) / ITEMS_PER_PAGE);
            if (currentPage > newTotalPages && newTotalPages > 0) {
                setCurrentPage(newTotalPages);
            } else if (items.length - 1 === 0) {
                setCurrentPage(1);
            }
        } catch (err) {
            console.error('❌ [Note] 프로젝트 삭제 실패:', err);
            alert('프로젝트 삭제에 실패했습니다.');
        }
    };

    const handleRowClick = (id) => {
        if (editingItemId === id) return;
        navigate(`/notes/${id}`);
    };
    // --- 프로젝트 핸들러 끝 ---

    // --- 페이지네이션 로직 (동일) ---
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);
    const handlePageChange = (pageNumber) => {
        const newPage = Math.max(1, Math.min(pageNumber, totalPages === 0 ? 1 : totalPages));
        setCurrentPage(newPage);
    };
    const renderPaginationItems = () => {
        let pageItems = [];
        const total = totalPages === 0 ? 1 : totalPages;
        for (let number = 1; number <= total; number++) {
            pageItems.push(
                <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>
                    {number}
                </Pagination.Item>
            );
        }
        return pageItems;
    };
    // ------------------------

    // ... (로딩 및 에러 UI 처리 (동일)) ...
    const renderContent = () => {
        if (loading) {
            return (
                <div className="text-center p-5">
                    <Spinner animation="border" role="status" />
                    <p className="mt-2">프로젝트를 불러오는 중입니다...</p>
                </div>
            );
        }
        if (error) {
            return <Alert variant="danger">{error}</Alert>;
        }
        if (items.length === 0 && !loading) {
            return (
                <div className="text-center p-5">
                    <p>생성된 프로젝트가 없습니다.</p>
                    <p>하단의 '프로젝트 추가하기' 버튼을 눌러 시작하세요.</p>
                </div>
            );
        }

        return (
            <Row className="justify-content-center">
                {currentItems.map((item) => (
                    <Col md="auto" lg="auto" className="mb-4" key={item.id}>
                        <Card className="h-100 card-project">
                            {/* ... (이미지 영역 (동일)) ... */}
                            <div className="card-image-container">
                                {item.blobUrl ? (
                                    (() => {
                                        return (
                                            <Card.Img
                                                className="card-image-placeholder"
                                                variant="top"
                                                src={item.blobUrl}
                                                alt={item.name}
                                            />
                                        );
                                    })()
                                ) : (
                                    <div className="card-image-placeholder">
                                        {item.imagePath
                                            ? (() => {
                                                  return <Spinner animation="border" size="sm" />;
                                              })()
                                            : (() => {
                                                  return <span>사진을 추가해 주세요</span>;
                                              })()}
                                    </div>
                                )}
                                <div className="card-hover-buttons">
                                    {item.blobUrl ? (
                                        <>
                                            <Button
                                                variant="light"
                                                className="btn-change"
                                                onClick={(e) => handleTriggerFileInput(e, item.id, item.name)}
                                            >
                                                변경
                                            </Button>
                                            <Button
                                                variant="danger"
                                                className="btn-delete"
                                                onClick={(e) => handleDeleteImage(e, item.id)}
                                            >
                                                삭제
                                            </Button>
                                        </>
                                    ) : (
                                        !item.imagePath && (
                                            <Button
                                                variant="light"
                                                className="btn-add"
                                                onClick={(e) => handleTriggerFileInput(e, item.id, item.name)}
                                            >
                                                추가
                                            </Button>
                                        )
                                    )}
                                </div>
                            </div>
                            {/* --- 이미지 영역 끝 --- */}

                            <Card.Body
                                onClick={() => handleRowClick(item.id)}
                                style={{ cursor: editingItemId === item.id ? 'default' : 'pointer' }}
                                className="text-center d-flex flex-column"
                            >
                                {/* ... (이름 수정 UI (동일)) ... */}
                                {editingItemId === item.id ? (
                                    <>
                                        <div className="d-flex align-items-center">
                                            <Form.Control
                                                type="text"
                                                value={editingItemName}
                                                onChange={handleNameChange}
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                                className="form-control-inline-edit"
                                            />
                                            <CheckSquare
                                                className="ms-2 edit-action-icon save-icon"
                                                onClick={(e) => handleSaveEdit(e, item.id)}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <Card.Title style={{ fontWeight: 'bold' }} className="mb-2 card-title-editable">
                                            {item.name}
                                            <PencilSquare
                                                className="ms-2 edit-icon"
                                                onClick={(e) => handleEditClick(e, item)}
                                            />
                                        </Card.Title>

                                        {/* [수정] 날짜는 원래대로 'item.created'를 표시합니다. */}
                                        <p style={{ fontSize: '0.95rem', color: '#6c757d' }}>{item.created}</p>
                                    </>
                                )}
                                {/* --- 이름 수정 UI 끝 --- */}

                                <div className="mt-3 flex-grow-1">
                                    {/* [수정] 참가자 렌더링 로직 (이제 '참가자 없음' 또는 실제 이름이 표시됨) */}
                                    {item.members && item.members !== '...' && item.members !== '참가자 없음' ? (
                                        item.members.split(' ').map((member, index) => (
                                            <p key={index} style={{ marginBottom: '0.25rem', fontWeight: '500' }}>
                                                {member}
                                            </p>
                                        ))
                                    ) : (
                                        // '...', '참가자 없음', '멤버 조회 실패' 시
                                        <p style={{ fontStyle: 'italic', color: '#aaa' }}>{item.members}</p>
                                    )}
                                </div>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="mt-3"
                                    onClick={(e) => handleDeleteProject(e, item.id, item.name)}
                                >
                                    프로젝트 삭제
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        );
    };

    return (
        <>
            {/* ... (Container, Pagination, Button 등 나머지 JSX 동일) ... */}
            <Container className="pt-3">
                <h2 style={{ fontWeight: 'bold', color: '#333' }} className="mb-4">
                    <PencilSquare className="me-3" />
                    프로젝트
                </h2>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept="image/*"
                />

                {renderContent()}

                {totalPages > 1 && (
                    <nav className="mt-3 pagination-nav">
                        <Pagination className="justify-content-center">
                            <Pagination.Prev
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            />
                            {renderPaginationItems()}
                            <Pagination.Next
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === (totalPages === 0 ? 1 : totalPages)}
                            />
                        </Pagination>
                    </nav>
                )}

                <Button variant="primary" className="w-100 mt-3" onClick={handleAddMeeting}>
                    프로젝트 추가하기
                </Button>
            </Container>
        </>
    );
}
