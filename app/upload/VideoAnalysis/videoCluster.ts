// videoCluster.ts

import { transformClustersToImageData } from '../../utils/clusterTransform';

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


// 통합된 키워드 분석 및 클러스터링 함수
export const VideoCluster = async (watchHistory: WatchHistoryItem[], openai: any, OpenAILogger: any) => {
  try {
    // 데이터를 더 작은 청크로 나눕니다 (예: 20개씩)
    const chunkSize = 20;
    const chunks = [];
    for (let i = 0; i < watchHistory.length; i += chunkSize) {
      chunks.push(watchHistory.slice(i, i + chunkSize));
    }

    let allKeywordFrequencies: { [key: string]: number } = {};
    let allKeywordToVideos: { [key: string]: { videoId: string; title: string }[] } = {};

    // 각 청크별로 키워드 빈도수와 비디오 매핑을 계산
    for (const chunk of chunks) {
      chunk.forEach(item => {
        if (item && Array.isArray(item.keywords)) {
          item.keywords.forEach(keyword => {
            allKeywordFrequencies[keyword] = (allKeywordFrequencies[keyword] || 0) + 1;
            if (!allKeywordToVideos[keyword]) {
              allKeywordToVideos[keyword] = [];
            }
            if (item.videoId && item.title) {
              allKeywordToVideos[keyword].push({ videoId: item.videoId, title: item.title });
            }
          });
        }
      });
    }
    // 상위 출현 키워드 추출 (10개)
    const topKeywords = Object.entries(allKeywordFrequencies)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword);

    console.log('☑️클러스터 시작');

    console.log('키워드 빈도수', allKeywordFrequencies);
    console.log('영상 키워드 매핑', allKeywordToVideos);
    console.log('상위 10개 키워드', topKeywords);

    topKeywords.forEach(keyword => {
      console.log(`키워드: ${keyword}의 영상:`);
      if (allKeywordToVideos[keyword] && allKeywordToVideos[keyword].length > 0) {
        allKeywordToVideos[keyword].forEach((video, idx) => {
          console.log(`  영상${idx + 1}: ${video.videoId} (${video.title})`);
        });
        if (allKeywordToVideos[keyword].length > 20) {
          console.log('  ...');
        }
      } else {
        console.log('  관련 영상 없음');
      }
      console.log('-----------------------------');
    });

      /*시청 기록 데이터 (상위 10개 키워드 관련):
      ${topKeywords.map(keyword => 
        `${keyword}:
        - ${allKeywordToVideos[keyword].slice(0, 5).join('\n   - ')}${allKeywordToVideos[keyword].length > 5 ? '\n   - ...' : ''}`
      ).join('\n\n')} 
      */

    const prompt = `
당신은 YouTube 시청 기록을 분석해 사용자의
(1) 라이프스타일 
(2) YouTube 시청과 관련된 취향과 관심사 
(3) YouTube 시청의 목적과 그 가치추구 성향에 대해 깊이 있게 이해할 수 있는 전문가입니다.
이 시청 기록을 분석하여, 시청기록 영상들을 사용자의 관심사와 취향을 가장 잘 나타내는 의미 있는 그룹(클러스터)으로 묶어주세요.
* 각 그룹에는 관련 영상들을 자유롭게 배분해 주세요. ( 그룹에 포함된 관련영상 개수는 사용자의 관심정도를 나타냅니다.)

시청 기록 데이터 (상위 10개 키워드 관련):
${topKeywords.slice(0,10).map(keyword => 
  `${keyword}:
   - ${allKeywordToVideos[keyword].map(v => `${v.videoId} (${v.title})`).join('\n   - ')}`
).join('\n\n')} 

단, 그룹의 핵심키워드는
(1) 과하게 일반화 하지 말고 기억에 남는 재밌는 표현을 사용 할 것
(2) 사람들에게 공감이 되고 적극적으로 재사용할 수 있도록 세련되고 참신한 표현을 쓸 것
(3)성별표현 금지

응답 형식:
CLUSTER_START
1. 그룹의 핵심 키워드
2. [콘텐츠 카테고리]
3. (1) 나의 현재 라이프스타일 (2) YouTube 시청과 관련된 취향과 관심사 (3) YouTube 시청의 목적과 그 가치추구 성향을 반영해 3문장으로 설명
4. 관련 키워드들을 빈도순으로 나열
5. 감성과 태도 키워드 3-4개
6. 해당 그룹으로 분류한 영상 (분류한대로 넣어줘, ID만 콤마로 구분)
CLUSTER_END
`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 2000,
    });    

    console.log('⭐️⭐️⭐️⭐️OpenAI에 전달되는 프롬프트:', prompt);

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
        //console.log('파싱된거', parsedData);

        const relatedKeywords = parsedData.keywords
          ? parsedData.keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
          : [];
        //console.log('키워드', relatedKeywords);

        const moodKeywords = parsedData.mood_keyword
          ? parsedData.mood_keyword.split(',').map((k: string) => k.trim()).filter(Boolean)
          : [];
        //console.log('모드키워드', moodKeywords);

        // related_videos를 lines[5]에서 직접 파싱
        const relatedVideos = parsedData.related_videos
          ? parsedData.related_videos.split(',').map((url: string) => url.trim()).filter(Boolean)
          : [];
        console.log('관련영상', relatedVideos);

        const clusterObj = {
          main_keyword: parsedData.main_keyword,
          category: parsedData.category || '기타',
          description: parsedData.description,
          keyword_list: relatedKeywords.join(', '),
          mood_keyword: parsedData.mood_keyword,
          strength: relatedVideos.length,
          related_videos: relatedVideos.map((url: string) => ({ url })),
          metadata: {
            keywordCount: relatedKeywords.length,
            videoCount: relatedVideos.length,
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
// handleCluster 함수 분리 (UI 코드 제외, 로직만)
export const handleCluster = async (
  watchHistory: WatchHistoryItem[],
  openai: any,
  OpenAILogger: any,
  searchClusterImage_naver: any,
  transformClusterToImageData: any, //타입전환 함수
  placeholderImage: string,
  setClusters: (clusters: Cluster[]) => void,
  setAnalysisHistory: (history: any[]) => void,
  setShowAnalysis: (show: boolean) => void,
  setIsLoading: (loading: boolean) => void,
  setError: (err: string) => void,
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
    //console.log('[handleCluster] 기존 분석 기록(불러오기 전):', savedAnalyses);
    const updatedAnalyses = [...savedAnalyses, newAnalysis];
    //console.log('[handleCluster] 업데이트된 분석 기록:', updatedAnalyses);

    // 저장
    localStorageObj.setItem('analysisHistory', JSON.stringify(updatedAnalyses));
    setAnalysisHistory(updatedAnalyses);
    //console.log('[handleCluster] setAnalysisHistory 호출');

    // 현재 클러스터 설정
    setClusters(newClusters);
    //console.log('[handleCluster] setClusters 호출:', newClusters);

    // 클러스터 이미지 가져오기
    const clusterImagesData: Record<number, any> = {};
    for (let i = 0; i < newClusters.length; i++) {
      const image = await searchClusterImage_naver(newClusters[i], true);
      clusterImagesData[i] = image;
    }
    //console.log('[handleCluster] 클러스터별 이미지 데이터:', clusterImagesData);

    const profileImages = transformClustersToImageData(newClusters, clusterImagesData);
    console.log('!!타입 변환후 로컬에 저장된 Clusters:', profileImages);

    // 프로필 이미지 데이터 저장
    localStorageObj.setItem('profileImages', JSON.stringify(profileImages));

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

