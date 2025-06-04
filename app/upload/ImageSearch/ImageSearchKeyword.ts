import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// 클러스터 키워드 번역 및 조합 유틸

// 시도1. OpenAI로 번역 함수
export async function translateToEnglish(text: string): Promise<string> {
  const prompt = `Translate the following Korean text to natural English (just the translation, no explanation):\n\n"${text}"`;
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });
  return completion.choices[0].message.content?.trim() || text;
}

function cleanKeyword(str: string) {
  // 앞뒤 공백, 큰따옴표, 대괄호 등 제거
  return str.replace(/["'\[\]]/g, '').trim();
}

//시도3.  시청목적을 고려한 형용사 키워드 추가
export async function extractBestMoodKeyword(cluster: {
    main_keyword: string;
    category?: string;
    mood_keyword?: string;
    description?: string;
  }): Promise<string> {
    // description만 후보로 사용
    const prompt = `
    1. Extract a single English keyword or phrase that is best representing the vibe of the cluster regarding purpose description.
    2. must be different word from main_keyword. 
    3. no explanation.
    4. adjective only

    \nContext: ${cluster.description || '[No description]'}
    `;
  
    // GPT 호출
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });
    return completion.choices[0].message.content || '';
}

//시도 4-1 시청 목적을 고려한 이미지 분위기 키워드 추출 함수(이미지 검색 & 선택 기준을 명확히)


// (2) 키워드 조합 함수 
export async function buildImageSearchKeyword(cluster: {
  main_keyword: string;
  category?: string;
  mood_keyword?: string;
  keyword_list?: string;
  description?: string;
}) {
  // 1. 각 키워드 번역 (대표 1개만)
  let main = await translateToEnglish(cluster.main_keyword);
  let categoryRaw = cluster.category ? cluster.category.split(/[ ,/|]+/)[0] : '';
  let category = categoryRaw ? await translateToEnglish(categoryRaw) : '';
  let moodRaw = cluster.mood_keyword ? cluster.mood_keyword.split(/[ ,/|]+/)[0] : '';
  let mood = moodRaw ? await translateToEnglish(moodRaw) : '';

  // subkeywordRaw를 배열로 분리
  const subkeywordCandidates = cluster.keyword_list
    ? cluster.keyword_list.split(/[ ,/|]+/).map(s => s.trim()).filter(Boolean)
    : [];

  // main_keyword와 겹치지 않는 첫 번째 subkeyword 찾기
  const subkeywordRaw = subkeywordCandidates.find(
    sub =>
      sub !== cluster.main_keyword &&
      !sub.includes(cluster.main_keyword) &&
      !cluster.main_keyword.includes(sub)
  ) || '';

  let subkeyword = subkeywordRaw ? await translateToEnglish(subkeywordRaw) : '';

  console.log(
    `[키워드 번역 결과] main: ${cluster.main_keyword}→${main} | category: ${categoryRaw}→${category} | mood: ${moodRaw}→${mood} | sub: ${subkeywordRaw}→${subkeyword}`
  );

  // 2. 특수문자 제거
  main = cleanKeyword(main);
  category = cleanKeyword(category);
  mood = cleanKeyword(mood);
  subkeyword = cleanKeyword(subkeyword);
  console.log('');


  //시도3-1. 감성 키워드 추출
  const Keyword2 = await extractBestMoodKeyword(cluster || '');
  console.log('[시도3. 시청목적을 고려한 형용사 추출]', Keyword2);
   //시도4. 전체 무드 키워드-> 색상과 이미지 스타일을 언급해봄
  const Keyword3 = 'blue OR illustration';
  //console.log('[시도4. 이미지 검색 & 선택 기준 추출]', Keyword3);

  // 4. 조합 (대표 1개씩만)
  const combined1 = [main, 'OR',category, 'OR', mood, 'OR', subkeyword].filter(Boolean).join(' ');
  const combined2 = [main, 'OR',Keyword2].filter(Boolean).join(' ');
  const combined3 = [main, ,'OR', Keyword2,'OR',Keyword3].filter(Boolean).join(' ');
  const combined4 = [subkeyword,'OR', Keyword2,'OR',Keyword3].filter(Boolean).join(' ');

  // 5. 최종 조합 결과 콘솔 출력
  console.log('[최종 조합 키워드]', combined4);

  return combined4;
} 

