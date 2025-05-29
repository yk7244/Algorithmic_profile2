export interface PinterestImageData {
  link: string; // 이미지 URL 또는 Pinterest 페이지 URL
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
    query: string,
    num: number = 10
): Promise<PinterestImageData[]> {
  // 로그 추가: 함수 호출 시 환경 변수 값 확인
    console.log('환경 변수 확인 (imageSearch.ts):');
    console.log('NEXT_PUBLIC_GOOGLE_API_KEY:', process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
    console.log('NEXT_PUBLIC_GOOGLE_CSE_ID:', process.env.NEXT_PUBLIC_GOOGLE_CSE_ID);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    const cseId = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;

    if (!apiKey || !cseId) {
        console.error("Google API Key 또는 CSE ID가 설정되지 않았습니다.");
        throw new Error("API Key 또는 CSE ID가 설정되지 않았습니다.");
    }

    // Google Custom Search JSON API 엔드포인트
    const endpoint = `https://www.googleapis.com/customsearch/v1`;
    
    // 검색어 가공 로직 추가
    let cleanedQuery = query;
    if (cleanedQuery.startsWith('[#') && cleanedQuery.endsWith(']')) {
        cleanedQuery = cleanedQuery.substring(2, cleanedQuery.length - 1); // '[#' 와 ']' 제거
    } else if (cleanedQuery.startsWith('#')) {
        cleanedQuery = cleanedQuery.substring(1); // '#' 만 제거
    }
    cleanedQuery = cleanedQuery.trim(); // 양 끝 공백 제거

    // API 요청 파라미터
    const params = new URLSearchParams({
        key: apiKey,
        cx: cseId,
        q: cleanedQuery, // 가공된 검색어 사용
        searchType: 'image',
        siteSearch: 'www.pinterest.com/*',
        num: Math.min(num, 10).toString(),
        safe: 'high',
        imgSize: 'large', // 큰 이미지 요청
        imgType: 'photo' // 사진 타입만
    });

    // 로그 추가: 요청 URL 및 파라미터 확인
    const requestUrl = `${endpoint}?${params.toString()}`;
    console.log('API 요청 URL:', requestUrl);
    console.log('검색어 (query):', query); 
    console.log('가공된 검색어 (cleanedQuery):', cleanedQuery); // 가공된 값 로그 추가


    try {
        const response = await fetch(requestUrl);
        if (!response.ok) {
        const errorData = await response.json();
        // 상세 오류 내용 출력
        console.error("Google Custom Search API 오류 상세:", JSON.stringify(errorData, null, 2)); 
        throw new Error(`Google Custom Search API 오류 (${response.status})`);
        }

        const data = await response.json();

        if (!data.items) {
        console.log("검색 결과 없음:", query);
        return [];
        }

        // API 응답에서 필요한 정보 추출
        const images: PinterestImageData[] = data.items
          .map((item: any) => {
            // Log the Pinterest page URL (contextLink)
            console.log("Pinterest 컨텍스트 링크 (페이지 URL?):", item.image?.contextLink);
            
            // 더 큰 이미지 URL 선택 (link가 더 클 수 있음)
            const imageUrl = item.link || item.image?.thumbnailLink;
            
            return {
              link: item.link,
              thumbnailLink: imageUrl, // 더 큰 이미지 URL 사용
              title: item.title,
            };
          })
          .filter((image: PinterestImageData) => {
            // 문제가 있는 도메인들 필터링
            const problematicDomains = [
              'inven.co.kr',
              'ruliweb.com', 
              'cdn.clien.net',
              'images.chosun.com',
              'pbs.twimg.com'
            ];
            
            try {
              const url = new URL(image.thumbnailLink);
              const isProblematic = problematicDomains.some(domain => url.hostname.includes(domain));
              
              if (isProblematic) {
                console.log(`⚠️ 문제가 있는 도메인 필터링: ${url.hostname}`);
                return false;
              }
              
              // 이미지 확장자 체크
              const hasImageExtension = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(image.thumbnailLink);
              if (!hasImageExtension) {
                console.log(`⚠️ 이미지 확장자가 없는 URL 필터링: ${image.thumbnailLink}`);
                return false;
              }
              
              return true;
            } catch (error) {
              console.log(`🚫 잘못된 URL 형식: ${image.thumbnailLink}`);
              return false;
            }
          });

        return images;

    } catch (error) {
        console.error("Pinterest 이미지 검색 실패:", error);
        throw error; 
    }
} 