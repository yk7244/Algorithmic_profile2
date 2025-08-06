import { useRouter } from 'next/navigation';
import { saveSliderHistory } from '../../utils/save/saveSliderHistory';
import { saveProfileImages } from '../../utils/save/saveImageData';

export const useAddAsInterest = (setShowDetails: (show: boolean) => void) => {
    const router = useRouter();

    // 화면 중심 위주로 랜덤 위치 생성 함수
    const generateRandomCenterPosition = () => {
        // 화면 크기 추정 (일반적인 데스크톱 크기)
        const screenWidth = 1200;
        const screenHeight = 800;
        
        // 중심점 계산
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        
        // 중심에서 ±200px 범위에서 랜덤 생성
        const randomOffsetX = (Math.random() - 0.5) * 400; // -200 ~ +200
        const randomOffsetY = (Math.random() - 0.5) * 400; // -200 ~ +200
        
        // 최종 위치 계산 (화면 경계 체크)
        const x = Math.max(50, Math.min(screenWidth - 150, centerX + randomOffsetX));
        const y = Math.max(50, Math.min(screenHeight - 150, centerY + randomOffsetY));
        
        return { x: Math.round(x), y: Math.round(y) };
    };

    const handleAddAsInterest = async (image: any, ownerId?: string) => {
        if (!ownerId) {
            console.error("Owner ID is not available. Cannot add as interest.");
            alert("오류: 프로필 소유자 정보를 찾을 수 없습니다.");
            return;
        }

        console.log("Adding as interest:", image, "from owner:", ownerId);

        // 🔧 DB와 localStorage 모두에서 기존 이미지들 가져오기
        const { getActiveUserImages } = await import('@/lib/database-clean');
        const { supabase } = await import('@/lib/supabase-clean');
        
        let imageList: any[] = [];
        
        try {
            // 1. 현재 사용자 확인
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error("사용자 인증 정보를 찾을 수 없습니다.");
                alert("오류: 사용자 인증 정보를 찾을 수 없습니다.");
                return;
            }

            // 2. DB에서 기존 이미지들 가져오기
            console.log('🔍 DB에서 기존 이미지들 조회 중...');
            const dbImages = await getActiveUserImages(user.id);
            console.log(`📊 DB에서 가져온 이미지 개수: ${dbImages.length}개`);
            
            // 3. DB 이미지를 ImageData 형식으로 변환
            const convertedDbImages = dbImages.map(dbImg => ({
                id: dbImg.id,
                main_keyword: dbImg.main_keyword,
                keywords: dbImg.keywords,
                mood_keyword: dbImg.mood_keyword,
                description: dbImg.description,
                category: dbImg.category,
                src: dbImg.image_url,
                image_url: dbImg.image_url,
                width: dbImg.width,
                height: dbImg.height,
                sizeWeight: dbImg.size_weight,
                position: { x: dbImg.position_x, y: dbImg.position_y },
                rotate: dbImg.rotate,
                left: dbImg.css_left,
                top: dbImg.css_top,
                frameStyle: dbImg.frame_style,
                relatedVideos: dbImg.related_videos,
                desired_self: dbImg.desired_self,
                desired_self_profile: dbImg.desired_self_profile,
                metadata: dbImg.metadata,
                similarity: dbImg.similarity,
                user_id: dbImg.user_id,
                created_at: dbImg.created_at
            }));

            // 4. localStorage에서 추가된 desired_self 이미지들도 가져오기
            const profileImagesRaw = localStorage.getItem('profileImages');
            let localStorageImages: any[] = [];
            if (profileImagesRaw) {
                const parsed = JSON.parse(profileImagesRaw);
                if (Array.isArray(parsed)) {
                    localStorageImages = parsed;
                } else if (typeof parsed === 'object' && parsed !== null) {
                    localStorageImages = Object.values(parsed);
                }
            }

            // 5. localStorage의 desired_self 이미지들 중 DB에 없는 것들만 추가
            const dbImageIds = new Set(convertedDbImages.map(img => img.id));
            const uniqueLocalImages = localStorageImages.filter(img => 
                img.desired_self && !dbImageIds.has(img.id)
            );

            // 6. DB 이미지 + localStorage의 unique desired_self 이미지 병합
            imageList = [...convertedDbImages, ...uniqueLocalImages];
            
            console.log(`✅ 전체 이미지 병합 완료: DB ${convertedDbImages.length}개 + localStorage ${uniqueLocalImages.length}개 = 총 ${imageList.length}개`);

        } catch (error) {
            console.error('❌ 기존 이미지 조회 중 오류:', error);
            
            // 오류 발생 시 localStorage만 사용 (fallback)
            const profileImagesRaw = localStorage.getItem('profileImages');
            let profileImages = profileImagesRaw ? JSON.parse(profileImagesRaw) : [];
            
            if (Array.isArray(profileImages)) {
                imageList = profileImages;
            } else if (typeof profileImages === 'object' && profileImages !== null) {
                imageList = Object.values(profileImages);
            }
            console.log(`⚠️ fallback: localStorage에서 ${imageList.length}개 이미지 로드`);
        }

        // 랜덤 위치 생성
        const randomPosition = generateRandomCenterPosition();

        const newInterestImage = {
            ...image,
            id: `desired_${image.id}_${Date.now()}`,
            desired_self: true,
            desired_self_profile: ownerId,
            frameStyle: 'cokie',
            left: `${randomPosition.x}px`,
            top: `${randomPosition.y}px`,
            position: { x: randomPosition.x, y: randomPosition.y },
            sizeWeight: 0.2,
            rotate: 0,
            user_id: '',
            created_at: new Date().toISOString(),
            metadata: image.metadata || {}
        };
        
        // 현재 desired_self가 true인 이미지 개수 확인
        const currentDesiredSelfCount = imageList.filter(img => img.desired_self === true).length;
        
        if (currentDesiredSelfCount >= 3) {
            alert('관심사는 최대 3개까지만 추가할 수 있습니다. 기존 관심사를 삭제한 후 다시 시도해주세요.');
            return; // 3개 제한
        }
        
        // 이미 추가된 관심사인지 확인 (원본 이미지 src와 프로필 주인을 기준)
        const isAlreadyAdded = imageList.some(
            img => img.desired_self && img.src === newInterestImage.src && img.desired_self_profile === ownerId
        );

        if (isAlreadyAdded) {
            alert('이미 선택하신 관심사예요.');
            return; // 중복 추가 방지
        }

        // 항상 push를 사용하여 새 관심사를 배열에 추가합니다.
        imageList.push(newInterestImage);   //✅ 이미지 추가 후 저장
        
        // 🔄 DB 저장 완료를 기다린 후 슬라이더 히스토리 저장
        try {
            console.log('💾 이미지 DB 저장 시작...');
            const saveSuccess = await saveProfileImages(imageList);
            
            if (saveSuccess) {
                console.log('✅ 이미지 DB 저장 완료, 슬라이더 히스토리 저장 시작...');
                
                // ⏰ DB 반영을 위한 짧은 대기 (1초)
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // 슬라이더 히스토리에도 기록 추가
                const sliderResult = await saveSliderHistory('self'); // 관심사 추가 시 'self' 타입으로 저장
                if (sliderResult.success) {
                    console.log('✅ 슬라이더 히스토리에 새로운 관심사 기록 추가됨 (desired_self 포함)');
                } else {
                    console.error('❌ 슬라이더 히스토리 저장 실패:', sliderResult.error);
                }
            } else {
                console.error('❌ 이미지 DB 저장 실패로 슬라이더 히스토리 저장 생략');
            }
        } catch (error) {
            console.error('❌ 이미지 저장 또는 슬라이더 히스토리 저장 중 오류:', error);
        }
        
        console.log('✅ 새로운 관심사 이미지 추가됨:', newInterestImage);
        alert('새로운 관심사가 내 프로필에 추가되었습니다.');
        setShowDetails(false);
        router.push('/my_profile');
    };

    return { handleAddAsInterest };
}; 

