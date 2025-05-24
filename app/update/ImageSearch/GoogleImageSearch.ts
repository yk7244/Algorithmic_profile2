import { buildImageSearchKeyword } from './ImageSearchKeyword';


export interface PinterestImageData {
  link: string; // Pinterest 페이지 URL
  thumbnailLink: string; // 썸네일 이미지 URL
  title: string; // 이미지 제목 또는 설명
}

/**
 * Google Custom Search Engine (CSE)를 사용하여 Pinterest 이미지를 검색합니다.
 * CSE는 www.pinterest.com 사이트만 검색하도록 설정되어 있어야 합니다.
 * 
 * @param query 검색할 키워드
 * @param num 반환받을 이미지 개수 (기본값: 10, 최대: 10)
 * @returns 검색된 Pinterest 이미지 정보 배열 Promise
 */


export async function searchClusterImage_pinterest(
    cluster: {
        main_keyword: string;
        category?: string;
        mood_keyword?: string;
        sub_keyword?: string;
        description?: string;
        keyword_list?: string;
    },
    num: number = 10
): Promise<PinterestImageData[]> {

  // ⭐️키워드 조합/번역
  const query = await buildImageSearchKeyword(cluster);
  console.log('원본 검색어:', query);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const cseId = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;
  //console.log("API KEY:", apiKey);
  //console.log("CSE ID:", cseId);

  if (!apiKey || !cseId) {
    throw new Error("API Key 또는 CSE ID가 설정되지 않았습니다.");
  }

  // Google Custom Search JSON API 엔드포인트
  const endpoint = `https://www.googleapis.com/customsearch/v1`;
  
  // 각 키워드 처리
  let cleanedQuery = query;
  
  // 대괄호와 해시태그 제거
  if (cleanedQuery.startsWith('[#') && cleanedQuery.endsWith(']')) {
    cleanedQuery = cleanedQuery.substring(2, cleanedQuery.length - 1);
  } else if (cleanedQuery.startsWith('#')) {
    cleanedQuery = cleanedQuery.substring(1);
  }
  console.log('처리된 검색어:', cleanedQuery);

  // 랜덤 시작 인덱스 생성 (1-100 사이)
  const startIndex = Math.floor(Math.random() * 100) + 1;
  console.log('시작 인덱스:', startIndex);

  // Google Custom Search API 요청 파라미터
  const params = new URLSearchParams({
    key: apiKey,
    cx: cseId,
    q: cleanedQuery,
    searchType: 'image',
    siteSearch: 'www.pinterest.com/*',
    num: Math.min(num, 10).toString(),
    safe: 'high',
    start: startIndex.toString() // 랜덤 시작 인덱스 추가
  });

  const requestUrl = `${endpoint}?${params.toString()}`;
  console.log('API 요청 URL:', requestUrl);

  try {
    const response = await fetch(requestUrl, {
      cache: 'no-store', // 캐시 비활성화
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google Custom Search API 오류 상세:", JSON.stringify(errorData, null, 2)); 
      throw new Error(`Google Custom Search API 오류 (${response.status})`);
    }

    const data = await response.json();

    if (!data.items) {
      console.log("검색 결과 없음:");
      return [];
    }

    // API 응답에서 필요한 정보 추출
    const images: PinterestImageData[] = data.items.map((item: any) => {
      // Pinterest 페이지 URL 생성 (rs=typed 파라미터 추가)
      const pinterestUrl = `https://kr.pinterest.com/search/pins/?q=${encodeURIComponent(cleanedQuery)}&rs=typed`;
      console.log("Pinterest 검색 URL:", pinterestUrl);
      
      // Pinterest 이미지 URL 추출
      let imageUrl = '';
      if (item.pagemap?.cse_image?.[0]?.src) {
        imageUrl = item.pagemap.cse_image[0].src;
      } else if (item.pagemap?.cse_thumbnail?.[0]?.src) {
        imageUrl = item.pagemap.cse_thumbnail[0].src;
      } else if (item.link) {
        imageUrl = item.link;
      }
      
      console.log("Pinterest 이미지 URL:", imageUrl);
      
      return {
        link: pinterestUrl,
        thumbnailLink: imageUrl,
        title: item.title,
      };
    });

    return images;

  } catch (error) {
    console.error("Pinterest 이미지 검색 실패:", error);
    throw error; 
  }
} 