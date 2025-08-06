import { supabase } from '@/lib/supabase-clean'
import type { Database } from '@/lib/supabase-clean'

type WatchHistoryRow = Database['public']['Tables']['watch_history']['Row']
type WatchHistoryInsert = Database['public']['Tables']['watch_history']['Insert']
type WatchHistoryUpdate = Database['public']['Tables']['watch_history']['Update']

type WatchHistoryArrayRow = Database['public']['Tables']['watch_history_arrays']['Row']
type WatchHistoryArrayInsert = Database['public']['Tables']['watch_history_arrays']['Insert']

/**
 * 사용자의 시청 기록 조회
 */
export async function getWatchHistory(userId?: string): Promise<WatchHistoryRow[]> {
  try {
    // userId가 없으면 현재 인증된 사용자 가져오기
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('⚠️ 인증되지 않은 사용자, 빈 배열 반환');
        return [];
      }
      userId = user.id;
    }

    console.log('🔍 시청 기록 조회:', userId);

    const { data, error } = await supabase
      .from('watch_history')
      .select('*')
      .eq('user_id', userId)
      .order('analysis_date', { ascending: false })

    if (error) {
      console.error('❌ 시청 기록 조회 오류:', error)
      return []
    }

    console.log('✅ 시청 기록 조회 성공:', data?.length || 0, '개');
    return data || []
  } catch (error) {
    console.error('❌ getWatchHistory 예외 발생:', error)
    return []
  }
}

/**
 * 시청 기록 생성
 */
