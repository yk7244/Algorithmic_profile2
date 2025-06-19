// Pinterest 이미지 검색 함수 import
import { searchClusterImage_pinterest } from '../ImageSearch/GoogleImageSearch';
import { saveClusterHistory } from '../../utils/saveClusterHistory';
import { saveSliderHistory } from '../../utils/saveSliderHistory';
import { ClusterHistory } from '../../types/profile';
import { ensureUserExists, getCurrentUserId, saveClusterHistory as saveClusterHistoryDB, updateClusterImages } from '@/lib/database';

// 필요한 타입 정의 (간단화)
export type WatchHistoryItem = {
  title: string;
  videoId: string;
  keywords: string[];
  tags?: string[];
  timestamp?: string;
  url?: string;
  date?: any;
  channelName?: string;
};

export type Cluster = {
  main_keyword: string;
  category: string;
  description: string;
  keyword_list: string;
  mood_keyword: string;
  strength: number;
  related_videos: WatchHistoryItem[];
  metadata: any;
};

//클러스터 


// 2.통합된 키워드 분석 및 openAI 클러스터링 함수(handleCluster 함수 내부에서 호출)
export const VideoCluster = async (watchHistory: WatchHistoryItem[], openai: any, OpenAILogger: any) => {
  try {
    // 데이터를 더 작은 청크로 나눕니다 (예: 20개씩)
    const chunkSize = 20;
    const chunks = [];
    for (let i = 0; i < watchHistory.length; i += chunkSize) {
      chunks.push(watchHistory.slice(i, i + chunkSize));
    }

    let allKeywordFrequencies: { [key: string]: number } = {};
    let allKeywordToVideos: { [key: string]: string[] } = {};

    // 각 청크별로 키워드 빈도수와 비디오 매핑을 계산
    for (const chunk of chunks) {
      chunk.forEach(item => {
        if (item && Array.isArray(item.keywords)) {
          item.keywords.forEach(keyword => {
            allKeywordFrequencies[keyword] = (allKeywordFrequencies[keyword] || 0) + 1;
            if (!allKeywordToVideos[keyword]) {
              allKeywordToVideos[keyword] = [];
            }
            if (item.title) {
              allKeywordToVideos[keyword].push(item.title);
            }
          });
        }
      });
    }
    console.log('클러스터 시작...');


    // 상위 출현 키워드 추출 (10개)
    const topKeywords = Object.entries(allKeywordFrequencies)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword);

    const prompt = `
당신은 YouTube 시청 기록을 분석해 사용자의 (1) 라이프스타일 (2) YouTube 시청과 관련된 취향과 관심사 (3) YouTube 시청의 목적과 그 가치추구 성향에 대해 깊이 있게 이해할 수 있는 전문가입니다.
제공되는 YouTube 시청 기록 데이터를 분석하여 사용자의 관심사와 취향을 가장 잘 나타내는 의미 있는 그룹으로 분류하되 인스타그램의 hashtag처럼 함축적이고 직관적이게 만들어 주세요. 단, (1) 과하게 일반화 하지 말고 기억에 남는 표현을 사용 할 것, (2) 사람들에게 공감이 되고 적극적으로 재사용할 수 있도록 세련되고 참신한 표현을 쓸 것

시청 기록 데이터 (상위 10개 키워드 관련):
${topKeywords.map(keyword => 
`${keyword}:
 - ${allKeywordToVideos[keyword].slice(0, 5).join('\n   - ')}${allKeywordToVideos[keyword].length > 5 ? '\n   - ...' : ''}`
).join('\n\n')}

가장 자주 등장하는 키워드 (상위 10개):
${topKeywords.map(keyword => `${keyword} (${allKeywordFrequencies[keyword]}회)`).join('\n')}

분석 요구사항:
1. 모든 영상이 최소 하나의 그룹에 포함되어야 합니다.
2. 각 그룹은 최소 3개 이상의 연관된 영상을 포함해야 합니다.하나의 영상이 여러 그룹에 포함될 수 있습니다.
3. 굵은 텍스트 절대 금지
4. 각 그룹은 사용자의 뚜렷한 관심사나 취향을 나타내야 합니다.
5. 클러스터 수는 최소 5개 이상이어야 합니다.

응답 형식:
CLUSTER_START
1. [그룹의 핵심 키워드 또는 인물명]
2.[콘텐츠 카테고리]
3. [(1) 나의 현재 라이프스타일 (2) YouTube 시청과 관련된 취향과 관심사 (3) YouTube 시청의 목적과 그 가치추구 성향을 반영해 3문장으로 설명]
4. [관련 키워드들을 빈도순으로 나열]
5. [감성과 태도 키워드 3-4개]
6. [해당 그룹에 속할 것으로 예상되는 영상 url]
CLUSTER_END`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 2000,
    });    

    

    // Log response
    await OpenAILogger.logResponse({
      model: completion.model,
      content: completion.choices[0].message.content || '',
      usage: completion.usage
    });

    const response = completion.choices[0].message.content || '';
    console.log('응답결과:', response);
    
    const clusters: any[] = [];
    response.split('CLUSTER_START')
      .slice(1)
      .forEach((cluster: string, i: number) => {
        const clusterText = cluster.split('CLUSTER_END')[0]?.trim();
        if (!clusterText) return;
        console.log('클러스터', i, clusterText);

        const lines = clusterText.split('\n').map(line => line.trim()).filter(Boolean);
        console.log('자른거', lines);

        // 순서대로 매핑할 key 배열
        const keyOrder = [
          'main_keyword',
          'category',
          'description',
          'keywords',
          'mood_keyword',
          'related_videos'
        ];
        // 더 강력한 마크다운 제거 함수 (중첩도 제거)
        const removeMarkdown = (str: string) => {
          let prev = '';
          let curr = str;
          for (let i = 0; i < 3; i++) {
            prev = curr;
            curr = curr
              .replace(/\*\*([^*]+)\*\*/g, '$1')
              .replace(/\*([^*]+)\*/g, '$1')
              .replace(/__([^_]+)__/g, '$1')
              .replace(/_([^_]+)_/g, '$1')
              .replace(/`([^`]+)`/g, '$1')
              .replace(/<[^>]+>/g, '')
              .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
              .replace(/[#>\-]/g, '')
              .trim();
            if (curr === prev) break;
          }
          return curr;
        };

        const parsedData: any = {};
        lines.forEach((line, idx) => {
          let value = line.replace(/^[0-9]+\.\s*/, '').trim();
          value = removeMarkdown(value);
          const key = keyOrder[idx];
          if (key) parsedData[key] = value;
        });
        console.log('파싱된거', parsedData);

        const relatedKeywords = parsedData.keywords
          ? parsedData.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
          : [];
        console.log('키워드', relatedKeywords);

        const moodKeywords = parsedData.mood_keyword
          ? parsedData.mood_keyword.split(',').map((k: string) => k.trim()).filter(Boolean)
          : [];
        console.log('모드키워드', moodKeywords);

        // related_videos를 lines[5]에서 직접 파싱
        const relatedVideos = parsedData.related_videos
          ? parsedData.related_videos.split(',').map((url: string) => url.trim()).filter(Boolean)
          : [];
        console.log('관련영상', relatedVideos);

        // 🆕 AI가 반환한 제목들을 원본 watchHistory와 매칭하여 올바른 VideoData 형태로 변환
        const matchedVideos = relatedVideos
          .map((titleOrUrl: string) => {
            // URL에서 video ID 추출 시도
            const videoIdMatch = titleOrUrl.match(/(?:v=|youtu\.be\/)([^&?]+)/);
            if (videoIdMatch) {
              const videoId = videoIdMatch[1];
              const matchedItem = watchHistory.find(item => item.videoId === videoId);
              if (matchedItem) {
                return {
                  title: matchedItem.title,
                  embedId: matchedItem.videoId
                };
              }
            }
            
            // 제목으로 매칭 시도 (부분 매칭 포함)
            const matchedItem = watchHistory.find(item => 
              item.title && (
                item.title.toLowerCase().includes(titleOrUrl.toLowerCase()) ||
                titleOrUrl.toLowerCase().includes(item.title.toLowerCase()) ||
                item.title.toLowerCase() === titleOrUrl.toLowerCase()
              )
            );
            
            if (matchedItem) {
              return {
                title: matchedItem.title,
                embedId: matchedItem.videoId
              };
            }
            
            console.warn(`관련영상 매칭 실패: ${titleOrUrl}`);
            return null;
          })
          .filter(Boolean) // null 제거
          .slice(0, 5); // 최대 5개로 제한

        console.log('매칭된 관련영상:', matchedVideos);

        const clusterObj = {
          main_keyword: parsedData.main_keyword,
          category: parsedData.category || '기타',
          description: parsedData.description,
          keyword_list: relatedKeywords.join(', '),
          mood_keyword: parsedData.mood_keyword,
          strength: matchedVideos.length, // 🆕 매칭된 영상 수로 변경
          related_videos: matchedVideos, // 🆕 올바른 형태로 저장
          metadata: {
            keywordCount: relatedKeywords.length,
            videoCount: matchedVideos.length, // 🆕 매칭된 영상 수로 변경
            moodKeywords,
          },
        };
        console.log('[클러스터 객체]', clusterObj);
        clusters.push(clusterObj);
      });
    console.log('클러스터 객체 완성', clusters);

    // null 제거 및 관련 영상 3개 이상만 필터
    //const filteredClusters = clusters.filter(Boolean).filter((cluster: any) => cluster.related_videos.length >= 3);
    return clusters;
  } catch (error) {
    console.error('클러스터 분석 실패:', error);
    throw error;
  }
};

// 1.handleCluster 함수 분리 (UI 코드 제외, 로직만)
export const handleCluster = async (
  watchHistory: WatchHistoryItem[],
  openai: any,
  OpenAILogger: any,
  searchClusterImage_naver: any,
  transformClusterToImageData: any,
  placeholderImage: string,
  setClusters: (clusters: Cluster[]) => void,
  setAnalysisHistory: (history: any[]) => void,
  setShowAnalysis: (show: boolean) => void,
  setIsLoading: (loading: boolean) => void,
  setError: (err: string) => void,
  //setIsGeneratingProfile: (isGeneratingProfile: boolean) => void,
  //generateUserProfile: (localStorageObj: Storage) => void,
  localStorageObj: Storage = localStorage
) => {
  try {
    setIsLoading(true);
    const newClusters = await VideoCluster(watchHistory, openai, OpenAILogger);
    console.log('받은 클러스터', newClusters);

    // 새로운 분석 결과 생성
    const newAnalysis = {
      id: new Date().getTime().toString(),
      date: new Date().toLocaleString(),
      clusters: newClusters
    };
    console.log('[handleCluster] 새 분석 결과:', newAnalysis);

    // 기존 분석 기록 불러오기
    const savedAnalyses = JSON.parse(localStorageObj.getItem('analysisHistory') || '[]');
    console.log('[handleCluster] 기존 분석 기록(불러오기 전):', savedAnalyses);
    const updatedAnalyses = [...savedAnalyses, newAnalysis];
    console.log('[handleCluster] 업데이트된 분석 기록:', updatedAnalyses);

    // 저장
    localStorageObj.setItem('analysisHistory', JSON.stringify(updatedAnalyses));
    setAnalysisHistory(updatedAnalyses);
    console.log('[handleCluster] setAnalysisHistory 호출');

    // 현재 클러스터 설정
    setClusters(newClusters);
    console.log('[handleCluster] setClusters 호출:', newClusters);

    // 클러스터 이미지 가져오기
    /* 네이버
    for (let i = 0; i < newClusters.length; i++) {
      const image = await searchClusterImage_naver(newClusters[i], true);
      clusterImagesData[i] = image;
    } */
    const clusterImagesData: Record<number, any> = {};
    for (let i = 0; i < newClusters.length; i++) {
      try {
        const pinterestResults = await searchClusterImage_pinterest(newClusters[i], 1);
        if (pinterestResults && pinterestResults.length > 0 && pinterestResults[0].thumbnailLink) {
          clusterImagesData[i] = { url: pinterestResults[0].thumbnailLink };
        } else {
          clusterImagesData[i] = { url: '/images/default_image.png' };
        }
      } catch (error) {
        console.error('Pinterest 이미지 검색 실패:', error);
        clusterImagesData[i] = { url: '/images/default_image.png' };
      }
    }
    
    console.log('[handleCluster] 클러스터별 이미지 데이터:', clusterImagesData);

    // ImageData 형식으로 변환
    const profileImages = newClusters.map((cluster: any, index: number) => {
      const imageUrl = clusterImagesData[index]?.url || placeholderImage;
      return transformClusterToImageData(cluster, index, imageUrl);
    });
    console.log('[handleCluster] 변환된 프로필 이미지 데이터:', profileImages);

    // 프로필 이미지 데이터 저장 (localStorage + DB)
    // 🆕 사용자 ID 가져오기 (DB와 localStorage 공통 사용)
    const userId = await getCurrentUserId();
    const storageKey = userId ? `profileImages_${userId}` : 'profileImages';
    
    // 🆕 기존 데이터 완전 교체 (겹침 방지)
    localStorageObj.removeItem(storageKey);  // 기존 데이터 삭제
    localStorageObj.setItem(storageKey, JSON.stringify(profileImages));  // 새 데이터 저장
    console.log(`[handleCluster] localStorage 교체 완료: ${storageKey}`);
    
    // 🆕 DB에도 자동 저장
    try {
      console.log('[handleCluster] DB 저장 시작...');
      
      // 사용자 확인 및 생성 (userId는 위에서 이미 가져옴)
      await ensureUserExists();
      
      if (userId) {
        // ClusterHistory로 변환 (타입 맞춤)
        const clusterHistoryData = profileImages.map((item: any) => ({
          ...item,
          user_id: userId,
          relatedVideos: item.relatedVideos || [],
          created_at: new Date().toISOString()
        }));
        
        // DB에 저장
        await saveClusterHistoryDB(clusterHistoryData);
        console.log('[handleCluster] 클러스터 데이터 DB 저장 완료');
        
        // 🆕 cluster_images 테이블에 기존 데이터 완전 교체 (겹침 방지)
        await updateClusterImages(userId, clusterHistoryData);
        console.log('[handleCluster] 클러스터 이미지 DB 교체 완료 (기존 삭제 + 새로운 저장)');
        
        // 🎯 SliderHistory 자동 저장 (upload 타입, 누적 추가)
        try {
          console.log('[handleCluster] SliderHistory 저장 시작 (upload 타입):', {
            'profileImages 개수': profileImages.length,
            'profileImages는 ImageData 형식': true,
            'profileImages[0] 구조': profileImages[0]
          });
          
          // 🆕 기존 upload 타입 Sl�라이더 개수 확인 (삭제하지 않고 누적)
          const { getSliderHistory } = await import('@/lib/database');  
          const existingUploadHistory = await getSliderHistory(userId, 'upload');
          
          if (existingUploadHistory && existingUploadHistory.length > 0) {
            console.log(`📊 기존 upload 타입 Sl�라이더 ${existingUploadHistory.length}개 발견, 새로운 슬라이더 추가 예정`);
          } else {
            console.log('📊 기존 upload 타입 슬라이더 없음, 첫 번째 슬라이더 생성 예정');
          }
          
          // saveSliderHistory 함수 import (기존 데이터 삭제 없이 새로 추가)
          const { saveSliderHistory } = await import('../../utils/saveSliderHistory');
          const sliderResult = await saveSliderHistory(profileImages, 'upload');
          
          const totalSliders = (existingUploadHistory?.length || 0) + 1;
          console.log(`[handleCluster] ✅ SliberHistory 저장 완료 (upload 타입 누적): 총 ${totalSliders}개 슬라이더`, sliderResult);
        } catch (sliderError) {
          console.error('[handleCluster] ❌ SliderHistory 저장 실패:', sliderError);
          // SliderHistory 저장 실패해도 다른 저장은 계속 진행
        }
      }
    } catch (dbError) {
      console.error('[handleCluster] DB 저장 실패 (계속 진행):', dbError);
      // DB 저장 실패해도 UI는 정상 작동하도록 함
    }
    
    setShowAnalysis(true);
    console.log('[handleCluster] setShowAnalysis(true) 호출');

    
  } 
  catch (error) {
    console.error('클러스터링 실패:', error);
    setError('클러스터링 중 오류가 발생했습니다.');
  } 
  finally {
    setIsLoading(false);
  }
}; 

