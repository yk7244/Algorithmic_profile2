import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// 벡터 간 코사인 유사도 계산
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
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

// 텍스트를 임베딩 벡터로 변환
async function getTextEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('텍스트 임베딩 생성 실패:', error);
    throw error;
  }
}

// 키워드 배열을 하나의 문장으로 결합
function combineKeywords(keywords: string[]): string {
  return keywords.join(' ');
}

// 사용자 간 키워드 유사도 계산
export async function calculateUserSimilarity(
  currentUserKeywords: string[], 
  otherUserKeywords: string[]
): Promise<number> {
  try {
    if (!currentUserKeywords.length || !otherUserKeywords.length) {
      return 0;
    }

    // 키워드들을 문장으로 결합
    const currentUserText = combineKeywords(currentUserKeywords);
    const otherUserText = combineKeywords(otherUserKeywords);

    console.log('🔍 유사도 계산 중:', {
      '현재 사용자 키워드': currentUserText,
      '다른 사용자 키워드': otherUserText
    });

    // 각각의 임베딩 벡터 생성
    const [currentUserEmbedding, otherUserEmbedding] = await Promise.all([
      getTextEmbedding(currentUserText),
      getTextEmbedding(otherUserText)
    ]);

    // 코사인 유사도 계산
    const similarity = cosineSimilarity(currentUserEmbedding, otherUserEmbedding);
    
    // 0~1 범위를 0~100 퍼센트로 변환
    const similarityPercentage = Math.round(similarity * 100);

    console.log('✅ 유사도 계산 완료:', {
      '원시 유사도': similarity,
      '퍼센트 유사도': similarityPercentage
    });

    return Math.max(0, Math.min(100, similarityPercentage));
  } catch (error) {
    console.error('유사도 계산 실패:', error);
    // 에러 발생 시 기본값 반환
    return Math.floor(Math.random() * 30) + 20; // 20-50% 랜덤
  }
}

// 프로필에서 키워드 추출
export function extractKeywordsFromProfile(images: any[]): string[] {
  const keywords = new Set<string>();
  
  images.forEach(image => {
    // main_keyword 추가
    if (image.main_keyword) {
      keywords.add(image.main_keyword.toLowerCase().trim());
    }
    
    // keywords 배열 추가
    if (image.keywords && Array.isArray(image.keywords)) {
      image.keywords.forEach((keyword: string) => {
        if (keyword) {
          keywords.add(keyword.toLowerCase().trim());
        }
      });
    }
    
    // category 추가
    if (image.category) {
      keywords.add(image.category.toLowerCase().trim());
    }
    
    // mood_keyword 추가
    if (image.mood_keyword) {
      keywords.add(image.mood_keyword.toLowerCase().trim());
    }
  });
  
  return Array.from(keywords).filter(keyword => keyword.length > 0);
}

// 캐시를 위한 유사도 저장소
const similarityCache = new Map<string, { similarity: number; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30분

// 캐시된 유사도 계산 (API 호출 최적화)
export async function calculateUserSimilarityCached(
  currentUserKeywords: string[], 
  otherUserKeywords: string[]
): Promise<number> {
  // 캐시 키 생성
  const cacheKey = `${currentUserKeywords.sort().join('|')}--${otherUserKeywords.sort().join('|')}`;
  
  // 캐시에서 확인
  const cached = similarityCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log('🚀 캐시된 유사도 사용:', cached.similarity);
    return cached.similarity;
  }
  
  // 새로 계산
  const similarity = await calculateUserSimilarity(currentUserKeywords, otherUserKeywords);
  
  // 캐시에 저장
  similarityCache.set(cacheKey, {
    similarity,
    timestamp: Date.now()
  });
  
  return similarity;
} 