import { getClusterHistory, getClusterHistorySync } from "../get/getClusterHistory";
import { getLatestProfileData } from "../get/getProfileData";
import { saveClusterHistory as saveClusterHistoryDB } from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

// DB에 클러스터 히스토리 저장 (localStorage 대체)
export const saveClusterHistory = async (
    profileImages: any[]
): Promise<{ clusterHistory: any[], success: boolean, error?: any }> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('사용자 인증 정보를 찾을 수 없습니다.');
            return { clusterHistory: [], success: false, error: 'No user found' };
        }

        // ProfileData에서 nickname과 description 가져오기
        const savedProfileData = await getLatestProfileData();
        console.log('savedProfileData', savedProfileData);
        
        // ✅ 프로필이 없으면 사용자 데이터에서 가져오기 (fallback)
        let currentNickname = savedProfileData?.nickname;
        let currentDescription = savedProfileData?.main_description;
        
        if (!currentNickname) {
            // 프로필이 없으면 사용자 데이터에서 닉네임 가져오기
            const { getUserData } = await import('../get/getUserData');
            const userData = await getUserData();
            currentNickname = userData?.nickname || userData?.email?.split('@')[0] || '알고리즘 탐험가';
            console.log('⚠️ 프로필이 없어서 사용자 데이터에서 닉네임 가져옴:', currentNickname);
        }
        
        if (!currentDescription) {
            currentDescription = '나만의 알고리즘 자화상을 만들어보세요';
        }

        // DB에 저장
        const dbResult = await saveClusterHistoryDB(
            user.id,
            currentNickname,
            currentDescription,
            profileImages
        );

        if (dbResult) {
            console.log('✅ 클러스터 히스토리 DB 저장 완료');
            
            // DB에서 업데이트된 히스토리 가져오기
            const updatedHistory = await getClusterHistory();
            return {
                clusterHistory: updatedHistory,
                success: true
            };
        } else {
            console.error('❌ 클러스터 히스토리 DB 저장 실패');
            return { clusterHistory: [], success: false, error: 'DB save failed' };
        }

    } catch (error) {
        console.error('[saveClusterHistory] DB 저장 중 오류:', error);
        return {
            clusterHistory: [],
            success: false,
            error
        };
    }
};

// 동기 버전 (기존 호환성, deprecated)
export const saveClusterHistorySync = (
    profileImages: any[], 
    localStorageObj: Storage = localStorage
) => {
    console.warn('saveClusterHistorySync is deprecated. Use saveClusterHistory() instead.');
    
    try {
        // localStorage 저장은 제거하고 비동기 DB 저장만 실행
        saveClusterHistory(profileImages).catch(console.error);
    
        return {
            clusterHistory: [],
            success: true
        };
    } catch (error) {
        console.error('[saveClusterHistorySync] ClusterHistory 저장 실패:', error);
        return {
            clusterHistory: [],
            success: false,
            error
        };
    }
};