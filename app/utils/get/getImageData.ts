import { useEffect } from 'react';
import { ImageData } from '../../types/profile';
import { getActiveUserImages, convertDBImagesToLocalStorage, saveActiveUserImages } from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

interface UseProfileImagesLoadProps {
setImages: (imgs: ImageData[]) => void;
setVisibleImageIds: React.Dispatch<React.SetStateAction<Set<string>>>;
setFrameStyles: React.Dispatch<React.SetStateAction<Record<string, string>>>;
setPositions: React.Dispatch<React.SetStateAction<Record<string, {x: number, y: number}>>>;
placeholderImage: string;
}
// DB에서 프로필 이미지 가져오기 (localStorage 대체)
export async function getProfileImages() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const dbImages = await getActiveUserImages(user.id);
        if (dbImages && dbImages.length > 0) {
            return convertDBImagesToLocalStorage(dbImages);
        }

        // DB에 데이터가 없으면 빈 배열 반환 (더미 데이터 방지)
        const savedProfileImages = localStorage.getItem('profileImages');
        if (savedProfileImages && !sessionStorage.getItem('profile_images_warning_shown')) {
            const parsedImagesData = JSON.parse(savedProfileImages);
            if (Array.isArray(parsedImagesData) && parsedImagesData.length > 0) {
                console.log('⚠️ localStorage에 프로필 이미지가 있지만 DB를 우선 사용합니다');
                sessionStorage.setItem('profile_images_warning_shown', 'true');
            }
        }

        return null; // 항상 null 반환하여 빈 상태 유지
    } catch (error) {
        console.error('프로필 이미지 가져오기 중 오류:', error);
        
        // 오류 시에도 더미 데이터 대신 null 반환
        const savedProfileImages = localStorage.getItem('profileImages');
        if (savedProfileImages) {
            console.log('⚠️ DB 오류로 인해 localStorage 확인했지만 더미 데이터일 가능성이 높아 무시합니다');
        }
        
        return null; // 항상 null 반환하여 빈 상태 유지
    }
}

// 동기 버전 (기존 호환성, deprecated)
export function getProfileImagesSync() {
    console.warn('getProfileImagesSync is deprecated. Use getProfileImages() instead.');
    const savedProfileImages = localStorage.getItem('profileImages');
    if (savedProfileImages && !sessionStorage.getItem('sync_profile_images_warning_shown')) {
        console.log('⚠️ 동기 버전에서 localStorage 확인했지만 더미 데이터일 가능성이 높아 무시합니다');
        sessionStorage.setItem('sync_profile_images_warning_shown', 'true');
    }
    return null; // 항상 null 반환하여 빈 상태 유지
}

interface UseProfileImagesLoadProps {
    setImages: (imgs: ImageData[]) => void;
    setVisibleImageIds: React.Dispatch<React.SetStateAction<Set<string>>>;
    setFrameStyles: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setPositions: React.Dispatch<React.SetStateAction<Record<string, {x: number, y: number}>>>;
    placeholderImage: string;
    refreshTrigger?: string; // 새로고침 트리거 추가
}

