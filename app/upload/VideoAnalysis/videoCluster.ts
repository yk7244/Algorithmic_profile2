// Pinterest 이미지 검색 함수 import
import { findBestThumbnail } from '../ImageSearch/YoutubeThumnail';
import { transformClustersToImageData } from '@/app/utils/clusterTransform';

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
  duration?: string;
  viewCount?: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  channelTitle?: string;
  embedId?: string;
};

export type Cluster = {
  main_keyword?: string;
  category?: string;
  description?: string;
  keyword_list?: string;
  mood_keyword?: string;
  strength?: number;
  thumbnailUrl?: string;
  related_videos?: {
    title: string;
    embedId: string;
  }[];
  metadata?: any;
};


//실험> 키워드 클러스터링을 먼저해서 관련비디오 찾기 

// STEP1. 키워드만으로 클러스터링하는 함수
const createKeywordClusters = async (
  topKeywords: string[], 
  allKeywordFrequencies: { [key: string]: number },
  openai: any, 
  OpenAILogger: any
) => {
  console.log('--- STEP1. 키워드 클러스터링 시작 ---');
  
  const keywordOnlyPrompt = `
당신은 유튜브 시청 기록에서 추출된 키워드들을 분석해서 사용자의 관심사를 클러스터링하는 전문가입니다.

시청기록에서 추출된 키워드들과 빈도수:
${topKeywords.map(keyword => `${keyword} (${allKeywordFrequencies[keyword]}회)`).join('\n')}

이 키워드들을 그룹화해서 사용자의 관심사를 5~8개의 의미있는 그룹으로 분류해주세요.

응답 형식:
KEYWORD_CLUSTER_START
  포함되는 키워드들 (빈도순으로 나열)
KEYWORD_CLUSTER_END`;

  //console.log('키워드 클러스터 프롬프트', keywordOnlyPrompt);

  const keywordCompletion = await openai.chat.completions.create({
    messages: [{ role: "user", content: keywordOnlyPrompt }],
    model: "gpt-4o-mini", 
    temperature: 0.7,
    max_tokens: 1500,
  });

  // Log keyword clustering response
  await OpenAILogger.logResponse({
    model: keywordCompletion.model,
    content: keywordCompletion.choices[0].message.content || '',
    usage: keywordCompletion.usage
  });

  const keywordResponse = keywordCompletion.choices[0].message.content || '';
  //console.log('키워드 클러스터링 결과:', keywordResponse);
  
  // 키워드 클러스터링 결과 파싱
  const keywordClusters: any[] = [];
  
  keywordResponse.split('KEYWORD_CLUSTER_START')
    .slice(1)
    .forEach((cluster: string, i: number) => {
      const clusterText = cluster.split('KEYWORD_CLUSTER_END')[0]?.trim();
      if (!clusterText) return;

            // 현재는 키워드들만 나열되어 있으므로 전체 텍스트를 keyword_list로 사용
      const keywordCluster = {
        keyword_list: clusterText.trim()
      };

      keywordClusters.push(keywordCluster);
    });

  //console.log('파싱된 키워드 클러스터들:', keywordClusters);
  console.log('--- STEP1. 키워드 클러스터링 끝 ---\n');
  
  return keywordClusters;
};

// STEP2. 관련 비디오 찾기 related_videos, strength
const findRelatedVideos = async (
  keywordClusters: any[],
  allKeywordToVideos: { [key: string]: { title: string; embedId: string; }[] },
) => {
  console.log('---STEP2. 관련 비디오 찾기 시작 ---');
  
  return keywordClusters.map(cluster => {
    const relatedVideos: { title: string; embedId: string; }[] = [];
    const clusterKeywords = cluster.keyword_list.split(',').map((k: string) => k.trim());
    
    // 각 키워드에 해당하는 비디오들 수집
    clusterKeywords.forEach((keyword: string) => {
      if (allKeywordToVideos[keyword]) {
        allKeywordToVideos[keyword].forEach(video => {
          // 중복 제거
          if (!relatedVideos.find(v => v.embedId === video.embedId)) {
            relatedVideos.push(video);
          }
        });
      }
    });

    // strength 계산 (관련 비디오 개수 기반)
    const strength = relatedVideos.length ; 

    return {
      ...cluster,
      related_videos: relatedVideos,
      strength: strength
    };
  });
};

