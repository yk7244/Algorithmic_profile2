export const searchClusterImage = async (cluster: any, forceRefresh: boolean = false) => {
  try {
    console.log('🔍 이미지 검색 시작');
    console.log('클러스터 정보:', {
      main_keyword: cluster.main_keyword,
      category: cluster.category,
      mood_keyword: cluster.mood_keyword,
      description: cluster.description,
      keyword_list: cluster.keyword_list
    });

    const imageAttemptKey = `imageAttempt_${cluster.main_keyword}`;
    const hasAttempted = localStorage.getItem(imageAttemptKey);

    // 이미지 URL 유효성 검사 함수
    const isImageUrlValid = async (url: string): Promise<boolean> => {
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          mode: 'no-cors' // CORS 정책 우회
        });
        return true; // no-cors 모드에서는 상태를 확인할 수 없으므로, 응답이 있다면 true 반환
      } catch {
        return false;
      }
    };

    // 검색 시도 함수
    const attemptImageSearch = async (searchParams: URLSearchParams) => {
      const response = await fetch(
        `/api/search-image?${searchParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': forceRefresh ? 'no-cache' : 'default'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // 유효한 이미지 URL만 필터링
      if (data.items?.length > 0) {
        const validItems = [];
        for (const item of data.items) {
          if (await isImageUrlValid(item.link)) {
            validItems.push(item);
          }
        }
        data.items = validItems;
      }

      return data;
    };

    // 첫 번째 시도: 모든 키워드 포함
    const searchParams = new URLSearchParams();

    // 1. 메인 키워드 처리
    console.log('1️⃣ 메인 키워드 처리 시작');
    let mainKeyword = cluster.main_keyword;
    if (cluster.main_keyword.includes('인물')) {
      mainKeyword = `${mainKeyword} 인물사진 프로필`;
      console.log('👤 인물 키워드 감지 - 수정된 키워드:', mainKeyword);
    }
    searchParams.append('query', mainKeyword);
    console.log('메인 키워드 처리 완료:', mainKeyword);

    // 2. 카테고리 추가
    console.log('2️⃣ 카테고리 처리 시작');
    if (cluster.category && cluster.category !== '기타') {
      searchParams.append('category', cluster.category);
      console.log('카테고리 추가:', cluster.category);
    } else {
      console.log('카테고리 제외: 기타 또는 없음');
    }

    // 3. 감성 키워드 추가
    console.log('3️⃣ 감성 키워드 처리 시작');
    if (cluster.mood_keyword) {
      const moodKeywords = cluster.mood_keyword.split(',')[0].trim();
      searchParams.append('mood', moodKeywords);
      console.log('감성 키워드 추가:', moodKeywords);
    } else {
      console.log('감성 키워드 없음');
    }

    if (forceRefresh) {
      searchParams.append('t', new Date().getTime().toString());
      console.log('🔄 강제 새로고침 적용');
    }

    console.log('📝 첫 번째 시도 검색 쿼리:', searchParams.toString());

    try {
      // 첫 번째 시도
      let data = await attemptImageSearch(searchParams);

      if (!data.items?.length) {
        // 첫 번째 시도 실패 시, 메인 키워드로만 재시도
        console.log('⚠️ 첫 번째 검색 실패, 메인 키워드로만 재시도');
        const simpleSearchParams = new URLSearchParams();
        simpleSearchParams.append('query', mainKeyword);
        if (forceRefresh) {
          simpleSearchParams.append('t', new Date().getTime().toString());
        }

        console.log('📝 두 번째 시도 검색 쿼리:', simpleSearchParams.toString());
        data = await attemptImageSearch(simpleSearchParams);

        if (!data.items?.length) {
          throw new Error('모든 검색 시도 실패');
        }
      }

      // 이전 결과와 다른 이미지를 선택
      const savedImages = JSON.parse(localStorage.getItem('clusterImages') || '{}');
      const currentImage = savedImages[cluster.main_keyword]?.url;

      // 현재 이미지와 다른 새로운 이미지 찾기
      const availableImages = data.items.filter((item: any) => item.link !== currentImage);
      console.log('🖼 사용 가능한 이미지 수:', availableImages.length);

      const selectedImage = availableImages.length > 0 ?
        availableImages[Math.floor(Math.random() * availableImages.length)] :
        data.items[0];

      // 이미지 URL에 타임스탬프 추가하여 캐시 방지
      const imageUrl = new URL(selectedImage.link);
      imageUrl.searchParams.append('t', new Date().getTime().toString());

      const image = {
        url: imageUrl.toString(),
        credit: {
          name: 'Naver',
          link: selectedImage.link
        }
      };

      // 로컬 스토리지에 이미지 저장
      savedImages[cluster.main_keyword] = image;
      localStorage.setItem('clusterImages', JSON.stringify(savedImages));

      // 성공 기록 저장
      localStorage.setItem(imageAttemptKey, 'success');
      console.log('💾 이미지 저장 완료');
      return image;
    } catch (error) {
      console.error('❌ 모든 검색 시도 실패:', error);
      localStorage.setItem(imageAttemptKey, 'failed');
      console.groupEnd();
      return {
        url: '/images/default_image.png',
      };
    }
  } catch (error) {
    console.error('❌ 이미지 검색 실패:', error);
    console.groupEnd();

    const imageAttemptKey = `imageAttempt_${cluster.main_keyword}`;
    localStorage.setItem(imageAttemptKey, 'failed');

    return {
      url: '/images/default_image.png',
    };
  }
};