export function useProfileImagesLoad({
    setImages,
    setVisibleImageIds,
    setFrameStyles,
    setPositions,
    placeholderImage,
    refreshTrigger,
}: UseProfileImagesLoadProps) {

    const loadProfileImages = async (retryCount = 0) => {
        try {
            console.log('🔄 DB에서 프로필 이미지 로드 시작... (시도:', retryCount + 1, ')');
            const profileImages = await getProfileImages();
            
            // localStorage에서 추가된 이미지들도 병합
            let allImages = profileImages || [];
            
            // localStorage에서 desired_self 이미지들 가져오기
            try {
                const localStorageImages = localStorage.getItem('profileImages');
                if (localStorageImages) {
                    const parsedLocalImages = JSON.parse(localStorageImages);
                    const localImagesArray = Array.isArray(parsedLocalImages) 
                        ? parsedLocalImages 
                        : Object.values(parsedLocalImages || {});
                    
                    // localStorage에서 가져온 desired_self 이미지들을 추가
                    const desiredSelfImages = localImagesArray.filter((img: any) => img.desired_self);
                    if (desiredSelfImages.length > 0) {
                        console.log('📦 localStorage에서 desired_self 이미지', desiredSelfImages.length, '개 발견');
                        
                        // 중복 제거하면서 병합 (src와 desired_self_profile 기준)
                        desiredSelfImages.forEach((localImg: any) => {
                            const exists = allImages.some((dbImg: any) => 
                                dbImg.src === localImg.src && dbImg.desired_self_profile === localImg.desired_self_profile
                            );
                            if (!exists) {
                                allImages.push(localImg);
                            }
                        });
                    }
                }
            } catch (error) {
                console.warn('⚠️ localStorage 이미지 로드 중 오류:', error);
            }
            
            if (allImages.length > 0) {
                console.log('✅ 전체 프로필 이미지 로드 성공:', allImages.length, '개 (DB:', profileImages?.length || 0, '개, localStorage 추가:', allImages.length - (profileImages?.length || 0), '개)');
                
                // 이미지 상태 설정
                setImages(allImages);
                
                // visible IDs 설정
                const visibleIds = new Set(allImages.map(img => img.id).filter(Boolean));
                setVisibleImageIds(visibleIds);
                
                // 프레임 스타일 설정
                const frameStylesObj: Record<string, string> = {};
                allImages.forEach(img => {
                    if (img.id && (img.frame_style || img.frameStyle)) {
                        frameStylesObj[img.id] = img.frame_style || img.frameStyle || 'normal';
                    }
                });
                setFrameStyles(frameStylesObj);
                
                // 위치 설정
                const positionsObj: Record<string, {x: number, y: number}> = {};
                allImages.forEach(img => {
                    if (img.id && img.position) {
                        positionsObj[img.id] = img.position;
                    }
                });
                setPositions(positionsObj);
                
            } else {
                // ✅ 업로드 직후 데이터가 아까 반영되지 않았을 가능성 - 재시도 로직
                if (retryCount < 5) { // 3 → 5로 증가
                    console.log('📝 DB에 프로필 이미지가 없습니다. 2초 후 재시도...', retryCount + 1, '/5');
                    setTimeout(() => loadProfileImages(retryCount + 1), 2000);
                    return;
                }
                
                console.log('📝 최종: DB에 프로필 이미지가 없습니다. 빈 상태로 설정합니다.');
                // 빈 상태로 설정
                setImages([]);
                setVisibleImageIds(new Set());
                setFrameStyles({});
                setPositions({});
            }
        } catch (error) {
            console.error('❌ 프로필 이미지 로드 실패:', error);
            
            // ✅ 에러 시에도 재시도 (네트워크 일시적 문제 가능성)
            if (retryCount < 3) { // 2 → 3으로 증가
                console.log('🔄 에러로 인한 재시도:', retryCount + 1, '/3');
                setTimeout(() => loadProfileImages(retryCount + 1), 3000);
                return;
            }
            
            // 최종 실패 시 빈 상태로 설정
            setImages([]);
            setVisibleImageIds(new Set());
            setFrameStyles({});
            setPositions({});
        }
    };

    // ✅ 컴포넌트 마운트 시 + refreshTrigger 변경 시 실행
    useEffect(() => {
        console.log('🎯 프로필 이미지 로드 트리거:', refreshTrigger ? `새로고침(${refreshTrigger})` : '초기 로드');
        loadProfileImages();
    }, [refreshTrigger]); // refreshTrigger가 변경될 때마다 실행

    // ✅ 업로드 완료 후 강제 새로고침을 위한 추가 useEffect (refreshTrigger가 있을 때만)
    useEffect(() => {
        // refreshTrigger가 있을 때만 추가 새로고침 실행 (무한루프 방지)
        if (!refreshTrigger) return;

        console.log('⏰ refreshTrigger 감지, 지연된 새로고침 타이머 설정:', refreshTrigger);

        // 5초 후에 한 번 더 확인 (업로드 완료 직후 대응)
        const delayedRefresh = setTimeout(() => {
            console.log('🔄 5초 후 자동 이미지 새로고침 실행');
            loadProfileImages();
        }, 5000);

        // 10초 후에도 한 번 더 확인 (느린 DB 반영 대응)
        const secondDelayedRefresh = setTimeout(() => {
            console.log('🔄 10초 후 자동 이미지 새로고침 실행');
            loadProfileImages();
        }, 10000);

        return () => {
            clearTimeout(delayedRefresh);
            clearTimeout(secondDelayedRefresh);
        };
    }, [refreshTrigger]); // refreshTrigger가 변경될 때마다 새로운 타이머 설정
} 

