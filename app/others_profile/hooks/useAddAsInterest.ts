import { useRouter } from 'next/navigation';
import { saveSliderHistory } from '../../utils/saveSliderHistory';

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

    const handleAddAsInterest = (image: any, ownerId?: string) => {
        if (!ownerId) {
            console.error("Owner ID is not available. Cannot add as interest.");
            alert("오류: 프로필 소유자 정보를 찾을 수 없습니다.");
            return;
        }

        console.log("Adding as interest:", image, "from owner:", ownerId);

        const profileImagesRaw = localStorage.getItem('profileImages');
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
            desired_self: true,
            desired_self_profile: ownerId,
            frameStyle: 'cokie',
            left: `${randomPosition.x}px`,
            top: `${randomPosition.y}px`,
            position: { x: randomPosition.x, y: randomPosition.y },
            sizeWeight: 0.7,
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
            alert('이미 내 프로필에 추가된 관심사입니다.');
            return; // 중복 추가 방지
        }

        // 항상 push를 사용하여 새 관심사를 배열에 추가합니다.
        imageList.push(newInterestImage);
        localStorage.setItem('profileImages', JSON.stringify(imageList));
        
        // 슬라이더 히스토리에도 기록 추가
        const sliderResult = saveSliderHistory(imageList);
        if (sliderResult.success) {
            console.log('✅ 슬라이더 히스토리에 새로운 관심사 기록 추가됨');
        } else {
            console.error('❌ 슬라이더 히스토리 저장 실패:', sliderResult.error);
        }
        
        console.log('✅ 새로운 관심사 이미지 추가됨:', newInterestImage);
        alert('새로운 관심사가 내 프로필에 추가되었습니다.');
        setShowDetails(false);
        router.push('/my_profile');
    };

    return { handleAddAsInterest };
}; 

