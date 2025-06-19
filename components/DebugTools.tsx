// 🔧 잘못된 SliderHistory 수정 함수
(window as any).fixCorruptedSliderHistory = async () => {
  try {
    console.log('🔧 잘못된 SliderHistory 수정 시작...');
    const { fixCorruptedSliderHistory } = await import('@/lib/database');
    const result = await fixCorruptedSliderHistory();
    console.log('✅ SliderHistory 수정 완료:', result);
    return result;
  } catch (error: any) {
    console.error('❌ SliderHistory 수정 실패:', error);
    return { error: error.message };
  }
};

// 🧹 중복된 SliderHistory 정리 함수
(window as any).removeDuplicateSliderHistory = async () => {
  try {
    console.log('🧹 중복된 SliderHistory 정리 시작...');
    const { removeDuplicateSliderHistory } = await import('@/lib/database');
    const result = await removeDuplicateSliderHistory();
    console.log('✅ SliderHistory 중복 정리 완료:', result);
    return result;
  } catch (error: any) {
    console.error('❌ SliderHistory 중복 정리 실패:', error);
    return { error: error.message };
  }
};

// 🔧 캐시 상태 확인 및 강제 새로고침 테스트 함수
(window as any).testVideoCache = async (videoId: string = 'dQw4w9WgXcQ') => {
  try {
    console.log('🧪 === 비디오 캐시 테스트 ===');
    const { getCachedVideo, fetchVideoInfo } = await import('@/app/upload/VideoAnalysis/videoKeyword');
    
    // 1️⃣ 캐시 상태 확인
    const cachedVideo = await getCachedVideo(videoId);
    console.log('📦 캐시 상태:', {
      'videoId': videoId,
      '캐시 존재': !!cachedVideo,
      '캐시 데이터': cachedVideo ? {
        title: cachedVideo.title,
        keywords: cachedVideo.keywords,
        cached_at: cachedVideo.last_fetched_at
      } : null
    });
    
    // 2️⃣ 일반 모드 (캐시 허용)
    console.log('🔍 일반 모드 테스트 (캐시 허용)...');
    const normalResult = await fetchVideoInfo(videoId, false);
    console.log('📊 일반 모드 결과:', {
      'success': !!normalResult,
      'keywords': normalResult?.keywords || []
    });
    
    // 3️⃣ 강제 새로고침 모드
    console.log('🔄 강제 새로고침 모드 테스트...');
    const forceResult = await fetchVideoInfo(videoId, true);
    console.log('📊 강제 새로고침 결과:', {
      'success': !!forceResult,
      'keywords': forceResult?.keywords || []
    });
    
    return {
      cached: !!cachedVideo,
      normalMode: !!normalResult,
      forceMode: !!forceResult,
      keywordsDifferent: JSON.stringify(normalResult?.keywords) !== JSON.stringify(forceResult?.keywords)
    };
    
  } catch (error: any) {
    console.error('❌ 캐시 테스트 실패:', error);
    return { error: error.message };
  }
};

// 🗑️ 캐시 정리 함수
(window as any).clearVideoCache = async () => {
  try {
    console.log('🗑️ 비디오 캐시 정리 시작...');
    const { supabase } = await import('@/lib/supabase');
    
    const { data, error } = await supabase
      .from('videos')
      .delete()
      .neq('id', ''); // 모든 레코드 삭제
      
    if (error) throw error;
    
    console.log('✅ 비디오 캐시 정리 완료:', data);
    return { deleted: data?.length || 0 };
    
  } catch (error: any) {
    console.error('❌ 캐시 정리 실패:', error);
    return { error: error.message };
  }
};