export async function createWatchHistory(watchData: WatchHistoryInsert): Promise<WatchHistoryRow | null> {
  try {
    const { data, error } = await supabase
      .from('watch_history')
      .insert(watchData)
      .select()
      .single()

    if (error) {
      console.error('Error creating watch history:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createWatchHistory:', error)
    return null
  }
}

/**
 * 여러 시청 기록 일괄 생성
 */
export async function createWatchHistories(watchData: WatchHistoryInsert[]): Promise<WatchHistoryRow[]> {
  try {
    const { data, error } = await supabase
      .from('watch_history')
      .insert(watchData)
      .select()

    if (error) {
      console.error('Error creating watch histories:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in createWatchHistories:', error)
    return []
  }
}

/**
 * 시청 기록 저장 (localStorage 대체)
 */
export async function saveWatchHistory(userId: string, watchHistoryArray: any[]): Promise<boolean> {
  try {
    if (!watchHistoryArray || watchHistoryArray.length === 0) {
      return true
    }

    console.log('🔄 saveWatchHistory: videos 테이블 먼저 저장 시작');
    
    // ✅ 1단계: 먼저 모든 비디오를 videos 테이블에 배치 저장 (Foreign Key 제약 해결)
    const { createVideos } = await import('./videos');
    
    // 유효한 video_id가 있는 항목들만 필터링하고 비디오 데이터 생성
    const validItems = watchHistoryArray.filter(item => item.video_id || item.videoId);
    
    // ✅ 중복 제거: Map을 사용해서 마지막 데이터만 유지
    const videoDataMap = new Map();
    validItems.forEach(item => {
      const videoId = item.video_id || item.videoId;
      videoDataMap.set(videoId, {
        id: videoId,
        title: item.title || 'Unknown Title',
        description: item.description || null,
        channel_id: null, // fallback 데이터이므로 기본값
        channel_name: null,
        published_at: null,
        thumbnail_url: null,
        view_count: null,
        like_count: null,
        comment_count: null,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        tags: Array.isArray(item.tags) ? item.tags : [],
        keywords: Array.isArray(item.keywords) ? item.keywords : [],
        last_fetched_at: new Date().toISOString()
      });
    });

    const videosData = Array.from(videoDataMap.values());
    const duplicateCount = validItems.length - videosData.length;
    
    console.log(`🔄 배치 upsert 대상: ${videosData.length}개 비디오 (중복 제거: ${duplicateCount}개)`);
    
    let successfulVideosCount = 0;
    
    // ✅ 빈 배치 체크
    if (videosData.length === 0) {
      console.warn('⚠️ 저장할 유효한 비디오가 없습니다.');
      return true; // 저장할 게 없는 것은 성공으로 처리
    }
    
    try {
      const savedVideos = await createVideos(videosData);
      successfulVideosCount = savedVideos.length;
      console.log(`✅ videos 테이블 배치 저장 완료: ${savedVideos.length}개 성공, ${watchHistoryArray.length - validItems.length}개 건너뜀`);
      
      if (duplicateCount > 0) {
        console.log(`📝 중복 제거 통계: 원본 ${validItems.length}개 → 고유 ${videosData.length}개`);
      }
      
    } catch (batchError) {
      console.error('❌ 배치 저장 실패, 개별 저장으로 fallback:', batchError);
      
      // ✅ 에러 타입별 상세 로깅
      if (batchError && typeof batchError === 'object' && 'code' in batchError) {
        const errorCode = (batchError as any).code;
        if (errorCode === '21000') {
          console.error('🚨 중복 키 에러 감지됨 - 중복 제거 로직 확인 필요');
          console.log('중복 제거 결과:', { 
            original: validItems.length, 
            unique: videosData.length, 
            duplicates: duplicateCount 
          });
        }
      }
      
      // 배치 실패 시 개별 저장으로 fallback
      console.log('🔄 개별 저장 fallback 시작...');
      const { upsertVideo } = await import('./videos');
      
      for (const videoData of videosData) {
        try {
          const result = await upsertVideo(videoData);
          if (result) {
            successfulVideosCount++;
          } else {
            console.warn(`⚠️ 개별 저장 실패 (null 반환): ${videoData.id} - ${videoData.title}`);
          }
        } catch (error) {
          console.error(`❌ 개별 비디오 저장 실패: ${videoData.id}`, error);
          
          // ✅ 삭제된 비디오 감지
          if (error && typeof error === 'object' && 'message' in error) {
            const errorMessage = (error as any).message;
            if (errorMessage.includes('not found') || errorMessage.includes('404')) {
              console.log(`🗑️ 삭제된 비디오로 추정: ${videoData.id} - ${videoData.title}`);
            }
          }
        }
      }
      console.log(`✅ 개별 저장 완료: ${successfulVideosCount}개 성공 (전체 ${videosData.length}개 중)`);
    }

    // ✅ videos 저장이 실패했으면 watch_history 저장 건너뛰기
    if (successfulVideosCount === 0) {
      console.warn('⚠️ videos 테이블 저장이 모두 실패했습니다. watch_history 저장을 건너뜁니다.');
      return false;
    }

    // ✅ 부분 성공 시 경고 로그
    if (successfulVideosCount < validItems.length) {
      console.warn(`⚠️ videos 저장 부분 성공: ${successfulVideosCount}/${validItems.length}개. 성공한 비디오만 watch_history에 저장합니다.`);
    }

    // ✅ 2단계: watch_history 테이블에 저장 (성공적으로 저장된 videos만)
    console.log('🔄 saveWatchHistory: watch_history 테이블 저장 시작');
    
    // videos 테이블에 성공적으로 저장된 비디오 ID 목록 가져오기
    const { getVideosByIds } = await import('./videos');
    const videoIds = validItems.map(item => item.video_id || item.videoId);
    const existingVideos = await getVideosByIds(videoIds);
    const existingVideoIds = new Set(existingVideos.map(v => v.id));
    
    // 실제로 DB에 존재하는 비디오들만 필터링
    const watchInserts: WatchHistoryInsert[] = watchHistoryArray
      .filter(item => {
        const videoId = item.video_id || item.videoId;
        return videoId && existingVideoIds.has(videoId);
      })
      .map(item => ({
        user_id: userId,
        video_id: item.video_id || item.videoId,
        title: item.title || '',
        description: item.description || null,
        tags: item.tags || [],
        keywords: item.keywords || item.keyword || [],
        watch_date: item.date ? new Date(item.date).toISOString() : null,
        analysis_date: new Date().toISOString()
      }));

    console.log(`🔄 watch_history 저장 대상: ${watchInserts.length}개 (videos 테이블에 존재하는 것만)`);
    
    if (watchInserts.length === 0) {
      console.warn('⚠️ watch_history에 저장할 유효한 비디오가 없습니다.');
      return true; // videos는 저장되었으므로 부분 성공으로 처리
    }
    
    const result = await createWatchHistories(watchInserts);
    
    console.log(`✅ watch_history 저장 완료: ${result.length}개`);
    return result.length > 0;
  } catch (error) {
    console.error('❌ Error in saveWatchHistory:', error);
    return false;
  }
}

/**
 * 시청 기록 배열 저장 (watch_history_arrays 테이블용)
 */
export async function saveWatchHistoryArray(
  userId: string, 
  watchHistoryData: any[],
  clusterHistoryId?: string
): Promise<WatchHistoryArrayRow | null> {
  try {
    const arrayData: WatchHistoryArrayInsert = {
      user_id: userId,
      watch_history_data: watchHistoryData,
      cluster_history_id: clusterHistoryId || null,
      timestamp: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('watch_history_arrays')
      .insert(arrayData)
      .select()
      .single()

    if (error) {
      console.error('Error saving watch history array:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in saveWatchHistoryArray:', error)
    return null
  }
}

/**
 * 사용자의 시청 기록 배열 조회
 */
export async function getWatchHistoryArrays(userId: string): Promise<WatchHistoryArrayRow[]> {
  try {
    const { data, error } = await supabase
      .from('watch_history_arrays')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching watch history arrays:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getWatchHistoryArrays:', error)
    return []
  }
}

/**
 * 최신 시청 기록 배열 조회
 */
export async function getLatestWatchHistoryArray(userId: string): Promise<WatchHistoryArrayRow | null> {
  try {
    const { data, error } = await supabase
      .from('watch_history_arrays')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Error fetching latest watch history array:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getLatestWatchHistoryArray:', error)
    return null
  }
}

/**
 * 시청 기록 삭제
 */
export async function deleteWatchHistory(watchId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('watch_history')
      .delete()
      .eq('id', watchId)

    if (error) {
      console.error('Error deleting watch history:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteWatchHistory:', error)
    return false
  }
}

/**
 * 사용자의 모든 시청 기록 삭제
 */
export async function deleteAllWatchHistory(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('watch_history')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting all watch history:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteAllWatchHistory:', error)
    return false
  }
}

/**
 * localStorage의 watchHistory를 DB 형식으로 변환
 */
export function convertLocalStorageWatchHistoryToDB(localHistory: any[]): WatchHistoryInsert[] {
  return localHistory.map(item => ({
    user_id: '', // 호출할 때 설정
    video_id: item.video_id || item.videoId || null,
    title: item.title || '',
    description: item.description || null,
    tags: item.tags || [],
    keywords: item.keywords || item.keyword || [],
    watch_date: item.date ? new Date(item.date).toISOString() : null,
    analysis_date: new Date().toISOString()
  }))
}

/**
 * 키워드로 시청 기록 검색
 */
export async function searchWatchHistoryByKeyword(
  userId: string, 
  keyword: string, 
  limit: number = 20
): Promise<WatchHistoryRow[]> {
  try {
    const { data, error } = await supabase
      .from('watch_history')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${keyword}%,keywords.cs.{${keyword}}`)
      .order('analysis_date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching watch history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in searchWatchHistoryByKeyword:', error)
    return []
  }
}