// STEP3. 최종 클러스터 분석 with openAI 
const analyzeClusterWithOpenAI = async (
  clustersWithVideos: any[],
  openai: any,
  OpenAILogger: any
) => {
  console.log('---STEP3. 최종 클러스터 분석 시작 ---');
  
  const prompt = `
당신은 유튜브시청 기록을 분석해 사용자의 
(1) 라이프스타일 
(2) 유튜브시청과 관련된 취향과 관심사 
(3) 유튜브시청의 목적과 그 가치추구 성향에 대해 깊이 있게 이해할 수 있는 전문가입니다.
제공된 유튜브시청기록의 키워드 클러스터들을 종합 분석해 응답형식을 채워주세요.

단, (1) 과하게 일반화 하지 말고 기억에 남는 표현을 사용 할 것, 
(2) 사람들에게 공감이 되고 적극적으로 재사용할 수 있도록 세련되고 참신한 표현을 쓸 것

  키워드 클러스터:
  ${clustersWithVideos.map(cluster => {
    const titles = cluster.related_videos?.slice(0, 8).map((video: any) => video.title).join(', ') || '없음';
    return `🔍 클러스터: ${cluster.keyword_list}\n📹 관련 영상들: ${titles}`;
  }).join('\n\n')}


응답 형식:
CLUSTER_START
1.그룹의 핵심 키워드 또는 인물명
2.콘텐츠 카테고리
3.(1) 나의 현재 라이프스타일 (2) 유튜브시청과 관련된 취향과 관심사 (3) 유튜브시청의 목적과 그 가치추구 성향을 반영해 3문장으로 설명
4.감성과 태도 키워드 3-4개
CLUSTER_END`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4o-mini",
    temperature: 0.7,
    max_tokens: 2000,
  });    

  console.log('요청 프롬프트:', prompt);

  // Log response
  await OpenAILogger.logResponse({
    model: completion.model,
    content: completion.choices[0].message.content || '',
    usage: completion.usage
  });

  const response = completion.choices[0].message.content || '';
  console.log('응답결과:', response);
  
  // 기존 클러스터 복사 (참조 문제 방지)
  const updatedClusters = [...clustersWithVideos];
  const analysisResults: any[] = [];
  
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
        'mood_keyword'
      ];
      // 더 강력한 마크다운 제거 함수 (중첩도 제거)
      const removeMarkdown = (str: string) => {
        let prev = '';
        let curr = str;
        for (let j = 0; j < 3; j++) {
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

      analysisResults.push({
        main_keyword: parsedData.main_keyword,
        category: parsedData.category || '기타',
        description: parsedData.description,
        mood_keyword: parsedData.mood_keyword
      });
    });

  // 기존 클러스터에 OpenAI 분석 결과 병합
  updatedClusters.forEach((cluster, index) => {
    if (analysisResults[index]) {
      cluster.main_keyword = analysisResults[index].main_keyword;
      cluster.category = analysisResults[index].category;
      cluster.description = analysisResults[index].description;
      cluster.mood_keyword = analysisResults[index].mood_keyword;
    }
  });
    
  console.log('업데이트된 클러스터:', updatedClusters);

  return updatedClusters;
};

// STEP4. 클러스터 이미지 추가 (VideoCluster 내부에서 사용)
const addClusterImages = async (clusters: any[]) => {
  console.log('---STEP4. 클러스터 이미지 추가 시작 ---');
  
  const result = clusters.map((cluster, index) => {
    try {
      const imageResults = findBestThumbnail(cluster);
      cluster.thumbnailUrl = imageResults;
      
    } catch (error) {
      console.error('클러스터 썸네일 이미지 검색 실패:', error);
      cluster.thumbnailUrl = '/images/default_image.png';
    }
    
    console.log(`🖼️ 클러스터 ${index + 1}: ${cluster.main_keyword || cluster.keyword_list}`);
    console.log(`   썸네일: ${cluster.thumbnailUrl}`);
    
    return cluster;
  });

  console.log('---STEP4. 클러스터 이미지 추가 완료 ---');
  return result;
};