// 🆕 Videos 캐시 관리 도구들
// @ts-ignore - 개발용 전역 함수
window.checkVideosCache = async () => {
  try {
    console.log('📹 === Videos 캐시 상태 확인 ===');
    
    const { getCacheStats } = await import('@/lib/database');
    const stats = await getCacheStats();
    
    console.log('📊 캐시 통계:', {
      '총 캐시된 영상': stats.total,
      '유효한 캐시': stats.recent,
      '만료된 캐시': stats.expired,
      '유효율': `${stats.total > 0 ? ((stats.recent / stats.total) * 100).toFixed(1) : 0}%`
    });
    
    return stats;
  } catch (error) {
    console.error('❌ Videos 캐시 상태 확인 실패:', error);
  }
};

// 🆕 업로드 관련 디버깅 도구
// @ts-ignore - 개발용 전역 함수  
window.debugUploadIssue = async () => {
  try {
    console.log('🚨 === 업로드 문제 디버깅 ===');
    
    const { getCurrentUserId } = await import('@/lib/database');
    const userId = await getCurrentUserId();
    
    if (!userId) {
      console.log('❌ 로그인되지 않음');
      return;
    }
    
    console.log('🔍 현재 사용자 ID:', userId);
    
    // 1. localStorage 상태 확인
    console.log('�� === localStorage 상태 ===');
    const keys = [
      `watchHistory_${userId}`,
      `profileImages_${userId}`, 
      `moodboardHistories_${userId}`,
      `SliderHistory_${userId}`,
      'watchHistory',
      'profileImages'
    ];
    
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          console.log(`${key}: ${Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length}개`);
        } catch {
          console.log(`${key}: 파싱 불가`);
        }
      } else {
        console.log(`${key}: 없음`);
      }
    });
    
    // 2. DB 상태 확인
    console.log('🗄️ === DB 상태 ===');
    const { getWatchHistory, getSliderHistory, getClusterImages } = await import('@/lib/database');
    
    const dbWatchHistory = await getWatchHistory(userId, 10);
    console.log(`DB WatchHistory: ${dbWatchHistory?.length || 0}개`);
    
    const dbSliderHistory = await getSliderHistory(userId);
    console.log(`DB SliderHistory: ${dbSliderHistory?.length || 0}개`);
    
    const dbClusterImages = await getClusterImages(userId);
    console.log(`DB ClusterImages: ${dbClusterImages?.length || 0}개`);
    
    // 3. SliderHistory 상세 분석  
    if (dbSliderHistory && dbSliderHistory.length > 0) {
      console.log('�� === SliderHistory 상세 ===');
      dbSliderHistory.forEach((history: any, index: number) => {
        console.log(`[${index}] ${new Date(history.created_at).toLocaleString()}: ${history.version_type} 타입, ${history.data?.length || 0}개 이미지`);
      });
    }
    
    return {
      userId,
      localStorage: keys.filter(key => localStorage.getItem(key)).length,
      dbWatchHistory: dbWatchHistory?.length || 0,
      dbSliderHistory: dbSliderHistory?.length || 0,
      dbClusterImages: dbClusterImages?.length || 0
    };
    
  } catch (error) {
    console.error('❌ 업로드 디버깅 실패:', error);
  }
};

// 🆕 새 업로드 준비 (기존 데이터 정리)
// @ts-ignore - 개발용 전역 함수
window.prepareNewUpload = async () => {
  try {
    console.log('🧹 === 새 업로드 준비 시작 ===');
    
    const { getCurrentUserId } = await import('@/lib/database');
    const userId = await getCurrentUserId();
    
    if (!userId) {
      console.log('❌ 로그인되지 않음');
      return;
    }
    
    // localStorage 데이터 정리 (upload 관련만)
    const keysToRemove = [
      `watchHistory_${userId}`,
      'watchHistory',
      'watchHistory_guest'
    ];
    
    let removedCount = 0; 
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        removedCount++;
        console.log(`✅ 삭제: ${key}`);
      }
    });
    
    console.log(`🧹 localStorage 정리 완료: ${removedCount}개 키 삭제`);
    console.log('✅ 새 JSON 파일을 업로드할 준비 완료!');
    
    return { removedKeys: removedCount };
    
  } catch (error) {
    console.error('❌ 새 업로드 준비 실패:', error);
  }
}; 