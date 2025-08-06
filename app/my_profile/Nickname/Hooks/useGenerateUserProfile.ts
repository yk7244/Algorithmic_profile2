import { Dispatch, SetStateAction } from "react";
import { generateProfileId } from "../Hooks/useProfileStorage";
import { ProfileData } from '../../../types/profile';
import { saveProfileData } from "../../../utils/save/saveProfileData";
import { getActiveUserImages, convertDBImagesToLocalStorage, saveActiveUserImages } from '@/lib/database-clean';
import { supabase } from '@/lib/supabase-clean';

interface UseGenerateUserProfileParams {
    openai: any;
    setShowGeneratingDialog: Dispatch<SetStateAction<boolean>>;
    setGeneratingStep: Dispatch<SetStateAction<number>>;
    setProfile: Dispatch<SetStateAction<{ nickname: string; description: string }>>;
}

export function useGenerateUserProfile({
    openai,
    setShowGeneratingDialog,
    setGeneratingStep,
    setProfile,
    }: UseGenerateUserProfileParams) {
    
    // localStorage 프로필 관리 훅 사용
    

    const generateProfile = async () => {
        try {
            console.log('🎯 별명 생성 시작!');
            
            // 바로 dialog 상태로 변경해서 중복 실행 방지
        setShowGeneratingDialog(true);
            setGeneratingStep(0);
            
        // 각 단계별로 딜레이를 주며 진행
        for (let i = 0; i < 4; i++) {
            setGeneratingStep(i);
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
            
        // 현재 로그인한 사용자 ID 가져오기
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('사용자 인증 정보를 찾을 수 없습니다.');
            return;
        }

        // DB에서 사용자의 활성 이미지 데이터 가져오기 (localStorage 대체)
        let dbImages = await getActiveUserImages(user.id);
        console.log('DB에서 가져온 이미지 데이터:', dbImages);
            
        // DB에 데이터가 없으면 localStorage 확인 후 자동 마이그레이션
        if (!dbImages || dbImages.length === 0) {
            const profileImagesData = localStorage.getItem('profileImages');
            if (profileImagesData) {
                console.log('localStorage에서 기존 데이터 발견, 자동 마이그레이션 수행');
                try {
                    const localImages = JSON.parse(profileImagesData);
                    if (Array.isArray(localImages) && localImages.length > 0) {
                        const success = await saveActiveUserImages(user.id, localImages);
                        if (success) {
                            console.log('자동 마이그레이션 완료');
                            dbImages = await getActiveUserImages(user.id); // 마이그레이션된 데이터 다시 가져오기
                        }
                    }
                } catch (error) {
                    console.error('자동 마이그레이션 중 오류:', error);
                }
            }
        }
            
        // 여전히 데이터가 없으면 기본 프로필 생성
        if (!dbImages || dbImages.length === 0) {
            const defaultProfile = {
            nickname: '알고리즘 탐험가',
            description: '프로필을 생성하려면 업로드를 진행해주세요.'
            };
            setProfile(defaultProfile);
                
                // 기본 프로필도 저장
                const { data: { user: currentUser } } = await supabase.auth.getUser();
                const profileData: ProfileData = {
                    id: generateProfileId(),
                    user_id: currentUser?.id || 'unknown',
                    nickname: defaultProfile.nickname,
                    description: defaultProfile.description,
                    created_at: new Date().toISOString(),
                };
                await saveProfileData(profileData);
            return;
        }

        // DB 이미지를 localStorage 형식으로 변환하여 기존 로직과 호환
        const profileImages = convertDBImagesToLocalStorage(dbImages);
        // 프롬프트 생성을 위한 데이터 가공
        const imageData = Object.values(profileImages).map((image: any) => ({
            main_keyword: image.main_keyword,
            category: image.category,
            description: image.description,
            mood_keyword: image.mood_keyword,
            keywords: image.keywords
        }));

        const prompt = `
    당신은 사용자의 관심사와 성향을 분석하여 그들의 성격과 취향을 파악하는 전문가입니다.
    다음은 사용자의 관심사와 성향을 분석한 정보입니다:

    ${imageData.map((image: any, index: number) => `
    이미지 ${index + 1}:
    - 주요 키워드: ${image.main_keyword || '정보 없음'}
    - 카테고리: ${image.category || '미분류'}
    - 설명: ${image.description || '정보 없음'}
    - 감성 키워드: ${image.mood_keyword || '정보 없음'}
    - 관련 키워드: ${image.keywords?.join(', ') || '정보 없음'}
    `).join('\n')}

    위 정보를 바탕으로 다음 두 가지를 한국어로 생성해주세요:

    1. 사용자의 대표 관심사를 종합하여 봤을때, 여러가지를 혼합하여 새로운 키워드로 취향과 성격을 반영한 독특하고 창의적인 짧은 명사 별명 (예: "감성적인 여행자", "호기심 많은 지식탐험가" 등)
    2. 중요!!: 별명 생성시 재밌는 동물, 물건, 이름등으로 은유법이나 비유 명사를 무조건 활용해야함 ("예: 현아를 좋아하는 사과, 토끼)
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
            nickname: nicknameMatch ? nicknameMatch[1].trim() : '알고리즘 탐험가',
            description: descriptionMatch 
            ? descriptionMatch[1].trim() 
            : '당신만의 독특한 콘텐츠 취향을 가지고 있습니다. 메인 페이지에서 더 많은 관심사를 추가해보세요!'
        };
        console.log('새로운 프로필:', newProfile);
        setProfile(newProfile);
            
            // 새로운 프로필도 저장
            const { data: { user: authUser } } = await supabase.auth.getUser();
            const profileData: ProfileData = {
                id: generateProfileId(),
                user_id: authUser?.id || 'unknown',
                nickname: newProfile.nickname,
                description: newProfile.description,
                created_at: new Date().toISOString()
            };
            await saveProfileData(profileData); 
            
        } catch (error) {
        console.error('프로필 생성 오류:', error);
        setProfile({
            nickname: '알고리즘 탐험가',
            description: '프로필 생성 중 오류가 발생했습니다. 나중에 다시 시도해주세요.'
        });
        } finally {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setShowGeneratingDialog(false);
        setGeneratingStep(0);
        }
    };

    return { generateProfile };
} 