import OpenAI from 'openai';
import { ImageData, ProfileData, UserData } from '@/app/types/profile';

// OpenAI 클라이언트 초기화 (브라우저 환경 허용)
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true, // ✅ 브라우저 환경에서 실행 허용
});

// API 키 확인
if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
  console.warn('⚠️ OpenAI API 키가 설정되지 않았습니다. 유사도 계산이 작동하지 않습니다.');
  console.warn('📋 .env.local 파일에 NEXT_PUBLIC_OPENAI_API_KEY를 설정해주세요.');
}

/**
 * 텍스트를 OpenAI embedding으로 변환
 */
export async function getEmbedding(text: string): Promise<number[]> {
  // API 키가 없으면 빈 배열 반환 (유사도 계산 건너뛰기)
  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    console.warn('⚠️ OpenAI API 키가 없어 embedding 생성을 건너뜁니다.');
    return [];
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('❌ OpenAI embedding 생성 실패:', error);
    return [];
  }
}

/**
 * 두 벡터 간의 코사인 유사도 계산
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * 키워드 기반 유사도 계산 (Jaccard 유사도)
 */
export function calculateKeywordSimilarity(keywords1: string[], keywords2: string[]): number {
  if (keywords1.length === 0 && keywords2.length === 0) {
    return 1; // 둘 다 빈 배열이면 완전히 같음
  }
  
  if (keywords1.length === 0 || keywords2.length === 0) {
    return 0; // 하나가 빈 배열이면 완전히 다름
  }

  // 키워드를 소문자로 정규화
  const set1 = new Set(keywords1.map(k => k.toLowerCase().trim()));
  const set2 = new Set(keywords2.map(k => k.toLowerCase().trim()));

  // 교집합 계산
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  
  // 합집합 계산
  const union = new Set([...set1, ...set2]);
  
  // Jaccard 유사도 = |교집합| / |합집합|
  return intersection.size / union.size;
}

/**
 * 클러스터간 하이브리드 유사도 계산
 * @param cluster1 첫 번째 클러스터 (사용자가 선택한 클러스터)
 * @param cluster2 두 번째 클러스터 (다른 사용자의 클러스터)
 * @param weights 가중치 { description: 0.6, keywords: 0.3, mood: 0.1 }
 */
export async function calculateClusterSimilarity(
  cluster1: ImageData, 
  cluster2: ImageData,
  weights: { description: number; keywords: number; mood: number } = { description: 0.6, keywords: 0.3, mood: 0.1 }
): Promise<number> {
  try {
    // 1. Description embedding 유사도
    let descriptionSimilarity = 0;
    if (cluster1.description && cluster2.description) {
      const embedding1 = await getEmbedding(cluster1.description);
      const embedding2 = await getEmbedding(cluster2.description);
      descriptionSimilarity = calculateCosineSimilarity(embedding1, embedding2);
    }

    // 2. 키워드 유사도 (Jaccard)
    const keywordSimilarity = calculateKeywordSimilarity(
      cluster1.keywords || [], 
      cluster2.keywords || []
    );

    // 3. 무드 키워드 유사도 (개선된 버전)
    let moodSimilarity = 0;
    const mood1 = cluster1.mood_keyword?.toLowerCase().trim();
    const mood2 = cluster2.mood_keyword?.toLowerCase().trim();
    
    if (mood1 && mood2) {
      // 정확히 일치하는 경우
      if (mood1 === mood2) {
        moodSimilarity = 1;
      } 
      // 부분 일치하는 경우 (예: "재미있는" vs "재미")
      else if (mood1.includes(mood2) || mood2.includes(mood1)) {
        moodSimilarity = 0.7;
      }
      // 유사한 감정 키워드 매핑
      else {
        const emotionMap: Record<string, string[]> = {
          '재미': ['웃음', '유머', '즐거움', '재미있는'],
          '감동': ['따뜻함', '힐링', '감성적', '감동적'],
          '신남': ['활기', '에너지', '동적', '활발'],
          '평온': ['조용한', '차분한', '평화로운', '여유']
        };
        
        for (const [key, values] of Object.entries(emotionMap)) {
          if ((values.includes(mood1) || mood1.includes(key)) && 
              (values.includes(mood2) || mood2.includes(key))) {
            moodSimilarity = 0.5;
            break;
          }
        }
      }
    }

    // 가중 평균 계산
    const totalWeight = weights.description + weights.keywords + weights.mood;
    const normalizedWeights = {
      description: weights.description / totalWeight,
      keywords: weights.keywords / totalWeight,
      mood: weights.mood / totalWeight
    };

    const hybridSimilarity = 
      (descriptionSimilarity * normalizedWeights.description) +
      (keywordSimilarity * normalizedWeights.keywords) +
      (moodSimilarity * normalizedWeights.mood);

    // 무한 로그 방지: 높은 유사도인 경우만 로그 출력
    if (hybridSimilarity > 0.7) {
      console.log(`🔍 높은 클러스터 유사도 발견:`, {
        cluster1: cluster1.main_keyword,
        cluster2: cluster2.main_keyword,
        descriptionSimilarity: descriptionSimilarity.toFixed(3),
        keywordSimilarity: keywordSimilarity.toFixed(3),
        moodSimilarity: moodSimilarity.toFixed(3),
        hybridSimilarity: hybridSimilarity.toFixed(3),
        mood1: cluster1.mood_keyword || '없음',
        mood2: cluster2.mood_keyword || '없음'
      });
    }

    return Math.max(0, Math.min(1, hybridSimilarity)); // 0~1 범위로 정규화
  } catch (error) {
    console.error('Error calculating cluster similarity:', error);
    return 0;
  }
}

