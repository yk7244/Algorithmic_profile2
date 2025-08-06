import { ClusterHistory } from "@/app/types/profile";
import { getWatchHistory_array, getWatchHistory_arraySync } from "../get/getWatchHistory_array";
import { getClusterHistory, getClusterHistorySync } from "../get/getClusterHistory";
import { getWatchHistory, getWatchHistorySync } from "../get/getWatchHistory";
import { saveWatchHistoryArray } from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

// DB에 시청 기록 배열 저장 (localStorage 대체)
export async function saveWatchHistory_array(): Promise<{ success: boolean, result: any[], error?: any }> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('사용자 인증 정보를 찾을 수 없습니다.');
            return { success: false, result: [], error: 'No user found' };
        }

        console.log('🔄 saveWatchHistory_array: 데이터 조회 시작');
        
        // ✅ Race Condition 방지: 재시도 로직 추가
        let clusterHistory = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            try {
                console.log(`🔄 클러스터 히스토리 조회 시도 ${retryCount + 1}/${maxRetries}`);
                clusterHistory = await getClusterHistory();
                
                if (clusterHistory && clusterHistory.length > 0) {
                    console.log('✅ 클러스터 히스토리 조회 성공:', clusterHistory.length, '개');
                    break;
                } else {
                    console.log('⚠️ 클러스터 히스토리가 비어있음, 1초 후 재시도...');
                    if (retryCount < maxRetries - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            } catch (error) {
                console.error(`❌ 클러스터 히스토리 조회 실패 (${retryCount + 1}/${maxRetries}):`, error);
                if (retryCount < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            retryCount++;
        }
        
        const watchHistory = await getWatchHistory();
        console.log('✅ 시청 히스토리 조회 완료:', Array.isArray(watchHistory) ? watchHistory.length : 'not array', '개');

        if (!Array.isArray(watchHistory)) {
            throw new Error('watchHistory must be an array');
        }

        // 가장 최근 클러스터 히스토리 ID 찾기
        const latestClusterId = clusterHistory && clusterHistory.length > 0 
            ? clusterHistory[clusterHistory.length - 1].id 
            : null;
            
        console.log('🎯 최신 클러스터 ID:', latestClusterId);

        // DB에 저장
        const dbResult = await saveWatchHistoryArray(
            user.id,
            watchHistory,
            latestClusterId || undefined
        );

        if (dbResult) {
            console.log('✅ 시청 기록 배열 DB 저장 완료');
            
            // DB에서 업데이트된 배열 가져오기
            const updatedArrays = await getWatchHistory_array();
            return {
                success: true,
                result: updatedArrays
            };
        } else {
            console.error('❌ 시청 기록 배열 DB 저장 실패');
            return { success: false, result: [], error: 'DB save failed' };
        }

    } catch (error) {
        console.error('[saveWatchHistory_array] DB 저장 중 오류:', error);
        return {
            success: false,
            result: [],
            error
        };
    }
}

// 동기 버전 (기존 호환성, deprecated)
export function saveWatchHistory_arraySync(localStorageObj: Storage = localStorage) {
    console.warn('saveWatchHistory_arraySync is deprecated. Use saveWatchHistory_array() instead.');
    
    try {
        // localStorage 저장은 제거하고 비동기 DB 저장만 실행
        saveWatchHistory_array().catch(console.error);

        return {
            success: true,
            result: [],
        }
    } catch (error) {
        console.error('[saveWatchHistory_arraySync] 저장 실패:', error);
        return {
            success: false,
            result: [],
            error
        };
    }
}