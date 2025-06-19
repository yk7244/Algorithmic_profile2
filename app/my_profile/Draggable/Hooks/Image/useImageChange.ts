import { useCallback } from "react";
import { ImageData } from '../../../../types/profile';
import { updateClusterImages, getCurrentUserId, ensureUserExists } from '@/lib/database';

export function useImageChange(
    images: ImageData[],
    setImages: (imgs: ImageData[]) => void,
    positions: Record<string, ImageData['position']>,
    frameStyles: Record<string, string>,
    histories: any[],
    setHistories: (h: any[]) => void,
    setCurrentHistoryIndex: (idx: number) => void
    ) {
    return useCallback(
        (id: string, newSrc: string, newKeyword: string) => {
        console.log('🖼️ === 이미지 변경 시작 ===');
        console.log(`이미지 ID: ${id}`);
        console.log(`새로운 src: ${newSrc}`);
        console.log(`새로운 keyword: ${newKeyword}`);
        
        // 이미지 배열 업데이트
        const updatedImages = images.map(img =>
            img.id === id ? { ...img, src: newSrc, main_keyword: newKeyword } : img
        );

        setImages(updatedImages);
        console.log('✅ images 배열 업데이트 완료');

        // 🆕 사용자별 localStorage의 profileImages도 업데이트
        updateUserSpecificLocalStorage(id, newSrc, newKeyword);

        // 새로운 히스토리 생성 및 저장 - 이미지 변경은 의미있는 변경사항이므로 히스토리 저장이 필요
        const newHistory = {
            timestamp: Date.now(),
            positions,
            frameStyles,
            images: updatedImages
        };

        const updatedHistories = [...histories, newHistory];
        setHistories(updatedHistories);
        
        // 🆕 사용자별 히스토리 저장
        const saveHistoryWithUserKey = async () => {
            try {
                const userId = await getCurrentUserId();
                const historyKey = userId ? `moodboardHistories_${userId}` : 'moodboardHistories';
                localStorage.setItem(historyKey, JSON.stringify(updatedHistories));
                console.log(`✅ 사용자별 히스토리 저장 완료: ${historyKey}`);
            } catch (error) {
                console.error('사용자별 히스토리 저장 실패:', error);
                // fallback으로 전역 키 사용
                localStorage.setItem('moodboardHistories', JSON.stringify(updatedHistories));
            }
        };
        
        saveHistoryWithUserKey();
        setCurrentHistoryIndex(updatedHistories.length - 1);
        
        console.log('✅ 이미지 변경 및 히스토리 저장 완료');

        // 🆕 cluster_images DB 즉시 반영 (현재 프로필 최신 상태 유지)
        updateImageInDB(updatedImages);
        },
        [images, setImages, positions, frameStyles, histories, setHistories, setCurrentHistoryIndex]
    );

    // 🆕 DB 업데이트 헬퍼 함수 (cluster_images 즉시 반영)
    const updateImageInDB = async (updatedImages: ImageData[]) => {
        try {
            const userId = await getCurrentUserId();
            if (!userId) {
                console.log('[이미지변경] 로그인되지 않음, DB 업데이트 스킵');
                return;
            }

            // 사용자 존재 확인
            await ensureUserExists();

            // cluster_images 테이블 즉시 업데이트 (현재 프로필 최신 상태 유지)
            const imageDataForDB = updatedImages.map(img => ({
                user_id: userId,
                main_keyword: img.main_keyword,
                keywords: img.keywords || [],
                mood_keyword: img.mood_keyword || '',
                description: img.description || '',
                category: img.category || '',
                sizeWeight: img.sizeWeight || 1,
                src: img.src,
                relatedVideos: img.relatedVideos || [],
                desired_self: img.desired_self || false,
                desired_self_profile: img.desired_self_profile || null,
                metadata: img.metadata || {},
                rotate: img.rotate || 0,
                width: img.width || 300,
                height: img.height || 200,
                left: img.left || '0px',
                top: img.top || '0px',
                position: img.position || { x: 0, y: 0 },
                frameStyle: img.frameStyle || 'normal',
                created_at: new Date().toISOString()
            }));

            await updateClusterImages(userId, imageDataForDB);
            console.log('[이미지변경] cluster_images DB 즉시 반영 완료');
        } catch (error) {
            console.error('[이미지변경] DB 업데이트 실패 (계속 진행):', error);
            // DB 업데이트 실패해도 UI는 정상 작동하도록 함
        }
    };

    // 🆕 사용자별 localStorage의 profileImages도 업데이트 헬퍼 함수
    const updateUserSpecificLocalStorage = async (id: string, newSrc: string, newKeyword: string) => {
        try {
            const userId = await getCurrentUserId();
            const storageKey = userId ? `profileImages_${userId}` : 'profileImages';
            
            const profileImagesData = localStorage.getItem(storageKey);
            console.log(`📦 현재 ${storageKey} 데이터:`, profileImagesData ? '존재' : '없음');
        
        if (profileImagesData) {
            const profileImages = JSON.parse(profileImagesData);
            console.log('📦 profileImages 타입:', Array.isArray(profileImages) ? '배열' : '객체');
            
            // 배열인지 객체인지 확인해서 처리
            if (Array.isArray(profileImages)) {
                // 배열인 경우
                console.log('📦 배열 처리 시작');
                const updatedProfileImages = profileImages.map((img: any) => {
                    if (img.id === id) {
                        console.log(`✅ 배열에서 이미지 ${id} 찾음, 업데이트 중...`);
                        return { ...img, src: newSrc, main_keyword: newKeyword };
                    }
                    return img;
                });
                    localStorage.setItem(storageKey, JSON.stringify(updatedProfileImages));
                    console.log('✅ 배열 형태 사용자별 profileImages 업데이트 완료');
            } else {
                // 객체인 경우
                console.log('📦 객체 처리 시작');
                if (profileImages[id]) {
                    console.log(`✅ 객체에서 이미지 ${id} 찾음, 업데이트 중...`);
                    const updatedProfileImages = {
                        ...profileImages,
                        [id]: {
                            ...profileImages[id],
                            src: newSrc,
                            main_keyword: newKeyword
                        }
                    };
                        localStorage.setItem(storageKey, JSON.stringify(updatedProfileImages));
                        console.log('✅ 객체 형태 사용자별 profileImages 업데이트 완료');
                } else {
                    console.log(`❌ 객체에서 이미지 ${id}를 찾을 수 없음`);
                }
            }
        } else {
                console.log('❌ 사용자별 profileImages가 localStorage에 없습니다');
        }
        } catch (error) {
            console.error('사용자별 localStorage 업데이트 실패:', error);
        }
    };
} 