/**
 * 키워드 배열의 의미적 유사도 계산 (Embedding 사용)
 */
async function calculateSemanticKeywordSimilarity(keywords1: string[], keywords2: string[]): Promise<number> {
  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    // API 키가 없으면 기존 Jaccard 유사도 사용
    return calculateKeywordSimilarity(keywords1, keywords2);
  }

  if (keywords1.length === 0 || keywords2.length === 0) {
    return 0;
  }

  try {
    // 키워드들을 문장으로 합쳐서 embedding 생성
    const text1 = keywords1.join(', ');
    const text2 = keywords2.join(', ');
    
    const [embedding1, embedding2] = await Promise.all([
      getEmbedding(text1),
      getEmbedding(text2)
    ]);

    if (embedding1.length === 0 || embedding2.length === 0) {
      // Embedding 실패 시 기존 방식으로 fallback
      return calculateKeywordSimilarity(keywords1, keywords2);
    }

    return calculateCosineSimilarity(embedding1, embedding2);
  } catch (error) {
    console.warn('⚠️ Semantic similarity 계산 실패, Jaccard로 fallback:', error);
    return calculateKeywordSimilarity(keywords1, keywords2);
  }
}

/**
 * 캐시된 사용자 유사도 저장소
 */
const userSimilarityCache = new Map<string, number>();

/**
 * 캐시 키 생성 (작은 ID가 앞에 오도록 정렬)
 */
function createSimilarityCacheKey(userId1: string, userId2: string): string {
  return userId1 < userId2 ? `${userId1}-${userId2}` : `${userId2}-${userId1}`;
}

/**
 * 사용자간 유사도 계산 (최적화된 버전 - 캐시 + 간소화)
 * @param user1Profile 첫 번째 사용자의 전체 프로필 정보
 * @param user2Profile 두 번째 사용자의 전체 프로필 정보
 */
export async function calculateUserSimilarity(
  user1Profile: { user: UserData; profile: ProfileData; images: ImageData[] },
  user2Profile: { user: UserData; profile: ProfileData; images: ImageData[] }
): Promise<number> {
  try {
    const user1Id = user1Profile.user?.id || '';
    const user2Id = user2Profile.user?.id || '';
    
    // 캐시에서 확인
    const cacheKey = createSimilarityCacheKey(user1Id, user2Id);
    if (userSimilarityCache.has(cacheKey)) {
      const cachedSimilarity = userSimilarityCache.get(cacheKey)!;
      console.log(`🎯 캐시된 유사도 사용: ${user1Profile.profile?.nickname} ↔ ${user2Profile.profile?.nickname} = ${(cachedSimilarity * 100).toFixed(1)}%`);
      return cachedSimilarity;
    }

    console.log(`🎯 새로운 사용자간 유사도 계산:`, {
      user1: user1Profile.profile?.nickname || 'Unknown',
      user2: user2Profile.profile?.nickname || 'Unknown',
      embedding_사용: process.env.NEXT_PUBLIC_OPENAI_API_KEY ? 'YES' : 'NO (Jaccard 사용)'
    });

    // 1. 메인 키워드 의미적 유사도 (가중치: 70%) - 가장 중요
    const mainKeywords1 = user1Profile.images.map(img => img.main_keyword).filter(Boolean);
    const mainKeywords2 = user2Profile.images.map(img => img.main_keyword).filter(Boolean);
    const mainKeywordSimilarity = await calculateSemanticKeywordSimilarity(mainKeywords1, mainKeywords2);

    // 2. 전체 키워드 의미적 유사도 (가중치: 20%)
    const allKeywords1 = user1Profile.images.flatMap(img => img.keywords || []);
    const allKeywords2 = user2Profile.images.flatMap(img => img.keywords || []);
    const keywordSimilarity = await calculateSemanticKeywordSimilarity(allKeywords1, allKeywords2);

    // 3. 카테고리 유사도 (가중치: 10%) - 기존 Jaccard 방식 유지
    const categories1 = user1Profile.images.map(img => img.category).filter(Boolean);
    const categories2 = user2Profile.images.map(img => img.category).filter(Boolean);
    const categorySimilarity = calculateKeywordSimilarity(categories1, categories2);

    // 가중 평균 계산
    const finalSimilarity = 
      (mainKeywordSimilarity * 0.6) +
      (keywordSimilarity * 0.3) +
      (categorySimilarity * 0.1);

    // 캐시에 저장
    userSimilarityCache.set(cacheKey, finalSimilarity);

    console.log(`✅ 새로운 사용자간 유사도 완료:`, {
      user1: user1Profile.profile?.nickname || 'Unknown',
      user2: user2Profile.profile?.nickname || 'Unknown',
      최종_유사도: `${(finalSimilarity * 100).toFixed(1)}%`,
      캐시저장: '완료'
    });

    return Math.max(0, Math.min(1, finalSimilarity)); // 0~1 범위로 정규화
  } catch (error) {
    console.error('Error calculating user similarity:', error);
    return 0;
  }
}

/**
 * 검색 결과에 유사도 점수 추가
 */
export async function addSimilarityScores(
  selectedCluster: ImageData,
  searchResults: ImageData[]
): Promise<ImageData[]> {
  const resultsWithSimilarity = [];

  for (const result of searchResults) {
    const similarity = await calculateClusterSimilarity(selectedCluster, result);
    resultsWithSimilarity.push({
      ...result,
      similarity: similarity
    });
  }

  // 유사도 순으로 정렬 (높은 순)
  return resultsWithSimilarity.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
}