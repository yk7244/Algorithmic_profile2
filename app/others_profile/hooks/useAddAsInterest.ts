import { useRouter } from 'next/navigation';
import { saveSliderHistory } from '../../utils/saveSliderHistory';
import { getCurrentUserId, updateClusterImages, getClusterImages } from '@/lib/database';

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

        try {
            // 🆕 현재 사용자 ID 가져오기
            const currentUserId = await getCurrentUserId();
            if (!currentUserId) {
                alert("로그인이 필요합니다.");
                return;
            }

            // 🆕 사용자별 localStorage 키 사용
            const storageKey = `profileImages_${currentUserId}`;
            const profileImagesRaw = localStorage.getItem(storageKey);
            let profileImages = profileImagesRaw ? JSON.parse(profileImagesRaw) : [];

            // 데이터를 항상 배열 형태로 일관성 있게 처리합니다.
            let imageList: any[] = [];
            if (Array.isArray(profileImages)) {
                imageList = profileImages;
            } else if (typeof profileImages === 'object' && profileImages !== null) {
                // 데이터가 객체 형태일 경우, 배열로 변환하여 기존 데이터를 보존합니다.
                imageList = Object.values(profileImages);
            }

            // 랜덤 위치 생성
            const randomPosition = generateRandomCenterPosition();

            const newInterestImage = {
                ...image,
                id: `desired_${image.id}_${Date.now()}`,
                user_id: currentUserId, // 🆕 현재 사용자 ID 설정
                desired_self: true,
                desired_self_profile: ownerId,
                frameStyle: 'cokie',
                left: `${randomPosition.x}px`,
                top: `${randomPosition.y}px`,
                position: { x: randomPosition.x, y: randomPosition.y },
                sizeWeight: 0.7,
                rotate: 0,
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
                alert('이미 내 프로필에 추가된 관심사입니다.');
                return; // 중복 추가 방지
            }

            // 새 관심사를 배열에 추가
            imageList.push(newInterestImage);
            
            // 🆕 사용자별 localStorage에 저장
            localStorage.setItem(storageKey, JSON.stringify(imageList));
            
            // 🆕 DB에도 저장 (cluster_images 테이블 업데이트)
            try {
                await updateClusterImages(currentUserId, imageList);
                console.log('✅ DB에 새로운 관심사 저장 완료');
            } catch (dbError) {
                console.error('❌ DB 저장 실패:', dbError);
                // DB 저장 실패해도 localStorage는 유지
            }
            
            // 슬라이더 히스토리에도 기록 추가
            try {
                const sliderResult = await saveSliderHistory(imageList);
                if (sliderResult.success) {
                    console.log('✅ 슬라이더 히스토리에 새로운 관심사 기록 추가됨');
                } else {
                    console.error('❌ 슬라이더 히스토리 저장 실패:', sliderResult.error);
                }
            } catch (sliderError) {
                console.error('❌ 슬라이더 히스토리 저장 중 오류:', sliderError);
            }
            
            console.log('✅ 새로운 관심사 이미지 추가됨:', newInterestImage);
            alert('새로운 관심사가 내 프로필에 추가되었습니다.');
            setShowDetails(false);
            router.push('/my_profile');
            
        } catch (error) {
            console.error('❌ 관심사 추가 중 오류:', error);
            alert('관심사 추가 중 오류가 발생했습니다.');
        }
    };

    return { handleAddAsInterest };
}; 

