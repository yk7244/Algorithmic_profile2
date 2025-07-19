// Pinterest 이미지 검색 함수 import
import { findBestThumbnail } from '../ImageSearch/YoutubeThumnail';
import { transformClustersToImageData } from '@/app/utils/clusterTransform';
import { useGenerateUserProfile } from '../../my_profile/Nickname/Hooks/useGenerateUserProfile';
import { ProfileData } from '@/app/types/profile';
import { generateProfileId } from '@/app/my_profile/Nickname/Hooks/useProfileStorage';
import { saveProfileData } from '@/app/utils/save/saveProfileData';
import { createUserData } from '@/app/utils/save/saveUserData';
import { setReflectionData } from '@/app/utils/save/saveReflection';  
import { saveWatchHistory_array } from '@/app/utils/save/saveWatchHistory_array';
import { updateReflectionAnswer } from '@/app/utils/save/saveReflection';

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
      const clusterText = cluster.split('KEYWORD_CLUSTER_END')[0]?.replace(/\s*\(\d+회\)\s*$/, '').trim();

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
  //console.log('keywordClusters', keywordClusters);
  //console.log('allKeywordToVideos', allKeywordToVideos);

  return keywordClusters.map(cluster => {
    const relatedVideos: { title: string; embedId: string; }[] = [];
    const clusterKeywords = cluster.keyword_list
      ? cluster.keyword_list.split(',').map((k: string) =>
          k.replace(/\s*\(\d+회\)\s*$/, '').trim()
        )
      : [];
    //console.log('clusterKeywords', clusterKeywords);
    
    // 각 키워드에 해당하는 비디오들 수집
    clusterKeywords.forEach((keyword: string) => {
      //console.log('keyword', keyword);

      if (allKeywordToVideos[keyword]) {
        //console.log('allKeywordToVideos[keyword]', allKeywordToVideos[keyword]);
        allKeywordToVideos[keyword].forEach(video => {
          // 중복 제거
          //console.log('video', video);
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
(1) 콘텐츠 관심 흐름
(2) 시청 성향과 목적
(3) 내면 가치 및 감정 흐름에 대해 깊이 있게 이해할 수 있는 전문가입니다.
제공된 클러스터를 분석해 응답형식에 맞게 친절히 설명해주세요

단, (1) 과하게 일반화 하지 말고 기억에 남는 표현을 사용 할 것, 
(2) 사람들에게 공감이 되고 적극적으로 재사용할 수 있도록 세련되고 참신한 표현을 쓸 것
(3) 핵심키워드의 프레임: [시청취향을 반영한 성향]+ [콘텐츠명, 인물, 채널] (예: 뉴진스 성장 서사, 무도 감정 편집본)

  ${clustersWithVideos.map((cluster, i) => {
    const titles = cluster.related_videos?.slice(0, 8).map((video: any) => video.title).join(', ') || '없음';
    return  `클러스터 ${i+1}의 키워드들: ${cluster.keyword_list}\n📹 관련 영상들: ${titles}`;
  }).join('\n\n')}

* 클러스터 ${clustersWithVideos.length}개 생성

응답 형식:
CLUSTER_START
1.10자 이내 재밌는 핵심 키워드 
2.콘텐츠 카테고리
3.당신은 [관심 콘텐츠, 취향]에 관심을 가지고 있는 흐름이 보여요. [콘텐츠 특성/분위기]에 시선이 오래 머무는 성향을 가지고 있는 것 같아요.[시청스타일]한 스타일을 추구하고 [시청 성향]중요하게 여기는 모습이에요. 시청하신 영상들을 살펴보면서 당신의 [내면 감정/가치/연결]이 느껴졌어요.  
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

//STEP5. 별명 생성
const generateNickname = async (clusters: any[], openai: any) => {
  console.log('---STEP5. 별명 생성 시작 ---');
  //const {generateProfileId} = useProfileStorage();
  
  const prompt = `
    당신은 사용자의 관심사와 성향을 분석하여 그들의 성격과 취향을 파악하는 전문가입니다.
    다음은 사용자의 관심사와 성향을 분석한 정보입니다:

    ${clusters.map((cluster: any, index: number) => `
    이미지 ${index + 1}:
    - 주요 키워드: ${cluster.main_keyword || '정보 없음'}
    - 카테고리: ${cluster.category || '미분류'}
    - 설명: ${cluster.description || '정보 없음'}
    - 감성 키워드: ${cluster.mood_keyword || '정보 없음'}
    - 관련 키워드: ${cluster.keywords?.join(', ') || '정보 없음'}
    `).join('\n')}

    위 정보를 바탕으로 다음 두 가지를 한국어로 생성해주세요:
    추천프레임: [감정/태도] + [콘텐츠 관심 분야] 동물
    예시: 진심으로 요리를 사랑한 다람쥐, 고요하게 우주를 탐험하는 고슴도치

    1. 사용자의 대표 관심사를 종합하여 봤을때, 여러가지를 혼합하여 새로운 키워드로 취향과 성격을 종합적으로 반영한 독특하고 창의적인 별명생성 (예: "감정을 디버깅하는 ", "컷 편집에 빠진", "선율에 잠긴" 등)
    2. 중요!!: 별명 생성시 재밌는 동물, 식물, 과일등의 생명체로 은유법이나 비유 명사를 무조건 활용해야함 ("예: 현아를 좋아하는 사과, 토끼)
    3. 사용자의 콘텐츠 소비 패턴, 취향, 관심사를 2-3문장으로 짧게 재밌게 흥미롭게 요약한 설명, 사용자를 예측해도 됨

    응답 형식:
    별명: [생성된 별명]
    설명: [생성된 설명]
  `;

  console.log('OpenAI 요청 시작');
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-3.5-turbo",
            temperature: 0.9,
        });
        const response = completion.choices[0].message.content || '';
        console.log('OpenAI 응답:', response);
            
        // 응답 파싱 개선
        const nicknameMatch = response.match(/별명:\s*(.*?)(?=\n|$)/);
        const descriptionMatch = response.match(/설명:\s*([\s\S]*?)(?=\n\n|$)/);

        const newProfile = {
            id: generateProfileId(),
            nickname: nicknameMatch ? nicknameMatch[1].trim() : '알고리즘 탐험가',
            description: descriptionMatch ? descriptionMatch[1].trim() : '당신만의 독특한 콘텐츠 취향을 가지고 있습니다. 메인 페이지에서 더 많은 관심사를 추가해보세요!',
            created_at: new Date().toISOString()
        };
        console.log('새로운 프로필:', newProfile);
        saveProfileData(newProfile);
  return newProfile;
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
  generateProfile: (profileImages: any[]) => void,
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

    //별명 생성
    // 5단계: 별명 생성
    console.log('5단계: 별명 생성');
    const nickname = await generateNickname(newClusters, openai);
    console.log('5단계 결과:', nickname);

    // 6단계: 유저 데이터 업데이트 -> updated_at 업데이트
    console.log('6단계: 유저 데이터 생성');
    createUserData();
    console.log('6단계 결과: 유저 데이터 생성 완료'); 

    // 7단계: 리플랙션 데이터 생성
    console.log('7단계: 리플랙션 데이터 생성'); 
    setReflectionData();
    console.log('7단계 결과: 리플랙션 데이터 생성 완료');

    
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

