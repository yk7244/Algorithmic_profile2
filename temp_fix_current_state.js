// 콘솔에서 실행할 임시 수정 스크립트
// 슬라이더 히스토리의 최신 데이터를 현재 상태(ClusterImages)로 복사

async function fixCurrentState() {
  try {
    console.log('🔧 현재 상태 수정 시작...');
    
    // 1. 현재 사용자 ID 가져오기
    const { getCurrentUserId, updateClusterImages } = await import('/lib/database.js');
    const userId = await getCurrentUserId();
    
    if (!userId) {
      console.error('❌ 로그인되지 않음');
      return;
    }
    
    console.log('👤 현재 사용자 ID:', userId);
    
    // 2. 슬라이더 히스토리에서 최신 데이터 가져오기
    const sliderHistoryKey = `SliderHistory_${userId}`;
    const histories = JSON.parse(localStorage.getItem(sliderHistoryKey) || '[]');
    
    if (histories.length === 0) {
      console.error('❌ 슬라이더 히스토리가 없습니다');
      return;
    }
    
    // 3. 가장 최신 히스토리 찾기 (타임스탬프 기준)
    const latestHistory = histories.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    );
    
    console.log('📅 최신 히스토리:', {
      timestamp: new Date(latestHistory.timestamp).toLocaleString(),
      version_type: latestHistory.version_type,
      images_count: latestHistory.images?.length || 0
    });
    
    // 4. 이미지들을 ClusterImages DB에 저장
    if (latestHistory.images && latestHistory.images.length > 0) {
      await updateClusterImages(userId, latestHistory.images);
      console.log('✅ ClusterImages DB 업데이트 완료:', latestHistory.images.length);
      
      // 5. localStorage에도 현재 상태로 저장
      const profileImagesKey = `profileImages_${userId}`;
      localStorage.setItem(profileImagesKey, JSON.stringify(latestHistory.images));
      console.log('✅ localStorage 현재 상태 업데이트 완료');
      
      // 6. 페이지 새로고침
      console.log('🔄 페이지 새로고침...');
      window.location.reload();
      
    } else {
      console.error('❌ 최신 히스토리에 이미지가 없습니다');
    }
    
  } catch (error) {
    console.error('❌ 현재 상태 수정 실패:', error);
  }
}

// 실행: fixCurrentState() 