//클러스터 실행 (handleCluster 함수 내부에서 호출)
export const VideoCluster = async (watchHistory: WatchHistoryItem[], openai: any, OpenAILogger: any) => {
  try {
    console.log('=== VideoCluster 시작 ===');
    
    // 데이터 전처리
    const chunkSize = 20;
    const chunks = [];
    for (let i = 0; i < watchHistory.length; i += chunkSize) {
      chunks.push(watchHistory.slice(i, i + chunkSize));
    }

    let allKeywordFrequencies: { [key: string]: number } = {};
    let allKeywordToVideos: { [key: string]: {
      title: string;
      embedId: string;
    }[] } = {};

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
              allKeywordToVideos[keyword].push({
                title: item.title,
                embedId: item.embedId || item.videoId || '',
              });
            }
          });
        }
      });
    }

    const topKeywords = Object.entries(allKeywordFrequencies)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 100)
      .map(([keyword]) => keyword);

    // 1단계: 키워드만으로 클러스터링
    console.log('1단계: 키워드 클러스터링');
    const keywordClusters = await createKeywordClusters(topKeywords, allKeywordFrequencies, openai, OpenAILogger);
    console.log('1단계 결과:', keywordClusters);

    // 2단계: 관련 비디오 찾기
    console.log('2단계: 관련 비디오 찾기');
    const clustersWithVideos = await findRelatedVideos(keywordClusters, allKeywordToVideos);
    console.log('2단계 결과:', clustersWithVideos);
    
    // 3단계: 최종 클러스터 분석 with OpenAI
    console.log('3단계: 최종 클러스터 분석');
    const clustersAnalysis = await analyzeClusterWithOpenAI(clustersWithVideos, openai, OpenAILogger);
    console.log('3단계 결과:', clustersAnalysis);

    // 4단계: 클러스터 이미지 추가
    console.log('4단계: 클러스터 이미지 추가');
    const finalClusters = await addClusterImages(clustersAnalysis);
    console.log('4단계 결과:', finalClusters);

    console.log('=== VideoCluster 완료 ===');
    return finalClusters;

  } catch (error) {
    console.error('클러스터 분석 실패:', error);
    throw error;
  }
};

//handleCluster => 실행, 저장
export const handleCluster = async (
  watchHistory: WatchHistoryItem[],
  openai: any,
  OpenAILogger: any,
  transform: any,
  placeholderImage: string,
  setClusters: (clusters: Cluster[]) => void,
  setAnalysisHistory: (history: any[]) => void,
  setShowAnalysis: (show: boolean) => void,
  setIsLoading: (loading: boolean) => void,
  setError: (err: string) => void,
  //setIsGeneratingProfile: (isGeneratingProfile: boolean) => void,
  //generateUserProfile: (localStorageObj: Storage) => void,
) => {
  try {
    setIsLoading(true);
    
    // localStorage 존재 확인
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage가 사용할 수 없습니다. 서버 사이드 환경이거나 localStorage가 비활성화되어 있습니다.');
      setError('브라우저 환경에서만 사용 가능합니다.');
      return;
    }

    const newClusters = await VideoCluster(watchHistory, openai, OpenAILogger);
    //console.log('받은 클러스터', newClusters);

    // 새로운 분석 결과 생성
    const newAnalysis = {
      id: new Date().getTime().toString(),
      date: new Date().toLocaleString(),
      clusters: newClusters
    };
    //console.log('[handleCluster] 새 분석 결과:', newAnalysis);

    // 기존 분석 기록 불러오기
    const savedAnalyses = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
    //console.log('[handleCluster] 기존 분석 기록(불러오기 전):', savedAnalyses);
    const updatedAnalyses = [...savedAnalyses, newAnalysis];
    //console.log('[handleCluster] 업데이트된 분석 기록:', updatedAnalyses);

    // 저장
    localStorage.setItem('analysisHistory', JSON.stringify(updatedAnalyses));
    setAnalysisHistory(updatedAnalyses);
    //console.log('[handleCluster] setAnalysisHistory 호출');

    // 클러스터 설정 (이미 VideoCluster에서 이미지 추가됨)
    setClusters(newClusters);
    console.log('[handleCluster] 클러스터 설정:', newClusters);

    // ImageData 형식으로 변환
    const profileImages = newClusters.map((cluster: any, index: number) => {
      const imageUrl = cluster.thumbnailUrl || placeholderImage;
      return transform(cluster, index, imageUrl);
    });

    //Transform 함수 호출
    transformClustersToImageData(newClusters);
    setShowAnalysis(true);
    //console.log('[handleCluster] setShowAnalysis(true) 호출');

    
  } 
  catch (error) {
    console.error('클러스터링 실패:', error);
    setError('클러스터링 중 오류가 발생했습니다.');
  } 
  finally {
    setIsLoading(false);
  }
}; 

