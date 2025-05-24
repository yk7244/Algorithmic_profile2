// videoCluster.ts

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
    console.log('Sending request to OpenAI...');


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
  transformClusterToImageData: any,
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
    const clusterImagesData: Record<number, any> = {};
    for (let i = 0; i < newClusters.length; i++) {
      const image = await searchClusterImage_naver(newClusters[i], true);
      clusterImagesData[i] = image;
    }
    console.log('[handleCluster] 클러스터별 이미지 데이터:', clusterImagesData);

    // ImageData 형식으로 변환
    const profileImages = newClusters.map((cluster: any, index: number) => {
      const imageUrl = clusterImagesData[index]?.url || placeholderImage;
      return transformClusterToImageData(cluster, index, imageUrl);
    });
    console.log('[handleCluster] 변환된 프로필 이미지 데이터:', profileImages);

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

export const VideoCluster2 = async (watchHistory: WatchHistoryItem[], openai: any, OpenAILogger: any) => {
  try {
    // Log the input data
    console.log('Starting OpenAI analysis with watch history:', {
      totalVideos: watchHistory.length,
      sampleVideos: watchHistory.slice(0, 3)
    });

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

    // 상위 출현 키워드 추출 (10개)
    const topKeywords = Object.entries(allKeywordFrequencies)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword);

    // Log the prepared data
    console.log('Prepared data for OpenAI:', {
      topKeywords,
      keywordFrequencies: allKeywordFrequencies,
      keywordToVideos: allKeywordToVideos
    });

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

요구사항:
1. 클러스터 수는 최소 5개 이상이어야 합니다. 5개의 클러스터를 만들고 거기에 관련 영상을 포함해 주세요.
2. 모든 영상이 최소 하나의 그룹에 포함되어야 합니다.
3. 각 그룹은 최소 3개 이상의 연관된 영상을 포함해야 합니다.
4. 하나의 영상이 여러 그룹에 포함될 수 있습니다.
5. 각 그룹은 사용자의 뚜렷한 관심사나 취향을 나타내되 빅키워드와 트렌드키워드가 잘 조합되어야합니다. 

응답 형식:
CLUSTER_START
대표키워드: #그룹의 핵심 키워드
카테고리: 콘텐츠 카테고리
관심영역: (1) 나의 현재 라이프스타일 (2) YouTube 시청과 관련된 취향과 관심사 (3) YouTube 시청의 목적과 그 가치추구 성향을 반영해 3문장으로 설명
연관키워드: 관련 키워드들을 빈도순으로 나열
감성태도: 사용자 가치를 반영한 감성과 태도 키워드 3-4개
예상영상수: 해당 그룹에 속할 것으로 예상되는 영상 수
CLUSTER_END`;

    // Log request
    await OpenAILogger.logRequest({
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 2000,
      prompt: prompt
    });

    console.log('Sending request to OpenAI...');
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o-mini",
      temperature: 0.7,
      max_tokens: 2000,
    });

    console.log('Received response from OpenAI:', {
      model: completion.model,
      usage: completion.usage,
      contentLength: completion.choices[0].message.content?.length
    });

    // Log response
    await OpenAILogger.logResponse({
      model: completion.model,
      content: completion.choices[0].message.content || '',
      usage: completion.usage
    });

    const response = completion.choices[0].message.content || '';
    console.log('Processing OpenAI response...');

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
          'video_count'
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
    // null 제거 및 관련 영상 3개 이상만 필터
    const filteredClusters = clusters.filter(Boolean).filter((cluster: any) => cluster.related_videos.length >= 3);
    return filteredClusters;
  } catch (error) {
    console.error('Error in analyzeKeywordsWithOpenAI:', error);
    throw error;
  }
};